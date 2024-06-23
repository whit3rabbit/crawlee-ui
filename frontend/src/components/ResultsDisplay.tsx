import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Table, Text, Paper, Title, Loader, Tabs } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';

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
    return <Loader size="xl" />;
  }

  if (error) {
    return <Text color="red">{error}</Text>;
  }

  if (!Array.isArray(results) || results.length === 0) {
    return <Text>No results to display.</Text>;
  }

  const renderTable = () => (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>URL</Table.Th>
          <Table.Th>Title</Table.Th>
          <Table.Th>H1</Table.Th>
          <Table.Th>First H2</Table.Th>
          <Table.Th>First Paragraph</Table.Th>
          <Table.Th>Main Content (truncated)</Table.Th>
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
            <Table.Td>{result.main_content.substring(0, 100)}...</Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );

  const renderJson = () => (
    <CodeHighlight code={JSON.stringify(results, null, 2)} language="json" />
  );

  const renderMarkdown = () => (
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
  );

  return (
    <Paper mt="xl" p="md">
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