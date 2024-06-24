import React from 'react';
import { Box } from '@mantine/core';
import UrlInputs from './UrlInputs';
import CrawlSettings from './CrawlSettings';
import PageFunctionInput from './PageFunctionInput';

interface ConfigurationFormProps {
  section: 'basic' | 'advanced' | 'pageFunction';
}

const ConfigurationForm: React.FC<ConfigurationFormProps> = ({ section }) => {
  return (
    <Box>
      {section === 'basic' && <UrlInputs />}
      {section === 'advanced' && <CrawlSettings />}
      {section === 'pageFunction' && <PageFunctionInput />}
    </Box>
  );
};

export default ConfigurationForm;