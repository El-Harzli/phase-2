import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, Navigate } from "react-router";
import PropertyList from "@/site/components/browse/PropertyList";
import FiltersSidebar from "@/site/components/browse/FiltersSidebar";
import FiltersPanel from "@/site/components/browse/FiltersPanel";
import Breadcrumbs from "@/site/components/Breadcrumbs";
import { filterProperties } from "@/site/lib/browseFilters";
import { useFavorites } from "@/site/context/FavoritesProvider";
import useBrowseFilters from "@/site/hooks/useBrowseFilters";
import useBrowseProperties from "@/site/hooks/useBrowseProperties";
import useCatalogs from "@/site/hooks/useCatalogs";
import useOpenProperty from "@/site/hooks/useOpenProperty";
import usePageTitle from "@/shared/seo/usePageTitle";
import usePageMeta from "@/shared/seo/usePageMeta";
import { PAGE_META } from "@/shared/seo/pageMeta";
import Spinner from "@/shared/components/Spinner";

const VALID_LISTING_TYPES = new Set(["rent", "sale"]);
const NO_PROPERTIES = [];

function BrowsePage() {
  const { listingType } = useParams();
  // The page's title and description (and its heading, below) come from
  // src/shared/seo/pageMeta.js, so the edge functions can use the same words.
  const pageMeta = listingType === "sale" ? PAGE_META.sale : PAGE_META.rent;
  usePageTitle(pageMeta.title);
  usePageMeta(pageMeta.description);
  // The list (both rent and sale) and the catalogs the filters are built from are
  // two separate, cached requests; this page waits for both, and a failure of
  // either empties the list and shows the error screen.
  const browseList = useBrowseProperties();
  const catalogs = useCatalogs();
  const loading = browseList.loading || catalogs.loading;
  const error = browseList.error ?? catalogs.error;
  const properties = error ? NO_PROPERTIES : browseList.properties;
  const { reload: reloadList } = browseList;
  const { reload: reloadCatalogs } = catalogs;
  const reload = useCallback(() => Promise.all([reloadList(), reloadCatalogs()]), [reloadList, reloadCatalogs]);
  const { filters, setFilters, search, setSearch, priceBounds, page, setPage } = useBrowseFilters({
    listingType,
    properties,
    loading,
  });
  const { favorites, toggleFavorite } = useFavorites();
  const [filtersOpen, setFiltersOpen] = useState(false);

  // The list and the catalogs are kept in memory once loaded, so they may
  // already have been asked for — and failed — by the time someone reaches this
  // page (a network blip, say). The page used to greet them with a "Try again"
  // screen they had to click. Now arriving here with nothing loaded and an error
  // showing just tries once more by itself; the button only appears if that
  // second try fails too. The ref keeps it to a single attempt (React runs mount
  // effects twice in development), and it deliberately does nothing when the
  // page is simply still loading.
  const autoRetriedRef = useRef(false);
  useEffect(() => {
    if (autoRetriedRef.current) return;
    autoRetriedRef.current = true;
    if (error && properties.length === 0) reload();
    // Mount-only on purpose: later failures show the button instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredProperties = useMemo(
    () => filterProperties(properties, listingType, filters, search),
    [properties, listingType, filters, search],
  );

  // Navigating to a real route (not just local state) is what makes each
  // listing shareable, bookmarkable, and indexable. Carrying the current
  // location as `backgroundLocation` lets App.jsx render it as an overlay
  // on top of this page instead of a full navigation — see App.jsx.
  const openProperty = useOpenProperty();

  if (!VALID_LISTING_TYPES.has(listingType)) {
    return <Navigate to="/properties/rent" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-500 pt-20 lg:pt-24 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // Only when there's genuinely nothing to show. `error` is also set when a
  // *later* reload fails, but the list from the earlier successful load is
  // still in memory — replacing a perfectly good list with an error screen
  // would be worse than showing it.
  if (error && properties.length === 0) {
    return (
      <div className="min-h-screen bg-primary-500 pt-20 lg:pt-24 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <p className="text-base font-medium text-main mb-1">Couldn&rsquo;t load properties.</p>
          <p className="text-sm text-secondary/70 mb-4">
            There was a problem reaching the server. Check your connection and try again.
          </p>
          <button
            type="button"
            onClick={reload}
            className="rounded-[12px] bg-accent-500 hover:bg-accent-600 text-white text-sm font-medium px-5 py-2.5 transition-colors"
          >
            Try again
          </button>
          {/* Development only: which request failed and what the server said,
              so the cause can be read off the screen instead of hunting through
              the console. Never shown to real visitors. */}
          {import.meta.env.DEV && (
            <p className="mt-4 text-xs text-secondary/60 break-words">
              Dev detail: {error.queryName ? `${error.queryName} — ` : ""}
              {error.status != null ? `status ${error.status}: ` : ""}
              {error.message}
            </p>
          )}
        </div>
      </div>
    );
  }

  const pageHeading = pageMeta.title;

  return (
    <div className="min-h-screen bg-primary-500 pt-20 lg:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* This page had no heading at all before — PropertyList's internal
            "Search results" h2 was the first heading on the page, with
            nothing above it. That's both a broken heading hierarchy and a
            missed page title for search engines, since "Properties for
            Rent/Sale in Tangier" is exactly the kind of phrase this page
            should rank for. */}
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: listingType === "sale" ? "Buy" : "Rent" }]} />

        <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-main mt-2 mb-5">{pageHeading}</h1>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Inline filters sidebar — large desktop only (2xl+) */}
          <aside aria-label="Filter properties" className="hidden 2xl:block 2xl:w-80 2xl:shrink-0">
            <FiltersSidebar
              filters={filters}
              setFilters={setFilters}
              listingType={listingType}
              priceBounds={priceBounds}
            />
          </aside>
          <div className="w-full">
            <PropertyList
              properties={filteredProperties}
              favorites={favorites}
              onSelectProperty={openProperty}
              onToggleFavorite={toggleFavorite}
              search={search}
              onSearchChange={setSearch}
              onOpenFilters={() => setFiltersOpen(true)}
              filters={filters}
              setFilters={setFilters}
              listingType={listingType}
              priceBounds={priceBounds}
              page={page}
              onPageChange={setPage}
            />
          </div>
        </div>
      </div>

      <FiltersPanel
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        setFilters={setFilters}
        resultCount={filteredProperties.length}
        listingType={listingType}
        priceBounds={priceBounds}
      />
    </div>
  );
}

export default BrowsePage;
