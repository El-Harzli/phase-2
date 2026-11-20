import { IoImageOutline, IoStar } from "react-icons/io5";
import ThumbImage from "@/admin/components/ThumbImage";

// The table cell and the phone card draw the same thumbnail, title, star and
// location, with slightly different sizes and alignment.
const SIZES = {
  table: { wrapper: "flex items-center gap-3", thumb: "h-12 w-12", text: "min-w-0" },
  card: { wrapper: "flex gap-3", thumb: "h-16 w-16", text: "min-w-0 flex-1" },
};

export default function PropertyIdentity({ property, size }) {
  const classes = SIZES[size];
  const cover = property.images[0];

  return (
    <div className={classes.wrapper}>
      <div className={`${classes.thumb} shrink-0 overflow-hidden rounded-[12px] bg-primary-600`}>
        {cover ? (
          <ThumbImage url={cover.url} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-trenary">
            <IoImageOutline size={18} />
          </div>
        )}
      </div>
      <div className={classes.text}>
        <div className="flex items-center gap-1.5">
          <p className="truncate font-medium text-main">{property.title}</p>
          {property.popular && <IoStar size={14} className="shrink-0 text-gold-500" />}
        </div>
        <p className="truncate text-xs text-trenary">{property.location}</p>
      </div>
    </div>
  );
}
