import { IoCalendarOutline } from "react-icons/io5";
import SectionTitle from "@/site/components/property/SectionTitle";
import { CONTACT_EVENT } from "@/shared/config/contactEvents";
import usePropertyContact from "@/site/hooks/usePropertyContact";

// "Schedule a visit": opens a WhatsApp chat with the viewing request written.
function VisitRequestCard({ property, headingTag: SubheadingTag }) {
  const { tourHref, trackContact } = usePropertyContact(property);

  return (
    <div>
      <SectionTitle as={SubheadingTag}>Schedule a visit</SectionTitle>
      <div className="rounded-[20px] border border-accent-500/10 bg-primary-500/60 p-4">
        <p className="text-sm leading-relaxed text-secondary">
          Request a private viewing — the agent will confirm a time with you on WhatsApp.
        </p>
        <a
          href={tourHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackContact(CONTACT_EVENT.TOUR)}
          className="mt-3 flex items-center justify-center gap-2 rounded-[12px] bg-gold-400 px-4 py-3 text-sm font-semibold text-main transition-colors hover:bg-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
        >
          <IoCalendarOutline className="h-4 w-4" />
          Request a Private Tour
        </a>
      </div>
    </div>
  );
}

export default VisitRequestCard;
