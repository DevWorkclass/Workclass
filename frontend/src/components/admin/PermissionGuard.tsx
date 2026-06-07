'use client';

/**
 * Garde d'accès côté front pour une page admin.
 *  - super_admin : accès total (cf. hasPermission).
 *  - admin : seulement si la permission requise lui est attribuée.
 *  - non connecté : redirection login.
 *
 * NOTE : c'est une garde UX/affichage. L'autorisation réelle reste appliquée par
 * le backend (`requirePermission`) sur chaque endpoint — un contournement client
 * ne donne aucun accès aux données.
 */
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { ROUTES } from '@/constants/routes';
import type { Permission } from '@/constants/permissions';
import { hasPermission } from '@/lib/auth';
import { useAuthUser } from '@/domains/shared/auth/hooks/useAuthUser';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

interface PermissionGuardProps {
  permission: Permission;
  children: ReactNode;
}

export function PermissionGuard({ permission, children }: PermissionGuardProps) {
  const router = useRouter();
  const { user, loading } = useAuthUser();
  const allowed = hasPermission(user, permission);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(ROUTES.admin.login);
    } else if (!allowed) {
      router.replace(ROUTES.admin.dashboard);
    }
  }, [loading, user, allowed, router]);

  if (loading || !allowed) {
    return (
      <div className="flex justify-center py-20 text-brand-muted">
        <LoadingSpinner />
      </div>
    );
  }

  return <>{children}</>;
}
