import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';

/** Origine de l'API (sans le suffixe /api) pour le préchargement réseau. */
function apiOrigin(): string | null {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api').origin;
  } catch {
    return null;
  }
}

export const metadata: Metadata = {
  title: {
    default: 'Work Class Gabon',
    template: '%s — Work Class Gabon',
  },
  description: 'Plateforme de réservation et gestion d\'événements professionnels au Gabon.',
  manifest: '/manifest.json',
  icons: {
    icon: '/assets/images/logo/logo.png',
    apple: '/assets/images/logo/logo.png',
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
  const origin = apiOrigin();
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Préconnexion à l'API : réduit la latence du 1er appel (DNS/TLS anticipés). */}
        {origin && <link rel="preconnect" href={origin} crossOrigin="anonymous" />}
        {origin && <link rel="dns-prefetch" href={origin} />}
      </head>
      <body>{children}</body>
    </html>
  );
}
