import { IoChevronDownOutline } from "react-icons/io5";
import { editorControlStyle } from "@/admin/config/editorFieldStyles";

export default function Select({
  id,
  value,
  onChange,
  options,
  placeholder,
  invalid = false,
  required = false,
  variant = "default",
}) {
  const isEditor = variant === "editor";
  const isToolbar = variant === "toolbar";
  const className = isEditor
    ? `${editorControlStyle(invalid)} h-12 appearance-none px-3 pr-10`
    : isToolbar
      ? "h-10 w-full appearance-none rounded-xl border border-accent-500/10 bg-white pl-3 pr-8 text-sm text-secondary transition hover:border-accent-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2"
      : `w-full appearance-none rounded-[12px] border bg-primary-500 px-4 py-3 pr-10 text-main focus-visible:outline-none focus-visible:ring-2 ${
          invalid
            ? "border-error-500/50 focus-visible:ring-error-500"
            : "border-accent-500/10 focus-visible:ring-accent-500"
        }`;

  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-required={required || undefined}
        className={className}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <IoChevronDownOutline
        size={isEditor ? 14 : 16}
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-trenary ${
          isEditor ? "right-3.5" : isToolbar ? "right-2.5" : "right-4"
        }`}
      />
    </div>
  );
}
