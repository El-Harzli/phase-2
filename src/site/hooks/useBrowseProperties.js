import { fetchBrowseProperties } from "@/site/api/properties";
import useCachedRequest from "@/site/hooks/useCachedRequest";

// The Browse list changes when a listing is published, edited or removed, so it
// is kept for 5 minutes. After that the old list is shown at once and renewed
// quietly the next time something asks (see lib/requestCache.js).
const BROWSE_KEY = "browse-properties";
const BROWSE_TTL_MS = 5 * 60 * 1000;
const NONE = [];

// Every published property, rent and sale together, in the light Browse shape
// (see lib/buildBrowseProperty.js), newest first. Loaded when something first asks
// for it and then kept, so going back to Browse (or switching rent/sale) needs no
// request. On failure the list is empty and `error` is set.
export default function useBrowseProperties() {
  const { data, error, loading, reload } = useCachedRequest(BROWSE_KEY, fetchBrowseProperties, {
    ttlMs: BROWSE_TTL_MS,
  });
  return { properties: error ? NONE : (data ?? NONE), loading, error, reload };
}
