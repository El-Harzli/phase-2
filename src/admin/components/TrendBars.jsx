import { formatDayLabel } from "@/admin/lib/contactInsights";

// Contacts per day as plain CSS bars (no chart library). Each bar is scaled to
// the busiest day in the period; days with nothing show a thin baseline so
// gaps are visible. Dashed gridlines mark the scale, and the busiest day gets
// a count label. Hover a bar for its exact date and count.
export default function TrendBars({ daily }) {
  const max = Math.max(1, ...daily.map((row) => row.count));
  const peakIndex = daily.findIndex((row) => row.count === max);
  const last = daily.length - 1;
  const dense = daily.length > 10;

  // Only add a midpoint line when it lands on a whole number, so the scale
  // never shows a rounded label that doesn't match its line.
  const ticks = max >= 4 && max % 2 === 0 ? [max, max / 2, 0] : [max, 0];

  // Seven days: label every bar with its weekday. Thirty: only a few dates,
  // otherwise the labels run into each other.
  const showLabel = (index) => !dense || index === 0 || index === last || (index % 7 === 0 && last - index >= 4);

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-trenary">
        <span>Contacts per day</span>
        <span className="font-semibold text-accent-500">Peak {max}</span>
      </div>

      <div
        className="relative mt-7 h-32 pl-6 sm:h-36"
        role="img"
        aria-label={`Contacts per day over the last ${daily.length} days, busiest day ${max}`}
      >
        {ticks.map((tick) => (
          <div
            key={tick}
            className="pointer-events-none absolute left-6 right-0 border-t border-dashed border-accent-500/15"
            style={{ top: `${(1 - tick / max) * 100}%` }}
          >
            <span className="absolute right-full top-0 -translate-y-1/2 pr-2 text-[10px] tabular-nums text-trenary/70">
              {tick}
            </span>
          </div>
        ))}

        <div className="relative flex h-full items-end gap-[3px]">
          {daily.map(({ day, count }, index) => (
            <div
              key={day}
              title={`${formatDayLabel(day)}: ${count} ${count === 1 ? "contact" : "contacts"}`}
              className="flex h-full min-w-0 flex-1 items-end"
            >
              <div
                className={`relative mx-auto w-full max-w-[56px] rounded-t-[6px] transition-colors ${
                  count > 0 ? "bg-accent-500 hover:bg-accent-600" : "bg-primary-600"
                }`}
                style={{ height: count > 0 ? `${Math.max(6, (count / max) * 100)}%` : "3px" }}
              >
                {count > 0 && index === peakIndex && (
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 rounded-[5px] bg-accent-500/10 px-1.5 py-0.5 text-[10px] font-bold text-accent-500">
                    {count}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2 flex gap-[3px] pl-6 text-[10px] text-trenary sm:text-[11px]" aria-hidden="true">
        {daily.map(({ day }, index) => (
          <div key={day} className="relative h-3 min-w-0 flex-1">
            {showLabel(index) && (
              <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
                {formatDayLabel(day, dense ? "short" : "weekday")}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
