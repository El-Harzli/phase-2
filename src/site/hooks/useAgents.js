import { fetchAgents } from "@/site/api/agents";
import useCachedRequest from "@/site/hooks/useCachedRequest";

// Agents are a small table that an admin edits rarely: kept for 30 minutes, then
// renewed quietly the next time something asks. Shares its request with
// everything else that asks for agents (same cache key).
const AGENTS_KEY = "agents";
const AGENTS_TTL_MS = 30 * 60 * 1000;
const NONE = [];

// Every agent. On failure the list is empty and `error` is set.
export default function useAgents() {
  const { data, error, loading } = useCachedRequest(AGENTS_KEY, fetchAgents, { ttlMs: AGENTS_TTL_MS });
  return { agents: error ? NONE : (data ?? NONE), loading, error };
}
