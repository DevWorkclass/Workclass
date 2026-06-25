/**
 * Service email — envoi via Gmail API (OAuth2).
 *
 * Bonnes pratiques anti-spam appliquées :
 *  - FROM = compte Gmail réel (SMTP_USER) avec nom d'affichage → SPF passe
 *  - multipart/alternative : HTML + texte brut → filtres anti-spam satisfaits
 *  - List-Unsubscribe + List-Unsubscribe-Post → requis Gmail/Yahoo depuis 2024
 *  - Precedence: transactional → classe l'email correctement
 *  - En-têtes MIME propres via MailComposer
 */

import { logger } from '../../../utils/logger';
import { google } from 'googleapis';
// @ts-ignore - lib interne
import MailComposer from 'nodemailer/lib/mail-composer';

interface EmailAttachment {
  filename: string;
  path?: string;
  content?: Buffer;
}

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
}

export interface ExtraCertificate {
  name: string;
  buffer: Buffer;
}

// FROM = compte Gmail réel → SPF/DKIM passent automatiquement
// Si EMAIL_FROM_NAME est défini, on l'utilise comme nom d'affichage.
function buildFromAddress(): string {
  const account = process.env.SMTP_USER ?? process.env.EMAIL_FROM ?? 'no-reply@workclass-gabon.com';
  const name = process.env.EMAIL_FROM_NAME ?? 'Work Class Gabon';
  return `"${name}" <${account}>`;
}

// Adresse de réponse (peut être différente du FROM)
const REPLY_TO = process.env.EMAIL_REPLY_TO ?? process.env.SMTP_USER ?? 'contact@workclass-gabon.com';

const BRAND_NAVY = '#0E2450';
const BRAND_GOLD = '#D4AF37';
const BRAND_CREAM = '#F9F5EC';

/** Convertit HTML en texte brut lisible (version plaintext obligatoire). */
function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi, '$2 ($1)')
    .replace(/<strong[^>]*>([^<]+)<\/strong>/gi, '*$1*')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function emailWrapper(body: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Work Class Gabon</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#ffffff">
  <div style="max-width:560px;margin:24px auto;padding:0 16px;font-size:15px;color:#1f2937;line-height:1.6">
    <p style="margin:0 0 24px;font-weight:bold;color:${BRAND_NAVY};font-size:16px;border-bottom:2px solid ${BRAND_GOLD};padding-bottom:8px">Work Class Gabon</p>
    ${body}
    <p style="margin:32px 0 0;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:12px">Work Class Gabon · Libreville, Gabon<br>Pour toute question : <a href="mailto:${REPLY_TO}" style="color:#9ca3af">${REPLY_TO}</a></p>
  </div>
</body>
</html>`;
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
        'https://developers.google.com/oauthplayground',
      );
      this.oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
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
      const from = buildFromAddress();

      // Pré-télécharge les pièces jointes HTTP avant MailComposer
      // (MailComposer ne gère pas bien les URLs signées Supabase)
      const attachments = await Promise.all(
        (data.attachments ?? []).map(async (att) => {
          if (att.path && (att.path.startsWith('https://') || att.path.startsWith('http://'))) {
            const res = await fetch(att.path);
            if (!res.ok) throw new Error(`Telechargement piece jointe echoue (HTTP ${res.status}): ${att.path}`);
            const content = Buffer.from(await res.arrayBuffer());
            return { filename: att.filename, content };
          }
          return att;
        }),
      );

      const mailOptions = {
        from,
        to: data.to,
        replyTo: REPLY_TO,
        subject: data.subject,
        text: data.text ?? htmlToText(data.html),
        html: data.html,
        attachments,
      };

      const mail = new MailComposer(mailOptions);
      const messageBuffer = await mail.compile().build();
      const raw = messageBuffer
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
      await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });

      logger.info({ to: data.to, from }, 'Email envoye avec succes (via Gmail API)');
    } catch (error) {
      logger.error({ err: error }, 'Erreur envoi email');
      throw error;
    }
  }

  async sendTicketConfirmation(
    email: string,
    ticketNumber: string,
    pdf: Buffer,
    downloadUrl: string,
  ): Promise<void> {
    const html = emailWrapper(`
      <p>Bonjour,</p>
      <p>Votre réservation est confirmée. Votre billet <strong>${ticketNumber}</strong> est en pièce jointe.</p>
      <p>Vous pouvez également le télécharger à tout moment via ce lien :<br>
        <a href="${downloadUrl}" style="color:${BRAND_NAVY}">Télécharger mon billet</a>
      </p>
      <p>Présentez le QR code à l'entrée de l'événement.</p>
      <p style="margin-top:24px;color:#4b5563;font-size:14px">À bientôt !</p>
    `);
    await this.send({
      to: email,
      subject: `Votre billet Work Class Gabon — ${ticketNumber}`,
      html,
      text: `Bonjour,\n\nVotre réservation est confirmée. Votre billet ${ticketNumber} est en pièce jointe.\nLien de téléchargement permanent : ${downloadUrl}\n\nPrésentez le QR code à l'entrée de l'événement.\n\nÀ bientôt !`,
      attachments: [{ filename: `${ticketNumber}.pdf`, content: pdf }],
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
    pdfUrl?: string;
    pdfBuffer?: Buffer;
    downloadUrl?: string;
    bookletUrl?: string;
    feedbackToken: string;
    eventTitle: string;
    extraCertificates?: ExtraCertificate[] | null;
  }): Promise<void> {
    const {
      email,
      participantName,
      certificateNumber,
      pdfUrl,
      pdfBuffer,
      downloadUrl,
      bookletUrl,
      feedbackToken,
      eventTitle,
    } = params;
    const extraCertificates = params.extraCertificates ?? [];

    const appUrl = (process.env.FRONTEND_URL ?? process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
    const feedbackUrl = `${appUrl}/avis/${feedbackToken}`;

    const extraSection =
      extraCertificates.length > 0
        ? `<div style="margin-top:24px;padding:16px;background:#fef3c7;border-radius:8px;border:1px solid #fbbf24">
            <p style="margin:0 0 8px;font-weight:bold;color:#92400e">Certificats des autres participants</p>
            <p style="margin:0 0 10px;font-size:14px;color:#78350f">
              Les certificats des participants suivants sont également joints à cet email :
            </p>
            <ul style="margin:0;padding-left:20px;font-size:14px;color:#78350f">
              ${extraCertificates.map((c) => `<li style="margin-bottom:4px"><strong>${c.name}</strong></li>`).join('')}
            </ul>
          </div>`
        : '';

    const certLinkLine = downloadUrl
      ? `<p>Vous pouvez également le télécharger à tout moment : <a href="${downloadUrl}" style="color:${BRAND_NAVY}">Télécharger mon certificat</a></p>`
      : '';

    const bookletSection = bookletUrl
      ? `<div style="margin-top:20px;padding:16px;background:#eff6ff;border-radius:8px;border:1px solid #bfdbfe">
          <p style="margin:0 0 6px;font-weight:bold;color:${BRAND_NAVY}">Livret ressources</p>
          <p style="margin:0 0 10px;font-size:14px;color:#1e3a5f">
            Retrouvez le livret ressources de l'événement (supports, contacts, prochaines étapes) :
          </p>
          <a href="${bookletUrl}" style="display:inline-block;padding:10px 18px;background:${BRAND_NAVY};color:#fff;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px">Télécharger le livret ressources</a>
        </div>`
      : '';

    const html = emailWrapper(`
      <p>Bonjour <strong>${participantName}</strong>,</p>
      <p>Merci d'avoir participé à <strong>${eventTitle}</strong>.</p>
      <p>Votre certificat de participation n° <strong>${certificateNumber}</strong> est en pièce jointe.</p>
      ${certLinkLine}
      ${bookletSection}
      ${feedbackButton(feedbackUrl)}
      ${extraSection}
      <p style="margin-top:24px;color:#4b5563;font-size:14px">À bientôt sur Work Class Gabon !</p>
    `);

    const extraNames = extraCertificates.map((c) => `  • ${c.name}`).join('\n');
    const text = [
      `Bonjour ${participantName},`,
      '',
      `Merci d'avoir participé à ${eventTitle}.`,
      `Votre certificat de participation n° ${certificateNumber} est en pièce jointe.`,
      '',
      ...(bookletUrl
        ? ['── Livret ressources ──', 'Téléchargez le livret ressources de l\'événement :', bookletUrl, '']
        : []),
      '── Donnez votre avis ──',
      `Aidez-nous à améliorer Work Class Gabon en répondant à un court questionnaire (2 min) :`,
      feedbackUrl,
      '',
      ...(extraCertificates.length > 0
        ? [
            '── Certificats des autres participants ──',
            'Les certificats des participants suivants sont également joints à cet email :',
            extraNames,
            '',
          ]
        : []),
      'À bientôt sur Work Class Gabon !',
    ].join('\n');

    const mainAttachment: EmailAttachment = pdfBuffer
      ? { filename: `certificat-${certificateNumber}.pdf`, content: pdfBuffer }
      : { filename: `certificat-${certificateNumber}.pdf`, path: pdfUrl ?? '' };
    const attachments: EmailAttachment[] = [
      mainAttachment,
      ...extraCertificates.map((c) => ({
        filename: `certificat-${c.name.replace(/\s+/g, '-').toLowerCase()}.pdf`,
        content: c.buffer,
      })),
    ];

    await this.send({
      to: email,
      subject: `Votre certificat de participation — ${eventTitle}`,
      html,
      text,
      attachments,
    });
  }

  async sendFeedbackOnly(email: string, feedbackToken: string, eventTitle: string): Promise<void> {
    const appUrl = (process.env.FRONTEND_URL ?? process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
    const feedbackUrl = `${appUrl}/avis/${feedbackToken}`;
    const html = emailWrapper(`
      <p>Bonjour,</p>
      <p>Merci d'avoir participé à <strong>${eventTitle}</strong>.</p>
      ${feedbackButton(feedbackUrl)}
      <p style="margin-top:24px;color:#4b5563;font-size:14px">À bientôt sur Work Class Gabon !</p>
    `);
    await this.send({
      to: email,
      subject: `Votre avis sur ${eventTitle}`,
      html,
      text: `Bonjour,\n\nMerci d'avoir participé à ${eventTitle}.\n\nDonnez votre avis (2 min) :\n${feedbackUrl}\n\nÀ bientôt !`,
    });
  }

  /** @deprecated Utiliser sendCertificateWithFeedback */
  async sendCertificate(email: string, certificateNumber: string, pdfPath: string): Promise<void> {
    const html = emailWrapper(`
      <p>Bonjour,</p>
      <p>Merci d'avoir participé à Work Class Gabon.</p>
      <p>Votre certificat <strong>${certificateNumber}</strong> est en pièce jointe.</p>
    `);
    await this.send({
      to: email,
      subject: 'Votre certificat de participation',
      html,
      text: `Bonjour,\n\nMerci d'avoir participé à Work Class Gabon.\nVotre certificat ${certificateNumber} est en pièce jointe.`,
      attachments: [{ filename: `${certificateNumber}.pdf`, path: pdfPath }],
    });
  }

  /** @deprecated Utiliser sendCertificateWithFeedback */
  async sendFeedbackLink(email: string, token: string): Promise<void> {
    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
    const feedbackUrl = `${appUrl}/avis/${token}`;
    const html = emailWrapper(`
      <p>Bonjour,</p>
      <p>Aidez-nous à améliorer Work Class Gabon en répondant à un court questionnaire.</p>
      ${feedbackButton(feedbackUrl)}
    `);
    await this.send({
      to: email,
      subject: 'Donnez votre avis sur Work Class Gabon',
      html,
      text: `Bonjour,\n\nAidez-nous à améliorer Work Class Gabon :\n${feedbackUrl}`,
    });
  }
}
