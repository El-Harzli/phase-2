import { buildCardProperty } from "@/site/lib/buildCardProperty";

// A property as the Browse page needs it: everything a card shows (see
// buildCardProperty) plus what filtering, sorting and the map use — category,
// subcategory, neighborhood, amenity ids, position and creation date (what
// "Newest" sorts by). No description, gallery or agent: nothing on Browse shows them. Built
// from a `properties` row with an embedded cover photo (`property_images`) and
// embedded amenity links (`property_amenities`); same field names and defaults
// as the full-property shape from buildProperties.
export function buildBrowseProperty(row) {
  return {
    ...buildCardProperty(row),
    categoryId: row.category_id ?? null,
    subcategoryId: row.subcategory_id ?? null,
    neighborhoodId: row.neighborhood_id ?? null,
    amenityIds: (row.property_amenities ?? []).map((link) => link.amenity_id),
    // Lat/lng are optional on the property form, so these can genuinely be null —
    // PropertyMap filters those out before it tries to plot them.
    lat: row.lat === null || row.lat === undefined ? null : Number(row.lat),
    lng: row.lng === null || row.lng === undefined ? null : Number(row.lng),
    createdAt: row.created_at,
  };
}
