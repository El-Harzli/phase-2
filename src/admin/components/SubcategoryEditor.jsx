import { useState } from "react";
import { IoAddOutline, IoCheckmark, IoClose, IoPencilOutline, IoTrashOutline } from "react-icons/io5";
import ConfirmDialog from "@/admin/components/ConfirmDialog";
import { useCatalog } from "@/admin/context/CatalogContext";
import { useProperties } from "@/admin/context/PropertiesContext";
import { useToast } from "@/admin/context/ToastContext";
import { handleSaveError } from "@/admin/lib/handleSaveError";

function SmallIconButton({ label, onClick, disabled, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-secondary hover:bg-primary-600 hover:text-accent-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export default function SubcategoryEditor({ categoryId }) {
  const { getSubcategoriesForCategory, addSubcategory, updateSubcategory, deleteSubcategory } = useCatalog();
  const { getPropertyCountForSubcategory } = useProperties();
  const { showToast } = useToast();

  const subcategories = getSubcategoriesForCategory(categoryId);

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingUpdatedAt, setEditingUpdatedAt] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  // One add or rename at a time: a second click or Enter while one is still
  // saving is ignored.
  const [isSaving, setIsSaving] = useState(false);

  const pendingDeleteUsageCount = pendingDelete ? getPropertyCountForSubcategory(pendingDelete?.id) : 0;
  const isDeleteBlocked = pendingDeleteUsageCount > 0;

  async function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed || isSaving) return;
    setIsSaving(true);
    try {
      await addSubcategory({ category_id: categoryId, name: trimmed });
      setNewName("");
      showToast("Sub-type added.");
    } catch (error) {
      console.error(error);
      showToast("Could not add sub-type.", "error");
    } finally {
      setIsSaving(false);
    }
  }

  function startEditing(subcategory) {
    setEditingId(subcategory.id);
    setEditingName(subcategory.name);
    setEditingUpdatedAt(subcategory.updated_at);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingName("");
    setEditingUpdatedAt(null);
  }

  async function saveEditing() {
    const trimmed = editingName.trim();
    if (!trimmed || isSaving) return;
    setIsSaving(true);
    try {
      await updateSubcategory(editingId, { name: trimmed }, editingUpdatedAt);
      showToast("Sub-type updated.");
      cancelEditing();
    } catch (error) {
      // Nothing left to edit — same cleanup as a normal cancel.
      // Leave editing open — their typed name might still be worth
      // keeping, it's their call whether to reload and reapply.
      // Changed on purpose: a conflict now closes the edit too (saving again can't
      // succeed until a reload, and a renamed sub-type is only a few characters).
      handleSaveError(error, {
        showToast,
        closeForm: cancelEditing,
        closeOnConflict: true,
        fallbackMessage: "Could not update sub-type.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (isDeleteBlocked) return;
    try {
      await deleteSubcategory(pendingDelete?.id);
      showToast("Sub-type deleted.");
      setPendingDelete(null);
    } catch (error) {
      console.error(error);
      showToast("Could not delete sub-type.", "error");
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-secondary">Sub-types</span>
      <p className="mb-3 text-sm text-trenary">
        Optional finer-grained types within this category, e.g. Studio or Penthouse within Apartment.
      </p>

      {subcategories.length === 0 && !newName && (
        <p className="mb-3 text-sm text-trenary">No sub-types yet — add one below if this category needs them.</p>
      )}

      {subcategories.length > 0 && (
        <ul className="mb-3 divide-y divide-accent-500/10 overflow-hidden rounded-[12px] border border-accent-500/10">
          {subcategories.map((subcategory) => (
            <li key={subcategory.id} className="flex items-center gap-2 bg-primary-500 px-3 py-2">
              {editingId === subcategory.id ? (
                <div className="flex flex-1 items-center gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={editingName}
                    onChange={(event) => setEditingName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault(); // Enter would otherwise also submit the surrounding form
                        saveEditing();
                      }
                      if (event.key === "Escape") cancelEditing();
                    }}
                    className="min-w-0 flex-1 rounded-[10px] border border-accent-500/10 bg-white px-3 py-1.5 text-sm text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                  />
                  <SmallIconButton label="Save sub-type name" onClick={saveEditing} disabled={isSaving}>
                    <IoCheckmark size={16} />
                  </SmallIconButton>
                  <SmallIconButton label="Cancel editing" onClick={cancelEditing} disabled={isSaving}>
                    <IoClose size={16} />
                  </SmallIconButton>
                </div>
              ) : (
                <>
                  <p className="flex-1 truncate text-sm text-main">{subcategory.name}</p>
                  <SmallIconButton label={`Rename ${subcategory.name}`} onClick={() => startEditing(subcategory)}>
                    <IoPencilOutline size={14} />
                  </SmallIconButton>
                  <SmallIconButton label={`Delete ${subcategory.name}`} onClick={() => setPendingDelete(subcategory)}>
                    <IoTrashOutline size={14} />
                  </SmallIconButton>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault(); // Enter would otherwise also submit the surrounding form
              handleAdd();
            }
          }}
          placeholder="e.g. Studio"
          className="min-w-0 flex-1 rounded-[12px] border border-accent-500/10 bg-primary-500 px-4 py-2.5 text-sm text-main placeholder:text-trenary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!newName.trim() || isSaving}
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-[12px] bg-accent-500 px-3.5 text-sm font-medium text-white hover:bg-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <IoAddOutline size={16} />
          Add
        </button>
      </div>

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title={isDeleteBlocked ? `Can't delete "${pendingDelete?.name}"` : `Delete "${pendingDelete?.name}"?`}
        description={
          isDeleteBlocked
            ? `${pendingDeleteUsageCount} propert${pendingDeleteUsageCount === 1 ? "y uses" : "ies use"} this sub-type. Change ${pendingDeleteUsageCount === 1 ? "its" : "their"} sub-type from the Properties page, then come back to delete this one.`
            : "This can't be undone."
        }
        confirmLabel="Delete"
        blocked={isDeleteBlocked}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
