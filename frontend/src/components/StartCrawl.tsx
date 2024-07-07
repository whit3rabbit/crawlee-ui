import React from 'react';
import { Button, Text, Box } from '@mantine/core';
import { useDispatch } from 'react-redux';
import { useFormContext } from 'react-hook-form';
import { startCrawl, crawlSuccess, crawlFailure } from '../store/crawlSlice';
import { FormData } from '../App'; 
import TerminalOutput from './TerminalOutput';

const StartCrawl: React.FC = () => {
  const dispatch = useDispatch();
  const { getValues } = useFormContext<FormData>();

  const handleStartCrawl = async () => {
    dispatch(startCrawl());
    try {
      const formData = getValues();
      
      const preparedData = {
        ...formData,
        globPatterns: formData.globPatterns.split(',').map((pattern: string) => pattern.trim()),
        excludeGlobPatterns: formData.excludeGlobPatterns.split(',').map((pattern: string) => pattern.trim()),
        fields: formData.fields // This is now an object, no need to transform
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
    <Box>
      <Text mb="md">Review your settings and click the button below to start the crawl.</Text>
      <Button onClick={handleStartCrawl} fullWidth>
        Start Crawl
      </Button>

      <TerminalOutput />
    </Box>
  );
};

export default StartCrawl;