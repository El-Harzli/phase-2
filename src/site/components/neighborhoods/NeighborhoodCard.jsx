import { motion } from "framer-motion";
import { IoLocationOutline, IoArrowForward } from "react-icons/io5";
import ResponsiveImage from "@/site/components/ResponsiveImage";

// The pill buttons/badge below use a plain semi-opaque `bg-black/35`
// rather than `backdrop-blur` — backdrop-filter forces the browser to
// continuously resample whatever's beneath it, every frame it's on
// screen. With several cards visible at once in this grid (each with 1-2
// of these), plus the page header's own blurred backdrop, that compounds
// into exactly the kind of scroll frame-rate drop this page was seeing,
// especially on integrated-GPU laptops. A flat translucent background
// sitting on the existing dark gradient overlay reads almost identically
// but costs nothing to composite.
function NeighborhoodCard({ neighborhood, index, rentCount, saleCount, onSelectType }) {
  // A neighborhood can have listings in one type, both, or neither — rather
  // than guessing which one someone wants (that was the actual bug: always
  // linking to rent silently hid sale-only listings, and a hardcoded sale
  // default would just hide rent-only ones instead), show both counts as
  // their own destinations when both genuinely exist, so nobody has to
  // land on the wrong list and hunt for a toggle.
  const hasRent = rentCount > 0;
  const hasSale = saleCount > 0;
  const hasBoth = hasRent && hasSale;
  const singleType = hasRent ? "rent" : "sale";
  const singleCount = hasRent ? rentCount : saleCount;

  // Nested interactive elements (a clickable card containing clickable
  // buttons) are an accessibility anti-pattern, so the whole-card click
  // only applies when there's a single, unambiguous destination — when
  // both exist, the two buttons below are the only interactive elements.
  // A district with no listings at all has nothing to open, so it is a plain,
  // non-interactive card (no role, no pointer cursor) that just says
  // "No listings yet" — it used to behave like a button and land people on an
  // empty results page.
  const isInteractive = !hasBoth && singleCount > 0;

  const cardInteractionProps = !isInteractive
    ? {}
    : {
        role: "button",
        tabIndex: 0,
        onClick: () => onSelectType(neighborhood, singleType),
        onKeyDown: (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelectType(neighborhood, singleType);
          }
        },
        "aria-label": `Explore ${neighborhood.name} district`,
      };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.06, 0.3) }}
      {...cardInteractionProps}
      className={`relative overflow-hidden rounded-[24px] border border-gold-400/10 shadow-sm group h-[280px] sm:h-[320px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 ${
        isInteractive ? "cursor-pointer" : ""
      }`}
    >
      <ResponsiveImage
        src={neighborhood.image_url}
        alt={neighborhood.name}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover select-none transition-transform duration-1000 group-hover:scale-105"
        style={{ objectPosition: `${(neighborhood.focal_x ?? 0.5) * 100}% ${(neighborhood.focal_y ?? 0.5) * 100}%` }}
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/20 to-transparent" />
      <div className="absolute inset-0 p-6 flex flex-col justify-end">
        <div className="mb-3">
          <div className="flex items-center gap-1.5 text-white/70 mb-1">
            <IoLocationOutline className="w-3.5 h-3.5 text-gold-400" />
            <span className="uppercase text-[9px] font-bold tracking-[0.18em]">Tangier, Morocco</span>
          </div>
          <h3 className="text-white text-[22px] font-semibold mb-1 tracking-tight">{neighborhood.name}</h3>
          {neighborhood.description && (
            <p className="text-white/60 text-[13px] max-w-[280px] leading-snug">{neighborhood.description}</p>
          )}
        </div>

        {hasBoth ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onSelectType(neighborhood, "rent")}
              className="flex-1 flex items-center justify-between gap-1.5 rounded-full bg-black/35 border border-white/20 px-3.5 py-2 text-white text-[11px] font-semibold transition-colors hover:bg-accent-500 hover:border-accent-500 cursor-pointer"
            >
              <span>{rentCount} Rent</span>
              <IoArrowForward className="w-3.5 h-3.5 shrink-0" />
            </button>
            <button
              type="button"
              onClick={() => onSelectType(neighborhood, "sale")}
              className="flex-1 flex items-center justify-between gap-1.5 rounded-full bg-black/35 border border-white/20 px-3.5 py-2 text-white text-[11px] font-semibold transition-colors hover:bg-accent-500 hover:border-accent-500 cursor-pointer"
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
            <div className="w-11 h-11 rounded-full bg-black/35 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-lg transition-colors duration-300 group-hover:bg-accent-500 group-hover:border-accent-500 group-active:scale-90">
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

export default NeighborhoodCard;
