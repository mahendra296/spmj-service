import { useEffect } from "react";

/**
 * Adds the `in-view` class to every element matching `selector` once it
 * scrolls into view (ported from the original IntersectionObserver in
 * public/script.js). Call once per page that renders reveal-animated cards.
 */
export function useScrollReveal(
  selector = ".service-card, .value-card, .stat-card, .testimonial, .story-card, .price-card, .process li",
  deps: unknown[] = []
) {
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll(selector).forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
