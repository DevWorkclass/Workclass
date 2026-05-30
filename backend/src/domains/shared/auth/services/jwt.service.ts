/**
 * Service JWT — access token (1h) + refresh token (7j).
 */

import jwt, { type SignOptions } from 'jsonwebtoken';
import { UnauthorizedError } from '../../errors/types/error.types';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1h';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET ?? 'dev_refresh_secret';
const REFRESH_EXPIRES_IN = '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as SignOptions);
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN,
  } as SignOptions);
}

export function verifyAccessToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch {
    throw new UnauthorizedError('Token invalide ou expire');
  }
}

export function verifyRefreshToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET) as TokenPayload;
    return decoded;
  } catch {
    throw new UnauthorizedError('Refresh token invalide ou expire');
  }
}
