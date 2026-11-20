import { toDialDigits, buildWhatsAppUrl, buildCallUrl } from "@/site/lib/phoneLinks";

// Used only as a fallback — if a listing's agent record has no phone number
// on file (or the agent lookup failed entirely, see FALLBACK_AGENT in
// site/lib/fallbackData.js), routing to the general agency line beats sending the
// lead to a broken wa.me link with no number at all.
//
// The agency number is passed in by the caller (usePropertyContact), which
// reads the real value from Settings (admin dashboard) via useSiteSettings() —
// this file stays a plain function with no context/hook dependency of its own.

// `phone` should be the specific listing's agent phone (property.agent.phone)
// so the lead reaches the person actually responsible for that property,
// not a generic inbox. `fallbackPhone` is the site-wide agency number, used
// only when the agent has none on file.
function resolvePhone(phone, fallbackPhone) {
  return toDialDigits(phone) ? phone : fallbackPhone;
}

function buildWhatsAppUrlWithMessage(message, phone, fallbackPhone) {
  return `${buildWhatsAppUrl(resolvePhone(phone, fallbackPhone))}?text=${encodeURIComponent(message)}`;
}

export function buildPropertyWhatsAppUrl(propertyTitle, phone, fallbackPhone) {
  return buildWhatsAppUrlWithMessage(
    `I am interested in '${propertyTitle}' and want to check availability`,
    phone,
    fallbackPhone,
  );
}

// Same number-picking rules as above, with a message that asks for a viewing
// rather than for availability — there's no booking backend, so "request a
// private tour" opens a WhatsApp chat with the request already written.
export function buildTourRequestUrl(propertyTitle, phone, fallbackPhone) {
  return buildWhatsAppUrlWithMessage(
    `I'd like to schedule a private viewing of '${propertyTitle}'. Which days and times are available?`,
    phone,
    fallbackPhone,
  );
}

// A plain phone call link. Numbers are stored with their country code (the
// same assumption the wa.me links above already rely on), so "tel:+" plus the
// digits dials correctly. Returns undefined when there's no number at all.
export function buildAgentCallUrl(phone, fallbackPhone) {
  const resolved = resolvePhone(phone, fallbackPhone);
  return toDialDigits(resolved) ? buildCallUrl(resolved) : undefined;
}
