import React from 'react';
import { useFormContext } from 'react-hook-form';
import { TextInput, Button, Group, ActionIcon, Box, Text, Stack } from '@mantine/core';
import { IconTrash, IconPlus, IconRefresh } from '@tabler/icons-react';

interface Field {
  name: string;
  selector: string;
}

interface FieldsObject {
  [key: string]: Field;
}

const defaultFields: FieldsObject = {
  title: { name: 'title', selector: 'title' },
  h1: { name: 'h1', selector: 'h1' },
  body: { name: 'body', selector: 'body' },
  meta_description: { name: 'meta_description', selector: 'meta[name="description"]' },
};

const Fields: React.FC = () => {
  const { control, register, setValue, watch } = useFormContext<{ fields: FieldsObject }>();
  const fields = watch('fields');

  const addField = () => {
    const newKey = `field_${Object.keys(fields).length}`;
    setValue(`fields.${newKey}`, { name: '', selector: '' });
  };

  const removeField = (key: string) => {
    const newFields = { ...fields };
    delete newFields[key];
    setValue('fields', newFields);
  };

  const resetToDefault = () => {
    setValue('fields', defaultFields);
  };

  return (
    <Box>
      <Group justify="space-between" mb="md">
        <Text size="lg" fw={700}>Field Selection</Text>
        <Group>
          <Button
            onClick={addField}
            leftSection={<IconPlus size={14} />}
            variant="light"
          >
            Add Field
          </Button>
          <Button
            onClick={resetToDefault}
            leftSection={<IconRefresh size={14} />}
            variant="light"
            color="yellow"
          >
            Reset to Default
          </Button>
        </Group>
      </Group>
      <Stack gap="xs">
        {Object.entries(fields).map(([key, field]) => (
          <Group key={key} grow>
            <TextInput
              {...register(`fields.${key}.name`)}
              placeholder="Field name"
            />
            <TextInput
              {...register(`fields.${key}.selector`)}
              placeholder="CSS Selector"
            />
            <ActionIcon color="red" onClick={() => removeField(key)}>
              <IconTrash size={16} />
            </ActionIcon>
          </Group>
        ))}
      </Stack>
      {Object.keys(fields).length === 0 && (
        <Text c="dimmed" ta="center" mt="md">
          No fields added. Click 'Add Field' to start or 'Reset to Default' to load preset fields.
        </Text>
      )}
    </Box>
  );
};

export default Fields;