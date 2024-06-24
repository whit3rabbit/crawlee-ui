import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Table, Text, Paper, Title, Loader, Tabs, Box } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { RootState } from '../store';

interface CrawlResult {
  url: string;
  pageTitle: string;
  h1: string;
  first_h2: string;
  random_text_from_the_page: string;
  main_content: string;
}

const ResultsDisplay: React.FC = () => {
  const { results, isLoading, error } = useSelector((state: RootState) => state.crawl);
  const [activeTab, setActiveTab] = useState<string | null>('table');

  if (isLoading) {
    return (
      <Box h="100%" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader size="xl" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box h="100%" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Text color="red">{error}</Text>
      </Box>
    );
  }

  if (!Array.isArray(results) || results.length === 0) {
    return (
      <Box h="100%" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Text>No results to display.</Text>
      </Box>
    );
  }

  const renderTable = () => (
    <Box style={{ maxHeight: '400px', overflow: 'auto' }}>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>URL</Table.Th>
            <Table.Th>Title</Table.Th>
            <Table.Th>H1</Table.Th>
            <Table.Th>First H2</Table.Th>
            <Table.Th>First Paragraph</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {results.map((result: CrawlResult, index: number) => (
            <Table.Tr key={index}>
              <Table.Td>{result.url}</Table.Td>
              <Table.Td>{result.pageTitle}</Table.Td>
              <Table.Td>{result.h1}</Table.Td>
              <Table.Td>{result.first_h2}</Table.Td>
              <Table.Td>{result.random_text_from_the_page}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Box>
  );

  const renderJson = () => (
    <Box style={{ maxHeight: '600px', overflow: 'auto' }}>
      <CodeHighlight code={JSON.stringify(results, null, 2)} language="json" />
    </Box>
  );

  const renderMarkdown = () => (
    <Box style={{ maxHeight: '400px', overflow: 'auto' }}>
      <CodeHighlight
        code={results.map((result: CrawlResult) => `
# ${result.url}

## ${result.pageTitle}

### ${result.h1}

#### ${result.first_h2}

${result.random_text_from_the_page}

${result.main_content}

---
        `).join('\n')}
        language="markdown"
      />
    </Box>
  );

  return (
    <Paper p="md" h="100%">
      <Title order={2} mb="md">Crawl Results</Title>
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="table">Table</Tabs.Tab>
          <Tabs.Tab value="json">JSON</Tabs.Tab>
          <Tabs.Tab value="markdown">Markdown</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="table">
          {renderTable()}
        </Tabs.Panel>
        <Tabs.Panel value="json">
          {renderJson()}
        </Tabs.Panel>
        <Tabs.Panel value="markdown">
          {renderMarkdown()}
        </Tabs.Panel>
      </Tabs>
    </Paper>
  );
};

export default ResultsDisplay;