// The four values the contact_events table accepts (see its CHECK constraint).
export const CONTACT_EVENT = {
  CALL: "call",
  MESSAGE: "message",
  TOUR: "tour",
  STICKY_CONTACT: "sticky_contact",
};

// The four values contact_events.event_type can hold, in display order.
export const CONTACT_EVENT_TYPES = Object.values(CONTACT_EVENT);
