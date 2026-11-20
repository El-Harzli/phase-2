import { motion, AnimatePresence } from "framer-motion";

function ReasonCard({ reason, index, isExpanded, toggleCard }) {
  const panelId = `reason-panel-${reason.id}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="relative"
    >
      {/* Only the shadow changes between states, so transition-shadow
          instead of transition-all — no need to watch every property. */}
      <div
        className={`
          relative
          bg-white/95
          border border-gold-400/30
          rounded-2xl
          overflow-hidden
          transition-shadow duration-400
          ${isExpanded ? "shadow-[0_8px_24px_rgba(109,33,60,0.08)]" : "shadow-[0_2px_12px_rgba(0,0,0,0.04)]"}
        `}
      >
        {/* Collapsed State - Always Visible.
            This row was a clickable <div>, which keyboard and screen-reader
            users couldn't reach or operate at all. A real <button> gives it
            focus, Enter/Space, and aria-expanded for free. The focus ring is
            inset because the card's overflow-hidden would clip an outer one. */}
        <button
          type="button"
          onClick={() => toggleCard(reason.id)}
          aria-expanded={isExpanded}
          aria-controls={isExpanded ? panelId : undefined}
          className="w-full flex items-center gap-4 p-4 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-500"
        >
          {/* Icon Circle */}
          <div
            className={`
              w-14 h-14 rounded-full shrink-0
              flex items-center justify-center
              border transition-all duration-300
              ${
                isExpanded
                  ? "bg-accent-500 border-accent-500"
                  : "bg-linear-to-br from-accent-500/10 to-accent-500/5 border-accent-500/20"
              }
            `}
          >
            <reason.icon
              className={`w-6 h-6 transition-colors duration-300 ${isExpanded ? "text-white" : "text-accent-500"}`}
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </div>

          {/* Title + Stat */}
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-medium text-main leading-tight mb-0.5">{reason.title}</h3>
            <p className="text-[11px] text-gold-600 uppercase tracking-[0.12em]">
              {reason.stat} {reason.label}
            </p>
          </div>

          {/* Expand Icon */}
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }} className="shrink-0">
            <svg
              className="w-5 h-5 text-accent-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </button>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              id={panelId}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 pt-0">
                <div className="pl-[72px]">
                  <p className="text-[13px] text-secondary leading-[1.7]">{reason.description}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default ReasonCard;
