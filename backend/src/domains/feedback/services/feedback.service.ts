/**
 * Service feedback.
 *  - generateLink(bookingId) : crée un FeedbackLink avec token unique + envoie l'email.
 *  - submitFeedback(token)   : valide token + insère FeedbackResponse + marque link utilisé.
 *  - listFeedback(...)       : liste paginée pour modération admin.
 *  - moderate(id, action)    : approuve ou rejette un avis.
 *
 * Adaptation au schéma : FeedbackLink utilise bookingId+eventId (pas participantId).
 * FeedbackResponse.moderationStatus (pas .status).
 */

import { prisma } from '../../../config/database';
import { generateSecureToken } from '../../../utils/crypto';
import { EmailService } from '../../notifications/services/email.service';
import {
  NotFoundError,
  ValidationError,
} from '../../shared/errors/types/error.types';
import { logAudit } from '../../shared/audit/services/audit.service';
import type { Prisma, ModerationStatus } from '@prisma/client';

const FEEDBACK_VALIDITY_DAYS = 7;

interface SubmitInput {
  ratings: Record<string, number>;
  comment?: string;
}

export class FeedbackService {
  private readonly emailService = new EmailService();

  /**
   * Génère un lien feedback pour une réservation confirmée + envoie l'email.
   */
  async generateLink(bookingId: string): Promise<{ token: string; url: string }> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { participant: true, event: true },
    });
    if (!booking) throw new NotFoundError('Reservation');
    if (!booking.participant) throw new NotFoundError('Participant');

    const token = generateSecureToken(32);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + FEEDBACK_VALIDITY_DAYS);

    await prisma.feedbackLink.create({
      data: {
        eventId: booking.eventId,
        bookingId: booking.id,
        token,
        used: false,
        expiresAt,
      },
    });

    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
    const url = `${appUrl}/avis/${token}`;

    await this.emailService.sendFeedbackLink(booking.participant.email, token);

    await logAudit({
      action: 'FEEDBACK_LINK_GENERATED',
      resource: 'feedback_link',
      resourceId: booking.id,
      details: { eventId: booking.eventId },
      result: 'success',
    });

    return { token, url };
  }

  /**
   * Vérifie qu'un token est valide (non utilisé, non expiré).
   * Public — pour pré-affichage du formulaire côté frontend.
   */
  async validateToken(token: string) {
    const link = await prisma.feedbackLink.findUnique({
      where: { token },
      include: { event: true },
    });
    if (!link) throw new NotFoundError('Lien de feedback');
    if (link.used) throw new ValidationError('Lien deja utilise');
    if (link.expiresAt < new Date()) throw new ValidationError('Lien expire');
    return { eventId: link.eventId, eventTitle: link.event.title };
  }

  async submitFeedback(token: string, data: SubmitInput): Promise<void> {
    const link = await prisma.feedbackLink.findUnique({ where: { token } });
    if (!link) throw new NotFoundError('Lien de feedback');
    if (link.used) throw new ValidationError('Lien deja utilise');
    if (link.expiresAt < new Date()) throw new ValidationError('Lien expire');

    await prisma.$transaction([
      prisma.feedbackResponse.create({
        data: {
          feedbackLinkId: link.id,
          eventId: link.eventId,
          ratings: data.ratings as unknown as Prisma.InputJsonValue,
          comment: data.comment,
          moderationStatus: 'pending',
        },
      }),
      prisma.feedbackLink.update({
        where: { id: link.id },
        data: { used: true, usedAt: new Date() },
      }),
    ]);

    await logAudit({
      action: 'FEEDBACK_SUBMITTED',
      resource: 'feedback',
      resourceId: link.id,
      result: 'success',
    });
  }

  async listFeedback(params: {
    page?: number;
    limit?: number;
    status?: ModerationStatus;
  }) {
    const { page = 1, limit = 20, status } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.FeedbackResponseWhereInput = status
      ? { moderationStatus: status }
      : {};
    const [responses, total] = await Promise.all([
      prisma.feedbackResponse.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          feedbackLink: {
            include: {
              booking: {
                include: {
                  participant: { select: { firstName: true, lastName: true } },
                },
              },
            },
          },
        },
      }),
      prisma.feedbackResponse.count({ where }),
    ]);
    return { responses, total };
  }

  async moderate(
    id: string,
    action: 'approved' | 'rejected',
    adminId: string,
  ): Promise<void> {
    await prisma.feedbackResponse.update({
      where: { id },
      data: { moderationStatus: action, moderatedAt: new Date(), moderatedBy: adminId },
    });
    await logAudit({
      action: 'FEEDBACK_MODERATED',
      userId: adminId,
      resource: 'feedback',
      resourceId: id,
      details: { newStatus: action },
      result: 'success',
    });
  }
}
