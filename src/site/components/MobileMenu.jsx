import { Link, NavLink } from "react-router";
import { CgClose } from "react-icons/cg";
import { IoCallOutline, IoLogoWhatsapp } from "react-icons/io5";
import { useSiteSettings } from "@/site/context/SiteSettingsProvider";
import useBodyScrollLock from "@/shared/hooks/useBodyScrollLock";
import useEscapeKey from "@/shared/hooks/useEscapeKey";
import SiteLogo from "@/site/components/SiteLogo";
import { NAV_LINKS } from "@/site/lib/navLinks";
import { buildCallUrl, buildWhatsAppUrl } from "@/site/lib/phoneLinks";

function MobileMenu({ isOpen, onClose }) {
  const settings = useSiteSettings();

  // Lock body scroll while the mobile drawer is open. Uses the same shared,
  // counter-based hook as the favorites panel and the property overlays
  // instead of its own `overflow: hidden` toggle — plain overflow:hidden
  // doesn't stop iOS Safari from scrolling the page behind the drawer, and
  // its cleanup (`overflow = ""`) could also clobber a lock another overlay
  // was still holding.
  useBodyScrollLock(isOpen);

  // Escape closes the drawer, as expected of any modal dialog.
  useEscapeKey(isOpen, onClose);

  // Mobile / tablet drawer — favorites and language both live in the
  // header itself now (visible at every breakpoint), so this stays
  // to just nav + contact, same as it was before either was added
  // here.
  // `inert` while closed: the drawer stays mounted so it can animate,
  // but opacity-0 + pointer-events-none only hide it from the mouse —
  // keyboard users could still Tab into its invisible links, and its
  // aria-modal dialog stayed exposed to screen readers. inert removes
  // it from both until it's actually open.
  return (
    <div
      inert={!isOpen}
      className={`fixed inset-0 z-[60] lg:hidden transition-opacity duration-300 ${
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={`absolute top-0 left-0 h-full w-[80%] max-w-[360px] bg-white flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <Link to="/" onClick={onClose} className="h-8">
            <SiteLogo sizes="32px" />
          </Link>
          <button type="button" onClick={onClose} aria-label="Close menu" className="text-[24px] text-neutral-500">
            <CgClose />
          </button>
        </div>

        <nav className="flex flex-col px-6 py-8 gap-6">
          <ul className="flex flex-col gap-6">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `text-[18px] font-medium uppercase tracking-wide ${isActive ? "text-accent-500" : "text-neutral-800"}`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto px-6 py-6 border-t border-neutral-100 space-y-3">
          <Link
            to="/contact"
            onClick={onClose}
            className="flex items-center justify-center bg-accent-500 text-white text-[14px] font-semibold uppercase tracking-wide py-3 rounded-full"
          >
            Get in Touch
          </Link>
          <div className="flex items-center justify-center gap-4 pt-2">
            <a
              href={buildCallUrl(settings?.phone_number)}
              className="flex items-center gap-2 text-neutral-600 text-[13px]"
            >
              <IoCallOutline className="text-[18px]" /> Call
            </a>
            <a
              href={buildWhatsAppUrl(settings?.phone_number)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[#25D366] text-[13px]"
            >
              <IoLogoWhatsapp className="text-[18px]" /> WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MobileMenu;
