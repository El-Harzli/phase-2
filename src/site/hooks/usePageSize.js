import { useSyncExternalStore } from "react";
import { PAGE_SIZE_LARGE, PAGE_SIZE_SMALL } from "@/site/lib/pagination";

// Tailwind's `sm` breakpoint (40rem): the width from which the Browse grid goes
// from one column to two. Kept in step with the `sm:grid-cols-2` in PropertyList.
const WIDE_QUERY = "(min-width: 40rem)";

function subscribe(onChange) {
  const media = window.matchMedia(WIDE_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(WIDE_QUERY).matches;
}

// Without a browser there is no screen to measure; assume the wide layout.
function getServerSnapshot() {
  return true;
}

// How many properties a Browse results page shows on this screen, following it if
// the window is resized or the phone is rotated.
export default function usePageSize() {
  const isWide = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return isWide ? PAGE_SIZE_LARGE : PAGE_SIZE_SMALL;
}