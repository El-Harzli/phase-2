import { supabase } from "@/shared/api/supabaseClient";
import { runQueriesWithRetry } from "@/shared/lib/runQueriesWithRetry";
import { fetchAllRows, normalizeFocal, toQueryError } from "@/site/lib/queryHelpers";

// TEMP: this file only holds the full property load — every published property
// with all its photos and amenity ids — until the Home, Browse, property page
// and Favorites steps replace it with lighter requests. The catalogs and agents
// live in catalogs.js and agents.js, the settings in siteSettings.js.

// Every published property, newest first, each with all its photos (sorted) and
// the ids of its amenities, in one retried batch of three queries. Never throws:
// a failure comes back as { data: null, error } naming the query that failed.
export async function fetchRawProperties() {
  const labels = ["properties", "property_images", "property_amenities"];
  const results = await runQueriesWithRetry(
    [
      () =>
        fetchAllRows(
          () =>
            supabase
              .from("properties")
              .select("*", { count: "exact" })
              .eq("status", "published")
              .order("created_at", { ascending: false }),
          (query) => query.order("id"),
        ),
      () =>
        fetchAllRows(
          () => supabase.from("property_images").select("*", { count: "exact" }),
          (query) => query.order("property_id").order("sort_order").order("url"),
        ),
      () =>
        fetchAllRows(
          () => supabase.from("property_amenities").select("*", { count: "exact" }),
          (query) => query.order("property_id").order("amenity_id"),
        ),
    ],
    labels,
  );
  const [propertiesRes, imagesRes, propertyAmenitiesRes] = results;

  const failedIndex = results.findIndex((result) => result.error);
  if (failedIndex !== -1) {
    console.error(results[failedIndex].error);
    return { data: null, error: toQueryError(labels[failedIndex], results[failedIndex]) };
  }

  const imagesByProperty = {};
  for (const image of imagesRes.data) {
    if (!imagesByProperty[image.property_id]) imagesByProperty[image.property_id] = [];
    imagesByProperty[image.property_id].push(normalizeFocal(image));
  }

  const amenityIdsByProperty = {};
  for (const link of propertyAmenitiesRes.data) {
    if (!amenityIdsByProperty[link.property_id]) amenityIdsByProperty[link.property_id] = [];
    amenityIdsByProperty[link.property_id].push(link.amenity_id);
  }

  return {
    data: propertiesRes.data.map((property) => ({
      ...property,
      images: (imagesByProperty[property.id] ?? []).slice().sort((a, b) => a.sort_order - b.sort_order),
      amenityIds: amenityIdsByProperty[property.id] ?? [],
    })),
    error: null,
  };
}
