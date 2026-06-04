'use client';

/**
 * Connexion administrateur — formulaire connecté au backend (POST /auth/login).
 * Pas de logique métier ici : validation côté serveur, tokens stockés via lib/auth.
 */
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { ApiError, apiFetch } from '@/lib/api';
import { setSession, type AuthSession } from '@/lib/auth';

interface LoginResponse {
  success: boolean;
  data: AuthSession;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setSession(res.data);
      router.replace(ROUTES.admin.dashboard);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setError('Trop de tentatives. Réessayez dans quelques minutes.');
      } else if (err instanceof ApiError && err.status === 401) {
        setError('Identifiants invalides.');
      } else {
        setError('Connexion impossible. Vérifiez votre réseau et réessayez.');
      }
      setLoading(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-black/10 bg-brand-cream px-4 py-2.5 text-sm text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold';

  return (
    <main className="grid min-h-screen place-items-center bg-brand-cream px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-black/5 bg-white p-8 shadow-lg">
        <div className="flex justify-center">
          <Logo />
        </div>
        <h1 className="mt-6 text-center text-2xl font-extrabold text-brand-navy">
          Connexion administrateur
        </h1>
        <p className="mt-1 text-center text-sm text-brand-muted">
          Accès réservé à l&apos;équipe Work Class Gabon.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
              Email
            </span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`mt-2 ${inputClass}`}
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
              Mot de passe
            </span>
            <div className="relative mt-2">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputClass} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                className="absolute inset-y-0 right-0 grid w-11 place-items-center text-brand-muted"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </label>

          {error ? (
            <p role="alert" className="rounded-lg bg-semantic-error/10 px-3 py-2 text-sm text-semantic-error">
              {error}
            </p>
          ) : null}

          <Button type="submit" variant="navy" size="lg" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <LogIn className="size-4" />
            )}
            {loading ? 'Connexion…' : 'Se connecter'}
          </Button>
        </form>
      </div>
    </main>
  );
}
