/**
 * « Au service de toutes les industries » — section sombre, grille de tuiles.
 */
import { INDUSTRIES } from '@/data/homepageContent';

export function IndustriesSection() {
  return (
    <section className="bg-brand-navy py-16 text-white">
      <div className="container">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">
          Au service de toutes les industries
        </h2>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {INDUSTRIES.map((name) => (
            <div
              key={name}
              className="relative flex aspect-square items-end overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10"
            >
              {/* TODO: image d'illustration secteur */}
              <span className="w-full bg-gradient-to-t from-brand-navy/90 to-transparent p-3 text-sm font-medium">
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
