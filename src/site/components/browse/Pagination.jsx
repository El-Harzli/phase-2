import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { getPageNumbers } from "@/site/lib/pagination";

// Same look as the filter button and the view toggle in PropertyList, so the
// controls blend in: a 44px bordered square, accent-filled for the current page.
const BUTTON_CLASSES =
  "w-11 h-11 shrink-0 rounded-[12px] border flex items-center justify-center text-sm font-medium transition-colors";
const IDLE_CLASSES = "border-accent-500/10 bg-white text-secondary hover:border-accent-500/30 hover:text-accent-500";
const CURRENT_CLASSES = "border-accent-500 bg-accent-500 text-white";
const DISABLED_CLASSES = "disabled:opacity-40 disabled:pointer-events-none";

// Only the controls — no state. The page lives in the URL (see useBrowseFilters)
// and the parent passes it in. Renders nothing when there is a single page, so
// short result lists look exactly as they did before pagination.
//
// Below `sm`: Prev · "Page 3 of 9" · Next. From `sm` up: Prev, numbered pages
// with "…" for skipped ones, Next.
function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="mt-6 flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className={`${BUTTON_CLASSES} ${IDLE_CLASSES} ${DISABLED_CLASSES}`}
      >
        <IoChevronBack className="w-5 h-5" />
      </button>

      <span className="sm:hidden px-3 text-sm text-secondary">
        Page {page} of {totalPages}
      </span>

      <div className="hidden sm:flex items-center gap-2">
        {getPageNumbers(page, totalPages).map((item, index) =>
          item === "…" ? (
            // The "…" can appear twice, so the key is its position, not its value.
            <span key={`gap-${index}`} aria-hidden="true" className="w-6 text-center text-sm text-secondary/50">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              aria-label={`Page ${item}`}
              aria-current={item === page ? "page" : undefined}
              className={`${BUTTON_CLASSES} ${item === page ? CURRENT_CLASSES : IDLE_CLASSES}`}
            >
              {item}
            </button>
          ),
        )}
      </div>

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className={`${BUTTON_CLASSES} ${IDLE_CLASSES} ${DISABLED_CLASSES}`}
      >
        <IoChevronForward className="w-5 h-5" />
      </button>
    </nav>
  );
}

export default Pagination;