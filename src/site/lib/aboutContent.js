import { IoShieldCheckmarkOutline, IoLocationOutline, IoHeartOutline } from "react-icons/io5";

/* =========================================================================
   Images
   TODO: like conciergeHero, download these four photos, compress to WebP and
   import them from @assets — self-hosting is faster (LCP) and removes the
   dependency on Unsplash. Until then the helpers below give every <img> a
   proper srcSet so phones don't download desktop-sized files.
   ========================================================================= */
export const unsplash = (id, w, q = 85) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=${q}`;
export const srcSet = (id, widths) => widths.map((w) => `${unsplash(id, w)} ${w}w`).join(", ");

export const IMG = {
  hero: "photo-1765320020091-966fa75d8901",
  storyTall: "photo-1701676639172-421b5e0b148b",
  storyWide: "photo-1750859479417-54383840d7e7",
  approach: "photo-1740602549304-68395f1a58a2",
};

export const PAGE_PATH = "/about";
export const META_DESCRIPTION =
  "Family-run since 2011, B.S.I. is Tangier's trusted real estate agency — built on local knowledge, quiet discretion, and personal service.";

/* =========================================================================
   Content
   ========================================================================= */
export const METRICS = [
  { value: "15+", label: "Years of expertise" },
  { value: "120+", label: "Properties listed" },
  { value: "300+", label: "Happy clients" },
];

export const VALUES = [
  {
    number: "01",
    Icon: IoShieldCheckmarkOutline,
    title: "Trust, made visible",
    body: "Clear advice, personally verified properties, and straightforward conversations. What you see is what you get.",
  },
  {
    number: "02",
    Icon: IoLocationOutline,
    title: "Knowledge that lives here",
    body: "Our understanding of Tangier comes from being part of it—from its changing neighborhoods to the character of each street.",
  },
  {
    number: "03",
    Icon: IoHeartOutline,
    title: "The client comes first",
    body: "Every client receives the time, discretion, and honest attention we would want for a member of our own family.",
  },
];

export const APPROACH = [
  {
    number: "01",
    title: "We listen before we advise",
    body: "Your plans, priorities, and concerns shape the search from the beginning.",
  },
  {
    number: "02",
    title: "We consider every property personally",
    body: "We look beyond photographs and specifications to understand the home, its setting, and its true fit.",
  },
  {
    number: "03",
    title: "We share what only locals know",
    body: "Our recommendations are grounded in real neighborhood knowledge, not a remote database.",
  },
  {
    number: "04",
    title: "We stay beyond the decision",
    body: "Our relationship does not end at a viewing, signature, or set of keys. We remain a trusted point of contact.",
  },
];

// Per-agent intro lines, matched on first name. Agents without an entry get
// DEFAULT_NOTE.
export const AGENT_NOTES = {
  nizar: "A familiar point of contact from the first conversation through every important decision.",
  iyad: "Bringing thoughtful guidance and a clear understanding of Tangier’s property landscape.",
  qucay: "Focused on making each step feel considered, direct, and genuinely personal.",
  oucay: "Focused on making each step feel considered, direct, and genuinely personal.",
};
export const DEFAULT_NOTE =
  "Personally handling every listing and every client, from first conversation to final decision.";

// Portrait backgrounds shown behind the initials (and while a photo loads).
export const PORTRAIT_TONES = [
  "bg-[radial-gradient(circle_at_68%_22%,rgb(255_255_255/0.82),transparent_24%),linear-gradient(145deg,#c9b8ad,#6f5448)]",
  "bg-[radial-gradient(circle_at_28%_24%,rgb(255_255_255/0.82),transparent_25%),linear-gradient(145deg,#a9b3b5,#435457)]",
  "bg-[radial-gradient(circle_at_70%_22%,rgb(255_255_255/0.78),transparent_23%),linear-gradient(145deg,#c4b49a,#675340)]",
];
