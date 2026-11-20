import { createContext, useContext, useEffect, useState } from "react";
import {
  deletePropertyRow,
  fetchProperties,
  fetchPropertyAmenityLinks,
  fetchPropertyImages,
  normalizeImage,
  normalizeProperty,
  sortImages,
  updateFeaturedOrder,
  insertProperty,
  patchProperty,
  replacePropertyAmenities,
  replacePropertyImages,
} from "@/admin/api/properties";
import { useToast } from "@/admin/context/ToastContext";
import { runQueriesWithRetry } from "@/shared/lib/runQueriesWithRetry";
import { removeStoredImages } from "@/admin/api/imageStorage";

const PropertiesContext = createContext(null);

export function PropertiesProvider({ children }) {
  const [properties, setProperties] = useState([]);
  const [propertyAmenities, setPropertyAmenities] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      const [propertiesRes, imagesRes, amenityLinksRes] = await runQueriesWithRetry([
        fetchProperties,
        fetchPropertyImages,
        fetchPropertyAmenityLinks,
      ]);

      if (!active) return;

      const firstError = propertiesRes.error || imagesRes.error || amenityLinksRes.error;
      if (firstError) {
        console.error(firstError);
        showToast("Could not load properties.", "error");
        setLoading(false);
        return;
      }

      const imagesByProperty = {};
      for (const image of imagesRes.data) {
        if (!imagesByProperty[image.property_id]) imagesByProperty[image.property_id] = [];
        imagesByProperty[image.property_id].push(normalizeImage(image));
      }

      setProperties(
        propertiesRes.data.map((property) => ({
          ...normalizeProperty(property),
          images: sortImages(imagesByProperty[property.id] ?? []),
        })),
      );
      setPropertyAmenities(
        amenityLinksRes.data.map((link) => ({ propertyId: link.property_id, amenityId: link.amenity_id })),
      );
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [showToast]);

  function getPropertyCountForCategory(categoryId) {
    return properties.filter((property) => property.category_id === categoryId).length;
  }

  function getPropertyCountForNeighborhood(neighborhoodId) {
    return properties.filter((property) => property.neighborhood_id === neighborhoodId).length;
  }

  function getPropertyCountForSubcategory(subcategoryId) {
    return properties.filter((property) => property.subcategory_id === subcategoryId).length;
  }

  function getPropertyCountForAmenity(amenityId) {
    return new Set(propertyAmenities.filter((link) => link.amenityId === amenityId).map((link) => link.propertyId))
      .size;
  }

  function getPropertyCountForAgent(agentId) {
    return properties.filter((property) => property.agent_id === agentId).length;
  }

  // ---- properties --------------------------------------------------------

  async function addProperty(fields) {
    const data = await insertProperty(fields);
    const property = normalizeProperty(data);
    setProperties((current) => [{ ...property, images: [] }, ...current]);
    return property.id;
  }

  async function updateProperty(id, patch, expectedUpdatedAt) {
    const data = await patchProperty(id, patch, expectedUpdatedAt);
    const property = normalizeProperty(data);
    setProperties((current) =>
      current.map((existing) => (existing.id === id ? { ...property, images: existing.images } : existing)),
    );
    return property;
  }

  // ---- images --------------------------------------------------------------

  async function setPropertyImages(propertyId, images) {
    const data = await replacePropertyImages(propertyId, images);
    const inserted = data.map(normalizeImage);
    setProperties((current) =>
      current.map((property) =>
        property.id === propertyId ? { ...property, images: sortImages(inserted) } : property,
      ),
    );
  }

  // ---- property <-> amenity links --------------------------------------------

  function getAmenityIdsForProperty(propertyId) {
    return propertyAmenities.filter((link) => link.propertyId === propertyId).map((link) => link.amenityId);
  }

  async function setPropertyAmenityIds(propertyId, amenityIds) {
    await replacePropertyAmenities(propertyId, amenityIds);

    setPropertyAmenities((current) => [
      ...current.filter((link) => link.propertyId !== propertyId),
      ...amenityIds.map((amenityId) => ({ propertyId, amenityId })),
    ]);
  }

  // ---- featured on homepage ------------------------------------------------

  // `orderedIds` is the complete, final ordered list of ids that should be
  // featured for this listing type — the Featured admin page always sends
  // its whole current list (after any add/remove/drag), not a diff, which
  // keeps this the single source of truth rather than trying to reconcile
  // partial changes.
  async function updateFeaturedForListingType(listingType, orderedIds) {
    const currentlyFeaturedIds = properties
      .filter((property) => property.listing_type === listingType && property.featured_order !== null)
      .map((property) => property.id);
    const toClear = currentlyFeaturedIds.filter((id) => !orderedIds.includes(id));

    let touchedRows;
    try {
      touchedRows = await updateFeaturedOrder(orderedIds, toClear);
    } catch (error) {
      // Some of the updates may have gone through before another one failed, and
      // each of those moved its row's updated_at too. Copy just those timestamps;
      // the order itself stays as it was, so the screen rolls back as before.
      const partialUpdatedAtById = new Map((error?.updatedRows ?? []).map((row) => [row.id, row.updated_at]));
      if (partialUpdatedAtById.size > 0) {
        setProperties((current) =>
          current.map((property) =>
            partialUpdatedAtById.has(property.id)
              ? { ...property, updated_at: partialUpdatedAtById.get(property.id) }
              : property,
          ),
        );
      }
      throw error;
    }
    // Each of those updates moved the row's updated_at in the database. Without
    // copying the new values here, the next edit of one of these properties
    // would be sent with the old timestamp and rejected as a false CONFLICT.
    const updatedAtById = new Map(touchedRows.map((row) => [row.id, row.updated_at]));

    setProperties((current) =>
      current.map((property) => {
        const updatedAt = updatedAtById.get(property.id) ?? property.updated_at;
        const index = orderedIds.indexOf(property.id);
        if (index !== -1) return { ...property, featured_order: index, updated_at: updatedAt };
        if (toClear.includes(property.id)) return { ...property, featured_order: null, updated_at: updatedAt };
        return property;
      }),
    );
  }

  async function deleteProperty(id) {
    // Read the images before deleting — once the row is gone, ON DELETE
    // CASCADE removes the property_images rows too (rows only — never the
    // files in Storage), and this is the last moment we'd know which Storage
    // files belonged to this property.
    const property = properties.find((existing) => existing.id === id);
    const imageUrls = property?.images?.map((image) => image.url) ?? [];

    await deletePropertyRow(id);
    setProperties((current) => current.filter((existing) => existing.id !== id));
    setPropertyAmenities((current) => current.filter((link) => link.propertyId !== id));

    // Not awaited, deliberately: the property is already gone from the DB and
    // the admin's screen either way, so a slow or failing Storage call
    // shouldn't hold up (or turn into) a failed delete. But a failure is no
    // longer silent — the files would be orphaned, so the admin is told.
    // removeStoredImages deletes each original AND all of its generated
    // copies, only ever touches our own buckets (external URLs, like this
    // project's seeded Pexels demo photos, are skipped), and sends decoded
    // storage keys (the old per-bucket helper sent URL-encoded ones, which
    // silently matched nothing for any file name with a space or accent).
    removeStoredImages(imageUrls).catch((storageError) => {
      console.error("Failed to remove property images from storage:", storageError);
      showToast("The property was deleted, but some of its image files could not be removed from storage.", "error");
    });
  }

  const value = {
    properties,
    loading,
    getPropertyCountForCategory,
    getPropertyCountForNeighborhood,
    getPropertyCountForSubcategory,
    getPropertyCountForAmenity,
    getPropertyCountForAgent,
    updateFeaturedForListingType,
    deleteProperty,
    addProperty,
    updateProperty,
    setPropertyImages,
    getAmenityIdsForProperty,
    setPropertyAmenityIds,
  };

  return <PropertiesContext.Provider value={value}>{children}</PropertiesContext.Provider>;
}

export function useProperties() {
  const context = useContext(PropertiesContext);
  if (!context) {
    throw new Error("useProperties must be used within a PropertiesProvider");
  }
  return context;
}
