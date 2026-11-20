import { createContext, useContext, useEffect, useState } from "react";
import { removeStoredImages } from "@/admin/api/imageStorage";
import * as neighborhoodsApi from "@/admin/api/neighborhoods";
import { useToast } from "@/admin/context/ToastContext";
import { runQueriesWithRetry } from "@/shared/lib/runQueriesWithRetry";

const NeighborhoodsContext = createContext(null);

export function NeighborhoodsProvider({ children }) {
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      const [{ data, error }] = await runQueriesWithRetry([neighborhoodsApi.fetchNeighborhoods]);
      if (!active) return;
      if (error) {
        console.error(error);
        showToast("Could not load neighborhoods.", "error");
      } else {
        setNeighborhoods(data.map(neighborhoodsApi.normalizeNeighborhood));
      }
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [showToast]);

  async function addNeighborhood({ name, description, image_url, focal_x, focal_y }) {
    // New entries go to the end of the current order by default — the
    // admin can still drag it wherever it should actually sit.
    // (This used to be `neighborhoods.length`, which could give two rows the
    // same position after a delete; highest + 1 can't.)
    const nextOrder = neighborhoods.length ? Math.max(...neighborhoods.map((n) => n.sort_order)) + 1 : 0;
    const data = await neighborhoodsApi.insertNeighborhood({
      name,
      description,
      image_url,
      focal_x,
      focal_y,
      sort_order: nextOrder,
    });
    const neighborhood = neighborhoodsApi.normalizeNeighborhood(data);
    setNeighborhoods((current) => [...current, neighborhood]);
    return neighborhood.id;
  }

  async function updateNeighborhood(id, patch, expectedUpdatedAt) {
    const data = await neighborhoodsApi.updateNeighborhood(id, patch, expectedUpdatedAt);
    const neighborhood = neighborhoodsApi.normalizeNeighborhood(data);
    setNeighborhoods((current) => current.map((existing) => (existing.id === id ? neighborhood : existing)));
    return neighborhood;
  }

  async function deleteNeighborhood(id) {
    // Read the photo's URL before the row is gone — afterwards there's no way
    // to know which Storage files were its.
    const imageUrl = neighborhoods.find((neighborhood) => neighborhood.id === id)?.image_url;

    await neighborhoodsApi.deleteNeighborhood(id);
    setNeighborhoods((current) => current.filter((neighborhood) => neighborhood.id !== id));

    // Deleting the row never touched Storage, so every deleted neighborhood
    // used to leave its photo behind. This removes the original and all of
    // its generated copies. Not awaited, so a slow or failing Storage call
    // can't turn a successful delete into a reported failure — but if it does
    // fail the admin is told, since the files are then orphaned.
    if (imageUrl) {
      removeStoredImages([imageUrl]).catch((storageError) => {
        console.error("Failed to remove neighborhood image from storage:", storageError);
        showToast("The neighborhood was deleted, but its photo could not be removed from storage.", "error");
      });
    }
  }

  // Persists a full reorder in one go — same pattern as the Featured
  // Properties page's updateFeaturedForListingType.
  async function reorderNeighborhoods(orderedIds) {
    let touchedRows;
    try {
      touchedRows = await neighborhoodsApi.updateNeighborhoodSortOrders(orderedIds);
    } catch (error) {
      // Some of the updates may have gone through before another one failed, and
      // each of those moved its row's updated_at too. Copy just those timestamps;
      // the order itself stays as it was, so the screen rolls back as before.
      const partialUpdatedAtById = new Map((error?.updatedRows ?? []).map((row) => [row.id, row.updated_at]));
      if (partialUpdatedAtById.size > 0) {
        setNeighborhoods((current) =>
          current.map((neighborhood) =>
            partialUpdatedAtById.has(neighborhood.id)
              ? { ...neighborhood, updated_at: partialUpdatedAtById.get(neighborhood.id) }
              : neighborhood,
          ),
        );
      }
      throw error;
    }
    // Each of those updates moved the row's updated_at in the database. Without
    // copying the new values here, the next edit of a neighborhood would be sent
    // with the old timestamp and rejected as a false CONFLICT.
    const updatedAtById = new Map(touchedRows.map((row) => [row.id, row.updated_at]));
    setNeighborhoods((current) =>
      current
        .map((neighborhood) => {
          const index = orderedIds.indexOf(neighborhood.id);
          return index === -1
            ? neighborhood
            : {
                ...neighborhood,
                sort_order: index,
                updated_at: updatedAtById.get(neighborhood.id) ?? neighborhood.updated_at,
              };
        })
        .sort((a, b) => a.sort_order - b.sort_order),
    );
  }

  const value = {
    neighborhoods,
    loading,
    addNeighborhood,
    updateNeighborhood,
    deleteNeighborhood,
    reorderNeighborhoods,
  };

  return <NeighborhoodsContext.Provider value={value}>{children}</NeighborhoodsContext.Provider>;
}

export function useNeighborhoods() {
  const context = useContext(NeighborhoodsContext);
  if (!context) {
    throw new Error("useNeighborhoods must be used within a NeighborhoodsProvider");
  }
  return context;
}
