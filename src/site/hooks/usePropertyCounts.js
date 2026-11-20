import { useCallback, useMemo } from "react";
import { fetchPropertyCounts } from "@/site/api/propertyCounts";
import useCachedRequest from "@/site/hooks/useCachedRequest";

// Counts change when a listing is published or removed, so they are kept for 5
// minutes. After that the old numbers are shown at once and renewed quietly the
// next time something asks (see lib/requestCache.js).
const COUNTS_KEY = "property-counts";
const COUNTS_TTL_MS = 5 * 60 * 1000;

// How many published listings there are per neighborhood (rent / sale) and per
// agent, from one tiny shared request (api/propertyCounts.js). The getters
// return null while the numbers are not known — loading, or the request failed —
// never a made-up 0, so a caller can leave the number out instead of showing a
// wrong one. `error` is set only when there are no numbers at all.
export default function usePropertyCounts() {
  const { data, error, loading } = useCachedRequest(COUNTS_KEY, fetchPropertyCounts, { ttlMs: COUNTS_TTL_MS });

  const counts = useMemo(() => {
    if (!data) return null;
    const byNeighborhood = new Map();
    const byAgent = new Map();
    for (const row of data) {
      if (row.neighborhood_id !== null && row.neighborhood_id !== undefined) {
        const key = `${row.neighborhood_id}:${row.listing_type}`;
        byNeighborhood.set(key, (byNeighborhood.get(key) ?? 0) + 1);
      }
      if (row.agent_id !== null && row.agent_id !== undefined) {
        byAgent.set(row.agent_id, (byAgent.get(row.agent_id) ?? 0) + 1);
      }
    }
    return { byNeighborhood, byAgent };
  }, [data]);

  const getPropertyCountForNeighborhoodByType = useCallback(
    (neighborhoodId, listingType) =>
      counts ? (counts.byNeighborhood.get(`${neighborhoodId}:${listingType}`) ?? 0) : null,
    [counts],
  );

  const getListingCountForAgent = useCallback(
    (agentId) => (counts ? (counts.byAgent.get(agentId) ?? 0) : null),
    [counts],
  );

  return { loading, error, getPropertyCountForNeighborhoodByType, getListingCountForAgent };
}
