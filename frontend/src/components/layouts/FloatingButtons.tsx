'use client';

import { useEffect, useState } from 'react';
import { ArrowUp, Mail, MessageCircle, X } from 'lucide-react';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';

/** Construit l'URL wa.me à partir d'un numéro (digits uniquement). */
function whatsappUrl(num: string): string {
  return `https://wa.me/${num.replace(/\D/g, '')}`;
}

export function FloatingButtons() {
  const [showTop, setShowTop] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [support, setSupport] = useState<{ whatsapp: string; email: string }>({
    whatsapp: '',
    email: 'support@workclass.com',
  });

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    apiFetch<{ data: { whatsapp: string; email: string } }>('/content/support')
      .then((res) => setSupport(res.data))
      .catch(() => {});
  }, []);

  return (
    <div className="fixed bottom-5 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {/* ── Popup contact ── */}
      <div
        className={cn(
          'w-72 overflow-hidden rounded-2xl border border-brand-navy/10 bg-white shadow-2xl transition-all duration-300 origin-bottom-right sm:w-80',
          chatOpen ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0',
        )}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between bg-brand-navy px-4 py-3">
          <div>
            <p className="text-sm font-bold text-white">Besoin d&apos;aide ?</p>
            <p className="text-xs text-white/50">Notre équipe vous répond</p>
          </div>
          <button
            onClick={() => setChatOpen(false)}
            aria-label="Fermer"
            className="rounded-full p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Options de contact (WhatsApp + email uniquement, pas d'appel) */}
        <div className="flex flex-col gap-2.5 p-4">
          {support.whatsapp && (
            <a
              href={whatsappUrl(support.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-[#25D366]/30 bg-[#25D366]/5 px-4 py-3 text-[#128C7E] transition-colors hover:bg-[#25D366]/10"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#25D366]/20">
                <MessageCircle className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold">WhatsApp</p>
                <p className="text-xs opacity-70">{support.whatsapp}</p>
              </div>
            </a>
          )}

          {support.email && (
            <a
              href={`mailto:${support.email}`}
              className="flex items-center gap-3 rounded-xl border border-brand-navy/10 px-4 py-3 text-brand-navy transition-colors hover:bg-brand-navy/5"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-navy/10">
                <Mail className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold">Email</p>
                <p className="text-xs text-brand-muted">{support.email}</p>
              </div>
            </a>
          )}

          <Link
            href="/reservation"
            onClick={() => setChatOpen(false)}
            className="mt-1 rounded-full bg-brand-gold py-2.5 text-center text-sm font-bold text-brand-navy transition-colors hover:bg-brand-gold-hover"
          >
            Réserver ma place
          </Link>
        </div>
      </div>

      {/* ── Bouton chat / contact ── */}
      <button
        onClick={() => setChatOpen((v) => !v)}
        aria-label={chatOpen ? 'Fermer le contact' : 'Nous contacter'}
        className={cn(
          'flex size-12 items-center justify-center rounded-full shadow-lg transition-all duration-200 sm:size-14',
          chatOpen
            ? 'bg-brand-navy text-white'
            : 'bg-brand-gold text-brand-navy hover:bg-brand-gold-hover',
        )}
      >
        {chatOpen ? <X className="size-5" /> : <MessageCircle className="size-5" />}
      </button>

      {/* ── Bouton retour en haut ── */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Remonter en haut de la page"
        className={cn(
          'flex size-10 items-center justify-center rounded-full border border-brand-navy/15 bg-white text-brand-navy shadow-md transition-all duration-300 hover:border-brand-navy/25 hover:bg-brand-cream sm:size-11',
          showTop ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0',
        )}
      >
        <ArrowUp className="size-4" />
      </button>
    </div>
  );
}
