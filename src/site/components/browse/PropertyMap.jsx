import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
// Only the cluster animation rules — the bubbles themselves are drawn by
// createClusterIcon below, so the plugin's default (green/yellow/orange)
// theme file is deliberately not imported.
import "leaflet.markercluster/dist/MarkerCluster.css";
import { TANGIER_CENTER } from "@/shared/config/map";
import ResponsiveImage from "@/site/components/ResponsiveImage";
import { formatPrice } from "@/site/lib/formatPrice";

/* ------------------------------------------------------------------ */
/*  Pins                                                               */
/* ------------------------------------------------------------------ */

// A price pill with a small pointer at its bottom edge; the pointer's tip is
// the property's exact coordinate. The marker icon itself is zero-sized and
// the pill is positioned relative to it, so the pill's width can follow the
// price text without Leaflet needing to know it.
//
// This is plain HTML + Tailwind classes (every class name is written out in
// full so Tailwind can find it) with no React state, so it carries over
// unchanged if the map library ever changes — most map libraries accept an
// HTML marker. Hover feedback is CSS (`hover:`), not JS.
const PILL_CLASSES = "bg-white text-main border-accent-500/20 hover:border-accent-500/50";
const PILL_SELECTED_CLASSES = "bg-accent-500 text-white border-accent-500";
const TIP_CLASSES = "bg-white border-accent-500/20";
const TIP_SELECTED_CLASSES = "bg-accent-500 border-accent-500";

// Icons are cached by what they look like: react-leaflet re-applies a
// marker's icon whenever the `icon` prop is a new object, so building a
// fresh one on every render would re-create all of the pins each time any
// state changed.
const iconCache = new Map();

function createPriceIcon(price, isSelected) {
  const key = `${price}:${isSelected}`;
  const cached = iconCache.get(key);
  if (cached) return cached;

  const html = `
    <div class="relative">
      <div class="absolute bottom-0 left-0 flex -translate-x-1/2 origin-bottom flex-col items-center transition-transform duration-150 hover:scale-105">
        <span class="whitespace-nowrap rounded-full border px-2.5 py-1 text-[12px] font-semibold shadow-[0_4px_14px_rgba(0,0,0,0.14)] ${
          isSelected ? PILL_SELECTED_CLASSES : PILL_CLASSES
        }">${formatPrice(price)}</span>
        <span class="-mt-1 h-2 w-2 rotate-45 border-b border-r ${
          isSelected ? TIP_SELECTED_CLASSES : TIP_CLASSES
        }"></span>
      </div>
    </div>
  `;

  const icon = L.divIcon({
    html,
    className: "",
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    // Where the preview card opens, relative to the coordinate: just above
    // the top of the pill (pill ≈ 28px + pointer).
    popupAnchor: [0, -38],
  });
  iconCache.set(key, icon);
  return icon;
}

// The bubble shown when several properties are too close together to show
// separately at the current zoom. Bigger bubbles for bigger groups.
function createClusterIcon(cluster) {
  const count = cluster.getChildCount();
  const size = count < 10 ? 40 : count < 50 ? 48 : 56;

  return L.divIcon({
    html: `<div class="flex h-full w-full items-center justify-center rounded-full bg-accent-500 text-[13px] font-semibold text-white shadow-[0_4px_14px_rgba(109,33,60,0.35)] ring-4 ring-accent-500/25 transition-transform duration-150 hover:scale-110">${count}</div>`,
    className: "",
    iconSize: L.point(size, size),
  });
}

/* ------------------------------------------------------------------ */
/*  Preview card (opens when a pin is clicked)                         */
/* ------------------------------------------------------------------ */

// Deliberately small: photo, title, price, and three quick facts — nothing
// else (no location, no icons) so it stays readable on a map without hiding
// the neighbouring pins. It lives in a Leaflet Popup, which react-leaflet
// fills with real React children, so it can use the same ResponsiveImage as
// the rest of the site. Popup content only mounts while the popup is open,
// so no card images load until a pin is actually clicked.
//
// The text uses <div>/<span>, never <p>: Leaflet's stylesheet gives every <p>
// inside a popup a 17px top/bottom margin, which blew the spacing apart.
function MapPropertyCard({ property, onOpen }) {
  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen(property);
    }
  };

  // Beds, size, baths — in that order. A fact that doesn't apply (a studio has
  // no bedrooms, a plot has no baths) is left out rather than shown as "0".
  const facts = [
    property.beds > 0 && `${property.beds} ${property.beds === 1 ? "Bed" : "Beds"}`,
    property.area > 0 && `${property.area}m²`,
    property.baths > 0 && `${property.baths} ${property.baths === 1 ? "Bath" : "Baths"}`,
  ].filter(Boolean);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(property)}
      onKeyDown={handleKeyDown}
      className="block w-[208px] cursor-pointer rounded-[16px] border border-accent-500/10 bg-white p-2 text-center shadow-[0_8px_30px_rgba(0,0,0,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
    >
      <div className="relative h-[112px] overflow-hidden rounded-[12px] bg-primary-600">
        <ResponsiveImage
          src={property.image}
          alt={property.title}
          sizes="192px"
          widths={[192, 384, 576]}
          loading="eager"
          className="h-full w-full object-cover"
          style={
            property.imageFocal
              ? { objectPosition: `${property.imageFocal.x * 100}% ${property.imageFocal.y * 100}%` }
              : undefined
          }
        />
        {property.popular && (
          <span className="absolute left-2 top-2 rounded bg-gold-400 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-main">
            Popular
          </span>
        )}
      </div>

      <div className="px-1 pb-1 pt-2.5">
        {/* One line only: longer titles end in "…" instead of wrapping. */}
        <div className="truncate text-[13px] font-medium leading-tight text-main">{property.title}</div>
        <div className="mt-1 text-base font-semibold leading-tight text-accent-500">
          {formatPrice(property.price)}
          {property.listingType === "rent" && <span className="text-xs font-normal text-secondary/70"> / month</span>}
        </div>
        {facts.length > 0 && (
          <div className="mt-2 flex items-center justify-center whitespace-nowrap text-xs text-secondary">
            {facts.map((fact, index) => (
              <span key={fact} className={index > 0 ? "ml-2.5 border-l border-accent-500/20 pl-2.5" : undefined}>
                {fact}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Leaflet draws popups inside its own white rounded box with padding, a close
// button and fixed text styles. These strip that box down to nothing so the
// card above is the only thing visible; the pointer (tip) is kept, since it
// shows which pin the card belongs to.
//
// Every one of these ends in `!` (Tailwind's "important") on purpose. Leaflet's
// stylesheet is plain, un-layered CSS, while Tailwind's classes live in a
// cascade layer — and an un-layered rule beats a layered one no matter how
// specific the layered selector is. Without `!` Leaflet's white box, its 20px
// of padding and its shadow all show through around the card.
const POPUP_CLASSES =
  "[&_.leaflet-popup-content-wrapper]:rounded-[16px]! [&_.leaflet-popup-content-wrapper]:bg-transparent! [&_.leaflet-popup-content-wrapper]:p-0! [&_.leaflet-popup-content-wrapper]:shadow-none! [&_.leaflet-popup-content]:m-0! [&_.leaflet-popup-content]:leading-normal!";

/* ------------------------------------------------------------------ */
/*  Map                                                                */
/* ------------------------------------------------------------------ */

// MapContainer only applies `center`/`zoom` on its first render — it isn't
// a controlled component. Without this, changing filters while already on
// the map tab moves the markers but leaves the viewport where it was.
function RecenterMap({ center }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);

  return null;
}

function hasCoordinates(p) {
  return typeof p.lat === "number" && typeof p.lng === "number" && !Number.isNaN(p.lat) && !Number.isNaN(p.lng);
}

function PropertyMap({ properties, selectedId, onSelectProperty }) {
  const mappable = useMemo(() => properties.filter(hasCoordinates), [properties]);

  // Which pin's preview card is open. This is local on purpose: clicking a pin
  // now previews the property, and only clicking the card itself calls
  // onSelectProperty (which opens the full detail page). `selectedId` from the
  // parent is still honoured, so a parent that wants to highlight a pin
  // (e.g. from hovering the list) can.
  const [activeId, setActiveId] = useState(null);

  const center = useMemo(() => {
    if (mappable.length === 0) return TANGIER_CENTER;
    const lat = mappable.reduce((sum, p) => sum + p.lat, 0) / mappable.length;
    const lng = mappable.reduce((sum, p) => sum + p.lng, 0) / mappable.length;
    return [lat, lng];
  }, [mappable]);

  return (
    <div className="isolate w-full h-[420px] sm:h-[520px] lg:h-[600px] rounded-[16px] overflow-hidden border border-accent-500/10">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom
        // Leaflet sets its own Helvetica/Arial on the map container, which would
        // override the site font inside the pins and cards. `inherit` (with `!`
        // to beat Leaflet's un-layered CSS, see POPUP_CLASSES) hands it back.
        className="w-full h-full [font-family:inherit]!"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterMap center={center} />

        {/* Pins that would overlap at the current zoom merge into one bubble
            with a count. Clicking a bubble zooms in on its properties; at the
            highest zoom, properties sharing (nearly) the same spot — e.g.
            several flats in one building — fan out around it instead.
            maxClusterRadius is in screen pixels: ~80 is about the width of a
            price pill, so pins merge just as they'd start to overlap. */}
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={80}
          showCoverageOnHover={false}
          iconCreateFunction={createClusterIcon}
        >
          {mappable.map((p) => {
            const isSelected = p.id === activeId || p.id === selectedId;
            return (
              <Marker
                key={p.id}
                position={[p.lat, p.lng]}
                icon={createPriceIcon(p.price, isSelected)}
                zIndexOffset={isSelected ? 1000 : 0}
                eventHandlers={{
                  popupopen: () => setActiveId(p.id),
                  // Opening another pin closes this popup too — only clear the
                  // highlight if it's still this pin's, or it would wipe out
                  // the one that was just opened.
                  popupclose: () => setActiveId((current) => (current === p.id ? null : current)),
                }}
              >
                <Popup
                  closeButton={false}
                  minWidth={208}
                  maxWidth={208}
                  autoPanPadding={[24, 24]}
                  className={POPUP_CLASSES}
                >
                  <MapPropertyCard property={p} onOpen={onSelectProperty} />
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}

export default PropertyMap;
