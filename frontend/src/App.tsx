import React, { useState } from 'react';
import { MantineProvider, AppShell, Text, Tabs, Grid } from '@mantine/core';
import { Provider } from 'react-redux';
import { useForm, FormProvider } from 'react-hook-form';
import { store } from './store';
import ConfigurationForm from './components/ConfigurationForm';
import ResultsDisplay from './components/ResultsDisplay';
import StartCrawl from './components/StartCrawl';
export interface FormData {
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

const App = () => {
  const [activeTab, setActiveTab] = useState<string | null>('basic');
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

  return (
    <Provider store={store}>
      <MantineProvider defaultColorScheme="dark">
        <FormProvider {...methods}>
          <AppShell padding="md" header={{ height: 60 }}>
            <AppShell.Header>
              <Text p="xs">Crawlee Configuration</Text>
            </AppShell.Header>

            <AppShell.Main>
              <Grid>
                <Grid.Col span={5}>
                  <Tabs value={activeTab} onChange={setActiveTab}>
                    <Tabs.List>
                      <Tabs.Tab value="basic">Basic Settings</Tabs.Tab>
                      <Tabs.Tab value="advanced">Advanced Settings</Tabs.Tab>
                      <Tabs.Tab value="pageFunction">Page Function</Tabs.Tab>
                      <Tabs.Tab value="startCrawl">Start Crawl</Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="basic">
                      <ConfigurationForm section="basic" />
                    </Tabs.Panel>
                    <Tabs.Panel value="advanced">
                      <ConfigurationForm section="advanced" />
                    </Tabs.Panel>
                    <Tabs.Panel value="pageFunction">
                      <ConfigurationForm section="pageFunction" />
                    </Tabs.Panel>
                    <Tabs.Panel value="startCrawl">
                      <StartCrawl />
                    </Tabs.Panel>
                  </Tabs>
                </Grid.Col>
                <Grid.Col span={7}>
                  <ResultsDisplay />
                </Grid.Col>
              </Grid>
            </AppShell.Main>
          </AppShell>
        </FormProvider>
      </MantineProvider>
    </Provider>
  );
};

export default App;