import { IoLocationOutline } from "react-icons/io5";
import ResponsiveImage from "@/site/components/ResponsiveImage";
import SectionTitle from "@/site/components/property/SectionTitle";
import { formatPrice } from "@/site/lib/formatPrice";

// Up to three other listings of the same type and rent/sale kind. They arrive
// already chosen (usePropertyRoute asks for them: same category, same rent/sale,
// newest first, never this property) in the card shape.
function SimilarProperties({ property, similarProperties: similar, onSelectProperty, headingTag: SubheadingTag }) {
  if (similar.length === 0) return null;

  // Similar properties — a swipeable row on mobile, 3 across on desktop
  return (
    <div className="mt-10 lg:col-span-2">
      <SectionTitle as={SubheadingTag}>Similar {property.type.toLowerCase()}s nearby</SectionTitle>
      <div className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 lg:pb-0">
        {similar.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelectProperty(p)}
            className="flex w-[230px] shrink-0 snap-start flex-col overflow-hidden rounded-[16px] border border-accent-500/10 bg-white text-left transition-shadow hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 lg:w-auto"
          >
            <div className="relative h-32 overflow-hidden bg-primary-600 lg:h-36">
              <ResponsiveImage
                src={p.image}
                alt={p.title}
                sizes="(min-width: 1024px) 300px, 230px"
                widths={[460, 690]}
                className="h-full w-full object-cover"
                style={
                  p.imageFocal ? { objectPosition: `${p.imageFocal.x * 100}% ${p.imageFocal.y * 100}%` } : undefined
                }
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
              <span className="absolute bottom-2.5 left-3 text-lg font-semibold leading-none text-white">
                {formatPrice(p.price)}
                {p.listingType === "rent" && <span className="text-xs font-normal text-white/80"> / mo</span>}
              </span>
            </div>
            <div className="p-3">
              <p className="truncate text-sm font-semibold text-main">{p.title}</p>
              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-secondary/70">
                <IoLocationOutline className="h-3 w-3 shrink-0" />
                {p.location}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default SimilarProperties;
