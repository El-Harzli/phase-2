import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { IoLocationOutline, IoChevronForward } from "react-icons/io5";
import useNeighborhoods from "@/site/hooks/useNeighborhoods";
import usePropertyCounts from "@/site/hooks/usePropertyCounts";
import DistrictCard from "@/site/components/home/DistrictCard";
import SectionHeader from "@/site/components/SectionHeader";

// First 3 by sort_order (managed at /admin/neighborhoods) — same grid
// layout as before, now driven by real, admin-editable content instead of
// a hardcoded array with stock photos.
const GRID_CLASSES = ["sm:col-span-2 lg:col-span-1", "sm:col-span-1 lg:col-span-2", "sm:col-span-1 lg:col-span-2"];

// How wide each card really renders, one entry per GRID_CLASSES entry (same
// column spans, so keep the two in step): full width on phones, then the
// span fractions above. A little generous on purpose — the section sits in
// a width-capped wrapper, so the real card is never wider than this says.
const DISTRICT_IMAGE_SIZES = [
  "(min-width: 1024px) 34vw, 100vw",
  "(min-width: 1024px) 67vw, (min-width: 640px) 50vw, 100vw",
  "(min-width: 1024px) 67vw, (min-width: 640px) 50vw, 100vw",
];

// Handles its own navigation (like the standalone /neighborhoods page)
// rather than taking onSelectDistrict/onViewAllDistricts callback props —
// one less thing to keep in sync between the two.
function NeighborhoodsSection() {
  const navigate = useNavigate();
  const { neighborhoods, loading: neighborhoodsLoading } = useNeighborhoods();
  const { loading: countsLoading, error: countsError, getPropertyCountForNeighborhoodByType } = usePropertyCounts();
  const featured = neighborhoods.slice(0, 3);

  // The whole section stays out of the page while anything it needs is still
  // loading, when there are no neighborhoods, and when the counts couldn't be
  // loaded: the cards say "N Rent / N Sale", and a wrong 0 there would be worse
  // than no section.
  if (neighborhoodsLoading || countsLoading || countsError || featured.length === 0) return null;

  function goToNeighborhoodType(area, listingType) {
    navigate(`/properties/${listingType}?neighborhood=${area.id}`);
  }

  return (
    <section className="bg-primary-500 py-10 sm:py-12 md:py-16 lg:py-20 overflow-hidden">
      <div className="wrapper">
        {/* HEADER */}
        <SectionHeader
          eyebrow="Tangier Lifestyle"
          title={
            <>
              Discover the <br />
              <span className="text-accent-500">Perfect District</span>
            </>
          }
        />

        {/* BENTO GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {featured.map((area, index) => (
            <DistrictCard
              key={area.id}
              area={area}
              index={index}
              rentCount={getPropertyCountForNeighborhoodByType(area.id, "rent")}
              saleCount={getPropertyCountForNeighborhoodByType(area.id, "sale")}
              onSelectType={goToNeighborhoodType}
              imageSizes={DISTRICT_IMAGE_SIZES[index]}
              className={`h-[260px] sm:h-[320px] md:h-[360px] lg:h-[420px] ${GRID_CLASSES[index] ?? ""}`}
            />
          ))}

          {/* INTEGRATED CTA TILE - now part of the grid at every breakpoint */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: featured.length * 0.1, duration: 0.5 }}
            whileTap={{ scale: 0.98 }}
            role="button"
            tabIndex={0}
            onClick={() => navigate("/neighborhoods")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate("/neighborhoods");
              }
            }}
            aria-label="Browse all districts"
            className="relative overflow-hidden rounded-[24px] bg-white border border-accent-500/10 shadow-sm p-7 sm:p-8 md:p-9 lg:p-10 flex flex-col justify-between group cursor-pointer h-[260px] sm:h-[320px] md:h-[360px] lg:h-[420px] sm:col-span-2 lg:col-span-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2"
          >
            <div className="space-y-4 sm:space-y-5 md:space-y-6">
              <div className="w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-2xl bg-accent-500/5 flex items-center justify-center">
                <IoLocationOutline className="text-accent-500 w-6 h-6 sm:w-6.5 sm:h-6.5 md:w-7 md:h-7" />
              </div>
              <h3 className="text-main text-[clamp(1.5rem,1.2rem+1vw,1.875rem)] font-semibold leading-[1.1] tracking-tight">
                Explore All <br /> <span className="text-accent-500">Neighborhoods</span>
              </h3>
              <p className="text-secondary/60 text-[13px] sm:text-[14px] leading-relaxed max-w-[220px]">
                Discover every district handpicked for sophistication.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.2em] text-accent-500 transition-transform duration-300 group-hover:translate-x-2">
              Browse More <IoChevronForward className="w-4 h-4" />
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-accent-500/5 rounded-full blur-3xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default NeighborhoodsSection;
