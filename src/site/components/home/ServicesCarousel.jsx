import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoChevronForwardOutline, IoChevronBackOutline } from "react-icons/io5";
import { SERVICES } from "@/site/lib/homeServices";
import { FOCUS_RING } from "@/site/lib/focusRing";

const CARD_STACK_DEPTH = 2; // mobile: how many cards behind the active one stay visible

/* ============================================================
   MobileCarousel — stacked / swipeable card design.
   ============================================================ */
function ServicesCarousel({ onSelectService }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const handleNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % SERVICES.length);
  }, []);

  const handlePrevious = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + SERVICES.length) % SERVICES.length);
  }, []);

  const handleDotClick = useCallback(
    (index) => {
      setDirection(index > currentIndex ? 1 : -1);
      setCurrentIndex(index);
    },
    [currentIndex],
  );

  const handleDragEnd = useCallback(
    (event, info) => {
      const swipeThreshold = 50;
      if (info.offset.x > swipeThreshold) {
        handlePrevious();
      } else if (info.offset.x < -swipeThreshold) {
        handleNext();
      }
    },
    [handleNext, handlePrevious],
  );

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        handleNext();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        handlePrevious();
      }
    },
    [handleNext, handlePrevious],
  );

  const cardTransition = { type: "tween", duration: 0.32, ease: "easeOut" };
  const contentTransition = { duration: 0.2, ease: "easeOut" };

  return (
    <>
      {/* Stacked Cards Container */}
      <div
        id="services-carousel-region"
        className={`relative h-[400px] mb-6 rounded-[28px] ${FOCUS_RING}`}
        role="region"
        aria-roledescription="carousel"
        aria-label="Our services"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <p className="sr-only" aria-live="polite">
          {`Showing service ${currentIndex + 1} of ${SERVICES.length}: ${SERVICES[currentIndex].title}`}
        </p>

        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          {SERVICES.map((service, index) => {
            const offset = (index - currentIndex + SERVICES.length) % SERVICES.length;
            const isActive = offset === 0;

            if (offset > CARD_STACK_DEPTH) return null;

            const zIndex = isActive ? 30 : 30 - offset;

            return (
              <motion.div
                key={service.number}
                initial={false}
                animate={{
                  x: isActive ? 0 : -10 * offset,
                  scale: isActive ? 1 : Math.max(0.86, 1 - offset * 0.08),
                  opacity: isActive ? 1 : Math.max(0.2, 0.6 - offset * 0.2),
                }}
                exit={{ opacity: 0, x: direction > 0 ? -40 : 40 }}
                transition={cardTransition}
                drag={isActive ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.12}
                dragMomentum={false}
                onDragEnd={handleDragEnd}
                className="absolute inset-0 w-full cursor-grab active:cursor-grabbing"
                style={{ transformOrigin: "center bottom", zIndex }}
                aria-hidden={!isActive}
              >
                <div
                  className="
                    relative
                    bg-white/95
                    rounded-[28px] p-7
                    border border-gold-400/30
                    shadow-[0_6px_18px_rgba(0,0,0,0.06)]
                    h-full
                    flex flex-col
                    overflow-hidden
                  "
                >
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.03] pointer-events-none">
                    <div className="absolute top-4 right-4 w-20 h-20 border-t-2 border-r-2 border-accent-500 rounded-tr-3xl"></div>
                  </div>

                  <div className="flex items-start justify-between mb-6 relative z-10">
                    <div>
                      <span className="text-[72px] font-bold leading-none bg-linear-to-br from-accent-500/15 via-accent-500/10 to-transparent bg-clip-text text-transparent">
                        {service.number}
                      </span>
                      <AnimatePresence>
                        {isActive && (
                          <motion.p
                            key="accent"
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={contentTransition}
                            className="text-[10px] uppercase tracking-[0.15em] text-gold-600 font-medium mt-1"
                          >
                            {service.accent}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    <div
                      className="
                        w-16 h-16 rounded-[20px]
                        bg-linear-to-br from-accent-500/10 to-accent-500/5
                        border border-accent-500/30
                        flex items-center justify-center
                        shadow-[0_2px_8px_rgba(109,33,60,0.06)]
                      "
                    >
                      <service.icon className="w-7 h-7 text-accent-500" strokeWidth={1.5} aria-hidden="true" />
                    </div>
                  </div>

                  <h3 className="text-[24px] font-semibold text-main mb-1.5 leading-[1.2]">{service.title}</h3>
                  <span className="block h-[2px] w-8 bg-gold-500 rounded-full mb-3" aria-hidden="true" />

                  {/* min-h-0 lets this flex child actually shrink, and
                      overflow-y-auto then lets the text scroll instead of
                      silently clipping behind the card's overflow-hidden —
                      a safety net for text reflow from accessibility zoom or
                      translations, since the card height is fixed. */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.p
                        key="description"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={contentTransition}
                        className="text-[14px] text-secondary leading-[1.75] flex-1 min-h-0 overflow-y-auto pr-1"
                      >
                        {service.description}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {/* Single full-width CTA per card. Navigation to the next
                      card is handled by swipe + the dots below; this button's
                      only job is routing to the specific service. */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        key="footer-actions"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={contentTransition}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="mt-6"
                      >
                        <button
                          type="button"
                          onClick={() => onSelectService?.(service)}
                          className={`
                            w-full inline-flex items-center justify-center gap-1.5
                            px-4 py-3 rounded-full
                            bg-linear-to-br from-accent-500 to-accent-600
                            text-white text-[12px] font-medium
                            uppercase tracking-[0.08em]
                            shadow-[0_4px_14px_rgba(109,33,60,0.18)]
                            active:scale-95
                            transition-transform duration-200
                            touch-manipulation
                            ${FOCUS_RING}
                          `}
                        >
                          {service.cta}
                          <IoChevronForwardOutline className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Navigation Dots */}
      <div className="flex items-center justify-center gap-4 mb-4" role="tablist" aria-label="Select a service">
        {SERVICES.map((service, index) => (
          <button
            key={service.number}
            type="button"
            role="tab"
            aria-selected={currentIndex === index}
            aria-controls="services-carousel-region"
            aria-label={`Go to ${service.title}`}
            onClick={() => handleDotClick(index)}
            // p-2 -m-2 enlarges the tap target to ~24px without changing the
            // visual dot size or the spacing between dots — small dots are a
            // common source of missed taps on touch devices.
            className={`group relative p-2 -m-2 touch-manipulation rounded-full ${FOCUS_RING}`}
          >
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                currentIndex === index
                  ? "w-10 bg-linear-to-r from-accent-500 to-accent-600"
                  : "w-2 bg-accent-500/25 group-hover:bg-accent-500/50"
              }`}
            />
            {currentIndex === index && (
              <motion.div
                className="absolute -inset-1 bg-accent-500/10 rounded-full -z-10"
                initial={false}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.18 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Swipe hint — takes the slot the numeric counter used to occupy.
          The dots above already show position, so this space is better
          spent telling first-time users the card responds to a swipe. */}
      <div className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.15em] text-tertiary">
        <IoChevronBackOutline className="w-3 h-3 text-accent-500/40" aria-hidden="true" />
        <span>Swipe to explore</span>
        <IoChevronForwardOutline className="w-3 h-3 text-accent-500/40" aria-hidden="true" />
      </div>
    </>
  );
}

export default ServicesCarousel;
