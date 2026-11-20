import { fetchFeaturedProperties } from "@/site/api/properties";
import useCachedRequest from "@/site/hooks/useCachedRequest";

// The featured list changes when the admin rearranges it or publishes/removes a
// listing, so it is kept for 5 minutes. After that the old list is shown at once
// and renewed quietly the next time something asks (see lib/requestCache.js).
const FEATURED_KEY = "featured-properties";
const FEATURED_TTL_MS = 5 * 60 * 1000;
const NONE = [];

// The featured properties in card shape, for both rent and sale, in the admin's
// order. On failure the list is empty (plus `error`), never a broken page.
export default function useFeaturedProperties() {
  const { data, error, loading } = useCachedRequest(FEATURED_KEY, fetchFeaturedProperties, { ttlMs: FEATURED_TTL_MS });
  return { properties: error ? NONE : (data ?? NONE), loading, error };
}
