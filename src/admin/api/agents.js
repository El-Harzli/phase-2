import { supabase } from "@/shared/api/supabaseClient";
import { updateWithConcurrencyCheck } from "@/admin/api/updateWithConcurrencyCheck";

// Postgres `numeric` columns are serialized as strings by PostgREST to avoid
// float precision loss — `rating` needs to be coerced back to a number here
// so the rest of the app (e.g. `agent.rating.toFixed(1)`) can keep treating
// it as one.
export function normalizeAgent(agent) {
  return { ...agent, rating: Number(agent.rating) };
}

// Returned unawaited, so it can be passed to runQueriesWithRetry as a thunk.
export function fetchAgents() {
  return supabase.from("agents").select("*").order("name", { ascending: true });
}

export async function insertAgent({ name, phone, avatar_url }) {
  const { data, error } = await supabase
    .from("agents")
    .insert({ name, phone, avatar_url: avatar_url || null, rating: 0, reviews_count: 0 })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export function updateAgent(id, patch, expectedUpdatedAt) {
  return updateWithConcurrencyCheck("agents", id, patch, expectedUpdatedAt, "agent");
}

export async function deleteAgent(id) {
  const { error } = await supabase.from("agents").delete().eq("id", id);
  if (error) throw error;
}
