import { useState } from "react";
import {
  IoArrowBack,
  IoCameraOutline,
  IoCheckmark,
  IoClose,
  IoHeart,
  IoHeartOutline,
  IoImagesOutline,
  IoShareSocialOutline,
} from "react-icons/io5";
import ResponsiveImage from "@/site/components/ResponsiveImage";
import { copyToClipboard } from "@/site/lib/copyToClipboard";

// Desktop photo grid: one big tile on the left, up to three stacked on the
// right (or fewer, depending on how many photos there are). The SAME slide
// elements are the swipeable mobile carousel — below `lg` they're full-width
// slides in a scroll-snap row, from `lg` up the row becomes this grid — so
// there's exactly one <img> per photo and nothing gets downloaded twice for
// the hidden layout.
function desktopGridClass(total) {
  if (total >= 4) return "lg:grid-cols-3 lg:grid-rows-3";
  if (total === 3) return "lg:grid-cols-3 lg:grid-rows-2";
  if (total === 2) return "lg:grid-cols-2 lg:grid-rows-1";
  return "lg:grid-cols-1 lg:grid-rows-1";
}

function desktopTileClass(total, index) {
  if (total >= 4) {
    if (index === 0) return "lg:col-span-2 lg:row-span-3";
    if (index > 3) return "lg:hidden"; // only 4 tiles fit; the rest are behind "+N" / the lightbox
    return "";
  }
  if (total === 3 && index === 0) return "lg:col-span-2 lg:row-span-2";
  return "";
}

// How wide each tile really renders, so the browser only downloads that much
// (see ResponsiveImage). Below `lg` every slide is a full-width slide; from
// `lg` it depends on the layout above and the card's max width (~896–976px).
function tileSizes(total, index) {
  if (total === 1) return "(min-width: 1024px) 940px, 100vw";
  if (total === 2) return "(min-width: 1024px) 470px, 100vw";
  return index === 0 ? "(min-width: 1024px) 620px, 100vw" : "(min-width: 1024px) 310px, 100vw";
}

// 480 / 800 / 1280 are exactly the stored copies in "variants" mode, so the
// gallery never falls back to the full-size original unless asked for more.
const GALLERY_WIDTHS = [480, 800, 1280];

const ICON_BUTTON =
  "flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-main shadow-[0_2px_10px_rgba(0,0,0,0.15)] backdrop-blur transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500";

// The photos of a listing, with the floating back/close, share and favorite
// buttons: a swipeable full-bleed carousel below `lg`, the photo grid from `lg`.
// `onOpenLightbox(index)` opens the full-screen viewer on that photo.
function PropertyGallery({
  property,
  slides,
  isStandalonePage,
  onClose,
  isFavorited,
  onToggleFavorite,
  onOpenLightbox = () => {},
}) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [copied, setCopied] = useState(false);

  const total = slides.length;

  // The desktop grid shows 4 tiles at most, so "how many more are there" is
  // relative to those 4, not to the total.
  const hiddenImageCount = Math.max(0, total - 4);

  const handleShare = async () => {
    const succeeded = await copyToClipboard(window.location.href);
    if (succeeded) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      console.error("Could not copy link");
    }
  };

  // Which slide is showing in the swipeable (mobile) carousel — drives the
  // dots and the "2 / 5" counter. Rounding the scroll position to the nearest
  // slide width means it updates as soon as a swipe passes the halfway point.
  const handleCarouselScroll = (event) => {
    const el = event.currentTarget;
    if (!el.clientWidth) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveSlide((current) => (current === index ? current : index));
  };

  return (
    <div className="lg:p-6 lg:pb-0">
      <div className="relative">
        {/* Below `lg`: a full-bleed row of full-width slides you swipe
              through (scroll-snap, no library). From `lg`: the photo grid. */}
        <div
          onScroll={handleCarouselScroll}
          role="group"
          aria-roledescription="carousel"
          aria-label="Property photos"
          className={`flex h-[320px] snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:h-[400px] lg:grid lg:h-[420px] lg:snap-none lg:gap-2 lg:overflow-visible ${desktopGridClass(
            total,
          )}`}
        >
          {slides.map((slide, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onOpenLightbox(index)}
              aria-label={`View photo ${index + 1} of ${total}`}
              className={`relative h-full w-full shrink-0 snap-center overflow-hidden bg-primary-600 lg:rounded-[14px] ${desktopTileClass(
                total,
                index,
              )}`}
            >
              <ResponsiveImage
                src={slide.src}
                alt={index === 0 ? property.title : `${property.title} photo ${index + 1}`}
                sizes={tileSizes(total, index)}
                widths={GALLERY_WIDTHS}
                // The first photo is the page's biggest above-the-fold image
                // (the LCP element on the standalone page): load it right away.
                priority={index === 0}
                className="h-full w-full object-cover"
                style={slide.focal ? { objectPosition: `${slide.focal.x * 100}% ${slide.focal.y * 100}%` } : undefined}
              />
              {index === 3 && hiddenImageCount > 0 && (
                <span
                  className="absolute inset-0 hidden items-center justify-center bg-main/55 text-base font-semibold text-white lg:flex"
                  aria-hidden="true"
                >
                  +{hiddenImageCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Floating controls */}
        <button
          type="button"
          onClick={onClose}
          aria-label={isStandalonePage ? "Back to results" : "Close details"}
          className={`${ICON_BUTTON} absolute left-3 top-3 z-10`}
        >
          <IoArrowBack className={`h-5 w-5 ${isStandalonePage ? "" : "lg:hidden"}`} />
          {!isStandalonePage && <IoClose className="hidden h-5 w-5 lg:block" />}
        </button>

        <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
          <button type="button" onClick={handleShare} aria-label="Share property" className={ICON_BUTTON}>
            {copied ? (
              <IoCheckmark className="h-[18px] w-[18px] text-green-600" />
            ) : (
              <IoShareSocialOutline className="h-[18px] w-[18px]" />
            )}
          </button>
          <button
            type="button"
            onClick={() => onToggleFavorite(property.id)}
            aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={isFavorited}
            className={ICON_BUTTON}
          >
            {isFavorited ? (
              <IoHeart className="h-[18px] w-[18px] text-accent-500" />
            ) : (
              <IoHeartOutline className="h-[18px] w-[18px]" />
            )}
          </button>
        </div>

        {/* Mobile only: where you are in the swipe row. (bottom-10 keeps
              both clear of the content card that overlaps the photo's edge.) */}
        {total > 1 && (
          <div className="pointer-events-none absolute bottom-10 right-4 z-10 flex items-center gap-1.5 rounded-full bg-main/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur lg:hidden">
            <IoCameraOutline className="h-3.5 w-3.5" />
            {activeSlide + 1} / {total}
          </div>
        )}
        {total > 1 && total <= 8 && (
          <div
            className="pointer-events-none absolute bottom-10 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 lg:hidden"
            aria-hidden="true"
          >
            {slides.map((_, index) => (
              <span
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index === activeSlide ? "w-5 bg-gold-400" : "w-1.5 bg-white/70"
                }`}
              />
            ))}
          </div>
        )}

        {/* Desktop only: the grid shows 4 photos at most. */}
        {total > 1 && (
          <button
            type="button"
            onClick={() => onOpenLightbox(0)}
            className="absolute bottom-3 right-3 z-10 hidden items-center gap-2 rounded-full bg-white/90 px-3.5 py-2 text-xs font-medium text-main shadow-[0_2px_10px_rgba(0,0,0,0.15)] backdrop-blur transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 lg:flex"
          >
            <IoImagesOutline className="h-4 w-4" />
            All {total} photos
          </button>
        )}
      </div>
    </div>
  );
}

export default PropertyGallery;
