import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Textarea } from '@mantine/core';
import { FormData } from '../App';

const PageFunctionInput: React.FC = () => {
  const { register, watch } = useFormContext<FormData>();
  const injectJQuery = watch('injectJQuery');

  return (
    <Textarea
      {...register('pageFunction')}
      label="Page function"
      description={`Input JavaScript (ES6) function that is executed in the context of every page loaded in the Chrome browser. jQuery is ${injectJQuery ? 'available' : 'not available'}.`}
      required
      autosize
      minRows={15}
    />
  );
};

export default PageFunctionInput;