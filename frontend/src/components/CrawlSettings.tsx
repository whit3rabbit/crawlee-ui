import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { TextInput, Switch, Checkbox, NumberInput, Stack, Group, Text } from '@mantine/core';
import { FormData } from '../App';

const CrawlSettings: React.FC = () => {
  const { control } = useFormContext<FormData>();

  return (
    <Stack>
      <Text size="lg" fw={500}>Crawl Settings</Text>

      <Controller
        name="linkSelector"
        control={control}
        render={({ field }) => (
          <TextInput
            {...field}
            label="Link Selector"
            placeholder="Enter link selector"
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

      <Group grow>
        <Controller
          name="urlFragments"
          control={control}
          render={({ field: { onChange, value, ...rest } }) => (
            <Switch
              {...rest}
              checked={value}
              onChange={(event) => onChange(event.currentTarget.checked)}
              label="URL #fragments identify unique pages"
            />
          )}
        />

        <Controller
          name="injectJQuery"
          control={control}
          render={({ field: { onChange, value, ...rest } }) => (
            <Switch
              {...rest}
              checked={value}
              onChange={(event) => onChange(event.currentTarget.checked)}
              label="Inject jQuery"
            />
          )}
        />
      </Group>

      <Group grow>
        <Controller
          name="headless"
          control={control}
          render={({ field: { onChange, value, ...rest } }) => (
            <Switch
              {...rest}
              checked={value}
              onChange={(event) => onChange(event.currentTarget.checked)}
              label="Run browsers in headless mode"
            />
          )}
        />

        <Controller
          name="ignoreSSLErrors"
          control={control}
          render={({ field: { onChange, value, ...rest } }) => (
            <Checkbox
              {...rest}
              checked={value}
              onChange={(event) => onChange(event.currentTarget.checked)}
              label="Ignore SSL errors"
            />
          )}
        />
      </Group>

      <Group grow>
        <Controller
          name="ignoreCORSAndCSP"
          control={control}
          render={({ field: { onChange, value, ...rest } }) => (
            <Checkbox
              {...rest}
              checked={value}
              onChange={(event) => onChange(event.currentTarget.checked)}
              label="Ignore CORS and CSP"
            />
          )}
        />

        <Controller
          name="downloadMediaFiles"
          control={control}
          render={({ field: { onChange, value, ...rest } }) => (
            <Checkbox
              {...rest}
              checked={value}
              onChange={(event) => onChange(event.currentTarget.checked)}
              label="Download media files"
            />
          )}
        />
      </Group>

      <Controller
        name="downloadCSSFiles"
        control={control}
        render={({ field: { onChange, value, ...rest } }) => (
          <Checkbox
            {...rest}
            checked={value}
            onChange={(event) => onChange(event.currentTarget.checked)}
            label="Download CSS files"
          />
        )}
      />

      <Text size="lg" fw={500} mt="lg">Limits and Timeouts</Text>

      <Group grow>
        <Controller
          name="maxPageRetries"
          control={control}
          render={({ field }) => (
            <NumberInput
              {...field}
              onChange={(val) => field.onChange(val)}
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
              onChange={(val) => field.onChange(val)}
              label="Max pages per run"
              min={0}
              step={1}
            />
          )}
        />
      </Group>

      <Group grow>
        <Controller
          name="maxResultRecords"
          control={control}
          render={({ field }) => (
            <NumberInput
              {...field}
              onChange={(val) => field.onChange(val)}
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
              onChange={(val) => field.onChange(val)}
              label="Max crawling depth"
              min={0}
              step={1}
            />
          )}
        />
      </Group>

      <Group grow>
        <Controller
          name="maxConcurrency"
          control={control}
          render={({ field }) => (
            <NumberInput
              {...field}
              onChange={(val) => field.onChange(val)}
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
              onChange={(val) => field.onChange(val)}
              label="Page load timeout (seconds)"
              min={1}
              step={1}
            />
          )}
        />
      </Group>

      <Controller
        name="pageFunctionTimeout"
        control={control}
        render={({ field }) => (
          <NumberInput
            {...field}
            onChange={(val) => field.onChange(val)}
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