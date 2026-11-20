const eyebrowCls = "flex items-center gap-[9px] text-[10px] font-bold uppercase tracking-[0.25em] text-accent-500";
const lineCls = "h-px w-7 bg-gold-500";

function ConciergeEyebrow({ children, left = false, className = "" }) {
  return (
    <span className={`${eyebrowCls} ${left ? "justify-center lg:justify-start" : "justify-center"} ${className}`}>
      <span aria-hidden="true" className={`${lineCls} ${left ? "lg:hidden" : ""}`} />
      {children}
      <span aria-hidden="true" className={lineCls} />
    </span>
  );
}

export default ConciergeEyebrow;
