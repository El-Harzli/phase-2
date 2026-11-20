import { useCallback, useState } from "react";
import {
  IoBedOutline,
  IoCalendarOutline,
  IoCarSportOutline,
  IoExpandOutline,
  IoLocationOutline,
  IoStar,
  IoWaterOutline,
} from "react-icons/io5";
import SectionTitle from "@/site/components/property/SectionTitle";
import { formatPrice } from "@/site/lib/formatPrice";

// A listing's rent/sale price spread over its floor area — a quick way to
// compare listings of different sizes. Computed, never stored.
function formatPricePerSqm(price, area) {
  if (!(area > 0) || !(price > 0)) return null;
  const value = price / area;
  const rounded = value >= 100 ? Math.round(value) : Math.round(value * 100) / 100;
  return `≈ ${new Intl.NumberFormat("en-US").format(rounded)} MAD / m²`;
}

// Literal class names (not built from the number) so Tailwind can see them.
const FACT_COLUMNS = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" };

// The title, price, key facts, build year + amenity pills and the description
// of a listing — the main column's top half. `detailsStatus` is set while the
// overlay shows only what the listing's card knew: "loading" puts placeholders
// where the amenities and the description will be, "error" leaves those parts out.
function PropertySummary({ property, isStandalonePage, titleId, detailsStatus = null }) {
  // Standalone page (/property/:id direct visit — what a crawler always
  // sees) gets a real <h1> for the title. The overlay variant renders this
  // same component on top of whatever page opened it (Home, BrowsePage —
  // both already have their own <h1>), so it uses <h2>/<h3> instead to
  // avoid a second <h1> existing in the DOM at the same time.
  const TitleTag = isStandalonePage ? "h1" : "h2";
  const SubheadingTag = isStandalonePage ? "h2" : "h3";

  const [expanded, setExpanded] = useState(false);
  const [isDescriptionTruncated, setIsDescriptionTruncated] = useState(false);

  // Whether the description actually overflows 3 clamped lines can't be
  // known from character count alone (word length, container width, and
  // font all affect it), so measure the real DOM instead. This runs once,
  // when the paragraph first appears — while it is still clamped. Once
  // expanded, the paragraph is its full height and would always read as "not
  // truncated", which would wrongly hide the "Read less" button, so it is never
  // measured again.
  const measureDescription = useCallback((el) => {
    if (el) setIsDescriptionTruncated(el.scrollHeight > el.clientHeight + 1);
  }, []);

  const pricePerSqm = formatPricePerSqm(property.price, property.area);
  const isRent = property.listingType === "rent";

  // The four facts people scan for first. A fact that doesn't apply (a plot
  // has no bedrooms) is left out rather than shown as "0".
  const keyFacts = [
    property.area > 0 && { key: "area", icon: IoExpandOutline, value: `${property.area} m²`, label: "Area" },
    property.beds > 0 && {
      key: "beds",
      icon: IoBedOutline,
      value: property.beds,
      label: property.beds === 1 ? "Bedroom" : "Bedrooms",
    },
    property.baths > 0 && {
      key: "baths",
      icon: IoWaterOutline,
      value: property.baths,
      label: property.baths === 1 ? "Bathroom" : "Bathrooms",
    },
    property.garage > 0 && { key: "garage", icon: IoCarSportOutline, value: property.garage, label: "Garage" },
  ].filter(Boolean);

  // Everything else is secondary: the build year and the amenities, as pills.
  const pills = [
    property.yearBuilt > 0 && { key: "built", icon: IoCalendarOutline, label: `Built ${property.yearBuilt}` },
    ...(property.amenities || []).map((a) => ({ key: a.id, icon: a.icon, label: a.name })),
  ].filter(Boolean);

  return (
    <>
      {/* Title + price */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Not known until the full property has loaded. */}
          {property.type && (
            <span className="inline-flex items-center rounded-md bg-accent-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
              {property.type}
            </span>
          )}
          {property.popular && (
            <span className="inline-flex items-center gap-1 rounded-md border border-gold-500/60 bg-gold-400/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-600">
              <IoStar className="h-3 w-3" />
              Popular
            </span>
          )}
        </div>

        <TitleTag
          id={titleId}
          className="mt-3 text-2xl font-semibold leading-tight tracking-tight text-main lg:text-[28px]"
        >
          {property.title}
        </TitleTag>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-secondary/70">
          <IoLocationOutline className="h-4 w-4 shrink-0" />
          {property.location}
        </p>

        <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-3xl font-bold leading-none text-accent-500">{formatPrice(property.price)}</span>
          {isRent && <span className="text-sm text-secondary/70">/ month</span>}
        </div>
        {pricePerSqm && <p className="mt-1 text-xs text-secondary/60">{pricePerSqm}</p>}
      </div>

      {/* Key facts */}
      {keyFacts.length > 0 && (
        <div
          className={`grid divide-x divide-accent-500/10 overflow-hidden rounded-[16px] border border-accent-500/10 ${FACT_COLUMNS[keyFacts.length]}`}
        >
          {keyFacts.map((fact) => (
            <div key={fact.key} className="flex flex-col items-center gap-1 px-2 py-4 text-center">
              <fact.icon className="h-5 w-5 text-accent-500" aria-hidden="true" />
              <span className="text-lg font-semibold leading-tight text-main">{fact.value}</span>
              <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-secondary/70">
                {fact.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Build year + amenities. One swipeable row on mobile (the last
                pill is left half-visible on purpose, to show there's more),
                wrapping normally on desktop. */}
      {(pills.length > 0 || detailsStatus === "loading") && (
        <ul className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 lg:pb-0">
          {pills.map((pill) => (
            <li
              key={pill.key}
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-accent-500/10 px-3.5 py-1.5 text-xs font-medium text-accent-500"
            >
              {pill.icon && <pill.icon className="h-3.5 w-3.5" aria-hidden="true" />}
              {pill.label}
            </li>
          ))}
          {detailsStatus === "loading" &&
            [0, 1, 2, 3].map((n) => (
              <li
                key={`placeholder-${n}`}
                aria-hidden="true"
                className="h-7 w-24 shrink-0 animate-pulse rounded-full bg-accent-500/10"
              />
            ))}
        </ul>
      )}

      {/* Description */}
      {detailsStatus !== "error" && (
        <div>
          <SectionTitle as={SubheadingTag}>Property details</SectionTitle>
          {detailsStatus === "loading" ? (
            <div aria-hidden="true" className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-accent-500/5" />
              <div className="h-4 w-11/12 animate-pulse rounded bg-accent-500/5" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-accent-500/5" />
            </div>
          ) : (
            <p
              ref={measureDescription}
              className={`text-[15px] leading-relaxed text-secondary ${expanded ? "" : "line-clamp-3"}`}
            >
              {property.description}
            </p>
          )}
          {isDescriptionTruncated && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 text-sm font-medium text-accent-500 hover:underline"
            >
              {expanded ? "Read less" : "Read more"}
            </button>
          )}
        </div>
      )}
    </>
  );
}

export default PropertySummary;
