import { supabase } from "@/shared/api/supabaseClient";
import { runQueriesWithRetry } from "@/shared/lib/runQueriesWithRetry";
import { fetchAllRows, toQueryError } from "@/site/lib/queryHelpers";

// One tiny row per published property — only the three columns the counts are
// made from: its agent, its neighborhood and whether it is for rent or for sale.
// It is what the neighborhood cards (Home and the Neighborhoods page), the About
// page's "listings per agent" and the property page's agent card count from, so
// none of them has to download the properties themselves. RLS limits the table
// to published rows for the public; the status filter says the same out loud.
// Never throws: resolves with { data: rows, error }, and a failure carries
// `queryName` and `status` (see lib/queryHelpers.js).
export async function fetchPropertyCounts() {
  const [result] = await runQueriesWithRetry(
    [
      () =>
        fetchAllRows(
          () =>
            supabase
              .from("properties")
              .select("agent_id, neighborhood_id, listing_type", { count: "exact" })
              .eq("status", "published"),
          (query) => query.order("id"),
        ),
    ],
    ["property_counts"],
  );
  if (result.error) {
    console.error(result.error);
    return { data: null, error: toQueryError("property_counts", result) };
  }
  return { data: result.data, error: null };
}
