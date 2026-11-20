export default function FormSection({ title, description, className = "", children }) {
  return (
    <section
      className={`overflow-hidden rounded-[13px] border border-accent-500/10 bg-white sm:rounded-[15px] sm:shadow-[0_8px_28px_rgba(53,35,42,0.035)] ${className}`}
    >
      <div className="border-b border-accent-500/10 px-4 py-4 sm:px-5 sm:py-[18px]">
        <h3 className="text-base font-semibold tracking-[-0.01em] text-main">{title}</h3>
        <p className="mt-1 max-w-[480px] text-sm leading-snug text-trenary">{description}</p>
      </div>
      {/* minmax(0, 1fr): the column may shrink below its content, so a wide child
          (like the photo strip) scrolls inside itself instead of widening the card. */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 px-4 pb-5 pt-[18px] sm:gap-[18px] sm:px-5 sm:pb-6 sm:pt-[22px]">
        {children}
      </div>
    </section>
  );
}
