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
import { uploadPdf, getSignedUrl } from '../../shared/storage/storage.service';
import { NotFoundError, ValidationError } from '../../shared/errors/types/error.types';
import { logAudit } from '../../shared/audit/services/audit.service';
import { logger } from '../../../utils/logger';
import type { QRCodeData, ScanErrorCode } from '../types/scan.types';
import { EmailService, type ExtraCertificate } from '../../notifications/services/email.service';
import { buildCertDownloadUrl } from '../../tickets/services/ticket-generator.service';

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
      include: { booking: { include: { participant: true, event: true, ticketType: true } } },
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

    const participant = ticket.booking.participant;
    const eventTitle = ticket.booking.event.title;
    const eventDate = ticket.booking.event.startDate.toLocaleDateString('fr-FR');
    const appUrl = (process.env.FRONTEND_URL ?? process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
    const feedbackExpiry = new Date();
    feedbackExpiry.setDate(feedbackExpiry.getDate() + 30);

    // ── 1. Certificat principal (payeur) ─────────────────────────────────────
    const ticketYear = ticket.ticketNumber.split('-')[1] ?? String(new Date().getFullYear());
    const ticketSeq = ticket.ticketNumber.split('-')[2] ?? '000000';
    const certificateNumber = `WCG-CERT-${ticketYear}-${ticketSeq}`;
    const certificateToken = crypto.randomUUID();

    const verifyUrl = `${appUrl}/certificat/${certificateToken}`;
    let qrCodeDataUrl: string | undefined;
    try { qrCodeDataUrl = await generatePlainQRCode(verifyUrl); } catch { /* sans QR */ }

    const payerPdfBuffer = await generateCertificatePDF({
      participantName: `${participant.firstName} ${participant.lastName}`,
      eventTitle,
      eventDate,
      certificateNumber,
      qrCodeDataUrl,
    });
    const certificateUrl = await uploadPdf('certificates', `${certificateNumber}.pdf`, payerPdfBuffer);

    const certData = { certificateSent: true, certificateUrl, certificateNumber, certificateToken };
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: certData as Parameters<typeof prisma.ticket.update>[0]['data'],
    });

    // ── 2. Participants secondaires (depuis metadata) — tous joints au mail payeur ──
    const metaPs: ParticipantMeta[] = (
      (participant.metadata as { participants?: ParticipantMeta[] } | null)?.participants ?? []
    ).filter((p): p is ParticipantMeta => p !== null && p !== undefined);

    // Participants secondaires = tous sauf le premier (index 0 = toujours le payeur)
    const secondaryPs = metaPs.slice(1);

    // Génération des PDFs secondaires en parallèle (buffer uniquement — pas d'upload)
    const extraCertificates: ExtraCertificate[] = (
      await Promise.allSettled(
        secondaryPs.map(async (p, i) => {
          const certNum = `${certificateNumber}-P${i + 2}`;
          const buffer = await generateCertificatePDF({
            participantName: `${p.firstName} ${p.lastName}`,
            eventTitle,
            eventDate,
            certificateNumber: certNum,
            qrCodeDataUrl: undefined,
          });
          return { name: `${p.firstName} ${p.lastName}`, buffer };
        }),
      )
    )
      .filter((r): r is PromiseFulfilledResult<ExtraCertificate> => r.status === 'fulfilled')
      .map((r) => r.value);

    // ── 3. Un seul email au payeur avec TOUS les certificats en pièces jointes ──
    if (participant.email) {
      try {
        const feedbackToken = crypto.randomUUID();
        await prisma.feedbackLink.create({
          data: { eventId: ticket.booking.eventId, bookingId: ticket.booking.id, token: feedbackToken, expiresAt: feedbackExpiry },
        });
        await this.emailService.sendCertificateWithFeedback({
          email: participant.email,
          participantName: `${participant.firstName} ${participant.lastName}`,
          certificateNumber,
          pdfBuffer: payerPdfBuffer,
          downloadUrl: buildCertDownloadUrl(certificateNumber),
          feedbackToken,
          eventTitle,
          extraCertificates,
        });
      } catch (err) {
        logger.error({ err }, 'Erreur envoi email payeur');
      }
    }

    const emailsSent = participant.email ? 1 : 0;
    await logAudit({
      action: 'TICKET_SCANNED',
      userId: scannerId,
      resource: 'ticket',
      resourceId: ticketId,
      details: {
        certificateNumber,
        emailsSent,
        extrasJoints: extraCertificates.length,
      },
      result: 'success',
    });

    logger.info({ ticketNumber: ticket.ticketNumber, certificateNumber, emailsSent }, 'Ticket scanne');
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
          type CertFields = { certificateUrl: string | null; certificateNumber: string | null; certificateToken: string | null };
          const certTicket = ticket as typeof ticket & CertFields;
          let certificateUrl: string | null = certTicket.certificateUrl;
          let certificateNumber: string | null = certTicket.certificateNumber;
          let certificateToken: string | null = certTicket.certificateToken;

          const eventTitle = ticket.booking.event.title;
          const eventDate = ticket.booking.event.startDate.toLocaleDateString('fr-FR');
          const appUrl = (process.env.FRONTEND_URL ?? process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
          const feedbackExpiry = new Date();
          feedbackExpiry.setDate(feedbackExpiry.getDate() + 30);

          // ── 1. Certificat principal (payeur) ──────────────────────────────
          if (!certificateUrl) {
            const ticketYear = ticket.ticketNumber.split('-')[1] ?? String(new Date().getFullYear());
            const ticketSeq = ticket.ticketNumber.split('-')[2] ?? '000000';
            certificateNumber = `WCG-CERT-${ticketYear}-${ticketSeq}`;
            certificateToken = crypto.randomUUID();

            const verifyUrl = `${appUrl}/certificat/${certificateToken}`;
            let qrCodeDataUrl: string | undefined;
            try { qrCodeDataUrl = await generatePlainQRCode(verifyUrl); } catch { /* sans QR */ }

            const pdfBuffer = await generateCertificatePDF({
              participantName: `${participant.firstName} ${participant.lastName}`,
              eventTitle,
              eventDate,
              certificateNumber,
              qrCodeDataUrl,
            });
            certificateUrl = await uploadPdf('certificates', `${certificateNumber}.pdf`, pdfBuffer);
            const certData = { certificateSent: true, certificateUrl, certificateNumber, certificateToken };
            await prisma.ticket.update({ where: { id: ticketId }, data: certData as Parameters<typeof prisma.ticket.update>[0]['data'] });
          }

          // ── 2. Participants secondaires — tous joints au mail payeur ─────────
          const metaPs: ParticipantMeta[] = (
            (participant.metadata as { participants?: ParticipantMeta[] } | null)?.participants ?? []
          ).filter((p): p is ParticipantMeta => p !== null && p !== undefined);
          // Participants secondaires = tous sauf le premier (index 0 = toujours le payeur)
          const secondaryPs = metaPs.slice(1);

          // Génère les PDFs secondaires (buffer uniquement — joints à l'email payeur)
          const extraCertificates: ExtraCertificate[] = (
            await Promise.allSettled(
              secondaryPs.map(async (p, i) => {
                const certNum = `${certificateNumber}-P${i + 2}`;
                const buffer = await generateCertificatePDF({
                  participantName: `${p.firstName} ${p.lastName}`,
                  eventTitle,
                  eventDate,
                  certificateNumber: certNum,
                  qrCodeDataUrl: undefined,
                });
                return { name: `${p.firstName} ${p.lastName}`, buffer };
              }),
            )
          )
            .filter((r): r is PromiseFulfilledResult<ExtraCertificate> => r.status === 'fulfilled')
            .map((r) => r.value);

          // ── 3. Un seul email au payeur avec TOUS les certificats ─────────────
          if (participant.email && certificateUrl && certificateNumber) {
            const freshUrl = await getSignedUrl('certificates', `${certificateNumber}.pdf`) ?? certificateUrl;
            const feedbackToken = crypto.randomUUID();
            await prisma.feedbackLink.create({
              data: { eventId: ticket.booking.eventId, bookingId: ticket.booking.id, token: feedbackToken, expiresAt: feedbackExpiry },
            });
            await this.emailService.sendCertificateWithFeedback({
              email: participant.email,
              participantName: `${participant.firstName} ${participant.lastName}`,
              certificateNumber,
              pdfUrl: freshUrl,
              downloadUrl: buildCertDownloadUrl(certificateNumber),
              feedbackToken,
              eventTitle,
              extraCertificates,
            });
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
