import { useCallback, useEffect, useSyncExternalStore } from "react";
import { getSnapshot, loadResource, subscribe } from "@/site/lib/requestCache";

// Reads one resource from the shared request cache (see lib/requestCache.js),
// starting its request when it isn't there yet. `loader` is an api/ function
// resolving with { data, error } — keep it a stable reference (a module-level
// function), not one created during render.
//
//  - loading:    no data yet (not asked for, or the first request is under way)
//  - refreshing: data is on screen and is being renewed quietly in the background
//  - reload():   asks again right now, ignoring how fresh the data is; old data
//                stays on screen while it runs
//  - enabled:    false = read only, don't start the request (used while what the
//                request needs isn't known yet, or isn't valid, so asking would
//                only fail)
export default function useCachedRequest(key, loader, { ttlMs = Infinity, enabled = true } = {}) {
  const subscribeToKey = useCallback((listener) => subscribe(key, listener), [key]);
  const readSnapshot = useCallback(() => getSnapshot(key), [key]);
  const snapshot = useSyncExternalStore(subscribeToKey, readSnapshot);

  // The request itself is plain module state, so starting it here sets no React
  // state in the effect; the component re-renders when the cache notifies it.
  useEffect(() => {
    if (enabled) loadResource(key, loader, { ttlMs });
  }, [key, loader, ttlMs, enabled]);

  const reload = useCallback(() => loadResource(key, loader, { ttlMs, force: true }), [key, loader, ttlMs]);

  return {
    data: snapshot.data,
    error: snapshot.error,
    status: snapshot.status,
    loading: snapshot.status === "idle" || snapshot.status === "loading",
    refreshing: snapshot.refreshing,
    reload,
  };
}
