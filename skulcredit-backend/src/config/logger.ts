import winston from 'winston';
import env from './env';

const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, service, ...rest } = info;
    return JSON.stringify({ timestamp, level, service: service ?? 'skulcredit-api', message, ...rest });
  })
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf((info) => {
    const {
      timestamp, level, message, requestId, type, method, url,
      route, status, duration_ms, ip, userId, userRole, outcome,
      device_browser, device_os, device_type,
      location_city, location_country, error, ...rest
    } = info as Record<string, unknown>;

    let line = `${timestamp} [${level}] ${message}`;

    if (type === 'request') {
      line += ` | ${method} ${url} | ip=${ip} | ${device_browser}/${device_os}(${device_type}) | ${location_city ?? 'local'}/${location_country ?? '?'} | reqId=${requestId}`;
    } else if (type === 'response') {
      const statusIcon = (status as number) >= 500 ? 'Bad' : (status as number) >= 400 ? 'Warning' : 'Success';
      line += ` | ${statusIcon} ${method} ${route} → ${status} (${duration_ms}ms) | user=${userId ?? 'anon'} role=${userRole ?? '-'} | ip=${ip} | ${location_city ?? 'local'}/${location_country ?? '?'} | reqId=${requestId}`;
      if (error) line += ` | error="${error}"`;
    } else {
      const extras = Object.keys(rest).length ? ' ' + JSON.stringify(rest) : '';
      line += extras;
    }

    return line;
  })
);

const logger = winston.createLogger({
  level: env.nodeEnv === 'development' ? 'debug' : 'info',
  defaultMeta: { service: 'skulcredit-api' },
  transports: [
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: jsonFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: jsonFormat,
      maxsize: 20 * 1024 * 1024,
      maxFiles: 7,
    }),
    new winston.transports.Console({
      format: env.nodeEnv === 'production' ? jsonFormat : consoleFormat,
    }),
  ],
});

export default logger;
