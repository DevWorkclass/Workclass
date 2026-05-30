/**
 * Types du domaine tickets (backend).
 */

export interface Ticket {
  id: string;
  bookingId: string;
  ticketNumber: string; // WCG-YYYY-NNNNNN
  qrCode: string;
  pdfUrl?: string;
  scannedAt?: Date;
  certificateSent: boolean;
  createdAt: Date;
}

export interface QRData {
  ticketId: string;
  signature: string; // HMAC-SHA256
}

export interface TicketGenerateInput {
  bookingId: string;
}

export interface TicketGetInput {
  ticketId: string;
}
