import { useState } from "react";
import { IoPencilOutline, IoTrashOutline, IoPricetagsOutline } from "react-icons/io5";
import CategoryForm from "@/admin/components/CategoryForm";
import ConfirmDialog from "@/admin/components/ConfirmDialog";
import ContentSpinner from "@/admin/components/ContentSpinner";
import EmptyState from "@/admin/components/EmptyState";
import IconButton from "@/admin/components/IconButton";
import Modal from "@/admin/components/Modal";
import PageHeader from "@/admin/components/PageHeader";
import { getIconByKey } from "@/shared/config/curatedIcons";
import { useCatalog } from "@/admin/context/CatalogContext";
import { useProperties } from "@/admin/context/PropertiesContext";
import { useToast } from "@/admin/context/ToastContext";
import { handleSaveError } from "@/admin/lib/handleSaveError";

export default function CategoriesPage() {
  const {
    categories,
    amenities,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    getAmenityIdsForCategory,
    setCategoryAmenityIds,
    getSubcategoriesForCategory,
  } = useCatalog();
  const { getPropertyCountForCategory } = useProperties();
  const { showToast } = useToast();

  const [formState, setFormState] = useState(null); // null | { mode: 'create' } | { mode: 'edit', category }
  const [pendingDelete, setPendingDelete] = useState(null);

  const sortedCategories = [...categories].sort((a, b) => a.sort_order - b.sort_order);
  const pendingDeleteUsageCount = pendingDelete ? getPropertyCountForCategory(pendingDelete?.id) : 0;
  const pendingDeleteSubcategoryCount = pendingDelete ? getSubcategoriesForCategory(pendingDelete?.id).length : 0;
  const isDeleteBlocked = pendingDeleteUsageCount > 0;

  function openCreate() {
    setFormState({ mode: "create" });
  }

  function openEdit(category) {
    setFormState({ mode: "edit", category });
  }

  function closeForm() {
    setFormState(null);
  }

  async function handleSubmit({ name, icon, rooms_filter_enabled, amenityIds }) {
    let createdId = null;
    try {
      if (formState?.mode === "create") {
        createdId = await addCategory({ name, icon, rooms_filter_enabled });
        await setCategoryAmenityIds(createdId, amenityIds);
        showToast("Category added.");
      } else {
        await updateCategory(
          formState?.category?.id,
          { name, icon, rooms_filter_enabled },
          formState?.category?.updated_at,
        );
        await setCategoryAmenityIds(formState?.category?.id, amenityIds);
        showToast("Category updated.");
      }
      closeForm();
    } catch (error) {
      if (createdId !== null) {
        // The category row exists already; only its amenity list failed. Closing the
        // form (rather than leaving it open) means a retry can't create a duplicate.
        console.error(error);
        showToast("Category was created, but its amenities could not be saved — open it again to set them.", "error");
        closeForm();
        return;
      }
      // Leave the form open on a conflict — their edits might still be worth keeping,
      // it's their call whether to reload and reapply or save again.
      handleSaveError(error, { showToast, closeForm, fallbackMessage: "Something went wrong saving this category." });
    }
  }

  async function handleDelete() {
    if (isDeleteBlocked) return;
    try {
      await deleteCategory(pendingDelete?.id);
      showToast("Category deleted.");
      setPendingDelete(null);
    } catch (error) {
      console.error(error);
      showToast("Could not delete this category.", "error");
    }
  }

  if (loading) {
    return <ContentSpinner />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Property types shown on the public site, each with the amenities that apply to it."
        actionLabel="Add category"
        onAction={openCreate}
      />

      {sortedCategories.length === 0 ? (
        <EmptyState
          icon={IoPricetagsOutline}
          title="No categories yet"
          description="Add your first property type — Villa, Apartment, Commercial — to start organizing listings."
          action={
            <button
              type="button"
              onClick={openCreate}
              className="rounded-[12px] bg-accent-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-600"
            >
              Add category
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedCategories.map((category) => {
            const Icon = getIconByKey(category.icon);
            const amenityCount = getAmenityIdsForCategory(category.id).length;
            const subcategoryCount = getSubcategoriesForCategory(category.id).length;
            const listingCount = getPropertyCountForCategory(category.id);

            return (
              <div
                key={category.id}
                className="rounded-[16px] border border-accent-500/10 bg-white p-5 transition-shadow hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-primary-600 text-accent-500">
                    <Icon size={20} />
                  </div>
                  <div className="flex gap-1.5">
                    <IconButton label={`Edit ${category.name}`} onClick={() => openEdit(category)}>
                      <IoPencilOutline size={18} />
                    </IconButton>
                    <IconButton label={`Delete ${category.name}`} onClick={() => setPendingDelete(category)}>
                      <IoTrashOutline size={18} />
                    </IconButton>
                  </div>
                </div>

                <h3 className="mt-4 text-base font-semibold text-main">{category.name}</h3>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {category.rooms_filter_enabled && (
                    <span className="rounded-full bg-gold-500/20 px-3 py-1 text-xs font-medium text-main">
                      Rooms filter
                    </span>
                  )}
                  <span className="rounded-full bg-primary-600 px-3 py-1 text-xs font-medium text-secondary">
                    {amenityCount} amenit{amenityCount === 1 ? "y" : "ies"}
                  </span>
                  {subcategoryCount > 0 && (
                    <span className="rounded-full bg-primary-600 px-3 py-1 text-xs font-medium text-secondary">
                      {subcategoryCount} sub-type{subcategoryCount === 1 ? "" : "s"}
                    </span>
                  )}
                  {listingCount > 0 && (
                    <span className="rounded-full bg-primary-600 px-3 py-1 text-xs font-medium text-secondary">
                      {listingCount} listing{listingCount === 1 ? "" : "s"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={formState !== null}
        onClose={closeForm}
        title={formState?.mode === "edit" ? "Edit category" : "Add category"}
      >
        {formState && (
          <CategoryForm
            key={formState.mode === "edit" ? formState.category.id : "create"}
            initialCategory={formState.mode === "edit" ? formState.category : null}
            initialAmenityIds={formState.mode === "edit" ? getAmenityIdsForCategory(formState.category.id) : []}
            amenities={amenities}
            onCancel={closeForm}
            onSubmit={handleSubmit}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title={isDeleteBlocked ? `Can't delete "${pendingDelete?.name}"` : `Delete "${pendingDelete?.name}"?`}
        description={
          isDeleteBlocked
            ? `${pendingDeleteUsageCount} propert${pendingDeleteUsageCount === 1 ? "y uses" : "ies use"} this category. Reassign ${pendingDeleteUsageCount === 1 ? "it" : "them"} to a different category from the Properties page, then come back to delete this one.`
            : pendingDeleteSubcategoryCount > 0
              ? `This removes the category, its amenity list, and its ${pendingDeleteSubcategoryCount} sub-type${pendingDeleteSubcategoryCount === 1 ? "" : "s"}. This can't be undone.`
              : "This removes the category and its amenity list. This can't be undone."
        }
        confirmLabel="Delete"
        blocked={isDeleteBlocked}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
