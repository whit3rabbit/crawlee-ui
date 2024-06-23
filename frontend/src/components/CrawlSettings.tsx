import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { TextInput, Switch, Stack, NumberInput, Checkbox, Group } from '@mantine/core';

const CrawlSettings: React.FC = () => {
  const { control } = useFormContext();

  return (
    <Stack mt="md">
      <Controller
        name="linkSelector"
        control={control}
        rules={{ required: 'Link selector is required' }}
        render={({ field, fieldState: { error } }) => (
          <TextInput
            {...field}
            label="Link Selector"
            placeholder="Enter link selector"
            error={error?.message}
            required
          />
        )}
      />
      <Controller
        name="globPatterns"
        control={control}
        render={({ field }) => (
          <TextInput
            {...field}
            label="Glob Patterns"
            placeholder="Enter glob patterns separated by commas"
          />
        )}
      />
      <Controller
        name="excludeGlobPatterns"
        control={control}
        render={({ field }) => (
          <TextInput
            {...field}
            label="Exclude Glob Patterns"
            placeholder="Enter exclude glob patterns separated by commas"
          />
        )}
      />
      <Controller
        name="urlFragments"
        control={control}
        render={({ field }) => (
          <Switch
            checked={field.value}
            onChange={(event) => field.onChange(event.currentTarget.checked)}
            label="URL #fragments identify unique pages"
          />
        )}
      />
      <Controller
        name="injectJQuery"
        control={control}
        render={({ field }) => (
          <Switch
            checked={field.value}
            onChange={(event) => field.onChange(event.currentTarget.checked)}
            label="Inject jQuery"
          />
        )}
      />
      <Controller
        name="headless"
        control={control}
        render={({ field }) => (
          <Switch
            checked={field.value}
            onChange={(event) => field.onChange(event.currentTarget.checked)}
            label="Run browsers in headless mode"
          />
        )}
      />
      <Group grow>
        <Controller
          name="ignoreSSLErrors"
          control={control}
          render={({ field }) => (
            <Checkbox
              {...field}
              label="Ignore SSL errors"
            />
          )}
        />
        <Controller
          name="ignoreCORSAndCSP"
          control={control}
          render={({ field }) => (
            <Checkbox
              {...field}
              label="Ignore CORS and CSP"
            />
          )}
        />
      </Group>
      <Group grow>
        <Controller
          name="downloadMediaFiles"
          control={control}
          render={({ field }) => (
            <Checkbox
              {...field}
              label="Download media files"
            />
          )}
        />
        <Controller
          name="downloadCSSFiles"
          control={control}
          render={({ field }) => (
            <Checkbox
              {...field}
              label="Download CSS files"
            />
          )}
        />
      </Group>
      <Controller
        name="maxPageRetries"
        control={control}
        render={({ field }) => (
          <NumberInput
            {...field}
            label="Max page retries"
            min={0}
            step={1}
          />
        )}
      />
      <Controller
        name="maxPagesPerRun"
        control={control}
        render={({ field }) => (
          <NumberInput
            {...field}
            label="Max pages per run"
            min={0}
            step={1}
          />
        )}
      />
      <Controller
        name="maxResultRecords"
        control={control}
        render={({ field }) => (
          <NumberInput
            {...field}
            label="Max result records"
            min={0}
            step={1}
          />
        )}
      />
      <Controller
        name="maxCrawlingDepth"
        control={control}
        render={({ field }) => (
          <NumberInput
            {...field}
            label="Max crawling depth"
            min={0}
            step={1}
          />
        )}
      />
      <Controller
        name="maxConcurrency"
        control={control}
        render={({ field }) => (
          <NumberInput
            {...field}
            label="Max concurrency"
            min={1}
            step={1}
          />
        )}
      />
      <Controller
        name="pageLoadTimeout"
        control={control}
        render={({ field }) => (
          <NumberInput
            {...field}
            label="Page load timeout (seconds)"
            min={1}
            step={1}
          />
        )}
      />
      <Controller
        name="pageFunctionTimeout"
        control={control}
        render={({ field }) => (
          <NumberInput
            {...field}
            label="Page function timeout (seconds)"
            min={1}
            step={1}
          />
        )}
      />
    </Stack>
  );
};

export default CrawlSettings;