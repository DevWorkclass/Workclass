'use client';

/**
 * Admin — Mon profil. Auto-service : prénom, nom, mot de passe.
 *  - GET  /auth/me          : infos du compte courant
 *  - POST /auth/profile     : mise à jour prénom / nom
 *  - POST /auth/password    : changement de mot de passe (vérifie l'actuel)
 *
 * L'email est en lecture seule (modification réservée aux super-admins via /admin/utilisateurs).
 */
import { useEffect, useState } from 'react';
import { Mail, ShieldCheck } from 'lucide-react';

import { PageHeader } from '@/components/admin/PageHeader';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { apiAuth, ApiError } from '@/lib/api';

interface MeResponse {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'admin' | 'super_admin';
  permissions: string[];
  isActive: boolean;
  lastLoginAt: string | null;
}

const ROLE_LABEL: Record<MeResponse['role'], string> = {
  super_admin: 'Super-administrateur',
  admin: 'Administrateur',
};

export default function AdminProfilePage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Profil
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [confirmProfile, setConfirmProfile] = useState(false);

  // Mot de passe
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMessage, setPwdMessage] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [savingPwd, setSavingPwd] = useState(false);
  const [confirmPwd, setConfirmPwd] = useState(false);

  useEffect(() => {
    apiAuth<{ data: MeResponse }>('/auth/me')
      .then((res) => {
        setMe(res.data);
        setFirstName(res.data.firstName ?? '');
        setLastName(res.data.lastName ?? '');
      })
      .catch(() => setError('Impossible de charger votre profil.'))
      .finally(() => setLoading(false));
  }, []);

  const doSaveProfile = async () => {
    try {
      setSavingProfile(true);
      setProfileError(null);
      setProfileMessage(null);
      const res = await apiAuth<{ data: MeResponse }>('/auth/profile', {
        method: 'POST',
        body: JSON.stringify({ firstName, lastName }),
      });
      setMe(res.data);
      setProfileMessage('Profil mis à jour.');
    } catch (err) {
      setProfileError(
        err instanceof ApiError ? err.message : 'Échec de la mise à jour du profil.',
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const doChangePassword = async () => {
    try {
      setSavingPwd(true);
      setPwdError(null);
      setPwdMessage(null);
      if (newPassword !== confirmPassword) {
        setPwdError('La confirmation ne correspond pas au nouveau mot de passe.');
        return;
      }
      await apiAuth('/auth/password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setPwdMessage('Mot de passe mis à jour.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwdError(err instanceof ApiError ? err.message : 'Échec du changement de mot de passe.');
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <>
      <PageHeader title="Mon profil" subtitle="Informations de votre compte" />

      {loading && <p className="text-sm text-brand-muted">Chargement…</p>}
      {error && (
        <p role="alert" className="rounded-md bg-semantic-error/10 p-4 text-sm text-semantic-error">
          {error}
        </p>
      )}

      {me && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Carte identité */}
          <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-bold text-brand-navy">Identité</h2>

            <div className="mb-5 flex items-center gap-3 rounded-xl bg-brand-cream p-3 text-sm">
              <Mail className="size-4 shrink-0 text-brand-gold" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-wider text-brand-muted">Email</p>
                <p className="break-all font-semibold text-brand-navy">{me.email}</p>
              </div>
              <span className="rounded-full bg-brand-navy/5 px-2 py-1 text-[10px] font-semibold uppercase text-brand-muted">
                lecture seule
              </span>
            </div>

            <div className="mb-5 flex items-center gap-3 rounded-xl bg-brand-cream p-3 text-sm">
              <ShieldCheck className="size-4 shrink-0 text-brand-gold" />
              <div className="flex-1">
                <p className="text-[11px] uppercase tracking-wider text-brand-muted">Rôle</p>
                <p className="font-semibold text-brand-navy">{ROLE_LABEL[me.role]}</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  Prénom
                </span>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  maxLength={60}
                  className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  Nom
                </span>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  maxLength={60}
                  className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                />
              </label>

              {profileMessage && (
                <p className="text-sm text-semantic-success">{profileMessage}</p>
              )}
              {profileError && (
                <p role="alert" className="text-sm text-semantic-error">
                  {profileError}
                </p>
              )}

              <Button
                variant="gold"
                size="sm"
                disabled={savingProfile}
                onClick={() => setConfirmProfile(true)}
              >
                {savingProfile ? 'Enregistrement…' : 'Enregistrer le profil'}
              </Button>
            </div>
          </section>

          {/* Carte mot de passe */}
          <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-bold text-brand-navy">Mot de passe</h2>
            <p className="mb-4 text-xs text-brand-muted">
              Vous devez fournir votre mot de passe actuel pour le changer.
            </p>
            <div className="space-y-4">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  Mot de passe actuel
                </span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  Nouveau mot de passe (≥ 8 caractères)
                </span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  Confirmer le nouveau mot de passe
                </span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                />
              </label>

              {pwdMessage && <p className="text-sm text-semantic-success">{pwdMessage}</p>}
              {pwdError && (
                <p role="alert" className="text-sm text-semantic-error">
                  {pwdError}
                </p>
              )}

              <Button
                variant="gold"
                size="sm"
                disabled={savingPwd || !currentPassword || !newPassword || !confirmPassword}
                onClick={() => setConfirmPwd(true)}
              >
                {savingPwd ? 'Mise à jour…' : 'Changer le mot de passe'}
              </Button>
            </div>
          </section>
        </div>
      )}

      {/* Double confirmation profil */}
      <ConfirmDialog
        open={confirmProfile}
        title="Mettre à jour le profil ?"
        description={
          me ? `Les nouvelles informations remplaceront vos données actuelles (${me.email}).` : undefined
        }
        confirmLabel="Mettre à jour"
        onCancel={() => setConfirmProfile(false)}
        onConfirm={() => {
          setConfirmProfile(false);
          void doSaveProfile();
        }}
      />

      {/* Double confirmation mot de passe */}
      <ConfirmDialog
        open={confirmPwd}
        title="Changer le mot de passe ?"
        description="Vos prochaines connexions devront utiliser le nouveau mot de passe."
        confirmLabel="Changer"
        onCancel={() => setConfirmPwd(false)}
        onConfirm={() => {
          setConfirmPwd(false);
          void doChangePassword();
        }}
      />
    </>
  );
}
