import { CONTACT_EVENT } from "@/shared/config/contactEvents";
import usePropertyContact from "@/site/hooks/usePropertyContact";
import { formatPrice } from "@/site/lib/formatPrice";

// Mobile only: price + a contact button always within reach.
function StickyContactBar({ property }) {
  const { whatsappHref, trackContact } = usePropertyContact(property);
  const isRent = property.listingType === "rent";

  // Mobile only: price + contact always within reach. Sticky (not fixed) so it lives inside this card and ends where the card ends.
  return (
    <div className="sticky bottom-0 z-20 flex items-center justify-between gap-4 border-t border-accent-500/10 bg-white/95 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
      <div className="min-w-0">
        <p className="truncate text-xl font-bold leading-tight text-accent-500">{formatPrice(property.price)}</p>
        {isRent && <p className="text-xs text-secondary/70">per month</p>}
      </div>
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackContact(CONTACT_EVENT.STICKY_CONTACT)}
        className="shrink-0 rounded-[12px] bg-accent-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2"
      >
        Contact Agent
      </a>
    </div>
  );
}

export default StickyContactBar;
