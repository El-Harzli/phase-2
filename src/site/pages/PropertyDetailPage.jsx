import { useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router";
import PropertyDetail from "@/site/components/property/PropertyDetail";
import Breadcrumbs from "@/site/components/Breadcrumbs";
import Spinner from "@/shared/components/Spinner";
import { formatPrice } from "@/site/lib/formatPrice";
import { buildPropertyUrl } from "@/shared/lib/propertyUrl";
import { useFavorites } from "@/site/context/FavoritesProvider";
import usePropertyRoute from "@/site/hooks/usePropertyRoute";
import usePageTitle from "@/shared/seo/usePageTitle";
import usePageMeta from "@/shared/seo/usePageMeta";
import useNoIndex from "@/shared/seo/useNoIndex";
import JsonLd from "@/site/components/JsonLd";

// Renders nothing; it only mounts useNoIndex for as long as it is on screen.
// Used by the "not found" state below: a hook can't be called conditionally
// inside PropertyDetailPage itself, and calling it at the top of the page would
// noindex every valid listing too. useNoIndex removes its tag when this
// unmounts, so leaving that state leaves nothing behind.
function NoIndex() {
  useNoIndex();
  return null;
}

function PropertyDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { favorites, toggleFavorite } = useFavorites();
  const { property, similarProperties, loading, error, goBack } = usePropertyRoute();
  usePageTitle(property?.title);

  // Whatever URL got them here — the legacy bare /property/:id, a slug
  // that's gone stale because the title was edited since, or someone
  // hand-editing the address bar — there's exactly one canonical URL for
  // a given property, and every visit should end up on it. Without this,
  // Google could see the same listing as multiple different "pages".
  useEffect(() => {
    if (!property) return;
    const canonicalPath = buildPropertyUrl(property);
    if (location.pathname !== canonicalPath) {
      navigate(canonicalPath, { replace: true, state: location.state });
    }
  }, [property, location.pathname, location.state, navigate]);

  // Same fallback shape the property-og-tags edge function uses (that one
  // runs server-side for the initial crawl/social-preview fetch; this
  // covers the same page when reached via in-app client-side navigation
  // instead, which the edge function never sees).
  const metaDescription = property
    ? property.description?.trim() ||
      `${[property.beds ? `${property.beds} bed` : null, property.baths ? `${property.baths} bath` : null]
        .filter(Boolean)
        .join(", ")} property in ${property.location}. ${formatPrice(property.price)}${
        property.listingType === "rent" ? " / month" : ""
      }.`
    : undefined;
  usePageMeta(metaDescription);

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-500 pt-20 lg:pt-24 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-primary-500 pt-20 lg:pt-24 flex items-center justify-center px-4">
        {/* Not indexed when the property is genuinely missing (deleted, unpublished,
            mistyped address). When the data failed to load (`error`), the
            property may well exist — a short outage during a crawl must not get a
            real listing dropped from search — so no noindex then. */}
        {!error && <NoIndex />}
        <div className="text-center">
          <p className="text-lg font-medium text-main mb-2">
            This property doesn&rsquo;t exist or is no longer listed.
          </p>
          <Link to="/properties/rent" className="text-accent-500 font-medium hover:underline">
            Back to properties
          </Link>
        </div>
      </div>
    );
  }

  const listingJsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: metaDescription,
    url: `${window.location.origin}${buildPropertyUrl(property)}`,
    image: property.image ? [property.image] : undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: property.location,
      addressCountry: "MA",
    },
    offers: {
      "@type": "Offer",
      price: property.price,
      priceCurrency: "MAD",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <div className="min-h-screen bg-primary-500 pt-20 lg:pt-24">
      <JsonLd data={listingJsonLd} />
      {/* No side padding on a phone, so the photo can run edge to edge (the
          breadcrumbs keep their own padding); from `sm` up it's the usual
          centered, padded column. */}
      <div className="max-w-5xl mx-auto py-3 sm:px-6 sm:py-6">
        <div className="px-4 sm:px-0">
          <Breadcrumbs
            items={[
              { label: "Home", to: "/" },
              { label: property.listingType === "sale" ? "Buy" : "Rent", to: `/properties/${property.listingType}` },
              { label: property.title },
            ]}
          />
        </div>
        <div className="mt-3">
          <PropertyDetail
            key={property.id}
            property={property}
            similarProperties={similarProperties}
            onClose={goBack}
            onSelectProperty={(nextProperty) => navigate(buildPropertyUrl(nextProperty))}
            isFavorited={favorites.has(property.id)}
            onToggleFavorite={toggleFavorite}
            isStandalonePage
          />
        </div>
      </div>
    </div>
  );
}

export default PropertyDetailPage;
