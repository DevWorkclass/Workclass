'use client';

/**
 * Admin — Paramètres. Configuration globale (données mock).
 * La persistance se fera via POST backend (validation + audit côté serveur).
 */
import { useState } from 'react';
import Link from 'next/link';

import { PageHeader } from '@/components/admin/PageHeader';
import { Button } from '@/components/ui/button';
import { DomainesSettings } from '@/components/admin/DomainesSettings';
import { useAuthUser } from '@/domains/shared/auth/hooks/useAuthUser';
import { hasPermission } from '@/lib/auth';
import { ADMIN_SETTINGS } from '@/data/adminMockData';

type Settings = typeof ADMIN_SETTINGS;

function Field({
  label,
  value,
  type = 'text',
  onChange,
}: {
  label: string;
  value: string | number;
  type?: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-lg border border-black/10 bg-brand-cream px-4 py-2.5 text-sm text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
      />
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: Readonly<{
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}>) {
  // Case à cocher native (état porté par l'input) — accessibilité fiable.
  return (
    <label className="flex w-full cursor-pointer items-center justify-between py-2">
      <span className="text-sm text-brand-navy">{label}</span>
      <span className="relative inline-flex">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span className="grid size-6 place-items-center rounded-md border border-black/15 bg-white text-white transition-colors peer-checked:border-brand-gold peer-checked:bg-brand-gold">
          {checked ? '✓' : ''}
        </span>
      </span>
    </label>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <h2 className="font-bold text-brand-navy">{title}</h2>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

export default function AdminSettingsPage() {
  const { user } = useAuthUser();
  const canManageContent = hasPermission(user, 'content:manage');
  const [form, setForm] = useState<Settings>(ADMIN_SETTINGS);

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <>
      <PageHeader
        title="Paramètres"
        subtitle="Configuration globale de la plateforme"
        actions={
          <>
            <Link href="/admin/parametres/statistiques">
              <Button variant="outline" size="sm">
                Statistiques détaillées
              </Button>
            </Link>
            <Link href="/admin/parametres/config">
              <Button variant="outline" size="sm">
                Config
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => setForm(ADMIN_SETTINGS)}>
              Réinitialiser
            </Button>
            <Button variant="gold" size="sm">
              Sauvegarder
            </Button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Configuration emails">
          <Field
            label="Email expéditeur"
            value={form.emailFrom}
            onChange={(v) => set('emailFrom', v)}
          />
          <Field
            label="Nom de l'expéditeur"
            value={form.emailFromName}
            onChange={(v) => set('emailFromName', v)}
          />
          <Field label="SMTP Host" value={form.smtpHost} onChange={(v) => set('smtpHost', v)} />
          <Field
            label="SMTP Port"
            type="number"
            value={form.smtpPort}
            onChange={(v) => set('smtpPort', Number(v))}
          />
        </Card>

        <Card title="Sécurité">
          <Field
            label="Durée session admin (minutes)"
            type="number"
            value={form.sessionDurationMin}
            onChange={(v) => set('sessionDurationMin', Number(v))}
          />
          <Field
            label="Tentatives de connexion max"
            type="number"
            value={form.maxLoginAttempts}
            onChange={(v) => set('maxLoginAttempts', Number(v))}
          />
          <div className="border-t border-black/5 pt-2">
            <Toggle
              label="Authentification à deux facteurs"
              checked={form.twoFactor}
              onChange={(v) => set('twoFactor', v)}
            />
            <Toggle
              label="Journal des connexions"
              checked={form.loginJournal}
              onChange={(v) => set('loginJournal', v)}
            />
          </div>
        </Card>

        {canManageContent && <DomainesSettings />}
      </div>
    </>
  );
}
