import { useState, useRef, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
import { useNavigate } from "react-router";
import useFeaturedProperties from "@/site/hooks/useFeaturedProperties";
import { useFavorites } from "@/site/context/FavoritesProvider";
import SectionHeader from "@/site/components/SectionHeader";
import PropertyCardSkeleton from "@/site/components/PropertyCardSkeleton";
import ErrorBoundary from "@/shared/components/ErrorBoundary";

// Swiper (and its CSS) live in FeaturedCarousel.jsx and are downloaded only once
// this section is near the screen — see `nearViewport` below.
const FeaturedCarousel = lazy(() => import("@/site/components/home/FeaturedCarousel"));

// What shows in place of the carousel while the featured list is loading, and
// while the carousel code is being fetched. Its cards are as tall as the real
// ones, with the same spacing as the Swiper (`!px-0.5 !pt-2 !pb-8`), and as
// wide as they will be at each screen size: the `basis-[calc(…)]` values are
// Swiper's own formula, (width - (slidesPerView - 1) × spaceBetween) /
// slidesPerView, for the `breakpoints` in FeaturedCarousel.jsx, and the gaps are
// its spaceBetween (12 / 16 / 18 / 20 / 24 / 24). Keep them in step with those
// breakpoints, so the swap to the carousel doesn't move the page.
function CarouselPlaceholder() {
  return (
    <div role="status" aria-busy="true" className="relative">
      <span className="sr-only">Loading featured properties</span>
      <div className="flex gap-3 sm:gap-4 md:gap-[18px] lg:gap-5 xl:gap-6 overflow-hidden px-0.5 pt-2 pb-8">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="shrink-0 basis-[calc((100%_-_1.8px)_/_1.15)] sm:basis-[calc((100%_-_8px)_/_1.5)] md:basis-[calc((100%_-_27px)_/_2.5)] lg:basis-[calc((100%_-_50px)_/_3.5)] xl:basis-[calc((100%_-_84px)_/_4.5)] 2xl:basis-[calc((100%_-_100.8px)_/_5.2)]"
          >
            <PropertyCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  );
}

function FeaturedPropertiesSection() {
  const [activeFilter, setActiveFilter] = useState("For Rent");
  // True once the section is within ~400px of the screen: only then is the
  // carousel code downloaded. A browser without IntersectionObserver gets it
  // straight away. It never goes back to false.
  const [nearViewport, setNearViewport] = useState(() => typeof IntersectionObserver === "undefined");

  const sectionRef = useRef(null);
  const saleRef = useRef(null);
  const rentRef = useRef(null);
  const underlineRef = useRef(null);
  const tabsContainerRef = useRef(null);

  const navigate = useNavigate();
  const { properties, loading } = useFeaturedProperties();
  const { favorites, toggleFavorite } = useFavorites();

  const listingType = activeFilter === "For Sale" ? "sale" : "rent";

  // Curated by the admin (Dashboard → Featured) — only properties with a
  // featured_order set show here, in the order they were arranged there.
  // Nothing here falls back to "just show recent properties": an agency
  // may deliberately want zero featured listings for a segment at a given
  // moment, and silently substituting something else would take that
  // choice away from them. The request already asks only for those, in that
  // order; the check and the sort stay as a safeguard.
  const filtered = useMemo(
    () =>
      properties
        .filter((p) => p.listingType === listingType && p.featuredOrder != null)
        .sort((a, b) => a.featuredOrder - b.featuredOrder),
    [properties, listingType],
  );

  const recalcUnderline = useCallback(() => {
    const currentRef = activeFilter === "For Sale" ? saleRef : rentRef;
    const underline = underlineRef.current;
    const container = tabsContainerRef.current;
    if (currentRef.current && underline && container) {
      const rect = currentRef.current.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      underline.style.width = `${rect.width}px`;
      underline.style.transform = `translateX(${rect.left - containerRect.left}px)`;
    }
  }, [activeFilter]);

  // Watches the section so the carousel code is fetched shortly before it
  // scrolls into view, not on the first page load.
  useEffect(() => {
    if (nearViewport) return undefined;
    const section = sectionRef.current;
    if (!section) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, [nearViewport]);

  // Recalculates on filter change, container resize, font-load reflow,
  // AND window resize/orientation change - the original only recalculated
  // once on mount/filter-change, so rotating a phone or resizing a window
  // would leave the underline stuck in the wrong place.
  useEffect(() => {
    recalcUnderline();

    const container = tabsContainerRef.current;
    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(recalcUnderline) : null;
    if (container && resizeObserver) resizeObserver.observe(container);

    window.addEventListener("resize", recalcUnderline);
    window.addEventListener("orientationchange", recalcUnderline);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", recalcUnderline);
      window.removeEventListener("orientationchange", recalcUnderline);
    };
  }, [recalcUnderline]);

  return (
    <div ref={sectionRef} className="wrapper w-full py-9">
      <SectionHeader
        eyebrow="Exclusive Collection"
        title="Featured Properties"
        description="Discover handpicked residences that embody sophistication and timeless elegance in Tangier."
      />

      {/* FILTER TABS */}
      <div ref={tabsContainerRef} className="relative flex w-fit mx-auto items-center gap-6 mb-4 -mt-5">
        <span
          ref={underlineRef}
          className="absolute -bottom-[3px] h-[2px] bg-accent-400 transition-all duration-300 ease-out pointer-events-none"
          style={{ width: 0, transform: "translateX(0)" }}
        />

        {/* py + negative my enlarges the tap target on mobile without
              disturbing the visual layout or underline alignment */}

        <button
          type="button"
          onClick={() => setActiveFilter("For Rent")}
          aria-pressed={activeFilter === "For Rent"}
          className="py-2.5 -my-2.5 px-1"
        >
          <span
            ref={rentRef}
            className={`uppercase tracking-[0.1em] lg:text-[12.5px] text-[10.5px] ${
              activeFilter === "For Rent" ? "text-accent-500" : "text-secondary"
            }`}
          >
            For Rent
          </span>
        </button>
        <div className="w-px h-4 bg-gold-500/20" />

        <button
          type="button"
          onClick={() => setActiveFilter("For Sale")}
          aria-pressed={activeFilter === "For Sale"}
          className="py-2.5 -my-2.5 px-1"
        >
          <span
            ref={saleRef}
            className={`uppercase tracking-[0.1em] lg:text-[12.5px] text-[10.5px] ${
              activeFilter === "For Sale" ? "text-accent-500" : "text-secondary"
            }`}
          >
            For Sale
          </span>
        </button>
      </div>

      {loading ? (
        <CarouselPlaceholder />
      ) : filtered.length === 0 ? (
        <p className="text-center text-[13px] text-secondary py-10">No properties available in this category yet.</p>
      ) : !nearViewport ? (
        <CarouselPlaceholder />
      ) : (
        <ErrorBoundary
          fallback={
            <p className="text-center text-[13px] text-secondary py-10">
              The properties couldn’t be loaded here — use “View All Properties” below.
            </p>
          }
        >
          <Suspense fallback={<CarouselPlaceholder />}>
            <FeaturedCarousel
              // remounts cleanly on filter switch instead of carrying over
              // a slide index that may no longer exist in the new list
              key={activeFilter}
              properties={filtered}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      <div className="text-center mt-8">
        <button
          type="button"
          onClick={() => navigate(`/properties/${listingType}`)}
          className="inline-flex items-center gap-2 px-6 py-3 border border-accent-500 text-accent-500 uppercase tracking-[0.14em] text-[10.5px] rounded-md transition-colors duration-300 hover:bg-accent-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2"
        >
          View All Properties
        </button>
      </div>
    </div>
  );
}

export default FeaturedPropertiesSection;