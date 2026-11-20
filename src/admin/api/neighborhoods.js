import { supabase } from "@/shared/api/supabaseClient";
import { updateWithConcurrencyCheck } from "@/admin/api/updateWithConcurrencyCheck";

// Postgres `numeric` columns are serialized as strings by PostgREST to
// avoid float precision loss — coerce them back to numbers, same pattern
// as PropertiesContext.
export function normalizeNeighborhood(neighborhood) {
  return {
    ...neighborhood,
    focal_x: Number(neighborhood.focal_x ?? 0.5),
    focal_y: Number(neighborhood.focal_y ?? 0.5),
  };
}

// Returned unawaited, so it can be passed to runQueriesWithRetry as a thunk.
export function fetchNeighborhoods() {
  return supabase.from("neighborhoods").select("*").order("sort_order", { ascending: true });
}

export async function insertNeighborhood({ name, description, image_url, focal_x, focal_y, sort_order }) {
  const { data, error } = await supabase
    .from("neighborhoods")
    .insert({
      name,
      description: description || null,
      image_url: image_url || null,
      focal_x: focal_x ?? 0.5,
      focal_y: focal_y ?? 0.5,
      sort_order,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export function updateNeighborhood(id, patch, expectedUpdatedAt) {
  return updateWithConcurrencyCheck("neighborhoods", id, patch, expectedUpdatedAt, "neighborhood");
}

export async function deleteNeighborhood(id) {
  const { error } = await supabase.from("neighborhoods").delete().eq("id", id);
  if (error) throw error;
}

// One update per row, run together (not atomic).
export async function updateNeighborhoodSortOrders(orderedIds) {
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("neighborhoods").update({ sort_order: index }).eq("id", id).select("id, updated_at"),
    ),
  );
  // The new `updated_at` of every row (the DB trigger moves it on each update),
  // so the caller can keep its own copies in step.
  const updatedRows = results.flatMap((result) => result.data ?? []);
  const firstError = results.find((result) => result.error)?.error;
  if (firstError) {
    // The updates are independent, so some may have gone through before another
    // one failed — their timestamps moved too, so they travel with the error.
    firstError.updatedRows = updatedRows;
    throw firstError;
  }
  return updatedRows;
}
