import { useEffect } from "react";
import { NavLink } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { IoChevronForward, IoClose } from "react-icons/io5";
import useBodyScrollLock from "@/shared/hooks/useBodyScrollLock";
import { NAV_ITEMS } from "@/admin/config/navItems";

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-accent-500 text-xs font-bold tracking-[0.08em] text-white">
        BSI
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-semibold leading-tight text-main">Agency Admin</span>
        <span className="text-[11px] leading-tight text-trenary">Tangier, Morocco</span>
      </div>
    </div>
  );
}

function NavList({ onNavigate }) {
  return (
    <nav className="mt-6 flex flex-col gap-1.5" aria-label="Admin navigation">
      {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex min-h-11 items-center gap-3 rounded-[10px] px-3.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
              isActive ? "bg-accent-500 text-white" : "text-secondary hover:bg-primary-600 hover:text-accent-500"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={19} className="shrink-0" />
              <span className="flex-1">{label}</span>
              {isActive && <IoChevronForward size={14} className="shrink-0 opacity-70" aria-hidden="true" />}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function SidebarFooter() {
  return (
    <div className="mt-auto border-t border-accent-500/10 px-2.5 pt-4">
      <p className="text-[11px] font-semibold text-main">BSI Properties</p>
      <p className="mt-0.5 text-[11px] text-trenary">Admin workspace</p>
    </div>
  );
}

export default function Sidebar({ isOpen, onClose }) {
  // Only the mobile off-canvas drawer sits behind a backdrop the user
  // could otherwise scroll through — the desktop sidebar is static in
  // the normal document flow, so it never needs the lock.
  useBodyScrollLock(isOpen);

  // Escape closes the drawer, as expected of any modal dialog. Only listens
  // while it's open.
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Desktop: persistent sidebar. Sticky and viewport-tall so the footer
          stays pinned at the bottom of the screen instead of the bottom of a
          long page. */}
      <aside className="hidden border-r border-accent-500/10 bg-white px-4 py-6 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:self-start lg:overflow-y-auto">
        <div className="border-b border-accent-500/10 px-2.5 pb-5">
          <Brand />
        </div>
        <NavList />
        <SidebarFooter />
      </aside>

      {/* Mobile / tablet: off-canvas drawer, same slide-in + backdrop pattern as the public filter panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 touch-none bg-black/40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              aria-hidden="true"
            />
            {/* aria-label: an aria-modal dialog with no name is announced as
                just "dialog" — this says what it is. */}
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-y-auto bg-white px-4 py-6 shadow-[18px_0_50px_rgba(31,19,24,0.14)] lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              role="dialog"
              aria-modal="true"
              aria-label="Admin navigation"
            >
              <div className="flex items-center justify-between gap-2 border-b border-accent-500/10 px-2.5 pb-5">
                <Brand />
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close menu"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-secondary hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                >
                  <IoClose size={22} />
                </button>
              </div>
              <NavList onNavigate={onClose} />
              <SidebarFooter />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
