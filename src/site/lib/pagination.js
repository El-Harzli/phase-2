// How many properties one page of Browse results shows. Phones (below Tailwind's
// `sm`, where the grid is a single column) get a shorter page; from `sm` up the
// grid has two columns and a page is 12. Shared by the grid and list views, so
// switching between them keeps the visitor on the same page. See usePageSize.
export const PAGE_SIZE_SMALL = 8;
export const PAGE_SIZE_LARGE = 12;

// The page buttons to render for `current` out of `total` pages, with "…" where
// pages are skipped: e.g. [1, "…", 4, 5, 6, "…", 12]. Always keeps the first and
// last page and the current page with one neighbour on each side. A gap of
// exactly one page shows that page instead of an ellipsis, which would stand in
// for a single number and save nothing.
export function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const kept = [...new Set([1, total, current - 1, current, current + 1])]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);

  const result = [];
  for (let i = 0; i < kept.length; i++) {
    const page = kept[i];
    const previous = kept[i - 1];
    if (previous !== undefined) {
      if (page - previous === 2) result.push(previous + 1);
      else if (page - previous > 2) result.push("…");
    }
    result.push(page);
  }
  return result;
}