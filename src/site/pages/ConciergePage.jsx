import { useState } from "react";
import { motion, MotionConfig } from "framer-motion";
import { IoAdd, IoRemove, IoArrowForward, IoShieldCheckmarkOutline, IoLocationOutline } from "react-icons/io5";
import ConciergeSection from "@/site/components/home/ConciergeSection";
import ProcessTimeline from "@/site/components/concierge/ProcessTimeline";
import WhatsAppLink from "@/site/components/concierge/WhatsAppLink";
import ConciergeEyebrow from "@/site/components/concierge/ConciergeEyebrow";
import ConciergeSectionTitle from "@/site/components/concierge/ConciergeSectionTitle";
import AskCard from "@/site/components/concierge/AskCard";
import JsonLd from "@/site/components/JsonLd";
import usePageTitle from "@/shared/seo/usePageTitle";
import usePageMeta from "@/shared/seo/usePageMeta";
import { PAGE_META } from "@/shared/seo/pageMeta";
import { useSiteSettings } from "@/site/context/SiteSettingsProvider";
import { toDialDigits } from "@/site/lib/phoneLinks";
import { BTN_BASE } from "@/site/lib/conciergeStyles";
import { PAGE_PATH, COAST_IMG, heroImg, TRUST, SERVICES, STEPS, AREAS, FAQS } from "@/site/lib/conciergeContent";

const Em = ({ children }) => <em className="font-semibold italic text-accent-500">{children}</em>;

function ConciergePage() {
  usePageTitle(PAGE_META.concierge.title);
  usePageMeta(PAGE_META.concierge.description);
  const settings = useSiteSettings();
  const [openFaq, setOpenFaq] = useState(0);

  const phone = toDialDigits(settings?.phone_number);
  const siteUrl = window.location.origin;
  const brand = settings.agency_name;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: "Property concierge and management in Tangier",
        serviceType: "Property management",
        url: `${siteUrl}${PAGE_PATH}`,
        description:
          "Property concierge, rental management and owner reporting for homeowners and investors in Tangier, Morocco.",
        areaServed: { "@type": "City", name: "Tangier" },
        availableLanguage: ["English", "French", "Arabic"],
        provider: { "@type": "RealEstateAgent", name: brand, url: siteUrl },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
          { "@type": "ListItem", position: 2, name: "Concierge", item: `${siteUrl}${PAGE_PATH}` },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQS.map(([q, a]) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      },
    ],
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="overflow-x-clip">
        <JsonLd data={schema} />

        {/* Hero */}
        <section className="bg-[radial-gradient(circle_at_73%_38%,#fff_0,#f5f1ef_35%,var(--color-primary-500)_67%)] pb-9 pt-28 sm:pt-32 lg:pt-36">
          <div className="wrapper grid items-center gap-12 lg:min-h-[540px] lg:grid-cols-[0.9fr_1.1fr] lg:gap-[70px]">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              <ConciergeEyebrow left>Property care, done properly</ConciergeEyebrow>
              <h1 className="mb-6 mt-[18px] max-w-[680px] text-[43px] font-semibold leading-[0.98] tracking-[-0.05em] text-main sm:text-[clamp(48px,5vw,78px)]">
                Property concierge
                <br />
                in <Em>Tangier</Em>
              </h1>
              <p className="mx-auto max-w-[510px] font-poppins text-[14px] leading-[1.8] text-secondary lg:mx-0">
                Local, attentive property management for homeowners and investors — whether you live in Tangier or a
                world away.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <WhatsAppLink
                  phone={phone}
                  label="hero"
                  message="Hello, I'd like to speak to a property concierge consultant in Tangier."
                  className={`${BTN_BASE} bg-accent-500 text-white`}
                >
                  Speak to a consultant <IoArrowForward aria-hidden="true" className="size-[15px]" />
                </WhatsAppLink>
                <a href="#services" className={`${BTN_BASE} border border-accent-500 text-accent-500`}>
                  What&rsquo;s included
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative mx-auto w-full max-w-[700px] lg:max-w-none"
            >
              <div className="h-[275px] overflow-hidden rounded-[18px] shadow-[0_26px_70px_rgba(60,36,37,0.18)] sm:h-[420px] lg:[transform:perspective(1000px)_rotateY(-4deg)_rotateX(1deg)]">
                <img
                  src={heroImg(1000)}
                  srcSet={`${heroImg(640)} 640w, ${heroImg(1000)} 1000w, ${heroImg(1800)} 1800w`}
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  alt="Whitewashed apartment building among palm trees in Tangier"
                  width="1800"
                  height="1200"
                  decoding="async"
                  fetchPriority="high"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-3 left-3 flex items-center gap-2.5 rounded-[11px] border border-accent-500/10 bg-white/95 px-3.5 py-3 shadow-[0_12px_36px_rgba(47,32,35,0.14)] sm:-left-[34px] sm:bottom-[26px]">
                <span className="flex size-7 items-center justify-center rounded-full bg-[#f5e9ed] text-accent-500">
                  <IoShieldCheckmarkOutline className="size-3.5" />
                </span>
                <div className="leading-tight">
                  <strong className="block text-[12px] text-main">Property protected</strong>
                  <small className="mt-0.5 block font-poppins text-[10px] text-trenary">
                    Local support on the ground
                  </small>
                </div>
              </div>
              <div className="absolute -top-3 right-2 flex items-center gap-2.5 rounded-[11px] border border-accent-500/10 bg-white/95 px-3.5 py-3 shadow-[0_12px_36px_rgba(47,32,35,0.14)] sm:-right-3 sm:top-6">
                <span className="size-[22px] shrink-0 rounded-full border-[7px] border-[#f4e7eb] bg-accent-500" />
                <div className="leading-tight">
                  <strong className="block text-[12px] text-main">Tangier, Morocco</strong>
                  <small className="mt-0.5 block font-poppins text-[10px] text-trenary">
                    English · <span lang="fr">Français</span> · <bdi lang="ar">العربية</bdi>
                  </small>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="wrapper mt-10 sm:mt-8">
            <div className="grid grid-cols-3 border-t border-[#dfdad6] pt-6">
              {TRUST.map(({ Icon, title, text }) => (
                <div
                  key={title}
                  className="flex flex-col items-center justify-center gap-1.5 border-r border-[#e0dcda] px-1 text-center last:border-0 sm:flex-row sm:gap-3 sm:text-left"
                >
                  <span className="flex size-[34px] shrink-0 items-center justify-center rounded-lg border border-[#ead8de] bg-[#f5e9ed] text-accent-500">
                    <Icon className="size-[18px]" />
                  </span>
                  <p className="m-0 leading-tight">
                    <strong className="block text-[10px] text-main sm:text-[12px]">{title}</strong>
                    <small className="mt-0.5 font-poppins text-[10px] text-trenary max-sm:sr-only sm:block">
                      {text}
                    </small>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Services */}
        <section id="services" className="scroll-mt-24 bg-primary-600 py-[58px] md:py-[72px] lg:py-[88px]">
          <div className="wrapper">
            <ConciergeSectionTitle
              label="What we handle"
              title={
                <>
                  Your home, <Em>fully cared for</Em>
                </>
              }
              text="From guest stays to quiet months between visits, we manage the practical details that keep your Tangier property protected and ready."
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {SERVICES.map(({ Icon, title, text }, index) => (
                <motion.article
                  key={title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="flex flex-col rounded-xl border border-[#e5e0dd] bg-white p-6 shadow-[0_5px_14px_rgba(47,35,37,0.05)] transition duration-200 hover:-translate-y-[3px] hover:shadow-[0_12px_26px_rgba(47,35,37,0.1)]"
                >
                  <div className="flex items-start justify-between">
                    <span aria-hidden="true" className="text-[38px] font-semibold leading-none text-[#eee3e7]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="flex size-[34px] items-center justify-center rounded-lg border border-[#ead8de] bg-[#f5e9ed] text-accent-500">
                      <Icon className="size-[18px]" />
                    </span>
                  </div>
                  <h3 className="mb-2.5 mt-6 text-[17px] font-semibold text-main">{title}</h3>
                  <p className="font-poppins text-[13px] leading-[1.75] text-trenary">{text}</p>
                  <WhatsAppLink
                    phone={phone}
                    label={title}
                    message={`Hello, I'd like to enquire about: ${title} (property in Tangier).`}
                    className="mt-auto flex w-fit items-center gap-[7px] pb-2 pt-5 text-[10px] font-bold uppercase tracking-[0.07em] text-accent-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-500"
                  >
                    Enquire about this service <IoArrowForward aria-hidden="true" className="size-[14px]" />
                  </WhatsAppLink>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* Process */}
        <section className="bg-primary-500 py-[58px] md:py-[72px] lg:py-[88px]">
          <div className="wrapper">
            <ConciergeSectionTitle
              label="The process"
              title={
                <>
                  Simple from <Em>day one</Em>
                </>
              }
              text="A straightforward service shaped around your property, your priorities and how involved you want to be."
              className="mb-6"
            />
            <ProcessTimeline steps={STEPS} />
          </div>
        </section>

        {/* Areas */}
        <section className="bg-white py-[58px] md:py-[72px] lg:py-[88px]">
          <div className="wrapper">
            <ConciergeSectionTitle
              label="Local expertise"
              title={
                <>
                  Made for <Em>Tangier</Em>
                </>
              }
              text="A reliable local network across the city’s key residential neighborhoods."
            />
            <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
              <article className="relative min-h-[330px] overflow-hidden rounded-xl md:min-h-[430px]">
                <img
                  src={COAST_IMG}
                  alt="Tangier coastline and white buildings"
                  width="1600"
                  height="1067"
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 z-10 p-[22px] text-white md:p-8">
                  <span className="text-[10px] uppercase tracking-[0.16em] text-gold-400">Property concierge</span>
                  <h3 className="mb-1 mt-2 text-[21px] font-semibold md:text-[27px]">From Malabata to the Medina</h3>
                  <p className="m-0 font-poppins text-[12px] opacity-80">
                    Close to your property. Connected to the city.
                  </p>
                </div>
              </article>

              <article className="flex flex-col justify-center rounded-xl border border-[#e5e0dd] bg-primary-500 p-[26px] md:p-9">
                <span className="flex size-[34px] items-center justify-center rounded-lg border border-[#ead8de] bg-[#f5e9ed] text-accent-500">
                  <IoLocationOutline className="size-[18px]" />
                </span>
                <h3 className="mb-3 mt-5 text-[24px] font-semibold leading-[1.05] text-main">Areas we cover</h3>
                <ul className="divide-y divide-[#e5e0dd]">
                  {AREAS.map(([name, note]) => (
                    <li key={name} className="flex items-baseline justify-between gap-4 py-2.5">
                      <span className="text-[13px] font-semibold text-main">{name}</span>
                      <span className="text-right font-poppins text-[12px] text-trenary">{note}</span>
                    </li>
                  ))}
                </ul>
                <WhatsAppLink
                  phone={phone}
                  label="areas"
                  message="Hello, I'd like to check whether my neighborhood in Tangier is covered by your concierge service."
                  className="mt-4 flex w-fit items-center gap-[7px] py-2 text-[10px] font-bold uppercase tracking-[0.07em] text-accent-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-500"
                >
                  Not listed? Ask us <IoArrowForward aria-hidden="true" className="size-[14px]" />
                </WhatsAppLink>
              </article>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-24 bg-primary-600 py-[58px] md:py-[72px] lg:py-[88px]">
          <div className="wrapper">
            {/* Capped width: on large screens the extra space becomes margin
                instead of stretching the cards into long, hard-to-read strips. */}
            <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[5fr_7fr] lg:gap-16 xl:gap-20">
              <div className="text-center lg:sticky lg:top-28 lg:self-start lg:text-left">
                <ConciergeEyebrow left>Property management FAQ</ConciergeEyebrow>
                <h2 className="my-4 text-balance text-[34px] font-semibold leading-[0.98] tracking-[-0.05em] text-main md:text-[40px] lg:text-[clamp(34px,3.2vw,48px)]">
                  Your questions, <Em>answered</Em>
                </h2>
                <p className="mx-auto max-w-[400px] font-poppins text-[14px] leading-[1.75] text-trenary lg:mx-0">
                  Straight answers for owners considering property management in Tangier, whether it&rsquo;s a family
                  home or a rental.
                </p>
                <AskCard phone={phone} className="mt-8 hidden lg:block" />
              </div>

              <div className="flex flex-col gap-2.5">
                {FAQS.map(([question, answer], index) => {
                  const open = openFaq === index;
                  return (
                    <article
                      key={question}
                      className={`overflow-hidden rounded-[10px] border bg-white transition duration-300 ${
                        open ? "border-accent-500/30 shadow-[0_10px_28px_rgba(109,33,60,0.08)]" : "border-[#e5e0dd]"
                      }`}
                    >
                      <h3 className="m-0">
                        <button
                          type="button"
                          aria-expanded={open}
                          aria-controls={`faq-panel-${index}`}
                          id={`faq-button-${index}`}
                          onClick={() => setOpenFaq(open ? -1 : index)}
                          className="flex w-full items-center justify-between gap-4 px-5 py-[18px] text-left text-[14px] font-semibold leading-snug text-main focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-500"
                        >
                          <span>{question}</span>
                          {open ? (
                            <IoRemove aria-hidden="true" className="size-[18px] shrink-0 text-accent-500" />
                          ) : (
                            <IoAdd aria-hidden="true" className="size-[18px] shrink-0 text-accent-500" />
                          )}
                        </button>
                      </h3>
                      {/* Answers stay in the DOM when collapsed so crawlers and the FAQ schema see the same text */}
                      <div
                        id={`faq-panel-${index}`}
                        className={`grid transition-[grid-template-rows] duration-300 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                      >
                        <div className="overflow-hidden">
                          {/* ~62 characters per line keeps long answers easy to follow */}
                          <p className="m-0 max-w-[62ch] px-5 pb-5 font-poppins text-[14px] leading-[1.8] text-trenary">
                            {answer}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}
                <AskCard phone={phone} className="mt-4 lg:hidden" />
              </div>
            </div>
          </div>
        </section>

        {/* Closing CTA: existing dark callback section */}
        <ConciergeSection />
      </div>
    </MotionConfig>
  );
}

export default ConciergePage;
