import { useState } from "react";
import { IoPencilOutline, IoTrashOutline, IoSparklesOutline } from "react-icons/io5";
import AmenityForm from "@/admin/components/AmenityForm";
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

export default function ConveniencesPage() {
  const { amenities, loading, addAmenity, updateAmenity, deleteAmenity } = useCatalog();
  const { getPropertyCountForAmenity } = useProperties();
  const { showToast } = useToast();

  const [formState, setFormState] = useState(null); // null | { mode: 'create' } | { mode: 'edit', amenity }
  const [pendingDelete, setPendingDelete] = useState(null);

  const pendingDeleteUsageCount = pendingDelete ? getPropertyCountForAmenity(pendingDelete?.id) : 0;
  const isDeleteBlocked = pendingDeleteUsageCount > 0;

  function openCreate() {
    setFormState({ mode: "create" });
  }

  function openEdit(amenity) {
    setFormState({ mode: "edit", amenity });
  }

  function closeForm() {
    setFormState(null);
  }

  async function handleSubmit({ name, icon }) {
    try {
      if (formState?.mode === "create") {
        await addAmenity({ name, icon });
        showToast("Amenity added.");
      } else {
        await updateAmenity(formState?.amenity?.id, { name, icon }, formState?.amenity?.updated_at);
        showToast("Amenity updated.");
      }
      closeForm();
    } catch (error) {
      handleSaveError(error, { showToast, closeForm, fallbackMessage: "Something went wrong saving this amenity." });
    }
  }

  async function handleDelete() {
    if (isDeleteBlocked) return;
    try {
      await deleteAmenity(pendingDelete?.id);
      showToast("Amenity deleted.");
      setPendingDelete(null);
    } catch (error) {
      console.error(error);
      showToast("Could not delete this amenity.", "error");
    }
  }

  if (loading) {
    return <ContentSpinner />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conveniences"
        description="The amenities available to assign to categories and properties."
        actionLabel="Add amenity"
        onAction={openCreate}
      />

      {amenities.length === 0 ? (
        <EmptyState
          icon={IoSparklesOutline}
          title="No amenities yet"
          description="Add amenities like Swimming pool or Garage, then assign them to categories."
          action={
            <button
              type="button"
              onClick={openCreate}
              className="rounded-[12px] bg-accent-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-600"
            >
              Add amenity
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {amenities.map((amenity) => {
            const Icon = getIconByKey(amenity.icon);
            return (
              <div
                key={amenity.id}
                className="flex items-center gap-3 rounded-[16px] border border-accent-500/10 bg-white p-4 transition-shadow hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-primary-600 text-accent-500">
                  <Icon size={20} />
                </div>
                <p className="flex-1 truncate text-sm font-medium text-main">{amenity.name}</p>
                <div className="flex gap-1">
                  <IconButton label={`Edit ${amenity.name}`} onClick={() => openEdit(amenity)}>
                    <IoPencilOutline size={16} />
                  </IconButton>
                  <IconButton label={`Delete ${amenity.name}`} onClick={() => setPendingDelete(amenity)}>
                    <IoTrashOutline size={16} />
                  </IconButton>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={formState !== null}
        onClose={closeForm}
        title={formState?.mode === "edit" ? "Edit amenity" : "Add amenity"}
      >
        {formState && (
          <AmenityForm
            key={formState.mode === "edit" ? formState.amenity.id : "create"}
            initialAmenity={formState.mode === "edit" ? formState.amenity : null}
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
            ? `${pendingDeleteUsageCount} propert${pendingDeleteUsageCount === 1 ? "y uses" : "ies use"} this amenity. Remove it from ${pendingDeleteUsageCount === 1 ? "that listing" : "those listings"} from the Properties page, then come back to delete it.`
            : "Removes it from every category it's currently assigned to. This can't be undone."
        }
        confirmLabel="Delete"
        blocked={isDeleteBlocked}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
