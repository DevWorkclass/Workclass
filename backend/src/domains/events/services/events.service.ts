import { EventsRepository } from '../repositories/events.repository';
import type { CreateEventInput, UpdateEventInput } from '../validators/events.validator';
import { logAudit } from '../../shared/audit/services/audit.service';
import { NotFoundError, ValidationError } from '../../shared/errors/types/error.types';
import { prisma } from '../../../config/database';

interface TicketTypeSeats {
  id: string;
  quota: number;
  soldCount: number;
}

/**
 * Ajoute les places (total / vendues / disponibles) à partir des types de billets.
 * Le « vendu » est calculé EN LIVE depuis la table `bookings` (status ≠ cancelled),
 * jamais depuis la colonne dénormalisée `sold_count` — celle-ci peut diverger si
 * des réservations sont effacées en SQL direct sans passer par le service.
 */
function withAvailability<T extends { ticketTypes?: TicketTypeSeats[] }>(
  event: T,
  liveSoldByTicketType: Map<string, number>,
) {
  const seatsTotal = (event.ticketTypes ?? []).reduce((sum, t) => sum + t.quota, 0);
  const seatsSold = (event.ticketTypes ?? []).reduce(
    (sum, t) => sum + (liveSoldByTicketType.get(t.id) ?? 0),
    0,
  );
  return {
    ...event,
    seatsTotal,
    seatsSold,
    seatsAvailable: Math.max(seatsTotal - seatsSold, 0),
  };
}

/**
 * Agrège la quantité réservée par type de billet pour les bookings actifs
 * (= non annulés). Une seule requête SQL pour l'ensemble de la base.
 */
async function fetchLiveSoldByTicketType(): Promise<Map<string, number>> {
  const rows = await prisma.booking.groupBy({
    by: ['ticketTypeId'],
    where: { status: { not: 'cancelled' } },
    _sum: { quantity: true },
  });
  const map = new Map<string, number>();
  for (const r of rows) {
    map.set(r.ticketTypeId, r._sum.quantity ?? 0);
  }
  return map;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9]+/g, '-') // Remplace les caractères spéciaux par des tirets
    .replace(/^-+|-+$/g, ''); // Retire les tirets au début et à la fin
}

export class EventsService {
  private readonly repository = new EventsRepository();

  async createEvent(data: CreateEventInput, userId: string) {
    let slug = generateSlug(data.title);
    
    // Vérification basique d'unicité (on pourrait améliorer avec une boucle s'il y a conflit)
    const existing = await this.repository.findBySlug(slug);
    if (existing) {
      slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
    }

    const event = await this.repository.create({
      title: data.title,
      slug,
      description: data.description,
      location: data.location,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      coverImage: data.coverImage || null,
      recommendations: data.recommendations || null,
      status: data.status,
      program: (data.program ?? []) as object,
      speakers: (data.speakers ?? []) as object,
      // Types de billets (tarification + nombre de places) créés avec l'événement.
      ticketTypes: {
        create: (data.ticketTypes ?? []).map((t) => ({
          name: t.name,
          description: t.description || null,
          price: t.price,
          quota: t.quota,
        })),
      },
    });

    await logAudit({
      action: 'EVENT_CREATE',
      userId,
      resource: 'event',
      resourceId: event.id,
      details: { title: event.title, slug: event.slug },
      result: 'success',
    });

    return event;
  }

  async getEvents() {
    const [events, liveSold] = await Promise.all([
      this.repository.findAll(),
      fetchLiveSoldByTicketType(),
    ]);
    return events.map((e) => withAvailability(e, liveSold));
  }

  /** Liste publique des événements publiés (avec places disponibles). */
  async getPublicEvents() {
    const [events, liveSold] = await Promise.all([
      this.repository.findPublished(),
      fetchLiveSoldByTicketType(),
    ]);
    return events.map((e) => withAvailability(e, liveSold));
  }

  async updateEvent(data: UpdateEventInput, userId: string) {
    const { id, ...fields } = data;
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundError('Evenement');

    const updated = await this.repository.update(id, {
      ...(fields.title !== undefined ? { title: fields.title } : {}),
      ...(fields.description !== undefined ? { description: fields.description } : {}),
      ...(fields.location !== undefined ? { location: fields.location } : {}),
      ...(fields.startDate !== undefined ? { startDate: new Date(fields.startDate) } : {}),
      ...(fields.endDate !== undefined ? { endDate: new Date(fields.endDate) } : {}),
      ...(fields.coverImage !== undefined ? { coverImage: fields.coverImage || null } : {}),
      ...(fields.recommendations !== undefined
        ? { recommendations: fields.recommendations || null }
        : {}),
      ...(fields.status !== undefined ? { status: fields.status } : {}),
      ...(fields.program !== undefined ? { program: fields.program as object } : {}),
      ...(fields.speakers !== undefined ? { speakers: fields.speakers as object } : {}),
    });

    // Types de billets : mise à jour des existants (par id) + création des nouveaux.
    // On ne supprime pas (intégrité avec les réservations / soldCount).
    if (fields.ticketTypes !== undefined) {
      for (const t of fields.ticketTypes) {
        if (t.id) {
          await this.repository.updateTicketType(t.id, {
            name: t.name,
            description: t.description || null,
            price: t.price,
            quota: t.quota,
          });
        } else {
          await this.repository.createTicketType(id, {
            name: t.name,
            description: t.description || null,
            price: t.price,
            quota: t.quota,
          });
        }
      }
    }

    await logAudit({
      action: 'EVENT_UPDATE',
      userId,
      resource: 'event',
      resourceId: id,
      details: { title: updated.title },
      result: 'success',
    });

    return updated;
  }

  async deleteEvent(id: string, userId: string) {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundError('Evenement');
    // Refus si des réservations existent (intégrité : onDelete Restrict en base).
    if (existing._count.bookings > 0) {
      throw new ValidationError('Impossible de supprimer un evenement avec des reservations');
    }

    await this.repository.remove(id);

    await logAudit({
      action: 'EVENT_DELETE',
      userId,
      resource: 'event',
      resourceId: id,
      details: { title: existing.title },
      result: 'success',
    });

    return { id };
  }
}
