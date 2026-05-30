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
}

export interface FeedbackResponse {
  id: string;
  feedbackLinkId: string;
  eventId: string;
  ratings: FeedbackRatings;
  comment?: string;
  moderationStatus: ModerationStatus;
  createdAt: Date;
}

export interface FeedbackValidateInput {
  token: string;
}

export interface FeedbackSubmitInput {
  token: string;
  ratings: FeedbackRatings;
  comment?: string;
}
