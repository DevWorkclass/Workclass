import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Work Class Gabon',
    template: '%s — Work Class Gabon',
  },
  description: 'Plateforme de réservation et gestion d\'événements professionnels au Gabon.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
