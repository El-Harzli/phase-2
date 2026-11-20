import { createContext, useContext } from "react";
import { fetchSiteSettings } from "@/site/api/siteSettings";
import useCachedRequest from "@/site/hooks/useCachedRequest";
import { FALLBACK_SETTINGS } from "@/site/lib/fallbackData";

const SiteSettingsContext = createContext(null);

// Loaded as soon as the site opens, and on its own: it is one tiny row, so
// everything that needs the agency's name, phone or hours (footer, logo, menu,
// contact links) never has to wait for the rest of the site's data. Until it
// arrives — and for good if it fails — FALLBACK_SETTINGS is used, so the
// Call/WhatsApp links, footer identity and Contact page map always work.
// Kept for the whole visit (it never goes old); leaving for the dashboard and
// coming back loads it again, see SiteApp.
const SETTINGS_KEY = "site-settings";

export function SiteSettingsProvider({ children }) {
  const { data } = useCachedRequest(SETTINGS_KEY, fetchSiteSettings);
  const settings = data ?? FALLBACK_SETTINGS;

  return <SiteSettingsContext.Provider value={settings}>{children}</SiteSettingsContext.Provider>;
}

// Returns the settings object itself (never null).
export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    throw new Error("useSiteSettings must be used within a SiteSettingsProvider");
  }
  return context;
}
