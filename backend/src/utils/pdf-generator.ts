/**
 * Génération PDF (côté serveur uniquement).
 * STUB v1 : implémentation en ÉTAPE 3 avec `pdf-lib` ou `@react-pdf/renderer`.
 */

import type {
  PdfCertificateData,
  PdfTicketData,
} from './pdf-generator.types.js';

export async function generateTicketPdf(_data: PdfTicketData): Promise<Buffer> {
  // TODO ÉTAPE 3 :
  //  - Charger template (pdf-lib)
  //  - Insérer infos événement + participant + QR (via renderQRImage)
  //  - Retourner Buffer pour upload Supabase Storage
  throw new Error('Not implemented — ÉTAPE 3 backend (utilise `pdf-lib`).');
}

export async function generateCertificatePdf(
  _data: PdfCertificateData,
): Promise<Buffer> {
  throw new Error('Not implemented — ÉTAPE 3 backend.');
}
