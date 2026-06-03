import type { ReactNode } from 'react';

import { PublicLayout } from '@/components/layouts/PublicLayout';

/**
 * Layout des routes publiques localisées.
 * i18n next-intl à brancher (provider) lors du câblage locales.
 */
export default function PublicRouteLayout({ children }: { children: ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>;
}
