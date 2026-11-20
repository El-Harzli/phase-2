import { IoArrowForward } from "react-icons/io5";
import WhatsAppLink from "@/site/components/concierge/WhatsAppLink";
import { BTN_BASE } from "@/site/lib/conciergeStyles";

// "Still have a question?" card. Rendered twice (desktop sidebar / below the
// list on mobile), so it lives here instead of being copy-pasted.
function AskCard({ phone, className = "" }) {
  if (!phone) return null;
  return (
    <div
      className={`rounded-xl border border-[#e5e0dd] bg-white p-6 text-left shadow-[0_5px_14px_rgba(47,35,37,0.04)] ${className}`}
    >
      <h3 className="text-[17px] font-semibold text-main">Still have a question?</h3>
      <p className="mt-2 font-poppins text-[13px] leading-[1.7] text-trenary">
        Message us on WhatsApp and a consultant will get back to you personally.
      </p>
      <WhatsAppLink
        phone={phone}
        label="faq"
        message="Hello, I have a question about your property concierge service in Tangier."
        className={`${BTN_BASE} mt-5 bg-accent-500 text-white`}
      >
        Ask on WhatsApp <IoArrowForward aria-hidden="true" className="size-[15px]" />
      </WhatsAppLink>
    </div>
  );
}

export default AskCard;
