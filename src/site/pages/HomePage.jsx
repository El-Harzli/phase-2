import usePageTitle from "@/shared/seo/usePageTitle";
import usePageMeta from "@/shared/seo/usePageMeta";
import { PAGE_META } from "@/shared/seo/pageMeta";
import HeroSection from "@/site/components/home/HeroSection";
import ServicesSection from "@/site/components/home/ServicesSection";
import FeaturedPropertiesSection from "@/site/components/home/FeaturedPropertiesSection";
import WhyUsSection from "@/site/components/home/WhyUsSection";
import NeighborhoodsSection from "@/site/components/home/NeighborhoodsSection";
import MissionSection from "@/site/components/home/MissionSection";
import ConciergeSection from "@/site/components/home/ConciergeSection";

function HomePage() {
  usePageTitle(PAGE_META.home.title);
  usePageMeta(PAGE_META.home.description);

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
