import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import cors from 'cors';
import { PuppeteerCrawler, PuppeteerCrawlingContext, Dataset, Configuration, log } from 'crawlee';
import { MemoryStorage } from '@crawlee/memory-storage';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import dotenv from 'dotenv';
import joi from 'joi';
import rateLimit from 'express-rate-limit';
import { sanitize } from 'isomorphic-dompurify';
import { v4 as uuidv4 } from 'uuid';
import WebSocket from 'ws';
import { createLogger } from './logger';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const logger = createLogger(wss);

// Initialize Puppeteer with Stealth plugin
puppeteer.use(StealthPlugin());

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
});
app.use(limiter);

// Input validation schema
const crawlSchema = joi.object({
  startUrls: joi.array().items(joi.string().uri()).min(1).required(),
  linkSelector: joi.string().required(),
  fields: joi.object().pattern(
    joi.string(),
    joi.object({
      name: joi.string().required(),
      selector: joi.string().required()
    })
  ).required(),
  globPatterns: joi.array().items(joi.string()),
  excludeGlobPatterns: joi.array().items(joi.string()),
  urlFragments: joi.boolean(),
  pageFunction: joi.string().required(), 
  injectJQuery: joi.boolean().required(),
  headless: joi.boolean(),
  ignoreSSLErrors: joi.boolean(),
  ignoreCORSAndCSP: joi.boolean(),
  downloadMediaFiles: joi.boolean(),
  downloadCSSFiles: joi.boolean(),
  maxPageRetries: joi.number().integer().min(0),
  maxPagesPerRun: joi.number().integer().min(0),
  maxResultRecords: joi.number().integer().min(0),
  maxCrawlingDepth: joi.number().integer().min(0),
  maxConcurrency: joi.number().integer().min(1),
  pageLoadTimeout: joi.number().integer().min(1),
  pageFunctionTimeout: joi.number().integer().min(1)
});

// Error handling middleware
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Error: ${err.message}`);
  res.status(500).json({ error: 'Internal Server Error' });
};

// Define interfaces
interface Field {
  name: string;
  selector: string;
}

interface CrawlerConfig {
  startUrls: string[];
  linkSelector: string;
  fields: {
    [key: string]: Field;
  };
  globPatterns?: string[];
  excludeGlobPatterns?: string[];
  urlFragments?: boolean;
  injectJQuery: boolean;
  headless?: boolean;
  ignoreSSLErrors?: boolean;
  ignoreCORSAndCSP?: boolean;
  downloadMediaFiles?: boolean;
  downloadCSSFiles?: boolean;
  maxPageRetries?: number;
  maxPagesPerRun?: number;
  maxResultRecords?: number;
  maxCrawlingDepth?: number;
  maxConcurrency?: number;
  pageLoadTimeout?: number;
  pageFunctionTimeout?: number;
  pageFunction: string;
}

interface CustomContext extends PuppeteerCrawlingContext {
    jQuery?: any;
}

// Extend Window interface to include jQuery
declare global {
  interface Window {
    jQuery: any;
  }
}

function sanitizeContext(context: CustomContext): any {
    const sanitized: any = {};
    const allowedProperties = ['url', 'jQuery', 'log'];
    
    for (const prop of allowedProperties) {
      if (prop in context) {
        sanitized[prop] = context[prop as keyof CustomContext];
      }
    }
    
    if (context.request) {
      sanitized.request = {
        url: context.request.url,
        userData: context.request.userData,
      };
    }
    
    return sanitized;
}

// Crawling logic
const performCrawl = async (config: CrawlerConfig) => {
  const {
    startUrls,
    linkSelector,
    fields,
    pageFunction,
    globPatterns,
    excludeGlobPatterns,
    urlFragments,
    injectJQuery,
    headless,
    ignoreSSLErrors,
    ignoreCORSAndCSP,
    downloadMediaFiles,
    downloadCSSFiles,
    maxPageRetries,
    maxPagesPerRun,
    maxResultRecords,
    maxCrawlingDepth,
    maxConcurrency,
    pageLoadTimeout,
    pageFunctionTimeout
  } = config;

  const memoryStorage = new MemoryStorage({ persistStorage: false });
  const crawleeConfig = new Configuration({ storageClient: memoryStorage });
  Configuration.useStorageClient(memoryStorage);

  const datasetName = `crawl-${uuidv4()}`;
  const dataset = await Dataset.open(datasetName);

  const crawler = new PuppeteerCrawler({
    maxConcurrency: maxConcurrency || parseInt(process.env.MAX_CONCURRENT_REQUESTS || '10'),
    requestHandlerTimeoutSecs: (pageLoadTimeout || 180) + (pageFunctionTimeout || 180),
    navigationTimeoutSecs: pageLoadTimeout || 180,
    maxRequestsPerCrawl: maxPagesPerRun || parseInt(process.env.MAX_CRAWL_DEPTH || '5') * startUrls.length,
    maxRequestRetries: maxPageRetries,
    useSessionPool: false,
    headless: headless,
    launchContext: {
      launchOptions: {
        ignoreHTTPSErrors: ignoreSSLErrors,
        args: ignoreCORSAndCSP ? ['--disable-web-security'] : []
      }
    },
    requestHandler: async (crawlingContext) => {
      const { request, enqueueLinks, page, log } = crawlingContext;
      log.info(`Crawling: ${request.url}`);

      let jQueryAvailable = false;
      if (injectJQuery) {
        try {
          await page.evaluate(() => {
            return new Promise<void>((resolve, reject) => {
              const script = document.createElement('script');
              script.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
              script.onload = () => resolve();
              script.onerror = reject;
              document.head.appendChild(script);
            });
          });
          await page.waitForFunction(() => typeof window.jQuery === 'function');
          jQueryAvailable = true;
          log.info('jQuery injected successfully');
        } catch (error) {
          log.error('Failed to inject jQuery:', { error: error instanceof Error ? error.message : String(error) });
        }
      }

      try {
        const result = await page.evaluate(({ pageFunc, jQueryAvailable, fields }) => {
          const context = {
            url: window.location.href,
            jQuery: jQueryAvailable ? window.jQuery : undefined,
            log: {
              info: (message: string) => console.log('INFO:', message),
              error: (message: string) => console.error('ERROR:', message),
            },
            fields: fields,
          };

          // Create a function from the string
          const func = new Function('context', `return (${pageFunc})(context);`);
          return func(context);
        }, { pageFunc: pageFunction, jQueryAvailable, fields });

        log.info('Page function execution completed for URL:', { url: request.url });
        log.debug('Page function execution result:', { url: request.url, result });

        await dataset.pushData(result);
      } catch (error) {
        log.error(`Error executing page function for URL ${request.url}:`, { error: error instanceof Error ? error.message : String(error) });
        if (error instanceof Error && error.stack) {
          log.error(`Error stack for URL ${request.url}:`, { stack: error.stack });
        }
      }

      await enqueueLinks({ 
        selector: linkSelector,
        globs: globPatterns,
        exclude: excludeGlobPatterns
      });
    },
    preNavigationHooks: [
      async ({ request }) => {
        if (!urlFragments) {
          const url = new URL(request.url);
          url.hash = '';
          request.url = url.toString();
        }
      },
    ],
  });

  try {
    await crawler.addRequests(startUrls);
    await crawler.run();
    const results = await dataset.getData();
    log.info(`Crawl completed. Processed ${results.items.length} pages.`);
    return results.items;
  } catch (error) {
    log.error('Error during crawl:', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  } finally {
    await dataset.drop();
    Configuration.resetGlobalState();
  }
};

// Start crawl endpoint
app.post('/start-crawl', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error, value } = crawlSchema.validate(req.body);
    if (error) {
      logger.warn('Invalid crawl configuration received:', error.details);
      return res.status(400).json({ error: error.details[0].message });
    }

    logger.info('Starting crawl with configuration:', value);

    const results = await performCrawl(value as CrawlerConfig);
    logger.info(`Crawl completed. Returning ${results.length} results.`);
    res.status(200).json(results);
  } catch (error) {
    logger.error('Error during crawl:', error);
    next(error);
  }
});

// Apply error handling middleware
app.use(errorHandler);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK' });
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
});

export default app;