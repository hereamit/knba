"use client";

import Image from "next/image";
import { useEffect, useEffectEvent, useState } from "react";
import type { HeroSlide } from "@/lib/site-data";

export function HomeHeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [current, setCurrent] = useState(0);
  const hasMultiple = slides.length > 1;

  const goPrev = () =>
    setCurrent((value) => (value - 1 + slides.length) % slides.length);
  const goNext = () => setCurrent((value) => (value + 1) % slides.length);

  const showNext = useEffectEvent(() => {
    setCurrent((value) => (value + 1) % slides.length);
  });

  useEffect(() => {
    if (!hasMultiple) {
      return;
    }

    const timer = window.setInterval(() => {
      showNext();
    }, 4000);

    return () => window.clearInterval(timer);
  }, [hasMultiple]);

  return (
    <div className="panel overflow-hidden rounded-[2rem]">
      <div className="relative h-[420px] md:h-[460px]">
        {slides.map((slide, index) => (
          <div
            key={slide.title}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === current ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              unoptimized
              className="object-cover"
              priority={index === 0}
            />
          </div>
        ))}

        {hasMultiple ? (
          <>
            <button
              type="button"
              onClick={goPrev}
              onMouseEnter={goPrev}
              className="absolute left-4 top-1/2 z-10 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-white/80 text-xl font-semibold text-primary shadow-lg backdrop-blur transition hover:bg-white"
              aria-label="Previous slide"
            >
              {"\u2190"}
            </button>
            <button
              type="button"
              onClick={goNext}
              onMouseEnter={goNext}
              className="absolute right-4 top-1/2 z-10 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-white/80 text-xl font-semibold text-primary shadow-lg backdrop-blur transition hover:bg-white"
              aria-label="Next slide"
            >
              {"\u2192"}
            </button>

            <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/25 px-3 py-2 backdrop-blur">
              {slides.map((slide, dotIndex) => (
                <button
                  key={slide.title}
                  type="button"
                  onClick={() => setCurrent(dotIndex)}
                  className={`h-2.5 w-2.5 rounded-full transition ${
                    dotIndex === current ? "bg-white" : "bg-white/50 hover:bg-white/80"
                  }`}
                  aria-label={`Go to slide ${dotIndex + 1}`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
