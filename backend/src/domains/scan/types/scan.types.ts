import type { Ticket, QRData } from '../../tickets/types/tickets.types.js';

export interface ScanVerificationPayload {
  qrData: QRData;
  scannedAt: Date;
  scannerId?: string;
}

export type ScanErrorCode =
  | 'invalid_signature'
  | 'already_scanned'
  | 'expired'
  | 'not_found';

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
