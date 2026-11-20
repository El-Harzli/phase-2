// Only locally-generated object URLs need revoking — remote URLs (seed
// agents, or eventually real Storage URLs) must never be passed to
// revokeObjectURL.
//
// (Same note, from ImageGallery's own copy of this check:) Only
// locally-generated object URLs need revoking — remote URLs (from editing
// an existing property, or real Storage URLs) must never be passed to
// revokeObjectURL.
export function isLocalUrl(url) {
  return typeof url === "string" && url.startsWith("blob:");
}
