/**
 * Service email.
 * Mode prod : envoi via Nodemailer avec Google SMTP.
 */

import { logger } from '../../../utils/logger';
import { google } from 'googleapis';
// @ts-ignore - lib interne
import MailComposer from 'nodemailer/lib/mail-composer';

// path = URL ou chemin fichier ; content = buffer en mémoire (certificats secondaires)
interface EmailAttachment {
  filename: string;
  path?: string;
  content?: Buffer;
}

interface EmailData {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

export interface ExtraCertificate {
  name: string;
  buffer: Buffer;
}

const EMAIL_FROM =
  process.env.EMAIL_FROM ??
  process.env.EMAIL_FROM_ADDRESS ??
  'no-reply@workclass-gabon.com';

const BRAND_NAVY = '#0E2450';
const BRAND_BLUE = '#2152B6';
const BRAND_GOLD = '#D4AF37';
const BRAND_CREAM = '#F9F5EC';

function emailWrapper(body: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
  <div style="max-width:600px;margin:32px auto">
    <!-- Header -->
    <div style="background:linear-gradient(160deg,${BRAND_NAVY} 5%,${BRAND_BLUE} 95%);padding:28px 32px;border-radius:12px 12px 0 0;text-align:center">
      <p style="margin:0;font-size:22px;font-weight:bold;color:${BRAND_GOLD};letter-spacing:1px">WORK CLASS GABON</p>
    </div>
    <!-- Body -->
    <div style="background:#ffffff;padding:32px;border:1px solid #e5e7eb;border-top:none">
      ${body}
    </div>
    <!-- Footer -->
    <div style="background:${BRAND_CREAM};padding:16px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;text-align:center">
      <p style="margin:0;font-size:12px;color:#6b7280">Work Class Gabon · Libreville, Gabon</p>
      <p style="margin:4px 0 0;font-size:11px;color:#9ca3af">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
    </div>
  </div>
</body>
</html>`.trim();
}

function feedbackButton(feedbackUrl: string): string {
  return `
    <div style="margin:24px 0;padding:20px;background:${BRAND_CREAM};border-radius:10px;border-left:4px solid ${BRAND_GOLD}">
      <p style="margin:0 0 10px;font-weight:bold;color:${BRAND_NAVY}">Votre avis compte !</p>
      <p style="margin:0 0 14px;font-size:14px;color:#4b5563">Aidez-nous à améliorer Work Class Gabon en répondant à un court questionnaire (2 min).</p>
      <a href="${feedbackUrl}" style="display:inline-block;padding:10px 24px;background:${BRAND_GOLD};color:${BRAND_NAVY};text-decoration:none;border-radius:6px;font-weight:bold;font-size:14px">
        Donner mon avis →
      </a>
    </div>`;
}

export class EmailService {
  private isConfigured = false;
  private oauth2Client: any = null;

  constructor() {
    if (
      process.env.SMTP_USER &&
      process.env.GMAIL_CLIENT_ID &&
      process.env.GMAIL_CLIENT_SECRET &&
      process.env.GMAIL_REFRESH_TOKEN
    ) {
      this.isConfigured = true;
      this.oauth2Client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        'https://developers.google.com/oauthplayground'
      );
      this.oauth2Client.setCredentials({
        refresh_token: process.env.GMAIL_REFRESH_TOKEN,
      });
    }
  }

  async send(data: EmailData): Promise<void> {
    if (!this.isConfigured) {
      logger.info(
        {
          channel: 'email',
          mode: 'simulation',
          to: data.to,
          subject: data.subject,
          attachments: data.attachments?.map((a) => a.filename) ?? [],
        },
        '[email] simulation (variables OAuth2 absentes)',
      );
      return;
    }

    try {
      const mailOptions = {
        from: EMAIL_FROM,
        to: data.to,
        subject: data.subject,
        html: data.html,
        attachments: data.attachments,
      };

      const mail = new MailComposer(mailOptions);
      const messageBuffer = await mail.compile().build();
      const raw = messageBuffer
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
      await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw },
      });

      logger.info({ to: data.to }, 'Email envoye avec succes (via Gmail API)');
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
    const body = `
      <p>Bonjour,</p>
      <p>Votre réservation est confirmée. Votre billet <strong>${ticketNumber}</strong> est en pièce jointe.</p>
      <p>Présentez le QR code à l'entrée de l'événement.</p>
      <p style="margin-top:24px;color:#4b5563;font-size:14px">À bientôt !</p>
    `;
    await this.send({
      to: email,
      subject: 'Votre billet Work Class Gabon',
      html: emailWrapper(body),
      attachments: [{ filename: `${ticketNumber}.pdf`, path: pdfPath }],
    });
  }

  /**
   * Email principal après scan : certificat du participant + lien feedback dans le même email.
   * Si extraCertificates est fourni, les PDFs des participants sans email sont joints
   * avec un message demandant au payeur de les transmettre.
   */
  async sendCertificateWithFeedback(params: {
    email: string;
    participantName: string;
    certificateNumber: string;
    pdfUrl: string;
    feedbackToken: string;
    eventTitle: string;
    extraCertificates?: ExtraCertificate[];
  }): Promise<void> {
    const {
      email,
      participantName,
      certificateNumber,
      pdfUrl,
      feedbackToken,
      eventTitle,
      extraCertificates = [],
    } = params;

    const appUrl = (process.env.FRONTEND_URL ?? process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
    const feedbackUrl = `${appUrl}/avis/${feedbackToken}`;

    const extraSection =
      extraCertificates.length > 0
        ? `
        <div style="margin-top:24px;padding:16px;background:#fef3c7;border-radius:8px;border:1px solid #fbbf24">
          <p style="margin:0 0 8px;font-weight:bold;color:#92400e">📎 Certificats joints pour transmission</p>
          <p style="margin:0 0 10px;font-size:14px;color:#78350f">
            Les participants suivants n'avaient pas renseigné d'adresse email. Merci de leur transmettre leur certificat en pièce jointe :
          </p>
          <ul style="margin:0;padding-left:20px;font-size:14px;color:#78350f">
            ${extraCertificates.map((c) => `<li style="margin-bottom:4px"><strong>${c.name}</strong></li>`).join('')}
          </ul>
        </div>`
        : '';

    const body = `
      <p>Bonjour <strong>${participantName}</strong>,</p>
      <p>Merci d'avoir participé à <strong>${eventTitle}</strong>.</p>
      <p>Votre certificat de participation n° <strong>${certificateNumber}</strong> est en pièce jointe.</p>
      ${feedbackButton(feedbackUrl)}
      ${extraSection}
      <p style="margin-top:24px;color:#4b5563;font-size:14px">À bientôt sur Work Class Gabon !</p>
    `;

    const attachments: EmailAttachment[] = [
      { filename: `certificat-${certificateNumber}.pdf`, path: pdfUrl },
      ...extraCertificates.map((c) => ({
        filename: `certificat-${c.name.replace(/\s+/g, '-').toLowerCase()}.pdf`,
        content: c.buffer,
      })),
    ];

    await this.send({
      to: email,
      subject: `Votre certificat de participation — ${eventTitle}`,
      html: emailWrapper(body),
      attachments,
    });
  }

  /**
   * Email avis seul — pour les participants sans email à eux
   * (cas non utilisé actuellement, prévu pour Option C future).
   */
  async sendFeedbackOnly(email: string, feedbackToken: string, eventTitle: string): Promise<void> {
    const appUrl = (process.env.FRONTEND_URL ?? process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
    const feedbackUrl = `${appUrl}/avis/${feedbackToken}`;
    const body = `
      <p>Bonjour,</p>
      <p>Merci d'avoir participé à <strong>${eventTitle}</strong>.</p>
      ${feedbackButton(feedbackUrl)}
      <p style="margin-top:24px;color:#4b5563;font-size:14px">À bientôt sur Work Class Gabon !</p>
    `;
    await this.send({
      to: email,
      subject: `Votre avis sur ${eventTitle}`,
      html: emailWrapper(body),
    });
  }

  /** @deprecated Utiliser sendCertificateWithFeedback */
  async sendCertificate(
    email: string,
    certificateNumber: string,
    pdfPath: string,
  ): Promise<void> {
    const body = `
      <p>Bonjour,</p>
      <p>Merci d'avoir participé à Work Class Gabon.</p>
      <p>Votre certificat <strong>${certificateNumber}</strong> est en pièce jointe.</p>
    `;
    await this.send({
      to: email,
      subject: 'Votre certificat de participation',
      html: emailWrapper(body),
      attachments: [{ filename: `${certificateNumber}.pdf`, path: pdfPath }],
    });
  }

  /** @deprecated Utiliser sendCertificateWithFeedback */
  async sendFeedbackLink(email: string, token: string): Promise<void> {
    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
    const feedbackUrl = `${appUrl}/avis/${token}`;
    const body = `
      <p>Bonjour,</p>
      <p>Aidez-nous à améliorer Work Class Gabon en répondant à un court questionnaire.</p>
      ${feedbackButton(feedbackUrl)}
    `;
    await this.send({
      to: email,
      subject: 'Donnez votre avis sur Work Class Gabon',
      html: emailWrapper(body),
    });
  }
}
