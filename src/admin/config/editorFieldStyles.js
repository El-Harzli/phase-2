// The look of form controls on the property edit page (the "editor" design):
// 48px tall, 9px corners, a warm off-white fill and a soft burgundy ring on
// focus. Text sizes match the rest of the admin (14px labels, 16px inputs).
// Shared by FormField, Select and the map's address search so those three
// can't drift apart.
export function editorControlStyle(invalid) {
  return `w-full rounded-[9px] border bg-[#fdfcfc] text-base text-main placeholder:text-trenary transition-[border-color,background-color,box-shadow] duration-150 focus:bg-white focus:outline-none focus:ring-[3px] ${
    invalid
      ? "border-error-500/50 focus:border-error-500 focus:ring-error-500/15"
      : "border-accent-500/10 hover:border-accent-500/25 focus:border-accent-500 focus:ring-accent-500/10"
  }`;
}

export const EDITOR_LABEL_CLASS = "text-sm font-medium text-secondary";
