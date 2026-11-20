import { useEffect, useMemo, useSyncExternalStore } from "react";
import { fetchPropertiesByIds } from "@/site/api/properties";
import { isUuid } from "@/site/lib/queryHelpers";

// The cards of the properties a visitor saved as favorites, fetched by id — only
// those, in groups of at most 50 so the address never gets too long.
//
// It knows each saved id separately, not the list as a whole:
//  - removing a favorite needs no request (its card just stops being listed);
//  - saving a new one fetches only that one, the next time the list is wanted;
//  - an id with no published property (deleted, unpublished, junk in storage) is
//    remembered as "gone", so it is not asked for again until it has gone old, and
//    is left out of the list quietly — never an error, never a broken card.
// What is known is kept for 5 minutes. After that it is still shown at once and
// renewed quietly the next time the list is wanted. A request that fails keeps
// whatever is already known and is not retried until the list is wanted again.
//
// Lives outside React (like lib/requestCache.js) so it survives the panel closing,
// and is cleared when the public site is left (see SiteApp).
const FAVORITES_TTL_MS = 5 * 60 * 1000;
const IDS_PER_REQUEST = 50;

const known = new Map(); // id -> { card (null = no published property), fetchedAt }
const failedIds = new Set(); // ids whose first request failed
const pendingIds = new Set(); // ids a request is under way for
const listeners = new Set();
let version = 0;

function notify() {
  version += 1;
  for (const listener of listeners) listener();
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getVersion() {
  return version;
}

async function loadFavoriteCards(ids) {
  for (const id of ids) {
    pendingIds.add(id);
    failedIds.delete(id);
  }

  const groups = [];
  for (let i = 0; i < ids.length; i += IDS_PER_REQUEST) groups.push(ids.slice(i, i + IDS_PER_REQUEST));

  await Promise.all(
    groups.map(async (group) => {
      const { data, error } = await fetchPropertiesByIds(group);
      for (const id of group) pendingIds.delete(id);

      if (error) {
        // A failed quiet refresh keeps what was already known.
        for (const id of group) if (!known.has(id)) failedIds.add(id);
      } else {
        const cardsById = new Map(data.map((card) => [card.id, card]));
        const fetchedAt = Date.now();
        for (const id of group) known.set(id, { card: cardsById.get(id) ?? null, fetchedAt });
      }
      notify();
    }),
  );
}

// Forgets everything that has finished loading. Called when the public site is
// left, so coming back never starts from old cards.
export function clearFavoriteCards() {
  known.clear();
  failedIds.clear();
  notify();
}

function newestFirst(a, b) {
  return (b.createdAt ?? "").localeCompare(a.createdAt ?? "") || (a.id < b.id ? -1 : 1);
}

// `favoriteIds` is the saved set from FavoritesProvider; `enabled` says the list is
// wanted right now — nothing is requested while it isn't. The header wants it from
// the moment the site opens (its badge counts only favorites that still exist) and
// the panel when it is open; both read the same store, so each id is asked for once.
//  - properties: the saved ones that still exist, newest listing first
//  - loading:    some saved id has no answer yet (and it hasn't failed)
//  - failed:     some saved id could not be checked, so `properties` may be missing
//                ones that do exist — callers must not trust its length then
export default function useFavoriteProperties(favoriteIds, enabled) {
  const version = useSyncExternalStore(subscribe, getVersion);
  const ids = useMemo(() => [...new Set(favoriteIds)].filter(isUuid), [favoriteIds]);

  useEffect(() => {
    if (!enabled) return;
    const now = Date.now();
    const wanted = ids.filter(
      (id) => !pendingIds.has(id) && (!known.has(id) || now - known.get(id).fetchedAt >= FAVORITES_TTL_MS),
    );
    if (wanted.length > 0) loadFavoriteCards(wanted);
  }, [enabled, ids]);

  // `version` changes whenever what is known changes, which is what this reads.
  const properties = useMemo(
    () =>
      ids
        .map((id) => known.get(id)?.card)
        .filter(Boolean)
        .sort(newestFirst),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ids, version],
  );
  const loading = enabled && ids.some((id) => !known.has(id) && !failedIds.has(id));
  const failed = ids.some((id) => !known.has(id) && failedIds.has(id));

  return { properties, loading, failed };
}
