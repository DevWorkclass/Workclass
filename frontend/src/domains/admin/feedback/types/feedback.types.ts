/**
 * Types du domaine `feedback` (admin).
 * Liens privés + collecte / modération des avis post-événement.
 */

export type ModerationStatus = 'pending' | 'approved' | 'rejected';

export interface FeedbackLink {
  id: string;
  eventId: string;
  bookingId: string;
  token: string;
  used: boolean;
  usedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
}

export interface FeedbackRatings {
  overall: number;
  organization?: number;
  content?: number;
  speakers?: number;
  venue?: number;
  [criterion: string]: number | undefined;
}

export interface FeedbackResponse {
  id: string;
  feedbackLinkId: string;
  eventId: string;
  ratings: FeedbackRatings;
  comment?: string;
  moderationStatus: ModerationStatus;
  moderatedAt?: Date;
  moderatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeedbackSubmitInput {
  token: string;
  ratings: FeedbackRatings;
  comment?: string;
}

export interface FeedbackModerationAction {
  responseId: string;
  action: 'approve' | 'reject';
  reason?: string;
}
