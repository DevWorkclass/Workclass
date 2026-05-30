/**
 * Template email — Invitation à laisser un avis.
 */

export interface FeedbackLinkEmailData {
  participantFirstName: string;
  eventTitle: string;
  feedbackUrl: string; // /avis/:token
}

export function renderFeedbackLinkEmail(_data: FeedbackLinkEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  throw new Error('Not implemented — ÉTAPE 4 backend');
}
