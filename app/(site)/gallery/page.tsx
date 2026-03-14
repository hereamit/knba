"use client";

import { useEffect, useMemo, useState } from "react";
import { GalleryShowcase } from "@/components/gallery-showcase";
import { SectionHeading } from "@/components/section-heading";
import { API_BASE_URL } from "@/lib/api";
import {
  fallbackGalleryRecords,
  normalizeGalleryRecord,
  type GalleryRecord,
} from "@/lib/gallery";

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryRecord[]>(fallbackGalleryRecords);

  useEffect(() => {
    let isCancelled = false;

    const loadGallery = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/gallery/`, {
          cache: "no-store",
        });
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as GalleryRecord[];
        if (!isCancelled && data.length) {
          setItems(data.map(normalizeGalleryRecord));
        }
      } catch {
        // Keep fallback records on the public page.
      }
    };

    void loadGallery();

    return () => {
      isCancelled = true;
    };
  }, []);

  const summary = useMemo(
    () => [
      { label: "Featured Images", value: String(items.filter((item) => item.is_featured).length).padStart(2, "0") },
      { label: "Photo Categories", value: String(new Set(items.map((item) => item.category)).size).padStart(2, "0") },
      { label: "Interactive Lightbox", value: "Enabled" },
    ],
    [items],
  );

  return (
    <div className="section-wrap py-8 md:py-12">
      <section className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#273c75,#1e3799)] px-6 py-12 text-white md:px-10">
        <SectionHeading
          eyebrow="Gallery"
          title="Interactive moments from the association's work and events."
          light
        />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {summary.map((item) => (
            <div key={item.label} className="rounded-[1.4rem] bg-white/10 p-5">
              <p className="text-3xl font-bold">{item.value}</p>
              <p className="mt-2 text-sm font-semibold uppercase tracking-[0.24em] text-white/68">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20">
        <GalleryShowcase items={items} />
      </section>
    </div>
  );
}
