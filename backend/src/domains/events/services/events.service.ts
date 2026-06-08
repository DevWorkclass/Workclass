import { EventsRepository } from '../repositories/events.repository';
import type { CreateEventInput, UpdateEventInput } from '../validators/events.validator';
import { logAudit } from '../../shared/audit/services/audit.service';
import { NotFoundError, ValidationError } from '../../shared/errors/types/error.types';

interface TicketTypeSeats {
  quota: number;
  soldCount: number;
}

/** Ajoute les places (total / vendues / disponibles) à partir des types de billets. */
function withAvailability<T extends { ticketTypes?: TicketTypeSeats[] }>(event: T) {
  const seatsTotal = (event.ticketTypes ?? []).reduce((sum, t) => sum + t.quota, 0);
  const seatsSold = (event.ticketTypes ?? []).reduce((sum, t) => sum + t.soldCount, 0);
  return {
    ...event,
    seatsTotal,
    seatsSold,
    seatsAvailable: Math.max(seatsTotal - seatsSold, 0),
  };
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
      program: data.program || [],
      speakers: data.speakers || [],
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
    const events = await this.repository.findAll();
    return events.map(withAvailability);
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
    });

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
