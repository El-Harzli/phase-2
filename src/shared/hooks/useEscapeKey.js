import { useEffect } from "react";

/**
 * Calls `onEscape` when the Escape key is pressed, but only while `isActive`
 * is true — for dialogs, drawers and dropdowns that should close that way.
 *
 * @param {boolean} isActive - whether the thing that should close is open
 * @param {() => void} onEscape - what to do when Escape is pressed
 */
export default function useEscapeKey(isActive, onEscape) {
  useEffect(() => {
    if (!isActive) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onEscape();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isActive, onEscape]);
}
