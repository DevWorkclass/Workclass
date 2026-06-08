'use client';

/**
 * Admin — Paramètres → Paie.
 *  - Numéros mobile money (Airtel Money, Mobile Cash) : /content/payment-config (guard payments:manage)
 *  - Contact support (WhatsApp + email, pas d'appel)     : /content/support (guard content:manage)
 */
import { useEffect, useState } from 'react';

import { PageHeader } from '@/components/admin/PageHeader';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { apiAuth, apiFetch, ApiError } from '@/lib/api';

interface PaymentConfig {
  airtelMoney: string;
  mobileCash: string;
  instructions: string;
}
interface SupportConfig {
  whatsapp: string;
  email: string;
}

const inputClass =
  'mt-1 w-full rounded-lg border border-black/10 bg-brand-cream px-4 py-2.5 text-sm text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold';
const labelClass = 'text-xs font-semibold uppercase tracking-wider text-brand-muted';

function errMsg(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.status === 403) return 'Permission requise pour cette section.';
  if (err instanceof ApiError && err.status === 422) return 'Valeur invalide (numéro ou email).';
  return fallback;
}

export default function AdminPaiePage() {
  const [payment, setPayment] = useState<PaymentConfig | null>(null);
  const [support, setSupport] = useState<SupportConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [payMsg, setPayMsg] = useState<string | null>(null);
  const [supMsg, setSupMsg] = useState<string | null>(null);
  const [savingPay, setSavingPay] = useState(false);
  const [savingSup, setSavingSup] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch<{ data: PaymentConfig }>('/content/payment-config').then((r) => setPayment(r.data)),
      apiFetch<{ data: SupportConfig }>('/content/support').then((r) => setSupport(r.data)),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const savePayment = async () => {
    if (!payment) return;
    try {
      setPayMsg(null);
      setSavingPay(true);
      await apiAuth('/admin/content/payment-config', { method: 'POST', body: JSON.stringify(payment) });
      setPayMsg('✓ Paiement enregistré.');
    } catch (err) {
      setPayMsg(errMsg(err, "L'enregistrement a échoué."));
    } finally {
      setSavingPay(false);
    }
  };

  const saveSupport = async () => {
    if (!support) return;
    try {
      setSupMsg(null);
      setSavingSup(true);
      await apiAuth('/admin/content/support', { method: 'POST', body: JSON.stringify(support) });
      setSupMsg('✓ Support enregistré.');
    } catch (err) {
      setSupMsg(errMsg(err, "L'enregistrement a échoué."));
    } finally {
      setSavingSup(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Paie & Support"
        subtitle="Numéros mobile money et contact support client"
        backHref="/admin/parametres"
      />

      {loading || !payment || !support ? (
        <LoadingSpinner label="Chargement…" />
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Paiement mobile money */}
          <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-brand-navy">Paiement (mobile money)</h2>
                <p className="text-sm text-brand-muted">Numéros de réception affichés au paiement.</p>
              </div>
              <Button variant="gold" size="sm" disabled={savingPay} onClick={savePayment}>
                {savingPay ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
            </div>
            {payMsg && <p className="mt-3 text-sm text-brand-navy">{payMsg}</p>}
            <div className="mt-5 space-y-4">
              <label className="block">
                <span className={labelClass}>Airtel Money</span>
                <input
                  value={payment.airtelMoney}
                  onChange={(e) => setPayment({ ...payment, airtelMoney: e.target.value })}
                  placeholder="+241…"
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className={labelClass}>Mobile Cash</span>
                <input
                  value={payment.mobileCash}
                  onChange={(e) => setPayment({ ...payment, mobileCash: e.target.value })}
                  placeholder="+241…"
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className={labelClass}>Instructions de paiement</span>
                <textarea
                  value={payment.instructions}
                  onChange={(e) => setPayment({ ...payment, instructions: e.target.value })}
                  rows={3}
                  className={inputClass}
                />
              </label>
            </div>
          </section>

          {/* Support client */}
          <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-brand-navy">Support client</h2>
                <p className="text-sm text-brand-muted">WhatsApp et email (pas d&apos;appel).</p>
              </div>
              <Button variant="gold" size="sm" disabled={savingSup} onClick={saveSupport}>
                {savingSup ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
            </div>
            {supMsg && <p className="mt-3 text-sm text-brand-navy">{supMsg}</p>}
            <div className="mt-5 space-y-4">
              <label className="block">
                <span className={labelClass}>Numéro WhatsApp</span>
                <input
                  value={support.whatsapp}
                  onChange={(e) => setSupport({ ...support, whatsapp: e.target.value })}
                  placeholder="+241…"
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className={labelClass}>Email de support</span>
                <input
                  value={support.email}
                  onChange={(e) => setSupport({ ...support, email: e.target.value })}
                  placeholder="support@…"
                  className={inputClass}
                />
              </label>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
