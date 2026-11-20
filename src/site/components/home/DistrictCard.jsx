import { motion } from "framer-motion";
import { IoLocationOutline, IoArrowForward } from "react-icons/io5";
import ResponsiveImage from "@/site/components/ResponsiveImage";

function DistrictCard({ area, className, index, rentCount, saleCount, onSelectType, imageSizes }) {
  // Same reasoning as the standalone /neighborhoods page: a district with
  // both rent and sale listings shows both as their own destinations
  // instead of guessing which one to send someone to.
  const hasRent = rentCount > 0;
  const hasSale = saleCount > 0;
  const hasBoth = hasRent && hasSale;
  const singleType = hasRent ? "rent" : "sale";
  const singleCount = hasRent ? rentCount : saleCount;

  // The whole card is only a click target when there's exactly one place to
  // send the visitor. With both types the card's own buttons do the routing,
  // and with no listings at all there's nothing to open — previously that
  // case still behaved like a button and landed people on an empty results
  // page, so it's now a plain, non-interactive card (no role, no pointer
  // cursor, no tap-scale feedback) that just says "No listings yet".
  const isInteractive = !hasBoth && singleCount > 0;

  const cardInteractionProps = isInteractive
    ? {
        role: "button",
        tabIndex: 0,
        onClick: () => onSelectType(area, singleType),
        onKeyDown: (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelectType(area, singleType);
          }
        },
        "aria-label": `Explore ${area.name} district`,
      }
    : {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileTap={isInteractive ? { scale: 0.98 } : undefined}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      {...cardInteractionProps}
      className={`relative overflow-hidden rounded-[24px] border border-gold-400/10 shadow-sm group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 ${
        isInteractive ? "cursor-pointer" : ""
      } ${className}`}
    >
      <ResponsiveImage
        src={area.image_url}
        alt={area.name}
        sizes={imageSizes}
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover select-none transition-transform duration-1000 group-hover:scale-105"
        style={{ objectPosition: `${(area.focal_x ?? 0.5) * 100}% ${(area.focal_y ?? 0.5) * 100}%` }}
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/20 to-transparent" />
      <div className="absolute inset-0 p-5 sm:p-6 md:p-8 flex flex-col justify-end">
        <div className="mb-2">
          <div className="flex items-center gap-1.5 text-white/70 mb-1">
            <IoLocationOutline className="w-3.5 h-3.5 text-gold-400" />
            <span className="uppercase text-[9px] font-bold tracking-[0.18em]">Tangier, Morocco</span>
          </div>
          <h3 className="text-white text-[clamp(1.375rem,1.05rem+1.1vw,1.75rem)] font-semibold mb-1 tracking-tight">
            {area.name}
          </h3>
          {area.description && (
            <p className="text-white/60 text-[12px] sm:text-[13px] max-w-[280px] leading-snug">{area.description}</p>
          )}
        </div>

        {hasBoth ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onSelectType(area, "rent")}
              className="flex-1 flex items-center justify-between gap-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-2 text-white text-[11px] font-semibold transition-colors hover:bg-accent-500 hover:border-accent-500 cursor-pointer"
            >
              <span>{rentCount} Rent</span>
              <IoArrowForward className="w-3.5 h-3.5 shrink-0" />
            </button>
            <button
              type="button"
              onClick={() => onSelectType(area, "sale")}
              className="flex-1 flex items-center justify-between gap-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-2 text-white text-[11px] font-semibold transition-colors hover:bg-accent-500 hover:border-accent-500 cursor-pointer"
            >
              <span>{saleCount} Sale</span>
              <IoArrowForward className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
        ) : singleCount > 0 ? (
          <div className="flex items-end justify-between gap-4">
            <p className="text-gold-400/90 text-[11px] font-medium uppercase tracking-[0.1em]">
              {singleCount} {singleCount === 1 ? "property" : "properties"}
            </p>
            <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 shadow-lg transition-colors duration-300 group-hover:bg-accent-500 group-hover:border-accent-500 group-active:scale-90">
              <IoArrowForward className="w-5 h-5" />
            </div>
          </div>
        ) : (
          <p className="text-white/50 text-[11px] uppercase tracking-[0.1em]">No listings yet</p>
        )}
      </div>
    </motion.div>
  );
}

export default DistrictCard;
