/**
 * Service scan.
 *  - verifyQR : valide signature HMAC + existence + non-scanné.
 *  - confirmScan : marque scanned_at, génère certificat PDF, retourne URL.
 */

import { prisma } from '../../../config/database';
import { verifyQRCode, generatePlainQRCode } from '../../../utils/qr-generator';
import { generateCertificatePDF } from '../../../utils/pdf-generator';
import { uploadPdf } from '../../shared/storage/storage.service';
import { NotFoundError, ValidationError } from '../../shared/errors/types/error.types';
import { logAudit } from '../../shared/audit/services/audit.service';
import { logger } from '../../../utils/logger';
import type { QRCodeData, ScanErrorCode } from '../types/scan.types';
import { EmailService } from '../../notifications/services/email.service';

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
  private readonly emailService = new EmailService();
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

    // Claim atomique anti double-scan : seul le 1er update (scannedAt encore NULL)
    // réussit. Évite que deux scans concurrents passent tous les deux le check.
    const claim = await prisma.ticket.updateMany({
      where: { id: ticketId, scannedAt: null },
      data: { scannedAt: new Date(), scannedBy: scannerId },
    });
    if (claim.count === 0) throw new ValidationError('Ticket deja scanne');

    // Génération du certificat
    const ticketYear = ticket.ticketNumber.split('-')[1] ?? new Date().getFullYear();
    const ticketSeq = ticket.ticketNumber.split('-')[2] ?? '000000';
    const certificateNumber = `WCG-CERT-${ticketYear}-${ticketSeq}`;

    // QR d'authentification : URL publique de vérification (ouvrable par tout scanner).
    const appUrl = process.env.FRONTEND_URL ?? process.env.APP_URL ?? 'http://localhost:3000';
    const verifyUrl = `${appUrl.replace(/\/$/, '')}/certificat/${certificateNumber}`;
    let qrCodeDataUrl: string | undefined;
    try {
      qrCodeDataUrl = await generatePlainQRCode(verifyUrl);
    } catch {
      qrCodeDataUrl = undefined;
    }

    const pdfBuffer = await generateCertificatePDF({
      participantName: `${ticket.booking.participant.firstName} ${ticket.booking.participant.lastName}`,
      eventTitle: ticket.booking.event.title,
      eventDate: ticket.booking.event.startDate.toLocaleDateString('fr-FR'),
      certificateNumber,
      qrCodeDataUrl,
    });

    // Stockage (Supabase Storage en prod, disque local en dev)
    const certificateUrl = await uploadPdf(
      'certificates',
      `${certificateNumber}.pdf`,
      pdfBuffer,
    );

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { certificateSent: true, certificateUrl, certificateNumber },
    });

    // Envoi de l'email avec le certificat
    try {
      await this.emailService.sendCertificate(
        ticket.booking.participant.email,
        certificateNumber,
        certificateUrl
      );
    } catch (err) {
      console.error('Erreur lors de l\'envoi du certificat par email:', err);
    }

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
