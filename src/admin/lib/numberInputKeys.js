// <input type="number"> lets you type "e", "+", "-" and "." — and treats
// "1e23" as a valid number. These keys are blocked while typing;
// validateSettingsForm re-checks the value, so a paste can't sneak one in.
export function blockNonWholeNumberKeys(event) {
  if (["e", "E", "+", "-", "."].includes(event.key)) event.preventDefault();
}

export function blockExponentAndPlusKeys(event) {
  if (["e", "E", "+"].includes(event.key)) event.preventDefault();
}
