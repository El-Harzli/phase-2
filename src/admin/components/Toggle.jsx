export default function Toggle({ checked, onChange, label, compact = false }) {
  const track = compact ? "h-6 w-[42px]" : "h-7 w-12";
  const knob = compact ? "h-[18px] w-[18px]" : "h-5 w-5";
  const knobOn = compact ? "translate-x-[21px]" : "translate-x-6";
  const knobOff = compact ? "translate-x-[3px]" : "translate-x-1";
  const trackOff = compact ? "bg-[#dfdada]" : "bg-primary-600";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${track} ${
        checked ? "bg-accent-500" : trackOff
      }`}
    >
      <span
        className={`inline-block transform rounded-full bg-white shadow transition-transform ${knob} ${
          checked ? knobOn : knobOff
        }`}
      />
    </button>
  );
}
