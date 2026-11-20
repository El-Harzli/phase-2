import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router";
import { SiteSettingsProvider } from "@/site/context/SiteSettingsProvider";
import { FavoritesProvider } from "@/site/context/FavoritesProvider";
import { LanguageProvider } from "@/site/context/LanguageProvider";
import Header from "@/site/components/Header";
import Footer from "@/site/components/Footer";
import SiteErrorFallback from "@/site/components/SiteErrorFallback";
import NotFoundPage from "@/site/pages/NotFoundPage";
import HomePage from "@/site/pages/HomePage";
import BrowsePage from "@/site/pages/BrowsePage";
import NeighborhoodsPage from "@/site/pages/NeighborhoodsPage";
import ContactPage from "@/site/pages/ContactPage";
import AboutPage from "@/site/pages/AboutPage";
import ConciergePage from "@/site/pages/ConciergePage";
import PropertyDetailPage from "@/site/pages/PropertyDetailPage";
import PropertyOverlayPage from "@/site/pages/PropertyOverlayPage";
import ErrorBoundary from "@/shared/components/ErrorBoundary";
import { clearFavoriteCards } from "@/site/hooks/useFavoriteProperties";
import { clearPreviews } from "@/site/lib/propertyPreviews";
import { clearRequestCache } from "@/site/lib/requestCache";

export default function SiteApp() {
  const location = useLocation();
  // Set when navigating to a property from within the app — by the
  // property cards on Home and Browse (PropertyCard's link), by
  // useOpenProperty (the Favorites panel and the map's preview card on
  // BrowsePage), and by the overlay itself for similar-property clicks —
  // lets the detail route render as a modal on top of the page it was opened
  // from, while still being a real, directly-navigable URL for anyone who
  // lands on it fresh (search engines, shared links, refreshes, "open in new
  // tab").
  const backgroundLocation = location.state?.backgroundLocation;
  const effectivePathname = (backgroundLocation || location).pathname;

  // Client-side navigation doesn't reset scroll position the way a normal
  // page load does — e.g. clicking "View All Properties" from partway down
  // the homepage previously landed on /properties/rent still scrolled to
  // wherever the homepage had been. Keyed on the *effective* pathname
  // (backgroundLocation when set) rather than the raw location, so opening
  // or closing the property overlay never triggers this — only a genuine
  // page change does, which is what should reset scroll.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [effectivePathname]);

  // Leaving the public site (for /admin) unmounts SiteApp. Forgetting what the
  // shared request cache has saved (and the property cards remembered for the
  // overlay and the favorites list) then means coming back through "View Site" loads fresh data — e.g.
  // settings or listings just edited in the dashboard — the same as the old
  // provider's remount did.
  useEffect(
    () => () => {
      clearRequestCache();
      clearPreviews();
      clearFavoriteCards();
    },
    [],
  );

  return (
    <SiteSettingsProvider>
      <FavoritesProvider>
        <LanguageProvider>
          <div className="font-space_grotest">
            <Header />
            {/* Scoped to the routed content, not the whole app, so a crash on
            one page never takes Header (and its nav) down with it —
            resetKeys means navigating to a different page always clears
            a stuck fallback, even without the "Try Again" button. */}
            <ErrorBoundary
              resetKeys={[effectivePathname]}
              fallback={(error, reset) => <SiteErrorFallback onReset={reset} />}
            >
              {/* The public site had no <main> landmark at all before this —
              every page's content just sat in plain <div>s. The overlay
              Routes below stays outside <main> deliberately: it's a
              modal dialog layered on top of the page (see
              PropertyOverlayPage's role="dialog"), not part of the
              document's main content flow. */}
              <main>
                <Routes location={backgroundLocation || location}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/properties" element={<Navigate to="/properties/rent" replace />} />
                  <Route path="/properties/:listingType" element={<BrowsePage />} />
                  <Route path="/property/:id" element={<PropertyDetailPage />} />
                  <Route path="/property/:slug/:id" element={<PropertyDetailPage />} />
                  <Route path="/concierge" element={<ConciergePage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/neighborhoods" element={<NeighborhoodsPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </main>

              {backgroundLocation && (
                <Routes>
                  <Route path="/property/:id" element={<PropertyOverlayPage />} />
                  <Route path="/property/:slug/:id" element={<PropertyOverlayPage />} />
                </Routes>
              )}
            </ErrorBoundary>

            {/* Centralized here rather than imported separately by every
            page — previously Home/About/Concierge/Contact/Neighborhoods
            each rendered their own copy, while BrowsePage,
            PropertyDetailPage, and NotFound had none at all. One
            Footer, rendered once, fixes both: no more per-page
            duplication, and every page now gets one consistently.
            Placed as a sibling of <main> (not nested inside it) since
            that's the correct landmark structure, and outside the
            ErrorBoundary — like Header — so it stays visible even if a
            page's content errors out. */}
            <Footer />
          </div>
        </LanguageProvider>
      </FavoritesProvider>
    </SiteSettingsProvider>
  );
}
