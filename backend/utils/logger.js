import fs from 'fs';
import path from 'path';

const logsDir = './logs';

// Create logs directory if not exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Log to file and console
 * 
 * What: Record application logs with timestamp
 * When: Called throughout the application
 * Why: Track errors, debug issues, monitor activity
 * How: Write to file and console with formatted message
 */
const log = (level, message, error = null) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  const fullMessage = error ? `${logMessage}\n${error.stack}` : logMessage;

  // Console output
  console[level === 'ERROR' ? 'error' : level === 'WARN' ? 'warn' : 'log'](
    fullMessage
  );

  // File output
  const logFile = path.join(logsDir, `${level.toLowerCase()}.log`);
  fs.appendFileSync(logFile, fullMessage + '\n');
};

export const logger = {
  info: (message) => log('INFO', message),
  warn: (message) => log('WARN', message),
  error: (message, error) => log('ERROR', message, error),
  debug: (message) => process.env.DEBUG && log('DEBUG', message)
};

/**
 * Log API request/response
 */
export const logRequest = (req, res, next) => {
  const start = Date.now();

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = `${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`;
    
    if (res.statusCode >= 400) {
      logger.warn(log);
    } else {
      logger.info(log);
    }
  });

  next();
};