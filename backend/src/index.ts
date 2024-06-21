import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { PuppeteerCrawler } from 'crawlee';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import path from 'path';

declare global {
    interface Window {
        jQuery: any;
    }
}

puppeteer.use(StealthPlugin());

const app = express();
const PORT = 3001;

app.use(bodyParser.json());
app.use(cors());

app.post('/start-crawl', async (req: Request, res: Response) => {
    const { startUrls, linkSelector, globPatterns, excludeGlobPatterns, urlFragments, injectJQuery, pageFunction } = req.body;

    if (!startUrls || !Array.isArray(startUrls) || startUrls.length === 0) {
        return res.status(400).send('Invalid start URLs');
    }

    if (!pageFunction) {
        return res.status(400).send('Page function is required');
    }

    console.log('Starting crawl with the following URLs:', startUrls);

    const crawler = new PuppeteerCrawler({
        requestHandler: async ({ request, enqueueLinks, log, page }) => {
            log.info(`Crawling: ${request.url}`);

            // Inject jQuery if required
            if (injectJQuery) {
                const jQueryPath = path.resolve(__dirname, 'node_modules/jquery/dist/jquery.min.js');
                await page.addScriptTag({ path: jQueryPath });
            }

            // Execute the custom page function
            const context = {
                request,
                enqueueLinks,
                log,
                jQuery: injectJQuery ? await page.evaluate(() => window.jQuery) : null
            };

            // Create a function from the pageFunction string
            const pageFunctionScript = `
                (function(context) {
                    ${pageFunction}
                })(arguments[0]);
            `;

            await page.evaluate(pageFunctionScript, context);

            await enqueueLinks({ selector: linkSelector });
        },
        launchContext: {
            launchOptions: {
                headless: true, // Set headless mode based on your requirement
            },
        },
        preNavigationHooks: [
            async ({ request }) => {
                if (!urlFragments) {
                    // Remove URL fragments if the flag is false
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
        res.status(200).send('Crawling completed successfully!');
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).send(`Crawling failed: ${error.message}`);
        } else {
            res.status(500).send('Crawling failed due to an unknown error.');
        }
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});