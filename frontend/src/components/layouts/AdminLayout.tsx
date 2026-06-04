import type { ReactNode } from 'react';

import { Sidebar } from './Sidebar';

interface AdminLayoutProps {
  children: ReactNode;
}

/**
 * Layout des pages admin : sidebar marine fixe + zone de contenu crème.
 */
export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex min-h-screen bg-brand-cream">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden px-6 py-8 lg:p-10">{children}</main>
    </div>
  );
}
