import { useState } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { IoLogoWhatsapp, IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { AGENT_NOTES, DEFAULT_NOTE, PORTRAIT_TONES } from "@/site/lib/aboutContent";
import { fadeUp } from "@/site/lib/aboutMotion";
import { FOCUS_RING } from "@/site/lib/focusRing";
import { buildWhatsAppUrl, toDialDigits } from "@/site/lib/phoneLinks";

function getInitials(name) {
  return (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

/* =========================================================================
   Team card — compact horizontal card on phones, portrait card from md up
   ========================================================================= */
function AboutAgentCard({ agent, listingCount, index }) {
  const [photoFailed, setPhotoFailed] = useState(false);

  const name = (agent.name || "").trim();
  const firstName = name.split(/\s+/)[0] || "us";
  const note = AGENT_NOTES[firstName.toLowerCase()] ?? DEFAULT_NOTE;
  const showPhoto = Boolean(agent.avatar_url) && !photoFailed;

  const whatsappLink = toDialDigits(agent.phone)
    ? `${buildWhatsAppUrl(agent.phone)}?text=${encodeURIComponent(
        `Hi ${name}, I'd like to get in touch about a property in Tangier.`,
      )}`
    : null;

  const ctaClass = `inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-full border border-accent-500/30 px-3.5 py-2 text-[11px] font-medium uppercase tracking-[0.08em] text-accent-500 transition-colors duration-200 hover:border-transparent hover:bg-accent-500 hover:text-white md:min-h-[40px] md:px-4 ${FOCUS_RING}`;
  const ctaContent = (
    <>
      {whatsappLink ? (
        <IoLogoWhatsapp aria-hidden="true" className="size-3.5" />
      ) : (
        <IoChatbubbleEllipsesOutline aria-hidden="true" className="size-3.5" />
      )}
      Message<span className="hidden md:inline"> {firstName}</span>
    </>
  );

  return (
    <motion.article
      {...fadeUp(index)}
      className="grid grid-cols-[36%_1fr] overflow-hidden rounded-2xl border border-gold-400/30 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition duration-300 hover:border-gold-400/50 hover:shadow-[0_8px_24px_rgba(109,33,60,0.08)] md:block"
    >
      {/* Portrait */}
      <div
        className={`relative grid min-h-[220px] place-items-center overflow-hidden text-white before:absolute before:size-[130px] before:rounded-full before:border before:border-white/30 before:content-[''] after:absolute after:size-[90px] after:rounded-full after:border after:border-white/30 after:content-[''] md:aspect-[5/4] md:min-h-0 md:before:size-[250px] md:after:size-[180px] ${
          PORTRAIT_TONES[index % PORTRAIT_TONES.length]
        }`}
      >
        {showPhoto ? (
          <img
            src={agent.avatar_url}
            alt={name}
            loading="lazy"
            decoding="async"
            onError={() => setPhotoFailed(true)}
            className="absolute inset-0 z-[1] h-full w-full object-cover object-top"
          />
        ) : (
          <span className="relative z-[2] grid size-14 place-items-center rounded-full border border-white/70 text-[18px] font-semibold tracking-wide md:size-24 md:text-[28px]">
            {getInitials(name)}
          </span>
        )}
        <span className="absolute bottom-3 right-3 z-[2] text-[9px] font-semibold tracking-[0.18em] opacity-70">
          B.S.I.
        </span>
      </div>

      {/* Details */}
      <div className="flex flex-col p-4 md:p-6">
        <h3 className="text-[16px] font-semibold tracking-tight text-main md:text-[20px]">{name}</h3>
        <p className="mt-1 text-[10px] uppercase leading-snug tracking-[0.08em] text-trenary">
          B.S.I. Family Team
          {/* No count at all when it isn't known (null): never a made-up "0 listings". */}
          {listingCount !== null && listingCount !== undefined && (
            <>
              {" "}
              <span aria-hidden="true" className="px-0.5 text-gold-600">
                ·
              </span>{" "}
              {listingCount} {listingCount === 1 ? "listing" : "listings"}
            </>
          )}
        </p>

        <p className="mt-3 text-[12px] leading-[1.7] text-secondary md:mt-4 md:text-[13px]">{note}</p>

        <div className="mt-auto pt-4 md:pt-5">
          {whatsappLink ? (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Message ${name} on WhatsApp (opens in a new tab)`}
              className={ctaClass}
            >
              {ctaContent}
            </a>
          ) : (
            <Link to="/contact" aria-label={`Message ${name}`} className={ctaClass}>
              {ctaContent}
            </Link>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export default AboutAgentCard;
