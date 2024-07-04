import React, { useState, useEffect, useRef } from 'react';
import { Box, Text, ScrollArea } from '@mantine/core';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

const TerminalOutput: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001');

    ws.onmessage = (event) => {
      const log: LogEntry = JSON.parse(event.data);
      setLogs((prevLogs) => [...prevLogs, log]);
    };

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [logs]);

  const getLogColor = (level: string): string => {
    switch (level.toLowerCase()) {
      case 'error': return 'red';
      case 'warn': return 'yellow';
      case 'info': return 'blue';
      default: return 'dimmed';
    }
  };

  return (
    <Box>
      <Text size="lg" fw={700} mb="sm">Terminal Output</Text>
      <ScrollArea h={300} viewportRef={scrollAreaRef}>
        {logs.map((log, index) => (
          <Text key={index} c={getLogColor(log.level)} style={{ whiteSpace: 'pre-wrap' }}>
            [{log.timestamp}] {log.level.toUpperCase()}: {log.message}
          </Text>
        ))}
      </ScrollArea>
    </Box>
  );
};

export default TerminalOutput;