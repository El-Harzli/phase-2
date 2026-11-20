import { motion } from "framer-motion";
import { IoChevronForwardOutline } from "react-icons/io5";
import { SERVICES } from "@/site/lib/homeServices";
import { FOCUS_RING } from "@/site/lib/focusRing";

/* ============================================================
   DesktopGrid — all 3 services shown at once. No active/inactive
   state, no drag, no stacking, no counter.
   ============================================================ */
const gridContainerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.09 },
  },
};

const gridCardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

function ServicesGrid({ onSelectService }) {
  return (
    <>
      <motion.div
        role="list"
        className="grid grid-cols-3 gap-5 lg:gap-8 mb-8"
        variants={gridContainerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        {SERVICES.map((service) => (
          <motion.div
            key={service.number}
            role="listitem"
            variants={gridCardVariants}
            whileHover={{ y: -6 }}
            transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
            className="
              group relative
              bg-white/95
              rounded-[28px] p-6 lg:p-8
              border border-gold-400/30
              shadow-[0_6px_18px_rgba(0,0,0,0.06)]
              hover:shadow-[0_16px_32px_rgba(109,33,60,0.1)]
              hover:border-gold-400/60
              flex flex-col
              overflow-hidden
            "
          >
            <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.03] pointer-events-none">
              <div className="absolute top-4 right-4 w-20 h-20 border-t-2 border-r-2 border-accent-500 rounded-tr-3xl"></div>
            </div>

            <div className="flex items-start justify-between mb-6 relative z-10">
              <div>
                <span className="text-[48px] lg:text-[64px] font-bold leading-none bg-linear-to-br from-accent-500/15 via-accent-500/10 to-transparent bg-clip-text text-transparent">
                  {service.number}
                </span>
                <p className="text-[10px] uppercase tracking-[0.15em] text-gold-600 font-medium mt-1">
                  {service.accent}
                </p>
              </div>

              <div
                className="
                  w-12 h-12 lg:w-14 lg:h-14 rounded-[18px]
                  bg-linear-to-br from-accent-500/10 to-accent-500/5
                  border border-accent-500/30
                  flex items-center justify-center
                  shadow-[0_2px_8px_rgba(109,33,60,0.06)]
                  transition-transform duration-300
                  group-hover:scale-105
                "
              >
                <service.icon className="w-5 h-5 lg:w-6 lg:h-6 text-accent-500" strokeWidth={1.5} aria-hidden="true" />
              </div>
            </div>

            <h3 className="text-[21px] lg:text-[24px] font-semibold text-main mb-1.5 leading-[1.2]">{service.title}</h3>
            <span className="block h-[2px] w-8 bg-gold-500 rounded-full mb-3 transition-all duration-300 group-hover:w-14" />

            <p className="text-[14px] text-secondary leading-[1.75] flex-1">{service.description}</p>

            <button
              type="button"
              onClick={() => onSelectService?.(service)}
              className={`
                mt-6 self-start
                inline-flex items-center gap-2
                px-5 py-2.5 rounded-full
                border border-accent-500/30
                text-accent-500 text-[12px] font-medium
                uppercase tracking-[0.1em]
                group-hover:bg-linear-to-br group-hover:from-accent-500 group-hover:to-accent-600
                group-hover:text-white
                group-hover:border-transparent
                transition-colors duration-200
                active:scale-95
                ${FOCUS_RING}
              `}
            >
              {service.cta}
              <IoChevronForwardOutline
                className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
                aria-hidden="true"
              />
            </button>
          </motion.div>
        ))}
      </motion.div>

      {/* Summary */}
      <p className="text-center text-[12px] text-tertiary">
        <span className="text-accent-500 font-medium">{SERVICES.length}</span>{" "}
        <span className="text-secondary">Signature Services</span>
      </p>
    </>
  );
}

export default ServicesGrid;
