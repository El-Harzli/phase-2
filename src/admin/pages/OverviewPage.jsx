import { IoBusinessOutline, IoCashOutline, IoCheckmarkCircleOutline, IoKeyOutline } from "react-icons/io5";
import CategoryBreakdown from "@/admin/components/CategoryBreakdown";
import ContactInsights from "@/admin/components/ContactInsights";
import ContentSpinner from "@/admin/components/ContentSpinner";
import RecentPropertiesList from "@/admin/components/RecentPropertiesList";
import StatCard from "@/admin/components/StatCard";
import { useCatalog } from "@/admin/context/CatalogContext";
import { useProperties } from "@/admin/context/PropertiesContext";
import { buildCategoryBreakdown, computeStats, getRecentProperties, percentOf } from "@/admin/lib/overviewStats";

export default function OverviewPage() {
  const { properties, loading: propertiesLoading } = useProperties();
  const { categories, loading: categoriesLoading } = useCatalog();

  if (propertiesLoading || categoriesLoading) {
    return <ContentSpinner />;
  }

  const stats = computeStats(properties);
  const recentProperties = getRecentProperties(properties);
  const categoryBreakdown = buildCategoryBreakdown(categories, properties);

  const publishedPct = percentOf(stats.published, stats.total);
  const allPublished = stats.total > 0 && stats.draft === 0;

  const publishedDetail =
    stats.total === 0
      ? "No listings yet"
      : allPublished
        ? "All listings live"
        : `${stats.draft} ${stats.draft === 1 ? "draft" : "drafts"} not live`;

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <span className="font-anonymous text-[11px] font-bold tracking-[0.16em] text-accent-500">
            PORTFOLIO OVERVIEW
          </span>
          <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-main md:text-[31px] md:leading-[1.15]">
            Dashboard
          </h2>
          <p className="mt-1.5 max-w-[280px] text-xs text-trenary sm:max-w-none sm:text-sm">
            A quick look at what&rsquo;s live and what still needs attention.
          </p>
        </div>

        {stats.total > 0 && (
          <div className="hidden shrink-0 items-center gap-2 rounded-full border border-accent-500/10 bg-white px-3 py-2 text-[11px] text-trenary md:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-500 shadow-[0_0_0_3px_rgba(109,33,60,0.1)]" />
            {allPublished
              ? "Everything is published"
              : `${stats.draft} ${stats.draft === 1 ? "draft needs" : "drafts need"} attention`}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={IoBusinessOutline} label="Total properties" value={stats.total} detail="All listings" />
        <StatCard
          icon={IoKeyOutline}
          label="For rent"
          value={stats.forRent}
          detail={`${percentOf(stats.forRent, stats.total)}% of portfolio`}
        />
        <StatCard
          icon={IoCashOutline}
          label="For sale"
          value={stats.forSale}
          detail={`${percentOf(stats.forSale, stats.total)}% of portfolio`}
        />
        <StatCard
          icon={IoCheckmarkCircleOutline}
          label="Published"
          value={
            <>
              {stats.published}
              <span className="ml-0.5 text-sm font-normal tracking-normal text-trenary">/{stats.total}</span>
            </>
          }
          detail={publishedDetail}
          done={allPublished}
          progress={allPublished ? undefined : publishedPct}
        />
      </div>

      {/* Loads and fails on its own (its own spinner / retry), so a problem
          fetching contact numbers never affects the rest of this page. */}
      <ContactInsights />

      <div className="grid items-start gap-5 sm:gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.55fr)]">
        {/* Recently added */}
        <RecentPropertiesList properties={recentProperties} categories={categories} />

        {/* Listings by category */}
        <CategoryBreakdown breakdown={categoryBreakdown} total={stats.total} />
      </div>
    </div>
  );
}
