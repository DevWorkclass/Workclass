/**
 * Génération de PDFs (tickets + certificats) avec pdfkit.
 * Retourne un Buffer prêt à être écrit sur disque ou uploadé.
 */

import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

interface TicketPDFData {
  ticketNumber: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  participantName: string;
  participantEmail: string;
  ticketType: string;
  qrCodeDataUrl: string;
}

interface CertificatePDFData {
  participantName: string;
  eventTitle: string;
  eventDate: string;
  certificateNumber: string;
  /** QR (data-URL) encodant l'URL d'authentification publique du certificat. */
  qrCodeDataUrl?: string;
}

/**
 * Résout le chemin vers le logo officiel pour inclusion dans les PDF.
 */
const getLogoPath = (): string | null => {
  // Préfère le logo officiel haute définition (logo.png) puis l'icône en repli.
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

/**
 * Génère le PDF d'un billet d'entrée avec QR code (Premium & Moderne).
 */
export async function generateTicketPDF(data: TicketPDFData): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Couleur de fond de la page A4
    doc.rect(0, 0, 595, 842).fill('#F8FAFC');

    const cardX = 50;
    const cardY = 100;
    const cardW = 495;
    const cardH = 500;

    // Ombre subtile et fond de carte blanche
    doc.roundedRect(cardX + 2, cardY + 2, cardW, cardH, 16).fill('#E2E8F0');
    doc.roundedRect(cardX, cardY, cardW, cardH, 16).fill('#FFFFFF');

    // Bandeau d'en-tête bleu de marque (#0066CC)
    doc.save();
    doc.roundedRect(cardX, cardY, cardW, 80, 16).fill('#0066CC');
    doc.rect(cardX, cardY + 60, cardW, 20).fill('#0066CC'); // Évite les arrondis en bas du bandeau

    // Nom de marque et texte d'accompagnement
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(20).text('WORK CLASS', cardX + 90, cardY + 20);
    doc.fillColor('#FF6B00').font('Helvetica-Bold').fontSize(20).text('GABON', cardX + 235, cardY + 20);
    doc.fillColor('#93C5FD').font('Helvetica').fontSize(10).text("ACCÈS ÉVÉNEMENT • BILLET OFFICIEL", cardX + 90, cardY + 45);

    // Dessine le logo si présent
    const logoPath = getLogoPath();
    if (logoPath) {
      try {
        doc.image(logoPath, cardX + 25, cardY + 15, { width: 50 });
      } catch (e) {
        // Fallback en cas d'erreur de rendu de l'image
      }
    }
    doc.restore();

    // Titre de l'événement
    doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(14).text(data.eventTitle.toUpperCase(), cardX + 30, cardY + 110, { width: 280 });

    // Disposition des colonnes
    const colLeft = cardX + 30;
    const colRight = cardX + 330;

    // Date
    doc.fillColor('#64748B').font('Helvetica-Bold').fontSize(8).text('DATE & HEURE', colLeft, cardY + 175);
    doc.fillColor('#334155').font('Helvetica-Bold').fontSize(11).text(data.eventDate, colLeft, cardY + 188);

    // Lieu
    doc.fillColor('#64748B').font('Helvetica-Bold').fontSize(8).text('LIEU', colLeft, cardY + 225);
    doc.fillColor('#334155').font('Helvetica-Bold').fontSize(11).text(data.eventLocation, colLeft, cardY + 238, { width: 260 });

    // Participant
    doc.fillColor('#64748B').font('Helvetica-Bold').fontSize(8).text('PARTICIPANT', colLeft, cardY + 290);
    doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(13).text(data.participantName, colLeft, cardY + 303);
    doc.fillColor('#475569').font('Helvetica').fontSize(10).text(data.participantEmail, colLeft, cardY + 320);

    // Code QR (depuis la data-URL)
    const base64 = data.qrCodeDataUrl.replace(/^data:image\/\w+;base64,/, '');
    const qrBuffer = Buffer.from(base64, 'base64');
    doc.image(qrBuffer, colRight - 15, cardY + 110, { width: 140 });

    // Badge Type de Billet
    const isVIP = data.ticketType.toLowerCase().includes('vip');
    const badgeBg = isVIP ? '#FFF7ED' : '#EFF6FF';
    const badgeText = isVIP ? '#FF6B00' : '#0066CC';

    doc.roundedRect(colRight - 10, cardY + 265, 130, 24, 12).fill(badgeBg);
    doc.fillColor(badgeText).font('Helvetica-Bold').fontSize(9).text(data.ticketType.toUpperCase(), colRight - 10, cardY + 273, { width: 130, align: 'center' });

    // Numéro de billet
    doc.fillColor('#94A3B8').font('Helvetica-Bold').fontSize(8).text('NUMÉRO DE BILLET', colRight - 10, cardY + 310, { width: 130, align: 'center' });
    doc.fillColor('#334155').font('Helvetica-Bold').fontSize(11).text(data.ticketNumber, colRight - 10, cardY + 322, { width: 130, align: 'center' });

    // Ligne pointillée de découpe
    doc.save();
    doc.moveTo(cardX + 25, cardY + 375).lineTo(cardX + cardW - 25, cardY + 375).dash(4, { space: 6 }).stroke('#E2E8F0');
    doc.restore();

    // Consignes
    doc.fillColor('#64748B').font('Helvetica-Bold').fontSize(8).text('CONSIGNES D\'ACCÈS', cardX + 30, cardY + 395);
    doc.fillColor('#64748B').font('Helvetica').fontSize(9)
       .text("• Présentez ce code QR sur votre smartphone ou imprimé à l'accueil pour validation.\n" +
             "• Ce billet est nominatif et non transférable. Une pièce d'identité peut être demandée.\n" +
             "• Tout accès dupliqué sera refusé lors du scan d'entrée.", cardX + 30, cardY + 412, { width: cardW - 60, lineGap: 3 });

    // Footer de la carte
    doc.fillColor('#94A3B8').font('Helvetica-Bold').fontSize(9).text('WORK CLASS GABON', cardX, cardY + cardH - 25, { width: cardW, align: 'center' });

    doc.end();
  });
}

/**
 * Génère le PDF d'un certificat de participation (Moderne & Paysage).
 */
export async function generateCertificatePDF(
  data: CertificatePDFData,
): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const width = 841.89;
    const height = 595.28;

    // Fond de page
    doc.rect(0, 0, width, height).fill('#F8FAFC');

    // Cadre double
    doc.rect(25, 25, width - 50, height - 50).lineWidth(3).stroke('#0066CC');
    doc.rect(32, 32, width - 64, height - 64).lineWidth(1).stroke('#FF6B00');

    // Coins décoratifs
    const drawCorner = (x: number, y: number, angle: number) => {
      doc.save();
      doc.translate(x, y);
      doc.rotate(angle);
      doc.moveTo(0, 0).lineTo(40, 0).lineTo(0, 40).closePath().fill('#0066CC');
      doc.restore();
    };

    drawCorner(25, 25, 0);
    drawCorner(width - 25, 25, 90);
    drawCorner(width - 25, height - 25, 180);
    drawCorner(25, height - 25, 270);

    // Logo centré en haut
    const logoPath = getLogoPath();
    if (logoPath) {
      try {
        doc.image(logoPath, width / 2 - 30, 50, { width: 60 });
      } catch (e) {
        // Fallback silencieux
      }
    }

    // Titre
    doc.fillColor('#0066CC').font('Helvetica-Bold').fontSize(26).text('CERTIFICAT DE PARTICIPATION', 0, 130, { align: 'center' });

    // Texte d'attribution
    doc.fillColor('#64748B').font('Helvetica-Oblique').fontSize(14).text('Ce document est officiellement décerné à', 0, 185, { align: 'center' });

    // Nom du participant
    doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(32).text(data.participantName, 0, 220, { align: 'center' });

    // Ligne décorative orange
    doc.moveTo(width / 2 - 120, 275).lineTo(width / 2 + 120, 275).lineWidth(1.5).stroke('#FF6B00');

    // Description
    doc.fillColor('#64748B').font('Helvetica').fontSize(14).text("pour sa présence et sa participation active à l'événement de formation :", 0, 300, { align: 'center' });

    // Titre de l'événement
    doc.fillColor('#0066CC').font('Helvetica-Bold').fontSize(20).text(data.eventTitle.toUpperCase(), 0, 335, { align: 'center' });

    // Date & Identifiant unique
    doc.fillColor('#475569').font('Helvetica-Bold').fontSize(12).text(`Délivré le ${data.eventDate}`, 0, 385, { align: 'center' });
    doc.fillColor('#94A3B8').font('Helvetica-Bold').fontSize(9).text(`N° CERTIFICAT : ${data.certificateNumber}`, 0, 410, { align: 'center' });

    // QR d'authentification (scannable par n'importe quel scanner → page de vérification)
    if (data.qrCodeDataUrl) {
      try {
        const qrBase64 = data.qrCodeDataUrl.replace(/^data:image\/\w+;base64,/, '');
        const qrBuffer = Buffer.from(qrBase64, 'base64');
        const qrSize = 66;
        doc.image(qrBuffer, width / 2 - qrSize / 2, 435, { width: qrSize });
        doc.fillColor('#94A3B8').font('Helvetica').fontSize(7.5)
          .text('Scannez pour authentifier ce certificat', 0, 505, { align: 'center' });
      } catch (e) {
        // Fallback silencieux si le QR ne peut être rendu
      }
    }

    // Lignes de signatures
    const sigY = 460;
    const sigLineW = 160;

    // Signature gauche
    const sigLeftX = 120;
    doc.moveTo(sigLeftX, sigY).lineTo(sigLeftX + sigLineW, sigY).lineWidth(1).stroke('#94A3B8');
    doc.fillColor('#475569').font('Helvetica-Bold').fontSize(9).text("Le Comité d'Organisation", sigLeftX, sigY + 8, { width: sigLineW, align: 'center' });
    doc.fillColor('#94A3B8').font('Helvetica').fontSize(8).text("Work Class Gabon", sigLeftX, sigY + 22, { width: sigLineW, align: 'center' });

    // Signature droite
    const sigRightX = width - 120 - sigLineW;
    doc.moveTo(sigRightX, sigY).lineTo(sigRightX + sigLineW, sigY).lineWidth(1).stroke('#94A3B8');
    doc.fillColor('#475569').font('Helvetica-Bold').fontSize(9).text("La Direction Générale", sigRightX, sigY + 8, { width: sigLineW, align: 'center' });
    doc.fillColor('#94A3B8').font('Helvetica').fontSize(8).text("Work Class Gabon", sigRightX, sigY + 22, { width: sigLineW, align: 'center' });

    doc.end();
  });
}

/**
 * Génère un PDF de liste tabulaire (export réservations / participants).
 * Format A4 paysage, en-têtes répétés à chaque page, lignes paginées.
 *
 * @param title    titre du document
 * @param columns  libellés de colonnes
 * @param rows     lignes (tableau de cellules string, même longueur que `columns`)
 */
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
      doc.fontSize(16).fillColor('#0066CC').text('WORK CLASS GABON', left, 30);
      doc.fontSize(11).fillColor('#333').text(title, left, 52);
      const y = 80;
      doc.fontSize(8).fillColor('#fff');
      doc.rect(left, y, usable, rowHeight).fill('#0066CC');
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
      // Fond alterné pour la lisibilité.
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
