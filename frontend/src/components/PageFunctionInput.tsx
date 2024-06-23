import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Textarea } from '@mantine/core';

const PageFunctionInput: React.FC = () => {
  const { control, watch } = useFormContext();
  const injectJQuery = watch('injectJQuery');

  return (
    <Controller
      name="pageFunction"
      control={control}
      rules={{ required: 'Page function is required' }}
      render={({ field, fieldState: { error } }) => (
        <Textarea
          {...field}
          label="Page function"
          description={`Input JavaScript (ES6) function that is executed in the context of every page loaded in the Chrome browser. jQuery is ${injectJQuery ? 'available' : 'not available'}.`}
          error={error?.message}
          required
          autosize
          minRows={15}
          mt="md"
        />
      )}
    />
  );
};

export default PageFunctionInput;