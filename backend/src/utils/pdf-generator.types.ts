export interface PdfTicketData {
  ticketNumber: string;
  eventTitle: string;
  eventLocation: string;
  eventStartDate: Date;
  participantFullName: string;
  qrPayload: string;
}

export interface PdfCertificateData {
  eventTitle: string;
  eventLocation: string;
  eventDate: Date;
  participantFullName: string;
  ticketNumber: string;
}
