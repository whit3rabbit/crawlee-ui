import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { Box, Button, Group } from '@mantine/core';
import { startCrawl, crawlSuccess, crawlFailure } from '../store/crawlSlice';
import UrlInputs from './UrlInputs';
import CrawlSettings from './CrawlSettings';
import PageFunctionInput from './PageFunctionInput';

interface FormData {
  startUrls: string[];
  linkSelector: string;
  globPatterns: string;
  excludeGlobPatterns: string;
  urlFragments: boolean;
  injectJQuery: boolean;
  pageFunction: string;
  headless: boolean;
  ignoreSSLErrors: boolean;
  ignoreCORSAndCSP: boolean;
  downloadMediaFiles: boolean;
  downloadCSSFiles: boolean;
  maxPageRetries: number;
  maxPagesPerRun: number;
  maxResultRecords: number;
  maxCrawlingDepth: number;
  maxConcurrency: number;
  pageLoadTimeout: number;
  pageFunctionTimeout: number;
}

const ConfigurationForm: React.FC = () => {
  const dispatch = useDispatch();
  const methods = useForm<FormData>({
    defaultValues: {
      startUrls: ['https://crawlee.dev'],
      linkSelector: 'a[href]',
      globPatterns: 'https://crawlee.dev/*/*',
      excludeGlobPatterns: '/**/*.{png,jpg,jpeg,pdf}',
      urlFragments: false,
      injectJQuery: true,
      pageFunction: `// The function accepts a single argument: the "context" object.
async function pageFunction(context) {
    let pageTitle, h1, first_h2, random_text_from_the_page, main_content;

    if (context.jQuery) {
        const $ = context.jQuery;
        pageTitle = $('title').first().text();
        h1 = $('h1').first().text();
        first_h2 = $('h2').first().text();
        random_text_from_the_page = $('p').first().text();

        const contentSelectors = ['article', '.content', '#main-content', '.main'];
        for (const selector of contentSelectors) {
            main_content = $(selector).text().trim();
            if (main_content) break;
        }
        if (!main_content) {
            main_content = $('body').text().trim();
        }
    } else {
        pageTitle = document.title;
        h1 = document.querySelector('h1')?.textContent?.trim() || '';
        first_h2 = document.querySelector('h2')?.textContent?.trim() || '';
        random_text_from_the_page = document.querySelector('p')?.textContent?.trim() || '';

        const contentSelectors = ['article', '.content', '#main-content', '.main'];
        for (const selector of contentSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                main_content = element.textContent.trim();
                break;
            }
        }
        if (!main_content) {
            main_content = document.body.textContent.trim();
        }
    }

    context.log.info(\`URL: \${context.request.url}, TITLE: \${pageTitle}\`);

    return {
        url: context.request.url,
        pageTitle,
        h1,
        first_h2,
        random_text_from_the_page,
        main_content: main_content.substring(0, 1000)
    };
}`,
      headless: true,
      ignoreSSLErrors: false,
      ignoreCORSAndCSP: false,
      downloadMediaFiles: false,
      downloadCSSFiles: false,
      maxPageRetries: 5,
      maxPagesPerRun: 100,
      maxResultRecords: 1000,
      maxCrawlingDepth: 3,
      maxConcurrency: 10,
      pageLoadTimeout: 180,
      pageFunctionTimeout: 180
    }
  });

  const onSubmit = async (data: FormData) => {
    dispatch(startCrawl());
    try {
      // Convert globPatterns and excludeGlobPatterns to arrays
      const preparedData = {
        ...data,
        globPatterns: data.globPatterns.split(',').map(pattern => pattern.trim()),
        excludeGlobPatterns: data.excludeGlobPatterns.split(',').map(pattern => pattern.trim())
      };

      const response = await fetch('http://localhost:3001/start-crawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preparedData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start crawl');
      }
      
      const results = await response.json();
      dispatch(crawlSuccess(results));
    } catch (error) {
      if (error instanceof Error) {
        dispatch(crawlFailure(error.message));
      } else {
        dispatch(crawlFailure('An unknown error occurred'));
      }
    }
  };

  return (
    <FormProvider {...methods}>
      <Box component="form" onSubmit={methods.handleSubmit(onSubmit)}>
        <UrlInputs />
        <CrawlSettings />
        <PageFunctionInput />
        <Group justify="flex-end" mt="md">
          <Button type="submit">Start Crawl</Button>
        </Group>
      </Box>
    </FormProvider>
  );
};

export default ConfigurationForm;