import { lazy, Suspense, useLayoutEffect, useMemo, useRef, useState } from "react";
import { IoCalculatorOutline } from "react-icons/io5";
import Spinner from "@/shared/components/Spinner";
import PropertyGallery from "@/site/components/property/PropertyGallery";
import PropertySummary from "@/site/components/property/PropertySummary";
import AgentCard from "@/site/components/property/AgentCard";
import VisitRequestCard from "@/site/components/property/VisitRequestCard";
import SimilarProperties from "@/site/components/property/SimilarProperties";
import StickyContactBar from "@/site/components/property/StickyContactBar";
import SectionTitle from "@/site/components/property/SectionTitle";

// None of these render on first paint — Lightbox and the calculator are
// both behind explicit toggles, and the location map only shows for
// listings that have coordinates set. Deferring them (and Leaflet, which
// PropertyLocationMap pulls in) keeps every property page's first load
// lighter, since most visitors never open the gallery lightbox or the
// calculator at all.
const Lightbox = lazy(() => import("@/site/components/property/Lightbox"));
const MortgageCalculator = lazy(() => import("@/site/components/property/MortgageCalculator"));
const PropertyLocationMap = lazy(() => import("@/site/components/PropertyLocationMap"));

function MapLoadingFallback() {
  return (
    <div className="w-full h-64 rounded-[16px] border border-accent-500/10 flex items-center justify-center">
      <Spinner className="h-6 w-6 border-accent-500/20 border-t-accent-500" />
    </div>
  );
}

// Stands in for the agent and visit cards while the full property is on its way
// (`status` "loading") or failed to arrive ("error"). Neither card exists until
// the agent is known: without it their Call/WhatsApp links would fall back to the
// agency's number instead of the listing agent's.
function DetailsPlaceholder({ status, onRetry }) {
  if (status === "error") {
    return (
      <div className="rounded-[16px] border border-accent-500/10 p-5 text-sm text-secondary">
        <p>Couldn&rsquo;t load all the details of this property.</p>
        <button type="button" onClick={onRetry} className="mt-2 font-medium text-accent-500 hover:underline">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div aria-hidden="true" className="space-y-6">
      <div className="h-52 animate-pulse rounded-[16px] bg-accent-500/5" />
      <div className="h-64 animate-pulse rounded-[16px] bg-accent-500/5" />
    </div>
  );
}

// Walks up to the element that actually scrolls (the overlay's panel, or the
// page itself) — used to jump back to the top when a "similar property" is
// opened inside the overlay, which swaps the property without remounting.
function getScrollParent(element) {
  let node = element?.parentElement;
  while (node && node !== document.body) {
    const { overflowY } = window.getComputedStyle(node);
    if (overflowY === "auto" || overflowY === "scroll") return node;
    node = node.parentElement;
  }
  return null;
}

// The full view of one listing. Callers render it with `key={property.id}`, so
// opening a different listing starts it from scratch (nothing carries over from
// the previous one's expanded description or gallery position). The overlay may
// first render it with only what the listing's card knew, and `detailsStatus` says
// so: "loading" while the rest is on its way, "error" if it couldn't be loaded
// (null = everything is here). The id doesn't change when the rest arrives, so
// the view is not remounted and the visitor keeps their place.
function PropertyDetail({
  property,
  similarProperties = [],
  detailsStatus = null,
  onRetryDetails,
  onClose,
  onSelectProperty = () => {},
  isFavorited,
  onToggleFavorite,
  isStandalonePage = false,
  titleId,
}) {
  const rootRef = useRef(null);
  // The index of the photo the full-screen viewer opens on, or null while it is closed.
  const [lightboxStart, setLightboxStart] = useState(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const SubheadingTag = isStandalonePage ? "h2" : "h3";

  // One list of photos, with each one's focal point (the admin-chosen
  // centre of interest used when a photo is cropped into a tile).
  const slides = useMemo(() => {
    const gallery = property.gallery || [];
    return [property.image, ...gallery].map((src, index) => ({
      src,
      focal: index === 0 ? property.imageFocal : property.galleryFocal?.[index - 1],
    }));
  }, [property.image, property.gallery, property.imageFocal, property.galleryFocal]);

  // Opening a "similar property" inside the overlay swaps the property
  // without remounting, and the overlay panel keeps whatever scroll position
  // it had — i.e. the new listing would open scrolled down at the bottom,
  // where the similar cards were. Jump back to the top of whatever scrolls.
  // (Skipped on first render, and the standalone page already resets scroll
  // on every route change.)
  useLayoutEffect(() => {
    const scroller = getScrollParent(rootRef.current);
    if (scroller) scroller.scrollTop = 0;
  }, []);

  return (
    <div
      ref={rootRef}
      className="w-full bg-white lg:overflow-clip lg:rounded-[24px] lg:border lg:border-accent-500/10 lg:shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
    >
      {/* ------------------------------------------------------------ */}
      {/* Gallery                                                       */}
      {/* ------------------------------------------------------------ */}
      <PropertyGallery
        property={property}
        slides={slides}
        isStandalonePage={isStandalonePage}
        onClose={onClose}
        isFavorited={isFavorited}
        onToggleFavorite={onToggleFavorite}
        onOpenLightbox={setLightboxStart}
      />

      {/* ------------------------------------------------------------ */}
      {/* Content — overlaps the photo's bottom edge on mobile          */}
      {/* ------------------------------------------------------------ */}
      <div className="relative -mt-6 rounded-t-[28px] bg-white px-5 pb-8 pt-6 lg:mt-0 lg:rounded-none lg:px-6">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-x-10">
          {/* Main column */}
          <div className="min-w-0 space-y-8">
            <PropertySummary
              property={property}
              isStandalonePage={isStandalonePage}
              titleId={titleId}
              detailsStatus={detailsStatus}
            />

            {/* Location — only renders if this listing has exact coordinates
                set (optional on the property form; `location` text always
                shows above regardless). */}
            {property.lat != null && property.lng != null && (
              <div>
                <SectionTitle as={SubheadingTag}>Location</SectionTitle>
                <Suspense fallback={<MapLoadingFallback />}>
                  <PropertyLocationMap lat={property.lat} lng={property.lng} label={property.location} />
                </Suspense>
              </div>
            )}

            {/* Mortgage calculator toggle (sale listings only — a mortgage
                estimates payments to buy the property, not to rent it) */}
            {property.listingType === "sale" && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowCalculator((v) => !v)}
                  className="flex items-center gap-2 text-sm font-medium text-accent-500 hover:underline"
                >
                  <IoCalculatorOutline className="h-4 w-4" />
                  {showCalculator ? "Hide calculator" : "Estimate monthly mortgage"}
                </button>
                {showCalculator && (
                  <Suspense fallback={null}>
                    <MortgageCalculator price={property.price} />
                  </Suspense>
                )}
              </div>
            )}
          </div>

          {/* Agent + visit request. After the main column on mobile; a sticky
              sidebar on desktop (the overlay has no site header above it, the
              standalone page does, hence the different offsets). */}
          <aside className={`mt-8 space-y-6 lg:sticky lg:mt-0 ${isStandalonePage ? "lg:top-24" : "lg:top-4"}`}>
            {detailsStatus ? (
              <DetailsPlaceholder status={detailsStatus} onRetry={onRetryDetails} />
            ) : (
              <>
                <AgentCard property={property} headingTag={SubheadingTag} />
                <VisitRequestCard property={property} headingTag={SubheadingTag} />
              </>
            )}
          </aside>

          <SimilarProperties
            property={property}
            similarProperties={similarProperties}
            onSelectProperty={onSelectProperty}
            headingTag={SubheadingTag}
          />
        </div>
      </div>

      {!detailsStatus && <StickyContactBar property={property} />}

      {lightboxStart !== null && (
        <Suspense
          fallback={
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center"
              style={{ backgroundColor: "rgba(26, 26, 26, 0.92)" }}
            >
              <Spinner className="h-8 w-8 border-white/30 border-t-white" />
            </div>
          }
        >
          <Lightbox
            images={slides.map((slide) => slide.src)}
            startIndex={lightboxStart}
            onClose={() => setLightboxStart(null)}
          />
        </Suspense>
      )}
    </div>
  );
}

export default PropertyDetail;
