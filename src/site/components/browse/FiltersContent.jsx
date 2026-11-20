import { useMemo } from "react";
import useBrowseProperties from "@/site/hooks/useBrowseProperties";
import useCatalogs from "@/site/hooks/useCatalogs";
import { getIconByKey } from "@/shared/config/curatedIcons";
import { GARAGE_CONVENIENCE } from "@/site/lib/garageConvenience";
import {
  FALLBACK_PRICE_BOUNDS,
  PRICE_STEP,
  neighborhoodIdsForCategory,
  applyCategorySelection,
} from "@/site/lib/browseFilters";
import PriceRangeSlider from "@/site/components/browse/PriceRangeSlider";

const ROOM_OPTIONS = ["1", "2", "3", "4"];

function FilterSection({ label, children }) {
  return (
    <div className="mb-7">
      <p className="text-[11px] font-medium text-secondary/70 uppercase tracking-[0.14em] mb-3">{label}</p>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  FiltersContent — the raw filter sections, no card wrapper. Used     */
/*  both by the inline sidebar (Filters, below) and by FiltersPanel.   */
/*  Categories, per-category amenities, and the rooms toggle all come   */
/*  live from Supabase via useCatalogs() — nothing here is hardcoded   */
/*  anymore, so anything the admin adds in Categories/Conveniences      */
/*  shows up on the public site without a code change.                 */
/* ------------------------------------------------------------------ */

function FiltersContent({ filters, setFilters, listingType = "rent", priceBounds }) {
  // Both are already loaded by the time this renders (BrowsePage waits for them),
  // and the shared request cache means asking again costs nothing.
  const { properties } = useBrowseProperties();
  const { categories, neighborhoods, amenities, getAmenitiesForCategory, getSubcategoriesForCategory } = useCatalogs();
  const [minPrice, maxPrice] = priceBounds ?? FALLBACK_PRICE_BOUNDS[listingType] ?? FALLBACK_PRICE_BOUNDS.rent;
  const priceStep = PRICE_STEP[listingType] ?? PRICE_STEP.rent;

  const selectedCategory = categories.find((c) => c.id === filters.type);
  const availableSubcategories = filters.type ? getSubcategoriesForCategory(filters.type) : [];

  const availableNeighborhoodIds = useMemo(
    () => neighborhoodIdsForCategory(properties, listingType, filters.type),
    [properties, listingType, filters.type],
  );
  const availableNeighborhoods = neighborhoods.filter((n) => availableNeighborhoodIds.has(n.id));

  // Garage is always offered (it's the numeric `garage` column on every
  // property, not a category-scoped amenity) — when a specific category is
  // selected, real amenities are scoped to whatever that category was
  // assigned in the dashboard's Categories page; under "All", nothing
  // should be excluded, so every amenity that exists is offered instead.
  //
  // If someone's also added a real amenity literally named "Garage" via
  // /admin/conveniences, it gets filtered out here rather than shown
  // alongside the synthetic one — two "Garage" checkboxes that filter
  // differently (one from the numeric field, one from a checkbox someone
  // has to remember to tick per property) is confusing and the numeric
  // field is the more reliable source of truth. Worth deleting that
  // duplicate amenity from /admin/conveniences too, since it can still be
  // assigned to properties from the property form even though it's hidden
  // from this filter list.
  const availableConveniences = useMemo(() => {
    const categoryAmenities = filters.type ? getAmenitiesForCategory(filters.type) : amenities;
    const nonGarageAmenities = categoryAmenities.filter(
      (a) => a.name.trim().toLowerCase() !== GARAGE_CONVENIENCE.name.toLowerCase(),
    );
    return [
      GARAGE_CONVENIENCE,
      ...nonGarageAmenities.map((a) => ({ id: a.id, name: a.name, icon: getIconByKey(a.icon) })),
    ];
  }, [filters.type, getAmenitiesForCategory, amenities]);

  const roomsEnabled = selectedCategory?.rooms_filter_enabled ?? true;

  // `id` is null for "All".
  const selectType = (id) => {
    setFilters((f) =>
      applyCategorySelection(f, id, { categories, amenities, getAmenitiesForCategory, properties, listingType }),
    );
  };

  const toggleSubcategory = (id) => setFilters((f) => ({ ...f, subcategory: f.subcategory === id ? null : id }));

  const toggleRooms = (id) => setFilters((f) => ({ ...f, rooms: f.rooms === id ? null : id }));

  const toggleConvenience = (id) =>
    setFilters((f) => {
      const next = new Set(f.conveniences);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...f, conveniences: next };
    });

  return (
    <div className="w-full">
      <FilterSection label="Property type">
        <div className="grid grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => selectType(null)}
            className={`flex flex-col items-center justify-center gap-2 rounded-2xl border py-4 text-xs text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
              filters.type === null
                ? "bg-accent-500 border-accent-500 text-white"
                : "bg-white border-accent-500/10 text-secondary hover:border-accent-500/30"
            }`}
          >
            All
          </button>
          {categories.map((category) => {
            const active = filters.type === category.id;
            const Icon = getIconByKey(category.icon);
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => selectType(category.id)}
                className={`flex flex-col items-center justify-center gap-2 rounded-2xl border py-4 text-xs text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
                  active
                    ? "bg-accent-500 border-accent-500 text-white"
                    : "bg-white border-accent-500/10 text-secondary hover:border-accent-500/30"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-white" : "text-secondary/70"}`} />
                {category.name}
              </button>
            );
          })}
        </div>
      </FilterSection>

      {filters.type && availableSubcategories.length > 0 && (
        <FilterSection label="Sub-type">
          <div className="flex flex-wrap gap-2">
            {availableSubcategories.map((sub) => {
              const active = filters.subcategory === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => toggleSubcategory(sub.id)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
                    active
                      ? "bg-accent-500 border-accent-500 text-white"
                      : "bg-white border-accent-500/10 text-secondary hover:border-accent-500/30"
                  }`}
                >
                  {sub.name}
                </button>
              );
            })}
          </div>
        </FilterSection>
      )}

      {availableNeighborhoods.length > 0 && (
        <FilterSection label="Neighborhood">
          <select
            value={filters.neighborhood ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, neighborhood: e.target.value || null }))}
            className="w-full rounded-lg border border-accent-500/10 bg-white px-3.5 py-2.5 text-sm text-main focus:border-accent-500 focus:outline-none cursor-pointer"
          >
            <option value="">All Neighborhoods</option>
            {availableNeighborhoods.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </select>
        </FilterSection>
      )}

      <FilterSection label="Price range">
        <PriceRangeSlider
          min={minPrice}
          max={maxPrice}
          step={priceStep}
          value={filters.price}
          onChange={(price) => setFilters((f) => ({ ...f, price }))}
        />
      </FilterSection>

      {roomsEnabled && (
        <FilterSection label="Rooms">
          <div className="flex gap-2">
            {ROOM_OPTIONS.map((r) => {
              const active = filters.rooms === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => toggleRooms(r)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
                    active
                      ? "bg-accent-500 text-white"
                      : "bg-white border border-accent-500/10 text-secondary hover:border-accent-500/30"
                  }`}
                >
                  {r}+
                </button>
              );
            })}
          </div>
        </FilterSection>
      )}

      <FilterSection label="Additional conveniences">
        <div className="space-y-3">
          {availableConveniences.map(({ id, name, icon: Icon }) => (
            <label key={id} className="flex items-center gap-2.5 text-sm text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={filters.conveniences.has(id)}
                onChange={() => toggleConvenience(id)}
                className="w-4 h-4 rounded accent-accent-500 border-accent-500/20"
              />
              <Icon className="w-4 h-4 text-secondary/60" />
              {name}
            </label>
          ))}
        </div>
      </FilterSection>
    </div>
  );
}

export default FiltersContent;
