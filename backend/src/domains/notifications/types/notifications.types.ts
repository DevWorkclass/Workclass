export type NotificationTemplate =
  | 'booking_confirmation'
  | 'ticket_delivery'
  | 'event_reminder'
  | 'scan_certificate'
  | 'feedback_invitation';

export interface NotificationAttachment {
  filename: string;
  contentType: string;
  url?: string;
  base64?: string;
}

export interface EmailPayload<T = Record<string, unknown>> {
  to: string;
  template: NotificationTemplate;
  locale: 'fr' | 'en';
  data: T;
  attachments?: NotificationAttachment[];
}

export interface EmailSendResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
}
