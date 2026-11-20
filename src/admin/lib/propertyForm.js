// Prices and counts are whole numbers; coordinates are plain decimals.
//
// The number fields are text boxes on purpose (see PropertyForm): a browser
// <input type="number"> reports anything it can't read as a number — a pasted
// "5e" or "+5" — as an empty value, so a typo in an optional field looked
// "not filled in" and was silently saved as 0 or empty. A text box gives us
// exactly what's on screen to check. Surrounding spaces are ignored.
const WHOLE_NUMBER = /^\d+$/;
const DECIMAL_NUMBER = /^-?\d+(\.\d+)?$/;

export function propertyToFormValues(property) {
  return {
    title: property?.title ?? "",
    description: property?.description ?? "",
    listingType: property?.listing_type ?? "sale",
    status: property?.status ?? "draft",
    categoryId: property?.category_id ?? "",
    subcategoryId: property?.subcategory_id ?? "",
    neighborhoodId: property?.neighborhood_id ?? "",
    agentId: property?.agent_id ?? "",
    price: property?.price?.toString() ?? "",
    beds: property?.beds?.toString() ?? "",
    baths: property?.baths?.toString() ?? "",
    area: property?.area?.toString() ?? "",
    garage: property?.garage?.toString() ?? "",
    yearBuilt: property?.year_built?.toString() ?? "",
    location: property?.location ?? "",
    lat: property?.lat?.toString() ?? "",
    lng: property?.lng?.toString() ?? "",
    popular: property?.popular ?? false,
  };
}

export function validatePropertyForm(values) {
  const errors = {};
  const price = values.price.trim();
  const beds = values.beds.trim();
  const baths = values.baths.trim();
  const area = values.area.trim();
  const garage = values.garage.trim();
  const yearBuilt = values.yearBuilt.trim();
  const lat = values.lat.trim();
  const lng = values.lng.trim();

  if (!values.title.trim()) errors.title = "Give this property a title.";
  if (!values.categoryId) errors.category = "Choose a category.";
  if (!values.neighborhoodId) errors.neighborhood = "Choose a neighborhood.";
  if (!values.agentId) errors.agent = "Assign an agent.";
  if (!values.location.trim()) errors.location = "Add a location.";
  if (!WHOLE_NUMBER.test(price) || Number(price) <= 0) errors.price = "Enter a valid price.";

  const wholeNumberMessage = "Enter a whole number, 0 or more.";
  if (beds !== "" && !WHOLE_NUMBER.test(beds)) errors.beds = wholeNumberMessage;
  if (baths !== "" && !WHOLE_NUMBER.test(baths)) errors.baths = wholeNumberMessage;
  if (area !== "" && !WHOLE_NUMBER.test(area)) errors.area = wholeNumberMessage;
  if (garage !== "" && !WHOLE_NUMBER.test(garage)) errors.garage = wholeNumberMessage;

  if (yearBuilt !== "" && (!WHOLE_NUMBER.test(yearBuilt) || Number(yearBuilt) < 1900 || Number(yearBuilt) > 2100)) {
    errors.yearBuilt = "Enter a year between 1900 and 2100.";
  }

  if (lat !== "" && (!DECIMAL_NUMBER.test(lat) || Number(lat) < -90 || Number(lat) > 90)) {
    errors.lat = "Enter a valid latitude (-90 to 90).";
  }
  if (lng !== "" && (!DECIMAL_NUMBER.test(lng) || Number(lng) < -180 || Number(lng) > 180)) {
    errors.lng = "Enter a valid longitude (-180 to 180).";
  }
  return errors;
}

export function buildPropertyPayload(values) {
  const yearBuilt = values.yearBuilt.trim();
  const lat = values.lat.trim();
  const lng = values.lng.trim();

  return {
    title: values.title.trim(),
    description: values.description.trim(),
    listing_type: values.listingType,
    status: values.status,
    category_id: values.categoryId,
    subcategory_id: values.subcategoryId || null,
    neighborhood_id: values.neighborhoodId,
    agent_id: values.agentId,
    price: Number(values.price.trim()),
    beds: Number(values.beds.trim()) || 0,
    baths: Number(values.baths.trim()) || 0,
    area: Number(values.area.trim()) || 0,
    garage: Number(values.garage.trim()) || 0,
    year_built: yearBuilt ? Number(yearBuilt) : null,
    location: values.location.trim(),
    lat: lat ? Number(lat) : null,
    lng: lng ? Number(lng) : null,
    popular: values.popular,
  };
}
