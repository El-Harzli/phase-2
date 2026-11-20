import { supabase } from "@/shared/api/supabaseClient";
import { CONTACT_EVENT_TYPES } from "@/shared/config/contactEvents";

// Anonymous "contact agent" click tracking. One row per click in
// contact_events: which property, which agent, which button, and when
// (the database fills in the time). No IP, no cookies, no personal data.
//
// Fire-and-forget by design: trackContactEvent never returns anything to await, never
// throws, and a failed or slow request can't hold up or break the click it's
// attached to — the visitor's call / WhatsApp link opens regardless.
//
// Framework-agnostic on purpose (no React, no router): it only needs the
// Supabase client, so it moves to Next.js as-is.

const VALID_EVENT_TYPES = new Set(CONTACT_EVENT_TYPES);

// The same button on the same property is counted once per window, so a
// double-tap or an impatient click doesn't count twice. Kept in memory only —
// nothing is written to the visitor's device — so a page refresh resets it.
const DEDUPE_WINDOW_MS = 30 * 1000;
const MAX_REMEMBERED = 100;
const lastSentAt = new Map();

function isDuplicate(key, now) {
  const previous = lastSentAt.get(key);
  if (previous !== undefined && now - previous < DEDUPE_WINDOW_MS) return true;

  // delete + set moves the key to the end, so the oldest entry is always first
  lastSentAt.delete(key);
  lastSentAt.set(key, now);
  if (lastSentAt.size > MAX_REMEMBERED) {
    lastSentAt.delete(lastSentAt.keys().next().value);
  }
  return false;
}

// `agentId` may be null: a listing whose agent couldn't be loaded uses the
// site's fallback agent, which has no id.
export function trackContactEvent({ propertyId, agentId = null, eventType }) {
  try {
    if (!propertyId || !VALID_EVENT_TYPES.has(eventType)) return;
    if (isDuplicate(`${propertyId}:${eventType}`, Date.now())) return;

    // No .select() on purpose: visitors may insert but not read, so asking
    // for the row back would fail. The second argument of .then() catches
    // both a Supabase error and a network failure; neither is shown to the
    // visitor.
    supabase
      .from("contact_events")
      .insert({ property_id: propertyId, agent_id: agentId, event_type: eventType })
      .then(
        ({ error }) => {
          if (error) console.warn("Contact event not recorded:", error.message);
        },
        (networkError) => {
          console.warn("Contact event not recorded:", networkError);
        },
      );
  } catch (error) {
    console.warn("Contact event not recorded:", error);
  }
}
