/**
 * Sérialisation CSV générique (sans dépendance externe).
 *
 *  - Séparateur `;` (compatible Excel FR).
 *  - Échappement RFC 4180 : toute cellule contenant `;`, `"`, `\n` ou `\r`
 *    est entourée de guillemets, les `"` internes étant doublés.
 *  - Préfixe BOM UTF-8 pour qu'Excel détecte l'encodage (accents corrects).
 */

const SEPARATOR = ';';
const BOM = '﻿';

function escapeCell(value: string): string {
  if (/[";\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Construit un document CSV à partir d'en-têtes et de lignes.
 * @returns le contenu CSV (string) prêt à être renvoyé en pièce jointe.
 */
export function buildCsv(headers: string[], rows: string[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeCell).join(SEPARATOR));
  return BOM + lines.join('\r\n');
}
