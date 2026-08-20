import { useEffect, useRef, useState, type ReactNode } from "react";
import { SLIDER_INTERVAL_MS } from "../constants";

export interface Slide {
  image: string;
  eyebrow: string;
  heading: ReactNode;
  lead: string;
}

const TICK = 50;

export default function HeroSlider({ slides }: { slides: Slide[] }) {
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);
  const pausedRef = useRef(false);
  const elapsedRef = useRef(0);
  const sliderRef = useRef<HTMLElement>(null);
  const touchStartX = useRef<number | null>(null);

  const goTo = (i: number) => {
    setCurrent((i + slides.length) % slides.length);
    elapsedRef.current = 0;
    setProgress(0);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      if (pausedRef.current) return;
      elapsedRef.current += TICK;
      setProgress((elapsedRef.current / SLIDER_INTERVAL_MS) * 100);
      if (elapsedRef.current >= SLIDER_INTERVAL_MS) {
        setCurrent((c) => (c + 1) % slides.length);
        elapsedRef.current = 0;
        setProgress(0);
      }
    }, TICK);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length]);

  useEffect(() => {
    const onVisibility = () => {
      pausedRef.current = document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const resetTimer = (i: number) => goTo(i);

  return (
    <section
      className="slider"
      aria-roledescription="carousel"
      aria-label="Featured highlights"
      ref={sliderRef}
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(dx) > 40) {
          resetTimer(dx < 0 ? current + 1 : current - 1);
        }
        touchStartX.current = null;
      }}
    >
      <div className="slides">
        {slides.map((slide, i) => (
          <div
            key={i}
            className={`slide${i === current ? " is-active" : ""}`}
            style={{ backgroundImage: `url('${slide.image}')` }}
          >
            <div className="container slide-content">
              <span className="eyebrow">{slide.eyebrow}</span>
              <h1 className="display">{slide.heading}</h1>
              <p className="lead">{slide.lead}</p>
            </div>
          </div>
        ))}
      </div>
      <button className="slider-arrow prev" aria-label="Previous slide" onClick={() => resetTimer(current - 1)}>
        &#8249;
      </button>
      <button className="slider-arrow next" aria-label="Next slide" onClick={() => resetTimer(current + 1)}>
        &#8250;
      </button>
      <div className="slider-dots" role="tablist" aria-label="Slide navigation">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`slider-dot${i === current ? " is-active" : ""}`}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => resetTimer(i)}
          />
        ))}
      </div>
      <div className="slider-progress">
        <span className="bar" style={{ width: `${progress}%` }} />
      </div>
    </section>
  );
}
