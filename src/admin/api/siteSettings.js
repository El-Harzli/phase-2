import { supabase } from "@/shared/api/supabaseClient";

// Postgres `numeric` columns are serialized as strings by PostgREST — coerce
// them back to numbers here.
export function normalizeSiteSettings(settings) {
  return {
    ...settings,
    price_min: Number(settings.price_min),
    price_max: Number(settings.price_max),
    office_lat: Number(settings.office_lat),
    office_lng: Number(settings.office_lng),
  };
}

// Returns the query itself (not awaited), so the caller can hand it to
// runQueriesWithRetry as a thunk.
export function fetchSiteSettings() {
  return supabase.from("site_settings").select("*").eq("id", 1).single();
}

// Same reasoning as PropertiesContext's updateProperty: site_settings is
// a single row every admin edits from the same form, and the save sends
// every field each time — without this check, whoever saves second
// silently overwrites whatever the first admin just changed with their
// own stale copy of it. `expectedUpdatedAt` is the value the form loaded
// with; the trigger on this table already keeps updated_at current, so
// a mismatch means someone else saved in between.
export async function updateSiteSettings(patch, expectedUpdatedAt) {
  let query = supabase.from("site_settings").update(patch).eq("id", 1);
  if (expectedUpdatedAt) {
    query = query.eq("updated_at", expectedUpdatedAt);
  }
  const { data, error } = await query.select();
  if (error) throw error;

  if (data.length === 0) {
    // This row is a fixed singleton with no delete path anywhere in the
    // admin, so unlike properties there's no "someone deleted it" case
    // to distinguish — zero rows here only ever means the timestamp
    // didn't match.
    const conflictError = new Error("Settings were updated by someone else. Reload before saving again.");
    conflictError.code = "CONFLICT";
    throw conflictError;
  }

  return normalizeSiteSettings(data[0]);
}
