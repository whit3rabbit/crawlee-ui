import winston from 'winston';
import Transport, { TransportStreamOptions } from 'winston-transport';
import WebSocket from 'ws';

class WebSocketTransport extends Transport {
  private wss: WebSocket.Server;

  constructor(opts: TransportStreamOptions, wss: WebSocket.Server) {
    super(opts);
    this.wss = wss;
  }

  log(info: winston.LogEntry, callback: () => void): void {
    setImmediate(() => {
      this.emit('logged', info);
    });

    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(info));
      }
    });

    callback();
  }
}

function createLogger(wss: WebSocket.Server): winston.Logger {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: 'error.log', level: 'error' }),
      new winston.transports.File({ filename: 'combined.log' }),
      new WebSocketTransport({
        level: 'info'
      } as TransportStreamOptions, wss)
    ]
  });
}

export { createLogger, WebSocketTransport };