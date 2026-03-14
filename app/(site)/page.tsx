"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { HomeHeroSlider } from "@/components/home-hero-slider";
import { SectionHeading } from "@/components/section-heading";
import { API_BASE_URL } from "@/lib/api";
import {
  fallbackBusinessShowcaseCards,
  mapBusinessShowcaseRecordToCard,
  type BusinessShowcaseRecord,
} from "@/lib/business-showcase";
import {
  fallbackGalleryRecords,
  getFallbackSliderSlides,
  mapGalleryRecordsToSlider,
  normalizeGalleryRecord,
  resolveGalleryImageSrc,
  type GalleryRecord,
} from "@/lib/gallery";
import { homeStats, serviceHighlights } from "@/lib/site-data";

export default function HomePage() {
  const [galleryRecords, setGalleryRecords] = useState<GalleryRecord[]>(fallbackGalleryRecords);
  const [businessRecords, setBusinessRecords] = useState<BusinessShowcaseRecord[]>([]);

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
          setGalleryRecords(data.map(normalizeGalleryRecord));
        }
      } catch {
        // Keep local fallback content for the public homepage.
      }
    };

    void loadGallery();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const loadBusinesses = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/business-showcase/`, {
          cache: "no-store",
        });
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as BusinessShowcaseRecord[];
        if (!isCancelled && data.length) {
          setBusinessRecords(data);
        }
      } catch {
        // Keep fallback cards.
      }
    };

    void loadBusinesses();

    return () => {
      isCancelled = true;
    };
  }, []);

  const sliderSlides = mapGalleryRecordsToSlider(galleryRecords);
  const galleryPreviewItems = galleryRecords.filter((item) => item.is_featured);
  const previewGrid = (galleryPreviewItems.length ? galleryPreviewItems : galleryRecords).slice(0, 4);
  const highlightImage = galleryPreviewItems[0] ?? galleryRecords[0] ?? fallbackGalleryRecords[0];
  const businessCards = businessRecords.length
    ? businessRecords.map(mapBusinessShowcaseRecordToCard)
    : fallbackBusinessShowcaseCards;

  return (
    <div className="pb-20">
      <section className="section-wrap pt-6 md:pt-10">
        <HomeHeroSlider
          slides={sliderSlides.length ? sliderSlides : getFallbackSliderSlides()}
        />
      </section>

      <section className="section-wrap relative z-10 mt-4 md:-mt-2">
        <div className="grid gap-4 md:grid-cols-4">
          {homeStats.map((stat) => (
            <article key={stat.label} className="panel rounded-[1.5rem] p-6">
              <p className="text-3xl font-bold text-primary">{stat.value}</p>
              <p className="mt-2 text-sm font-semibold uppercase tracking-[0.24em] text-accent">
                {stat.label}
              </p>
              <p className="mt-3 text-sm leading-7 text-muted">{stat.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-wrap grid gap-10 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <SectionHeading
            eyebrow="About KNBA"
            title="A unified business voice for Khichapokhari and New Road."
            description="KNBA brings together traders, entrepreneurs, service operators, and community leaders to strengthen business resilience in Kathmandu's busiest commercial corridor."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              "Advocacy with local authorities and market stakeholders",
              "Training, networking, and problem-solving for member businesses",
              "Community-focused initiatives that keep New Road vibrant and safe",
              "Partnerships that modernize retail and trade practices",
            ].map((point) => (
              <div
                key={point}
                className="rounded-[1.25rem] border border-line bg-white px-5 py-4 text-sm font-medium leading-7 text-muted"
              >
                {point}
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="btn-primary" href="/about">
              Read Our Story
            </Link>
            <Link className="btn-secondary" href="/contact">
              Visit the Secretariat
            </Link>
          </div>
        </div>
        <div className="panel relative overflow-hidden rounded-[2rem] p-4">
          <div className="relative h-[360px] overflow-hidden rounded-[1.5rem] md:h-[420px]">
            <Image
              src={resolveGalleryImageSrc(highlightImage.image_src)}
              alt={highlightImage.title}
              fill
              unoptimized
              className="object-cover object-center"
            />
          </div>
        </div>
      </section>

      <section className="bg-[#eef3ff] py-20">
        <div className="section-wrap">
          <SectionHeading
            eyebrow="Core Services"
            title="Practical support that makes day-to-day business easier."
            description="The association focuses on the services local businesses need most: representation, visibility, coordination, learning, and trusted market information."
          />
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {serviceHighlights.map((service, index) => {
              const featured = index === 1;

              return (
                <article
                  key={service.title}
                  className={`rounded-[1.6rem] p-7 transition-transform duration-200 hover:-translate-y-1 ${
                    featured
                      ? "border border-[#1e3799]/20 bg-[linear-gradient(135deg,#273c75,#1e3799)] text-white shadow-[0_24px_48px_rgba(30,55,153,0.24)] lg:-translate-y-3"
                      : "panel"
                  }`}
                >
                  <p
                    className={`text-sm font-semibold uppercase tracking-[0.24em] ${
                      featured ? "text-white/70" : "text-primary-soft"
                    }`}
                  >
                    {service.tag}
                  </p>
                  <h3
                    className={`mt-4 text-2xl font-bold ${
                      featured ? "text-white" : "text-primary"
                    }`}
                  >
                    {service.title}
                  </h3>
                  <p
                    className={`mt-4 text-sm leading-7 ${
                      featured ? "text-white/82" : "text-muted"
                    }`}
                  >
                    {service.description}
                  </p>
                  <ul
                    className={`mt-6 space-y-3 text-sm ${
                      featured ? "text-white/82" : "text-muted"
                    }`}
                  >
                    {service.points.slice(0, 3).map((point) => (
                      <li key={point} className="flex gap-3">
                        <span
                          className={`mt-2 h-2.5 w-2.5 rounded-full ${
                            featured ? "bg-white" : "bg-accent"
                          }`}
                        />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
          <div className="mt-8">
            <Link className="btn-primary" href="/services">
              Explore All Services
            </Link>
          </div>
        </div>
      </section>

      <section className="section-wrap py-20">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="Business Showcase"
            title="Promoted businesses that help support KNBA operations."
            description="This sponsored directory gives member businesses a stronger public presence while creating a practical fundraising stream for the association."
          />
          <Link className="btn-primary" href="/business-showcase">
            View All Businesses
          </Link>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {businessCards.slice(0, 3).map((business) => (
            <a
              key={business.name}
              href={business.websiteUrl ?? "/business-showcase"}
              target={business.websiteUrl ? "_blank" : undefined}
              rel={business.websiteUrl ? "noreferrer" : undefined}
              className="panel overflow-hidden rounded-[1.7rem] bg-[linear-gradient(180deg,#ffffff,#f7f9ff)] transition hover:-translate-y-1"
            >
              <div className="relative h-56 overflow-hidden">
                {business.image ? (
                  <Image
                    src={business.image}
                    alt={business.name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,#dbe7ff,#b9cfff)]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#101a35]/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                  <p className="inline-flex rounded-full border border-white/14 bg-black/24 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
                    {business.badge}
                  </p>
                  <h3 className="mt-3 text-xl font-semibold">{business.name}</h3>
                </div>
              </div>
              <div className="p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-soft">
                  {business.category}
                </p>
                <p className="mt-4 text-sm leading-7 text-muted">
                  {business.description}
                </p>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="section-wrap py-20">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="Gallery"
            title="Moments from events, market coordination, and member programs."
            description="A snapshot of KNBA activities across meetings, celebrations, training sessions, and collaboration on New Road."
          />
          <Link className="btn-primary" href="/gallery">
            View Full Gallery
          </Link>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {previewGrid.map((item) => (
            <article
              key={item.id ?? item.title}
              className="group panel overflow-hidden rounded-[1.6rem]"
            >
              <div className="relative h-72 overflow-hidden">
                <Image
                  src={resolveGalleryImageSrc(item.image_src)}
                  alt={item.title}
                  fill
                  unoptimized
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#16213f]/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/75">
                    {item.category}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold">{item.title}</h3>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
