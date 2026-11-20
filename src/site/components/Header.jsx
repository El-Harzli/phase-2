import { useState, useEffect, useRef } from "react";
import { CgMenuLeftAlt } from "react-icons/cg";
import { IoHeartOutline } from "react-icons/io5";
import { Link, NavLink } from "react-router";
import { useFavorites } from "@/site/context/FavoritesProvider";
import useFavoriteProperties from "@/site/hooks/useFavoriteProperties";
import FavoritesPanel from "@/site/components/FavoritesPanel";
import LanguageDropdown from "@/site/components/LanguageDropdown";
import MobileMenu from "@/site/components/MobileMenu";
import SiteLogo from "@/site/components/SiteLogo";
import { NAV_LINKS } from "@/site/lib/navLinks";

function Header() {
  const { favorites } = useFavorites();
  // The badge counts only favorites that still exist: a saved listing that was deleted
  // or unpublished is not counted (it stays saved, and counts again if it comes back).
  // Which ones exist is asked once when the site opens, and only if something is saved;
  // until the answer arrives — or if it can't be had — it shows the saved count.
  const {
    properties: existingFavorites,
    loading: isCheckingFavorites,
    failed: couldNotCheckFavorites,
  } = useFavoriteProperties(favorites, true);
  const favoritesCount = isCheckingFavorites || couldNotCheckFavorites ? favorites.size : existingFavorites.length;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const lastScrollY = useRef(0);

  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    const HIDE_THRESHOLD = 80; // px scrolled before hide/show kicks in

    const handleScroll = () => {
      // While an overlay holds the shared body scroll lock (useBodyScrollLock),
      // the body is pinned with position:fixed, so window.scrollY reads 0 and
      // then jumps back to the saved position when the overlay closes. That
      // jump looks exactly like "scrolled down" and used to hide the header
      // the moment you closed the favorites panel or a property overlay.
      // Ignoring scroll events during the lock means lastScrollY still holds
      // the pre-lock position, so the restore registers as no movement.
      if (document.body.style.position === "fixed") return;

      const currentScrollY = window.scrollY;

      setIsScrolled(currentScrollY > 10);

      if (currentScrollY < HIDE_THRESHOLD) {
        setIsHidden(false);
      } else if (currentScrollY > lastScrollY.current) {
        setIsHidden(true); // scrolling down
      } else {
        setIsHidden(false); // scrolling up
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Only the slide (hide/show) and box-shadow ever change here, so
          transition just those instead of `all`. Tailwind v4's translate
          utilities (-translate-y-full etc.) set the standalone `translate`
          CSS property, not `transform` — so `translate` has to be listed
          explicitly, or the slide happens instantly with no animation. */}
      <header
        className={`fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md transition-[translate,box-shadow] duration-300 ease-in-out ${
          isHidden ? "-translate-y-full" : "translate-y-0"
        } ${isScrolled ? "shadow-sm" : ""}`}
      >
        {/* Plain flex + justify-between at every breakpoint now — there's
            no longer a middle item (logo) that needs a grid to center, so
            the earlier md:grid-cols-3 trick isn't needed. Logo only shows
            from lg up (see below); below that, the drawer's own header
            carries the logo instead. */}
        <div className="wrapper w-full flex items-center justify-between py-3 lg:py-4">
          {/* Hamburger + a small mark, grouped so they move together as one
              unit — brand presence still matters on mobile (shared links,
              screenshots), it just can't be a full centered logo without
              recreating the crowding you flagged before. Hidden at lg,
              where the full logo below takes over instead. */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={isMenuOpen}
              className="text-[26px] text-accent-500"
            >
              <CgMenuLeftAlt />
            </button>
            <Link to="/" className="h-7 shrink-0">
              <SiteLogo sizes="28px" />
            </Link>
          </div>

          {/* Full logo — desktop only; see the grouped small mark above for
              mobile/tablet. */}
          <Link to="/" className="hidden lg:block h-9 shrink-0">
            <SiteLogo sizes="36px" />
          </Link>

          {/* Desktop nav — hidden on mobile */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
            <ul className="flex items-center gap-6 xl:gap-8">
              {NAV_LINKS.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    className={({ isActive }) =>
                      `text-[14px] uppercase tracking-wide font-medium transition-colors ${
                        isActive ? "text-accent-500" : "text-neutral-800 hover:text-accent-500"
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Favorites + language show at every breakpoint now that the
              logo isn't competing for room next to them on mobile. The CTA
              still needs more width than a phone-size bar comfortably has
              alongside two icons, so it only joins in from md up — it's
              still fully reachable on mobile via the drawer footer below. */}
          <div className="flex items-center gap-4 sm:gap-5">
            <button
              type="button"
              onClick={() => setIsFavoritesOpen(true)}
              aria-label={`View favorites (${favoritesCount} saved)`}
              className="relative text-[22px] text-accent-500 hover:opacity-80 transition-opacity"
            >
              <IoHeartOutline />
              {favoritesCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-accent-500 text-white text-[10px] font-semibold leading-none">
                  {favoritesCount > 99 ? "99+" : favoritesCount}
                </span>
              )}
            </button>

            <LanguageDropdown />

            <Link
              to="/contact"
              className="hidden md:inline-flex items-center bg-accent-500 text-white text-[13px] font-semibold uppercase tracking-wide px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </header>

      <FavoritesPanel isOpen={isFavoritesOpen} onClose={() => setIsFavoritesOpen(false)} />

      <MobileMenu isOpen={isMenuOpen} onClose={closeMenu} />
    </>
  );
}

export default Header;
