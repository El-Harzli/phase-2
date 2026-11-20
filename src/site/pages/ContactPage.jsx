import { useState, lazy, Suspense } from "react";
import {
  IoLogoWhatsapp,
  IoCallOutline,
  IoMailOutline,
  IoLocationOutline,
  IoSendOutline,
  IoArrowForward,
  IoCheckmark,
  IoTimeOutline,
} from "react-icons/io5";
import usePageTitle from "@/shared/seo/usePageTitle";
import usePageMeta from "@/shared/seo/usePageMeta";
import Breadcrumbs from "@/site/components/Breadcrumbs";
import Spinner from "@/shared/components/Spinner";
import { useSiteSettings } from "@/site/context/SiteSettingsProvider";
import { FOCUS_RING } from "@/site/lib/focusRing";
import { buildCallUrl, buildWhatsAppUrl } from "@/site/lib/phoneLinks";

// Same reasoning as the property detail/browse pages — Leaflet stays out
// of this page's initial bundle until it's actually needed.
const PropertyLocationMap = lazy(() => import("@/site/components/PropertyLocationMap"));

// Same size as the map panel below so the layout doesn't jump when the
// Leaflet chunk finishes loading.
function MapLoadingFallback() {
  return (
    <div className="w-full h-full min-h-[380px] rounded-[24px] border border-accent-500/10 bg-primary-500 flex items-center justify-center">
      <Spinner className="h-6 w-6 border-accent-500/20 border-t-accent-500" />
    </div>
  );
}

// The phone number, email, address and office coordinates below all come
// from Settings (admin dashboard) via useSiteSettings() — see `settings` in
// the component below. CHANNELS is built there so it can use those values.
function buildChannels(settings) {
  return [
    {
      icon: IoLogoWhatsapp,
      label: "WhatsApp",
      value: settings.phone_display,
      note: "Usually the quickest",
      href: buildWhatsAppUrl(settings.phone_number),
      highlight: true,
    },
    {
      icon: IoCallOutline,
      label: "Call Us",
      value: settings.phone_display,
      note: "Speak directly with us",
      href: buildCallUrl(settings.phone_number),
    },
    {
      icon: IoMailOutline,
      label: "Email",
      value: settings.email,
      note: "For details and documents",
      href: `mailto:${settings.email}`,
    },
    {
      icon: IoLocationOutline,
      label: "Visit Us",
      value: settings.address,
      note: "Meet by appointment",
      href: `https://www.google.com/maps?q=${settings.office_lat},${settings.office_lng}`,
    },
  ];
}

const ASSURANCES = [
  {
    number: "01",
    title: "You speak to us directly",
    text: "No call centre and no hand-offs.",
  },
  {
    number: "02",
    title: "Your enquiry stays private",
    text: "Every conversation is handled discreetly.",
  },
  {
    number: "03",
    title: "Local guidance from the start",
    text: "Answers grounded in real Tangier knowledge.",
  },
];

// Type scale copied from Hero.jsx so this page reads as part of the same
// site: eyebrow and H1 are identical; H2 is the same curve one step down.
const EYEBROW = "uppercase text-[10px] sm:text-[11px] md:text-xs font-medium text-accent-500 tracking-[0.18em]";
const H1 =
  "text-[32px] sm:text-[38px] md:text-[44px] lg:text-[50px] xl:text-[58px] font-semibold tracking-tight leading-[1.15] md:leading-[1.12] lg:leading-[1.08] text-main";
const H2 =
  "text-[26px] sm:text-[30px] md:text-[36px] lg:text-[42px] font-semibold tracking-tight leading-[1.15] md:leading-[1.12] text-main";
const BODY = "text-[14px] sm:text-[15px] md:text-base text-secondary leading-[1.65] sm:leading-[1.7]";

// Inputs on the dark form panel. text-base below `sm` is deliberate: iOS
// Safari zooms the whole page when an input under 16px is focused.
const FIELD =
  "w-full rounded-[12px] border border-white/10 bg-white/5 px-4 py-3 text-base sm:text-sm text-white placeholder:text-white/30 focus:border-accent-500 focus:bg-white/[0.07] focus:outline-none transition-colors";

// Settings values can arrive as numbers, numeric strings, or null/empty
// (not set yet) — only a real number should reach the map.
function toCoord(value) {
  if (value === null || value === undefined || value === "") return NaN;
  return Number(value);
}

function ContactPage() {
  usePageTitle("Contact Us");
  usePageMeta(
    "Get in touch with BSI Properties — reach us by WhatsApp, phone, or email, or visit our office in Tangier, Morocco.",
  );
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const settings = useSiteSettings();
  const CHANNELS = buildChannels(settings);

  const lat = toCoord(settings.office_lat);
  const lng = toCoord(settings.office_lng);
  const hasMap = Number.isFinite(lat) && Number.isFinite(lng);

  // No backend to submit to — rather than a form that silently goes
  // nowhere, this composes a pre-filled WhatsApp message, the same
  // channel every other inquiry on this site already routes through
  // (property contact buttons, the agent cards on /about, etc.).
  function handleSubmit(e) {
    e.preventDefault();
    const text = [
      "Hello BSI Properties,",
      name.trim() && `My name is ${name.trim()}.`,
      contact.trim() && `You can reach me at ${contact.trim()}.`,
      message.trim(),
    ]
      .filter(Boolean)
      .join("\n");

    window.open(
      `${buildWhatsAppUrl(settings.phone_number)}?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
    setSent(true);
  }

  return (
    <>
      {/* Hero + contact channels */}
      <section className="bg-primary-500 pt-24 sm:pt-28 md:pt-32 lg:pt-36 xl:pt-40 pb-10 sm:pb-12 md:pb-16 lg:pb-24 xl:pb-28">
        <div className="wrapper">
          <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Contact" }]} className="mb-8 md:mb-12" />

          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6 lg:gap-16 lg:items-end mb-8 md:mb-12">
            <div>
              <p className={EYEBROW}>We&rsquo;d Love To Hear From You</p>
              <h1 className={`${H1} mt-2 sm:mt-3`}>
                Let&rsquo;s begin with
                <br />a <em className="italic font-medium text-accent-500">conversation.</em>
              </h1>
            </div>

            <div>
              <p className={`${BODY} font-medium max-w-md`}>
                Whether you are looking for a home, asking about a property, or need someone you can trust in Tangier,
                start by telling us what you have in mind.
              </p>
              <div className="flex items-center gap-3 border-t border-accent-500/10 pt-4 mt-5 max-w-md">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-accent-500/40">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
                </span>
                <div>
                  <p className="text-[12px] font-semibold text-main leading-tight">A real person will reply</p>
                  <p className="text-[11px] text-tertiary mt-0.5">Directly from the BSI Properties team</p>
                </div>
              </div>
            </div>
          </div>

          {/* Channels */}
          <address className="not-italic grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
            {CHANNELS.map((channel) => (
              <a
                key={channel.label}
                href={channel.href}
                target={channel.href.startsWith("http") ? "_blank" : undefined}
                rel={channel.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className={`group flex items-center gap-4 rounded-[16px] border p-4 md:p-5 transition-all duration-200 motion-safe:hover:-translate-y-0.5 cursor-pointer ${FOCUS_RING} ${
                  channel.highlight
                    ? "border-transparent bg-linear-to-br from-accent-500 to-accent-600 text-white shadow-[0_4px_14px_rgba(109,33,60,0.18)] hover:shadow-[0_16px_32px_rgba(109,33,60,0.25)]"
                    : "bg-white/95 border-gold-400/30 shadow-[0_6px_18px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_32px_rgba(109,33,60,0.1)] hover:border-gold-400/60"
                }`}
              >
                <span
                  className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center border ${
                    channel.highlight
                      ? "bg-white/15 border-white/20 text-white"
                      : "bg-linear-to-br from-accent-500/10 to-accent-500/5 border-accent-500/30 text-accent-500"
                  }`}
                >
                  <channel.icon className="w-5 h-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block text-[10px] uppercase tracking-[0.15em] font-medium mb-1 ${
                      channel.highlight ? "text-white/75" : "text-accent-500"
                    }`}
                  >
                    {channel.label}
                  </span>
                  <strong
                    className={`block text-[13px] md:text-[14px] font-semibold break-words leading-snug ${
                      channel.highlight ? "text-white" : "text-main"
                    }`}
                  >
                    {channel.value}
                  </strong>
                  <small
                    className={`block text-[11px] mt-0.5 ${channel.highlight ? "text-white/75" : "text-tertiary"}`}
                  >
                    {channel.note}
                  </small>
                </span>
                <IoArrowForward
                  className={`w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                    channel.highlight ? "text-white" : "text-accent-500"
                  }`}
                  aria-hidden="true"
                />
              </a>
            ))}
          </address>
        </div>
      </section>

      {/* Form + map */}
      <section className="bg-primary-600 py-9 md:py-20 lg:py-24">
        <div className="wrapper">
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4 lg:gap-16 lg:items-end mb-8 md:mb-12">
            <div>
              <p className={EYEBROW}>Start Here</p>
              <h2 className={`${H2} mt-2 sm:mt-3`}>
                Tell us what brings you
                <br />
                <em className="italic font-medium text-accent-500">to Tangier.</em>
              </h2>
            </div>
            <p className={`${BODY} max-w-md`}>
              A few details are enough to begin. Your message goes directly to our team on WhatsApp, ready for you to
              review before sending.
            </p>
          </div>

          <div className={`grid grid-cols-1 gap-4 md:gap-5 items-stretch ${hasMap ? "lg:grid-cols-[1.05fr_1fr]" : ""}`}>
            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-main rounded-[24px] p-6 md:p-8 flex flex-col">
              <div className="flex items-start gap-4 pb-5 mb-5 md:pb-6 md:mb-6 border-b border-white/10">
                <span className="text-[10px] text-white/40 tracking-[0.15em] pt-1.5">01</span>
                <div>
                  <h3 className="text-[20px] md:text-[22px] font-semibold text-white leading-tight">Send a message</h3>
                  <p className="text-[12px] text-white/50 mt-1">We&rsquo;ll take it from there.</p>
                </div>
              </div>

              <div className="space-y-4 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="block text-[11px] font-medium text-white/70 mb-2">Your name</span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Amina El Fassi"
                      autoComplete="name"
                      required
                      className={FIELD}
                    />
                  </label>
                  <label className="block">
                    <span className="block text-[11px] font-medium text-white/70 mb-2">
                      Phone or email <small className="text-white/35 font-normal">Optional</small>
                    </span>
                    <input
                      type="text"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="+212... or your@email.com"
                      className={FIELD}
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="block text-[11px] font-medium text-white/70 mb-2">How can we help?</span>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="I'm looking for a two-bedroom apartment in Malabata..."
                    rows={5}
                    required
                    className={`${FIELD} resize-none`}
                  />
                </label>
              </div>

              {/* Shared focus style, same as Services/FeaturedProperties — the dark-panel button gets its own offset colour so the ring doesn't flash white on black. */}
              <button
                type="submit"
                className="mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-linear-to-br from-accent-500 to-accent-600 text-white text-[12px] font-medium uppercase tracking-[0.08em] shadow-[0_4px_14px_rgba(109,33,60,0.18)] active:scale-95 transition-transform duration-200 touch-manipulation cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-main"
              >
                <IoSendOutline className="w-4 h-4" aria-hidden="true" />
                Continue on WhatsApp
              </button>

              <p
                className="mt-4 flex items-center justify-center gap-2 text-[11px] text-white/45 text-center"
                aria-live="polite"
              >
                <IoCheckmark className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                {sent
                  ? "WhatsApp has opened with your message ready to review."
                  : "Nothing is sent until you review and send it in WhatsApp."}
              </p>
            </form>

            {/* Map — skipped entirely if Settings has no office coordinates
                yet (PropertyLocationMap would render nothing anyway). The
                overlays are siblings of the map, not children, so they sit
                above Leaflet via z-10. */}
            {hasMap && (
              <div className="relative min-h-[380px]">
                <Suspense fallback={<MapLoadingFallback />}>
                  <PropertyLocationMap lat={lat} lng={lng} className="h-full min-h-[380px] rounded-[24px]" />
                </Suspense>

                {/* Top-right, not top-left: Leaflet's zoom buttons live top-left. */}
                <div className="pointer-events-none absolute top-4 right-4 z-10 flex items-center gap-2 rounded-[10px] bg-white px-3 py-2 shadow-[0_2px_10px_rgba(0,0,0,0.15)]">
                  <span className="text-[10px] text-tertiary">02</span>
                  <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-main">
                    Find us in Tangier
                  </span>
                </div>

                {/* bottom-8 (not bottom-4) so Leaflet's OpenStreetMap
                    attribution, bottom-right, stays visible under the card. */}
                <div className="absolute bottom-8 left-4 right-4 z-10 flex items-center gap-4 rounded-[16px] bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
                  <span className="w-11 h-11 shrink-0 rounded-full bg-linear-to-br from-accent-500 to-accent-600 text-white flex items-center justify-center">
                    <IoLocationOutline className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-[0.15em] font-medium text-accent-500 mb-0.5">
                      BSI Properties
                    </p>
                    <strong className="block text-[14px] font-semibold text-main truncate">{settings.address}</strong>
                    <span className="flex items-center gap-1.5 text-[11px] text-tertiary mt-0.5">
                      <IoTimeOutline className="w-3.5 h-3.5" aria-hidden="true" />
                      Visits by appointment
                    </span>
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${settings.office_lat},${settings.office_lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open location in maps"
                    className={`w-9 h-9 shrink-0 rounded-full border border-accent-500/30 text-accent-500 flex items-center justify-center hover:bg-accent-500 hover:text-white transition-colors ${FOCUS_RING}`}
                  >
                    <IoArrowForward className="w-4 h-4" aria-hidden="true" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* What to expect */}
      <section className="bg-primary-500 py-9 md:py-20 lg:py-24">
        <div className="wrapper grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 lg:gap-16">
          <div>
            <p className={EYEBROW}>What To Expect</p>
            <h2 className={`${H2} mt-2 sm:mt-3 max-w-sm`}>Personal from the first message.</h2>
          </div>

          <div className="border-t border-main/10">
            {ASSURANCES.map((item) => (
              <article
                key={item.number}
                className="grid grid-cols-[36px_1fr] sm:grid-cols-[48px_1fr_1fr] gap-x-4 gap-y-1 items-center py-5 md:py-7 border-b border-main/10"
              >
                <span className="text-[10px] text-accent-500 tracking-[0.15em]">{item.number}</span>
                <strong className="text-[14px] sm:text-[15px] md:text-base font-medium text-main">{item.title}</strong>
                <p className="col-start-2 sm:col-start-3 text-[13px] md:text-[14px] text-secondary">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default ContactPage;
