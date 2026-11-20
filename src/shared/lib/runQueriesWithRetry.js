function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const MAX_FETCH_ATTEMPTS = 4;
const RETRY_DELAYS_MS = [600, 1200, 2400]; // pause before attempt 2, 3, then 4

// Supabase queries resolve with { data, error } rather than throwing, so a
// failure has to be checked on the result, not caught. Several queries
// often fire in parallel on a single page/section load — with that many
// round trips, a transient blip (a brief network drop, a cold-start
// hiccup) hitting at least one of them is a real, expected occurrence, not
// a sign anything is actually broken. Without a retry, any single query
// failing took down the whole load and forced a manual "reload" click.
//
// This retries the *whole* batch together (rather than tracking which one
// query failed) — these are small, fast reads, so redoing all of them
// costs nothing meaningful — with a short pause between attempts, before
// ever surfacing an error.
//
// Only *transient* failures are retried (network drop, timeout, rate limit,
// 5xx, and 401 — see isTransientFailure). A permanent one — a missing row for
// .single() (406), an RLS denial (403), a bad column (400) — will fail
// identically every time, so retrying it only made the site wait before
// showing the exact same error (or, for a non-critical query like
// site_settings, before loading normally anyway).
//
// Only for automatic loads triggered on mount. Never wrap a user-initiated
// write (a save, a reorder, a delete) in this — those already get a toast
// and a manual retry when they fail, which is the right UX for something
// the person just clicked; silently retrying a write behind their back
// isn't the same kind of safe default that retrying a read is.

// A thunk that *throws* (instead of resolving with { error }) would reject
// Promise.all, skip the retry loop entirely, and leave the caller's
// `loading` flag stuck on forever. Converting it into an error result keeps
// every failure on the same path. status 0 marks it as a network-level
// failure, which counts as transient below.
async function runThunk(thunk) {
  try {
    return await thunk();
  } catch (error) {
    return { data: null, error, status: 0 };
  }
}

function isTransientFailure(result) {
  if (!result.error) return false;
  const { status } = result;
  // No numeric status to go on — assume transient, i.e. keep the original
  // retry-everything behavior rather than risk giving up early.
  if (typeof status !== "number") return true;
  // 401 is on the list on purpose. Every request carries the browser's saved
  // login session if there is one (e.g. from using the admin dashboard in the
  // same browser), and an expired access token is rejected with 401 until the
  // client's automatic refresh lands a moment later — typically the first load
  // after the tab has been idle. A genuinely wrong key would fail again on each
  // retry, which only costs a few seconds before the error shows.
  return status === 0 || status === 401 || status === 408 || status === 429 || status >= 500;
}

/**
 * @param {Array<() => Promise>} queryThunks
 * @param {string[]} [labels] optional names for the queries, same order — only
 *   used to say *which* query failed in the console while retrying, which is
 *   otherwise invisible ("a request failed" doesn't tell you which one or why).
 */
export async function runQueriesWithRetry(queryThunks, labels = []) {
  let lastResults;
  for (let attempt = 0; attempt < MAX_FETCH_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await delay(RETRY_DELAYS_MS[attempt - 1]);
    }
    lastResults = await Promise.all(queryThunks.map(runThunk));

    const failures = lastResults.map((result, index) => ({ result, index })).filter(({ result }) => result.error);
    if (!failures.some(({ result }) => isTransientFailure(result))) return lastResults;

    console.warn(
      `[runQueriesWithRetry] attempt ${attempt + 1}/${MAX_FETCH_ATTEMPTS} failed — ` +
        failures
          .map(
            ({ result, index }) =>
              `${labels[index] ?? `query ${index}`} (status ${result.status ?? "?"}: ${result.error.message ?? result.error})`,
          )
          .join("; "),
    );
  }
  return lastResults; // exhausted retries — caller's existing error handling takes over
}
