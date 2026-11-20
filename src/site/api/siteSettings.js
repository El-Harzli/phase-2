import { supabase } from "@/shared/api/supabaseClient";
import { runQueriesWithRetry } from "@/shared/lib/runQueriesWithRetry";

// Postgres `numeric` columns come back as strings over PostgREST — coerce
// office_lat/office_lng back to numbers, same as everywhere else that touches a
// numeric column.
function normalizeSettings(row) {
  return { ...row, office_lat: Number(row.office_lat), office_lng: Number(row.office_lng) };
}

// The one row of site_settings (agency name, phone, hours, office map position…).
// Never throws. Not critical to the site: if it can't be loaded the error is only
// logged and { data: null, error } comes back, so SiteSettingsProvider keeps its
// fallback settings.
export async function fetchSiteSettings() {
  const [result] = await runQueriesWithRetry(
    [() => supabase.from("site_settings").select("*").eq("id", 1).single()],
    ["site_settings"],
  );
  if (result.error) {
    console.error("Site settings failed to load (non-critical):", result.error);
    return { data: null, error: result.error };
  }
  return { data: normalizeSettings(result.data), error: null };
}
