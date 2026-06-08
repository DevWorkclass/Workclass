/**
 * Page d'accueil publique — mise en avant de l'événement unique.
 * Données: mockData (statique) en attendant le branchement API.
 */
import { ChronogrammeSection } from '@/components/sections/ChronogrammeSection';
import { EventDetailSection } from '@/components/sections/EventDetailSection';
import { EventsPreviewSection } from '@/components/sections/EventsPreviewSection';
import { FaqSection } from '@/components/sections/FaqSection';
import { FeatureStrip } from '@/components/sections/FeatureStrip';
import { FinalCta } from '@/components/sections/FinalCta';
import { IndustriesSection } from '@/components/sections/IndustriesSection';
import { PartnerBanner } from '@/components/sections/PartnerBanner';
import { PartnersSection } from '@/components/sections/PartnersSection';
import { SpeakersSection } from '@/components/sections/SpeakersSection';
import { TestimonialsSection } from '@/components/sections/TestimonialsSection';
import { ThemesSection } from '@/components/sections/ThemesSection';
import { HeroSection } from '@/domains/public/event/components/HeroSection';
import { MOCK_EVENT } from '@/data/mockData';

export default function HomePage() {
  const event = MOCK_EVENT;

  return (
    <>
      <HeroSection event={event} />
      <FeatureStrip />
      <EventsPreviewSection />
      <PartnerBanner />
      <ThemesSection />
      <IndustriesSection />
      <EventDetailSection event={event} />
      <ChronogrammeSection />
      <SpeakersSection />
      <TestimonialsSection />
      <PartnersSection />
      <FaqSection />
      <FinalCta />
    </>
  );
}
