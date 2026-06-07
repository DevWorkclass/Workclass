/**
 * Service exports — génération des listes (réservations / participants) en
 * CSV ou PDF. Toute la logique de composition vit ici (règle : métier 100 % backend).
 */

import { BookingRepository } from '../../booking/repositories/booking.repository';
import { buildCsv } from './csv.util';
import { generateListPDF } from '../../../utils/pdf-generator';

export type ExportFormat = 'csv' | 'pdf';

export interface ExportFilters {
  status?: 'pending' | 'confirmed' | 'cancelled';
  eventId?: string;
}

export interface ExportFile {
  filename: string;
  mime: string;
  buffer: Buffer;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  cancelled: 'Annulée',
};

const PAYMENT_LABELS: Record<string, string> = {
  pending: 'En attente',
  paid: 'Payé',
  failed: 'Échoué',
  refunded: 'Remboursé',
};

function formatDate(value: Date | null | undefined): string {
  if (!value) return '';
  return new Date(value).toLocaleString('fr-FR', { timeZone: 'Africa/Libreville' });
}

export class ExportsService {
  private readonly bookings = new BookingRepository();

  /** Export de la liste des réservations. */
  async exportBookings(format: ExportFormat, filters: ExportFilters): Promise<ExportFile> {
    const rows = await this.bookings.findForExport(filters);

    const headers = [
      'Référence',
      'Événement',
      'Type de billet',
      'Quantité',
      'Statut',
      'Paiement',
      'Montant (XAF)',
      'Participant',
      'Email',
      'Téléphone',
      'Créée le',
    ];

    const data = rows.map((b) => [
      b.reference,
      b.event?.title ?? '',
      b.ticketType?.name ?? '',
      String(b.quantity),
      STATUS_LABELS[b.status] ?? b.status,
      PAYMENT_LABELS[b.paymentStatus] ?? b.paymentStatus,
      String(b.totalAmount),
      b.participant ? `${b.participant.firstName} ${b.participant.lastName}` : '',
      b.participant?.email ?? '',
      b.participant?.phone ?? '',
      formatDate(b.createdAt),
    ]);

    return this.render('reservations', 'Liste des réservations', format, headers, data);
  }

  /** Export de la liste des participants (centré sur la personne). */
  async exportParticipants(format: ExportFormat, filters: ExportFilters): Promise<ExportFile> {
    // Réutilise le même fetch ; on ignore le filtre `status` ici (tous participants).
    const rows = await this.bookings.findForExport({ eventId: filters.eventId });

    const headers = [
      'Nom',
      'Prénom',
      'Email',
      'Téléphone',
      'Entreprise',
      'Poste',
      'Événement',
      'Type de billet',
      'Places',
      'Référence',
      'Présent (scanné)',
      'Date de scan',
    ];

    const data = rows
      .filter((b) => b.participant)
      .map((b) => [
        b.participant!.lastName,
        b.participant!.firstName,
        b.participant!.email,
        b.participant!.phone,
        b.participant!.company ?? '',
        b.participant!.position ?? '',
        b.event?.title ?? '',
        b.ticketType?.name ?? '',
        String(b.quantity),
        b.reference,
        b.ticket?.scannedAt ? 'Oui' : 'Non',
        formatDate(b.ticket?.scannedAt),
      ]);

    return this.render('participants', 'Liste des participants', format, headers, data);
  }

  /** Sérialise les données dans le format demandé. */
  private async render(
    slug: string,
    title: string,
    format: ExportFormat,
    headers: string[],
    rows: string[][],
  ): Promise<ExportFile> {
    const date = new Date().toISOString().slice(0, 10);
    if (format === 'pdf') {
      const buffer = await generateListPDF(title, headers, rows);
      return { filename: `${slug}-${date}.pdf`, mime: 'application/pdf', buffer };
    }
    const csv = buildCsv(headers, rows);
    return { filename: `${slug}-${date}.csv`, mime: 'text/csv; charset=utf-8', buffer: Buffer.from(csv, 'utf-8') };
  }
}
