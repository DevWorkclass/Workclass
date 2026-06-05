import { INDUSTRIES } from '@/data/homepageContent';

const TILE_GRADIENTS = [
  'from-[#0a2510] to-[#15803d]',
  'from-[#0a1628] to-[#1d4ed8]',
  'from-[#251500] to-[#b45309]',
  'from-[#1a0a30] to-[#6d28d9]',
  'from-[#0a2a20] to-[#0f766e]',
  'from-[#251a00] to-[#92400e]',
  'from-[#0a1a28] to-[#0369a1]',
  'from-[#200a0a] to-[#991b1b]',
];

export function IndustriesSection() {
  return (
    <section className="bg-brand-navy py-16 text-white">
      <div className="container">
        <p className="mb-2 text-center text-xs font-bold uppercase tracking-[0.25em] text-brand-gold">
          Domaines couverts
        </p>
        <h2 className="text-center text-2xl font-bold sm:text-3xl">
          Au service de toutes les industries
        </h2>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {INDUSTRIES.map((name, i) => (
            <div
              key={name}
              className={`relative flex aspect-square items-end overflow-hidden rounded-xl bg-gradient-to-br ${TILE_GRADIENTS[i % TILE_GRADIENTS.length]} ring-1 ring-white/10`}
            >
              <span className="w-full bg-gradient-to-t from-black/70 to-transparent p-3 text-sm font-semibold">
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
