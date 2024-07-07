import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Table, Text, Paper, Title, Loader, Tabs, Box, Button, Group } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { RootState } from '../store';
import { IconDownload } from '@tabler/icons-react';

interface CrawlResult {
  [key: string]: string | number | boolean | null;
}

const ResultsDisplay: React.FC = () => {
  const { results, isLoading, error } = useSelector((state: RootState) => state.crawl);
  const [activeTab, setActiveTab] = useState<string | null>('table');

  const downloadJSON = () => {
    const jsonString = JSON.stringify(results, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'crawl_results.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadCSV = () => {
    if (results.length === 0) return;

    const headers = Object.keys(results[0]);
    const csvContent = [
      headers.join(','),
      ...results.map(result =>
        headers.map(header => 
          `"${(result[header] ?? '').toString().replace(/"/g, '""')}"`
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'crawl_results.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return <Loader size="xl" />;
  }

  if (error) {
    return <Text color="red">{error}</Text>;
  }

  if (!results || results.length === 0) {
    return <Text>No results to display.</Text>;
  }

  const renderTable = () => (
    <Box style={{ maxHeight: '400px', overflow: 'auto' }}>
      <Table>
        <Table.Thead>
          <Table.Tr>
            {Object.keys(results[0]).map((header) => (
              <Table.Th key={header}>{header}</Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {results.map((result: CrawlResult, index: number) => (
            <Table.Tr key={index}>
              {Object.entries(result).map(([key, value]) => (
                <Table.Td key={key}>
                  {value !== null && value !== undefined ? value.toString() : ''}
                </Table.Td>
              ))}
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
# ${result.url || 'No URL'}

${Object.entries(result)
  .filter(([key]) => key !== 'url')
  .map(([key, value]) => `## ${key}\n\n${value}\n`)
  .join('\n')}

---
        `).join('\n')}
        language="markdown"
      />
    </Box>
  );

  return (
    <Paper p="md" h="100%">
      <Title order={2} mb="md">Crawl Results</Title>
      <Group mb="md">
        <Button leftSection={<IconDownload size={14} />} onClick={downloadJSON}>
          Download JSON
        </Button>
        <Button leftSection={<IconDownload size={14} />} onClick={downloadCSV}>
          Download CSV
        </Button>
      </Group>
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="table">Table</Tabs.Tab>
          <Tabs.Tab value="json">JSON</Tabs.Tab>
          <Tabs.Tab value="markdown">Markdown</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="table">{renderTable()}</Tabs.Panel>
        <Tabs.Panel value="json">{renderJson()}</Tabs.Panel>
        <Tabs.Panel value="markdown">{renderMarkdown()}</Tabs.Panel>
      </Tabs>
    </Paper>
  );
};

export default ResultsDisplay;