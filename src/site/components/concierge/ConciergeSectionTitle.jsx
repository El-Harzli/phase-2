import ConciergeEyebrow from "@/site/components/concierge/ConciergeEyebrow";

function ConciergeSectionTitle({ label, title, text, className = "mb-8 md:mb-11" }) {
  return (
    <div className={`mx-auto max-w-[680px] text-center ${className}`}>
      <ConciergeEyebrow>{label}</ConciergeEyebrow>
      <h2 className="my-4 text-[clamp(32px,3.5vw,52px)] font-semibold leading-[0.98] tracking-[-0.05em] text-main">
        {title}
      </h2>
      <p className="mx-auto max-w-[520px] font-poppins text-[13px] leading-[1.7] text-trenary">{text}</p>
    </div>
  );
}

export default ConciergeSectionTitle;
