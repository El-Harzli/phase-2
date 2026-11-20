import { IoBusinessOutline } from "react-icons/io5";
import { formatPrice } from "@/admin/lib/formatPrice";

export default function PropertySummaryCard({ title, categoryName, neighborhoodName, listingType, status, price }) {
  const trimmedPrice = price.trim();
  const priceText =
    /^\d+$/.test(trimmedPrice) && Number(trimmedPrice) > 0 ? formatPrice(Number(trimmedPrice), listingType) : "—";
  const place = [categoryName, neighborhoodName].filter(Boolean).join(" · ");
  const rows = [
    ["Listing", listingType === "rent" ? "Rent" : "Sale"],
    ["Status", status === "published" ? "Published" : "Draft"],
    ["Price", priceText],
  ];

  return (
    <div className="rounded-[13px] border border-accent-500/10 bg-[#20191b] p-[18px] text-white">
      <div className="flex items-center gap-3">
        <IoBusinessOutline size={20} className="shrink-0 text-gold-500" />
        <div className="grid min-w-0 gap-0.5">
          <p className="truncate text-sm font-semibold">{title.trim() || "Untitled property"}</p>
          <p className="truncate text-xs text-white/55">{place || "Category and neighborhood not set yet"}</p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-3.5">
        {rows.map(([term, value]) => (
          <div key={term} className="grid min-w-0 gap-[3px]">
            <dt className="text-xs text-white/50">{term}</dt>
            <dd className="truncate text-sm font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
