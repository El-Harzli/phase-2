export function formatPrice(value, listingType) {
  const formatted = new Intl.NumberFormat("en-US").format(value ?? 0);
  return listingType === "rent" ? `${formatted} MAD/mo` : `${formatted} MAD`;
}
