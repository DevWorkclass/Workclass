/**
 * Types du domaine `tickets` (admin).
 * Billets générés avec QR signé HMAC.
 */

export interface Ticket {
  id: string;
  bookingId: string;
  ticketNumber: string; // WCG-YYYY-XXXXXX
  qrCode: string; // JSON signé (sérialisé)
  pdfUrl?: string;
  scannedAt?: Date;
  scannedBy?: string;
  certificateSent: boolean;
  certificateUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TicketVerificationError =
  | 'invalid_signature'
  | 'already_scanned'
  | 'expired'
  | 'not_found'
  | 'event_not_active';

export interface TicketVerificationResult {
  valid: boolean;
  ticket?: Ticket;
  error?: TicketVerificationError;
}

export interface TicketGenerationInput {
  bookingId: string;
}
