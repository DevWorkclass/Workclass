/**
 * Formatters d'affichage (dates, montants, noms).
 */

export function formatDateTime(date: Date, locale: string = 'fr-FR'): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatDateRange(start: Date, end: Date, locale: string = 'fr-FR'): string {
  const fmt = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) return fmt.format(start);
  return `${fmt.format(start)} — ${fmt.format(end)}`;
}

/** Formate un montant entier (sans décimales) — séparateur de milliers localisé. */
export function formatAmount(amount: number, locale: string = 'fr-FR'): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount);
}

/** Formate un prix avec sa devise (ex. "35 000 FCFA"). */
export function formatPrice(amount: number, currency: string = 'FCFA', locale: string = 'fr-FR'): string {
  return `${formatAmount(amount, locale)} ${currency}`;
}

export function formatFullName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

/**
 * Masque partiellement un email pour affichage (RGPD).
 * @example maskEmail('john.doe@example.com') -> 'jo***@example.com'
 */
export function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!user || !domain) return email;
  const visible = user.slice(0, Math.min(2, user.length));
  return `${visible}${'*'.repeat(3)}@${domain}`;
}

/**
 * Masque partiellement un téléphone.
 */
export function maskPhone(phone: string): string {
  if (phone.length < 4) return phone;
  return `${phone.slice(0, 3)}${'*'.repeat(Math.max(0, phone.length - 5))}${phone.slice(-2)}`;
}
