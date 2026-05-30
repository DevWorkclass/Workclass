/**
 * Types du domaine `event` (public).
 * Source de vérité pour les événements affichés côté public.
 */

export type EventStatus = 'draft' | 'published' | 'archived';

export interface EventProgramItem {
  time: string;
  title: string;
  description?: string;
}

export interface Speaker {
  name: string;
  role: string;
  bio?: string;
  avatar?: string;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
  status: EventStatus;
  coverImage?: string;
  program?: EventProgramItem[];
  speakers?: Speaker[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EventSummary {
  id: string;
  title: string;
  slug: string;
  location: string;
  startDate: Date;
  endDate: Date;
  coverImage?: string;
}
