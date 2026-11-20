import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { computePriceBounds, createDefaultFilters } from "@/site/lib/browseFilters";

// The filter + search state of the Browse page, and everything that keeps it in
// step with the URL, the rent/sale switch and the data loading. The three
// "if (… !== prev…)" blocks are React's "adjust state while rendering" pattern:
// each one runs once per change, right when the change is noticed.
export default function useBrowseFilters({ listingType, properties, loading }) {
  const [searchParams] = useSearchParams();
  const qParam = searchParams.get("q");
  const neighborhoodParam = searchParams.get("neighborhood");

  const priceBounds = useMemo(() => computePriceBounds(properties, listingType), [properties, listingType]);

  const [filters, setFilters] = useState(() => ({
    ...createDefaultFilters(listingType, priceBounds),
    neighborhood: neighborhoodParam || null,
  }));
  const [search, setSearch] = useState(qParam ?? "");

  const [prevQ, setPrevQ] = useState(qParam);
  const [prevNeighborhoodParam, setPrevNeighborhoodParam] = useState(neighborhoodParam);
  const [prevListingType, setPrevListingType] = useState(listingType);
  const [prevLoading, setPrevLoading] = useState(loading);
  const [prevPriceBounds, setPrevPriceBounds] = useState(priceBounds);

  // A neighborhood card (or any other link) can send someone here with
  // ?q=Malabata pre-filled — this only pulls in a *new* term from the URL,
  // so it never fights with someone typing/clearing the box by hand.
  if (qParam !== prevQ) {
    setPrevQ(qParam);
    if (qParam) setSearch(qParam);
  }

  // Same idea, but for an exact neighborhood filter (?neighborhood=<id>) —
  // this is what the Neighborhoods pages actually link with now, since a
  // real relationship exists between properties and neighborhoods.
  if (neighborhoodParam !== prevNeighborhoodParam) {
    setPrevNeighborhoodParam(neighborhoodParam);
    if (neighborhoodParam) {
      setFilters((f) => ({ ...f, neighborhood: neighborhoodParam }));
    }
  }

  // Price ranges (and available property types/conveniences) differ enough
  // between renting and buying that carrying filters across a rent<->sale
  // switch would leave them showing a stale, wrong-scale range — reset to
  // that segment's defaults whenever it changes. Re-reading the URL here
  // (rather than always resetting to null) is what stops this one from
  // silently wiping out a neighborhood filter the URL asks for.
  if (listingType !== prevListingType) {
    setPrevListingType(listingType);
    setFilters({
      ...createDefaultFilters(listingType, priceBounds),
      neighborhood: neighborhoodParam || null,
    });
  }

  // On first mount, `properties` is still empty when the state above
  // initializes (the lazy initializer runs before the async fetch
  // resolves), so the price slider starts out using the fallback range.
  // Once real data has actually arrived, sync it to the real detected
  // bounds. This only fires when `loading` itself flips — not on every
  // properties/filters change — so it can never clobber a price range the
  // user has since adjusted by hand; the whole filter UI is hidden behind
  // a loading spinner until this has already happened once anyway.
  if (loading !== prevLoading) {
    setPrevLoading(loading);
    if (!loading) {
      setFilters((f) => ({ ...f, price: priceBounds }));
    }
  }

  // The list is renewed quietly in the background once it has gone old, so the
  // detected bounds can change while someone is browsing (a more expensive
  // listing was published, say). If the slider still sits on the old bounds —
  // the visitor never moved it — it follows the new ones, so the new listing
  // isn't silently filtered out. One they've adjusted is left alone. Does
  // nothing when the bounds are the same.
  if (priceBounds[0] !== prevPriceBounds[0] || priceBounds[1] !== prevPriceBounds[1]) {
    setPrevPriceBounds(priceBounds);
    setFilters((f) =>
      f.price[0] === prevPriceBounds[0] && f.price[1] === prevPriceBounds[1] ? { ...f, price: priceBounds } : f,
    );
  }

  return { filters, setFilters, search, setSearch, priceBounds };
}
