"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { HomeHeroSlider } from "@/components/home-hero-slider";
import { SectionHeading } from "@/components/section-heading";
import { API_BASE_URL } from "@/lib/api";
import {
  defaultAboutPageRecord,
  normalizeAboutPageRecord,
  type AboutPageRecord,
} from "@/lib/about-page";
import {
  normalizeBusinessShowcaseRecord,
  mapBusinessShowcaseRecordToCard,
  type BusinessShowcaseRecord,
} from "@/lib/business-showcase";
import {
  normalizeGalleryRecord,
  resolveGalleryImageSrc,
  type GalleryRecord,
} from "@/lib/gallery";
import {
  mapHomeHeroImagesToSlider,
  normalizeHomeHeroImageRecord,
  type HomeHeroImageRecord,
} from "@/lib/home-hero";
import {
  fallbackServiceRecords,
  normalizeServiceRecord,
  sortServices,
  type ServiceRecord,
} from "@/lib/services";

function summarizeText(value: string, maxLength = 120) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

export default function HomePage() {
  const [about, setAbout] = useState<AboutPageRecord>(defaultAboutPageRecord);
  const [heroImages, setHeroImages] = useState<HomeHeroImageRecord[]>([]);
  const [galleryRecords, setGalleryRecords] = useState<GalleryRecord[]>([]);
  const [businessRecords, setBusinessRecords] = useState<BusinessShowcaseRecord[]>([]);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);

  useEffect(() => {
    let isCancelled = false;

    const loadHomepageContent = async () => {
      try {
        const [
          aboutResponse,
          heroResponse,
          galleryResponse,
          servicesResponse,
          businessResponse,
        ] = await Promise.all([
          fetch(`${API_BASE_URL}/about-page/`, { cache: "no-store" }),
          fetch(`${API_BASE_URL}/home-hero-images/`, { cache: "no-store" }),
          fetch(`${API_BASE_URL}/gallery/`, { cache: "no-store" }),
          fetch(`${API_BASE_URL}/services/`, { cache: "no-store" }),
          fetch(`${API_BASE_URL}/business-showcase/`, { cache: "no-store" }),
        ]);

        if (isCancelled) {
          return;
        }

        if (aboutResponse.ok) {
          setAbout(normalizeAboutPageRecord(await aboutResponse.json()));
        }

        if (heroResponse.ok) {
          const heroData = (await heroResponse.json()) as HomeHeroImageRecord[];
          setHeroImages(
            heroData
              .map(normalizeHomeHeroImageRecord)
              .filter((item) => item.is_active && item.image_src),
          );
        }

        if (galleryResponse.ok) {
          const galleryData = (await galleryResponse.json()) as GalleryRecord[];
          setGalleryRecords(
            galleryData
              .map(normalizeGalleryRecord)
              .filter((item) => item.is_active),
          );
        }

        if (servicesResponse.ok) {
          const servicesData = (await servicesResponse.json()) as ServiceRecord[];
          setServiceRecords(
            sortServices(
              servicesData
                .map(normalizeServiceRecord)
                .filter((item) => item.is_active),
            ),
          );
        }

        if (businessResponse.ok) {
          const businessData = (await businessResponse.json()) as BusinessShowcaseRecord[];
          setBusinessRecords(
            businessData
              .map(normalizeBusinessShowcaseRecord)
              .filter((item) => item.is_active)
              .sort((left, right) => {
                if (left.is_featured !== right.is_featured) {
                  return left.is_featured ? -1 : 1;
                }
                return left.display_order - right.display_order;
              }),
          );
        }
      } catch {
        // Keep graceful empty states or local slider fallback if the backend is unavailable.
      }
    };

    void loadHomepageContent();

    return () => {
      isCancelled = true;
    };
  }, []);

  const statCards = useMemo(
    () => [
      {
        label: "Connected Businesses",
        value: `${about.stats.connected_businesses}+`,
        detail:
          "Active committee members plus general member business records connected to KNBA.",
      },
      {
        label: "Current Term Committee",
        value: `${about.stats.committee_members}`,
        detail: about.current_term_label
          ? `Live committee roster for ${about.current_term_label}.`
          : "Live committee roster tied to the current working term.",
      },
      {
        label: "General Members",
        value: `${about.stats.general_members}`,
        detail:
          "Internal business member records that support association communication and operations.",
      },
      {
        label: "Leadership Positions",
        value: `${about.stats.leadership_members}`,
        detail: `${about.stats.executive_members} executive and ${about.stats.advisory_members} advisory records are active.`,
      },
    ],
    [about],
  );

  const aboutHighlights = useMemo(
    () => [
      {
        title: "History",
        detail: summarizeText(about.settings.history_text, 132),
      },
      {
        title: "Founder",
        detail: summarizeText(about.settings.founder_message, 128),
      },
      {
        title: "President",
        detail: summarizeText(about.settings.president_message, 128),
      },
      {
        title: "Mission",
        detail: summarizeText(about.settings.mission_text, 128),
      },
    ].filter((item) => item.detail),
    [about],
  );

  const heroImageSlides = mapHomeHeroImagesToSlider(heroImages);
  const galleryPreviewItems = galleryRecords.filter((item) => item.is_featured);
  const previewGrid = (galleryPreviewItems.length ? galleryPreviewItems : galleryRecords).slice(0, 4);
  const highlightImage = galleryPreviewItems[0] ?? galleryRecords[0] ?? null;
  const businessCards = businessRecords.map(mapBusinessShowcaseRecordToCard);
  const homepageServices = (serviceRecords.length ? serviceRecords : fallbackServiceRecords).slice(0, 3);

  return (
    <div className="pb-20">
      {heroImageSlides.length ? (
        <section className="section-wrap pt-6 md:pt-10">
          <HomeHeroSlider slides={heroImageSlides} />
        </section>
      ) : null}

      <section className="section-wrap mt-6 md:mt-8">
        <div className="grid gap-4 md:grid-cols-4">
          {statCards.map((stat) => (
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
            eyebrow={about.settings.home_about_eyebrow}
            title={about.settings.home_about_title}
            description={about.settings.history_text}
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {aboutHighlights.map((item) => (
              <div
                key={item.title}
                className="rounded-[1.25rem] border border-line bg-white px-5 py-4 text-sm font-medium leading-7 text-muted"
              >
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-primary-soft">
                  {item.title}
                </p>
                <p className="mt-2">{item.detail}</p>
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
            {highlightImage ? (
              <Image
                src={resolveGalleryImageSrc(highlightImage.image_src)}
                alt={highlightImage.title}
                fill
                unoptimized
                className="object-cover object-center"
              />
            ) : (
              <div className="absolute inset-0 bg-[linear-gradient(135deg,#dbe7ff,#b9cfff)]" />
            )}
          </div>
        </div>
      </section>

      <section className="bg-[#eef3ff] py-20">
        <div className="section-wrap">
          <SectionHeading
            eyebrow={about.settings.home_services_eyebrow}
            title={about.settings.home_services_title}
            description={about.settings.home_services_description}
          />
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {homepageServices.map((service, index) => {
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
            eyebrow={about.settings.home_business_eyebrow}
            title={about.settings.home_business_title}
            description={about.settings.home_business_description}
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
        {!businessCards.length ? (
          <div className="mt-8 rounded-[1.4rem] border border-dashed border-line bg-white px-5 py-6 text-sm text-muted">
            No active business showcase records are available yet.
          </div>
        ) : null}
      </section>

      <section className="section-wrap py-20">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow={about.settings.home_gallery_eyebrow}
            title={about.settings.home_gallery_title}
            description={about.settings.home_gallery_description}
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
        {!previewGrid.length ? (
          <div className="mt-8 rounded-[1.4rem] border border-dashed border-line bg-white px-5 py-6 text-sm text-muted">
            No gallery images are available yet.
          </div>
        ) : null}
      </section>
    </div>
  );
}
