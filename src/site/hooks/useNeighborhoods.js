import { fetchNeighborhoods } from "@/site/api/catalogs";
import useCachedRequest from "@/site/hooks/useCachedRequest";

// Neighborhoods are a small table that an admin edits rarely: kept for 30
// minutes, then renewed quietly the next time something asks. Shares its
// request with everything else that asks for neighborhoods (same cache key).
const NEIGHBORHOODS_KEY = "neighborhoods";
const NEIGHBORHOODS_TTL_MS = 30 * 60 * 1000;
const NONE = [];

// The neighborhoods in sort order. Not core to browsing properties, so a failed
// request is only an empty list (plus `error`), never a broken page.
export default function useNeighborhoods() {
  const { data, error, loading } = useCachedRequest(NEIGHBORHOODS_KEY, fetchNeighborhoods, {
    ttlMs: NEIGHBORHOODS_TTL_MS,
  });
  return { neighborhoods: error ? NONE : (data ?? NONE), loading, error };
}
