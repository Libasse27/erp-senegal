const winston = require('winston');
const path = require('path');
const fs = require('fs');

// In Lambda, /var/task is read-only — use /tmp. Otherwise use an absolute path.
const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const defaultLogDir = isLambda
  ? '/tmp/logs'
  : path.join(__dirname, '..', '..', '..', 'logs');
const logDir = process.env.LOG_DIR || defaultLogDir;

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} ${level}: ${stack || message}`;
  })
);

const fileTransports = [];
try {
  fs.mkdirSync(logDir, { recursive: true });
  fileTransports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'access.log'),
      level: 'http',
      maxsize: 5242880,
      maxFiles: 3,
    })
  );
} catch {
  // File logging unavailable (read-only filesystem) — console only
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'erp-senegal' },
  transports: [
    new winston.transports.Console({
      format: process.env.NODE_ENV !== 'production'
        ? consoleFormat
        : winston.format.json(),
    }),
    ...fileTransports,
  ],
});

// Stream object for Morgan HTTP logging integration
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

module.exports = logger;
