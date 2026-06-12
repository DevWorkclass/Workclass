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
import { EmailService, type ExtraCertificate } from '../../notifications/services/email.service';

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

    // ── 2. Participants secondaires (depuis metadata) ─────────────────────────
    const metaPs: ParticipantMeta[] =
      (participant.metadata as { participants?: ParticipantMeta[] } | null)?.participants ?? [];

    // Exclure le payeur (déjà traité) pour éviter les doublons
    const payerEmailNorm = participant.email.trim().toLowerCase();
    const others = metaPs.filter(
      (p) => !p.email || p.email.trim().toLowerCase() !== payerEmailNorm,
    );

    // Génération des PDFs secondaires en parallèle
    const otherCerts = (
      await Promise.allSettled(
        others.map(async (p, i) => {
          const certNum = `${certificateNumber}-P${i + 2}`;
          const buf = await generateCertificatePDF({
            participantName: `${p.firstName} ${p.lastName}`,
            eventTitle,
            eventDate,
            certificateNumber: certNum,
            qrCodeDataUrl: undefined, // pas de QR pour les certificats secondaires
          });
          return { name: `${p.firstName} ${p.lastName}`, email: p.email?.trim() || null, certNum, buf };
        }),
      )
    )
      .filter((r): r is PromiseFulfilledResult<{ name: string; email: string | null; certNum: string; buf: Buffer }> => r.status === 'fulfilled')
      .map((r) => r.value);

    // Séparer ceux avec / sans email
    const othersWithEmail = otherCerts.filter((c) => c.email);
    const othersNoEmail = otherCerts.filter((c) => !c.email);

    // Pièces jointes extras (participants sans email) → jointes à l'email du payeur
    const extraAttachments: ExtraCertificate[] = othersNoEmail.map((c) => ({
      name: c.name,
      buffer: c.buf,
    }));

    // ── 3. Email payeur : certificat + feedback + extras ──────────────────────
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
          pdfUrl: certificateUrl,
          feedbackToken,
          eventTitle,
          extraCertificates: extraAttachments,
        });
      } catch (err) {
        logger.error({ err }, 'Erreur envoi email payeur');
      }
    }

    // ── 4. Emails participants secondaires avec email : cert + feedback ────────
    await Promise.allSettled(
      othersWithEmail.map(async (c) => {
        try {
          const certUrl = await uploadPdf('certificates', `${c.certNum}.pdf`, c.buf);
          const feedbackToken = crypto.randomUUID();
          await prisma.feedbackLink.create({
            data: { eventId: ticket.booking.eventId, bookingId: ticket.booking.id, token: feedbackToken, expiresAt: feedbackExpiry },
          });
          await this.emailService.sendCertificateWithFeedback({
            email: c.email!,
            participantName: c.name,
            certificateNumber: c.certNum,
            pdfUrl: certUrl,
            feedbackToken,
            eventTitle,
          });
        } catch (err) {
          logger.error({ err, name: c.name }, 'Erreur envoi email participant secondaire');
        }
      }),
    );

    const emailsSent = (participant.email ? 1 : 0) + othersWithEmail.length;
    await logAudit({
      action: 'TICKET_SCANNED',
      userId: scannerId,
      resource: 'ticket',
      resourceId: ticketId,
      details: {
        certificateNumber,
        emailsSent,
        extrasJoints: othersNoEmail.length,
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
            const feedbackToken = crypto.randomUUID();
            const feedbackExpiry = new Date();
            feedbackExpiry.setDate(feedbackExpiry.getDate() + 30);
            await prisma.feedbackLink.create({
              data: { eventId: ticket.booking.eventId, bookingId: ticket.booking.id, token: feedbackToken, expiresAt: feedbackExpiry },
            });
            await this.emailService.sendCertificateWithFeedback({
              email: participant.email,
              participantName: `${participant.firstName} ${participant.lastName}`,
              certificateNumber,
              pdfUrl: certificateUrl,
              feedbackToken,
              eventTitle: ticket.booking.event.title,
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
