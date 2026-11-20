import { FALLBACK_IMG } from "@/site/lib/fallbackImage";

// The few fields a property CARD shows — title, price, location, beds, baths,
// area, garage, rent/sale, the popular badge, featured order, and the cover
// photo with its focus point — built from a `properties` row that carries its
// photos in an embedded `property_images` list. Only the cover is needed, so the
// request asks for just the first photo; if the list holds more than one anyway,
// the lowest sort_order wins. Same field names and same defaults as the
// full-property shape from buildProperties, so a card renders the same either way.
export function buildCardProperty(row) {
  const cover = [...(row.property_images ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0];

  return {
    id: row.id,
    title: row.title,
    location: row.location,
    price: Number(row.price),
    beds: Number(row.beds ?? 0),
    baths: Number(row.baths ?? 0),
    area: Number(row.area ?? 0),
    garage: Number(row.garage ?? 0),
    listingType: row.listing_type,
    popular: Boolean(row.popular),
    featuredOrder: row.featured_order ?? null,
    image: cover?.url ?? FALLBACK_IMG,
    imageFocal: { x: Number(cover?.focal_x ?? 0.5), y: Number(cover?.focal_y ?? 0.5) },
  };
}
