import { GARAGE_CONVENIENCE } from "@/site/lib/garageConvenience";

export const DEFAULT_ROOMS = null;

// Fallback only — used before properties have loaded, or if a listing
// type genuinely has zero properties yet. Once real data exists, the
// slider's actual min/max come from computePriceBounds below instead.
export const FALLBACK_PRICE_BOUNDS = {
  rent: [0, 7000],
  sale: [0, 1600000],
};

export const PRICE_STEP = {
  rent: 50,
  sale: 5000,
};

// Detecting the real min/max from already-loaded properties is
// essentially free — the full property list for this listing type is
// already fetched for browsing regardless, so this needs no extra
// request and no meaningful added computation (a couple of Math.min/max
// calls over an array that's realistically dozens to a few hundred items
// for a boutique agency, not something that needs a heavier sync-with-
// dashboard-settings fallback).
export function computePriceBounds(properties, listingType) {
  const step = PRICE_STEP[listingType] ?? PRICE_STEP.rent;
  const relevant = properties.filter((p) => p.listingType === listingType);

  if (relevant.length === 0) {
    return [...(FALLBACK_PRICE_BOUNDS[listingType] ?? FALLBACK_PRICE_BOUNDS.rent)];
  }

  const prices = relevant.map((p) => p.price);
  const min = Math.floor(Math.min(...prices) / step) * step;
  const max = Math.ceil(Math.max(...prices) / step) * step;
  // Guard against a degenerate zero-width range (e.g. every property
  // currently costs exactly the same) so the slider always has room to move.
  return min === max ? [min, max + step] : [min, max];
}

// `type: null` means "All" — categories are admin-managed and can be
// reordered/renamed, so defaulting to "whichever happens to be first" was
// an arbitrary, easy-to-miss filter rather than a deliberate choice.
export function createDefaultFilters(listingType = "rent", priceBounds) {
  return {
    type: null,
    subcategory: null,
    neighborhood: null,
    rooms: DEFAULT_ROOMS,
    price: [...(priceBounds ?? FALLBACK_PRICE_BOUNDS[listingType] ?? FALLBACK_PRICE_BOUNDS.rent)],
    conveniences: new Set(),
  };
}

// The listing-type segment's properties that pass every active filter. Pure
// function so it can be reused (and, later, run on the server).
export function filterProperties(properties, listingType, filters, search) {
  return properties
    .filter((p) => p.listingType === listingType)
    .filter((p) => {
      if (filters.type && p.categoryId !== filters.type) return false;
      if (filters.subcategory && p.subcategoryId !== filters.subcategory) return false;
      if (filters.neighborhood && p.neighborhoodId !== filters.neighborhood) return false;

      const [minPrice, maxPrice] = filters.price;
      if (p.price < minPrice || p.price > maxPrice) return false;

      if (filters.rooms && p.beds < Number(filters.rooms)) return false;

      for (const c of filters.conveniences) {
        if (c === GARAGE_CONVENIENCE.id) {
          if (p.garage <= 0) return false;
        } else if (!p.amenityIds.includes(c)) {
          return false;
        }
      }

      if (search) {
        const haystack = `${p.title} ${p.location}`.toLowerCase();
        if (!haystack.includes(search.trim().toLowerCase())) return false;
      }

      return true;
    });
}

// Which neighborhoods actually have properties matching the current
// category (and "All" when no category is selected) — without this, the
// dropdown listed every neighborhood regardless of category, so picking
// one could silently combine with the category filter to produce zero
// results with no indication why.
export function neighborhoodIdsForCategory(properties, listingType, categoryId) {
  const relevant = properties.filter(
    (p) => p.listingType === listingType && (!categoryId || p.categoryId === categoryId),
  );
  return new Set(relevant.map((p) => p.neighborhoodId).filter(Boolean));
}

// Picking a property type (`id` is null for "All"): drops the conveniences
// that don't apply to it, clears the sub-type, and keeps the selected
// neighborhood only if it still has properties under the new type.
export function applyCategorySelection(
  filters,
  id,
  { categories, amenities, getAmenitiesForCategory, properties, listingType },
) {
  const applicableIds = id
    ? new Set(getAmenitiesForCategory(id).map((a) => a.id))
    : new Set(amenities.map((a) => a.id));
  applicableIds.add(GARAGE_CONVENIENCE.id);
  const nextConveniences = new Set([...filters.conveniences].filter((c) => applicableIds.has(c)));
  const nextCategory = id ? categories.find((c) => c.id === id) : null;

  // Keep the selected neighborhood only if it still has properties
  // under the newly selected category — otherwise the dropdown would
  // silently show a neighborhood no longer in its own option list.
  const stillRelevant =
    !filters.neighborhood || neighborhoodIdsForCategory(properties, listingType, id).has(filters.neighborhood);

  return {
    ...filters,
    type: id,
    subcategory: null,
    neighborhood: stillRelevant ? filters.neighborhood : null,
    rooms: nextCategory && !nextCategory.rooms_filter_enabled ? null : filters.rooms,
    conveniences: nextConveniences,
  };
}
