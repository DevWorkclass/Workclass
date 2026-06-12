/**
 * Service scan.
 *  - verifyQR              : valide signature HMAC + existence + non-scanné.
 *  - confirmScan           : marque scanned_at, génère certificat PDF, envoie certificat + feedback.
 *  - getScannedByEvent     : liste les billets scannés d'un événement (pour génération en masse).
 *  - sendCertificates      : génère et envoie les certificats pour une liste de ticketIds.
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

interface ParticipantMeta {
  firstName: string;
  lastName: string;
  email?: string;
}

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
        booking: {
          include: {
            participant: true,
            event: true,
            ticketType: true,
          },
        },
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
        booking: {
          include: {
            participant: true,
            event: true,
            ticketType: true,
          },
        },
      },
    });
    if (!ticket) throw new NotFoundError('Ticket');
    if (ticket.scannedAt) throw new ValidationError('Ticket deja scanne');
    if (!ticket.booking.participant) throw new NotFoundError('Participant');

    // Claim atomique anti double-scan
    const claim = await prisma.ticket.updateMany({
      where: { id: ticketId, scannedAt: null },
      data: { scannedAt: new Date(), scannedBy: scannerId },
    });
    if (claim.count === 0) throw new ValidationError('Ticket deja scanne');

    // Génération du numéro et token de certificat
    const ticketYear = ticket.ticketNumber.split('-')[1] ?? new Date().getFullYear();
    const ticketSeq = ticket.ticketNumber.split('-')[2] ?? '000000';
    const certificateNumber = `WCG-CERT-${ticketYear}-${ticketSeq}`;
    const certificateToken = crypto.randomUUID();

    // QR d'authentification (URL publique de vérification)
    const appUrl = process.env.FRONTEND_URL ?? process.env.APP_URL ?? 'http://localhost:3000';
    const verifyUrl = `${appUrl.replace(/\/$/, '')}/certificat/${certificateToken}`;
    let qrCodeDataUrl: string | undefined;
    try {
      qrCodeDataUrl = await generatePlainQRCode(verifyUrl);
    } catch {
      qrCodeDataUrl = undefined;
    }

    const participant = ticket.booking.participant;
    const pdfBuffer = await generateCertificatePDF({
      participantName: `${participant.firstName} ${participant.lastName}`,
      eventTitle: ticket.booking.event.title,
      eventDate: ticket.booking.event.startDate.toLocaleDateString('fr-FR'),
      certificateNumber,
      qrCodeDataUrl,
    });

    const certificateUrl = await uploadPdf('certificates', `${certificateNumber}.pdf`, pdfBuffer);

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { certificateSent: true, certificateUrl, certificateNumber, certificateToken },
    });

    // ── Collecte de tous les emails des participants ──────────────────────────
    const metaPs: ParticipantMeta[] =
      (participant.metadata as { participants?: ParticipantMeta[] } | null)?.participants ?? [];

    // Ensemble dédupliqué : payeur + participants individuels
    const emailSet = new Set<string>();
    if (participant.email) emailSet.add(participant.email.trim().toLowerCase());
    for (const p of metaPs) {
      if (p.email && p.email.trim()) emailSet.add(p.email.trim().toLowerCase());
    }
    const allEmails = [...emailSet].filter(Boolean);

    // ── Envoi certificat au payeur ────────────────────────────────────────────
    try {
      if (participant.email) {
        await this.emailService.sendCertificate(participant.email, certificateNumber, certificateUrl);
      }
    } catch (err) {
      logger.error({ err }, 'Erreur envoi certificat par email');
    }

    // ── Envoi lien feedback à tous les participants ───────────────────────────
    const feedbackExpiry = new Date();
    feedbackExpiry.setDate(feedbackExpiry.getDate() + 30); // valide 30 jours

    await Promise.allSettled(
      allEmails.map(async (email) => {
        try {
          const feedbackToken = crypto.randomUUID();
          await prisma.feedbackLink.create({
            data: {
              eventId: ticket.booking.eventId,
              bookingId: ticket.booking.id,
              token: feedbackToken,
              expiresAt: feedbackExpiry,
            },
          });
          await this.emailService.sendFeedbackLink(email, feedbackToken);
        } catch (err) {
          logger.error({ err, email }, 'Erreur envoi lien feedback');
        }
      }),
    );

    await logAudit({
      action: 'TICKET_SCANNED',
      userId: scannerId,
      resource: 'ticket',
      resourceId: ticketId,
      details: { certificateNumber, feedbacksSent: allEmails.length },
      result: 'success',
    });

    logger.info({ ticketNumber: ticket.ticketNumber, certificateNumber }, 'Ticket scanne');
    return { ticket: updatedTicket, certificateUrl };
  }

  // ── Billets scannés d'un événement ───────────────────────────────────────
  async getScannedByEvent(eventId: string, query?: string) {
    const participantFilter = query
      ? {
          participant: {
            OR: [
              { firstName: { contains: query, mode: 'insensitive' as const } },
              { lastName: { contains: query, mode: 'insensitive' as const } },
              { email: { contains: query, mode: 'insensitive' as const } },
            ],
          },
        }
      : {};
    return prisma.ticket.findMany({
      where: {
        scannedAt: { not: null },
        booking: { eventId, ...participantFilter },
      },
      orderBy: { scannedAt: 'desc' },
      include: {
        booking: {
          include: { participant: { select: { firstName: true, lastName: true, email: true, metadata: true } } },
        },
      },
    });
  }

  // ── Envoi en masse de certificats ─────────────────────────────────────────
  async sendCertificates(ticketIds: string[]): Promise<{ sent: number; errors: number }> {
    let sent = 0;
    let errors = 0;

    await Promise.allSettled(
      ticketIds.map(async (ticketId) => {
        try {
          const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            include: {
              booking: { include: { participant: true, event: true } },
            },
          });
          if (!ticket?.scannedAt || !ticket.booking.participant) return;

          const participant = ticket.booking.participant;
          // certificateNumber / certificateToken : champs ajoutés au schéma après le generate initial.
          // L'IDE peut afficher des erreurs stale — les types sont corrects dans .prisma/client.
          type CertFields = { certificateUrl: string | null; certificateNumber: string | null; certificateToken: string | null };
          const certTicket = ticket as typeof ticket & CertFields;
          let certificateUrl: string | null = certTicket.certificateUrl;
          let certificateNumber: string | null = certTicket.certificateNumber;
          let certificateToken: string | null = certTicket.certificateToken;

          // Générer un nouveau certificat si absent
          if (!certificateUrl) {
            const ticketYear = ticket.ticketNumber.split('-')[1] ?? String(new Date().getFullYear());
            const ticketSeq = ticket.ticketNumber.split('-')[2] ?? '000000';
            certificateNumber = `WCG-CERT-${ticketYear}-${ticketSeq}`;
            certificateToken = crypto.randomUUID();

            const appUrl = (process.env.FRONTEND_URL ?? process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
            const verifyUrl = `${appUrl}/certificat/${certificateToken}`;
            let qrCodeDataUrl: string | undefined;
            try { qrCodeDataUrl = await generatePlainQRCode(verifyUrl); } catch { /* sans QR */ }

            const pdfBuffer = await generateCertificatePDF({
              participantName: `${participant.firstName} ${participant.lastName}`,
              eventTitle: ticket.booking.event.title,
              eventDate: ticket.booking.event.startDate.toLocaleDateString('fr-FR'),
              certificateNumber,
              qrCodeDataUrl,
            });
            certificateUrl = await uploadPdf('certificates', `${certificateNumber}.pdf`, pdfBuffer);

            const certData = { certificateSent: true, certificateUrl, certificateNumber, certificateToken };
            await prisma.ticket.update({ where: { id: ticketId }, data: certData as Parameters<typeof prisma.ticket.update>[0]['data'] });
          }

          if (participant.email && certificateUrl && certificateNumber) {
            await this.emailService.sendCertificate(participant.email, certificateNumber, certificateUrl);
            sent++;
          }
        } catch (err) {
          logger.error({ err, ticketId }, 'Erreur generation/envoi certificat');
          errors++;
        }
      }),
    );

    return { sent, errors };
  }
}
