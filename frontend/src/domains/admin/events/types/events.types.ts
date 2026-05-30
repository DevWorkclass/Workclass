/**
 * Types admin pour la gestion des événements.
 * Surcouche du type public `Event` avec actions / filtres.
 */

import type { Event, EventStatus } from '@/domains/public/event/types/event.types';

export interface AdminEventListFilters {
  status?: EventStatus;
  search?: string;
  startAfter?: Date;
  endBefore?: Date;
  page?: number;
  pageSize?: number;
}

export interface AdminEventListItem extends Event {
  bookingsCount: number;
  ticketsSoldCount: number;
}

export interface AdminEventInput {
  title: string;
  slug: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
  status: EventStatus;
  coverImage?: string;
}
