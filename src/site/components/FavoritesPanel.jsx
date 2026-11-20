import { CgClose } from "react-icons/cg";
import { IoLocationOutline, IoHeart, IoHeartDislikeOutline } from "react-icons/io5";
import Spinner from "@/shared/components/Spinner";
import { useFavorites } from "@/site/context/FavoritesProvider";
import useBodyScrollLock from "@/shared/hooks/useBodyScrollLock";
import useEscapeKey from "@/shared/hooks/useEscapeKey";
import useFavoriteProperties from "@/site/hooks/useFavoriteProperties";
import useOpenProperty from "@/site/hooks/useOpenProperty";
import { formatPrice } from "@/site/lib/formatPrice";
import ResponsiveImage from "@/site/components/ResponsiveImage";

// Thumbnail is 80px (96px from sm up) — offer 1x/2x/3x of that instead of the
// full-size photo.
const THUMB_SIZES = "(min-width: 640px) 96px, 80px";
const THUMB_WIDTHS = [96, 192, 288];

function FavoriteItem({ property, onOpen, onRemove }) {
  return (
    <div className="group flex gap-3 p-2.5 rounded-[16px] border border-transparent hover:bg-primary-600 transition-colors">
      <button
        type="button"
        onClick={() => onOpen(property)}
        className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-[12px] overflow-hidden bg-primary-600"
      >
        <ResponsiveImage
          src={property.image}
          alt={property.title}
          sizes={THUMB_SIZES}
          widths={THUMB_WIDTHS}
          className="w-full h-full object-cover"
          style={
            property.imageFocal
              ? { objectPosition: `${property.imageFocal.x * 100}% ${property.imageFocal.y * 100}%` }
              : undefined
          }
        />
      </button>

      <div className="flex-1 min-w-0 py-0.5">
        <div className="flex items-start justify-between gap-2">
          <button type="button" onClick={() => onOpen(property)} className="text-left min-w-0">
            <p className="text-sm font-semibold text-accent-500 leading-none">
              {formatPrice(property.price)}
              {property.listingType === "rent" && (
                <span className="text-xs font-normal text-secondary/70"> / month</span>
              )}
            </p>
            <h3 className="text-sm font-medium text-main truncate mt-1.5">{property.title}</h3>
          </button>

          <button
            type="button"
            onClick={() => onRemove(property.id)}
            aria-label="Remove from favorites"
            className="shrink-0 text-secondary/50 hover:text-accent-500 transition-colors p-1 -m-1"
          >
            <IoHeart className="w-4 h-4 text-accent-500" />
          </button>
        </div>

        <p className="flex items-center gap-1 text-xs text-secondary/70 truncate mt-1">
          <IoLocationOutline className="w-3 h-3 shrink-0" />
          {property.location}
        </p>
      </div>
    </div>
  );
}

function FavoritesPanel({ isOpen, onClose }) {
  const { favorites, removeFavorite, clearFavorites } = useFavorites();
  // Only the saved ids are ever asked for, never the whole site. The header already
  // asks for them when the site opens (its badge needs to know which still exist),
  // so by the time this opens the cards are normally here; this call shares that
  // store and only fetches what is missing or old.
  const { properties: favoritedProperties, loading } = useFavoriteProperties(favorites, isOpen);
  // A spinner only when there is nothing to show yet; cards already known show at
  // once and a newly saved one fills in when it arrives.
  const isLoadingFavorites = loading && favoritedProperties.length === 0;
  const openPropertyOverlay = useOpenProperty();

  useBodyScrollLock(isOpen);

  // Escape closes the panel, as expected of any modal dialog.
  useEscapeKey(isOpen, onClose);

  // Takes the property itself (the item already has it) rather than an id
  // that had to be looked up in `properties` all over again.
  const openProperty = (property) => {
    onClose();
    // Same overlay-on-top-of-the-current-page navigation used from
    // BrowsePage/FeaturedProperties, so opening a favorite doesn't lose
    // wherever the visitor currently is.
    openPropertyOverlay(property);
  };

  // `inert` while closed: the panel stays mounted so it can slide, but
  // opacity-0 + pointer-events-none only hide it from the mouse — keyboard
  // users could still Tab into its invisible buttons, and an always-present
  // aria-modal dialog stayed exposed to screen readers on every page.
  // inert takes it out of both until it's actually open.
  return (
    <div
      inert={!isOpen}
      className={`fixed inset-0 z-[70] transition-opacity duration-300 ${
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Your favorites"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div
        className={`absolute top-0 right-0 h-full w-full sm:w-[420px] lg:w-[640px] bg-white flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-neutral-100 shrink-0">
          <h2 className="text-base font-semibold text-main">
            Favorites
            {favoritedProperties.length > 0 && (
              <span className="ml-2 text-sm font-normal text-secondary/70">({favoritedProperties.length})</span>
            )}
          </h2>
          <div className="flex items-center gap-4">
            {favoritedProperties.length > 0 && (
              <button
                type="button"
                onClick={clearFavorites}
                className="text-xs font-medium uppercase tracking-wide text-secondary/70 hover:text-accent-500 transition-colors"
              >
                Clear all
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close favorites"
              className="text-[22px] text-neutral-500"
            >
              <CgClose />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3">
          {isLoadingFavorites ? (
            <div className="h-full flex items-center justify-center">
              <Spinner />
            </div>
          ) : favoritedProperties.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6 gap-3">
              <IoHeartDislikeOutline className="w-10 h-10 text-secondary/30" />
              <p className="text-sm font-medium text-main">No favorites yet</p>
              <p className="text-xs text-secondary/70 max-w-[220px]">
                Tap the heart on any property to save it here for later.
              </p>
            </div>
          ) : (
            <div className="lg:grid lg:grid-cols-2 lg:gap-1">
              {favoritedProperties.map((property) => (
                <FavoriteItem key={property.id} property={property} onOpen={openProperty} onRemove={removeFavorite} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FavoritesPanel;
