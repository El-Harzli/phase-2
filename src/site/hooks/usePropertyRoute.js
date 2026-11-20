import { useCallback, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { fetchAmenities } from "@/site/api/catalogs";
import { fetchPropertyById, fetchSimilarProperties } from "@/site/api/properties";
import useCachedRequest from "@/site/hooks/useCachedRequest";
import { buildProperties } from "@/site/lib/buildProperties";
import { getPreview } from "@/site/lib/propertyPreviews";
import { isUuid } from "@/site/lib/queryHelpers";

// What the property page and the property overlay both need: the property named
// by the address (both /property/:id and /property/:slug/:id carry the same
// `id`), loaded on its own — with one request — instead of searched for in a list
// of every property. `goBack` is what the overlay's close button uses.
//
//  - loading:           the property (or the amenity names) hasn't arrived yet
//  - property:          the same shape as ever (see buildProperties), or null
//  - error:             the property request failed — not the same as "not found"
//  - property === null  with no error and not loading means it doesn't exist
//                       (an id that isn't a UUID counts too, without asking)
//  - preview:           what the property's card already showed (from Browse, the
//                       featured or similar lists), or null — for showing something
//                       at once while the rest loads (the overlay does)
//  - reload():          asks for the property again (the overlay's "Try again")
//  - similarProperties: up to three other listings, loaded after the property
//                       arrives; a failure there only means there are none
//
// A property that was opened before is shown straight away from the shared
// request cache while it is renewed quietly (lifetime 0), so a reopened property
// never waits and never shows old data for long.
const PROPERTY_TTL_MS = 0;
const SIMILAR_TTL_MS = 5 * 60 * 1000;
const AMENITIES_TTL_MS = 30 * 60 * 1000;
const NONE = [];

export default function usePropertyRoute() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const validId = isUuid(id);

  const loadProperty = useCallback(() => fetchPropertyById(id), [id]);
  const propertyRequest = useCachedRequest(`property:${id}`, loadProperty, {
    ttlMs: PROPERTY_TTL_MS,
    enabled: validId,
  });
  // Shared with every other component that asks for amenities. Needed only for the
  // amenity names, so if it fails the property still shows, just without them.
  const amenitiesRequest = useCachedRequest("amenities", fetchAmenities, { ttlMs: AMENITIES_TTL_MS, enabled: validId });

  const rawProperty = propertyRequest.data;
  const categoryId = rawProperty?.category_id ?? null;
  const listingType = rawProperty?.listing_type;
  const loadSimilar = useCallback(
    () => fetchSimilarProperties({ categoryId, listingType, excludeId: id }),
    [categoryId, listingType, id],
  );
  const similarRequest = useCachedRequest(`similar:${id}`, loadSimilar, {
    ttlMs: SIMILAR_TTL_MS,
    enabled: Boolean(rawProperty),
  });

  const amenities = amenitiesRequest.data;
  const property = useMemo(
    () =>
      rawProperty
        ? buildProperties({
            rawProperties: [rawProperty],
            categories: rawProperty.category ? [rawProperty.category] : [],
            subcategories: [],
            neighborhoods: [],
            agents: rawProperty.agent ? [rawProperty.agent] : [],
            amenities: amenities ?? [],
          })[0]
        : null,
    [rawProperty, amenities],
  );

  // `location.key === "default"` means this page was loaded directly (a
  // fresh visit or a refresh) rather than reached by in-app navigation —
  // there's nothing to go back to, so send them to the browse page instead
  // of leaving the back button doing nothing (or leaving the app).
  const goBack = useCallback(() => {
    if (location.key === "default") {
      navigate(`/properties/${property?.listingType ?? "rent"}`);
    } else {
      navigate(-1);
    }
  }, [navigate, location, property]);

  return {
    property,
    preview: validId ? getPreview(id) : null,
    reload: propertyRequest.reload,
    similarProperties: similarRequest.data ?? NONE,
    loading: validId && (propertyRequest.loading || amenitiesRequest.loading),
    error: validId ? propertyRequest.error : null,
    goBack,
  };
}
