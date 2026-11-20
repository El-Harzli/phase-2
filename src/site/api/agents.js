import { supabase } from "@/shared/api/supabaseClient";
import { runQueriesWithRetry } from "@/shared/lib/runQueriesWithRetry";
import { toQueryError } from "@/site/lib/queryHelpers";

// Every agent. Never throws: resolves with { data, error }, and a failure
// carries `queryName` and `status` (see lib/queryHelpers.js).
export async function fetchAgents() {
  const [result] = await runQueriesWithRetry([() => supabase.from("agents").select("*")], ["agents"]);
  if (result.error) {
    console.error(result.error);
    return { data: null, error: toQueryError("agents", result) };
  }
  return { data: result.data, error: null };
}
