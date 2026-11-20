import { supabase } from "@/shared/api/supabaseClient";
import { runQueriesWithRetry } from "@/shared/lib/runQueriesWithRetry";
import { normalizeFocal, sortByOrder, toQueryError } from "@/site/lib/queryHelpers";

// The small reference tables the filters, cards and pages are built from. Each
// is its own request, so a page can ask for only the ones it needs, and the
// shared request cache (lib/requestCache.js) makes sure each is requested once.
// All of them follow the api/ convention: they never throw and resolve with
// { data, error }. A failure carries `queryName` and `status` (see
// lib/queryHelpers.js) and is logged here.

async function fetchCatalog(label, makeQuery, shape) {
  const [result] = await runQueriesWithRetry([makeQuery], [label]);
  if (result.error) {
    console.error(result.error);
    return { data: null, error: toQueryError(label, result) };
  }
  return { data: shape(result.data), error: null };
}

export function fetchCategories() {
  return fetchCatalog(
    "categories",
    () => supabase.from("categories").select("*").order("sort_order", { ascending: true }),
    sortByOrder,
  );
}

export function fetchSubcategories() {
  return fetchCatalog(
    "subcategories",
    () => supabase.from("subcategories").select("*").order("sort_order", { ascending: true }),
    sortByOrder,
  );
}

export function fetchAmenities() {
  return fetchCatalog(
    "amenities",
    () => supabase.from("amenities").select("*").order("name", { ascending: true }),
    (rows) => rows,
  );
}

export function fetchCategoryAmenityLinks() {
  return fetchCatalog(
    "category_amenities",
    () => supabase.from("category_amenities").select("*"),
    (rows) => rows,
  );
}

// Neighborhoods are not core to browsing properties, so a failure here must
// never take down a page the way a failure in the tables above should: callers
// treat the error as "no neighborhoods".
export async function fetchNeighborhoods() {
  const [result] = await runQueriesWithRetry(
    [() => supabase.from("neighborhoods").select("*").order("sort_order", { ascending: true })],
    ["neighborhoods"],
  );
  if (result.error) {
    console.error("Neighborhoods failed to load (non-critical):", result.error);
    return { data: null, error: toQueryError("neighborhoods", result) };
  }
  return { data: sortByOrder(result.data.map(normalizeFocal)), error: null };
}
