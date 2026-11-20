import FiltersContent from "@/site/components/browse/FiltersContent";

/* ------------------------------------------------------------------ */
/*  Filters — inline sidebar version: FiltersContent wrapped in the     */
/*  white card. Used for the large-desktop (2xl+) sidebar.             */
/* ------------------------------------------------------------------ */

function FiltersSidebar({ filters, setFilters, listingType, priceBounds }) {
  return (
    <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-accent-500/10 p-6">
      <h2 className="text-lg font-semibold text-main mb-6">Filters</h2>
      <FiltersContent filters={filters} setFilters={setFilters} listingType={listingType} priceBounds={priceBounds} />
    </div>
  );
}

export default FiltersSidebar;
