import { IoBusinessOutline } from "react-icons/io5";
import { percentOf } from "@/admin/lib/overviewStats";

export default function CategoryBreakdown({ breakdown, total }) {
  const topCategory = breakdown[0];

  return (
    <div className="overflow-hidden rounded-[16px] border border-accent-500/10 bg-white shadow-[0_9px_28px_rgba(53,35,42,0.045)]">
      <div className="flex items-center justify-between gap-4 border-b border-accent-500/10 px-5 py-4 sm:px-6">
        <div>
          <h3 className="text-[15px] font-semibold tracking-tight text-main">Listings by category</h3>
          <p className="mt-0.5 hidden text-xs text-trenary sm:block">Portfolio distribution</p>
        </div>
        {total > 0 && (
          <span className="shrink-0 rounded-full bg-primary-600 px-2.5 py-1 text-[11px] text-trenary">
            {total} total
          </span>
        )}
      </div>

      <div className="p-5 sm:p-6">
        {breakdown.length === 0 ? (
          <p className="text-sm text-trenary">No properties yet.</p>
        ) : (
          <>
            <div className="space-y-5">
              {breakdown.map((category) => {
                const pct = percentOf(category.count, total);
                return (
                  <div key={category.id}>
                    <div className="mb-2 flex items-center gap-3 text-sm">
                      <span className="min-w-0 flex-1 truncate font-medium text-main">{category.name}</span>
                      <span className="shrink-0 text-xs text-trenary">
                        {category.count} {category.count === 1 ? "listing" : "listings"}
                      </span>
                      <span className="w-9 shrink-0 text-right text-xs font-semibold text-accent-500">{pct}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-primary-600">
                      <div className="h-full rounded-full bg-accent-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {topCategory && (
              <div className="mt-6 flex items-start gap-3 rounded-[10px] bg-primary-500 p-3.5">
                <IoBusinessOutline size={18} className="mt-0.5 shrink-0 text-accent-500" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-main">
                    {topCategory.name} is your largest category
                  </p>
                  <p className="mt-0.5 text-xs text-trenary">
                    {topCategory.count} of {total} listings · {percentOf(topCategory.count, total)}%
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
