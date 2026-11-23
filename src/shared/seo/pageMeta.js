// The title and meta description of every public page, written once.
//
// Deliberately plain: no imports, no React, no "@/" shortcuts. The pages and
// hooks in src/ read it, and the Netlify edge functions can import it too (they
// run in Deno, which understands none of this project's shortcuts) — so the
// words a crawler sees in the raw HTML are the same words React puts in the tab.
// Change a title or description here and both sides follow.

export const SITE_NAME = "BSI Properties";

// The text of the browser tab / <title>: the page's own title plus the site name.
// usePageTitle (React) and the edge functions both build it here, so the two can
// never drift apart.
export function formatPageTitle(title) {
  return title ? `${title} | ${SITE_NAME}` : SITE_NAME;
}

// The one canonical path of each page below (no trailing slash, except the home page).
export const PAGE_PATHS = {
  home: "/",
  about: "/about",
  contact: "/contact",
  concierge: "/concierge",
  neighborhoods: "/neighborhoods",
  rent: "/properties/rent",
  sale: "/properties/sale",
};

// `title` is the page's own part only; formatPageTitle adds " | BSI Properties".
// `rent` and `sale` are the Browse page (/properties/rent, /properties/sale);
// its title doubles as the page's main heading.
export const PAGE_META = {
  home: {
    title: "Luxury Real Estate in Tangier",
    description:
      "Browse verified villas and apartments for sale and rent in Tangier, Morocco. Curated listings, private concierge service, and 15+ years of local real estate expertise from BSI Properties.",
  },
  about: {
    title: "About Us: Family-Run Real Estate Agency in Tangier",
    description:
      "Family-run since 2011, B.S.I. is Tangier's trusted real estate agency — built on local knowledge, quiet discretion, and personal service.",
  },
  contact: {
    title: "Contact Us",
    description:
      "Get in touch with BSI Properties — reach us by WhatsApp, phone, or email, or visit our office in Tangier, Morocco.",
  },
  concierge: {
    title: "Property Concierge & Management in Tangier",
    description:
      "Property concierge in Tangier for short- and long-term rentals: home care, tenant and guest management, admin support and owner reporting.",
  },
  neighborhoods: {
    title: "Neighborhoods",
    description:
      "Explore Tangier's neighborhoods, from the historic Kasbah to the modern Malabata coastline, and see available properties in each district.",
  },
  rent: {
    title: "Properties for Rent in Tangier",
    description:
      "Browse verified apartments and villas for rent in Tangier. Updated listings across Tangier's finest neighborhoods from BSI Properties.",
  },
  sale: {
    title: "Properties for Sale in Tangier",
    description:
      "Browse verified apartments and villas for sale in Tangier. Updated listings across Tangier's finest neighborhoods from BSI Properties.",
  },
};