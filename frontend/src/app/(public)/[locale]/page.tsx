/**
 * Page d'accueil — Server Component async avec ISR (revalidate 120s).
 * Les données sont fetchées côté serveur Next.js et passées en props aux
 * composants clients → zéro délai visible, même si Render est en cold start.
 * La revalidation en arrière-plan maintient aussi Render éveillé.
 */
import { PromotersSection } from '@/components/sections/PromotersSection';
import { EventsPreviewSection } from '@/components/sections/EventsPreviewSection';
import { FaqSection } from '@/components/sections/FaqSection';
import { FeatureStrip } from '@/components/sections/FeatureStrip';
import { FinalCta } from '@/components/sections/FinalCta';
import { IndustriesSection } from '@/components/sections/IndustriesSection';
import { PartnerBanner } from '@/components/sections/PartnerBanner';
import { PartnersSection } from '@/components/sections/PartnersSection';
import { TestimonialsSection } from '@/components/sections/TestimonialsSection';
import { ThemesSection } from '@/components/sections/ThemesSection';
import { HeroDynamic } from '@/components/sections/HeroDynamic';
import { HomeSplash } from '@/components/sections/HomeSplash';
import type { PublicEvent } from '@/lib/public-event';

const REVALIDATE = 120; // secondes — re-fetch en arrière-plan toutes les 2 min

async function fetchHomeData(): Promise<{ events: PublicEvent[]; featuredId: string | null }> {
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api').replace(/\/$/, '');
  try {
    const [eventsRes, featuredRes] = await Promise.all([
      fetch(`${apiUrl}/public/events`, { next: { revalidate: REVALIDATE } }),
      fetch(`${apiUrl}/content/featured`, { next: { revalidate: REVALIDATE } }),
    ]);
    const events: PublicEvent[] = eventsRes.ok ? ((await eventsRes.json()).data ?? []) : [];
    const featuredId: string | null = featuredRes.ok
      ? ((await featuredRes.json()).data?.eventId ?? null)
      : null;
    return { events, featuredId };
  } catch {
    return { events: [], featuredId: null };
  }
}

function resolveFeatured(events: PublicEvent[], featuredId: string | null): PublicEvent | null {
  if (featuredId) {
    const chosen = events.find((e) => e.id === featuredId);
    if (chosen) return chosen;
  }
  const withTickets = events.filter((e) => e.ticketTypes.length > 0);
  const pool = withTickets.length > 0 ? withTickets : events;
  return (
    [...pool].sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    )[0] ?? null
  );
}

export default async function HomePage() {
  const { events, featuredId } = await fetchHomeData();
  const featured = resolveFeatured(events, featuredId);
  const previewEvents = [...events]
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    .slice(0, 3);

  return (
    <>
      <HomeSplash />
      <HeroDynamic initialEvent={featured} />
      <FeatureStrip />
      <EventsPreviewSection initialEvents={previewEvents} />
      <PartnerBanner />
      <ThemesSection />
      <IndustriesSection />
      <PromotersSection />
      <TestimonialsSection />
      <PartnersSection />
      <FaqSection />
      <FinalCta />
    </>
  );
}
