export function percentOf(part, total) {
  return total ? Math.round((part / total) * 100) : 0;
}

export function computeStats(properties) {
  const total = properties.length;
  const forRent = properties.filter((property) => property.listing_type === "rent").length;
  const forSale = properties.filter((property) => property.listing_type === "sale").length;
  const published = properties.filter((property) => property.status === "published").length;
  const draft = total - published;
  return { total, forRent, forSale, published, draft };
}

// Properties arrive newest first (and a new one is added at the front), so the
// first five are the most recent. This used to be `.slice(-5).reverse()`, which
// showed the five OLDEST listings instead.
export function getRecentProperties(properties) {
  return properties.slice(0, 5);
}

export function buildCategoryBreakdown(categories, properties) {
  return categories
    .map((category) => ({
      id: category.id,
      name: category.name,
      count: properties.filter((property) => property.category_id === category.id).length,
    }))
    .filter((category) => category.count > 0)
    .sort((a, b) => b.count - a.count);
}
