import { useRef, useState } from "react";
import FormField from "@/admin/components/FormField";
import ModalForm from "@/admin/components/ModalForm";
import PhotoUpload from "@/admin/components/PhotoUpload";

export default function NeighborhoodForm({ initialNeighborhood, onCancel, onSubmit }) {
  const [name, setName] = useState(initialNeighborhood?.name ?? "");
  const [description, setDescription] = useState(initialNeighborhood?.description ?? "");
  const [imageUrl, setImageUrl] = useState(initialNeighborhood?.image_url ?? "");
  const [imageFile, setImageFile] = useState(null);
  const [focal, setFocal] = useState({
    x: initialNeighborhood?.focal_x ?? 0.5,
    y: initialNeighborhood?.focal_y ?? 0.5,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const preserveImageRef = useRef(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;

    const nextErrors = {};
    if (!name.trim()) nextErrors.name = "Give this district a name.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    preserveImageRef.current = true;
    setIsSubmitting(true);
    await onSubmit({
      name: name.trim(),
      description: description.trim(),
      image_url: imageUrl,
      imageFile,
      focal_x: focal.x,
      focal_y: focal.y,
    });
    setIsSubmitting(false);
  }

  return (
    <ModalForm onSubmit={handleSubmit} onCancel={onCancel} isSubmitting={isSubmitting}>
      <div>
        <span className="mb-1.5 block text-sm font-medium text-secondary">Photo</span>
        <PhotoUpload
          value={imageUrl}
          onChange={(url, file) => {
            setImageUrl(url);
            setImageFile(file ?? null);
          }}
          focal={focal}
          onFocalChange={(x, y) => setFocal({ x, y })}
          preserveOnUnmountRef={preserveImageRef}
        />
      </div>

      <FormField
        id="neighborhood-name"
        label="Name"
        type="text"
        value={name}
        onChange={(event) => {
          setName(event.target.value);
          if (errors.name) setErrors((current) => ({ ...current, name: undefined }));
        }}
        placeholder="e.g. Malabata"
        error={errors.name}
      />

      <FormField
        id="neighborhood-description"
        label="Description"
        multiline
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="e.g. Modern luxury with breathtaking Mediterranean views."
        rows={3}
        hint="Shown on the homepage teaser and the district's card — keep it to one short line."
      />
    </ModalForm>
  );
}
