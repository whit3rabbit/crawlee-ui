import React, { useState } from 'react';
import { TextInput, Button, Group, Box, ActionIcon, Stack, Switch, Textarea } from '@mantine/core';
import { IconTrash, IconPlus } from '@tabler/icons-react';

const ConfigurationForm: React.FC = () => {
    const [startUrls, setStartUrls] = useState<string[]>(['https://crawlee.dev']);
    const [linkSelector, setLinkSelector] = useState<string>('a[href]');
    const [globPatterns, setGlobPatterns] = useState<string>('https://crawlee.dev/*/*');
    const [excludeGlobPatterns, setExcludeGlobPatterns] = useState<string>('/**/*.{png,jpg,jpeg,pdf}');
    const [urlFragments, setUrlFragments] = useState<boolean>(false);
    const [injectJQuery, setInjectJQuery] = useState<boolean>(false);
    const [pageFunction, setPageFunction] = useState<string>(`// The function accepts a single argument: the "context" object.
// For a complete list of its properties and functions,
// see https://apify.com/apify/web-scraper#page-function 
async function pageFunction(context) {
    // This statement works as a breakpoint when you're trying to debug your code. Works only with Run mode: DEVELOPMENT!
    // debugger; 

    // jQuery is handy for finding DOM elements and extracting data from them.
    // To use it, make sure to enable the "Inject jQuery" option.
    const $ = context.jQuery;
    const pageTitle = $('title').first().text();
    const h1 = $('h1').first().text();
    const first_h2 = $('h2').first().text();
    const random_text_from_the_page = $('p').first().text();


    // Print some information to actor log
    context.log.info(\`URL: \${context.request.url}, TITLE: \${pageTitle}\`);

    // Manually add a new page to the queue for scraping.
   await context.enqueueRequest({ url: 'http://www.example.com' });

    // Return an object with the data extracted from the page.
    // It will be stored to the resulting dataset.
    return {
        url: context.request.url,
        pageTitle,
        h1,
        first_h2,
        random_text_from_the_page
    };
}`);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        const config = {
            startUrls,
            linkSelector,
            globPatterns: globPatterns.split(',').map(pattern => pattern.trim()),
            excludeGlobPatterns: excludeGlobPatterns.split(',').map(pattern => pattern.trim()),
            urlFragments,
            injectJQuery,
            pageFunction
        };

        const response = await fetch('http://localhost:3001/start-crawl', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(config),
        });

        const data = await response.text();
        console.log(data);
    };

    const handleUrlChange = (index: number, value: string) => {
        const newUrls = [...startUrls];
        newUrls[index] = value;
        setStartUrls(newUrls);
    };

    const handleAddUrl = () => {
        setStartUrls([...startUrls, '']);
    };

    const handleRemoveUrl = (index: number) => {
        const newUrls = startUrls.filter((_, i) => i !== index);
        setStartUrls(newUrls);
    };

    const validateUrl = (url: string) => {
        try {
            new URL(url);
            return true;
        } catch (_) {
            return false;
        }
    };

    return (
        <Box style={{ maxWidth: 600, margin: 'auto' }}>
            <form onSubmit={handleSubmit}>
                <Stack>
                    {startUrls.map((url, index) => (
                        <Group key={index} align="center" mt="md">
                            <TextInput
                                label={index === 0 ? 'Start URLs' : undefined}
                                placeholder="Enter URL"
                                value={url}
                                onChange={(event) => handleUrlChange(index, event.currentTarget.value)}
                                error={!validateUrl(url) && url !== '' ? 'Invalid URL' : undefined}
                                required
                                style={{ flex: 1 }}
                            />
                            {startUrls.length > 1 && (
                                <ActionIcon onClick={() => handleRemoveUrl(index)} color="red">
                                    <IconTrash size={16} />
                                </ActionIcon>
                            )}
                        </Group>
                    ))}
                    <Button onClick={handleAddUrl} variant="light">
                        <IconPlus size={16} />
                        Add URL
                    </Button>
                    <Switch
                        label="URL #fragments identify unique pages"
                        onChange={(event) => setUrlFragments(event.currentTarget.checked)}
                    />
                    <Switch
                        label="Inject jQuery"
                        onChange={(event) => setInjectJQuery(event.currentTarget.checked)}
                    />
                </Stack>
                <TextInput
                    label="Link Selector"
                    placeholder="Enter link selector"
                    value={linkSelector}
                    onChange={(event) => setLinkSelector(event.currentTarget.value)}
                />
                <TextInput
                    label="Glob Patterns"
                    placeholder="Enter glob patterns separated by commas"
                    value={globPatterns}
                    onChange={(event) => setGlobPatterns(event.currentTarget.value)}
                />
                <TextInput
                    label="Exclude Glob Patterns"
                    placeholder="Enter exclude glob patterns separated by commas"
                    value={excludeGlobPatterns}
                    onChange={(event) => setExcludeGlobPatterns(event.currentTarget.value)}
                />
                <Textarea
                    radius="md"
                    label="Page function"
                    description="Input JavaScript (ES6) function that is executed in the context of every page loaded in the Chrome browser. Use it to scrape data from the page, perform actions or add new URLs to the request queue."
                    placeholder={`// The function accepts a single argument: the "context" object.
// For a complete list of its properties and functions,
// see https://apify.com/apify/web-scraper#page-function 
async function pageFunction(context) {
    // This statement works as a breakpoint when you're trying to debug your code. Works only with Run mode: DEVELOPMENT!
    // debugger; 

    // jQuery is handy for finding DOM elements and extracting data from them.
    // To use it, make sure to enable the "Inject jQuery" option.
    const $ = context.jQuery;
    const pageTitle = $('title').first().text();
    const h1 = $('h1').first().text();
    const first_h2 = $('h2').first().text();
    const random_text_from_the_page = $('p').first().text();


    // Print some information to actor log
    context.log.info(\`URL: \${context.request.url}, TITLE: \${pageTitle}\`);

    // Manually add a new page to the queue for scraping.
   await context.enqueueRequest({ url: 'http://www.example.com' });

    // Return an object with the data extracted from the page.
    // It will be stored to the resulting dataset.
    return {
        url: context.request.url,
        pageTitle,
        h1,
        first_h2,
        random_text_from_the_page
    };
}`}
                    value={pageFunction}
                    onChange={(event) => setPageFunction(event.currentTarget.value)}
                    autosize
                    minRows={15}
                />
                <Group justify="flex-end" mt="md">
                    <Button type="submit">Start Crawl</Button>
                </Group>
            </form>
        </Box>
    );
};

export default ConfigurationForm;
