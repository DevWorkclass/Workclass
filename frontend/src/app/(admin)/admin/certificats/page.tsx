/**
 * Admin — Certificats (génération automatique post-événement). Données mock.
 */
import { Badge } from '@/components/admin/Badge';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Button } from '@/components/ui/button';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { ADMIN_CERTIFICATES } from '@/data/adminMockData';

export default function AdminCertificatesPage() {
  return (
    <PermissionGuard permission="tickets:generate">
      <CertificatesContent />
    </PermissionGuard>
  );
}

function CertificatesContent() {
  return (
    <>
      <PageHeader
        title="Certificats"
        subtitle="Génération automatique post-événement"
        actions={
          <>
            <Button variant="outline" size="sm">
              Aperçu
            </Button>
            <Button variant="gold" size="sm">
              Envoyer à tous
            </Button>
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Générés" value={0} hint="Post-événement (16 Juil. +)" accent="gold" />
        <StatCard label="Envoyés" value={0} hint="Après clôture" accent="green" />
        <StatCard label="Participants éligibles" value={227} hint="↑ Inscrits confirmés" accent="blue" />
      </section>

      {/* Aperçu du certificat */}
      <section className="mt-6 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="font-bold text-brand-navy">Aperçu du certificat</h2>
        <div className="mt-6 flex justify-center">
          <div className="w-full max-w-xl rounded-xl border-2 border-brand-gold/50 bg-gradient-to-br from-brand-gold/10 to-white p-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-muted">
              Work Class Gabon · certifie que
            </p>
            <p className="mt-5 text-3xl font-extrabold text-brand-navy">[Nom du Participant]</p>
            <p className="mt-3 text-sm text-brand-muted">a participé au</p>
            <p className="mt-2 text-xl font-bold text-brand-gold">Work Class Summit Gabon 2026</p>
            <p className="mt-2 text-sm text-brand-muted">
              15 &amp; 16 Juillet 2026 · Palais des Congrès, Libreville
            </p>
            <div className="mt-8 flex justify-between border-t border-brand-gold/20 pt-5 text-sm">
              <div className="text-left">
                <p className="text-brand-muted">Signature du Directeur</p>
              </div>
              <div className="text-right">
                <p className="text-brand-muted">Date de délivrance</p>
                <p className="font-bold text-brand-navy">17 Juillet 2026</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Table statuts */}
      <section className="mt-6 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="font-bold text-brand-navy">Participants — Statut certificats</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-brand-muted">
                <th className="pb-3 font-semibold">Participant</th>
                <th className="pb-3 font-semibold">Billet</th>
                <th className="pb-3 font-semibold">Présence confirmée</th>
                <th className="pb-3 font-semibold">Certificat généré</th>
                <th className="pb-3 font-semibold">Envoyé</th>
                <th className="pb-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ADMIN_CERTIFICATES.map((c) => (
                <tr key={c.participant} className="border-t border-black/5">
                  <td className="py-3 font-semibold text-brand-navy">{c.participant}</td>
                  <td className="py-3 text-brand-navy">{c.ticket}</td>
                  <td className="py-3">
                    <Badge tone={c.presenceConfirmed ? 'success' : 'neutral'}>
                      {c.presenceConfirmed ? 'Confirmée' : 'À confirmer'}
                    </Badge>
                  </td>
                  <td className="py-3">
                    <Badge tone={c.generated ? 'success' : 'warning'}>
                      {c.generated ? 'Généré' : 'En attente'}
                    </Badge>
                  </td>
                  <td className="py-3 text-brand-muted">{c.sent ? '✓' : '—'}</td>
                  <td className="py-3">
                    <Button variant="outline" size="sm">
                      Préparer
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
