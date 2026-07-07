'use client';

/**
 * Connexion administrateur — formulaire connecté au backend (POST /auth/login).
 * Pas de logique métier ici : validation côté serveur, tokens stockés via lib/auth.
 */
import { ArrowLeft, Eye, EyeOff, Loader2, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';

import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { ApiError, apiFetch } from '@/lib/api';
import { setSession, type AuthSession } from '@/lib/auth';
import { LoginAnimation } from '@/components/admin/LoginAnimation';

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
    'w-full rounded-xl border border-black/10 bg-black/5 px-4 py-3 text-sm text-brand-navy placeholder:text-brand-navy/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:bg-white';

  return (
    <main className="flex min-h-screen bg-brand-cream">
      {/* Colonne Gauche: Animation et branding (Desktop uniquement) */}
      <LoginAnimation />

      {/* Colonne Droite: Formulaire de connexion */}
      <div className="relative flex w-full flex-col justify-center px-6 py-12 lg:w-[600px] lg:shrink-0 lg:px-16 xl:px-24">
        {/* Lien retour accueil */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute left-6 top-6 lg:left-12 lg:top-12"
        >
          <Link
            href={ROUTES.public.home}
            className="group flex items-center gap-2 text-sm font-medium text-brand-navy/50 transition-colors hover:text-brand-navy"
          >
            <div className="flex size-8 items-center justify-center rounded-full bg-black/5 transition-transform group-hover:-translate-x-1 group-hover:bg-black/10">
              <ArrowLeft className="size-4" />
            </div>
            <span>Retour à l&apos;accueil</span>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto w-full max-w-sm"
        >
          <div className="flex justify-center lg:justify-start">
            <Logo />
          </div>
          
          <div className="mt-10 lg:mt-12">
            <h1 className="text-3xl font-extrabold tracking-tight text-brand-navy lg:text-4xl">
              Bon retour.
            </h1>
            <p className="mt-2 text-base text-brand-navy/60">
              Connectez-vous pour accéder à votre espace administrateur.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-10 space-y-6" noValidate>
            <div className="space-y-4">
              <label className="block space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-navy/70">
                  Adresse Email
                </span>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="admin@workclass.ga"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </label>

              <label className="block space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-navy/70">
                    Mot de passe
                  </span>
                  {/* On pourrait ajouter un lien "Mot de passe oublié ?" ici dans la V2 */}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-brand-navy/40 transition-colors hover:text-brand-navy"
                  >
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </label>
            </div>

            {error ? (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="overflow-hidden"
              >
                <p role="alert" className="rounded-xl border border-semantic-error/20 bg-semantic-error/10 px-4 py-3 text-sm font-medium text-semantic-error">
                  {error}
                </p>
              </motion.div>
            ) : null}

            <Button 
              type="submit" 
              variant="navy" 
              size="lg" 
              className="group h-12 w-full text-base font-semibold shadow-lg shadow-brand-navy/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-navy/30" 
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 size-5 animate-spin" />
              ) : (
                <LogIn className="mr-2 size-5 transition-transform group-hover:scale-110" />
              )}
              {loading ? 'Authentification…' : 'Connexion'}
            </Button>
          </form>
        </motion.div>
      </div>
    </main>
  );
}
