import { useState, useRef, useEffect } from "react";
import { IoGlobeOutline, IoCheckmark } from "react-icons/io5";
import { useLanguage, LANGUAGES } from "@/site/context/LanguageProvider";
import useEscapeKey from "@/shared/hooks/useEscapeKey";

// Shown at every breakpoint — Header.jsx renders it in the top bar on
// mobile too, and its drawer has no separate language picker. A
// click-toggled dropdown anchored to the right edge of its button, so it
// stays on-screen even when the button sits at the far end of a phone-width bar.
function LanguageDropdown() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Escape closes it too — the dropdown could only be dismissed with a
  // mouse before.
  useEscapeKey(isOpen, () => setIsOpen(false));

  const current = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  return (
    <div ref={containerRef} className="relative">
      {/* The visible text is just a code like "EN" next to a globe icon, which
          a screen reader would announce as only "EN" — the aria-label says
          what the control actually is. */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Language: ${current.label}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex items-center gap-1 text-[13px] font-medium text-neutral-700 hover:text-accent-500 transition-colors"
      >
        <IoGlobeOutline className="text-[19px]" />
        <span className="uppercase">{current.code}</span>
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute right-0 top-full mt-3 w-48 bg-white rounded-[14px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-neutral-100 py-2 z-10"
        >
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              role="option"
              aria-selected={language === lang.code}
              onClick={() => {
                setLanguage(lang.code);
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-primary-600 transition-colors"
            >
              <span>
                <span className="block text-[13px] text-main">{lang.label}</span>
                <span className="block text-[12px] text-secondary/60">{lang.native}</span>
              </span>
              {language === lang.code && <IoCheckmark className="text-accent-500 text-[16px] shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default LanguageDropdown;
