import { useCallback, useMemo } from "react";
import {
  fetchAmenities,
  fetchCategories,
  fetchCategoryAmenityLinks,
  fetchNeighborhoods,
  fetchSubcategories,
} from "@/site/api/catalogs";
import useCachedRequest from "@/site/hooks/useCachedRequest";

// The small reference tables the Browse filters are built from. An admin edits
// them rarely, so they are kept for 30 minutes and then renewed quietly the next
// time something asks. Each one shares its request (same cache key) with
// everything else that asks for it.
const CATALOG_TTL_MS = 30 * 60 * 1000;
const NONE = [];

// Categories, subcategories, amenities and the category↔amenity links are
// critical for filtering: if one fails, `error` is set and those lists are empty.
// Neighborhoods are not — a failure is only an empty list. `loading` also waits
// for neighborhoods, so a chip never shows a raw id while the names are on their
// way. `reload` asks for all of it again.
export default function useCatalogs() {
  const ttl = { ttlMs: CATALOG_TTL_MS };
  const categoriesRequest = useCachedRequest("categories", fetchCategories, ttl);
  const subcategoriesRequest = useCachedRequest("subcategories", fetchSubcategories, ttl);
  const amenitiesRequest = useCachedRequest("amenities", fetchAmenities, ttl);
  const linksRequest = useCachedRequest("category-amenity-links", fetchCategoryAmenityLinks, ttl);
  const neighborhoodsRequest = useCachedRequest("neighborhoods", fetchNeighborhoods, ttl);

  const criticalRequests = [categoriesRequest, subcategoriesRequest, amenitiesRequest, linksRequest];
  const error = criticalRequests.find((request) => request.error)?.error ?? null;
  const loading = !error && [...criticalRequests, neighborhoodsRequest].some((request) => request.loading);

  const categories = error ? NONE : (categoriesRequest.data ?? NONE);
  const subcategories = error ? NONE : (subcategoriesRequest.data ?? NONE);
  const amenities = error ? NONE : (amenitiesRequest.data ?? NONE);
  const categoryAmenityLinks = error ? NONE : (linksRequest.data ?? NONE);
  const neighborhoods = neighborhoodsRequest.error ? NONE : (neighborhoodsRequest.data ?? NONE);

  const { reload: reloadCategories } = categoriesRequest;
  const { reload: reloadSubcategories } = subcategoriesRequest;
  const { reload: reloadAmenities } = amenitiesRequest;
  const { reload: reloadLinks } = linksRequest;
  const { reload: reloadNeighborhoods } = neighborhoodsRequest;
  const reload = useCallback(
    () =>
      Promise.all([reloadCategories(), reloadSubcategories(), reloadAmenities(), reloadLinks(), reloadNeighborhoods()]),
    [reloadCategories, reloadSubcategories, reloadAmenities, reloadLinks, reloadNeighborhoods],
  );

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

  return {
    categories,
    subcategories,
    amenities,
    neighborhoods,
    loading,
    error,
    reload,
    getSubcategoriesForCategory,
    getAmenitiesForCategory,
  };
}
