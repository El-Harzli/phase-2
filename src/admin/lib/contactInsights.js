// How this period compares with the one right before it.
//   'none' — nothing in either period (nothing to say)
//   'new'  — clicks now but none before (a percentage would be meaningless —
//            expected for the first weeks after tracking starts)
//   'up' / 'down' / 'flat' — with `percent` as a whole number
export function getTrend(total, previousTotal) {
  if (previousTotal === 0) {
    return { direction: total === 0 ? "none" : "new", percent: 0 };
  }
  const difference = total - previousTotal;
  if (difference === 0) return { direction: "flat", percent: 0 };
  return {
    direction: difference > 0 ? "up" : "down",
    percent: Math.round((Math.abs(difference) / previousTotal) * 100),
  };
}

const WEEKDAY = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const MONTH_DAY = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

// `day` is a plain 'YYYY-MM-DD' date (already in Morocco time, computed by the
// database). It's built from its parts as a local date so the browser's own
// time zone can never shift it by a day.
// style: 'weekday' -> "Mon", anything else -> "Oct 8"
export function formatDayLabel(day, style = "short") {
  const [year, month, date] = String(day).split("-").map(Number);
  if (!year || !month || !date) return String(day);
  const value = new Date(year, month - 1, date);
  return (style === "weekday" ? WEEKDAY : MONTH_DAY).format(value);
}
