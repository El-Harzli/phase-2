import { useNavigate } from "react-router";
import NeighborhoodCard from "@/site/components/neighborhoods/NeighborhoodCard";
import Breadcrumbs from "@/site/components/Breadcrumbs";
import Spinner from "@/shared/components/Spinner";
import useNeighborhoods from "@/site/hooks/useNeighborhoods";
import usePropertyCounts from "@/site/hooks/usePropertyCounts";
import usePageTitle from "@/shared/seo/usePageTitle";
import usePageMeta from "@/shared/seo/usePageMeta";

function NeighborhoodsPage() {
  usePageTitle("Neighborhoods");
  usePageMeta(
    "Explore Tangier's neighborhoods, from the historic Kasbah to the modern Malabata coastline, and see available properties in each district.",
  );
  const navigate = useNavigate();
  const { neighborhoods: loadedNeighborhoods, loading: neighborhoodsLoading } = useNeighborhoods();
  const { loading: countsLoading, error: countsError, getPropertyCountForNeighborhoodByType } = usePropertyCounts();
  const loading = neighborhoodsLoading || countsLoading;
  // Without the counts the cards would show wrong numbers, so a failed counts
  // request reads like having no neighborhoods yet — what the page has always
  // shown when its data can't be loaded.
  const neighborhoods = countsError ? [] : loadedNeighborhoods;

  // Real filters now (properties have a neighborhood_id) — the listing
  // type is whichever one the person explicitly picked (see the two-button
  // split above), not guessed.
  function goToNeighborhoodType(neighborhood, listingType) {
    navigate(`/properties/${listingType}?neighborhood=${neighborhood.id}`);
  }

  return (
    <>
      <section className="bg-primary-500 pt-24 sm:pt-28 md:pt-32 lg:pt-36 pb-10 md:pb-14 text-center">
        <div className="wrapper max-w-2xl mx-auto">
          <Breadcrumbs
            items={[{ label: "Home", to: "/" }, { label: "Neighborhoods" }]}
            className="justify-center mb-4"
          />
          <p className="uppercase text-[11px] font-medium text-accent-500 tracking-[0.22em] mb-3">Tangier Lifestyle</p>
          <h1 className="text-[32px] sm:text-[40px] md:text-[46px] font-semibold tracking-tight leading-[1.15] text-main mb-4">
            Discover Every District
          </h1>
          <p className="text-[14px] sm:text-[15px] text-secondary leading-relaxed max-w-lg mx-auto">
            Every neighborhood in Tangier has its own character. Pick one to see what&rsquo;s currently available there.
          </p>
        </div>
      </section>

      <section className="bg-white pb-14 md:pb-20">
        <div className="wrapper">
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : neighborhoods.length === 0 ? (
            <p className="text-center text-sm text-secondary/70 py-16">
              Our neighborhood guides are being put together — check back soon.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {neighborhoods.map((neighborhood, index) => (
                <NeighborhoodCard
                  key={neighborhood.id}
                  neighborhood={neighborhood}
                  index={index}
                  rentCount={getPropertyCountForNeighborhoodByType(neighborhood.id, "rent")}
                  saleCount={getPropertyCountForNeighborhoodByType(neighborhood.id, "sale")}
                  onSelectType={goToNeighborhoodType}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default NeighborhoodsPage;
