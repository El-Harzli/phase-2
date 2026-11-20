import {
  IoChevronDown,
  IoChevronUp,
  IoPencilOutline,
  IoStar,
  IoSwapVerticalOutline,
  IoTrashOutline,
} from "react-icons/io5";
import IconButton from "@/admin/components/IconButton";
import PropertyIdentity from "@/admin/components/PropertyIdentity";
import { formatPrice } from "@/admin/lib/formatPrice";
import { OPTIONAL_COLUMNS } from "@/admin/lib/propertyColumns";

function SortableHeader({ label, sortKey, activeSort, activeDir, onSort, align, className = "" }) {
  const isActive = activeSort === sortKey;
  return (
    <th className={`px-5 py-3 ${align === "right" ? "text-right" : ""} ${className}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 transition-colors hover:text-accent-500 cursor-pointer ${
          isActive ? "text-accent-500" : ""
        }`}
      >
        {label}
        {isActive ? (
          activeDir === "asc" ? (
            <IoChevronUp size={12} />
          ) : (
            <IoChevronDown size={12} />
          )
        ) : (
          <IoSwapVerticalOutline size={12} className="text-trenary/50" />
        )}
      </button>
    </th>
  );
}

function renderCell(key, { property, category, subcategory, neighborhood, agent }) {
  switch (key) {
    case "category":
      return (
        <td key={key} className="px-5 py-3 text-secondary">
          {category?.name ?? "Uncategorized"}
          {subcategory && <span className="text-trenary"> · {subcategory.name}</span>}
        </td>
      );
    case "neighborhood":
      return (
        <td key={key} className="px-5 py-3 text-secondary">
          {neighborhood?.name ?? "—"}
        </td>
      );
    case "type":
      return (
        <td key={key} className="px-5 py-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              property.listing_type === "rent" ? "bg-gold-500/20 text-main" : "bg-primary-600 text-secondary"
            }`}
          >
            {property.listing_type === "rent" ? "Rent" : "Sale"}
          </span>
        </td>
      );
    case "price":
      return (
        <td key={key} className="whitespace-nowrap px-5 py-3 text-secondary">
          {formatPrice(property.price, property.listing_type)}
        </td>
      );
    case "beds":
      return (
        <td key={key} className="px-5 py-3 text-secondary">
          {property.beds ?? "—"}
        </td>
      );
    case "baths":
      return (
        <td key={key} className="px-5 py-3 text-secondary">
          {property.baths ?? "—"}
        </td>
      );
    case "area":
      return (
        <td key={key} className="whitespace-nowrap px-5 py-3 text-secondary">
          {property.area ? `${property.area} m²` : "—"}
        </td>
      );
    case "agent":
      return (
        <td key={key} className="px-5 py-3 text-secondary">
          {agent?.name ?? "Unassigned"}
        </td>
      );
    case "status":
      return (
        <td key={key} className="px-5 py-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              property.status === "published"
                ? "bg-accent-500/10 text-accent-500"
                : "border border-accent-500/10 text-trenary"
            }`}
          >
            {property.status === "published" ? "Published" : "Draft"}
          </span>
        </td>
      );
    case "featured":
      return (
        <td key={key} className="px-5 py-3">
          {property.featured_order !== null ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-gold-600">
              <IoStar size={12} /> Featured
            </span>
          ) : (
            <span className="text-xs text-trenary">—</span>
          )}
        </td>
      );
    default:
      return null;
  }
}

// No card styling of its own: the page draws the card (rounded border and
// shadow) around the toolbar, this table and the pagination together.
export default function PropertiesTable({ rows, visibleColumns, sortKey, sortDir, onSort, onEdit, onDelete }) {
  const shownColumns = OPTIONAL_COLUMNS.filter((column) => visibleColumns.has(column.key));

  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-accent-500/10 bg-primary-600/40 text-xs font-medium uppercase tracking-wide text-trenary">
          <tr>
            <SortableHeader
              label="Property"
              sortKey="title"
              activeSort={sortKey}
              activeDir={sortDir}
              onSort={onSort}
              className="sticky left-0 z-10 border-r border-accent-500/10 bg-primary-600"
            />
            {shownColumns.map((column) => (
              <SortableHeader
                key={column.key}
                label={column.label}
                sortKey={column.key}
                activeSort={sortKey}
                activeDir={sortDir}
                onSort={onSort}
              />
            ))}
            <th className="sticky right-0 z-10 border-l border-accent-500/10 bg-primary-600 px-5 py-3 text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-accent-500/10">
          {rows.map((row) => {
            const { property } = row;
            return (
              <tr key={property.id} className="group transition-colors hover:bg-primary-600/30">
                <td className="sticky left-0 z-10 min-w-[200px] max-w-[220px] border-r border-accent-500/10 bg-white px-5 py-3 transition-colors group-hover:bg-primary-600/30">
                  <PropertyIdentity property={property} size="table" />
                </td>
                {shownColumns.map((column) => renderCell(column.key, row))}
                <td className="sticky right-0 z-10 border-l border-accent-500/10 bg-white px-5 py-3 transition-colors group-hover:bg-primary-600/30">
                  <div className="flex justify-end gap-1.5">
                    <IconButton label={`Edit ${property.title}`} onClick={() => onEdit(property)}>
                      <IoPencilOutline size={16} />
                    </IconButton>
                    <IconButton label={`Delete ${property.title}`} onClick={() => onDelete(property)}>
                      <IoTrashOutline size={16} />
                    </IconButton>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
