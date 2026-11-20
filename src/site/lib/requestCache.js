// A shared, in-memory cache of requests for the public site. It lives outside
// React, so any number of components can ask for the same data at the same
// time and share ONE request, and data loaded by one page is still there when
// another page needs it.
//
// Each resource is saved under a key and is always in one of four states:
//   idle    — never asked for
//   loading — the first request is under way (no data yet)
//   ready   — has data (possibly old, possibly being refreshed quietly)
//   error   — the first request failed and there is no data
//
// `ttlMs` is how long data counts as fresh. There is no timer anywhere: nothing
// refreshes by itself. The age is only checked when something asks for the
// resource. Fresh data is reused without a request. Old data is handed over
// immediately and a quiet refresh runs in the background, so nobody sees a
// spinner for data they already have; the result replaces it when it arrives.
// If that refresh fails, the old data stays. The default is Infinity: never old.
//
// A request that failed (and left no data) is not asked again by every component
// that happens to mount in the next few seconds — ERROR_RETRY_MS — or a failure
// that doesn't block its page would loop: the failure shows the page, the page's
// children ask again, the new request flips everything back to "loading", the
// children unmount, it fails again, and so on, hammering the API. Asking again
// later (the next page visit) retries; `reload()` / `force` retries at once.
//
// Loaders follow the api/ convention: they resolve with { data, error } and
// never throw (a thrown error is turned into an error result here as well).
//
// No React in this file, and no window/document/localStorage (see CONVENTIONS).

const ERROR_RETRY_MS = 10 * 1000;

const IDLE_SNAPSHOT = Object.freeze({
  status: "idle",
  data: null,
  error: null,
  fetchedAt: 0,
  failedAt: 0,
  refreshing: false,
});

// key -> { snapshot, promise }. `snapshot` is replaced, never changed, so
// useSyncExternalStore can tell it changed by identity; `promise` is the
// request under way for that key, if any.
const entries = new Map();
const listeners = new Map();

function notify(key) {
  for (const listener of listeners.get(key) ?? []) listener();
}

function setEntry(key, snapshot, promise = null) {
  entries.set(key, { snapshot, promise });
  notify(key);
}

export function getSnapshot(key) {
  return entries.get(key)?.snapshot ?? IDLE_SNAPSHOT;
}

export function subscribe(key, listener) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key).add(listener);
  return () => {
    listeners.get(key)?.delete(listener);
  };
}

async function runLoader(loader) {
  try {
    return await loader();
  } catch (error) {
    return { data: null, error };
  }
}

// Makes sure `key` has up-to-date data, and returns a promise that settles when
// whatever request that needs is done (already resolved if none is needed).
//  - A request already under way is joined, never duplicated.
//  - Fresh data is reused (unless `force`).
//  - Old data (or `force`) is kept on screen while it is refreshed quietly.
//  - With no data at all, the status becomes "loading" until the request ends.
export function loadResource(key, loader, { ttlMs = Infinity, force = false } = {}) {
  const entry = entries.get(key);
  if (entry?.promise) return entry.promise;

  const snapshot = entry?.snapshot ?? IDLE_SNAPSHOT;
  const hasData = snapshot.status === "ready";
  if (hasData && !force && Date.now() - snapshot.fetchedAt < ttlMs) return Promise.resolve();
  if (snapshot.status === "error" && !force && Date.now() - snapshot.failedAt < ERROR_RETRY_MS) {
    return Promise.resolve();
  }

  const promise = runLoader(loader).then((result) => {
    if (result.error) {
      if (hasData) {
        // A failed quiet refresh must never take away data that was fine.
        console.warn(`[requestCache] refreshing "${key}" failed, keeping the data it already had:`, result.error);
        setEntry(key, { ...snapshot, refreshing: false });
      } else {
        setEntry(key, { ...IDLE_SNAPSHOT, status: "error", error: result.error, failedAt: Date.now() });
      }
      return;
    }
    setEntry(key, { status: "ready", data: result.data, error: null, fetchedAt: Date.now(), refreshing: false });
  });

  setEntry(key, hasData ? { ...snapshot, refreshing: true } : { ...IDLE_SNAPSHOT, status: "loading" }, promise);
  return promise;
}

// Forgets everything that has finished loading, so the next ask loads it again.
// Requests under way are left alone: they were started after the site opened, so
// what they bring back is fresh anyway, and dropping them would send the same
// request twice. Called when the public site is left (e.g. for /admin), so that
// coming back shows fresh data, the way a remount of the old provider did.
export function clearRequestCache() {
  for (const [key, entry] of entries) {
    if (entry.promise) continue;
    entries.delete(key);
    notify(key);
  }
}
