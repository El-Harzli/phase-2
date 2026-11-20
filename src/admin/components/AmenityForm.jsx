import { useState } from "react";
import FormField from "@/admin/components/FormField";
import IconPicker from "@/admin/components/IconPicker";
import ModalForm from "@/admin/components/ModalForm";

export default function AmenityForm({ initialAmenity, onCancel, onSubmit }) {
  const [name, setName] = useState(initialAmenity?.name ?? "");
  const [icon, setIcon] = useState(initialAmenity?.icon ?? "IoSparklesOutline");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;

    if (!name.trim()) {
      setError("Give this amenity a name.");
      return;
    }

    setIsSubmitting(true);
    await onSubmit({ name: name.trim(), icon });
    setIsSubmitting(false);
  }

  return (
    <ModalForm onSubmit={handleSubmit} onCancel={onCancel} isSubmitting={isSubmitting}>
      <FormField
        id="amenity-name"
        label="Name"
        type="text"
        value={name}
        onChange={(event) => {
          setName(event.target.value);
          if (error) setError("");
        }}
        placeholder="e.g. Swimming pool"
        error={error}
      />

      <div>
        <span className="mb-1.5 block text-sm font-medium text-secondary">Icon</span>
        <IconPicker value={icon} onChange={setIcon} />
      </div>
    </ModalForm>
  );
}
