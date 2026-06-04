import type { ReactNode } from 'react';

import { AdminLayout } from '@/components/layouts/AdminLayout';

/**
 * Layout du groupe de routes admin — applique le shell (sidebar + contenu).
 * NOTE : la protection d'accès (auth/RBAC) est assurée par le middleware et le
 * backend ; ce layout ne fait que le rendu.
 */
export default function AdminRouteLayout({ children }: { children: ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
