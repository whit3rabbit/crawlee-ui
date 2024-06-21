import React from 'react';
import { ActionIcon, useMantineColorScheme, Container, Title, Group } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';
import cx from 'clsx';
import classes from './App.module.css';
import ConfigurationForm from './components/ConfigurationForm';

const App: React.FC = () => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  return (
    <Container>
      <Group align="center" justify="space-between">
        <Title className={classes.title}>Crawlee Configuration</Title>
        <ActionIcon
          onClick={() => toggleColorScheme()}
          variant="default"
          size="lg"
          aria-label="Toggle color scheme"
        >
          {colorScheme === 'dark' ? (
            <IconSun className={cx(classes.icon, classes.light)} stroke={1.5} />
          ) : (
            <IconMoon className={cx(classes.icon, classes.dark)} stroke={1.5} />
          )}
        </ActionIcon>
      </Group>
      <ConfigurationForm />
    </Container>
  );
};

export default App;
