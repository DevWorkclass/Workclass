/**
 * Logger Pino — pretty en dev, JSON en prod.
 * Champs sensibles (email, phone, password, authorization) redacted.
 */

import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: isDev ? 'debug' : 'info',
  transport: isDev
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss' } }
    : undefined,
  redact: {
    paths: [
      'req.headers.authorization',
      '*.email',
      '*.phone',
      '*.password',
      '*.passwordHash',
    ],
    censor: '[REDACTED]',
  },
});
