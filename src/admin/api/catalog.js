import { supabase } from "@/shared/api/supabaseClient";
import { updateWithConcurrencyCheck } from "@/admin/api/updateWithConcurrencyCheck";

// ---- loading (returned unawaited, so they can be passed to runQueriesWithRetry as thunks)

export function fetchCategories() {
  return supabase.from("categories").select("*").order("sort_order", { ascending: true });
}

export function fetchAmenities() {
  return supabase.from("amenities").select("*").order("name", { ascending: true });
}

export function fetchSubcategories() {
  return supabase.from("subcategories").select("*").order("sort_order", { ascending: true });
}

export function fetchCategoryAmenityLinks() {
  return supabase.from("category_amenities").select("*");
}

// ---- categories

export async function insertCategory(fields) {
  const { data, error } = await supabase.from("categories").insert(fields).select().single();
  if (error) throw error;
  return data;
}

export function updateCategory(id, patch, expectedUpdatedAt) {
  return updateWithConcurrencyCheck("categories", id, patch, expectedUpdatedAt, "category");
}

export async function deleteCategory(id) {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

// ---- amenities

export async function insertAmenity(fields) {
  const { data, error } = await supabase.from("amenities").insert(fields).select().single();
  if (error) throw error;
  return data;
}

export function updateAmenity(id, patch, expectedUpdatedAt) {
  return updateWithConcurrencyCheck("amenities", id, patch, expectedUpdatedAt, "amenity");
}

export async function deleteAmenity(id) {
  const { error } = await supabase.from("amenities").delete().eq("id", id);
  if (error) throw error;
}

// ---- category <-> amenity links

export async function setCategoryAmenities(categoryId, amenityIds) {
  const { error } = await supabase.rpc("set_category_amenities", {
    p_category_id: categoryId,
    p_amenity_ids: amenityIds,
  });
  if (error) {
    if (error.code === "P0002") {
      const notFoundError = new Error("This category no longer exists — it may have been deleted by another admin.");
      notFoundError.code = "NOT_FOUND";
      throw notFoundError;
    }
    throw error;
  }
}

// ---- subcategories

export async function insertSubcategory(fields) {
  const { data, error } = await supabase.from("subcategories").insert(fields).select().single();
  if (error) throw error;
  return data;
}

export function updateSubcategory(id, patch, expectedUpdatedAt) {
  return updateWithConcurrencyCheck("subcategories", id, patch, expectedUpdatedAt, "subcategory");
}

export async function deleteSubcategory(id) {
  const { error } = await supabase.from("subcategories").delete().eq("id", id);
  if (error) throw error;
}
