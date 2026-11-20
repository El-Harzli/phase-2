import { useMemo } from "react";
import { Link } from "react-router";
import { motion, MotionConfig } from "framer-motion";
import { IoLocationOutline, IoCheckmark, IoHomeOutline, IoArrowForward } from "react-icons/io5";
import { useSiteSettings } from "@/site/context/SiteSettingsProvider";
import useAgents from "@/site/hooks/useAgents";
import usePropertyCounts from "@/site/hooks/usePropertyCounts";
import usePageTitle from "@/shared/seo/usePageTitle";
import usePageMeta from "@/shared/seo/usePageMeta";
import Breadcrumbs from "@/site/components/Breadcrumbs";
import JsonLd from "@/site/components/JsonLd";
import Spinner from "@/shared/components/Spinner";
import AboutEyebrow from "@/site/components/about/AboutEyebrow";
import AboutAgentCard from "@/site/components/about/AboutAgentCard";
import { META_DESCRIPTION, PAGE_PATH, IMG, unsplash, srcSet, METRICS, VALUES, APPROACH } from "@/site/lib/aboutContent";
import { fadeUp } from "@/site/lib/aboutMotion";

/* =========================================================================
   Shared styles — same scale as Home / Concierge so the pages feel like one site
   ========================================================================= */
const SECTION_Y = "py-[58px] md:py-[72px] lg:py-[88px]";

const FOCUS_RING_LIGHT =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-accent-600";

const H2 = "mt-4 text-balance text-[clamp(32px,3.5vw,52px)] font-semibold leading-[0.98] tracking-[-0.05em] text-main";
const SIDE_COPY = "text-[14px] leading-[1.75] text-secondary";
const HEADING_GRID =
  "grid items-end gap-5 md:grid-cols-[1fr_0.7fr] md:gap-[8%] lg:grid-cols-[1.15fr_0.55fr] lg:gap-[12%]";
const ICON_CHIP =
  "flex shrink-0 items-center justify-center rounded-full border border-accent-500/20 bg-linear-to-br from-accent-500/10 to-accent-500/5 text-accent-500";

// Content stops growing at 1400px (same cap WhyUs uses) so headings and
// paragraphs never stretch into long strips on very wide monitors.
function Container({ children, className = "" }) {
  return (
    <div className="wrapper">
      <div className={`mx-auto max-w-[1400px] ${className}`}>{children}</div>
    </div>
  );
}

const Em = ({ children, light = false }) => (
  <em className={`font-semibold italic ${light ? "text-gold-400" : "text-accent-500"}`}>{children}</em>
);

// Forced line break only from sm up; on phones text-balance does the wrapping.
const Br = () => (
  <>
    <br className="hidden sm:block" />{" "}
  </>
);

function AboutPage() {
  usePageTitle("About Us: Family-Run Real Estate Agency in Tangier");
  usePageMeta(META_DESCRIPTION);
  const settings = useSiteSettings();
  const { agents, loading: agentsLoading } = useAgents();
  // Only published listings are counted (see api/propertyCounts.js), so each
  // agent's number reflects their active, publicly visible workload. Waited for
  // together with the agents so the numbers don't pop in afterwards; if the
  // counts can't be loaded the team still shows, just without the numbers.
  const { loading: countsLoading, getListingCountForAgent } = usePropertyCounts();
  const loading = agentsLoading || countsLoading;

  const brand = settings.agency_name;

  const schema = useMemo(() => {
    const siteUrl = window.location.origin;
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "AboutPage",
          name: `About ${brand}`,
          url: `${siteUrl}${PAGE_PATH}`,
          description: META_DESCRIPTION,
          mainEntity: { "@id": `${siteUrl}/#agency` },
        },
        {
          "@type": "RealEstateAgent",
          "@id": `${siteUrl}/#agency`,
          name: brand,
          url: siteUrl,
          foundingDate: "2011",
          areaServed: { "@type": "City", name: "Tangier" },
          employee: agents
            .filter((agent) => agent.name)
            .map((agent) => ({
              "@type": "Person",
              name: agent.name,
              jobTitle: "Real estate agent",
            })),
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
            { "@type": "ListItem", position: 2, name: "About us", item: `${siteUrl}${PAGE_PATH}` },
          ],
        },
      ],
    };
  }, [agents, brand]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="overflow-x-clip">
        <JsonLd data={schema} />

        {/* ------------------------------ Hero ------------------------------ */}
        <section className="bg-primary-500 pb-10 pt-24 sm:pb-12 sm:pt-28 md:pb-16 md:pt-32 lg:pt-36">
          <Container>
            <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "About us" }]} />

            <div className="mx-auto mb-8 mt-8 max-w-[1000px] text-left sm:mt-10 md:mb-12 md:mt-12 md:text-center">
              <AboutEyebrow center>Rooted in Tangier · Since 2011</AboutEyebrow>
              <h1 className="mt-4 text-balance text-[clamp(38px,11vw,48px)] font-semibold leading-[0.98] tracking-[-0.05em] text-main sm:text-[clamp(48px,5vw,78px)]">
                A family name, built on
                <Br />
                <Em>lasting relationships.</Em>
              </h1>
              <p className="mx-auto mt-5 max-w-[620px] text-[14px] leading-[1.8] text-secondary md:text-[15px]">
                B.S.I. is a family-run real estate agency shaped by Tangier, built on local knowledge, quiet discretion,
                and the belief that every property journey should feel deeply personal.
              </p>
            </div>

            <div className="relative pb-8">
              <div className="relative h-[320px] overflow-hidden rounded-2xl bg-primary-600 after:absolute after:inset-0 after:bg-[linear-gradient(180deg,transparent_58%,rgb(12_12_12/0.55))] after:content-[''] sm:h-[400px] md:mx-[5%] md:h-[500px] lg:h-[580px]">
                <img
                  src={unsplash(IMG.hero, 1400)}
                  srcSet={srcSet(IMG.hero, [640, 1000, 1400, 1800])}
                  sizes="(min-width: 1536px) 1300px, (min-width: 768px) 86vw, 92vw"
                  alt="White Tangier buildings overlooking the blue coast"
                  width="1800"
                  height="1200"
                  decoding="async"
                  fetchPriority="high"
                  className="h-full w-full object-cover object-[57%_center] md:object-center"
                />
                <div className="absolute bottom-4 left-[104px] z-[2] flex items-center gap-4 text-[11px] text-white [text-shadow:0_1px_8px_rgb(0_0_0/0.5)] md:bottom-6 md:left-6 md:text-xs">
                  <span className="hidden border-r border-white/45 pr-4 tracking-[0.12em] md:block">35.78° N</span>
                  <span>Our city. Our home. Our field of expertise.</span>
                </div>
              </div>

              <div
                aria-hidden="true"
                className="absolute -left-1 bottom-0 z-[3] grid size-[84px] place-content-center gap-1 rounded-full border border-gold-500 bg-primary-500 text-center text-accent-500 shadow-[0_12px_36px_rgba(47,32,35,0.14)] after:absolute after:inset-[6px] after:rounded-full after:border after:border-accent-500/[0.18] after:content-[''] md:bottom-auto md:left-0 md:top-14 md:size-[120px]"
              >
                <span className="text-[20px] font-semibold tracking-tight md:text-[26px]">B.S.I.</span>
                <small className="hidden text-[8px] font-semibold tracking-[0.14em] md:block">TANGIER · MOROCCO</small>
              </div>

              <div className="absolute right-3 top-3 z-[3] flex items-center gap-2.5 rounded-xl border border-accent-500/10 bg-white/95 px-3.5 py-3 shadow-[0_12px_36px_rgba(47,32,35,0.14)] md:right-[2%] md:top-8">
                <span className={`${ICON_CHIP} size-8`}>
                  <IoLocationOutline aria-hidden="true" className="size-4" />
                </span>
                <span className="grid gap-0.5 leading-tight">
                  <strong className="text-[12px] font-semibold text-main">Tangier, Morocco</strong>
                  <small className="text-[10px] text-trenary">Local knowledge since 2011</small>
                </span>
              </div>
            </div>
          </Container>
        </section>

        {/* ----------------------------- Metrics ----------------------------- */}
        <section className="border-y border-main/[0.08] bg-white" aria-label="B.S.I. milestones">
          <div className="wrapper">
            <div className="mx-auto grid max-w-[1400px] grid-cols-3">
              {METRICS.map((metric) => (
                <div
                  key={metric.label}
                  className="flex flex-col items-center justify-center gap-1 border-r border-main/10 px-2 py-6 text-center last:border-r-0 md:flex-row md:gap-4 md:py-9"
                >
                  <strong className="text-[24px] font-semibold tracking-tight text-accent-500 md:text-[32px]">
                    {metric.value}
                  </strong>
                  <span className="max-w-[96px] text-[10px] leading-[1.4] text-secondary md:max-w-[110px] md:text-left md:text-[12px]">
                    {metric.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------ Story ------------------------------ */}
        <section className={`bg-primary-500 ${SECTION_Y}`}>
          <Container className="grid grid-cols-1 items-center gap-12 md:gap-16 lg:grid-cols-[0.96fr_1.04fr] lg:gap-[9%]">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-[520px] lg:max-w-none lg:aspect-[6/7]">
              <img
                src={unsplash(IMG.storyTall, 720)}
                srcSet={srcSet(IMG.storyTall, [480, 720, 1000])}
                sizes="(min-width: 1024px) 32vw, (min-width: 768px) 40vw, 75vw"
                alt="A blue-painted street in Tangier's old city"
                width="1000"
                height="1250"
                loading="lazy"
                decoding="async"
                className="absolute left-0 top-0 h-full w-[76%] rounded-2xl object-cover"
              />
              <div className="absolute bottom-[8%] right-0 h-[38%] w-[62%] overflow-hidden rounded-2xl border-4 border-primary-500 shadow-[0_16px_40px_rgba(47,32,35,0.16)] md:border-[6px]">
                <img
                  src={unsplash(IMG.storyWide, 640)}
                  srcSet={srcSet(IMG.storyWide, [400, 640, 900])}
                  sizes="(min-width: 1024px) 20vw, (min-width: 768px) 25vw, 46vw"
                  alt="An elegant Moroccan home and courtyard"
                  width="900"
                  height="900"
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="absolute bottom-0 right-[3%] text-[13px] font-semibold italic text-accent-500">
                Tangier, always.
              </p>
            </div>

            <div className="max-w-[640px] lg:max-w-none">
              <AboutEyebrow>Our story</AboutEyebrow>
              <h2 className={H2}>
                The city shaped us.
                <Br />
                <Em>People built our name.</Em>
              </h2>
              <p className="mt-6 max-w-[620px] text-[16px] leading-[1.65] text-main md:text-[17px]">
                B.S.I. began as a small family practice with a simple conviction: property should never feel like an
                impersonal transaction.
              </p>
              <div className="mt-5 grid max-w-[560px] gap-4 text-[14px] leading-[1.8] text-secondary">
                <p>
                  Our roots are here in Tangier. We have seen its neighborhoods grow, its streets change, and new
                  generations discover the city we have always called home. That history gives us more than market
                  knowledge—it gives us context, instinct, and a genuine connection to place.
                </p>
                <p>
                  Over the years, we have helped families find somewhere to begin, owners care for homes from afar, and
                  people make important decisions with greater confidence. Some came looking for a property. Many became
                  long-term relationships.
                </p>
                <p>
                  Today, the family remains personally involved. We listen before we recommend, speak honestly when
                  something is not right, and stay close long after a decision has been made.
                </p>
              </div>
              <figure className="mt-8 max-w-[560px] border-l-2 border-accent-500 py-1 pl-5">
                <blockquote className="text-[17px] font-medium leading-[1.55] text-main md:text-[19px]">
                  <p>“For us, a successful deal is not the end of a transaction. It is the beginning of trust.”</p>
                </blockquote>
                <figcaption className="mt-3 text-[11px] uppercase tracking-[0.12em] text-trenary">
                  — The Tatari family
                </figcaption>
              </figure>
            </div>
          </Container>
        </section>

        {/* ------------------------------ Values ------------------------------ */}
        <section className={`bg-primary-600 ${SECTION_Y}`}>
          <Container>
            <div className={HEADING_GRID}>
              <div>
                <AboutEyebrow>What we believe</AboutEyebrow>
                <h2 className={H2}>
                  Principles that guide
                  <Br />
                  <Em>every relationship.</Em>
                </h2>
              </div>
              <p className={SIDE_COPY}>
                Our values are not a statement on a wall. They shape how we choose properties, offer advice, and care
                for the people who place their trust in us.
              </p>
            </div>

            <div className="mt-8 border-t border-main/[0.12] md:mt-11">
              {VALUES.map(({ number, Icon, title, body }, index) => (
                <motion.article
                  key={number}
                  {...fadeUp(index)}
                  className="grid grid-cols-[1fr_auto] items-center gap-y-4 border-b border-main/[0.12] py-6 md:grid-cols-[72px_56px_1fr] md:gap-x-6 md:py-8"
                >
                  <span aria-hidden="true" className="text-[32px] font-semibold leading-none text-accent-500/25">
                    {number}
                  </span>
                  <span className={`${ICON_CHIP} size-12`}>
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <div className="col-span-2 md:col-span-1 md:grid md:grid-cols-[0.62fr_1fr] md:items-center md:gap-[6%]">
                    <h3 className="text-[18px] font-semibold tracking-tight text-main md:text-[20px]">{title}</h3>
                    <p className="mt-2 max-w-[560px] text-[14px] leading-[1.75] text-secondary md:mt-0">{body}</p>
                  </div>
                </motion.article>
              ))}
            </div>
          </Container>
        </section>

        {/* ----------------------------- Approach ----------------------------- */}
        <section className={`bg-white ${SECTION_Y}`}>
          <Container className="grid gap-12 lg:grid-cols-[0.88fr_1.12fr] lg:items-start lg:gap-[8%]">
            <div className="md:grid md:grid-cols-2 md:items-center md:gap-10 lg:block">
              <div>
                <AboutEyebrow>The B.S.I. approach</AboutEyebrow>
                <h2 className={H2}>
                  More than property.
                  <Br />A <Em>personal approach.</Em>
                </h2>
                <p className="mt-5 max-w-[540px] text-[14px] leading-[1.8] text-secondary md:text-[15px]">
                  The difference is not only in what we know. It is in how closely we pay attention—and how seriously we
                  take the responsibility of guiding someone through an important decision.
                </p>
              </div>

              <div className="relative mt-8 h-[280px] overflow-hidden rounded-2xl after:absolute after:inset-0 after:bg-[linear-gradient(180deg,transparent_55%,rgb(16_16_16/0.5))] after:content-[''] sm:h-[340px] md:mt-0 md:h-[380px] lg:mt-9 lg:h-[400px]">
                <img
                  src={unsplash(IMG.approach, 900)}
                  srcSet={srcSet(IMG.approach, [600, 900, 1200])}
                  sizes="(min-width: 1024px) 40vw, (min-width: 768px) 45vw, 92vw"
                  alt="Traditional balconies and architecture in Tangier"
                  width="1200"
                  height="800"
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
                <div className="absolute bottom-4 left-5 z-[2] flex items-center gap-2 text-[12px] text-white [text-shadow:0_1px_8px_rgb(0_0_0/0.5)]">
                  <IoLocationOutline aria-hidden="true" className="size-4" />
                  <span>Knowledge built street by street</span>
                </div>
              </div>
            </div>

            <div className="border-t border-main/[0.12]">
              {APPROACH.map((item, index) => (
                <motion.article
                  key={item.number}
                  {...fadeUp(index)}
                  className="relative grid grid-cols-[40px_1fr] border-b border-main/[0.12] py-6 pr-11 md:grid-cols-[64px_1fr] md:py-7 md:pr-14"
                >
                  <span aria-hidden="true" className="pt-1 text-[12px] font-semibold text-accent-500">
                    {item.number}
                  </span>
                  <div>
                    <h3 className="text-[17px] font-semibold tracking-tight text-main md:text-[19px]">{item.title}</h3>
                    <p className="mt-2 max-w-[520px] text-[14px] leading-[1.7] text-secondary">{item.body}</p>
                  </div>
                  <span
                    aria-hidden="true"
                    className="absolute right-0 top-6 flex size-7 items-center justify-center rounded-full border border-accent-500/20 text-accent-500 md:top-7"
                  >
                    <IoCheckmark className="size-4" />
                  </span>
                </motion.article>
              ))}
            </div>
          </Container>
        </section>

        {/* ------------------------------- Team ------------------------------- */}
        <section className={`bg-primary-500 ${SECTION_Y}`}>
          <Container>
            <div className={HEADING_GRID}>
              <div>
                <AboutEyebrow>The people behind B.S.I.</AboutEyebrow>
                <h2 className={H2}>
                  A small team
                  <Br />
                  <Em>by choice.</Em>
                </h2>
              </div>
              <div>
                <p className={SIDE_COPY}>
                  Every listing on this site and every client we guide is personally handled by one of us—never passed
                  through a distant sales team.
                </p>
                <strong className="mt-3 block text-[15px] font-semibold italic text-accent-500">
                  One family. One standard of care.
                </strong>
              </div>
            </div>

            {loading ? (
              <div role="status" className="flex min-h-[320px] items-center justify-center">
                <Spinner />
                <span className="sr-only">Loading our team</span>
              </div>
            ) : agents.length === 0 ? (
              <p className="py-10 text-center text-[13px] text-secondary">
                Our team profiles are being updated — check back soon.
              </p>
            ) : (
              <div className="mt-8 grid grid-cols-1 gap-4 md:mt-11 md:grid-cols-3 md:gap-5 lg:gap-6">
                {agents.map((agent, index) => (
                  <AboutAgentCard
                    key={agent.id}
                    agent={agent}
                    index={index}
                    listingCount={getListingCountForAgent(agent.id)}
                  />
                ))}
              </div>
            )}
          </Container>
        </section>

        {/* ------------------------------ Closing ------------------------------ */}
        <section className="bg-primary-500 pb-[58px] md:pb-[72px] lg:pb-[88px]">
          <Container>
            <div className="relative grid gap-8 overflow-hidden rounded-2xl bg-linear-to-br from-accent-500 to-accent-600 px-6 py-12 text-white before:pointer-events-none before:absolute before:-bottom-[45%] before:-right-[8%] before:size-[520px] before:rounded-full before:border before:border-gold-400/20 before:shadow-[0_0_0_70px_rgb(217_200_164/0.05),0_0_0_140px_rgb(217_200_164/0.03)] before:content-[''] md:grid-cols-[1fr_0.5fr] md:items-center md:gap-10 md:rounded-3xl md:p-14 lg:p-20">
              <div className="relative">
                <AboutEyebrow light>The next chapter</AboutEyebrow>
                <h2 className="mt-4 text-balance text-[clamp(34px,4.6vw,60px)] font-semibold leading-[0.98] tracking-[-0.05em]">
                  Let’s make Tangier
                  <Br />
                  <Em light>feel like home.</Em>
                </h2>
                <p className="mt-5 max-w-[520px] text-[14px] leading-[1.8] text-white/75">
                  Tell us what brings you to Tangier. You will speak directly with the family behind B.S.I., and we will
                  take it from there.
                </p>
              </div>

              <div className="relative z-[2] grid gap-3">
                <Link
                  to="/properties/rent"
                  className={`inline-flex min-h-[48px] items-center justify-center gap-2.5 rounded-full bg-white px-6 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent-500 shadow-[0_4px_14px_rgba(0,0,0,0.12)] transition duration-200 hover:-translate-y-0.5 motion-reduce:transition-none ${FOCUS_RING_LIGHT}`}
                >
                  <IoHomeOutline aria-hidden="true" className="size-4" />
                  Browse properties
                </Link>
                <Link
                  to="/contact"
                  className={`inline-flex min-h-[48px] items-center justify-center gap-2.5 rounded-full border border-white/40 px-6 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:text-accent-500 motion-reduce:transition-none ${FOCUS_RING_LIGHT}`}
                >
                  Get in touch
                  <IoArrowForward aria-hidden="true" className="size-4" />
                </Link>
              </div>

              <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-2 right-6 select-none text-[72px] font-semibold leading-none tracking-[-0.05em] text-white/[0.06] md:text-[120px]"
              >
                B.S.I.
              </span>
            </div>
          </Container>
        </section>
      </div>
    </MotionConfig>
  );
}

export default AboutPage;
