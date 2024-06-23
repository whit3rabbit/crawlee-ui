import React from 'react';
import { Provider } from 'react-redux';
import { MantineProvider, Container, Title, Group } from '@mantine/core';
import { store } from './store';
import ConfigurationForm from './components/ConfigurationForm';
import ResultsDisplay from './components/ResultsDisplay';
import '@mantine/code-highlight/styles.css';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <MantineProvider defaultColorScheme="dark">
        <Container>
          <Group align="center" justify="space-between">
            <Title>Crawlee Configuration</Title>
          </Group>
          <ConfigurationForm />
          <ResultsDisplay />
        </Container>
      </MantineProvider>
    </Provider>
  );
};

export default App;