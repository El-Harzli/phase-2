import { useState } from "react";

// The two MAD boxes are plain text boxes (digits only) instead of number
// inputs: a number input applied — and clamped — every single keystroke, so
// typing "250000" into a box whose minimum is 5000 snapped back to 5000 at the
// first digit, and a paste it couldn't read counted as empty. Here what you type
// is kept as a draft and applied, clamped to the allowed range, when you leave
// the box or press Enter; an empty or unreadable box just goes back to the
// current value.
function PriceBox({ label, value, onCommit }) {
  const [draft, setDraft] = useState(null);

  const commit = () => {
    if (draft === null) return;
    setDraft(null);
    if (draft === "") return;
    onCommit(Number(draft));
  };

  return (
    <div className="flex items-center gap-1 flex-1 rounded-lg border border-accent-500/10 px-3 py-1.5">
      <span className="text-xs text-secondary/60">MAD</span>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        aria-label={label}
        value={draft ?? String(value)}
        onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className="w-full text-xs text-main outline-none bg-transparent"
      />
    </div>
  );
}

function PriceRangeSlider({ min, max, step, value, onChange }) {
  const [low, high] = value;
  const pct = (v) => ((v - min) / (max - min)) * 100;
  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

  return (
    <div>
      <div className="relative h-1.5 mt-2">
        <div className="absolute inset-0 rounded-full bg-gold-400/25" />
        <div
          className="absolute h-full rounded-full bg-accent-500"
          style={{ left: `${pct(low)}%`, right: `${100 - pct(high)}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={low}
          onChange={(e) => onChange([Math.min(Number(e.target.value), high - step), high])}
          className="range-thumb absolute inset-0 w-full appearance-none bg-transparent pointer-events-none"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={high}
          onChange={(e) => onChange([low, Math.max(Number(e.target.value), low + step)])}
          className="range-thumb absolute inset-0 w-full appearance-none bg-transparent pointer-events-none"
        />
      </div>

      <div className="flex items-center gap-2 mt-4">
        <PriceBox
          label="Minimum price"
          value={low}
          onCommit={(raw) => onChange([clamp(raw, min, high - step), high])}
        />
        <span className="text-gold-500 text-xs">–</span>
        <PriceBox label="Maximum price" value={high} onCommit={(raw) => onChange([low, clamp(raw, low + step, max)])} />
      </div>
    </div>
  );
}

export default PriceRangeSlider;
