import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Table, Text, Paper, Title, Loader } from '@mantine/core';

interface CrawlResult {
  url: string;
  pageTitle: string;
}

const ResultsDisplay: React.FC = () => {
  const { results, isLoading, error } = useSelector((state: RootState) => state.crawl);

  if (isLoading) {
    return <Loader size="xl" />;
  }

  if (error) {
    return <Text color="red">{error}</Text>;
  }

  if (results.length === 0) {
    return <Text>No results to display.</Text>;
  }

  return (
    <Paper mt="xl" p="md">
      <Title order={2} mb="md">Crawl Results</Title>
      <Table>
        <thead>
          <tr>
            <th>URL</th>
            <th>Title</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result: CrawlResult, index: number) => (
            <tr key={index}>
              <td>{result.url}</td>
              <td>{result.pageTitle}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Paper>
  );
};

export default ResultsDisplay;