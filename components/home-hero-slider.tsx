"use client";

import Image from "next/image";
import { useEffect, useEffectEvent, useState } from "react";
import type { HeroSlide } from "@/lib/site-data";

export function HomeHeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [current, setCurrent] = useState(0);

  const showNext = useEffectEvent(() => {
    setCurrent((value) => (value + 1) % slides.length);
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      showNext();
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="panel overflow-hidden rounded-[2rem]">
      <div className="relative h-[420px] md:h-[460px] bg-slate-100">
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
              sizes="100vw"
              className="object-contain"
              priority={index === 0}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-3 border-t border-line bg-white px-4 py-4">
        <button
          type="button"
          onClick={() =>
            setCurrent((value) => (value - 1 + slides.length) % slides.length)
          }
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-lg font-semibold text-primary transition hover:bg-surface-muted"
          aria-label="Previous slide"
        >
          {"\u2190"}
        </button>
        <div className="flex items-center gap-2">
          {slides.map((slide, dotIndex) => (
            <button
              key={slide.title}
              type="button"
              onClick={() => setCurrent(dotIndex)}
              className={`h-3 w-3 rounded-full transition ${
                dotIndex === current ? "bg-primary" : "bg-slate-300"
              }`}
              aria-label={`Go to slide ${dotIndex + 1}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setCurrent((value) => (value + 1) % slides.length)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-lg font-semibold text-primary transition hover:bg-surface-muted"
          aria-label="Next slide"
        >
          {"\u2192"}
        </button>
      </div>
    </div>
  );
}
