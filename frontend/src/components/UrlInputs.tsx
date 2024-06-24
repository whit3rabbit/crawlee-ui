import React from 'react';
import { useFormContext, useFieldArray, FieldArrayPath } from 'react-hook-form';
import { TextInput, Button, Group, ActionIcon } from '@mantine/core';
import { IconTrash, IconPlus } from '@tabler/icons-react';
import { FormData } from '../App';

const UrlInputs: React.FC = () => {
  const { control, register } = useFormContext<FormData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'startUrls' as FieldArrayPath<FormData>,
  });

  return (
    <>
      {fields.map((field, index) => (
        <Group key={field.id} align="center" mt="md">
          <TextInput
            {...register(`startUrls.${index}`)}
            label={index === 0 ? 'Start URLs' : undefined}
            placeholder="Enter URL"
            required
            style={{ flex: 1 }}
          />
          {fields.length > 1 && (
            <ActionIcon onClick={() => remove(index)} color="red">
              <IconTrash size={16} />
            </ActionIcon>
          )}
        </Group>
      ))}
      <Button 
        onClick={() => append('')} 
        variant="light" 
        leftSection={<IconPlus size={16} />}
        mt="sm"
      >
        Add URL
      </Button>

      <TextInput
        {...register('linkSelector')}
        label="Link Selector"
        placeholder="e.g., a[href]"
        mt="md"
      />

      <TextInput
        {...register('globPatterns')}
        label="Glob Patterns"
        placeholder="e.g., https://example.com/**/*"
        mt="md"
      />

      <TextInput
        {...register('excludeGlobPatterns')}
        label="Exclude Glob Patterns"
        placeholder="e.g., **/*.{png,jpg,jpeg,pdf}"
        mt="md"
      />
    </>
  );
};

export default UrlInputs;