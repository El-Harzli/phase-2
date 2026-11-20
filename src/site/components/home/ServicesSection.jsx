import { useNavigate } from "react-router";
import { IoSparklesOutline } from "react-icons/io5";
import { MotionConfig } from "framer-motion";
import SectionHeader from "@/site/components/SectionHeader";
import ServicesCarousel from "@/site/components/home/ServicesCarousel";
import ServicesGrid from "@/site/components/home/ServicesGrid";

/* ============================================================
   ServicesSection — root.
   ============================================================ */
function ServicesSection() {
  const navigate = useNavigate();
  const onSelectService = (service) => navigate(service.to);

  return (
    <MotionConfig reducedMotion="user">
      <section className="relative bg-linear-to-b from-primary-600 via-primary-500 to-primary-600 py-9 md:py-20 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
          <div className="absolute top-10 right-10 w-48 h-48 bg-accent-500 rounded-full blur-[48px]"></div>
          <div className="absolute bottom-10 left-10 w-48 h-48 bg-gold-500 rounded-full blur-[48px]"></div>
        </div>

        <div className="wrapper relative z-10">
          <SectionHeader
            eyebrow="What We Offer"
            eyebrowIcon={IoSparklesOutline}
            title="Every Step, Expertly Guided"
            description="From your first visit to years of ownership, we bring local expertise and a discreet, white-glove standard to every property journey in Tangier."
          />

          <div className="md:hidden">
            <ServicesCarousel onSelectService={onSelectService} />
          </div>
          <div className="hidden md:block">
            <ServicesGrid onSelectService={onSelectService} />
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}

export default ServicesSection;
