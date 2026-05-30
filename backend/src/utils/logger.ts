/**
 * Logger Pino — production-friendly, sans données personnelles en clair.
 */

import pino from 'pino';
import { env } from '../config/env.js';

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: ['req.headers.authorization', '*.email', '*.phone', '*.password', '*.passwordHash'],
    censor: '[REDACTED]',
  },
});
