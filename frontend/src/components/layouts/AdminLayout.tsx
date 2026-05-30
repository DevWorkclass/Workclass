import type { ReactNode } from 'react';

interface AdminLayoutProps {
  children: ReactNode;
}

/**
 * Layout des pages admin (Sidebar + Header + contenu).
 * À enrichir en session UI/UX.
 */
export function AdminLayout({ children }: AdminLayoutProps) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
