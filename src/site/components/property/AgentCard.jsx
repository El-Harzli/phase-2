import { IoCallOutline, IoChatbubbleOutline, IoStar, IoStarOutline } from "react-icons/io5";
import SectionTitle from "@/site/components/property/SectionTitle";
import { CONTACT_EVENT } from "@/shared/config/contactEvents";
import usePropertyContact from "@/site/hooks/usePropertyContact";
import usePropertyCounts from "@/site/hooks/usePropertyCounts";
import { onImgError } from "@/site/lib/fallbackImage";

// "Listed by": the listing's agent, with a Call and a Message button.
function AgentCard({ property, headingTag: SubheadingTag }) {
  const agent = property.agent;
  const { telHref, whatsappHref, trackContact } = usePropertyContact(property);
  const filledStars = Math.round(Number(agent.rating) || 0);

  // From the shared counts request, not from the properties. null while it isn't
  // known (loading, or it failed), and the line below only shows above 0.
  const { getListingCountForAgent } = usePropertyCounts();
  const agentId = property.agent?.id;
  const agentListingCount = agentId ? getListingCountForAgent(agentId) : 0;

  return (
    <div>
      <SectionTitle as={SubheadingTag}>Listed by</SectionTitle>
      <address className="not-italic rounded-[20px] border border-accent-500/10 bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3">
          {/* A plain <img> on purpose: avatars are small circles and
                      have no resized copies (see shared/uploadFile.js), so
                      ResponsiveImage would only ask for files that don't exist. */}
          <img
            src={agent.avatar}
            alt={agent.name}
            onError={onImgError}
            className="h-14 w-14 shrink-0 rounded-full border-2 border-gold-400/60 object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-main">{agent.name}</p>
            {agent.reviews > 0 && (
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-secondary/70">
                <span className="flex text-gold-500" aria-hidden="true">
                  {[0, 1, 2, 3, 4].map((i) =>
                    i < filledStars ? (
                      <IoStar key={i} className="h-3.5 w-3.5" />
                    ) : (
                      <IoStarOutline key={i} className="h-3.5 w-3.5" />
                    ),
                  )}
                </span>
                {agent.rating} · {agent.reviews} {agent.reviews === 1 ? "review" : "reviews"}
              </p>
            )}
            {agentListingCount > 0 && (
              <p className="mt-0.5 text-xs text-secondary/70">
                {agentListingCount} {agentListingCount === 1 ? "listing" : "listings"}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <a
            href={telHref}
            onClick={() => trackContact(CONTACT_EVENT.CALL)}
            className="flex items-center justify-center gap-2 rounded-[12px] bg-accent-500 px-3 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2"
          >
            <IoCallOutline className="h-4 w-4" />
            Call Agent
          </a>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackContact(CONTACT_EVENT.MESSAGE)}
            className="flex items-center justify-center gap-2 rounded-[12px] border border-accent-500 px-3 py-3 text-sm font-semibold text-accent-500 transition-colors hover:bg-accent-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2"
          >
            <IoChatbubbleOutline className="h-4 w-4" />
            Message
          </a>
        </div>
      </address>
    </div>
  );
}

export default AgentCard;
