import { digitsOnly } from "@/shared/lib/phone";

// Prices must be whole numbers; coordinates are plain decimals. A browser
// <input type="number"> also accepts things like "1e23", so the value is
// checked here, not just while typing.
const WHOLE_NUMBER = /^\d+$/;
const DECIMAL_NUMBER = /^-?\d+(\.\d+)?$/;

export function settingsToFormValues(settings) {
  return {
    priceMin: settings.price_min.toString(),
    priceMax: settings.price_max.toString(),
    phoneNumber: settings.phone_number,
    phoneDisplay: settings.phone_display,
    agencyName: settings.agency_name,
    email: settings.email,
    instagramUrl: settings.instagram_url,
    instagramHandle: settings.instagram_handle,
    linkedinUrl: settings.linkedin_url,
    address: settings.address,
    officeLat: settings.office_lat.toString(),
    officeLng: settings.office_lng.toString(),
  };
}

export function validateSettingsForm(values) {
  const errors = {};
  const minValue = Number(values.priceMin);
  const maxValue = Number(values.priceMax);
  if (!WHOLE_NUMBER.test(values.priceMin)) errors.priceMin = "Enter a valid minimum.";
  if (!WHOLE_NUMBER.test(values.priceMax)) errors.priceMax = "Enter a valid maximum.";
  if (!errors.priceMin && !errors.priceMax && minValue >= maxValue) {
    errors.priceMax = "Maximum must be greater than minimum.";
  }
  if (digitsOnly(values.phoneNumber).length < 6) errors.phoneNumber = "Enter a valid phone number.";
  if (!values.phoneDisplay.trim()) errors.phoneDisplay = "Add a display format for the number.";
  if (!values.agencyName.trim()) errors.agencyName = "Add the agency name.";
  if (!values.email.trim() || !values.email.includes("@")) errors.email = "Enter a valid email address.";
  if (!values.instagramUrl.trim()) errors.instagramUrl = "Add an Instagram link.";
  if (!values.instagramHandle.trim()) errors.instagramHandle = "Add the displayed handle.";
  if (!values.address.trim()) errors.address = "Add an address.";
  const latValue = Number(values.officeLat);
  const lngValue = Number(values.officeLng);
  if (!DECIMAL_NUMBER.test(values.officeLat) || latValue < -90 || latValue > 90) {
    errors.officeLat = "Enter a valid latitude (-90 to 90).";
  }
  if (!DECIMAL_NUMBER.test(values.officeLng) || lngValue < -180 || lngValue > 180) {
    errors.officeLng = "Enter a valid longitude (-180 to 180).";
  }
  return errors;
}

export function buildSettingsPatch(values) {
  return {
    price_min: Number(values.priceMin),
    price_max: Number(values.priceMax),
    phone_number: digitsOnly(values.phoneNumber),
    phone_display: values.phoneDisplay.trim(),
    agency_name: values.agencyName.trim(),
    email: values.email.trim(),
    instagram_url: values.instagramUrl.trim(),
    instagram_handle: values.instagramHandle.trim(),
    linkedin_url: values.linkedinUrl.trim(),
    address: values.address.trim(),
    office_lat: Number(values.officeLat),
    office_lng: Number(values.officeLng),
  };
}
