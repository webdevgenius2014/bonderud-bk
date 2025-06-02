import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import env from './env.js';
import path from 'path';
import fs from 'fs';

if (!fs.existsSync(env.LOG_FILE_PATH)) {
  fs.mkdirSync(env.LOG_FILE_PATH, { recursive: true });
}

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

const createRotateFileTransport = (filename, level) => new DailyRotateFile({
    filename: path.join(env.LOG_FILE_PATH, filename),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: env.LOG_MAX_SIZE,
    maxFiles: env.LOG_MAX_FILES,
    level,
    format: logFormat,
  });

const transports = [
  createRotateFileTransport('combined-%DATE%.log'),
  createRotateFileTransport('error-%DATE%.log', 'error'),
];

if (env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      level: env.LOG_LEVEL,
      format: consoleFormat,
    })
  );
}

if (env.NODE_ENV === 'test') {
  transports.length = 0;
  transports.push(
    new winston.transports.File({
      filename: path.join(env.LOG_FILE_PATH, 'test.log'),
      level: 'error',
      format: logFormat,
    })
  );
}

const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: logFormat,
  defaultMeta: { 
    service: 'bounderulaw-api',
    environment: env.NODE_ENV,
  },
  transports,
  exitOnError: false,
});

logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

export class Logger {
  static info(message, meta) {
    logger.info(message, meta);
  }

  static warn(message, meta) {
    logger.warn(message, meta);
  }

  static error(message, error) {
    if (error instanceof Error) {
      logger.error(message, { 
        error: error.message, 
        stack: error.stack,
        ...error 
      });
    } else {
      logger.error(message, error);
    }
  }

  static debug(message, meta) {
    logger.debug(message, meta);
  }

  static http(message, meta) {
    logger.http(message, meta);
  }
}

export default logger;