import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { PuppeteerCrawler, PuppeteerCrawlingContext, Dataset, Configuration } from 'crawlee';
import { MemoryStorage } from '@crawlee/memory-storage';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import dotenv from 'dotenv';
import joi from 'joi';
import rateLimit from 'express-rate-limit';
import { createLogger, format, transports } from 'winston';
import { sanitize } from 'isomorphic-dompurify';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

// Initialize logger
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'combined.log' })
  ]
});

// Declare global types
declare global {
  interface Window {
    jQuery: any;
  }
}

// Initialize Puppeteer with Stealth plugin
puppeteer.use(StealthPlugin());

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

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
  globPatterns: joi.array().items(joi.string()),
  excludeGlobPatterns: joi.array().items(joi.string()),
  urlFragments: joi.boolean(),
  injectJQuery: joi.boolean().required(),
  pageFunction: joi.string().required(),
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
interface CrawlResult {
  url: string;
  pageTitle: string;
  h1: string;
  first_h2: string;
  random_text_from_the_page: string;
  main_content: string;
}

interface CrawlerConfig {
  startUrls: string[];
  linkSelector: string;
  globPatterns?: string[];
  excludeGlobPatterns?: string[];
  urlFragments?: boolean;
  injectJQuery: boolean;
  pageFunction: string;
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
}

interface CustomContext extends PuppeteerCrawlingContext {
    jQuery?: any;
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
    globPatterns,
    excludeGlobPatterns,
    urlFragments,
    injectJQuery,
    pageFunction,
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
    requestHandlerTimeoutSecs: (pageLoadTimeout || 180),
    navigationTimeoutSecs: 120,
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
    requestHandler: async (crawlingContext: PuppeteerCrawlingContext) => {
      const { request, enqueueLinks, log, page } = crawlingContext;
      log.info(`Crawling: ${request.url}`);

      if (injectJQuery) {
        try {
          await page.evaluate(() => {
            return new Promise((resolve, reject) => {
              const script = document.createElement('script');
              script.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
              script.onload = resolve;
              script.onerror = reject;
              document.head.appendChild(script);
            });
          });
          await page.waitForFunction(() => typeof window.jQuery === 'function');
          log.info('jQuery injected successfully');
        } catch (error) {
          log.error('Failed to inject jQuery:', { error: error instanceof Error ? error.message : String(error) });
        }
      }

      const customContext: CustomContext = {
        ...crawlingContext,
        jQuery: injectJQuery ? 'window.jQuery' : undefined
      };

      const sanitizedPageFunction = sanitize(pageFunction);

      log.info('Starting page function execution for URL:', { url: request.url });
      try {
        const result = await page.evaluate((pageFunc: string, ctx: any, injectJQuery: boolean) => {
          const contextWithLog = {
            ...ctx,
            jQuery: injectJQuery ? window.jQuery : undefined,
            log: {
              info: (...args: any[]) => console.log('INFO:', ...args),
              error: (...args: any[]) => console.error('ERROR:', ...args),
            }
          };
          const func = new Function('context', `
            ${pageFunc}
            return pageFunction(context);
          `);
          return func(contextWithLog);
        }, sanitizedPageFunction, sanitizeContext(customContext), injectJQuery);

        log.info('Page function execution completed for URL:', { url: request.url });
        log.debug('Page function execution result:', { url: request.url, result });

        await dataset.pushData(result as CrawlResult);
      } catch (error) {
        log.error(`Error executing page function for URL ${request.url}: ${error instanceof Error ? error.message : String(error)}`);
        if (error instanceof Error && error.stack) {
          log.error(`Error stack for URL ${request.url}: ${error.stack}`);
        }
      }

      await enqueueLinks({ 
        selector: linkSelector,
        globs: globPatterns,
        exclude: excludeGlobPatterns
      });
    },
    preNavigationHooks: [
      async ({ request, log }) => {
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
    logger.info(`Crawl completed. Processed ${results.items.length} pages.`);
    return results.items as CrawlResult[];
  } catch (error) {
    logger.error('Error during crawl:', error);
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
const server = app.listen(PORT, () => {
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