import React from 'react';
import { Box } from '@mantine/core';
import UrlInputs from './UrlInputs';
import CrawlSettings from './CrawlSettings';
import PageFunctionInput from './PageFunctionInput';
import Fields from './Fields';  // Add this import

interface ConfigurationFormProps {
  section: 'basic' | 'advanced' | 'fields' | 'pageFunction';
}

const ConfigurationForm: React.FC<ConfigurationFormProps> = ({ section }) => {
  return (
    <Box>
      {section === 'basic' && <UrlInputs />}
      {section === 'advanced' && <CrawlSettings />}
      {section === 'fields' && <Fields />}
      {section === 'pageFunction' && <PageFunctionInput />}
    </Box>
  );
};

export default ConfigurationForm;