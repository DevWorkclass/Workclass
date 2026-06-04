import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { PublicLayout } from '@/components/layouts/PublicLayout';
import { isLocale, locales } from '@/config/i18n';

/** Pré-génère les variantes de locale (/fr, /en). */
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

interface PublicRouteLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

/**
 * Layout des routes publiques localisées — fournit les messages next-intl
 * aux composants client via NextIntlClientProvider.
 */
export default async function PublicRouteLayout({ children, params }: PublicRouteLayoutProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <PublicLayout>{children}</PublicLayout>
    </NextIntlClientProvider>
  );
}
