export default function SegmentedControl({ options, value, onChange, fullWidth = false, variant = "default" }) {
  if (variant === "editor") {
    return (
      <div
        className="grid rounded-[10px] border border-accent-500/10 bg-primary-500 p-[3px]"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((option) => {
          const isActive = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={isActive}
              className={`h-10 rounded-[7px] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
                isActive
                  ? "bg-accent-500 text-white shadow-[0_2px_7px_rgba(109,33,60,0.15)]"
                  : "text-trenary hover:text-accent-500"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    );
  }

  // The compact tab strip above the properties table. It fills whatever width
  // its parent gives it, and an option can carry a `count` shown beside its label.
  if (variant === "toolbar") {
    return (
      <div
        className="grid h-10 rounded-xl bg-primary-600 p-1"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((option) => {
          const isActive = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={isActive}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
                isActive
                  ? "bg-white text-accent-500 shadow-[0_1px_4px_rgba(40,24,29,0.08)]"
                  : "text-trenary hover:text-accent-500"
              }`}
            >
              {option.label}
              {option.count !== undefined && (
                <span className={`text-[10px] tabular-nums ${isActive ? "text-accent-500/75" : "text-trenary"}`}>
                  {option.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`inline-flex rounded-[12px] border border-accent-500/10 bg-white p-1 ${fullWidth ? "w-full" : ""}`}>
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={isActive}
            className={`rounded-[10px] px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
              fullWidth ? "flex-1" : ""
            } ${isActive ? "bg-accent-500 text-white" : "text-secondary hover:text-accent-500"}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
