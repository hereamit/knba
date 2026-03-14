"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { resolveGalleryImageSrc, type GalleryRecord } from "@/lib/gallery";

export function GalleryShowcase({ items }: { items: GalleryRecord[] }) {
  const categories = useMemo(
    () => ["All", ...new Set(items.map((item) => item.category))],
    [items],
  );
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const categoryGroups = useMemo(() => {
    return categories
      .filter((category) => category !== "All")
      .map((category) => ({
        category,
        items: items
          .filter((item) => item.category === category)
          .sort((left, right) => left.display_order - right.display_order),
      }))
      .filter((group) => group.items.length > 0);
  }, [categories, items]);

  const selectedCategoryItems = useMemo(
    () =>
      selectedCategory === "All"
        ? []
        : items
            .filter((item) => item.category === selectedCategory)
            .sort((left, right) => left.display_order - right.display_order),
    [items, selectedCategory],
  );

  const activeCategoryItems = useMemo(
    () =>
      activeCategory
        ? categoryGroups.find((group) => group.category === activeCategory)?.items ?? []
        : [],
    [activeCategory, categoryGroups],
  );

  const closeLightbox = () => {
    setActiveCategory(null);
    setActiveIndex(null);
  };

  const showPrevious = () => {
    setActiveIndex((value) =>
      value === null
        ? 0
        : (value - 1 + activeCategoryItems.length) % activeCategoryItems.length,
    );
  };

  const showNext = () => {
    setActiveIndex((value) =>
      value === null ? 0 : (value + 1) % activeCategoryItems.length,
    );
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeLightbox();
      }
      if (event.key === "ArrowLeft" && activeIndex !== null) {
        setActiveIndex((value) =>
          value === null
            ? 0
            : (value - 1 + activeCategoryItems.length) % activeCategoryItems.length,
        );
      }
      if (event.key === "ArrowRight" && activeIndex !== null) {
        setActiveIndex((value) =>
          value === null ? 0 : (value + 1) % activeCategoryItems.length,
        );
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeCategoryItems.length, activeIndex]);

  useEffect(() => {
    if (activeIndex === null) {
      document.body.style.overflow = "";
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeIndex]);

  const activeItem = activeIndex !== null ? activeCategoryItems[activeIndex] : null;
  const currentIndex = activeIndex ?? 0;

  return (
    <>
      <div className="flex flex-wrap gap-3">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => {
              setSelectedCategory(category);
              setActiveIndex(null);
            }}
            className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
              selectedCategory === category
                ? "bg-primary text-white"
                : "border border-line bg-white text-primary"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {selectedCategory === "All"
          ? categoryGroups.map((group, index) => {
          const previewItems = group.items.slice(0, 3);

          return (
          <button
            type="button"
            key={group.category}
            onClick={() => {
              setActiveCategory(group.category);
              setActiveIndex(0);
            }}
            className={`group panel overflow-hidden rounded-[1.6rem] text-left transition duration-300 hover:z-10 hover:-translate-y-1 ${
              index % 3 === 0
                ? "-rotate-[1.3deg]"
                : index % 3 === 1
                  ? "rotate-[1deg]"
                  : "-rotate-[0.6deg]"
            }`}
          >
            <div className="absolute left-5 top-5 z-40">
              <p className="inline-flex rounded-full border border-white/14 bg-[#091224]/58 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-white/92 backdrop-blur-sm">
                {group.category}
              </p>
            </div>
            <div className="relative h-80 overflow-hidden">
              {previewItems
                .slice()
                .reverse()
                .map((item, stackIndex) => (
                  <div
                    key={item.id ?? `${group.category}-${stackIndex}`}
                    className={`absolute inset-0 transition duration-300 ${
                      stackIndex === previewItems.length - 1
                        ? "z-30 group-hover:scale-105"
                        : stackIndex === previewItems.length - 2
                          ? "z-20 translate-x-2 translate-y-2 rotate-[2deg] opacity-90"
                          : "z-10 translate-x-4 translate-y-4 rotate-[-2deg] opacity-75"
                    }`}
                  >
                    <Image
                      src={resolveGalleryImageSrc(item.image_src)}
                      alt={item.title}
                      fill
                      unoptimized
                      className="rounded-[1.2rem] object-cover"
                    />
                  </div>
                ))}
              <div className="absolute inset-0 bg-gradient-to-t from-[#091224]/88 via-[#091224]/18 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <p className="mt-3 text-sm font-medium text-white/84">
                  {group.items.length} photo{group.items.length > 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </button>
          );
        })
          : selectedCategoryItems.map((item, index) => (
              <button
                type="button"
                key={item.id ?? item.title}
                onClick={() => {
                  setActiveCategory(selectedCategory);
                  setActiveIndex(index);
                }}
                className={`group panel overflow-hidden rounded-[1.6rem] text-left transition duration-300 hover:z-10 hover:-translate-y-1 ${
                  index % 3 === 0
                    ? "-rotate-[1.3deg]"
                    : index % 3 === 1
                      ? "rotate-[1deg]"
                      : "-rotate-[0.6deg]"
                }`}
              >
                <div className="relative h-80 overflow-hidden">
                  <Image
                    src={resolveGalleryImageSrc(item.image_src)}
                    alt={item.title}
                    fill
                    unoptimized
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#091224]/88 via-[#091224]/18 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                    <p className="inline-flex rounded-full border border-white/14 bg-black/24 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-white/82 backdrop-blur-sm">
                      {item.category}
                    </p>
                  </div>
                </div>
              </button>
            ))}
      </div>

      {activeItem ? (
        <div className="fixed inset-0 z-[70] bg-[#091224]/92 p-4 backdrop-blur-sm">
          <div className="mx-auto flex min-h-full max-w-7xl items-center justify-center">
            <div className="relative w-full rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,#1b2b55,#091224_60%)] p-3 shadow-[0_28px_80px_rgba(9,18,36,0.58)] md:p-4">
              <button
                type="button"
                onClick={closeLightbox}
                className="absolute inset-0 -z-10"
                aria-label="Close lightbox overlay"
              />

              <button
                type="button"
                onClick={closeLightbox}
                className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/30 text-xl font-semibold text-white backdrop-blur transition hover:bg-black/45 md:right-6 md:top-6"
                aria-label="Close lightbox"
              >
                x
              </button>

              <div className="grid gap-4">
                <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))]">
                  <div className="relative min-h-[66vh]">
                    <Image
                      src={resolveGalleryImageSrc(activeItem.image_src)}
                      alt={activeItem.title}
                      fill
                      unoptimized
                      className="object-contain"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={showPrevious}
                    className="absolute left-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/12 bg-black/28 text-2xl text-white backdrop-blur transition hover:bg-black/40 md:left-5"
                    aria-label="Previous photo"
                  >
                    {"\u2190"}
                  </button>

                  <button
                    type="button"
                    onClick={showNext}
                    className="absolute right-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/12 bg-black/28 text-2xl text-white backdrop-blur transition hover:bg-black/40 md:right-5"
                    aria-label="Next photo"
                  >
                    {"\u2192"}
                  </button>
                </div>

                <div className="rounded-[1.4rem] border border-white/8 bg-white/6 p-3 backdrop-blur">
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {activeCategoryItems.map((item, index) => (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => setActiveIndex(index)}
                        className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-[1rem] border transition ${
                          index === currentIndex
                            ? "border-white shadow-[0_0_0_2px_rgba(255,255,255,0.24)]"
                            : "border-white/10 opacity-70 hover:opacity-100"
                        }`}
                        aria-label={`Show ${item.title}`}
                      >
                        <Image
                          src={resolveGalleryImageSrc(item.image_src)}
                          alt={item.title}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
