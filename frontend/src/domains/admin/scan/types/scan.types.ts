/**
 * Types du domaine `scan` (admin).
 * Validation du QR à l'entrée d'un événement.
 */

import type { Ticket, TicketVerificationError } from '@/domains/admin/tickets/types/tickets.types';

export interface ScanInput {
  qrPayload: string;
  scannerId?: string;
}

export interface ScanResult {
  status: 'valid' | 'invalid';
  ticket?: Ticket;
  error?: TicketVerificationError;
  scannedAt?: Date;
}

export interface ScanConfirmInput {
  ticketId: string;
  scannerId?: string;
}
