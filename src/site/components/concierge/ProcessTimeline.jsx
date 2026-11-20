import { useEffect, useRef, useState } from "react";

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

/**
 * Scroll-driven vertical timeline. Kept in its own component so the
 * per-frame scroll state only re-renders this block, not the whole page.
 * Expects steps shaped like { number, title, text }.
 */
export default function ProcessTimeline({ steps }) {
  const [timelineProgress, setTimelineProgress] = useState(0);
  const processRef = useRef(null);

  useEffect(() => {
    const el = processRef.current;
    if (!el) return;

    let frame = 0;

    const update = () => {
      const rect = el.getBoundingClientRect();

      // Progress starts once the timeline reaches ~62% down the viewport.
      const viewportTrigger = window.innerHeight * 0.62;
      const start = rect.top - viewportTrigger;
      const end = rect.bottom - viewportTrigger;

      setTimelineProgress(clamp(-start / (end - start)));
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    // Scroll/resize listeners are only attached while the timeline is near
    // the viewport, so the rest of the page scrolls with zero extra work.
    const attach = () => {
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
    };
    const detach = () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };

    // First reading on the next frame (not synchronously inside the effect).
    onScroll();

    let io;
    if (typeof IntersectionObserver === "undefined") {
      attach();
    } else {
      io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) attach();
          else detach();
          update(); // snap to the final 0 / 1 state after fast scrolls
        },
        { rootMargin: "120px 0px" },
      );
      io.observe(el);
    }

    // Late-loading fonts/images change the height without a scroll event.
    let ro;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(onScroll);
      ro.observe(el);
    }

    return () => {
      cancelAnimationFrame(frame);
      detach();
      io?.disconnect();
      ro?.disconnect();
    };
  }, []);

  return (
    // role="list" keeps list semantics in Safari/VoiceOver even though
    // Tailwind's preflight removes the list markers.
    <ol role="list" className="process-timeline" ref={processRef} style={{ "--timeline-progress": timelineProgress }}>
      <li aria-hidden="true" className="timeline-track">
        <span className="timeline-fill" />
      </li>

      {steps.map((step, index) => {
        const stepPoint = index / (steps.length - 1);

        // First card is already partly visible on entry; the others start
        // animating just before the progress line reaches their dot.
        const cardProgress =
          index === 0 ? clamp(0.6 + timelineProgress / 0.04) : clamp((timelineProgress - (stepPoint - 0.05)) / 0.05);

        const isActive = timelineProgress >= stepPoint;

        return (
          <li
            key={step.number}
            role="listitem"
            className={[
              "timeline-step",
              index % 2 === 0 ? "step-left" : "step-right",
              isActive ? "is-active" : "",
            ].join(" ")}
            style={{ "--step-progress": cardProgress }}
          >
            <span aria-hidden="true" className="timeline-dot" />

            <article>
              <span aria-hidden="true" className="timeline-number">
                {step.number}
              </span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          </li>
        );
      })}
    </ol>
  );
}
