import { IoChevronBack, IoChevronForward } from "react-icons/io5";

const ARROW_BUTTON_CLASS =
  "flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-[12px] border border-accent-500/10 bg-white px-2.5 text-sm font-medium text-secondary hover:bg-primary-600 hover:text-accent-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 disabled:pointer-events-none disabled:opacity-50 sm:px-3.5";

const PAGE_BUTTON_CLASS =
  "flex h-10 min-w-10 items-center justify-center rounded-[12px] border px-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500";

// The page numbers to show, as numbers and "…" gaps: always the first page, the
// last page and the current one, with `siblings` pages on each side of it. The
// list keeps the same number of slots wherever you are (7 with one neighbour
// per side, 5 with none), so the row doesn't change width while paging, and
// from page 1 you can reach pages 2–5 directly instead of only the next one.
function getPageItems(page, totalPages, siblings) {
  const range = (from, to) => Array.from({ length: Math.max(to - from + 1, 0) }, (_, index) => from + index);

  const siblingsStart = Math.max(Math.min(page - siblings, totalPages - siblings * 2 - 2), 3);
  const siblingsEnd = Math.min(Math.max(page + siblings, siblings * 2 + 3), totalPages - 2);

  return [
    1,
    ...(siblingsStart > 3 ? ["…"] : totalPages - 1 > 2 ? [2] : []),
    ...range(siblingsStart, siblingsEnd),
    ...(siblingsEnd < totalPages - 2 ? ["…"] : totalPages > 2 ? [totalPages - 1] : []),
    ...(totalPages > 1 ? [totalPages] : []),
  ];
}

function PageButtons({ page, totalPages, siblings, onPageChange, className }) {
  return (
    <div className={className}>
      {getPageItems(page, totalPages, siblings).map((item, index) => {
        if (item === "…") {
          return (
            <span
              key={`gap-${index}`}
              aria-hidden="true"
              className="flex h-10 min-w-6 items-center justify-center text-sm text-trenary"
            >
              …
            </span>
          );
        }

        const isCurrent = item === page;
        return (
          <button
            key={item}
            type="button"
            onClick={() => {
              if (!isCurrent) onPageChange(item);
            }}
            aria-label={`Page ${item}`}
            aria-current={isCurrent ? "page" : undefined}
            className={`${PAGE_BUTTON_CLASS} ${
              isCurrent
                ? "border-accent-500 bg-accent-500 text-white"
                : "border-accent-500/10 bg-white text-secondary hover:bg-primary-600 hover:text-accent-500"
            }`}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}

// Numbered pages with Previous / Next and a "Showing 11–20 of 42" label.
// Renders nothing when everything fits on one page. Two page lists are drawn
// and CSS picks one: a compact list on phones (just the first, current and last
// page) and a wider one from `sm` up (one neighbour on each side of the current
// page), so the row never overflows a narrow screen.
export default function Pagination({ page, totalPages, totalItems, pageSize, onPageChange }) {
  if (totalPages <= 1) return null;

  const firstItem = (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalItems);

  return (
    <nav aria-label="Pagination" className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-trenary">
        Showing {firstItem}–{lastItem} of {totalItems}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className={ARROW_BUTTON_CLASS}
        >
          <IoChevronBack size={16} />
          <span className="hidden sm:inline">Previous</span>
        </button>
        <PageButtons
          page={page}
          totalPages={totalPages}
          siblings={0}
          onPageChange={onPageChange}
          className="flex items-center gap-1 sm:hidden"
        />
        <PageButtons
          page={page}
          totalPages={totalPages}
          siblings={1}
          onPageChange={onPageChange}
          className="hidden items-center gap-1 sm:flex"
        />
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          className={ARROW_BUTTON_CLASS}
        >
          <span className="hidden sm:inline">Next</span>
          <IoChevronForward size={16} />
        </button>
      </div>
    </nav>
  );
}
