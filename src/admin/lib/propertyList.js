// Joins each property to its category/subcategory/neighborhood/agent
// once, up front — every row needed this lookup anyway (for display,
// filtering, and now sorting by a joined field like "Neighborhood"), so
// this avoids repeating four `.find()` calls per row on every render.
export function enrichProperties(properties, { categories, subcategories, neighborhoods, agents }) {
  return properties.map((property) => ({
    property,
    category: categories.find((c) => c.id === property.category_id),
    subcategory: subcategories.find((s) => s.id === property.subcategory_id),
    neighborhood: neighborhoods.find((n) => n.id === property.neighborhood_id),
    agent: agents.find((a) => a.id === property.agent_id),
  }));
}

export function filterProperties(enrichedProperties, { activeTab, categoryFilter, statusFilter, search }) {
  const query = search.trim().toLowerCase();
  return enrichedProperties.filter(({ property }) => {
    if (activeTab !== "all" && property.listing_type !== activeTab) return false;
    if (categoryFilter !== "all" && property.category_id !== categoryFilter) return false;
    if (statusFilter !== "all" && property.status !== statusFilter) return false;
    if (query && !property.title.toLowerCase().includes(query) && !property.location.toLowerCase().includes(query)) {
      return false;
    }
    return true;
  });
}

function getSortValue(row, key) {
  switch (key) {
    case "title":
      return row.property.title?.toLowerCase() ?? "";
    case "category":
      return row.category?.name?.toLowerCase() ?? "";
    case "neighborhood":
      return row.neighborhood?.name?.toLowerCase() ?? "";
    case "type":
      return row.property.listing_type ?? "";
    case "price":
      return Number(row.property.price) || 0;
    case "beds":
      return Number(row.property.beds) || 0;
    case "baths":
      return Number(row.property.baths) || 0;
    case "area":
      return Number(row.property.area) || 0;
    case "agent":
      return row.agent?.name?.toLowerCase() ?? "";
    case "status":
      return row.property.status ?? "";
    case "featured":
      // Unfeatured (null) always sorts after every featured property,
      // regardless of direction — "not featured" isn't a low or high
      // value, it's the absence of one.
      return row.property.featured_order ?? Number.POSITIVE_INFINITY;
    case "created_at":
    default:
      return row.property.created_at ?? "";
  }
}

export function sortProperties(filteredProperties, sortKey, sortDir) {
  const sorted = [...filteredProperties].sort((a, b) => {
    const va = getSortValue(a, sortKey);
    const vb = getSortValue(b, sortKey);
    if (va < vb) return -1;
    if (va > vb) return 1;
    return 0;
  });
  if (sortDir === "desc") sorted.reverse();
  return sorted;
}
