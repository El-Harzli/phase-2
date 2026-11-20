import { IoLocationOutline } from "react-icons/io5";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Single-listing map: just a pin — the price is already shown right above,
// so the pin only needs to mark "here". It's an SVG teardrop in the brand
// color (same maroon as the browse map's price pills), and the zero-sized
// icon technique is the same as PropertyMap.jsx's: the pin is positioned
// relative to the marker so its tip lands exactly on the coordinate.
//
// Built once — react-leaflet re-applies a marker's icon whenever the `icon`
// prop is a new object, so creating a fresh one on every render would
// re-create the pin each time.
const PIN_ICON = L.divIcon({
  html: `
    <div class="relative">
      <div class="absolute bottom-0 left-0 -translate-x-1/2 text-accent-500 drop-shadow-[0_4px_6px_rgba(109,33,60,0.35)]">
        <svg width="34" height="44" viewBox="0 0 34 44" fill="none" aria-hidden="true">
          <path d="M17 0C7.6 0 0 7.5 0 16.8 0 29.5 17 44 17 44s17-14.5 17-27.2C34 7.5 26.4 0 17 0z" fill="currentColor" />
          <circle cx="17" cy="16.5" r="6" fill="white" />
        </svg>
      </div>
    </div>
  `,
  className: "",
  iconSize: [0, 0],
  iconAnchor: [0, 0],
});

// Renders nothing if this listing has no exact coordinates set — only
// `location` (free text) is required on the property form, lat/lng are
// optional, so this is a normal state, not an error.
//
// `label` (optional) is a small caption over the bottom-left corner — the
// listing's location text. Bottom-left because Leaflet's own attribution
// already sits in the bottom-right.
//
// `className` (optional) sets the wrapper's size and corner radius. It
// defaults to the original fixed 256px-tall, 16px-rounded box, so existing
// callers are unchanged; the Contact page passes its own height/radius to
// fill its panel. It replaces both together (rather than adding to them)
// because two conflicting Tailwind height classes on one element are
// resolved by stylesheet order, not class order.
function PropertyLocationMap({ lat, lng, label, className = "h-64 rounded-[16px]" }) {
  if (typeof lat !== "number" || typeof lng !== "number" || Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  return (
    <div className={`isolate relative w-full overflow-hidden border border-accent-500/10 ${className}`}>
      {/* absolute inset-0 (instead of h-full) so the map always fills the
          wrapper, even when the wrapper's height comes from a stretched
          grid cell rather than an explicit height. */}
      <MapContainer center={[lat, lng]} zoom={15} scrollWheelZoom={false} className="absolute inset-0">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} icon={PIN_ICON} />
      </MapContainer>
      {label && (
        // z-[1000] — Leaflet's own panes and controls use z-indexes up to 1000
        // inside the map, so anything laid over it has to sit above those.
        <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] flex max-w-[70%] items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-main shadow-[0_2px_10px_rgba(0,0,0,0.15)]">
          <IoLocationOutline className="h-3.5 w-3.5 shrink-0 text-accent-500" />
          <span className="truncate">{label}</span>
        </div>
      )}
    </div>
  );
}

export default PropertyLocationMap;
