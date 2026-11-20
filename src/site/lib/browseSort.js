export const SORT_OPTIONS = [
  { id: "popular", label: "Most popular" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
  { id: "newest", label: "Newest" },
];

export function sortProperties(properties, sortId) {
  const result = [...properties];

  switch (sortId) {
    case "price-asc":
      result.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      result.sort((a, b) => b.price - a.price);
      break;
    case "newest":
      // The newest LISTING first — when it was added to the site, not when the
      // building was built.
      result.sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0));
      break;
    case "popular":
    default:
      result.sort((a, b) => Number(b.popular) - Number(a.popular));
      break;
  }

  return result;
}
