/**
 * Service booking — logique métier des réservations.
 *  - Vérification de l'événement (publié) et du type de billet
 *  - Vérification du quota (atomique au sens compteur)
 *  - Calcul du total (prix billet + options)
 *  - Génération de la référence WCG-RES-XXXXXX
 *  - Audit log
 */

import { BookingRepository } from '../repositories/booking.repository';
import { prisma } from '../../../config/database';
import type { BookingInput } from '../types/booking.types';
import { ValidationError, NotFoundError } from '../../shared/errors/types/error.types';
import { logAudit } from '../../shared/audit/services/audit.service';
import { generateSecureToken } from '../../../utils/crypto';
import { TicketGeneratorService } from '../../tickets/services/ticket-generator.service';
import { EmailService } from '../../notifications/services/email.service';

const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export class BookingService {
  private readonly repository = new BookingRepository();
  private readonly ticketGenerator = new TicketGeneratorService();
  private readonly emailService = new EmailService();

  /**
   * Crée une réservation (publique).
   */
  async create(data: BookingInput) {
    const event = await prisma.event.findUnique({ where: { id: data.eventId } });
    if (!event || event.status !== 'published') {
      throw new ValidationError('Evenement non disponible');
    }

    const ticketType = await prisma.ticketType.findUnique({
      where: { id: data.ticketTypeId },
    });
    if (!ticketType || !ticketType.isActive) {
      throw new ValidationError('Type de billet invalide');
    }
    if (ticketType.eventId !== event.id) {
      throw new ValidationError('Type de billet incompatible avec l\'evenement');
    }

    const optionsTotal = data.options?.reduce((sum, opt) => sum + opt.price, 0) ?? 0;
    // Le prix du billet est multiplié par le nombre de places réservées.
    const totalAmount = Number(ticketType.price) * data.quantity + optionsTotal;

    const reference = this.buildReference();

    // Réservation des places ATOMIQUE (UPDATE ... WHERE sold + N <= quota) :
    // empêche le surbooking sous charge concurrente, sans transaction interactive
    // (incompatible avec le pooler pgBouncer).
    const claimed = await this.repository.claimQuota(data.ticketTypeId, data.quantity);
    if (!claimed) {
      throw new ValidationError('Quota epuise pour ce type de billet');
    }

    let booking;
    try {
      booking = await this.repository.create({ ...data, reference, totalAmount });
    } catch (err) {
      // Compensation : libérer les places réservées si la création échoue.
      await this.repository.releaseQuota(data.ticketTypeId, data.quantity);
      throw err;
    }

    await logAudit({
      action: 'BOOKING_CREATED',
      resource: 'booking',
      resourceId: booking.id,
      details: { reference, eventId: data.eventId, quantity: data.quantity, amount: totalAmount },
      result: 'success',
    });

    return booking;
  }

  async getByReference(reference: string) {
    const booking = await this.repository.findByReference(reference);
    if (!booking) throw new NotFoundError('Reservation');
    return booking;
  }

  async validateBooking(id: string, adminId: string) {
    const booking = await this.repository.findById(id);
    if (!booking) throw new NotFoundError('Reservation');
    if (booking.status !== 'pending') {
      throw new ValidationError('Reservation non validable');
    }
    const updated = await this.repository.updateStatus(id, 'confirmed');

    try {
      // Génération du billet
      const { ticketNumber, pdfUrl } = await this.ticketGenerator.generateTicket(id);

      // Envoi de l'email (uniquement si une adresse de contact est disponible).
      if (updated.participant?.email) {
        await this.emailService.sendTicketConfirmation(
          updated.participant.email,
          ticketNumber,
          pdfUrl
        );
      }
    } catch (err) {
      // Si la génération échoue (ex: billet déjà généré), on continue sans bloquer la validation
      console.error('Erreur generation/envoi billet:', err);
    }

    await logAudit({
      action: 'BOOKING_VALIDATED',
      userId: adminId,
      resource: 'booking',
      resourceId: id,
      result: 'success',
    });
    return updated;
  }

  /**
   * Annule une réservation (admin).
   */
  async cancelBooking(id: string, adminId: string) {
    const booking = await this.repository.findById(id);
    if (!booking) throw new NotFoundError('Reservation');
    const updated = await this.repository.updateStatus(id, 'cancelled');
    // Libère les places réservées (seulement si la résa était encore active).
    if (booking.status !== 'cancelled') {
      await this.repository.releaseQuota(booking.ticketTypeId, booking.quantity);
    }
    await logAudit({
      action: 'BOOKING_CANCELLED',
      userId: adminId,
      resource: 'booking',
      resourceId: id,
      result: 'success',
    });
    return updated;
  }

  async listBookings(params: {
    page?: number;
    limit?: number;
    status?: 'pending' | 'confirmed' | 'cancelled';
    eventId?: string;
  }) {
    return this.repository.findAll(params);
  }

  /**
   * Génère une référence `WCG-RES-XXXXXX` avec un alphabet sans ambiguïtés.
   * Utilise `generateSecureToken` comme source d'entropie puis mappe vers l'alphabet.
   */
  private buildReference(): string {
    const raw = generateSecureToken(6); // 12 caractères hex
    let suffix = '';
    for (let i = 0; i < 6; i++) {
      const idx = parseInt(raw.substring(i * 2, i * 2 + 2), 16) % REFERENCE_ALPHABET.length;
      suffix += REFERENCE_ALPHABET[idx];
    }
    return `WCG-RES-${suffix}`;
  }
}
