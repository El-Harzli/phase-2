import Select from "@/admin/components/Select";
import { EDITOR_LABEL_CLASS } from "@/admin/config/editorFieldStyles";

export default function SelectField({ id, label, required = false, error, hint, variant = "default", ...selectProps }) {
  const isEditor = variant === "editor";

  return (
    <div className={isEditor ? "grid min-w-0 gap-[7px]" : undefined}>
      <label htmlFor={id} className={isEditor ? EDITOR_LABEL_CLASS : "mb-1.5 block text-sm font-medium text-secondary"}>
        {label}
        {required && (
          <>
            {" "}
            <span className="text-error-500" aria-hidden="true">
              *
            </span>
          </>
        )}
      </label>
      <Select id={id} variant={variant} required={required} invalid={Boolean(error)} {...selectProps} />
      {error && <p className={`${isEditor ? "" : "mt-1.5 "}text-sm text-error-500`}>{error}</p>}
      {hint && <p className={`${isEditor ? "text-xs" : "mt-1.5 text-sm"} text-trenary`}>{hint}</p>}
    </div>
  );
}
