/**
 * Service de génération de tickets.
 *  1. Récupère la réservation (avec participant + event + ticketType).
 *  2. Génère un numéro WCG-YYYY-NNNNNN unique.
 *  3. Crée le ticket en DB (qrCode temporairement vide).
 *  4. Signe le QR avec HMAC + génère le PDF.
 *  5. Écrit le PDF sous LOCAL_STORAGE_PATH/tickets/.
 *  6. Met à jour le ticket avec qrCode + pdfUrl.
 */

import { prisma } from '../../../config/database';
import { generateTicketPDF } from '../../../utils/pdf-generator';
import { generateQRCode } from '../../../utils/qr-generator';
import { logger } from '../../../utils/logger';
import { uploadPdf } from '../../shared/storage/storage.service';
import { NotFoundError, ConflictError } from '../../shared/errors/types/error.types';
import type { TicketGenerationResult } from '../types/tickets.types';

export class TicketGeneratorService {
  /**
   * Liste paginée des billets (gestion des certificats côté admin).
   * Inclut participant, événement et état du certificat.
   */
  async listTickets(params: { page?: number; limit?: number }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;
    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          booking: {
            include: {
              participant: { select: { firstName: true, lastName: true, email: true } },
              event: { select: { title: true } },
            },
          },
        },
      }),
      prisma.ticket.count(),
    ]);
    return { tickets, total };
  }

  async generateTicket(bookingId: string): Promise<TicketGenerationResult> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { participant: true, event: true, ticketType: true, ticket: true },
    });
    if (!booking) throw new NotFoundError('Reservation');
    if (booking.ticket) throw new ConflictError('Billet deja genere');
    if (!booking.participant) throw new NotFoundError('Participant');

    const year = new Date().getFullYear();
    const ticketCount = await prisma.ticket.count();
    const ticketNumber = `WCG-${year}-${(ticketCount + 1).toString().padStart(6, '0')}`;

    // Création initiale (qrCode rempli après génération de la data-URL)
    const ticket = await prisma.ticket.create({
      data: { bookingId: booking.id, ticketNumber, qrCode: '' },
    });

    // Signature HMAC + génération QR data-URL
    const qrCodeDataUrl = await generateQRCode(ticket.id);

    // Génération du PDF
    const pdfBuffer = await generateTicketPDF({
      ticketNumber,
      eventTitle: booking.event.title,
      eventDate: booking.event.startDate.toLocaleDateString('fr-FR'),
      eventLocation: booking.event.location,
      participantName: `${booking.participant.firstName} ${booking.participant.lastName}`,
      participantEmail: booking.participant.email,
      ticketType: booking.ticketType.name,
      qrCodeDataUrl,
    });

    // Stockage (Supabase Storage en prod, disque local en dev)
    const pdfUrl = await uploadPdf('tickets', `${ticketNumber}.pdf`, pdfBuffer);

    // Mise à jour finale
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { qrCode: qrCodeDataUrl, pdfUrl },
    });

    logger.info({ ticketNumber, bookingId }, 'Billet genere');
    return { ticketNumber, pdfUrl, qrCode: qrCodeDataUrl };
  }
}
