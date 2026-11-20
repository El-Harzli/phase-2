import {
  IoLocationOutline,
  IoBedOutline,
  IoWaterOutline,
  IoExpandOutline,
  IoCarSportOutline,
  IoHeart,
  IoHeartOutline,
} from "react-icons/io5";
import { Link, useLocation } from "react-router";
import ResponsiveImage from "@/site/components/ResponsiveImage";
import { buildPropertyUrl } from "@/shared/lib/propertyUrl";
import { formatPrice } from "@/site/lib/formatPrice";

// Cover photos are cropped (object-cover), so each one carries an optional
// focal point set in the admin. Shared by both layouts so the two can't
// drift apart on how it's applied.
function coverPosition(focal) {
  return focal ? { objectPosition: `${focal.x * 100}% ${focal.y * 100}%` } : undefined;
}

/* ------------------------------------------------------------------ */
/*  StatChip — small icon + label pill, used by both card layouts      */
/* ------------------------------------------------------------------ */

function StatChip({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-secondary bg-primary-600 rounded-md px-2 py-1">
      <Icon className="w-3 h-3 text-accent-500" />
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  FavoriteButton                                                     */
/* ------------------------------------------------------------------ */

function FavoriteButton({ isFavorited, onToggleFavorite, className = "" }) {
  return (
    <button
      type="button"
      onClick={() => onToggleFavorite?.()}
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={isFavorited}
      className={`text-secondary/50 hover:text-accent-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 rounded-full ${className}`}
    >
      {isFavorited ? <IoHeart className="w-4 h-4 text-accent-500" /> : <IoHeartOutline className="w-4 h-4" />}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  TitleLink — the card's one real link                               */
/* ------------------------------------------------------------------ */

// A real <a href> to the property, so crawlers can follow it and Ctrl/Cmd/
// middle-click and "open in new tab" work (a fresh tab loads the property as a
// full page). A plain click opens it as an overlay on top of the page the
// visitor is on now: the current location is passed along as
// `backgroundLocation`, which SiteApp uses to keep that page rendered
// underneath — the same navigation useOpenProperty does for the map.
//
// `after:absolute after:inset-0` stretches the link over the whole card (the
// card is `relative`), so the entire card is clickable while this stays the
// only <a> in it. The focus ring is drawn on the card (see PropertyCard).
function TitleLink({ property }) {
  const location = useLocation();

  return (
    <Link
      to={buildPropertyUrl(property)}
      state={{ backgroundLocation: location }}
      className="after:absolute after:inset-0 focus-visible:outline-none"
    >
      {property.title}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  PropertyCard — one component, two layouts via `variant`            */
/* ------------------------------------------------------------------ */

// `sizes` for each layout — tells the browser how wide the photo really
// renders so it only downloads that much (see ResponsiveImage). The list
// thumbnail is a fixed 96px box. The grid card's width depends on whichever
// page hosts it, so its default is deliberately on the generous side (never
// blurry, only slightly more than minimal) — a page with a known layout,
// like FeaturedProperties, should pass a tighter `imageSizes`.
const LIST_IMAGE_SIZES = "96px";
const LIST_IMAGE_WIDTHS = [96, 192, 288]; // 1x / 2x / 3x of the 96px box
const GRID_IMAGE_SIZES = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";

// The card is an <article> whose title is a real link stretched over the whole
// card (see TitleLink). The heart can't sit *inside* a link — a button in an <a>
// is invalid HTML, and a tap on it would also navigate — so it is a sibling
// placed above the stretched link with `z-10`. The focus ring is drawn on the
// card itself (`has-[a:focus-visible]`) so it looks exactly like it did when
// the whole card was focusable, and only the link, not the heart, triggers it.
function PropertyCard({
  property,
  variant = "grid",
  isSelected = false,
  isFavorited = false,
  onToggleFavorite,
  imageSizes,
}) {
  if (variant === "list") {
    return (
      <article
        className={`relative w-full flex gap-3 p-2.5 rounded-[16px] border cursor-pointer transition-colors has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-accent-500 ${
          isSelected
            ? "border-accent-500 bg-accent-500/5 ring-1 ring-accent-500"
            : "border-transparent hover:bg-primary-600"
        }`}
      >
        <div className="relative w-24 h-24 shrink-0 rounded-[12px] overflow-hidden bg-primary-600">
          <ResponsiveImage
            src={property.image}
            alt={property.title}
            sizes={LIST_IMAGE_SIZES}
            widths={LIST_IMAGE_WIDTHS}
            className="w-full h-full object-cover"
            style={coverPosition(property.imageFocal)}
          />
          {property.popular && (
            <span className="absolute top-1.5 left-1.5 bg-gold-400 text-main text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded">
              Popular
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0 py-0.5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-base font-semibold text-accent-500 leading-none">
              {formatPrice(property.price)}
              {property.listingType === "rent" && (
                <span className="text-xs font-normal text-secondary/70"> / month</span>
              )}
            </p>
            {/* The icon is only 16px, too small to tap reliably on a phone.
                p-1.5 -m-1.5 grows the hit area to ~28px without moving
                anything else in the row. */}
            <FavoriteButton
              isFavorited={isFavorited}
              onToggleFavorite={onToggleFavorite}
              className="relative z-10 shrink-0 p-1.5 -m-1.5"
            />
          </div>

          <h3 className="text-sm font-medium text-main truncate mt-1">
            <TitleLink property={property} />
          </h3>
          <p className="flex items-center gap-1 text-xs text-secondary/70 truncate mt-0.5">
            <IoLocationOutline className="w-3 h-3 shrink-0" />
            {property.location}
          </p>

          <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
            {property.beds > 0 && (
              <StatChip icon={IoBedOutline}>
                {property.beds} {property.beds === 1 ? "Bed" : "Beds"}
              </StatChip>
            )}
            <StatChip icon={IoExpandOutline}>{property.area}m²</StatChip>
            {property.garage > 0 && <StatChip icon={IoCarSportOutline}>{property.garage} Garage</StatChip>}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="relative flex flex-col rounded-[24px] border border-accent-500/10 bg-white overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.04)] cursor-pointer transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-accent-500">
      <div className="relative h-44 shrink-0 overflow-hidden bg-primary-600">
        <ResponsiveImage
          src={property.image}
          alt={property.title}
          sizes={imageSizes ?? GRID_IMAGE_SIZES}
          className="w-full h-full object-cover"
          style={coverPosition(property.imageFocal)}
        />
        {property.popular && (
          <span className="absolute top-3 left-3 bg-gold-400 text-main text-xs font-medium uppercase tracking-wide px-2 py-1 rounded-md">
            Popular
          </span>
        )}
        <FavoriteButton
          isFavorited={isFavorited}
          onToggleFavorite={onToggleFavorite}
          className="absolute z-10 top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center"
        />
      </div>
      <div className="flex flex-col gap-2 p-4">
        <p className="text-lg font-semibold text-accent-500">
          {formatPrice(property.price)}
          {property.listingType === "rent" && <span className="text-xs font-normal text-secondary/70"> / month</span>}
        </p>
        <h3 className="text-sm font-medium text-main truncate">
          <TitleLink property={property} />
        </h3>
        <p className="flex items-center gap-1 text-xs text-secondary/70 truncate">
          <IoLocationOutline className="w-3 h-3 shrink-0" />
          {property.location}
        </p>
        <div className="flex items-center gap-1.5 flex-wrap mt-1">
          {property.beds > 0 && (
            <StatChip icon={IoBedOutline}>
              {property.beds} {property.beds === 1 ? "Bed" : "Beds"}
            </StatChip>
          )}
          {property.baths > 0 && (
            <StatChip icon={IoWaterOutline}>
              {property.baths} {property.baths === 1 ? "Bath" : "Baths"}
            </StatChip>
          )}
          <StatChip icon={IoExpandOutline}>{property.area}m²</StatChip>
        </div>
      </div>
    </article>
  );
}

export default PropertyCard;
