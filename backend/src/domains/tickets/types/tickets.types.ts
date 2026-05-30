/**
 * Types du domaine tickets.
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

export interface TicketGenerationResult {
  ticketNumber: string;
  pdfUrl: string;
  qrCode: string;
}
