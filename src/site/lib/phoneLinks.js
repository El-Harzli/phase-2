import { digitsOnly } from "@/shared/lib/phone";

// wa.me/<number> and tel:+<number> both need digits only, but the number
// comes from an admin-editable field — a saved "+212 6 12 34 56 78" would
// produce tel:++212… and wa.me/+212…, both broken. Same normalization
// PropertyConcierge uses.
// A leading "00" (the international prefix some people type instead of "+")
// is dropped too, otherwise wa.me/00212… is a broken link as well.
export function toDialDigits(phone) {
  return digitsOnly(String(phone ?? "")).replace(/^00/, "");
}

export function buildCallUrl(phone) {
  return `tel:+${toDialDigits(phone)}`;
}

export function buildWhatsAppUrl(phone) {
  return `https://wa.me/${toDialDigits(phone)}`;
}
