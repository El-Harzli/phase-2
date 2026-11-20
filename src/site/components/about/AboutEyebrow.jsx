// Eyebrow: same look as the Concierge page (bold, wide-tracked, gold rule).
function AboutEyebrow({ children, center = false, light = false }) {
  const line = light ? "bg-gold-400/60" : "bg-gold-500";
  return (
    <span
      className={`flex items-center gap-[9px] text-[10px] font-bold uppercase tracking-[0.25em] ${
        light ? "text-gold-400" : "text-accent-500"
      } ${center ? "md:justify-center" : ""}`}
    >
      {center && <span aria-hidden="true" className={`hidden h-px w-7 md:block ${line}`} />}
      {children}
      <span aria-hidden="true" className={`h-px w-7 ${line}`} />
    </span>
  );
}

export default AboutEyebrow;
