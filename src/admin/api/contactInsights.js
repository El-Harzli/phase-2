import { supabase } from "@/shared/api/supabaseClient";
import { runQueriesWithRetry } from "@/shared/lib/runQueriesWithRetry";
import { CONTACT_EVENT_TYPES } from "@/shared/config/contactEvents";

// Data side of the Overview's "Contact activity" section. No React in here —
// the component only renders what these functions return, and this file moves
// to Next.js as-is.

const toCount = (value) => Number(value) || 0;

// contact_insights() returns one JSON object with snake_case keys. This turns
// it into the shape the component uses, with every count coerced to a number
// and every list defaulted to [] so the UI never has to guard against missing
// pieces.
export function normalizeContactInsights(raw) {
  const source = raw ?? {};
  const byType = source.by_type ?? {};

  return {
    days: toCount(source.days),
    total: toCount(source.total),
    previousTotal: toCount(source.previous_total),
    byType: Object.fromEntries(CONTACT_EVENT_TYPES.map((type) => [type, toCount(byType[type])])),
    // One entry per day of the period, oldest first, zero-filled by the database.
    daily: (source.daily ?? []).map((row) => ({ day: String(row.day), count: toCount(row.count) })),
    // propertyId / agentId are null when the property or agent has since been
    // deleted (the events are kept), or — for agents — when the listing had
    // no agent assigned.
    topProperties: (source.top_properties ?? []).map((row) => ({
      propertyId: row.property_id ?? null,
      title: row.title ?? null,
      location: row.location ?? null,
      count: toCount(row.count),
    })),
    topAgents: (source.top_agents ?? []).map((row) => ({
      agentId: row.agent_id ?? null,
      name: row.name ?? null,
      count: toCount(row.count),
    })),
  };
}

// Reads the aggregates for the last `days` days. This is an automatic read
// (it runs when the Overview opens), so it goes through runQueriesWithRetry.
// Never throws: a failure comes back as { data: null, error } so the Overview
// can show a message instead of crashing.
export async function fetchContactInsights(days) {
  try {
    const [{ data, error }] = await runQueriesWithRetry([() => supabase.rpc("contact_insights", { p_days: days })]);
    if (error) return { data: null, error };
    return { data: normalizeContactInsights(data), error: null };
  } catch (error) {
    return { data: null, error };
  }
}
