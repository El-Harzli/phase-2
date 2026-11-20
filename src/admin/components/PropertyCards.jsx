import {
  IoBedOutline,
  IoCheckmarkCircleOutline,
  IoLocationOutline,
  IoPencilOutline,
  IoPersonOutline,
  IoPricetagOutline,
  IoResizeOutline,
  IoStar,
  IoTrashOutline,
  IoWaterOutline,
} from "react-icons/io5";
import IconButton from "@/admin/components/IconButton";
import PropertyIdentity from "@/admin/components/PropertyIdentity";
import { formatPrice } from "@/admin/lib/formatPrice";

function countLabel(value, singular, plural) {
  if (value === null || value === undefined) return "—";
  return `${value} ${value === 1 ? singular : plural}`;
}

// Mobile: a table just doesn't have room to work with at
// phone widths — two sticky columns alone (Property +
// Actions) can eat the entire viewport, leaving nothing
// usable to scroll through in the middle. Cards read
// vertically instead, which phones handle far better than
// horizontal scrolling for anything data-dense — and unlike
// the old mobile cards, these are built from the same
// visibleColumns state as the table, so the settings menu
// actually does something here too.
//
// Each card is laid out by importance so it stays short: the property
// (photo, title, location) with its Edit and Delete icons on top, then the
// price with its type and status, then every other visible column as a small
// icon + value line. The icons stand in for the labels the table has as
// column headers; each one carries its label as a tooltip and for screen readers.
export default function PropertyCards({ rows, visibleColumns, onEdit, onDelete }) {
  const showCol = (key) => visibleColumns.has(key);

  return (
    <div className="flex flex-col gap-3 md:hidden">
      {rows.map(({ property, category, subcategory, neighborhood, agent }) => {
        const isPublished = property.status === "published";

        const details = [
          showCol("category") && {
            label: "Category",
            icon: IoPricetagOutline,
            value: subcategory
              ? `${category?.name ?? "Uncategorized"} · ${subcategory.name}`
              : (category?.name ?? "Uncategorized"),
          },
          showCol("neighborhood") && {
            label: "Neighborhood",
            icon: IoLocationOutline,
            value: neighborhood?.name ?? "—",
          },
          showCol("beds") && { label: "Beds", icon: IoBedOutline, value: countLabel(property.beds, "bed", "beds") },
          showCol("baths") && {
            label: "Baths",
            icon: IoWaterOutline,
            value: countLabel(property.baths, "bath", "baths"),
          },
          showCol("area") && {
            label: "Area",
            icon: IoResizeOutline,
            value: property.area ? `${property.area} m²` : "—",
          },
          showCol("agent") && { label: "Agent", icon: IoPersonOutline, value: agent?.name ?? "Unassigned" },
          showCol("featured") &&
            property.featured_order !== null && {
              label: "Homepage",
              icon: IoStar,
              iconClassName: "text-gold-500",
              value: "Featured",
            },
        ].filter(Boolean);

        return (
          <div
            key={property.id}
            className="rounded-[16px] border border-accent-500/10 bg-white p-3.5 shadow-[0_9px_28px_rgba(53,35,42,0.045)]"
          >
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <PropertyIdentity property={property} size="card" />
              </div>
              <div className="flex shrink-0 gap-1">
                <IconButton label={`Edit ${property.title}`} onClick={() => onEdit(property)}>
                  <IoPencilOutline size={18} />
                </IconButton>
                <IconButton label={`Delete ${property.title}`} onClick={() => onDelete(property)}>
                  <IoTrashOutline size={18} />
                </IconButton>
              </div>
            </div>

            {(showCol("price") || showCol("type") || showCol("status")) && (
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  {showCol("price") && (
                    <p className="truncate text-[15px] font-semibold text-main">
                      {formatPrice(property.price, property.listing_type)}
                    </p>
                  )}
                  {showCol("type") && (
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                        property.listing_type === "rent" ? "bg-gold-500/20 text-main" : "bg-primary-600 text-secondary"
                      }`}
                    >
                      {property.listing_type === "rent" ? "Rent" : "Sale"}
                    </span>
                  )}
                </div>
                {showCol("status") && (
                  <span
                    className={`ml-auto inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                      isPublished ? "bg-accent-500/10 text-accent-500" : "border border-accent-500/10 text-trenary"
                    }`}
                  >
                    {isPublished && <IoCheckmarkCircleOutline size={12} />}
                    {isPublished ? "Published" : "Draft"}
                  </span>
                )}
              </div>
            )}

            {details.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-accent-500/10 pt-3 text-xs text-secondary">
                {details.map(({ label, icon: Icon, iconClassName = "text-trenary", value }) => (
                  <li key={label} title={label} className="flex max-w-full min-w-0 items-center gap-1.5">
                    <Icon size={14} className={`shrink-0 ${iconClassName}`} />
                    <span className="sr-only">{label}: </span>
                    <span className="truncate">{value}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
