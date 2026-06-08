import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Work Class Gabon',
    template: '%s — Work Class Gabon',
  },
  description: 'Plateforme de réservation et gestion d\'événements professionnels au Gabon.',
  manifest: '/manifest.json',
  icons: {
    icon: '/assets/images/logo/logo-icone.png',
    apple: '/assets/images/logo/logo-icone.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Work Class',
  },
};

export const viewport: Viewport = {
  themeColor: '#0066CC',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
