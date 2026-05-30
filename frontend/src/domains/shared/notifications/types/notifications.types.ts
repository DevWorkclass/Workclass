/**
 * Types du domaine `notifications` (partagé).
 * Emails transactionnels (v1) — extension SMS / push possible v2.
 */

export type NotificationChannel = 'email';

export type NotificationTemplate =
  | 'booking_confirmation'
  | 'ticket_delivery'
  | 'event_reminder'
  | 'scan_certificate'
  | 'feedback_invitation';

export interface NotificationPayload<T = Record<string, unknown>> {
  to: string;
  channel: NotificationChannel;
  template: NotificationTemplate;
  locale: 'fr' | 'en';
  data: T;
  attachments?: NotificationAttachment[];
}

export interface NotificationAttachment {
  filename: string;
  contentType: string;
  url?: string;
  base64?: string;
}

export interface NotificationSendResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
}
