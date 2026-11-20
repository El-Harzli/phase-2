import { useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import {
  IoSearchOutline,
  IoCloseCircleOutline,
  IoStar,
  IoAddOutline,
  IoCloseOutline,
  IoReorderThreeOutline,
  IoImageOutline,
} from "react-icons/io5";
import ContentSpinner from "@/admin/components/ContentSpinner";
import EmptyState from "@/admin/components/EmptyState";
import PageHeader from "@/admin/components/PageHeader";
import SegmentedControl from "@/admin/components/SegmentedControl";
import ThumbImage from "@/admin/components/ThumbImage";
import { useProperties } from "@/admin/context/PropertiesContext";
import { useToast } from "@/admin/context/ToastContext";
import { formatPrice } from "@/admin/lib/formatPrice";

// The thumbnail, title and price shared by the featured rows and the
// "available" rows below.
function PropertySummary({ property }) {
  const cover = property.images[0];

  return (
    <>
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[10px] bg-primary-600">
        {cover ? (
          <ThumbImage url={cover.url} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-secondary/40">
            <IoImageOutline size={18} />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-main">{property.title}</p>
        <p className="text-xs text-trenary">{formatPrice(property.price, property.listing_type)}</p>
      </div>
    </>
  );
}

// A native HTML5 `draggable` implementation (what this used before) only
// fires on mouse input — touch devices never dispatch those events at all,
// by design of the web platform, which is why reordering didn't work on
// mobile. Framer Motion's Reorder is built on pointer events instead, which
// unify mouse and touch, so the same code works on both.
function FeaturedRow({ property, onRemove, saving, onDragEnd }) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={property.id}
      dragListener={false}
      dragControls={dragControls}
      onDragEnd={onDragEnd}
      className="flex items-center gap-3 rounded-[14px] border border-accent-500/10 bg-white p-2.5 select-none"
    >
      <span
        onPointerDown={(event) => dragControls.start(event)}
        className="cursor-grab touch-none text-secondary/50 active:cursor-grabbing"
        aria-hidden="true"
      >
        <IoReorderThreeOutline size={20} />
      </span>
      <PropertySummary property={property} />
      <button
        type="button"
        onClick={() => onRemove(property)}
        disabled={saving}
        aria-label={`Remove ${property.title} from the homepage`}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-secondary hover:bg-primary-600 hover:text-error-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 disabled:opacity-50"
      >
        <IoCloseOutline size={18} />
      </button>
    </Reorder.Item>
  );
}

export default function FeaturedPage() {
  const { properties, loading, updateFeaturedForListingType } = useProperties();
  const { showToast } = useToast();
  const [listingType, setListingType] = useState("rent");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const featured = properties
    .filter((property) => property.listing_type === listingType && property.featured_order !== null)
    .sort((a, b) => a.featured_order - b.featured_order);

  const term = search.trim().toLowerCase();
  const available = properties
    .filter(
      (property) =>
        property.listing_type === listingType && property.status === "published" && property.featured_order === null,
    )
    .filter((property) => !term || property.title.toLowerCase().includes(term));

  // The displayed order while dragging — kept in sync with `featured`
  // (which comes from Supabase via context) whenever it changes from
  // outside a drag, e.g. after an add/remove, or switching the rent/sale
  // tab. Reorder.Group drives this live during a drag via onReorder; the
  // actual save happens once, on drop (see FeaturedRow's onDragEnd below).
  // The sync compares the list of ids (not the array itself), so it only
  // re-runs when the featured list really changed.
  const featuredIds = featured.map((property) => property.id);
  const featuredKey = featuredIds.join(",");
  const [orderedIds, setOrderedIds] = useState(featuredIds);
  const [syncedKey, setSyncedKey] = useState(featuredKey);
  if (syncedKey !== featuredKey) {
    setSyncedKey(featuredKey);
    setOrderedIds(featuredIds);
  }

  const featuredById = new Map(featured.map((property) => [property.id, property]));
  const displayedFeatured = orderedIds.map((id) => featuredById.get(id)).filter(Boolean);

  async function persist(nextOrderedIds, successMessage) {
    setSaving(true);
    try {
      await updateFeaturedForListingType(listingType, nextOrderedIds);
      if (successMessage) showToast(successMessage);
    } catch (error) {
      console.error(error);
      // Put the list back the way it was, so the screen doesn't claim an order that wasn't saved.
      setOrderedIds(featuredIds);
      // Surface the actual Supabase/Postgres message (e.g. a stale schema
      // cache after adding the featured_order column, or an RLS issue)
      // instead of a generic string — much faster to diagnose than
      // guessing from "something went wrong".
      const detail = error?.message || error?.error_description || "Unknown error";
      showToast(`Could not save the featured order: ${detail}`, "error");
    } finally {
      setSaving(false);
    }
  }

  function handleAdd(property) {
    persist([...orderedIds, property.id], `Added "${property.title}" to the homepage.`);
  }

  function handleRemove(property) {
    persist(
      orderedIds.filter((id) => id !== property.id),
      `Removed "${property.title}" from the homepage.`,
    );
  }

  function handleDragEnd() {
    // Dropping a row back where it started changes nothing — no save, no toast.
    const unchanged =
      orderedIds.length === featuredIds.length && orderedIds.every((id, index) => id === featuredIds[index]);
    if (unchanged) return;
    persist(orderedIds, "Updated the homepage order.");
  }

  if (loading) return <ContentSpinner />;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <PageHeader
          title="Featured on homepage"
          description="Choose which properties appear in the homepage's Featured Properties section, and drag to set the order. Rent and sale each have their own list."
        />
      </div>

      <SegmentedControl
        options={[
          { value: "rent", label: "For Rent" },
          { value: "sale", label: "For Sale" },
        ]}
        value={listingType}
        onChange={(value) => {
          setListingType(value);
          setSearch("");
        }}
      />

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-main">Featured ({displayedFeatured.length})</h2>

        {displayedFeatured.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              icon={IoStar}
              title="Nothing featured yet"
              description="Add properties from the list below — they'll appear on the homepage in the order you set here."
            />
          </div>
        ) : (
          <Reorder.Group axis="y" values={orderedIds} onReorder={setOrderedIds} className="mt-3 flex flex-col gap-2">
            {displayedFeatured.map((property) => (
              <FeaturedRow
                key={property.id}
                property={property}
                onRemove={handleRemove}
                saving={saving}
                onDragEnd={handleDragEnd}
              />
            ))}
          </Reorder.Group>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-main">Add properties</h2>

        <div className="relative mt-3">
          <IoSearchOutline
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-secondary/50"
          />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search published properties…"
            className="w-full rounded-[12px] border border-accent-500/10 bg-white py-2.5 pl-9 pr-9 sm:pr-20 text-sm text-main placeholder:text-secondary/50 focus:border-accent-500 focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-secondary/40 hover:text-accent-500 transition-colors cursor-pointer"
            >
              <IoCloseCircleOutline size={16} />
              <span className="hidden sm:inline text-xs font-medium">Clear</span>
            </button>
          )}
        </div>

        {/* Fixed height + internal scroll, always rendered (even for 0
            results) — the point is that typing in the search box changes
            what's inside this box, never the box's own size. Filtering
            down to fewer rows used to shrink this section and shift
            everything below it, which is what was making the page feel
            like it was jumping around while typing, especially with the
            mobile keyboard open. */}
        <div className="mt-3 h-80 overflow-y-auto pr-1">
          {available.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center">
              <p className="text-sm text-trenary">
                {properties.some((p) => p.listing_type === listingType && p.status === "published")
                  ? "No matching properties, or everything published is already featured."
                  : `No published ${listingType} listings yet.`}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {available.map((property) => (
                <div
                  key={property.id}
                  className="flex items-center gap-3 rounded-[14px] border border-accent-500/10 bg-white p-2.5"
                >
                  <PropertySummary property={property} />
                  <button
                    type="button"
                    onClick={() => handleAdd(property)}
                    disabled={saving}
                    className="flex shrink-0 items-center gap-1 rounded-[10px] bg-accent-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 disabled:opacity-50"
                  >
                    <IoAddOutline size={14} />
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
