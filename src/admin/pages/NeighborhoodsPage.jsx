import { useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import {
  IoPencilOutline,
  IoTrashOutline,
  IoLocationOutline,
  IoReorderThreeOutline,
  IoImageOutline,
} from "react-icons/io5";
import ConfirmDialog from "@/admin/components/ConfirmDialog";
import ContentSpinner from "@/admin/components/ContentSpinner";
import EmptyState from "@/admin/components/EmptyState";
import IconButton from "@/admin/components/IconButton";
import Modal from "@/admin/components/Modal";
import NeighborhoodForm from "@/admin/components/NeighborhoodForm";
import PageHeader from "@/admin/components/PageHeader";
import ThumbImage from "@/admin/components/ThumbImage";
import { useNeighborhoods } from "@/admin/context/NeighborhoodsContext";
import { useProperties } from "@/admin/context/PropertiesContext";
import { useToast } from "@/admin/context/ToastContext";
import { handleSaveError } from "@/admin/lib/handleSaveError";
import { syncImages } from "@/admin/lib/syncImages";

function NeighborhoodRow({ neighborhood, onEdit, onDelete, onDragEnd }) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={neighborhood.id}
      dragListener={false}
      dragControls={dragControls}
      onDragEnd={onDragEnd}
      className="flex items-center gap-3 rounded-[16px] border border-accent-500/10 bg-white p-3 select-none"
    >
      <span
        onPointerDown={(event) => dragControls.start(event)}
        className="cursor-grab touch-none text-secondary/50 active:cursor-grabbing"
        aria-hidden="true"
      >
        <IoReorderThreeOutline size={20} />
      </span>
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[10px] bg-primary-600">
        {neighborhood.image_url ? (
          <ThumbImage url={neighborhood.image_url} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-secondary/40">
            <IoImageOutline size={18} />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-main">{neighborhood.name}</p>
        {neighborhood.description && <p className="truncate text-xs text-trenary">{neighborhood.description}</p>}
      </div>
      <div className="flex shrink-0 gap-1">
        <IconButton label={`Edit ${neighborhood.name}`} onClick={() => onEdit(neighborhood)}>
          <IoPencilOutline size={16} />
        </IconButton>
        <IconButton label={`Delete ${neighborhood.name}`} onClick={() => onDelete(neighborhood)}>
          <IoTrashOutline size={16} />
        </IconButton>
      </div>
    </Reorder.Item>
  );
}

export default function NeighborhoodsPage() {
  const { neighborhoods, loading, addNeighborhood, updateNeighborhood, deleteNeighborhood, reorderNeighborhoods } =
    useNeighborhoods();
  const { getPropertyCountForNeighborhood } = useProperties();
  const { showToast } = useToast();

  const [formState, setFormState] = useState(null); // null | { mode: 'create' } | { mode: 'edit', neighborhood }
  const [pendingDelete, setPendingDelete] = useState(null);
  const pendingDeleteUsageCount = pendingDelete ? getPropertyCountForNeighborhood(pendingDelete.id) : 0;
  const isDeleteBlocked = pendingDeleteUsageCount > 0;

  // The displayed order while dragging — kept in sync with `neighborhoods`
  // (from Supabase via context) whenever it changes from outside a drag,
  // e.g. after an add/delete. Same pattern as the Featured Properties
  // admin page.
  const [orderedIds, setOrderedIds] = useState(() => neighborhoods.map((n) => n.id));
  const [syncedNeighborhoods, setSyncedNeighborhoods] = useState(neighborhoods);
  if (syncedNeighborhoods !== neighborhoods) {
    setSyncedNeighborhoods(neighborhoods);
    setOrderedIds(neighborhoods.map((n) => n.id));
  }

  function openCreate() {
    setFormState({ mode: "create" });
  }

  function openEdit(neighborhood) {
    setFormState({ mode: "edit", neighborhood });
  }

  function closeForm() {
    setFormState(null);
  }

  async function handleSubmit({ name, description, image_url, imageFile, focal_x, focal_y }) {
    try {
      // The photo is one "image" going through the same safe sequence as a
      // property's photos (see syncImages): a newly chosen file is compressed,
      // uploaded and given its resized copies BEFORE the database write; if
      // that write fails the upload is removed again; and when the photo was
      // replaced or removed, the old file and all of its copies are deleted
      // only AFTER the write succeeds. An unchanged photo is left alone.
      const previousImageUrl = formState?.mode === "edit" ? formState?.neighborhood?.image_url : null;
      const images = imageFile ? [{ file: imageFile }] : image_url ? [{ url: image_url }] : [];

      const { variantsSkipped, cleanupFailed } = await syncImages({
        bucket: "neighborhood-images",
        images,
        previousUrls: previousImageUrl ? [previousImageUrl] : [],
        commit: async (finalImages) => {
          const finalImageUrl = finalImages[0]?.url ?? "";

          if (formState?.mode === "create") {
            await addNeighborhood({ name, description, image_url: finalImageUrl, focal_x, focal_y });
          } else {
            await updateNeighborhood(
              formState?.neighborhood?.id,
              {
                name,
                description,
                image_url: finalImageUrl,
                focal_x,
                focal_y,
              },
              formState?.neighborhood?.updated_at,
            );
          }
        },
      });

      const notes = [];
      if (variantsSkipped) {
        notes.push(
          "This browser can't create the optimized copies of a new photo, so it will load at full size. Saving from a different browser (e.g. Chrome) avoids that.",
        );
      }
      if (cleanupFailed) {
        notes.push("The replaced photo file could not be deleted from storage.");
      }
      showToast([formState?.mode === "create" ? "Neighborhood added." : "Neighborhood updated.", ...notes].join(" "));
      closeForm();
    } catch (error) {
      const detail = error?.message || error?.error_description || "Unknown error";
      handleSaveError(error, {
        showToast,
        closeForm,
        fallbackMessage: `Something went wrong saving this neighborhood: ${detail}`,
      });
    }
  }

  async function handleDelete() {
    try {
      await deleteNeighborhood(pendingDelete?.id);
      showToast("Neighborhood deleted.");
      setPendingDelete(null);
    } catch (error) {
      console.error(error);
      showToast("Could not delete this neighborhood.", "error");
    }
  }

  async function handleReorderCommit() {
    // Dropping a row back where it started changes nothing — no save, no toast.
    const currentIds = neighborhoods.map((n) => n.id);
    const unchanged =
      orderedIds.length === currentIds.length && orderedIds.every((id, index) => id === currentIds[index]);
    if (unchanged) return;

    try {
      await reorderNeighborhoods(orderedIds);
      showToast("Updated the order.");
    } catch (error) {
      console.error(error);
      // Put the list back the way it was, so the screen doesn't claim an order that wasn't saved.
      setOrderedIds(currentIds);
      showToast("Could not save the new order.", "error");
    }
  }

  const neighborhoodsById = new Map(neighborhoods.map((n) => [n.id, n]));
  const displayedNeighborhoods = orderedIds.map((id) => neighborhoodsById.get(id)).filter(Boolean);

  if (loading) {
    return <ContentSpinner />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Neighborhoods"
        description="Districts shown on the homepage teaser and the public /neighborhoods page. Drag to reorder — the first 3 appear on the homepage."
        actionLabel="Add neighborhood"
        onAction={openCreate}
      />

      {displayedNeighborhoods.length === 0 ? (
        <EmptyState
          icon={IoLocationOutline}
          title="No neighborhoods yet"
          description="Add districts like Malabata or California to showcase on the homepage and their own page."
          action={
            <button
              type="button"
              onClick={openCreate}
              className="rounded-[12px] bg-accent-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-600"
            >
              Add neighborhood
            </button>
          }
        />
      ) : (
        <Reorder.Group axis="y" values={orderedIds} onReorder={setOrderedIds} className="flex flex-col gap-2">
          {displayedNeighborhoods.map((neighborhood) => (
            <NeighborhoodRow
              key={neighborhood.id}
              neighborhood={neighborhood}
              onEdit={openEdit}
              onDelete={setPendingDelete}
              onDragEnd={handleReorderCommit}
            />
          ))}
        </Reorder.Group>
      )}

      <Modal
        isOpen={formState !== null}
        onClose={closeForm}
        title={formState?.mode === "edit" ? "Edit neighborhood" : "Add neighborhood"}
      >
        {formState && (
          <NeighborhoodForm
            key={formState.mode === "edit" ? formState.neighborhood.id : "create"}
            initialNeighborhood={formState.mode === "edit" ? formState.neighborhood : null}
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
            ? `${pendingDeleteUsageCount} propert${pendingDeleteUsageCount === 1 ? "y is" : "ies are"} assigned to this neighborhood. Reassign ${pendingDeleteUsageCount === 1 ? "it" : "them"} to a different neighborhood from the Properties page, then come back to delete this one.`
            : "Removes it from the homepage and the /neighborhoods page. This can't be undone."
        }
        confirmLabel="Delete"
        blocked={isDeleteBlocked}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
