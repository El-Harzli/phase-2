import { EDITOR_LABEL_CLASS, editorControlStyle } from "@/admin/config/editorFieldStyles";

const cx = (...parts) => parts.filter(Boolean).join(" ");

// `variant="editor"` is the property edit page's look (see editorFieldStyles.js);
// every other form keeps the default look. `suffix` ("MAD", "m²") and `icon`
// only exist in the editor look. `required` adds a red * to the label.
export default function FormField({
  id,
  label,
  optional,
  required,
  error,
  hint,
  hintClassName,
  className,
  multiline,
  variant = "default",
  suffix,
  icon: Icon,
  ...controlProps
}) {
  const isEditor = variant === "editor";

  const controlClassName = isEditor
    ? cx(
        editorControlStyle(Boolean(error)),
        multiline ? "min-h-[120px] resize-y p-3 leading-[1.55] sm:min-h-[136px]" : "h-12 px-3",
        Icon && "pl-10",
        suffix && "pr-14",
      )
    : `w-full ${multiline ? "resize-none " : ""}rounded-[12px] border bg-primary-500 px-4 py-3 text-main placeholder:text-trenary focus-visible:outline-none focus-visible:ring-2 ${
        error
          ? "border-error-500/50 focus-visible:ring-error-500"
          : "border-accent-500/10 focus-visible:ring-accent-500"
      }`;

  const control = multiline ? (
    <textarea id={id} aria-required={required || undefined} {...controlProps} className={controlClassName} />
  ) : (
    <input id={id} aria-required={required || undefined} {...controlProps} className={controlClassName} />
  );

  const field =
    isEditor && (Icon || suffix) ? (
      <span className="relative block">
        {Icon && (
          <Icon size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-trenary" />
        )}
        {control}
        {suffix && (
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-trenary">
            {suffix}
          </span>
        )}
      </span>
    ) : (
      control
    );

  return (
    <div className={cx(isEditor && "grid min-w-0 gap-[7px]", className) || undefined}>
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
        {optional && (
          <>
            {" "}
            <span className="font-normal text-trenary">(optional)</span>
          </>
        )}
      </label>
      {field}
      {error && <p className={cx(isEditor ? "text-sm" : "mt-1.5 text-sm", "text-error-500")}>{error}</p>}
      {hint && <p className={cx("text-xs text-trenary", !isEditor && "mt-1.5", hintClassName)}>{hint}</p>}
    </div>
  );
}
