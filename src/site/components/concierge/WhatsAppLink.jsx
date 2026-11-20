import { buildWhatsAppUrl } from "@/site/lib/phoneLinks";

// Fires only if an analytics script is present (GA4 or Plausible).
const track = (label) => {
  if (typeof window === "undefined") return;
  window.gtag?.("event", "whatsapp_click", { event_label: label });
  window.plausible?.("WhatsApp Click", { props: { label } });
};

// Renders nothing until the phone number is available, so there is never a
// broken wa.me link. `phone` must be digits only, with the country code.
function WhatsAppLink({ phone, message, label, className, children }) {
  if (!phone) return null;
  return (
    <a
      href={`${buildWhatsAppUrl(phone)}?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track(label)}
      className={className}
    >
      {children}
      <span className="sr-only"> (opens WhatsApp in a new tab)</span>
    </a>
  );
}

export default WhatsAppLink;
