import { createContext, useContext, useEffect, useState } from "react";
import * as catalogApi from "@/admin/api/catalog";
import { useToast } from "@/admin/context/ToastContext";
import { runQueriesWithRetry } from "@/shared/lib/runQueriesWithRetry";

const CatalogContext = createContext(null);

export function CatalogProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [categoryAmenities, setCategoryAmenities] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      const [categoriesRes, amenitiesRes, subcategoriesRes, linksRes] = await runQueriesWithRetry([
        catalogApi.fetchCategories,
        catalogApi.fetchAmenities,
        catalogApi.fetchSubcategories,
        catalogApi.fetchCategoryAmenityLinks,
      ]);

      if (!active) return;

      const firstError = categoriesRes.error || amenitiesRes.error || subcategoriesRes.error || linksRes.error;
      if (firstError) {
        console.error(firstError);
        showToast("Could not load categories & amenities.", "error");
        setLoading(false);
        return;
      }

      setCategories(categoriesRes.data);
      setAmenities(amenitiesRes.data);
      setSubcategories(subcategoriesRes.data);
      setCategoryAmenities(linksRes.data.map((link) => ({ categoryId: link.category_id, amenityId: link.amenity_id })));
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [showToast]);

  // ---- categories ----------------------------------------------------

  async function addCategory({ name, icon, rooms_filter_enabled }) {
    const sort_order = categories.length ? Math.max(...categories.map((category) => category.sort_order)) + 1 : 1;
    const category = await catalogApi.insertCategory({ name, icon, rooms_filter_enabled, sort_order });
    setCategories((current) => [...current, category]);
    return category.id;
  }

  async function updateCategory(id, patch, expectedUpdatedAt) {
    const category = await catalogApi.updateCategory(id, patch, expectedUpdatedAt);
    setCategories((current) => current.map((existing) => (existing.id === id ? category : existing)));
    return category;
  }

  async function deleteCategory(id) {
    await catalogApi.deleteCategory(id);
    // The DB cascades subcategories & category_amenities on delete — mirror that locally.
    setCategories((current) => current.filter((category) => category.id !== id));
    setSubcategories((current) => current.filter((subcategory) => subcategory.category_id !== id));
    setCategoryAmenities((current) => current.filter((link) => link.categoryId !== id));
  }

  // ---- amenities -------------------------------------------------------

  async function addAmenity({ name, icon }) {
    const amenity = await catalogApi.insertAmenity({ name, icon });
    setAmenities((current) => [...current, amenity]);
    return amenity.id;
  }

  async function updateAmenity(id, patch, expectedUpdatedAt) {
    const amenity = await catalogApi.updateAmenity(id, patch, expectedUpdatedAt);
    setAmenities((current) => current.map((existing) => (existing.id === id ? amenity : existing)));
    return amenity;
  }

  async function deleteAmenity(id) {
    await catalogApi.deleteAmenity(id);
    setAmenities((current) => current.filter((amenity) => amenity.id !== id));
    setCategoryAmenities((current) => current.filter((link) => link.amenityId !== id));
  }

  // ---- category <-> amenity links --------------------------------------

  function getAmenityIdsForCategory(categoryId) {
    return categoryAmenities.filter((link) => link.categoryId === categoryId).map((link) => link.amenityId);
  }

  async function setCategoryAmenityIds(categoryId, amenityIds) {
    await catalogApi.setCategoryAmenities(categoryId, amenityIds);

    setCategoryAmenities((current) => [
      ...current.filter((link) => link.categoryId !== categoryId),
      ...amenityIds.map((amenityId) => ({ categoryId, amenityId })),
    ]);
  }

  // ---- subcategories -----------------------------------------------------

  function getSubcategoriesForCategory(categoryId) {
    return subcategories
      .filter((subcategory) => subcategory.category_id === categoryId)
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  async function addSubcategory({ category_id, name }) {
    const siblingOrders = subcategories
      .filter((subcategory) => subcategory.category_id === category_id)
      .map((subcategory) => subcategory.sort_order);
    const sort_order = siblingOrders.length ? Math.max(...siblingOrders) + 1 : 1;

    const subcategory = await catalogApi.insertSubcategory({ category_id, name, sort_order });
    setSubcategories((current) => [...current, subcategory]);
    return subcategory.id;
  }

  async function updateSubcategory(id, patch, expectedUpdatedAt) {
    const subcategory = await catalogApi.updateSubcategory(id, patch, expectedUpdatedAt);
    setSubcategories((current) => current.map((existing) => (existing.id === id ? subcategory : existing)));
    return subcategory;
  }

  async function deleteSubcategory(id) {
    await catalogApi.deleteSubcategory(id);
    setSubcategories((current) => current.filter((subcategory) => subcategory.id !== id));
  }

  const value = {
    categories,
    amenities,
    subcategories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    addAmenity,
    updateAmenity,
    deleteAmenity,
    getAmenityIdsForCategory,
    setCategoryAmenityIds,
    getSubcategoriesForCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
  };

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error("useCatalog must be used within a CatalogProvider");
  }
  return context;
}
