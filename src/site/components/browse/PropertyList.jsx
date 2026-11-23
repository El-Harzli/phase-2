import { useState, useMemo, useRef, lazy, Suspense } from "react";
import {
  IoList,
  IoGridOutline,
  IoMapOutline,
  IoSearchOutline,
  IoCloseCircleOutline,
  IoOptionsOutline,
} from "react-icons/io5";
import PropertyCard from "@/site/components/PropertyCard";
import SortDropdown from "@/site/components/browse/SortDropdown";
import FilterChips from "@/site/components/browse/FilterChips";
import Pagination from "@/site/components/browse/Pagination";
import { sortProperties } from "@/site/lib/browseSort";
import usePageSize from "@/site/hooks/usePageSize";
import Spinner from "@/shared/components/Spinner";

// Leaflet is a genuinely heavy dependency (core JS + CSS + marker assets),
// and most visitors browse in grid view and never touch the map toggle —
// this keeps it out of the initial bundle entirely, only fetched the
// moment someone actually clicks "Map".
const PropertyMap = lazy(() => import("@/site/components/browse/PropertyMap"));

function MapLoadingFallback() {
  return (
    <div className="w-full h-[420px] sm:h-[520px] lg:h-[600px] rounded-[16px] border border-accent-500/10 flex items-center justify-center">
      <Spinner />
    </div>
  );
}

function PropertyList({
  properties = [],
  selectedId = null,
  favorites = new Set(),
  onSelectProperty = () => {},
  onToggleFavorite = () => {},
  search = "",
  onSearchChange = () => {},
  onOpenFilters = () => {},
  filters,
  setFilters,
  listingType,
  priceBounds,
  page = 1,
  onPageChange = () => {},
}) {
  const [viewMode, setViewMode] = useState("grid");
  const [sort, setSort] = useState("popular");
  const cardRef = useRef(null);
  const pageSize = usePageSize();

  const sortedProperties = useMemo(() => sortProperties(properties, sort), [properties, sort]);

  // Grid and list show one page of the sorted results (8 on phones, 12 from `sm`
  // up — see usePageSize); the map below always gets the whole list. The page
  // comes from the URL, which can ask for one that no longer exists (a shared
  // link, fewer results than before, a wider screen with fewer pages), so it is
  // clamped to the last real page here.
  const totalPages = Math.max(1, Math.ceil(sortedProperties.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pagedProperties = useMemo(
    () => sortedProperties.slice(pageStart, pageStart + pageSize),
    [sortedProperties, pageStart, pageSize],
  );

  // Only a click on the page controls scrolls (back to the top of this card,
  // clear of the fixed header — see scroll-mt below); filter and sort changes
  // leave the scroll position alone.
  const handlePageChange = (next) => {
    onPageChange(next);
    cardRef.current?.scrollIntoView();
  };

  // A different order makes the current page meaningless, so go back to page 1,
  // replacing the history entry rather than adding one.
  const handleSortChange = (value) => {
    setSort(value);
    if (page > 1) onPageChange(1, { replace: true });
  };

  return (
    <div
      ref={cardRef}
      className="scroll-mt-20 lg:scroll-mt-24 w-full bg-white rounded-[24px] border border-accent-500/10 shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-6"
    >
      <h2 className="text-lg font-semibold text-main mb-4">
        Search results <span className="text-secondary/60 font-normal">({sortedProperties.length})</span>
      </h2>

      {/* Search + filter toggle */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 min-w-0 flex items-center gap-2 bg-white border border-accent-500/10 rounded-[12px] px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-accent-500 transition-shadow">
          <IoSearchOutline className="w-4 h-4 text-secondary/50 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name or neighborhood..."
            className="flex-1 min-w-0 bg-transparent outline-none text-sm text-main placeholder:text-secondary/50"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
              className="inline-flex items-center gap-1 text-secondary/40 hover:text-accent-500 transition-colors shrink-0 cursor-pointer"
            >
              <IoCloseCircleOutline className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-medium">Clear</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenFilters}
          aria-label="Open filters"
          className="2xl:hidden shrink-0 w-11 h-11 rounded-[12px] border border-accent-500/10 bg-white flex items-center justify-center text-secondary hover:border-accent-500/30 hover:text-accent-500 transition-colors"
        >
          <IoOptionsOutline className="w-5 h-5" />
        </button>
      </div>

      {/* Active filter chips */}
      {filters && setFilters && (
        <FilterChips
          filters={filters}
          setFilters={setFilters}
          search={search}
          onSearchChange={onSearchChange}
          listingType={listingType}
          priceBounds={priceBounds}
        />
      )}

      {/* Sort + view toggle */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <SortDropdown value={sort} onChange={handleSortChange} />

        <div className="flex items-center gap-1 border border-accent-500/10 rounded-lg p-0.5 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            aria-label="List view"
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === "list" ? "bg-accent-500 text-white" : "text-secondary/50 hover:text-secondary"
            }`}
          >
            <IoList className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            aria-label="Grid view"
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === "grid" ? "bg-accent-500 text-white" : "text-secondary/50 hover:text-secondary"
            }`}
          >
            <IoGridOutline className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setViewMode("map")}
            aria-label="Map view"
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === "map" ? "bg-accent-500 text-white" : "text-secondary/50 hover:text-secondary"
            }`}
          >
            <IoMapOutline className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {sortedProperties.length === 0 ? (
        <div className="text-center text-sm text-secondary/60 py-16 px-4">
          No properties match your filters. Try widening your price range or room count.
        </div>
      ) : viewMode === "map" ? (
        <Suspense fallback={<MapLoadingFallback />}>
          <PropertyMap properties={sortedProperties} selectedId={selectedId} onSelectProperty={onSelectProperty} />
        </Suspense>
      ) : viewMode === "list" ? (
        <div className="space-y-2.5">
          {pagedProperties.map((p) => (
            <PropertyCard
              key={p.id}
              property={p}
              variant="list"
              isSelected={p.id === selectedId}
              isFavorited={favorites.has(p.id)}
              onToggleFavorite={() => onToggleFavorite(p.id)}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {pagedProperties.map((p) => (
            <PropertyCard
              key={p.id}
              property={p}
              variant="grid"
              isSelected={p.id === selectedId}
              isFavorited={favorites.has(p.id)}
              onToggleFavorite={() => onToggleFavorite(p.id)}
            />
          ))}
        </div>
      )}

      {/* Page controls: grid and list only (the map shows every result), and
          nothing at all when everything fits on one page. */}
      {viewMode !== "map" && totalPages > 1 && (
        <>
          <Pagination page={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
          <p className="mt-3 text-center text-xs text-secondary/60">
            Showing {pageStart + 1}–{pageStart + pagedProperties.length} of {sortedProperties.length}
          </p>
        </>
      )}
    </div>
  );
}

export default PropertyList;