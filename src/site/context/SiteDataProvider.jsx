import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchAgents } from "@/site/api/agents";
import {
  fetchAmenities,
  fetchCategories,
  fetchCategoryAmenityLinks,
  fetchNeighborhoods,
  fetchSubcategories,
} from "@/site/api/catalogs";
import { fetchRawProperties } from "@/site/api/siteData";
import { useSiteSettings } from "@/site/context/SiteSettingsProvider";
import useCachedRequest from "@/site/hooks/useCachedRequest";
import { buildProperties } from "@/site/lib/buildProperties";

const SiteDataContext = createContext(null);

const EMPTY_SITE_DATA = {
  categories: [],
  subcategories: [],
  amenities: [],
  categoryAmenityLinks: [],
  agents: [],
  neighborhoods: [],
  rawProperties: [],
};

// TEMP: the whole site's data in one provider, as before — the pages are moved
// one by one onto lighter, per-page requests, and this provider and
// useSiteData go away when the last one has moved. What changed already: nothing
// is loaded at app start any more. Each piece is a resource in the shared
// request cache (lib/requestCache.js), and loading starts the first time a
// component calls useSiteData() — so pages that need only the settings (Contact,
// Concierge, the footer) never trigger it — and the shared cache makes sure each
// request is sent once. Nothing here goes old (no `ttlMs`): like before, it is
// loaded once per visit, and SiteApp clears the cache when the site is left.
// Everything still behaves as one load: `loading` is true until all of it has
// arrived, and a failure of any critical piece empties every list and sets
// `error` — only neighborhoods can fail without that.
export function SiteDataProvider({ children }) {
  // Loaded on its own, eagerly, by SiteSettingsProvider — not part of this load.
  const settings = useSiteSettings();
  const [requested, setRequested] = useState(false);
  const request = useCallback(() => setRequested(true), []);

  const categoriesRequest = useCachedRequest("categories", fetchCategories, { enabled: requested });
  const subcategoriesRequest = useCachedRequest("subcategories", fetchSubcategories, { enabled: requested });
  const amenitiesRequest = useCachedRequest("amenities", fetchAmenities, { enabled: requested });
  const categoryAmenityLinksRequest = useCachedRequest("category-amenity-links", fetchCategoryAmenityLinks, {
    enabled: requested,
  });
  const agentsRequest = useCachedRequest("agents", fetchAgents, { enabled: requested });
  const neighborhoodsRequest = useCachedRequest("neighborhoods", fetchNeighborhoods, { enabled: requested });
  const rawPropertiesRequest = useCachedRequest("raw-properties", fetchRawProperties, { enabled: requested });

  // Neighborhoods are deliberately left out of the critical ones: they are not
  // core to browsing properties, so a problem with them should never take down
  // the entire public site the way a failure in properties/categories/etc.
  // legitimately should.
  const criticalRequests = [
    categoriesRequest,
    subcategoriesRequest,
    amenitiesRequest,
    categoryAmenityLinksRequest,
    agentsRequest,
    rawPropertiesRequest,
  ];
  const error = criticalRequests.find((request) => request.error)?.error ?? null;
  // Neighborhoods are still waited for (as when everything arrived together), but
  // only while they are loading — a failure just means "no neighborhoods".
  const loading = !error && [...criticalRequests, neighborhoodsRequest].some((request) => request.loading);

  const { reload: reloadCategories } = categoriesRequest;
  const { reload: reloadSubcategories } = subcategoriesRequest;
  const { reload: reloadAmenities } = amenitiesRequest;
  const { reload: reloadCategoryAmenityLinks } = categoryAmenityLinksRequest;
  const { reload: reloadAgents } = agentsRequest;
  const { reload: reloadNeighborhoods } = neighborhoodsRequest;
  const { reload: reloadRawProperties } = rawPropertiesRequest;
  // The manual retry on the Browse page: ask for all of it again.
  const reload = useCallback(
    () =>
      Promise.all([
        reloadCategories(),
        reloadSubcategories(),
        reloadAmenities(),
        reloadCategoryAmenityLinks(),
        reloadAgents(),
        reloadNeighborhoods(),
        reloadRawProperties(),
      ]),
    [
      reloadCategories,
      reloadSubcategories,
      reloadAmenities,
      reloadCategoryAmenityLinks,
      reloadAgents,
      reloadNeighborhoods,
      reloadRawProperties,
    ],
  );

  const loadedCategories = categoriesRequest.data;
  const loadedSubcategories = subcategoriesRequest.data;
  const loadedAmenities = amenitiesRequest.data;
  const loadedCategoryAmenityLinks = categoryAmenityLinksRequest.data;
  const loadedAgents = agentsRequest.data;
  const loadedNeighborhoods = neighborhoodsRequest.error ? EMPTY_SITE_DATA.neighborhoods : neighborhoodsRequest.data;
  const loadedRawProperties = rawPropertiesRequest.data;

  // Until everything has arrived (and after a failure) every list stays empty,
  // exactly as when it all came back in one piece.
  const siteData = useMemo(
    () =>
      loading || error
        ? EMPTY_SITE_DATA
        : {
            categories: loadedCategories,
            subcategories: loadedSubcategories,
            amenities: loadedAmenities,
            categoryAmenityLinks: loadedCategoryAmenityLinks,
            agents: loadedAgents,
            neighborhoods: loadedNeighborhoods,
            rawProperties: loadedRawProperties,
          },
    [
      loading,
      error,
      loadedCategories,
      loadedSubcategories,
      loadedAmenities,
      loadedCategoryAmenityLinks,
      loadedAgents,
      loadedNeighborhoods,
      loadedRawProperties,
    ],
  );

  const { categories, subcategories, amenities, categoryAmenityLinks, agents, neighborhoods, rawProperties } = siteData;

  // ---- lookups --------------------------------------------------------

  const getSubcategoriesForCategory = useCallback(
    (categoryId) => subcategories.filter((s) => s.category_id === categoryId),
    [subcategories],
  );

  // categoryId -> Set(amenityId) — mirrors the dashboard's
  // `getAmenityIdsForCategory`, used to only show filters that are
  // actually applicable to the selected property type.
  const amenityIdsByCategory = useMemo(() => {
    const map = new Map();
    for (const link of categoryAmenityLinks) {
      if (!map.has(link.category_id)) map.set(link.category_id, new Set());
      map.get(link.category_id).add(link.amenity_id);
    }
    return map;
  }, [categoryAmenityLinks]);

  const getAmenitiesForCategory = useCallback(
    (categoryId) => {
      const ids = amenityIdsByCategory.get(categoryId);
      if (!ids) return [];
      return amenities.filter((a) => ids.has(a.id));
    },
    [amenityIdsByCategory, amenities],
  );

  const properties = useMemo(
    () => buildProperties({ rawProperties, categories, subcategories, neighborhoods, agents, amenities }),
    [rawProperties, categories, subcategories, neighborhoods, agents, amenities],
  );

  const value = useMemo(
    () => ({
      properties,
      categories,
      subcategories,
      amenities,
      agents,
      neighborhoods,
      settings,
      loading,
      error,
      reload,
      request,
      getAmenitiesForCategory,
      getSubcategoriesForCategory,
    }),
    [
      properties,
      categories,
      subcategories,
      amenities,
      agents,
      neighborhoods,
      settings,
      loading,
      error,
      reload,
      request,
      getAmenitiesForCategory,
      getSubcategoriesForCategory,
    ],
  );

  return <SiteDataContext.Provider value={value}>{children}</SiteDataContext.Provider>;
}

// Calling this is what starts the load (the first call anywhere is enough; the
// rest share it). `enabled: false` reads without asking for anything — for a
// component that is always on screen but only needs the data some of the time
// (see FavoritesPanel).
export function useSiteData({ enabled = true } = {}) {
  const context = useContext(SiteDataContext);
  if (!context) {
    throw new Error("useSiteData must be used within a SiteDataProvider");
  }

  const { request } = context;
  useEffect(() => {
    if (enabled) request();
  }, [enabled, request]);

  return context;
}
