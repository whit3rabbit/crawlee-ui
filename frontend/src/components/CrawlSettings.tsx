import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { TextInput, Switch, Stack } from '@mantine/core';

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
    </Stack>
  );
};

export default CrawlSettings;