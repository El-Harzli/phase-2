// Small helpers shared by the api/ files that read tables from Supabase.

export function sortByOrder(rows) {
  return [...rows].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

// Postgres `numeric` columns come back as strings over PostgREST — coerce
// focal_x/focal_y back to numbers, same as price/area/lat/lng elsewhere.
export function normalizeFocal(row) {
  return {
    ...row,
    focal_x: Number(row.focal_x ?? 0.5),
    focal_y: Number(row.focal_y ?? 0.5),
  };
}

// A property id from outside — the address bar, a bookmark, a saved favorite —
// can be anything. One that isn't a UUID can't be a property, and sending it to
// the database would only come back as an error that looks like an outage, so
// callers check it first. Same pattern as the link-preview edge function.
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value) {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

// Turns a failed query result into the error the site passes around. Which
// request failed (`queryName`) and its HTTP status are attached so the Browse
// page's error screen can show them (in development only).
export function toQueryError(queryName, result) {
  const error = new Error(result.error.message ?? String(result.error), { cause: result.error });
  error.queryName = queryName;
  error.status = result.status;
  return error;
}

// Supabase's API returns at most 1000 rows per request by default (the project's
// "max rows" setting) and says nothing about the rest. properties,
// property_images and property_amenities are the tables that can pass that —
// every photo and every ticked amenity is a row, so roughly 100 listings are
// enough — and a plain select would silently cut them off, leaving listings
// without photos or amenities and no error anywhere.
const PAGE_SIZE = 1000;

// Reads every row of one table.
//
// `makeQuery` builds the select exactly as it was before paging existed, but
// asking for the total row count too (`{ count: "exact" }`). When that first
// response already holds every row — the normal case — it is returned as is,
// so a catalog under the limit gets the very same request, and the very same
// row order, as before. Only when rows are missing is the table read again,
// page by page, with `applyPagingOrder` adding a fixed order (a changing order
// would repeat or skip rows between pages; it should use only columns the
// caller already reads). The next page starts after the rows that actually came back,
// not after PAGE_SIZE, so a project that lowers its max-rows setting still gets
// every row. Rows added or removed while the pages are being read can make one
// row repeat or be missed until the next load.
export async function fetchAllRows(makeQuery, applyPagingOrder) {
  const first = await makeQuery();
  if (first.error) return first;
  const total = first.count;
  if (typeof total !== "number" || first.data.length >= total) return first;

  const rows = [];
  while (rows.length < total) {
    const page = await applyPagingOrder(makeQuery()).range(rows.length, rows.length + PAGE_SIZE - 1);
    if (page.error) return page;
    // The table shrank while it was being read: stop with what there is.
    if (page.data.length === 0) break;
    rows.push(...page.data);
  }
  return { data: rows, error: null, status: first.status };
}
