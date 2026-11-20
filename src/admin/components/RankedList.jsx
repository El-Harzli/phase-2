// A short leaderboard: rank, name, a count, and a bar scaled to the top row. A
// row with an `onClick` is a button (used for properties, which open their edit
// page); rows without one are plain.
export default function RankedList({ title, rows, emptyText }) {
  const max = Math.max(1, ...rows.map((row) => row.count));

  return (
    <div className="rounded-[12px] border border-accent-500/10 p-4 sm:p-5">
      <h4 className="text-[13px] font-semibold text-main">{title}</h4>

      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-trenary">{emptyText}</p>
      ) : (
        <ol className="mt-4 space-y-3.5">
          {rows.map((row, index) => {
            const content = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={`truncate text-[13px] font-medium ${row.muted ? "text-trenary" : "text-main"}`}>
                      {row.name}
                    </p>
                    {row.subtitle && <p className="truncate text-xs text-trenary">{row.subtitle}</p>}
                  </div>
                  <span className="shrink-0 text-[13px] font-semibold text-accent-500">{row.count}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-primary-600">
                  <div className="h-full rounded-full bg-accent-500" style={{ width: `${(row.count / max) * 100}%` }} />
                </div>
              </>
            );

            return (
              <li key={row.key} className="flex gap-2">
                <span className="w-5 shrink-0 pt-0.5 font-anonymous text-[11px] text-trenary/60" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {row.onClick ? (
                  <button
                    type="button"
                    onClick={row.onClick}
                    className="block min-w-0 flex-1 rounded-[10px] text-left transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                  >
                    {content}
                  </button>
                ) : (
                  <div className="min-w-0 flex-1">{content}</div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
