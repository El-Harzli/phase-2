import { useState } from "react";
import AmenityMultiSelect from "@/admin/components/AmenityMultiSelect";
import FormField from "@/admin/components/FormField";
import IconPicker from "@/admin/components/IconPicker";
import ModalForm from "@/admin/components/ModalForm";
import SubcategoryEditor from "@/admin/components/SubcategoryEditor";
import Toggle from "@/admin/components/Toggle";

export default function CategoryForm({ initialCategory, initialAmenityIds, amenities, onCancel, onSubmit }) {
  const [name, setName] = useState(initialCategory?.name ?? "");
  const [icon, setIcon] = useState(initialCategory?.icon ?? "IoHomeOutline");
  const [roomsFilterEnabled, setRoomsFilterEnabled] = useState(initialCategory?.rooms_filter_enabled ?? true);
  const [amenityIds, setAmenityIds] = useState(initialAmenityIds);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleAmenity(id) {
    setAmenityIds((current) =>
      current.includes(id) ? current.filter((existing) => existing !== id) : [...current, id],
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;

    if (!name.trim()) {
      setError("Give this category a name.");
      return;
    }

    setIsSubmitting(true);
    await onSubmit({ name: name.trim(), icon, rooms_filter_enabled: roomsFilterEnabled, amenityIds });
    setIsSubmitting(false);
  }

  return (
    <ModalForm onSubmit={handleSubmit} onCancel={onCancel} isSubmitting={isSubmitting}>
      <FormField
        id="category-name"
        label="Name"
        type="text"
        value={name}
        onChange={(event) => {
          setName(event.target.value);
          if (error) setError("");
        }}
        placeholder="e.g. Villa"
        error={error}
      />

      <div>
        <span className="mb-1.5 block text-sm font-medium text-secondary">Icon</span>
        <IconPicker value={icon} onChange={setIcon} />
      </div>

      {initialCategory ? (
        <SubcategoryEditor categoryId={initialCategory?.id} />
      ) : (
        <div className="rounded-[16px] border border-dashed border-accent-500/20 px-4 py-3.5">
          <p className="text-sm font-medium text-main">Sub-types</p>
          <p className="mt-1 text-sm text-trenary">
            Save this category first, then reopen it here to add sub-types like Studio or Penthouse.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between rounded-[16px] border border-accent-500/10 px-4 py-3.5">
        <div className="pr-4">
          <p className="text-sm font-medium text-main">Rooms filter</p>
          <p className="text-sm text-trenary">Show a &quot;rooms&quot; filter for this category on the public site.</p>
        </div>
        <Toggle checked={roomsFilterEnabled} onChange={setRoomsFilterEnabled} label="Rooms filter" />
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-medium text-secondary">Applicable amenities</span>
        <p className="mb-3 text-sm text-trenary">
          Only amenities selected here will be offered as filters for this category on the public site.
        </p>
        <AmenityMultiSelect
          amenities={amenities}
          selectedIds={amenityIds}
          onToggle={toggleAmenity}
          emptyMessage="Add amenities in Conveniences first, then come back to assign them here."
        />
      </div>
    </ModalForm>
  );
}
