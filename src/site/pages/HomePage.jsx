import usePageTitle from "@/shared/seo/usePageTitle";
import usePageMeta from "@/shared/seo/usePageMeta";
import HeroSection from "@/site/components/home/HeroSection";
import ServicesSection from "@/site/components/home/ServicesSection";
import FeaturedPropertiesSection from "@/site/components/home/FeaturedPropertiesSection";
import WhyUsSection from "@/site/components/home/WhyUsSection";
import NeighborhoodsSection from "@/site/components/home/NeighborhoodsSection";
import MissionSection from "@/site/components/home/MissionSection";
import ConciergeSection from "@/site/components/home/ConciergeSection";

function HomePage() {
  usePageTitle("Luxury Real Estate in Tangier");
  usePageMeta(
    "Browse verified villas and apartments for sale and rent in Tangier, Morocco. Curated listings, private concierge service, and 15+ years of local real estate expertise from BSI Properties.",
  );

  return (
    <>
      <HeroSection />
      <ServicesSection />
      <FeaturedPropertiesSection />
      <WhyUsSection />
      <NeighborhoodsSection />
      <MissionSection />
      <ConciergeSection />
    </>
  );
}

export default HomePage;
