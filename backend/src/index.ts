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
  pageFunction: joi.string().required()
});

// Error handling middleware
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Error: ${err.message}`);
  res.status(500).json({ error: 'Internal Server Error' });
};

// Define interfaces
interface PageFunctionResult {
  url: string;
  pageTitle: string;
  [key: string]: any; // Allow for additional properties
}

interface CrawlerConfig {
  startUrls: string[];
  linkSelector: string;
  globPatterns?: string[];
  excludeGlobPatterns?: string[];
  urlFragments?: boolean;
  injectJQuery: boolean;
  pageFunction: string;
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
        // Add other necessary request properties
      };
    }
    
    return sanitized;
}

// Crawling logic
const performCrawl = async (config: CrawlerConfig) => {
    const { startUrls, linkSelector, globPatterns, excludeGlobPatterns, urlFragments, injectJQuery, pageFunction } = config;
  
    // Initialize MemoryStorage with options
    const memoryStorage = new MemoryStorage({
        persistStorage: false, // Don't persist to disk
        writeMetadata: false, // Don't write metadata files
    });

    // Configure Crawlee to use MemoryStorage
    const crawleeConfig = new Configuration({
        storageClient: memoryStorage,
    });
    Configuration.useStorageClient(memoryStorage);

    // Create a new Dataset instance
    const dataset = await Dataset.open(null);

    const crawler = new PuppeteerCrawler({
        maxConcurrency: parseInt(process.env.MAX_CONCURRENT_REQUESTS || '10'),
        requestHandlerTimeoutSecs: parseInt(process.env.REQUEST_TIMEOUT || '30000') / 1000,
        maxRequestsPerCrawl: parseInt(process.env.MAX_CRAWL_DEPTH || '5') * startUrls.length,
        useSessionPool: false, // Disable session pool
        requestHandler: async (crawlingContext: PuppeteerCrawlingContext) => {
            const { request, enqueueLinks, log, page } = crawlingContext;
            log.info(`Crawling: ${request.url}`);
    
            if (injectJQuery) {
                log.info('Injecting jQuery');
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
                    log.info('jQuery injected successfully');
                } catch (error) {
                    log.error('Failed to inject jQuery:', { error: error instanceof Error ? error.message : String(error) });
                }
            } else {
                log.info('jQuery injection is disabled');
            }

            const customContext: CustomContext = {
                ...crawlingContext,
                jQuery: injectJQuery ? 'window.jQuery' : undefined
            };
    
            const sanitizedContext = sanitizeContext(customContext);
    
            const sanitizedPageFunction = sanitize(`
                async function pageFunction(context) {
                    let pageTitle;
                    if (context.jQuery) {
                        const $ = context.jQuery;
                        pageTitle = $('title').first().text();
                    } else {
                        pageTitle = document.title;
                    }

                    context.log.info(\`URL: \${context.request.url}, TITLE: \${pageTitle}\`);

                    return {
                        url: context.request.url,
                        pageTitle,
                    };
                }
            `);
        
            log.info('Sanitized page function:', { pageFunction: sanitizedPageFunction });
            log.info('Sanitized context:', { context: JSON.parse(JSON.stringify(sanitizedContext)) });

            try {
                log.info('Executing page function');
                const result = await page.evaluate((pageFunc: string, ctx: any) => {
                    console.log('Page function execution started');
                    const contextWithLog = {
                        ...ctx,
                        log: {
                            info: (...args: any[]) => console.log('INFO:', ...args),
                            error: (...args: any[]) => console.error('ERROR:', ...args),
                        }
                    };
                    console.log('Context prepared:', JSON.stringify(contextWithLog, null, 2));
                    const func = new Function('context', `
                        ${pageFunc}
                        return pageFunction(context);
                    `);
                    console.log('Function created');
                    const result = func(contextWithLog);
                    console.log('Function executed, result:', result);
                    return result;
                }, sanitizedPageFunction, sanitizedContext);
          
                log.info('Page function execution result:', { result });

                if (typeof result === 'object' && result !== null && 'url' in result && 'pageTitle' in result) {
                    const typedResult = result as PageFunctionResult;
                    log.info('Valid result format, pushing to dataset');
                    await dataset.pushData(typedResult);
                } else {
                    log.error('Invalid result format from page function');
                }
            } catch (error) {
                log.error(`Error executing page function: ${error instanceof Error ? error.message : String(error)}`);
                if (error instanceof Error && error.stack) {
                    log.error(`Error stack: ${error.stack}`);
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
                log.info(`Pre-navigation hook for ${request.url}`);
                if (!urlFragments) {
                    const url = new URL(request.url);
                    url.hash = '';
                    request.url = url.toString();
                    log.info(`URL after removing hash: ${request.url}`);
                }
            },
        ],
    });
  
    try {
        logger.info('Adding initial requests:', startUrls);
        await crawler.addRequests(startUrls);
        logger.info('Starting crawler run');
        await crawler.run();
        logger.info('Crawl completed successfully');
        const results = await dataset.getData();
        logger.info(`Retrieved ${results.items.length} results from dataset`);
        return results.items;
    } catch (error) {
        logger.error('Crawler run failed:', error);
        throw error;
    } finally {
        // Clean up resources
        await dataset.drop();
        Configuration.resetGlobalState(); // Reset the global configuration
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

    const results = await performCrawl(value as CrawlerConfig);
    res.status(200).json(results);
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