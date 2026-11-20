// A small in-memory memory of the property CARDS the site has already loaded —
// from Browse, the featured list and the similar lists — kept by id. When a
// property is opened (the overlay), what its card already showed can be put on
// screen at once while the rest of the property is still on its way, instead of
// a blank spinner.
//
// Cards of different richness for the same property are merged (a Browse card
// knows its position and amenity ids, a featured card doesn't), so the fullest
// picture wins. Nothing here is reactive and nothing is ever shown for long: the
// full property replaces it as soon as it arrives.
//
// No React in this file, and no window/document/localStorage (see CONVENTIONS).

const previews = new Map();

export function rememberPreviews(cards) {
  for (const card of cards) previews.set(card.id, { ...(previews.get(card.id) ?? {}), ...card });
}

export function getPreview(id) {
  return previews.get(id) ?? null;
}

// Forgets everything. Called when the public site is left (see SiteApp), together
// with the request cache, so coming back never starts from old cards.
export function clearPreviews() {
  previews.clear();
}

// Dresses a card up as a property for the detail view: the fields the card has,
// plus empty stand-ins for what only the full property knows (gallery, description,
// amenities, type, agent) so every section can render without breaking. The detail
// view is told it is incomplete (`detailsStatus`) and shows placeholders for those
// parts instead.
export function previewToProperty(preview) {
  return {
    ...preview,
    type: "",
    description: "",
    gallery: [],
    galleryFocal: [],
    amenities: [],
    amenityIds: preview.amenityIds ?? [],
    yearBuilt: preview.yearBuilt ?? null,
  };
}
