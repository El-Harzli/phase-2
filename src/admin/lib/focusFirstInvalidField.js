// On a failed submit: scrolls the first invalid field (by on-screen order, not
// by the order the errors were found) to the centre of the screen — centred so
// the sticky topbar never covers it — and focuses it without a second scroll.
// `fieldOrder` is a list of { key, id }: the error key and the input's DOM id.
export function focusFirstInvalidField(fieldOrder, errors) {
  const firstInvalidField = fieldOrder.find((field) => errors[field.key]);
  const fieldElement = firstInvalidField ? document.getElementById(firstInvalidField.id) : null;
  fieldElement?.scrollIntoView({ behavior: "smooth", block: "center" });
  fieldElement?.focus({ preventScroll: true });
}
