/**
 * Génération de PDFs (tickets + certificats) avec pdfkit.
 * Retourne un Buffer prêt à être écrit sur disque ou uploadé.
 */

import PDFDocument from 'pdfkit';

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
}

/**
 * Génère le PDF d'un billet d'entrée avec QR code.
 */
export async function generateTicketPDF(data: TicketPDFData): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // En-tête
    doc.fontSize(24).fillColor('#0066CC').text('WORK CLASS GABON', 50, 50);
    doc.fontSize(14).fillColor('#333').text("Billet d'entree", 50, 80);
    doc.moveTo(50, 110).lineTo(550, 110).stroke('#0066CC');

    // Infos événement
    doc.fontSize(12).fillColor('#333');
    doc.text(`Evenement : ${data.eventTitle}`, 50, 130);
    doc.text(`Date : ${data.eventDate}`, 50, 150);
    doc.text(`Lieu : ${data.eventLocation}`, 50, 170);

    // Infos participant
    doc.text(`Participant : ${data.participantName}`, 50, 210);
    doc.text(`Email : ${data.participantEmail}`, 50, 230);
    doc.text(`Type : ${data.ticketType}`, 50, 250);
    doc.text(`Numero : ${data.ticketNumber}`, 50, 270);

    // QR code (depuis la data-URL)
    const base64 = data.qrCodeDataUrl.replace(/^data:image\/\w+;base64,/, '');
    const qrBuffer = Buffer.from(base64, 'base64');
    doc.image(qrBuffer, 400, 130, { width: 150 });

    // Pied de page
    doc.fontSize(10).fillColor('#666');
    doc.text('Ce billet est strictement personnel et non transferable.', 50, 700);
    doc.text("Presentez ce QR code a l'entree.", 50, 715);

    doc.end();
  });
}

/**
 * Génère le PDF d'un certificat de participation.
 */
export async function generateCertificatePDF(
  data: CertificatePDFData,
): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.rect(0, 0, 612, 792).fill('#F8FAFC');

    doc
      .fontSize(32)
      .fillColor('#0066CC')
      .text('CERTIFICAT DE PARTICIPATION', 50, 100, { align: 'center' });
    doc.moveTo(100, 150).lineTo(512, 150).stroke('#FF6B00');

    doc.fontSize(16).fillColor('#333');
    doc.text('Nous certifions que', 50, 200, { align: 'center' });

    doc.fontSize(28).fillColor('#0066CC');
    doc.text(data.participantName, 50, 240, { align: 'center' });

    doc.fontSize(16).fillColor('#333');
    doc.text("a participe a l'evenement", 50, 300, { align: 'center' });

    doc.fontSize(24).fillColor('#0066CC');
    doc.text(data.eventTitle, 50, 340, { align: 'center' });

    doc.fontSize(14).fillColor('#666');
    doc.text(`Date : ${data.eventDate}`, 50, 400, { align: 'center' });
    doc.text(`Numero : ${data.certificateNumber}`, 50, 420, { align: 'center' });

    doc.fontSize(12).fillColor('#999');
    doc.text('Work Class Gabon', 50, 700, { align: 'center' });

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
