import { SPEAKERS } from '@/data/homepageContent';
import { MobileScrollCarousel } from '@/components/shared/MobileScrollCarousel';

const GRADIENTS = [
  'from-brand-navy to-[#2152B6]',
  'from-[#3a1f5c] to-[#7c4dff]',
  'from-[#0f3d2e] to-[#24A775]',
  'from-[#4a2c1a] to-brand-gold',
];

interface SpeakerView {
  initials: string;
  name: string;
  role: string;
  company?: string;
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function SpeakerCard({ s, index }: { s: SpeakerView; index: number }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-brand-navy/10 bg-white shadow-sm">
      <div
        className={`flex aspect-square items-center justify-center bg-gradient-to-br ${GRADIENTS[index % GRADIENTS.length]}`}
      >
        <span className="text-5xl font-extrabold text-white/90">{s.initials}</span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-brand-navy">{s.name}</h3>
        <p className="text-sm text-brand-muted">
          {s.role}
          {s.company ? ` · ${s.company}` : ''}
        </p>
      </div>
    </article>
  );
}

const DEFAULT_SPEAKERS: SpeakerView[] = SPEAKERS.map((s) => ({
  initials: s.initials,
  name: s.name,
  role: s.role,
  company: s.company,
}));

/** Intervenants ; `speakers` (depuis l'événement vedette) sinon liste par défaut. */
export function SpeakersSection({ speakers }: { speakers?: { name: string; role?: string }[] }) {
  const items: SpeakerView[] =
    speakers && speakers.length > 0
      ? speakers.map((s) => ({ initials: initialsOf(s.name), name: s.name, role: s.role ?? '' }))
      : DEFAULT_SPEAKERS;

  return (
    <section id="intervenants" className="py-16">
      <div className="container">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-brand-gold">
          Porteurs &amp; co-animation
        </p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-3xl font-extrabold text-brand-navy">
            Des experts <span className="text-brand-gold">douane, logistique &amp; agri</span>
          </h2>
        </div>

        {/* ── Grille desktop (sm+) ── */}
        <div className="mt-10 hidden gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-4">
          {items.map((s, i) => (
            <SpeakerCard key={`${s.name}-${i}`} s={s} index={i} />
          ))}
        </div>
      </div>

      {/* ── Scroll manuel mobile (< sm) ── */}
      <MobileScrollCarousel count={items.length} className="mt-8 sm:hidden">
        {items.map((s, i) => (
          <div key={`${s.name}-${i}`} className="w-52 shrink-0 snap-start">
            <SpeakerCard s={s} index={i} />
          </div>
        ))}
      </MobileScrollCarousel>
    </section>
  );
}
