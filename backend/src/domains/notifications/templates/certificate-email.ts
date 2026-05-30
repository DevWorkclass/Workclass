/**
 * Template email — Certificat après scan.
 */

export interface CertificateEmailData {
  participantFirstName: string;
  eventTitle: string;
  certificateUrl: string;
}

export function renderCertificateEmail(_data: CertificateEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  throw new Error('Not implemented — ÉTAPE 4 backend');
}
