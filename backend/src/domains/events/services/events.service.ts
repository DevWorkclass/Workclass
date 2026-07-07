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
 * Ajoute les places (total / vendues / disponibles / en attente) à partir des types
 * de billets.
 *
 * Règle métier (choix produit) :
 *  - `seatsSold`      = places VALIDÉES en admin (status = 'confirmed').
 *  - `seatsAvailable` = quota − seatsSold (les pending n'occupent PAS la place côté affichage).
 *  - `seatsPending`   = places réservées en attente de validation (status = 'pending'),
 *                       exposées séparément pour information.
 *
 * NB : la garantie anti-surbooking reste assurée par `claimQuota` (UPDATE atomique
 * sur `sold_count`), mais le décompte AFFICHÉ aux visiteurs ne baisse qu'à la
 * validation.
 */
function withAvailability<T extends { ticketTypes?: TicketTypeSeats[] }>(
  event: T,
  confirmedByType: Map<string, number>,
  pendingByType: Map<string, number>,
) {
  const seatsTotal = (event.ticketTypes ?? []).reduce((sum, t) => sum + t.quota, 0);
  const seatsSold = (event.ticketTypes ?? []).reduce(
    (sum, t) => sum + (confirmedByType.get(t.id) ?? 0),
    0,
  );
  const seatsPending = (event.ticketTypes ?? []).reduce(
    (sum, t) => sum + (pendingByType.get(t.id) ?? 0),
    0,
  );
  return {
    ...event,
    seatsTotal,
    seatsSold,
    seatsPending,
    seatsAvailable: Math.max(seatsTotal - seatsSold, 0),
  };
}

/**
 * Agrège la quantité réservée par type de billet et par statut (confirmed / pending).
 * Une seule requête SQL pour l'ensemble de la base.
 */
async function fetchLiveByTicketTypeAndStatus(): Promise<{
  confirmed: Map<string, number>;
  pending: Map<string, number>;
}> {
  const rows = await prisma.booking.groupBy({
    by: ['ticketTypeId', 'status'],
    _sum: { quantity: true },
  });
  const confirmed = new Map<string, number>();
  const pending = new Map<string, number>();
  for (const r of rows) {
    const qty = r._sum.quantity ?? 0;
    if (r.status === 'confirmed') {
      confirmed.set(r.ticketTypeId, (confirmed.get(r.ticketTypeId) ?? 0) + qty);
    } else if (r.status === 'pending') {
      pending.set(r.ticketTypeId, (pending.get(r.ticketTypeId) ?? 0) + qty);
    }
  }
  return { confirmed, pending };
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
    const [events, agg] = await Promise.all([
      this.repository.findAll(),
      fetchLiveByTicketTypeAndStatus(),
    ]);
    return events.map((e) => withAvailability(e, agg.confirmed, agg.pending));
  }

  /** Liste publique des événements publiés (avec places disponibles). */
  async getPublicEvents() {
    const [events, agg] = await Promise.all([
      this.repository.findPublished(),
      fetchLiveByTicketTypeAndStatus(),
    ]);
    // Le livret ressources ne doit pas fuiter publiquement (lien réservé à l'envoi des certificats).
    return events.map((e) => {
      const { resourceBookletUrl: _booklet, ...rest } = e as typeof e & { resourceBookletUrl?: string | null };
      return withAvailability(rest, agg.confirmed, agg.pending);
    });
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

  /** Enregistre l'URL du livret ressources d'un événement (après upload Storage). */
  async setBooklet(eventId: string, url: string | null, userId: string) {
    const existing = await this.repository.findById(eventId);
    if (!existing) throw new NotFoundError('Evenement');

    await this.repository.update(eventId, { resourceBookletUrl: url });

    await logAudit({
      action: url ? 'EVENT_BOOKLET_SET' : 'EVENT_BOOKLET_REMOVE',
      userId,
      resource: 'event',
      resourceId: eventId,
      result: 'success',
    });

    return { id: eventId, resourceBookletUrl: url };
  }
}
