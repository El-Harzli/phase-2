export const FALLBACK_AGENT = {
  id: null,
  name: "Agency team",
  rating: 0,
  reviews: 0,
  avatar: "https://images.pexels.com/photos/28442318/pexels-photo-28442318.jpeg?auto=compress&cs=tinysrgb&h=120&w=120",
  phone: "",
};

// Used only if the site_settings row itself fails to load — see
// SiteSettingsProvider and fetchSiteSettings, which treat it as non-critical
// (the failure is only logged). Keeps
// the Call/WhatsApp links, footer identity, and Contact page map across
// the site working with real values rather than breaking outright on a
// settings fetch hiccup.
export const FALLBACK_SETTINGS = {
  phone_number: "212645234175",
  phone_display: "+212 (0) 645 23 41 75",
  agency_name: "BSI Properties",
  email: "hello@bsiproperties.ma",
  instagram_url: "https://www.instagram.com/b.s.i_properties/",
  instagram_handle: "@bsiproperties",
  linkedin_url: "",
  address: "Tangier, Morocco",
  office_lat: 35.7595,
  office_lng: -5.834,
};
