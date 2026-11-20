import { useState } from "react";
import { Outlet, useLocation } from "react-router";
import Sidebar from "@/admin/components/Sidebar";
import Topbar from "@/admin/components/Topbar";
import AdminErrorFallback from "@/admin/components/AdminErrorFallback";
import { getPageTitle } from "@/admin/config/navItems";
import ErrorBoundary from "@/shared/components/ErrorBoundary";
import usePageTitle from "@/shared/seo/usePageTitle";

export default function AdminLayout() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const location = useLocation();
  const title = getPageTitle(location.pathname);
  usePageTitle(`Admin — ${title}`);

  return (
    <div className="min-h-dvh bg-primary-500 lg:flex">
      <Sidebar isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} onMenuClick={() => setIsDrawerOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {/* Scoped to the outlet, not the whole shell, so a crash on one
              admin page never takes the sidebar/topbar down with it —
              resetKeys means switching sections always clears a stuck
              fallback, even without the "Try Again" button. */}
          <ErrorBoundary
            resetKeys={[location.pathname]}
            fallback={(error, reset) => <AdminErrorFallback onReset={reset} />}
          >
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
