import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { runQueriesWithRetry } from "@/shared/lib/runQueriesWithRetry";
import { fetchSiteSettings, normalizeSiteSettings, updateSiteSettings } from "@/admin/api/siteSettings";
import { useToast } from "@/admin/context/ToastContext";

const SiteSettingsContext = createContext(null);

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      const [{ data, error }] = await runQueriesWithRetry([fetchSiteSettings]);
      if (!active) return;
      if (error) {
        console.error(error);
        showToast("Could not load settings.", "error");
      } else {
        setSettings(normalizeSiteSettings(data));
      }
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [showToast]);

  const updateSettings = useCallback(async (patch, expectedUpdatedAt) => {
    const updated = await updateSiteSettings(patch, expectedUpdatedAt);
    setSettings(updated);
    return updated;
  }, []);

  const value = useMemo(() => ({ settings, loading, updateSettings }), [settings, loading, updateSettings]);

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    throw new Error("useSiteSettings must be used within a SiteSettingsProvider");
  }
  return context;
}
