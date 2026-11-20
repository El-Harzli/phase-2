import { Outlet } from "react-router";
import { AgentsProvider } from "@/admin/context/AgentsContext";
import { CatalogProvider } from "@/admin/context/CatalogContext";
import { NeighborhoodsProvider } from "@/admin/context/NeighborhoodsContext";
import { PropertiesProvider } from "@/admin/context/PropertiesContext";
import { SiteSettingsProvider } from "@/admin/context/SiteSettingsContext";

// Nested only inside ProtectedRoute (see App.jsx) so these providers — and
// the Supabase fetches they kick off on mount — never run before a session
// exists. Fetching earlier would silently return public-only data (RLS
// hides draft properties from anon requests) and go stale after login.
export default function AdminProviders() {
  return (
    <CatalogProvider>
      <AgentsProvider>
        <PropertiesProvider>
          <SiteSettingsProvider>
            <NeighborhoodsProvider>
              <Outlet />
            </NeighborhoodsProvider>
          </SiteSettingsProvider>
        </PropertiesProvider>
      </AgentsProvider>
    </CatalogProvider>
  );
}
