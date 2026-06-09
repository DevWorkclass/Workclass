/**
 * Page d'accueil publique — mise en avant de l'événement unique.
 * Données: mockData (statique) en attendant le branchement API.
 */
import { FeaturedSections } from '@/components/sections/FeaturedSections';
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

export default function HomePage() {
  return (
    <>
      <HomeSplash />
      <HeroDynamic />
      <FeatureStrip />
      <EventsPreviewSection />
      <PartnerBanner />
      <ThemesSection />
      <IndustriesSection />
      <FeaturedSections />
      <TestimonialsSection />
      <PartnersSection />
      <FaqSection />
      <FinalCta />
    </>
  );
}
