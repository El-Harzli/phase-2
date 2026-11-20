import { lazy, Suspense } from "react";
import { useLocation } from "react-router";
import FullScreenSpinner from "@/shared/components/FullScreenSpinner";
import SiteApp from "@/site/SiteApp";

// Lazy-loaded on purpose: this pulls in the entire admin dashboard (every
// Dashboard/* page, React Compiler's runtime, Framer Motion's Reorder,
// etc.) — none of which a public visitor should ever have to download just
// to browse listings. This single change means that code is now its own
// chunk, only fetched when someone actually navigates to /admin.
const AdminApp = lazy(() => import("@/admin/AdminApp"));

// The dashboard's own routes were already written as absolute "/admin/..."
// paths from day one (see its App.jsx history), so AdminApp's <Routes>
// matches correctly no matter where in the tree it's rendered — no nested
// route/Outlet wiring needed here. This just decides WHICH app owns the
// current URL and renders that one, with its own chrome: the admin
// dashboard has its own sidebar/topbar (and its own Poppins-based type,
// via the body-level default in index.css) and shouldn't inherit the
// public site's Header or Space Grotesk font.
function isAdminPath(pathname) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function App() {
  const location = useLocation();
  return isAdminPath(location.pathname) ? (
    <Suspense fallback={<FullScreenSpinner />}>
      <AdminApp />
    </Suspense>
  ) : (
    <SiteApp />
  );
}

export default App;
