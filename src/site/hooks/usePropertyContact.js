import { useSiteSettings } from "@/site/context/SiteSettingsProvider";
import { trackContactEvent } from "@/site/api/trackContactEvent";
import { buildAgentCallUrl, buildPropertyWhatsAppUrl, buildTourRequestUrl } from "@/site/lib/propertyContactLinks";

// The call / WhatsApp / tour links for one listing (the agent's number, or the
// agency's when the agent has none) and the click tracker that goes with them.
// Shared by the agent card, the "Schedule a visit" card and the sticky mobile bar.
export default function usePropertyContact(property) {
  const settings = useSiteSettings();
  const agent = property.agent;

  // Logs one anonymous click on a contact action (Call Agent, Message,
  // Request a Private Tour, or the sticky mobile bar). Fire-and-forget — see
  // site/api/trackContactEvent.js: it can't throw or delay the link, so each link's
  // normal behaviour (dialling / opening WhatsApp) is untouched. A listing
  // without a real agent has agent.id null; the helper handles that.
  const trackContact = (eventType) => trackContactEvent({ propertyId: property.id, agentId: agent.id, eventType });

  return {
    whatsappHref: buildPropertyWhatsAppUrl(property.title, agent.phone, settings.phone_number),
    tourHref: buildTourRequestUrl(property.title, agent.phone, settings.phone_number),
    telHref: buildAgentCallUrl(agent.phone, settings.phone_number),
    trackContact,
  };
}
