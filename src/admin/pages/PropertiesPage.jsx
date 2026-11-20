import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { IoBusinessOutline, IoCloseCircleOutline, IoSearchOutline } from "react-icons/io5";
import ColumnSettingsMenu from "@/admin/components/ColumnSettingsMenu";
import ConfirmDialog from "@/admin/components/ConfirmDialog";
import ContentSpinner from "@/admin/components/ContentSpinner";
import EmptyState from "@/admin/components/EmptyState";
import PageHeader from "@/admin/components/PageHeader";
import Pagination from "@/admin/components/Pagination";
import PropertiesTable from "@/admin/components/PropertiesTable";
import PropertyCards from "@/admin/components/PropertyCards";
import SegmentedControl from "@/admin/components/SegmentedControl";
import Select from "@/admin/components/Select";
import { useAgents } from "@/admin/context/AgentsContext";
import { useCatalog } from "@/admin/context/CatalogContext";
import { useNeighborhoods } from "@/admin/context/NeighborhoodsContext";
import { useProperties } from "@/admin/context/PropertiesContext";
import { useToast } from "@/admin/context/ToastContext";
import { loadColumnVisibility, saveColumnVisibility } from "@/admin/lib/propertyColumns";
import { enrichProperties, filterProperties, sortProperties } from "@/admin/lib/propertyList";

// How many properties show per page. Filtering and sorting always run over
// every property first; this only limits how many of the sorted rows are drawn.
const PAGE_SIZE = 10;

export default function PropertiesPage() {
  const navigate = useNavigate();
  const { categories, subcategories } = useCatalog();
  const { properties, loading, deleteProperty } = useProperties();
  const { agents } = useAgents();
  const { neighborhoods } = useNeighborhoods();
  const { showToast } = useToast();

  // Every filter, the sort state and the current page live in the URL, not
  // local state — so opening a property to edit it (or cancelling) and coming
  // back restores exactly what was set before, instead of resetting to "All"
  // every time. See PropertyFormPage's goBackToProperties for the other half
  // of this.
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "all";
  const categoryFilter = searchParams.get("category") ?? "all";
  const statusFilter = searchParams.get("status") ?? "all";
  const search = searchParams.get("q") ?? "";
  const sortKey = searchParams.get("sort") ?? "created_at";
  const sortDir = searchParams.get("dir") ?? "desc";
  const requestedPage = Math.floor(Number(searchParams.get("page"))) || 1;

  const [visibleColumns, setVisibleColumns] = useState(loadColumnVisibility);
  const [pendingDelete, setPendingDelete] = useState(null);

  // `replace: true` on every update here so typing in the search box (or
  // clicking through several filters) doesn't flood browser history with
  // one entry per keystroke — the URL still ends up reflecting the current
  // state, it just doesn't fill up the back button with noise.
  function updateParam(key, value) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === "" || value == null || value === "all") next.delete(key);
        else next.set(key, value);
        // A different filter means a different set of rows, so start again from the first page.
        next.delete("page");
        return next;
      },
      { replace: true },
    );
  }

  function handleSort(key) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if ((prev.get("sort") ?? "created_at") === key) {
          next.set("dir", (prev.get("dir") ?? "desc") === "asc" ? "desc" : "asc");
        } else {
          next.set("sort", key);
          next.set("dir", "asc");
        }
        // The order changed, so the first page is the top of the new order.
        next.delete("page");
        return next;
      },
      { replace: true },
    );
  }

  function handlePageChange(page) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (page <= 1) next.delete("page");
        else next.set("page", String(page));
        return next;
      },
      { replace: true },
    );
    // The controls sit below the list; without this a phone would stay at the
    // bottom of the new page instead of showing its first property.
    window.scrollTo({ top: 0 });
  }

  function handleColumnVisibilityChange(nextVisible) {
    setVisibleColumns(nextVisible);
    saveColumnVisibility(nextVisible);
  }

  async function handleDeleteConfirm() {
    try {
      await deleteProperty(pendingDelete?.id);
      showToast("Property deleted.");
      setPendingDelete(null);
    } catch (error) {
      console.error(error);
      showToast("Could not delete this property.", "error");
    }
  }

  if (loading) {
    return <ContentSpinner />;
  }

  const enrichedProperties = enrichProperties(properties, { categories, subcategories, neighborhoods, agents });
  const filteredProperties = filterProperties(enrichedProperties, { activeTab, categoryFilter, statusFilter, search });
  const sortedProperties = sortProperties(filteredProperties, sortKey, sortDir);

  // The page number in the URL can be stale — typed by hand, or left over after
  // deleting the last property on the final page — so it's clamped to a page
  // that exists instead of showing an empty list.
  const totalPages = Math.max(1, Math.ceil(sortedProperties.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, requestedPage), totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageRows = sortedProperties.slice(pageStart, pageStart + PAGE_SIZE);

  // The tab counts are totals for each listing type: the other filters and the
  // search don't change them.
  const tabOptions = [
    { value: "all", label: "All", count: properties.length },
    { value: "rent", label: "Rent", count: properties.filter((property) => property.listing_type === "rent").length },
    { value: "sale", label: "Sale", count: properties.filter((property) => property.listing_type === "sale").length },
  ];

  const hasResults = sortedProperties.length > 0;

  const openEdit = (property) => navigate(`/admin/properties/${property.id}/edit`);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Properties"
        description="Every rent and sale listing, in one place."
        actionLabel="Add property"
        onAction={() => navigate("/admin/properties/new")}
      />

      {properties.length === 0 ? (
        <EmptyState
          icon={IoBusinessOutline}
          title="No properties yet"
          description="Add your first listing to start building the catalog."
          action={
            <button
              type="button"
              onClick={() => navigate("/admin/properties/new")}
              className="rounded-[12px] bg-accent-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-600"
            >
              Add property
            </button>
          }
        />
      ) : (
        // From `md` up (where the table shows) the toolbar, the table and the
        // pagination are one card. On phones the toolbar is its own card above
        // the property cards, and with no results it stays its own card above
        // the empty state.
        <div
          className={
            hasResults
              ? "space-y-6 md:space-y-0 md:overflow-hidden md:rounded-3xl md:border md:border-accent-500/10 md:bg-white md:shadow-[0_14px_44px_rgba(40,24,29,0.055)]"
              : "space-y-6"
          }
        >
          <div
            className={`rounded-3xl border border-accent-500/10 bg-white p-3 shadow-[0_14px_44px_rgba(40,24,29,0.055)] sm:p-4 ${
              hasResults ? "md:rounded-none md:border-x-0 md:border-t-0 md:shadow-none" : ""
            }`}
          >
            <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center xl:flex-nowrap">
              <div className="md:w-[280px]">
                <SegmentedControl
                  variant="toolbar"
                  options={tabOptions}
                  value={activeTab}
                  onChange={(value) => updateParam("tab", value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 md:ml-auto md:grid-cols-[11rem_10rem] xl:order-3">
                <Select
                  variant="toolbar"
                  value={categoryFilter}
                  onChange={(value) => updateParam("category", value)}
                  options={[
                    { value: "all", label: "All categories" },
                    ...categories.map((category) => ({ value: category.id, label: category.name })),
                  ]}
                />
                <Select
                  variant="toolbar"
                  value={statusFilter}
                  onChange={(value) => updateParam("status", value)}
                  options={[
                    { value: "all", label: "All statuses" },
                    { value: "published", label: "Published" },
                    { value: "draft", label: "Draft" },
                  ]}
                />
              </div>

              {/* The search and the column settings button share one row. From
                  `xl` up that row's wrapper stops existing (`contents`), so the
                  search sits between the tabs and the filters and the button
                  ends the toolbar; below `xl` the row drops under the tabs and
                  filters with the button at the right of the search. */}
              <div className="flex items-center gap-2 md:basis-full xl:contents">
                <div className="relative min-w-0 flex-1 xl:order-2 xl:mx-2">
                  <IoSearchOutline
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-trenary"
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => updateParam("q", event.target.value)}
                    placeholder="Search title or location"
                    aria-label="Search title or location"
                    className="h-10 w-full rounded-xl border border-accent-500/10 bg-white pl-9 pr-10 text-sm text-main transition placeholder:text-trenary hover:border-accent-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 sm:pr-20"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => updateParam("q", "")}
                      aria-label="Clear search"
                      className="absolute right-1 top-0 inline-flex h-10 items-center gap-1 rounded-xl px-2.5 text-trenary transition-colors hover:text-accent-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                    >
                      <IoCloseCircleOutline size={16} />
                      <span className="hidden text-xs font-medium sm:inline">Clear</span>
                    </button>
                  )}
                </div>
                <div className="shrink-0 xl:order-4 xl:-ml-1">
                  <ColumnSettingsMenu visibleColumns={visibleColumns} onChange={handleColumnVisibilityChange} />
                </div>
              </div>
            </div>
          </div>

          {hasResults ? (
            <>
              <PropertiesTable
                rows={pageRows}
                visibleColumns={visibleColumns}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
                onEdit={openEdit}
                onDelete={setPendingDelete}
              />
              <PropertyCards
                rows={pageRows}
                visibleColumns={visibleColumns}
                onEdit={openEdit}
                onDelete={setPendingDelete}
              />
              {totalPages > 1 && (
                <div className="md:border-t md:border-accent-500/10 md:px-5 md:py-4">
                  <Pagination
                    page={currentPage}
                    totalPages={totalPages}
                    totalItems={sortedProperties.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          ) : (
            <EmptyState
              icon={IoSearchOutline}
              title="No properties match your filters"
              description="Try adjusting the tabs, filters, or search above."
            />
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title={`Delete "${pendingDelete?.title}"?`}
        description="This removes the listing and its photos. This can't be undone."
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
