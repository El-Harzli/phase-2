import { useId, useMemo } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router";
import PropertyDetail from "@/site/components/property/PropertyDetail";
import Spinner from "@/shared/components/Spinner";
import { buildPropertyUrl } from "@/shared/lib/propertyUrl";
import useBodyScrollLock from "@/shared/hooks/useBodyScrollLock";
import useEscapeKey from "@/shared/hooks/useEscapeKey";
import usePageTitle from "@/shared/seo/usePageTitle";
import { useFavorites } from "@/site/context/FavoritesProvider";
import usePropertyRoute from "@/site/hooks/usePropertyRoute";
import { previewToProperty } from "@/site/lib/propertyPreviews";

const NO_SIMILAR_PROPERTIES = [];

// The property as a dialog on top of the page it was opened from (the page
// stays rendered underneath — see SiteApp). Same detail view as the full page.
function PropertyOverlayPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const titleId = useId();
  const { favorites, toggleFavorite } = useFavorites();
  const { property, preview, similarProperties, loading, error, reload, goBack: close } = usePropertyRoute();
  usePageTitle(property?.title);
  // What this property's card already showed (from Browse, Home's featured list or
  // a similar list), dressed up as a property — null when it was never on a card
  // (a direct link, a new tab).
  const previewProperty = useMemo(() => (preview ? previewToProperty(preview) : null), [preview]);

  // Always a true modal on top of the browse page underneath, regardless
  // of screen size, so it always locks scroll (unlike the old inline-panel
  // version, which was only a real overlay below lg).
  useBodyScrollLock(true);

  useEscapeKey(true, close);

  // The full property is here once it has arrived and nothing it needs is still
  // loading. Until then, if the property was on a card we show that card's data
  // straight away with placeholders for the rest, and "Couldn't load all details" if
  // the request failed — never a blank. Without a card (someone opened a
  // /property/:id link directly) it is a plain spinner, and waiting rather than
  // bouncing to the "not found" fallback prematurely.
  const detailsReady = Boolean(property) && !loading;
  if (!detailsReady && !(previewProperty && (loading || error))) {
    if (loading) {
      return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-main/60 backdrop-blur-sm">
          <Spinner className="h-8 w-8 border-white/30 border-t-white" />
        </div>
      );
    }

    // A dead/removed id shouldn't render a broken modal — fall through to
    // the full page, which has its own proper "not found" state.
    return <Navigate to={`/property/${id}`} replace />;
  }

  const shown = detailsReady ? property : previewProperty;
  const detailsStatus = detailsReady ? null : error ? "error" : "loading";

  // Similar-property clicks inside the overlay should open another
  // overlay, not lose the modal — and the "background" underneath needs
  // to stay the original browse page, not the property we're leaving.
  const backgroundLocation = location.state?.backgroundLocation ?? location;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button
        type="button"
        aria-label="Close"
        onClick={close}
        className="absolute inset-0 bg-main/60 backdrop-blur-sm"
      />
      {/* No padding below `lg`: on a phone the detail view fills the screen
          edge to edge (its photo runs to the very top), and only from `lg`
          up does it float as a card with the page dimmed around it. */}
      <div className="relative z-10 h-full overflow-y-auto lg:flex lg:items-start lg:justify-center lg:p-8">
        <div className="lg:max-w-4xl lg:w-full">
          <PropertyDetail
            key={shown.id}
            property={shown}
            similarProperties={detailsReady ? similarProperties : NO_SIMILAR_PROPERTIES}
            detailsStatus={detailsStatus}
            onRetryDetails={reload}
            onClose={close}
            onSelectProperty={(nextProperty) =>
              navigate(buildPropertyUrl(nextProperty), { state: { backgroundLocation } })
            }
            isFavorited={favorites.has(shown.id)}
            onToggleFavorite={toggleFavorite}
            titleId={titleId}
          />
        </div>
      </div>
    </div>
  );
}

export default PropertyOverlayPage;
