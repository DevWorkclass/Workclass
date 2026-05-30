/**
 * Types du domaine scan — re-export QRCodeData depuis utils/qr-generator.
 */

import type { Ticket } from '../../tickets/types/tickets.types.js';
import type { QRCodeData } from '../../../utils/qr-generator.js';

export type { QRCodeData };

export type ScanErrorCode =
  | 'invalid'
  | 'already_scanned'
  | 'expired'
  | 'not_found'
  | 'event_not_active';

export interface ScanResult {
  valid: boolean;
  ticket?: Ticket;
  error?: ScanErrorCode;
}

export interface ScanVerifyInput {
  qrPayload: string;
  scannerId?: string;
}

export interface ScanConfirmInput {
  ticketId: string;
  scannerId?: string;
}
