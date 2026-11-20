// Every admin save handler treats a failed save the same way: a row that
// vanished (another admin deleted it) tells you and closes the form; a
// conflict (someone else saved first) tells you and keeps the form open so
// nothing typed is lost; anything else gets the section's generic message.
//
// `closeOnConflict` is for tiny inline edits (like renaming a sub-type): saving
// again can't succeed until the page is reloaded, and there's almost nothing
// typed to lose, so they close instead of staying open.
export function handleSaveError(error, { showToast, closeForm, fallbackMessage, closeOnConflict = false }) {
  console.error(error);
  if (error?.code === "NOT_FOUND") {
    showToast(error.message, "error");
    closeForm();
    return;
  }
  if (error?.code === "CONFLICT") {
    showToast(error.message, "error");
    if (closeOnConflict) closeForm();
    return;
  }
  showToast(fallbackMessage, "error");
}
