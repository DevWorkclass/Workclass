'use client';

/**
 * Réglage admin — contenu du footer (description, contact, colonnes de liens).
 *  - GET  /content/footer
 *  - POST /admin/content/footer  { description, contactEmail, location, columns }
 * Les href sont validés côté backend (anti-XSS : pas de javascript:/data:).
 */
import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { apiAuth, apiFetch, ApiError } from '@/lib/api';

interface FooterLink {
  label: string;
  href: string;
}
interface FooterColumn {
  title: string;
  links: FooterLink[];
}
interface FooterContent {
  description: string;
  contactEmail: string;
  location: string;
  columns: FooterColumn[];
}

const inputClass =
  'w-full rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold';

export function FooterSettings() {
  const [footer, setFooter] = useState<FooterContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmLink, setConfirmLink] = useState<{ ci: number; li: number } | null>(null);

  useEffect(() => {
    apiFetch<{ data: FooterContent }>('/content/footer')
      .then((res) => setFooter(res.data))
      .catch(() => setError('Impossible de charger le footer.'))
      .finally(() => setLoading(false));
  }, []);

  const update = (patch: Partial<FooterContent>) =>
    setFooter((f) => (f ? { ...f, ...patch } : f));

  const patchColumn = (ci: number, patch: Partial<FooterColumn>) =>
    setFooter((f) =>
      f ? { ...f, columns: f.columns.map((c, i) => (i === ci ? { ...c, ...patch } : c)) } : f,
    );

  const patchLink = (ci: number, li: number, patch: Partial<FooterLink>) =>
    setFooter((f) =>
      f
        ? {
            ...f,
            columns: f.columns.map((c, i) =>
              i === ci
                ? { ...c, links: c.links.map((l, j) => (j === li ? { ...l, ...patch } : l)) }
                : c,
            ),
          }
        : f,
    );

  const saveData = async (data: FooterContent) => {
    try {
      setError(null);
      setMessage(null);
      setSaving(true);
      await apiAuth('/admin/content/footer', { method: 'POST', body: JSON.stringify(data) });
      setMessage('Footer enregistré.');
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setError('Un lien est invalide (href non autorisé).');
      } else if (err instanceof ApiError && err.status === 403) {
        setError('Permission « Gérer le contenu du site » requise.');
      } else {
        setError("L'enregistrement a échoué.");
      }
    } finally {
      setSaving(false);
    }
  };

  const save = () => { if (footer) void saveData(footer); };

  return (
    <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-brand-navy">Contenu du footer</h2>
          <p className="text-sm text-brand-muted">Description, contact et colonnes de liens.</p>
        </div>
        <Button variant="gold" size="sm" disabled={saving || loading || !footer} onClick={() => save()}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </div>

      {message && <p className="mt-3 text-sm text-semantic-success">{message}</p>}
      {error && (
        <p role="alert" className="mt-3 text-sm text-semantic-error">
          {error}
        </p>
      )}

      {loading || !footer ? (
        <p className="mt-5 text-sm text-brand-muted">Chargement…</p>
      ) : (
        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
              Description
            </span>
            <textarea
              value={footer.description}
              onChange={(e) => update({ description: e.target.value })}
              rows={2}
              className={`mt-1 ${inputClass}`}
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                Email de contact
              </span>
              <input
                value={footer.contactEmail}
                onChange={(e) => update({ contactEmail: e.target.value })}
                className={`mt-1 ${inputClass}`}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                Lieu
              </span>
              <input
                value={footer.location}
                onChange={(e) => update({ location: e.target.value })}
                className={`mt-1 ${inputClass}`}
              />
            </label>
          </div>

          {footer.columns.map((col, ci) => (
            <div key={ci} className="rounded-xl border border-black/5 bg-brand-cream p-3">
              <input
                value={col.title}
                onChange={(e) => patchColumn(ci, { title: e.target.value })}
                placeholder="Titre de colonne"
                className={`${inputClass} font-semibold`}
              />
              <div className="mt-2 space-y-2">
                {col.links.map((link, li) => (
                  <div key={li} className="flex gap-2">
                    <input
                      value={link.label}
                      onChange={(e) => patchLink(ci, li, { label: e.target.value })}
                      placeholder="Libellé"
                      className={inputClass}
                    />
                    <input
                      value={link.href}
                      onChange={(e) => patchLink(ci, li, { href: e.target.value })}
                      placeholder="/page, #ancre, https://… ou mailto:"
                      className={inputClass}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-semantic-error"
                      onClick={() => setConfirmLink({ ci, li })}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => patchColumn(ci, { links: [...col.links, { label: '', href: '' }] })}
                >
                  <Plus className="mr-1 size-4" /> Lien
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmLink !== null}
        title="Supprimer ce lien ?"
        description="Ce lien sera retiré définitivement de la colonne du footer."
        confirmLabel="Supprimer"
        onCancel={() => setConfirmLink(null)}
        onConfirm={() => {
          if (!confirmLink || !footer) { setConfirmLink(null); return; }
          const { ci, li } = confirmLink;
          const updated: FooterContent = {
            ...footer,
            columns: footer.columns.map((c, i) =>
              i === ci ? { ...c, links: c.links.filter((_, j) => j !== li) } : c,
            ),
          };
          setConfirmLink(null);
          setFooter(updated);
          void saveData(updated);
        }}
      />
    </section>
  );
}
