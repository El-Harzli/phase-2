import { getIconByKey } from "@/shared/config/curatedIcons";

export default function AmenityMultiSelect({ amenities, selectedIds, onToggle, emptyMessage, layout = "chips" }) {
  if (amenities.length === 0) {
    return <p className="text-sm text-trenary">{emptyMessage ?? "No amenities available yet."}</p>;
  }

  if (layout === "checklist") {
    return (
      <div className="grid grid-cols-2 gap-2 sm:gap-2.5 md:grid-cols-3 lg:grid-cols-2">
        {amenities.map((amenity) => {
          const isSelected = selectedIds.includes(amenity.id);
          const Icon = getIconByKey(amenity.icon);

          return (
            <button
              key={amenity.id}
              type="button"
              onClick={() => onToggle(amenity.id)}
              aria-pressed={isSelected}
              className={`flex min-h-[48px] items-center gap-2.5 rounded-[10px] border px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
                isSelected
                  ? "border-accent-500/40 bg-accent-500/[0.08] text-accent-500 ring-1 ring-accent-500/20"
                  : "border-accent-500/10 bg-white text-secondary hover:border-accent-500/25"
              }`}
            >
              <Icon size={18} className={`shrink-0 ${isSelected ? "text-accent-500" : "text-trenary"}`} />
              <span className="min-w-0 leading-snug">{amenity.name}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {amenities.map((amenity) => {
        const isSelected = selectedIds.includes(amenity.id);
        const Icon = getIconByKey(amenity.icon);

        return (
          <button
            key={amenity.id}
            type="button"
            onClick={() => onToggle(amenity.id)}
            aria-pressed={isSelected}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
              isSelected
                ? "bg-accent-500 text-white"
                : "border border-accent-500/10 text-secondary hover:border-accent-500/30 hover:text-accent-500"
            }`}
          >
            <Icon size={16} />
            {amenity.name}
          </button>
        );
      })}
    </div>
  );
}
