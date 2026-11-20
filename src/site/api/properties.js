import { supabase } from "@/shared/api/supabaseClient";
import { runQueriesWithRetry } from "@/shared/lib/runQueriesWithRetry";
import { buildBrowseProperty } from "@/site/lib/buildBrowseProperty";
import { buildCardProperty } from "@/site/lib/buildCardProperty";
import { rememberPreviews } from "@/site/lib/propertyPreviews";
import { fetchAllRows, isUuid, normalizeFocal, toQueryError } from "@/site/lib/queryHelpers";

// Property requests for the public site. Like every api/ function they never
// throw and resolve with { data, error }; a failure carries `queryName` and
// `status` (see lib/queryHelpers.js) and is logged here. The three that return
// cards also remember them (lib/propertyPreviews.js), so opening one of those
// properties can show its card at once.

// The columns a property card shows, plus only the cover photo (the request also
// asks for just the first photo per property, in order). Shared by every request
// that returns cards.
const CARD_SELECT =
  "id, title, location, price, beds, baths, area, garage, listing_type, popular, featured_order, property_images(url, focal_x, focal_y, sort_order)";

function toCardProperty(row) {
  return buildCardProperty({ ...row, property_images: row.property_images?.map(normalizeFocal) });
}

// What the Browse page needs per property: the card columns plus the ones its
// filters, sorting and map use — and the cover photo and the amenity ids,
// embedded. No description, no agent.
const BROWSE_SELECT =
  "id, title, location, price, beds, baths, area, garage, listing_type, popular, category_id, subcategory_id, neighborhood_id, lat, lng, created_at, property_images(url, focal_x, focal_y, sort_order), property_amenities(amenity_id)";

// One published property, with everything its page shows — its agent, its
// category (the name is the "type"), ALL its photos in order, and the ids of its
// amenities — in a single request, using the foreign keys between the tables.
// Nothing is asked for about its neighborhood or subcategory: no component of the
// property page shows them.
//
// `data` is null (and `error` null too) when there is no such published property
// — deleted, unpublished, or never existed — which is NOT a failure. Otherwise
// `data` has the shape buildProperties takes as a raw property (`images` sorted
// with numeric focal points, `amenityIds`), plus the embedded `category` and
// `agent` objects (or null).
export async function fetchPropertyById(id) {
  const [result] = await runQueriesWithRetry(
    [
      () =>
        supabase
          .from("properties")
          .select(
            "*, category:categories(id, name), agent:agents(*), property_images(*), property_amenities(amenity_id)",
          )
          .eq("id", id)
          .eq("status", "published")
          .order("sort_order", { referencedTable: "property_images" })
          .maybeSingle(),
    ],
    ["property"],
  );
  if (result.error) {
    console.error(result.error);
    return { data: null, error: toQueryError("property", result) };
  }
  if (!result.data) return { data: null, error: null };

  const { property_images: images, property_amenities: amenityLinks, ...property } = result.data;
  return {
    data: {
      ...property,
      images: (images ?? []).map(normalizeFocal).sort((a, b) => a.sort_order - b.sort_order),
      amenityIds: (amenityLinks ?? []).map((link) => link.amenity_id),
    },
    error: null,
  };
}

// Up to three other published listings to suggest under a property: the same
// category and the same rent/sale type, newest first, never the property itself.
// A property without a category is grouped with the others without one. Each comes
// back in the card shape (see lib/buildCardProperty.js), with only its cover photo.
export async function fetchSimilarProperties({ categoryId, listingType, excludeId }) {
  const [result] = await runQueriesWithRetry(
    [
      () => {
        const query = supabase
          .from("properties")
          .select(CARD_SELECT)
          .eq("status", "published")
          .eq("listing_type", listingType)
          .neq("id", excludeId)
          .order("created_at", { ascending: false })
          .order("id")
          .limit(3)
          .order("sort_order", { referencedTable: "property_images" })
          .limit(1, { referencedTable: "property_images" });
        return categoryId ? query.eq("category_id", categoryId) : query.is("category_id", null);
      },
    ],
    ["similar_properties"],
  );
  if (result.error) {
    console.error(result.error);
    return { data: null, error: toQueryError("similar_properties", result) };
  }
  const cards = result.data.map(toCardProperty);
  rememberPreviews(cards);
  return { data: cards, error: null };
}

// The properties the admin chose to show on Home (Dashboard → Featured): published
// ones with a featured_order, in that order, for BOTH rent and sale so the
// For Rent / For Sale tabs can switch without another request. Each comes back in
// the card shape with only its cover photo. Read in pages, so no number of
// featured listings is ever cut off at the API's 1000-row limit.
export async function fetchFeaturedProperties() {
  const [result] = await runQueriesWithRetry(
    [
      () =>
        fetchAllRows(
          () =>
            supabase
              .from("properties")
              .select(CARD_SELECT, { count: "exact" })
              .eq("status", "published")
              .not("featured_order", "is", null)
              .order("featured_order", { ascending: true })
              .order("sort_order", { referencedTable: "property_images" })
              .limit(1, { referencedTable: "property_images" }),
          (query) => query.order("id"),
        ),
    ],
    ["featured_properties"],
  );
  if (result.error) {
    console.error(result.error);
    return { data: null, error: toQueryError("featured_properties", result) };
  }
  const cards = result.data.map(toCardProperty);
  rememberPreviews(cards);
  return { data: cards, error: null };
}

// Every published property, rent AND sale together, for the Browse page: light
// (see BROWSE_SELECT), newest first — the order the "Popular" sort relies on for
// ties — each with only its cover photo. Switching between rent and sale then
// needs no request. Read in pages, so no catalog size is cut off at the API's
// 1000-row limit.
export async function fetchBrowseProperties() {
  const [result] = await runQueriesWithRetry(
    [
      () =>
        fetchAllRows(
          () =>
            supabase
              .from("properties")
              .select(BROWSE_SELECT, { count: "exact" })
              .eq("status", "published")
              .order("created_at", { ascending: false })
              .order("sort_order", { referencedTable: "property_images" })
              .limit(1, { referencedTable: "property_images" }),
          (query) => query.order("id"),
        ),
    ],
    ["browse_properties"],
  );
  if (result.error) {
    console.error(result.error);
    return { data: null, error: toQueryError("browse_properties", result) };
  }
  const cards = result.data.map((row) =>
    buildBrowseProperty({ ...row, property_images: row.property_images?.map(normalizeFocal) }),
  );
  rememberPreviews(cards);
  return { data: cards, error: null };
}

// The card columns plus the creation date, which the favorites list is sorted by.
const FAVORITES_SELECT =
  "id, title, location, price, beds, baths, area, garage, listing_type, popular, featured_order, created_at, property_images(url, focal_x, focal_y, sort_order)";

// Only the published properties among `ids` — the ones a visitor saved as
// favorites — in card shape with their cover photo, newest first, each with its
// `createdAt`. An id that isn't a property (a saved listing since deleted or
// unpublished, or junk in the browser's storage) simply isn't in the result.
// Callers pass at most a few dozen ids at a time (useFavoriteProperties sends 50);
// ids that aren't UUIDs are dropped here as well, because one of them would make
// the whole request fail with a 400, and with nothing left to ask there is no
// request at all.
export async function fetchPropertiesByIds(ids) {
  const validIds = [...new Set(ids)].filter(isUuid);
  if (validIds.length === 0) return { data: [], error: null };

  const [result] = await runQueriesWithRetry(
    [
      () =>
        supabase
          .from("properties")
          .select(FAVORITES_SELECT)
          .in("id", validIds)
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .order("sort_order", { referencedTable: "property_images" })
          .limit(1, { referencedTable: "property_images" }),
    ],
    ["favorite_properties"],
  );
  if (result.error) {
    console.error(result.error);
    return { data: null, error: toQueryError("favorite_properties", result) };
  }
  const cards = result.data.map((row) => ({ ...toCardProperty(row), createdAt: row.created_at }));
  rememberPreviews(cards);
  return { data: cards, error: null };
}
