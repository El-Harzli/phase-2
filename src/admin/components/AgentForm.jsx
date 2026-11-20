import { useRef, useState } from "react";
import AvatarUpload from "@/admin/components/AvatarUpload";
import FormField from "@/admin/components/FormField";
import ModalForm from "@/admin/components/ModalForm";

export default function AgentForm({ initialAgent, onCancel, onSubmit }) {
  const [name, setName] = useState(initialAgent?.name ?? "");
  const [phone, setPhone] = useState(initialAgent?.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialAgent?.avatar_url ?? "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const preserveAvatarRef = useRef(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;

    const nextErrors = {};
    if (!name.trim()) nextErrors.name = "Give this agent a name.";
    if (!phone.trim()) nextErrors.phone = "Add a phone number.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    preserveAvatarRef.current = true;
    setIsSubmitting(true);
    await onSubmit({ name: name.trim(), phone: phone.trim(), avatar_url: avatarUrl, avatarFile });
    setIsSubmitting(false);
  }

  return (
    <ModalForm onSubmit={handleSubmit} onCancel={onCancel} isSubmitting={isSubmitting}>
      <div>
        <span className="mb-1.5 block text-sm font-medium text-secondary">Photo</span>
        <AvatarUpload
          value={avatarUrl}
          onChange={(url, file) => {
            setAvatarUrl(url);
            setAvatarFile(file ?? null);
          }}
          preserveOnUnmountRef={preserveAvatarRef}
        />
      </div>

      <FormField
        id="agent-name"
        label="Name"
        type="text"
        value={name}
        onChange={(event) => {
          setName(event.target.value);
          if (errors.name) setErrors((current) => ({ ...current, name: undefined }));
        }}
        placeholder="e.g. Nizar Tatari"
        error={errors.name}
      />

      <FormField
        id="agent-phone"
        label="Phone"
        type="tel"
        value={phone}
        onChange={(event) => {
          setPhone(event.target.value);
          if (errors.phone) setErrors((current) => ({ ...current, phone: undefined }));
        }}
        placeholder="e.g. +212661234567"
        error={errors.phone}
      />
    </ModalForm>
  );
}
