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
      injectJQuery: false,
      pageFunction: `// The function accepts a single argument: the "context" object.
// For a complete list of its properties and functions,
// see https://apify.com/apify/web-scraper#page-function 
async function pageFunction(context) {
    // This statement works as a breakpoint when you're trying to debug your code. Works only with Run mode: DEVELOPMENT!
    // debugger; 

    // jQuery is handy for finding DOM elements and extracting data from them.
    // To use it, make sure to enable the "Inject jQuery" option.
    const $ = context.jQuery;
    const pageTitle = $('title').first().text();

    // Print some information to actor log
    context.log.info(\`URL: \${context.request.url}, TITLE: \${pageTitle}\`);

    // Return an object with the data extracted from the page.
    // It will be stored to the resulting dataset.
    return {
        url: context.request.url,
        pageTitle,
    };
}`
    }
  });

  const onSubmit = async (data: FormData) => {
    dispatch(startCrawl());
    try {
      const response = await fetch('http://localhost:3001/start-crawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to start crawl');
      }
      const result = await response.json();
      dispatch(crawlSuccess(result));
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