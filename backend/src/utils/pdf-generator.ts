/**
 * Génération de PDFs (tickets + certificats) avec pdfkit.
 * Retourne un Buffer prêt à être écrit sur disque ou uploadé.
 *
 * Billet    : fond bleu dégradé (#0E2450 → #2152B6), liste de tous les participants.
 * Certificat: fond doré/blanc dégradé, cadre doré premium.
 */

import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

export interface TicketPDFData {
  ticketNumber: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  participantName: string;
  participantEmail: string;
  ticketType: string;
  qrCodeDataUrl: string;
  /** Noms de tous les participants (payeur compris). Minimum 1 élément. */
  participants: string[];
}

interface CertificatePDFData {
  participantName: string;
  eventTitle: string;
  eventDate: string;
  certificateNumber: string;
  /** QR (data-URL) encodant l'URL d'authentification publique du certificat. */
  qrCodeDataUrl?: string;
}

const getLogoPath = (): string | null => {
  // Chemin bundlé avec le backend (toujours disponible en prod)
  const bundled = path.join(__dirname, '../assets/logo.png');
  if (fs.existsSync(bundled)) return bundled;

  // Fallbacks dev (monorepo local)
  const bases = [
    path.join(__dirname, '../../../../frontend/public/assets/images/logo'),
    path.join(__dirname, '../../../frontend/public/assets/images/logo'),
    path.join(process.cwd(), '../frontend/public/assets/images/logo'),
    path.join(process.cwd(), 'frontend/public/assets/images/logo'),
  ];
  const names = ['logo.png', 'logo-icone.png'];
  for (const base of bases) {
    for (const name of names) {
      const p = path.join(base, name);
      if (fs.existsSync(p)) return p;
    }
  }
  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// BILLET — fond bleu dégradé, tous les participants listés
// ─────────────────────────────────────────────────────────────────────────────
export async function generateTicketPDF(data: TicketPDFData): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = 595;
    const H = 842;

    // ── Fond dégradé bleu (simulé par deux rectangles superposés) ──
    // PDFKit supporte linearGradient nativement
    const bgGrad = doc.linearGradient(0, 0, 0, H);
    bgGrad.stop(0, '#0E2450');
    bgGrad.stop(1, '#2152B6');
    doc.rect(0, 0, W, H).fill(bgGrad);

    // Cercles décoratifs translucides en arrière-plan
    doc.circle(W - 60, 60, 120).fillOpacity(0.06).fill('#FFFFFF');
    doc.circle(60, H - 60, 100).fillOpacity(0.05).fill('#FFFFFF');
    doc.fillOpacity(1);

    // ── Carte centrale blanche ──
    const cardX = 40;
    const cardY = 70;
    const cardW = W - 80;
    // Hauteur dynamique selon le nombre de participants
    const extraParticipantH = Math.max(0, data.participants.length - 1) * 18;
    const cardH = 440 + extraParticipantH;

    // Ombre de carte
    doc.roundedRect(cardX + 3, cardY + 3, cardW, cardH, 14).fillOpacity(0.15).fill('#000000');
    doc.fillOpacity(1);
    // Fond blanc de la carte
    doc.roundedRect(cardX, cardY, cardW, cardH, 14).fill('#FFFFFF');

    // ── En-tête doré ──
    const headerH = 70;
    const headerGrad = doc.linearGradient(cardX, cardY, cardX + cardW, cardY);
    headerGrad.stop(0, '#B8861D');
    headerGrad.stop(1, '#D4AF37');
    doc.save();
    doc.roundedRect(cardX, cardY, cardW, headerH + 10, 14).clip();
    doc.rect(cardX, cardY, cardW, headerH).fill(headerGrad);
    doc.restore();

    // Logo dans l'en-tête
    const logoPath = getLogoPath();
    if (logoPath) {
      try { doc.image(logoPath, cardX + 18, cardY + 12, { height: 46 }); } catch (_) {}
    }

    // Titre — mesure dynamique pour éviter le chevauchement
    doc.font('Helvetica-Bold').fontSize(17);
    const wcWidth = doc.widthOfString('WORK CLASS ');
    doc.fillColor('#FFFFFF').text('WORK CLASS', cardX + 85, cardY + 14);
    doc.fillColor('#0E2450').font('Helvetica-Bold').fontSize(17)
      .text('GABON', cardX + 85 + wcWidth, cardY + 14);
    doc.fillColor('rgba(255,255,255,0.75)').font('Helvetica').fontSize(8.5)
      .text('BILLET OFFICIEL D\'ACCÈS À L\'ÉVÉNEMENT', cardX + 85, cardY + 38);

    // Badge type de billet (coin haut droit de l'en-tête)
    const isVIP = data.ticketType.toLowerCase().includes('vip');
    const badgeBg = isVIP ? '#FF6B00' : '#0E2450';
    doc.roundedRect(cardX + cardW - 90, cardY + 18, 76, 24, 12).fill(badgeBg);
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8)
      .text(data.ticketType.toUpperCase(), cardX + cardW - 90, cardY + 26, { width: 76, align: 'center' });

    // ── Corps de la carte ──
    const bodyY = cardY + headerH + 12;
    const colLeft = cardX + 24;
    const colRight = cardX + cardW - 155;

    // Titre événement
    doc.fillColor('#0E2450').font('Helvetica-Bold').fontSize(13)
      .text(data.eventTitle.toUpperCase(), colLeft, bodyY, { width: colRight - colLeft - 10 });

    let cursor = bodyY + 36;

    // Date
    doc.fillColor('#64748B').font('Helvetica-Bold').fontSize(7.5).text('DATE', colLeft, cursor);
    cursor += 12;
    doc.fillColor('#1E293B').font('Helvetica-Bold').fontSize(10).text(data.eventDate, colLeft, cursor, { width: 200 });
    cursor += 22;

    // Lieu
    doc.fillColor('#64748B').font('Helvetica-Bold').fontSize(7.5).text('LIEU', colLeft, cursor);
    cursor += 12;
    doc.fillColor('#1E293B').font('Helvetica-Bold').fontSize(10).text(data.eventLocation, colLeft, cursor, { width: 200 });
    cursor += 24;

    // ── Liste des participants ──
    doc.roundedRect(colLeft - 6, cursor - 4, colRight - colLeft + 6, 16 + data.participants.length * 18, 6)
      .fill('#EEF2FF');
    doc.fillColor('#64748B').font('Helvetica-Bold').fontSize(7.5)
      .text(`PARTICIPANT${data.participants.length > 1 ? 'S' : ''} (${data.participants.length} place${data.participants.length > 1 ? 's' : ''})`, colLeft, cursor);
    cursor += 16;
    for (const name of data.participants) {
      doc.fillColor('#0E2450').font('Helvetica-Bold').fontSize(10).text(`> ${name}`, colLeft, cursor, { width: 200 });
      cursor += 18;
    }
    cursor += 8;

    // Email de contact
    if (data.participantEmail) {
      doc.fillColor('#94A3B8').font('Helvetica').fontSize(8)
        .text(data.participantEmail, colLeft, cursor);
    }

    // ── QR code (colonne droite) ──
    const qrSize = 130;
    const qrX = cardX + cardW - qrSize - 14;
    const qrY = bodyY + 2;
    // Fond blanc pour le QR
    doc.roundedRect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 12, 8).fill('#F8FAFC');
    const base64 = data.qrCodeDataUrl.replace(/^data:image\/\w+;base64,/, '');
    const qrBuffer = Buffer.from(base64, 'base64');
    doc.image(qrBuffer, qrX, qrY, { width: qrSize });

    // Numéro de billet sous le QR
    doc.fillColor('#94A3B8').font('Helvetica-Bold').fontSize(7)
      .text('N° BILLET', qrX - 6, qrY + qrSize + 16, { width: qrSize + 12, align: 'center' });
    doc.fillColor('#1E293B').font('Helvetica-Bold').fontSize(9)
      .text(data.ticketNumber, qrX - 6, qrY + qrSize + 28, { width: qrSize + 12, align: 'center' });

    // ── Ligne de séparation pointillée ──
    const sepY = cardY + cardH - 80;
    doc.save();
    doc.moveTo(cardX + 20, sepY).lineTo(cardX + cardW - 20, sepY)
      .dash(4, { space: 5 }).strokeColor('#CBD5E1').lineWidth(0.8).stroke();
    doc.restore();

    // ── Consignes ──
    doc.fillColor('#94A3B8').font('Helvetica').fontSize(7.5)
      .text(
        '• Présentez ce QR code à l\'entrée. • Ce billet est nominatif et non transférable. • Tout duplicata sera refusé au scan.',
        cardX + 20, sepY + 12, { width: cardW - 40, lineGap: 3 },
      );

    // ── Footer hors carte ──
    doc.fillColor('rgba(255,255,255,0.35)').font('Helvetica').fontSize(8)
      .text('WORK CLASS GABON — workclass-tl.com', 0, cardY + cardH + 18, { align: 'center' });

    doc.end();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CERTIFICAT — fond doré/blanc dégradé, cadre doré premium
// ─────────────────────────────────────────────────────────────────────────────
export async function generateCertificatePDF(data: CertificatePDFData): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = 841.89;
    const H = 595.28;

    // ── Fond dégradé doré/blanc ──
    const bgGrad = doc.linearGradient(0, 0, W, H);
    bgGrad.stop(0, '#FFFDF5');
    bgGrad.stop(0.5, '#FEF9E7');
    bgGrad.stop(1, '#FDF3C0');
    doc.rect(0, 0, W, H).fill(bgGrad);

    // Lueurs décoratives dorées dans les coins
    doc.circle(0, 0, 180).fillOpacity(0.08).fill('#D4AF37');
    doc.circle(W, H, 180).fillOpacity(0.08).fill('#D4AF37');
    doc.fillOpacity(1);

    // ── Cadre doré double ──
    doc.rect(18, 18, W - 36, H - 36).lineWidth(2.5).strokeColor('#D4AF37').stroke();
    doc.rect(26, 26, W - 52, H - 52).lineWidth(0.8).strokeColor('#D4AF37').fillOpacity(0.4).stroke();
    doc.fillOpacity(1);

    // ── Coins décoratifs dorés ──
    const corner = (x: number, y: number, rx: number, ry: number) => {
      doc.moveTo(x, y + ry).lineTo(x, y).lineTo(x + rx, y).stroke();
    };
    doc.strokeColor('#B8861D').lineWidth(3);
    corner(18, 18, 40, 40);
    doc.save(); doc.translate(W - 18, 18); doc.rotate(90); corner(0, 0, 40, 40); doc.restore();
    doc.save(); doc.translate(W - 18, H - 18); doc.rotate(180); corner(0, 0, 40, 40); doc.restore();
    doc.save(); doc.translate(18, H - 18); doc.rotate(270); corner(0, 0, 40, 40); doc.restore();

    // ── Logo centré en haut ──
    const logoPath = getLogoPath();
    const logoH = 64;
    const logoY = 34;
    if (logoPath) {
      try { doc.image(logoPath, W / 2 - logoH / 2, logoY, { height: logoH }); } catch (_) {}
    }

    // ── Titre ──
    doc.font('Helvetica-Bold').fontSize(26).fillColor('#0E2450')
      .text('CERTIFICAT DE PARTICIPATION', 0, logoY + logoH + 10, { align: 'center' });

    // Ligne dorée sous le titre
    const lineY = logoY + logoH + 46;
    doc.moveTo(W / 2 - 160, lineY).lineTo(W / 2 + 160, lineY)
      .lineWidth(1.5).strokeColor('#D4AF37').stroke();

    // ── Corps ──
    doc.fillColor('#475569').font('Helvetica-Oblique').fontSize(13)
      .text('Ce certificat est officiellement décerné à', 0, lineY + 16, { align: 'center' });

    // Nom du participant sur fond doré léger
    const nameBgY = lineY + 40;
    doc.roundedRect(W / 2 - 220, nameBgY, 440, 52, 8).fill('#FEF3C7');
    doc.fillColor('#0E2450').font('Helvetica-Bold').fontSize(30)
      .text(data.participantName, 0, nameBgY + 10, { align: 'center' });

    // Ligne dorée après le nom
    doc.moveTo(W / 2 - 100, nameBgY + 60).lineTo(W / 2 + 100, nameBgY + 60)
      .lineWidth(1).strokeColor('#D4AF37').stroke();

    doc.fillColor('#64748B').font('Helvetica').fontSize(13)
      .text("pour sa présence et sa participation active à l'événement :", 0, nameBgY + 72, { align: 'center' });

    doc.fillColor('#0E2450').font('Helvetica-Bold').fontSize(18)
      .text(data.eventTitle.toUpperCase(), 0, nameBgY + 98, { align: 'center' });

    // Date et numéro
    doc.fillColor('#64748B').font('Helvetica-Bold').fontSize(11)
      .text(`Délivré le ${data.eventDate}`, 0, nameBgY + 132, { align: 'center' });
    doc.fillColor('#94A3B8').font('Helvetica').fontSize(8.5)
      .text(`N° CERTIFICAT : ${data.certificateNumber}`, 0, nameBgY + 150, { align: 'center' });

    // ── QR d'authentification ──
    if (data.qrCodeDataUrl) {
      try {
        const qrBase64 = data.qrCodeDataUrl.replace(/^data:image\/\w+;base64,/, '');
        const qrBuffer = Buffer.from(qrBase64, 'base64');
        const qrSize = 60;
        const qrX = W / 2 - qrSize / 2;
        const qrY = nameBgY + 168;
        doc.roundedRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10, 6).fill('#FFFFFF');
        doc.image(qrBuffer, qrX, qrY, { width: qrSize });
        doc.fillColor('#94A3B8').font('Helvetica').fontSize(7)
          .text('Scannez pour authentifier', 0, qrY + qrSize + 8, { align: 'center' });
      } catch (_) {}
    }

    // ── Signatures ──
    const sigY = nameBgY + 316;
    const leftX = W / 4;
    const rightX = (3 * W) / 4;

    // Gauche — Madame Pauline White
    doc.moveTo(leftX - 85, sigY).lineTo(leftX + 85, sigY)
      .lineWidth(0.8).strokeColor('#D4AF37').stroke();
    doc.fillColor('#0E2450').font('Helvetica-Bold').fontSize(10)
      .text('Madame Pauline White', leftX - 100, sigY + 6, { width: 200, align: 'center' });

    // Droite — Madame Valérie BENQUET + image signature
    const sigImgPath = path.join(__dirname, '../assets/signature-valérie_-removebg-preview.png');
    if (fs.existsSync(sigImgPath)) {
      try {
        doc.image(sigImgPath, rightX - 60, sigY - 52, { width: 120 });
      } catch (_) {}
    }
    doc.moveTo(rightX - 85, sigY).lineTo(rightX + 85, sigY)
      .lineWidth(0.8).strokeColor('#D4AF37').stroke();
    doc.fillColor('#0E2450').font('Helvetica-Bold').fontSize(10)
      .text('Madame Valérie BENQUET', rightX - 100, sigY + 6, { width: 200, align: 'center' });

    doc.end();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// LISTE TABULAIRE — export réservations / participants
// ─────────────────────────────────────────────────────────────────────────────
export async function generateListPDF(
  title: string,
  columns: string[],
  rows: string[][],
): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const left = 40;
    const right = doc.page.width - 40;
    const usable = right - left;
    const colWidth = usable / columns.length;
    const rowHeight = 20;
    const bottom = doc.page.height - 40;

    const drawHeader = (): number => {
      doc.fontSize(16).fillColor('#0E2450').text('WORK CLASS GABON', left, 30);
      doc.fontSize(11).fillColor('#333').text(title, left, 52);
      const y = 80;
      doc.fontSize(8).fillColor('#fff');
      doc.rect(left, y, usable, rowHeight).fill('#0E2450');
      doc.fillColor('#fff');
      columns.forEach((c, i) => {
        doc.text(c, left + i * colWidth + 4, y + 6, { width: colWidth - 8, ellipsis: true });
      });
      return y + rowHeight;
    };

    let cursorY = drawHeader();
    doc.fontSize(8);
    rows.forEach((row, idx) => {
      if (cursorY + rowHeight > bottom) {
        doc.addPage({ size: 'A4', layout: 'landscape', margin: 40 });
        cursorY = drawHeader();
        doc.fontSize(8);
      }
      if (idx % 2 === 0) {
        doc.rect(left, cursorY, usable, rowHeight).fill('#F1F5F9');
      }
      doc.fillColor('#333');
      row.forEach((cell, i) => {
        doc.text(cell ?? '', left + i * colWidth + 4, cursorY + 6, {
          width: colWidth - 8,
          ellipsis: true,
        });
      });
      cursorY += rowHeight;
    });

    doc.end();
  });
}
