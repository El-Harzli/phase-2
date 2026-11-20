import { Route, Routes, Navigate } from "react-router";
import { AuthProvider } from "@/admin/context/AuthContext";
import { ToastProvider } from "@/admin/context/ToastContext";
import AdminLayout from "@/admin/layouts/AdminLayout";
import AdminProviders from "@/admin/layouts/AdminProviders";
import ProtectedRoute from "@/admin/layouts/ProtectedRoute";
import AgentsPage from "@/admin/pages/AgentsPage";
import CategoriesPage from "@/admin/pages/CategoriesPage";
import ConveniencesPage from "@/admin/pages/ConveniencesPage";
import FeaturedPage from "@/admin/pages/FeaturedPage";
import LoginPage from "@/admin/pages/LoginPage";
import NeighborhoodsPage from "@/admin/pages/NeighborhoodsPage";
import OverviewPage from "@/admin/pages/OverviewPage";
import PropertiesPage from "@/admin/pages/PropertiesPage";
import PropertyFormPage from "@/admin/pages/PropertyFormPage";
import SettingsPage from "@/admin/pages/SettingsPage";
import useNoIndex from "@/shared/seo/useNoIndex";

// This <Routes> tree matches against the full URL, same as every other
// <Routes> in this app (see App.jsx) — it's only ever rendered when
// location.pathname is already under /admin, so the paths below stay
// exactly as they were when the dashboard was its own standalone project.
export default function AdminApp() {
  useNoIndex();

  return (
    <ToastProvider>
      <AuthProvider>
        <Routes>
          <Route path="/admin/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AdminProviders />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<OverviewPage />} />
                <Route path="properties" element={<PropertiesPage />} />
                <Route path="properties/new" element={<PropertyFormPage />} />
                <Route path="properties/:id/edit" element={<PropertyFormPage />} />
                <Route path="featured" element={<FeaturedPage />} />
                <Route path="neighborhoods" element={<NeighborhoodsPage />} />
                <Route path="agents" element={<AgentsPage />} />
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="conveniences" element={<ConveniencesPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </AuthProvider>
    </ToastProvider>
  );
}
