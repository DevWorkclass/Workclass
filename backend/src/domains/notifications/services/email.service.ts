/**
 * Service email.
 * Mode dev / sans `RESEND_API_KEY` : simulation via logs (pas d'envoi réseau).
 * Mode prod : envoi via Resend SDK (import dynamique pour éviter le coût en dev).
 */

import { logger } from '../../../utils/logger';

interface EmailAttachment {
  filename: string;
  path: string;
}

interface EmailData {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

const EMAIL_FROM =
  process.env.EMAIL_FROM ??
  process.env.EMAIL_FROM_ADDRESS ??
  'no-reply@workclass-gabon.com';

export class EmailService {
  /**
   * Envoi générique. Simulé en dev ou si `RESEND_API_KEY` absent.
   */
  async send(data: EmailData): Promise<void> {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev || !process.env.RESEND_API_KEY) {
      logger.info(
        {
          channel: 'email',
          mode: 'simulation',
          to: data.to,
          subject: data.subject,
          attachments: data.attachments?.map((a) => a.filename) ?? [],
        },
        '[email] simulation (RESEND_API_KEY absent ou dev)',
      );
      return;
    }

    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: EMAIL_FROM,
        to: data.to,
        subject: data.subject,
        html: data.html,
        attachments: data.attachments,
      });
      logger.info({ to: data.to }, 'Email envoye');
    } catch (error) {
      logger.error({ err: error }, 'Erreur envoi email');
      throw error;
    }
  }

  async sendTicketConfirmation(
    email: string,
    ticketNumber: string,
    pdfPath: string,
  ): Promise<void> {
    const html = `
      <h1>Confirmation de votre billet</h1>
      <p>Votre billet <strong>${ticketNumber}</strong> est en piece jointe.</p>
      <p>Presentez le QR code a l'entree de l'evenement.</p>
    `;
    await this.send({
      to: email,
      subject: 'Votre billet Work Class Gabon',
      html,
      attachments: [{ filename: `${ticketNumber}.pdf`, path: pdfPath }],
    });
  }

  async sendCertificate(
    email: string,
    certificateNumber: string,
    pdfPath: string,
  ): Promise<void> {
    const html = `
      <h1>Votre certificat de participation</h1>
      <p>Merci d'avoir participe a Work Class Gabon.</p>
      <p>Votre certificat <strong>${certificateNumber}</strong> est en piece jointe.</p>
    `;
    await this.send({
      to: email,
      subject: 'Votre certificat de participation',
      html,
      attachments: [{ filename: `${certificateNumber}.pdf`, path: pdfPath }],
    });
  }

  async sendFeedbackLink(email: string, token: string): Promise<void> {
    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
    const feedbackUrl = `${appUrl}/avis/${token}`;
    const html = `
      <h1>Votre avis compte</h1>
      <p>Aidez-nous a ameliorer Work Class Gabon en repondant a un court questionnaire.</p>
      <p><a href="${feedbackUrl}">Donner mon avis</a></p>
    `;
    await this.send({
      to: email,
      subject: 'Donnez votre avis sur Work Class Gabon',
      html,
    });
  }
}
