import {
  IoHomeOutline,
  IoKeyOutline,
  IoPeopleOutline,
  IoDocumentTextOutline,
  IoMegaphoneOutline,
  IoBarChartOutline,
  IoLocationOutline,
  IoSwapHorizontalOutline,
} from "react-icons/io5";

// TODO: download these two photos, compress to WebP and import them from
// @assets like conciergeHero was — self-hosting is faster (LCP) and removes
// the dependency on Unsplash.
export const heroImg = (w) =>
  `https://images.unsplash.com/photo-1697291302946-60103b3dd3e3?auto=format&fit=crop&w=${w}&q=85`;
export const COAST_IMG =
  "https://images.unsplash.com/photo-1758039761011-c3705d46f752?auto=format&fit=crop&w=1600&q=86";

export const PAGE_PATH = "/concierge";

export const TRUST = [
  { Icon: IoLocationOutline, title: "Local presence", text: "Based in Tangier" },
  { Icon: IoPeopleOutline, title: "One point of contact", text: "Personal service" },
  { Icon: IoSwapHorizontalOutline, title: "Short & long-term", text: "Both rental types managed" },
];

export const SERVICES = [
  {
    Icon: IoKeyOutline,
    title: "Short & long-term rental management",
    text: "Guest stays or long-term tenants — communication, check-ins, housekeeping coordination and rent follow-up.",
  },
  {
    Icon: IoHomeOutline,
    title: "Property care",
    text: "Routine home checks, maintenance follow-up and seasonal preparation, occupied or not.",
  },
  {
    Icon: IoPeopleOutline,
    title: "Tenant & guest management",
    text: "Reference checks for tenants, plus warm arrivals and key handovers for guests.",
  },
  {
    Icon: IoDocumentTextOutline,
    title: "Administrative support",
    text: "Local guidance on contracts, permits, utilities and ownership paperwork, with trusted suppliers.",
  },
  {
    Icon: IoMegaphoneOutline,
    title: "Marketing & listing",
    text: "Presentation, photography coordination and listing support designed to attract the right tenants and guests.",
  },
  {
    Icon: IoBarChartOutline,
    title: "Owner reporting",
    text: "Clear updates, expense visibility and one dedicated contact who knows your property.",
  },
];

export const STEPS = [
  {
    number: "01",
    title: "Consultation",
    text: "We learn about your property, your goals and what “taken care of” means to you.",
  },
  {
    number: "02",
    title: "Property visit",
    text: "We assess the home, document priorities and identify its day-to-day needs.",
  },
  {
    number: "03",
    title: "Tailored proposal",
    text: "You receive a clear service plan built around your property — not a generic package.",
  },
  {
    number: "04",
    title: "Ongoing care",
    text: "Your dedicated contact coordinates the details and keeps you informed.",
  },
];

export const AREAS = [
  ["Malabata", "Seafront apartments and holiday lets"],
  ["Iberia", "Quiet residential streets"],
  ["Marshan", "Central, well-connected homes"],
  ["California", "Residential villas and apartments"],
  ["Medina", "Historic houses and riads"],
  ["City Centre", "Apartments close to everything"],
];

export const FAQS = [
  [
    "What does a property concierge in Tangier do?",
    "A property concierge looks after the day-to-day needs of a home and its owner. Depending on your plan, this can include home checks, guest arrivals, tenant follow-up, housekeeping, maintenance, rental support and owner reporting.",
  ],
  [
    "Can you manage my property while I live abroad?",
    "Yes. The service is designed for remote owners who need a trusted local point of contact in Tangier, with regular updates and a plan tailored to the property.",
  ],
  [
    "Do you manage both short-term and long-term rentals?",
    "Yes. For short stays we coordinate guest communication, arrivals, departures, cleaning, linen and maintenance. For long-term rentals we handle tenant screening, move-in, rent follow-up and ongoing upkeep.",
  ],
  [
    "Which areas of Tangier do you cover?",
    "We serve central Tangier and key residential areas including Malabata, Iberia, Marshan, California and the Medina, as well as surrounding neighborhoods. If yours isn't listed, ask us.",
  ],
  [
    "Is the service available in English, French and Arabic?",
    "Yes. We support international and local owners in English, French and Arabic.",
  ],
  [
    "How much does a property concierge service cost?",
    "It depends on the property and the services you choose, which is why we don't publish generic packages. After a short consultation and a visit, you receive a clear written proposal.",
  ],
  [
    "Who has access to my keys and my property?",
    "Access is agreed with you up front. Keys are only handed to people you have authorized, and we keep you informed whenever someone enters the property on your behalf.",
  ],
  [
    "What happens if something is damaged or needs repair?",
    "We document the condition of the property at check-ins, check-outs and inspections. If something needs repair, we report it to you, share the cost and coordinate trusted suppliers — nothing is done without your approval.",
  ],
];
