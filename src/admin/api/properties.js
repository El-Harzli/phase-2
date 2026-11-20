import { supabase } from "@/shared/api/supabaseClient";
import { updateWithConcurrencyCheck } from "@/admin/api/updateWithConcurrencyCheck";

export function sortImages(images) {
  return images.slice().sort((a, b) => a.sort_order - b.sort_order);
}

// Postgres `numeric` columns are serialized as strings by PostgREST to
// avoid float precision loss — coerce them back to numbers so the rest of
// the app can keep treating them as numbers.
export function normalizeImage(image) {
  return {
    ...image,
    focal_x: Number(image.focal_x ?? 0.5),
    focal_y: Number(image.focal_y ?? 0.5),
  };
}

// Postgres `numeric` columns (price, area, lat, lng) are serialized as
// strings by PostgREST to avoid float precision loss — coerce them back to
// numbers here so the rest of the app (price formatting, map coordinates,
// form pre-fill math) can keep treating them as numbers.
export function normalizeProperty(property) {
  return {
    ...property,
    price: Number(property.price),
    area: Number(property.area),
    lat: property.lat === null ? null : Number(property.lat),
    lng: property.lng === null ? null : Number(property.lng),
  };
}

// ---- loading (returned unawaited, so they can be passed to runQueriesWithRetry as thunks)

export function fetchProperties() {
  return supabase.from("properties").select("*").order("created_at", { ascending: false });
}

export function fetchPropertyImages() {
  return supabase.from("property_images").select("*");
}

export function fetchPropertyAmenityLinks() {
  return supabase.from("property_amenities").select("*");
}

// One update per property, run together (not atomic): each featured property
// gets its position, and every property that dropped off the list gets null.
export async function updateFeaturedOrder(orderedIds, idsToClear) {
  const results = await Promise.all([
    ...orderedIds.map((id, index) =>
      supabase.from("properties").update({ featured_order: index }).eq("id", id).select("id, updated_at"),
    ),
    ...idsToClear.map((id) =>
      supabase.from("properties").update({ featured_order: null }).eq("id", id).select("id, updated_at"),
    ),
  ]);
  // The new `updated_at` of every row that was touched (the DB trigger moves it
  // on each update), so the caller can keep its own copies in step.
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

// Deletes only the database row (the photo files are removed separately by the caller).
export async function deletePropertyRow(id) {
  const { error } = await supabase.from("properties").delete().eq("id", id);
  if (error) throw error;
}

export async function insertProperty(fields) {
  const { data, error } = await supabase.from("properties").insert(fields).select().single();
  if (error) throw error;
  return data;
}

// `expectedUpdatedAt` is the value the caller loaded the property with —
// when provided, the update only applies if the row hasn't changed since
// then (properties.updated_at auto-refreshes via a DB trigger on every
// update, so this is the same value Postgres itself will have moved on).
// Without this, two admins editing the same property is a silent lost
// update: whoever saves second overwrites the first admin's change with
// their own now-stale copy of every other field, with no error at all.
export function patchProperty(id, patch, expectedUpdatedAt) {
  return updateWithConcurrencyCheck("properties", id, patch, expectedUpdatedAt, "property");
}

export async function replacePropertyImages(propertyId, images) {
  const { data, error } = await supabase.rpc("set_property_images", {
    p_property_id: propertyId,
    p_images: images.map((image) => ({
      url: image.url,
      focal_x: image.focal_x ?? 0.5,
      focal_y: image.focal_y ?? 0.5,
    })),
  });
  if (error) {
    // P0002 is the function's own "property not found" signal (raised
    // when the row was deleted between this admin's earlier updateProperty
    // call and this one) — give it a message worth showing in a toast
    // rather than the raw Postgres text.
    if (error.code === "P0002") {
      const notFoundError = new Error("This property no longer exists — it may have been deleted by another admin.");
      notFoundError.code = "NOT_FOUND";
      throw notFoundError;
    }
    throw error;
  }
  return data ?? [];
}

export async function replacePropertyAmenities(propertyId, amenityIds) {
  const { error } = await supabase.rpc("set_property_amenities", {
    p_property_id: propertyId,
    p_amenity_ids: amenityIds,
  });
  if (error) {
    if (error.code === "P0002") {
      const notFoundError = new Error("This property no longer exists — it may have been deleted by another admin.");
      notFoundError.code = "NOT_FOUND";
      throw notFoundError;
    }
    throw error;
  }
}
