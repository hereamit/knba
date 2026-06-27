"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { resolveGalleryImageSrc, type GalleryRecord } from "@/lib/gallery";

type CategoryGroup = { category: string; items: GalleryRecord[] };

function CategoryCard({
  group,
  onOpen,
}: {
  group: CategoryGroup;
  onOpen: (category: string, itemIndex: number) => void;
}) {
  const items = group.items;
  const count = items.length;
  const [currentIndex, setCurrentIndex] = useState(0);

  const showPrevious = () => setCurrentIndex((value) => (value - 1 + count) % count);
  const showNext = () => setCurrentIndex((value) => (value + 1) % count);

  const safeIndex = currentIndex < count ? currentIndex : 0;
  const current = items[safeIndex];

  return (
    <div className="group relative overflow-hidden rounded-[1.4rem] border border-line bg-white shadow-[0_18px_40px_rgba(18,31,69,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(18,31,69,0.15)]">
      <div className="pointer-events-none absolute left-4 top-4 z-30">
        <p className="inline-flex rounded-full border border-white/14 bg-[#091224]/58 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-white/92 backdrop-blur-sm">
          {group.category}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onOpen(group.category, safeIndex)}
        className="relative block aspect-[4/3] w-full overflow-hidden text-left sm:aspect-[3/2]"
        aria-label={`Open ${group.category} gallery`}
      >
        {current ? (
          <Image
            key={current.id ?? safeIndex}
            src={resolveGalleryImageSrc(current.image_src)}
            alt={current.title}
            fill
            unoptimized
            sizes="(min-width:1280px) 380px, (min-width:768px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[#091224]/88 via-[#091224]/18 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between gap-3 p-4 text-white">
          <p className="text-xs font-medium text-white/84">
            {count} photo{count > 1 ? "s" : ""}
          </p>
          {count > 1 ? (
            <div className="flex items-center gap-1">
              {items.slice(0, 6).map((item, dotIndex) => (
                <span
                  key={item.id ?? dotIndex}
                  className={`h-1.5 rounded-full transition-all ${
                    dotIndex === safeIndex ? "w-4 bg-white" : "w-1.5 bg-white/45"
                  }`}
                />
              ))}
              {count > 6 ? (
                <span className="ml-1 text-[10px] text-white/60">+{count - 6}</span>
              ) : null}
            </div>
          ) : null}
        </div>
      </button>

      {count > 1 ? (
        <>
          <button
            type="button"
            onClick={showPrevious}
            aria-label={`Previous image in ${group.category}`}
            className="absolute left-2 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-base text-white backdrop-blur transition hover:bg-black/65 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100"
          >
            <span aria-hidden="true">‹</span>
          </button>
          <button
            type="button"
            onClick={showNext}
            aria-label={`Next image in ${group.category}`}
            className="absolute right-2 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-base text-white backdrop-blur transition hover:bg-black/65 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100"
          >
            <span aria-hidden="true">›</span>
          </button>
        </>
      ) : null}
    </div>
  );
}

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

  const openCategoryAt = (category: string, itemIndex: number) => {
    setActiveCategory(category);
    setActiveIndex(itemIndex);
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

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {selectedCategory === "All"
          ? categoryGroups.map((group) => (
              <CategoryCard
                key={group.category}
                group={group}
                onOpen={openCategoryAt}
              />
            ))
          : selectedCategoryItems.map((item, index) => (
              <button
                type="button"
                key={item.id ?? item.title}
                onClick={() => {
                  setActiveCategory(selectedCategory);
                  setActiveIndex(index);
                }}
                className="group relative overflow-hidden rounded-[1.4rem] border border-line bg-white text-left shadow-[0_18px_40px_rgba(18,31,69,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(18,31,69,0.15)]"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-[3/2]">
                  <Image
                    src={resolveGalleryImageSrc(item.image_src)}
                    alt={item.title}
                    fill
                    unoptimized
                    sizes="(min-width:1280px) 380px, (min-width:640px) 50vw, 100vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#091224]/88 via-[#091224]/18 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <p className="inline-flex rounded-full border border-white/14 bg-black/24 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-white/82 backdrop-blur-sm">
                      {item.category}
                    </p>
                  </div>
                </div>
              </button>
            ))}
      </div>

      {activeItem ? (
        <div
          className={`fixed inset-0 z-[70] flex items-center justify-center bg-[#091224]/95 px-2 backdrop-blur-sm sm:px-6 pt-[calc(env(safe-area-inset-top)+4.5rem)] ${
            activeCategoryItems.length > 1
              ? "pb-[calc(env(safe-area-inset-bottom)+5.5rem)]"
              : "pb-[calc(env(safe-area-inset-bottom)+1rem)]"
          }`}
          style={{ height: "100dvh" }}
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          onClick={closeLightbox}
        >
          {/* Top bar: title + close. Always reachable, never overlapped. */}
          <div
            className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between gap-3 bg-gradient-to-b from-[#091224]/85 to-transparent px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 text-white sm:px-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="min-w-0">
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-white/60">
                {activeCategory} {"\u00b7"} {currentIndex + 1} / {activeCategoryItems.length}
              </p>
              {activeItem.title ? (
                <p className="mt-0.5 truncate text-sm font-semibold text-white sm:text-base">
                  {activeItem.title}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={closeLightbox}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/35 text-xl leading-none text-white backdrop-blur transition hover:bg-black/55"
              aria-label="Close photo viewer"
            >
              <span aria-hidden="true">{"\u00d7"}</span>
            </button>
          </div>

          {/* Image \u2014 direct flex child of the dialog, centered both axes. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={activeItem.id ?? activeItem.title}
            src={resolveGalleryImageSrc(activeItem.image_src)}
            alt={activeItem.title}
            className="relative z-10 block max-h-full max-w-full object-contain"
            draggable={false}
            onClick={(event) => event.stopPropagation()}
          />

          {activeCategoryItems.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  showPrevious();
                }}
                className="absolute left-2 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-2xl text-white backdrop-blur transition hover:bg-black/65 sm:left-4 sm:h-12 sm:w-12"
                aria-label="Previous photo"
              >
                <span aria-hidden="true">{"\u2039"}</span>
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  showNext();
                }}
                className="absolute right-2 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-2xl text-white backdrop-blur transition hover:bg-black/65 sm:right-4 sm:h-12 sm:w-12"
                aria-label="Next photo"
              >
                <span aria-hidden="true">{"\u203a"}</span>
              </button>
            </>
          ) : null}

          {/* Thumbnails — visible on every breakpoint, scrollable horizontally. */}
          {activeCategoryItems.length > 1 ? (
            <div
              className="absolute left-0 right-0 bottom-0 z-30 bg-gradient-to-t from-[#091224]/85 to-transparent px-3 pt-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] sm:px-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex gap-2 overflow-x-auto pb-1">
                {activeCategoryItems.map((item, index) => (
                  <button
                    key={item.id ?? item.title}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`relative h-12 w-16 shrink-0 overflow-hidden rounded-md border transition sm:h-16 sm:w-24 ${
                      index === currentIndex
                        ? "border-white shadow-[0_0_0_2px_rgba(255,255,255,0.24)]"
                        : "border-white/10 opacity-60 hover:opacity-100"
                    }`}
                    aria-label={`Show ${item.title}`}
                    aria-current={index === currentIndex ? "true" : undefined}
                  >
                    <Image
                      src={resolveGalleryImageSrc(item.image_src)}
                      alt={item.title}
                      fill
                      unoptimized
                      sizes="96px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
