/**
 * Service scan.
 *  - verifyQR : valide signature HMAC + existence + non-scanné.
 *  - confirmScan : marque scanned_at, génère certificat PDF, retourne URL.
 */

import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '../../../config/database';
import { verifyQRCode } from '../../../utils/qr-generator';
import { generateCertificatePDF } from '../../../utils/pdf-generator';
import { NotFoundError, ValidationError } from '../../shared/errors/types/error.types';
import { logAudit } from '../../shared/audit/services/audit.service';
import { logger } from '../../../utils/logger';
import type { QRCodeData, ScanErrorCode } from '../types/scan.types';

const UPLOADS_DIR = process.env.LOCAL_STORAGE_PATH ?? './uploads';

interface VerifyResult {
  valid: boolean;
  ticket?: unknown;
  error?: ScanErrorCode;
}

interface ConfirmResult {
  ticket: unknown;
  certificateUrl: string;
}

export class ScanService {
  async verifyQR(qrData: QRCodeData): Promise<VerifyResult> {
    if (!verifyQRCode(qrData)) return { valid: false, error: 'invalid' };

    const ticket = await prisma.ticket.findUnique({
      where: { id: qrData.ticketId },
      include: {
        booking: { include: { participant: true, event: true } },
      },
    });

    if (!ticket) return { valid: false, error: 'not_found' };
    if (ticket.scannedAt) return { valid: false, error: 'already_scanned', ticket };
    return { valid: true, ticket };
  }

  async confirmScan(ticketId: string, scannerId: string): Promise<ConfirmResult> {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        booking: { include: { participant: true, event: true } },
      },
    });
    if (!ticket) throw new NotFoundError('Ticket');
    if (ticket.scannedAt) throw new ValidationError('Ticket deja scanne');
    if (!ticket.booking.participant) throw new NotFoundError('Participant');

    // Marquage scanné
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { scannedAt: new Date(), scannedBy: scannerId },
    });

    // Génération du certificat
    const ticketYear = ticket.ticketNumber.split('-')[1] ?? new Date().getFullYear();
    const ticketSeq = ticket.ticketNumber.split('-')[2] ?? '000000';
    const certificateNumber = `WCG-CERT-${ticketYear}-${ticketSeq}`;

    const pdfBuffer = await generateCertificatePDF({
      participantName: `${ticket.booking.participant.firstName} ${ticket.booking.participant.lastName}`,
      eventTitle: ticket.booking.event.title,
      eventDate: ticket.booking.event.startDate.toLocaleDateString('fr-FR'),
      certificateNumber,
    });

    const certsDir = path.join(UPLOADS_DIR, 'certificates');
    if (!fs.existsSync(certsDir)) fs.mkdirSync(certsDir, { recursive: true });
    const certPath = path.join(certsDir, `${certificateNumber}.pdf`);
    fs.writeFileSync(certPath, pdfBuffer);
    const certificateUrl = `/uploads/certificates/${certificateNumber}.pdf`;

    await prisma.ticket.update({
      where: { id: ticketId },
      data: { certificateSent: true, certificateUrl },
    });

    await logAudit({
      action: 'TICKET_SCANNED',
      userId: scannerId,
      resource: 'ticket',
      resourceId: ticketId,
      details: { certificateNumber },
      result: 'success',
    });

    logger.info({ ticketNumber: ticket.ticketNumber, certificateNumber }, 'Ticket scanne');
    return { ticket: updatedTicket, certificateUrl };
  }
}
