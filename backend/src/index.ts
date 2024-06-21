import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { PuppeteerCrawler } from 'crawlee';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import path from 'path';
import dotenv from 'dotenv';
import joi from 'joi';
import rateLimit from 'express-rate-limit';
import { createLogger, format, transports } from 'winston';
import { sanitize } from 'isomorphic-dompurify';

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
  injectJQuery: joi.boolean(),
  pageFunction: joi.string().required()
});

// Error handling middleware
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Error: ${err.message}`);
  res.status(500).json({ error: 'Internal Server Error' });
};

// Define CrawlerConfig interface
interface CrawlerConfig {
  startUrls: string[];
  linkSelector: string;
  globPatterns?: string[];
  excludeGlobPatterns?: string[];
  urlFragments?: boolean;
  injectJQuery?: boolean;
  pageFunction: string;
}

// Crawling logic
const performCrawl = async (config: CrawlerConfig) => {
  const { startUrls, linkSelector, globPatterns, excludeGlobPatterns, urlFragments, injectJQuery, pageFunction } = config;

  const crawler = new PuppeteerCrawler({
    maxConcurrency: parseInt(process.env.MAX_CONCURRENT_REQUESTS || '10'),
    requestHandlerTimeoutSecs: parseInt(process.env.REQUEST_TIMEOUT || '30000') / 1000,
    maxRequestsPerCrawl: parseInt(process.env.MAX_CRAWL_DEPTH || '5') * startUrls.length,
    requestHandler: async ({ request, enqueueLinks, log, page }) => {
      log.info(`Crawling: ${request.url}`);
  
      if (injectJQuery) {
        const jQueryPath = path.resolve(__dirname, 'node_modules/jquery/dist/jquery.min.js');
        await page.addScriptTag({ path: jQueryPath });
      }
  
      const context = {
        request,
        enqueueLinks,
        log,
        jQuery: injectJQuery ? await page.evaluate(() => window.jQuery) : null
      };
  
      const sanitizedPageFunction = sanitize(pageFunction);
      const pageFunctionScript = `
        (function(context) {
          ${sanitizedPageFunction}
        })(arguments[0]);
      `;
  
      try {
        await page.evaluate(pageFunctionScript, context);
        await enqueueLinks({ 
          selector: linkSelector,
          globs: globPatterns,
          exclude: excludeGlobPatterns
        });
      } catch (error) {
        log.error(`Error executing page function: ${error}`);
      }
    },
    launchContext: {
      launchOptions: {
        headless: process.env.NODE_ENV === 'production',
      },
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
    logger.info('Crawl completed successfully');
  } catch (error) {
    logger.error('Crawler run failed:', error);
    // You might want to implement additional error handling here,
    // such as notifying an admin or updating a status in a database
  }
};

// Start crawl endpoint
app.post('/start-crawl', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error, value } = crawlSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    logger.info('Starting crawl with configuration:', value);

    // Perform crawl asynchronously
    performCrawl(value as CrawlerConfig).catch(error => {
      logger.error('Crawl failed:', error);
    });

    res.status(202).json({ message: 'Crawl started successfully' });
  } catch (error) {
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