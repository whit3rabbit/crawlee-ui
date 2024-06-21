import React from 'react';
import ReactDOM from 'react-dom';
import { MantineProvider } from '@mantine/core';
import App from './App';
import '@mantine/core/styles.css';

const Root = () => {
  return (
    <MantineProvider defaultColorScheme="dark">
      <App />
    </MantineProvider>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
  document.getElementById('root')
);