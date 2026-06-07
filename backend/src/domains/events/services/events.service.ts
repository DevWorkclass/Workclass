import { EventsRepository } from '../repositories/events.repository';
import type { CreateEventInput } from '../validators/events.validator';
import { logAudit } from '../../shared/audit/services/audit.service';

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
    return this.repository.findAll();
  }
}
