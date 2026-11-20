import { useNavigate } from "react-router";
import {
  IoAddOutline,
  IoArrowForward,
  IoBusinessOutline,
  IoCheckmarkCircleOutline,
  IoImageOutline,
  IoStar,
} from "react-icons/io5";
import EmptyState from "@/admin/components/EmptyState";
import ThumbImage from "@/admin/components/ThumbImage";
import { formatPrice } from "@/admin/lib/formatPrice";

export default function RecentPropertiesList({ properties, categories }) {
  const navigate = useNavigate();

  return (
    <div className="overflow-hidden rounded-[16px] border border-accent-500/10 bg-white shadow-[0_9px_28px_rgba(53,35,42,0.045)]">
      <div className="flex items-center justify-between gap-4 border-b border-accent-500/10 px-5 py-4 sm:px-6">
        <div>
          <h3 className="text-[15px] font-semibold tracking-tight text-main">Recently added</h3>
          <p className="mt-0.5 hidden text-xs text-trenary sm:block">Your latest property listings</p>
        </div>
        {properties.length > 0 && (
          <button
            type="button"
            onClick={() => navigate("/admin/properties")}
            className="flex items-center gap-1.5 text-xs font-semibold text-accent-500 hover:text-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          >
            View all
            <IoArrowForward size={14} />
          </button>
        )}
      </div>

      {properties.length === 0 ? (
        <div className="p-5 sm:p-6">
          <EmptyState
            icon={IoBusinessOutline}
            title="No properties yet"
            description="Add your first listing to see it show up here."
            action={
              <button
                type="button"
                onClick={() => navigate("/admin/properties/new")}
                className="flex items-center gap-2 rounded-[12px] bg-accent-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-600"
              >
                <IoAddOutline size={18} />
                Add property
              </button>
            }
          />
        </div>
      ) : (
        <div className="py-1">
          {properties.map((property) => {
            const category = categories.find((c) => c.id === property.category_id);
            const cover = property.images?.[0];
            const isPublished = property.status === "published";

            return (
              <button
                key={property.id}
                type="button"
                onClick={() => navigate(`/admin/properties/${property.id}/edit`)}
                className="flex w-full items-center gap-3 border-t border-accent-500/10 px-5 py-3 text-left transition-colors first:border-t-0 hover:bg-primary-600/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-500 sm:gap-3.5 sm:px-6"
              >
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-[9px] bg-primary-600 sm:h-12 sm:w-12">
                  {cover ? (
                    <ThumbImage url={cover.url} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-trenary">
                      <IoImageOutline size={16} />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-medium text-main">{property.title}</p>
                    {property.popular && <IoStar size={12} className="shrink-0 text-gold-500" />}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-trenary">
                    {category?.name ?? "Uncategorized"} · {property.location}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1">
                  <p className="whitespace-nowrap text-xs font-semibold text-main sm:text-sm">
                    {formatPrice(property.price, property.listing_type)}
                  </p>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      isPublished ? "bg-accent-500/10 text-accent-500" : "border border-accent-500/10 text-trenary"
                    }`}
                  >
                    {isPublished && <IoCheckmarkCircleOutline size={11} />}
                    {isPublished ? "Published" : "Draft"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
