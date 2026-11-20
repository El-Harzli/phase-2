import { getIconByKey } from "@/shared/config/curatedIcons";
import { FALLBACK_AGENT } from "@/site/lib/fallbackData";
import { FALLBACK_IMG } from "@/site/lib/fallbackImage";

// Shapes every row into exactly what PropertyCard / PropertyDetail /
// PropertyMap / Filters already expect from the old mock data, so those
// components don't need to know Supabase exists.
export function buildProperties({ rawProperties, categories, subcategories, neighborhoods, agents, amenities }) {
  const categoriesById = new Map(categories.map((c) => [c.id, c]));
  const subcategoriesById = new Map(subcategories.map((s) => [s.id, s]));
  const amenitiesById = new Map(amenities.map((a) => [a.id, a]));
  const agentsById = new Map(agents.map((a) => [a.id, a]));
  const neighborhoodsById = new Map(neighborhoods.map((n) => [n.id, n]));

  return rawProperties.map((property) => {
    const category = categoriesById.get(property.category_id);
    const subcategory = subcategoriesById.get(property.subcategory_id);
    const neighborhood = neighborhoodsById.get(property.neighborhood_id);
    const agent = agentsById.get(property.agent_id) ?? FALLBACK_AGENT;
    const images = property.images ?? [];
    const resolvedAmenities = (property.amenityIds ?? [])
      .map((id) => amenitiesById.get(id))
      .filter(Boolean)
      .map((a) => ({ id: a.id, name: a.name, icon: getIconByKey(a.icon) }));

    return {
      id: property.id,
      title: property.title,
      description: property.description ?? "",
      location: property.location,
      // Numeric Postgres columns come back as strings over PostgREST —
      // coerce them the same way the dashboard's PropertiesContext does.
      price: Number(property.price),
      beds: Number(property.beds ?? 0),
      baths: Number(property.baths ?? 0),
      area: Number(property.area ?? 0),
      garage: Number(property.garage ?? 0),
      yearBuilt: property.year_built ? Number(property.year_built) : null,
      listingType: property.listing_type,
      popular: Boolean(property.popular),
      type: category?.name ?? "Property",
      categoryId: property.category_id ?? null,
      subcategoryId: property.subcategory_id ?? null,
      subcategory: subcategory?.name ?? null,
      neighborhoodId: property.neighborhood_id ?? null,
      neighborhood: neighborhood?.name ?? null,
      featuredOrder: property.featured_order ?? null,
      image: images[0]?.url ?? FALLBACK_IMG,
      // Focal point for the cover photo (used wherever `image` is shown
      // cropped, e.g. listing cards) and one per remaining gallery photo
      // (used by the detail page's thumbnail strip) — falls back to
      // dead-center (0.5/0.5) for any image nobody's repositioned.
      imageFocal: { x: images[0]?.focal_x ?? 0.5, y: images[0]?.focal_y ?? 0.5 },
      gallery: images.slice(1).map((img) => img.url),
      galleryFocal: images.slice(1).map((img) => ({ x: img.focal_x ?? 0.5, y: img.focal_y ?? 0.5 })),
      amenityIds: property.amenityIds ?? [],
      amenities: resolvedAmenities,
      agent: {
        id: agent.id,
        name: agent.name,
        rating: Number(agent.rating ?? 0),
        reviews: agent.reviews_count ?? agent.reviews ?? 0,
        avatar: agent.avatar_url ?? agent.avatar ?? FALLBACK_AGENT.avatar,
        phone: agent.phone ?? "",
      },
      // Lat/lng are optional on the property form (only `location` text
      // is required), so these can genuinely be null — PropertyMap needs
      // to filter these out before it tries to plot them.
      lat: property.lat === null || property.lat === undefined ? null : Number(property.lat),
      lng: property.lng === null || property.lng === undefined ? null : Number(property.lng),
    };
  });
}
