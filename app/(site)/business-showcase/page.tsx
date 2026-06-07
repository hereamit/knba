"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { BusinessShowcaseAdvertiseModal } from "@/components/business-showcase-advertise-modal";
import { SectionHeading } from "@/components/section-heading";
import { API_BASE_URL } from "@/lib/api";
import {
  mapBusinessShowcaseRecordToCard,
  normalizeBusinessShowcaseRecord,
  type BusinessShowcaseRecord,
} from "@/lib/business-showcase";
import type { BusinessShowcaseItem } from "@/lib/site-data";

function openBusinessUrl(url?: string) {
  if (!url) {
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}

function BusinessSocialLinks({ business }: { business: BusinessShowcaseItem }) {
  if (!business.socialLinks?.length) {
    return null;
  }

  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {business.socialLinks.map((link, index) => (
        <a
          key={`${link.label}-${link.href}-${index}`}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          onClick={(event) => event.stopPropagation()}
          className="inline-flex rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-primary transition hover:border-primary-soft hover:text-primary-soft"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}

function BusinessCard({
  business,
  featured = false,
}: {
  business: BusinessShowcaseItem;
  featured?: boolean;
}) {
  return (
    <article
      className={`panel overflow-hidden rounded-[1.7rem] bg-[linear-gradient(180deg,#ffffff,#f7f9ff)] ${
        business.websiteUrl ? "cursor-pointer transition hover:-translate-y-1" : ""
      }`}
      onClick={() => openBusinessUrl(business.websiteUrl)}
      onKeyDown={(event) => {
        if ((event.key === "Enter" || event.key === " ") && business.websiteUrl) {
          event.preventDefault();
          openBusinessUrl(business.websiteUrl);
        }
      }}
      role={business.websiteUrl ? "link" : undefined}
      tabIndex={business.websiteUrl ? 0 : undefined}
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
        <div className="absolute inset-0 bg-gradient-to-t from-[#091224]/86 via-[#091224]/30 to-[#091224]/14" />
        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
          <p
            className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
              featured
                ? "bg-[linear-gradient(135deg,#273c75,#1e3799)]"
                : "border border-white/14 bg-black/24"
            }`}
          >
            {business.badge}
          </p>
          <h2 className="mt-3 text-xl font-semibold">{business.name}</h2>
        </div>
      </div>
      <div className="p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-soft">
          {business.category}
        </p>
        <p className="mt-4 text-sm leading-7 text-muted">{business.description}</p>
        <div className="mt-5 space-y-2 text-sm leading-7 text-muted">
          <p>
            <span className="font-semibold text-primary">Phone:</span>{" "}
            <a
              href={`tel:${business.phone}`}
              onClick={(event) => event.stopPropagation()}
            >
              {business.phone}
            </a>
          </p>
          <p>
            <span className="font-semibold text-primary">Address:</span>{" "}
            {business.address}
          </p>
        </div>
        <BusinessSocialLinks business={business} />
        {business.websiteUrl ? (
          <div className="mt-5">
            <a
              href={business.websiteUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="btn-secondary"
            >
              Visit Website
            </a>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default function BusinessShowcasePage() {
  const [query, setQuery] = useState("");
  const [records, setRecords] = useState<BusinessShowcaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isAdvertiseModalOpen, setIsAdvertiseModalOpen] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState("");

  useEffect(() => {
    let isCancelled = false;

    const loadBusinesses = async () => {
      try {
        setLoadError("");
        const response = await fetch(`${API_BASE_URL}/business-showcase/`, {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("Unable to load business showcase listings.");
        }

        const data = (await response.json()) as BusinessShowcaseRecord[];
        if (!isCancelled) {
          const normalizedRecords = data
            .map(normalizeBusinessShowcaseRecord)
            .filter((item) => item.is_active)
            .sort((left, right) => {
              if (left.is_featured !== right.is_featured) {
                return Number(right.is_featured) - Number(left.is_featured);
              }
              return (
                new Date(right.created_at ?? "").getTime() -
                  new Date(left.created_at ?? "").getTime() ||
                left.display_order - right.display_order
              );
            });
          setRecords(normalizedRecords);
        }
      } catch (error) {
        if (!isCancelled) {
          setRecords([]);
          setLoadError(
            error instanceof Error
              ? error.message
              : "Unable to load business showcase listings.",
          );
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    void loadBusinesses();

    return () => {
      isCancelled = true;
    };
  }, []);

  const businessCards = useMemo(() => {
    return records.map(mapBusinessShowcaseRecordToCard);
  }, [records]);
  const categoryOptions = useMemo(() => {
    return [...new Set(records.map((item) => item.category.trim()).filter(Boolean))].sort();
  }, [records]);

  const filteredBusinesses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return businessCards;
    }

    return businessCards.filter((item) =>
      [item.name, item.category, item.badge]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [businessCards, query]);

  const featuredBusinesses = filteredBusinesses.filter(
    (item) => item.badge.toLowerCase() === "featured sponsor",
  );
  const showcaseBusinesses = filteredBusinesses.filter(
    (item) => item.badge.toLowerCase() !== "featured sponsor",
  );

  return (
    <div className="section-wrap py-8 md:py-12">
      <section className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#16213f,#273c75)] px-6 py-12 text-white md:px-10">
        <SectionHeading
          eyebrow="Business Showcase"
          title="A sponsored business directory that helps fund KNBA operations."
          description="This page gives visibility to businesses that support the association through promotional placements. It works as both a public directory and a fundraising channel for KNBA."
          light
        />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.4rem] bg-white/10 p-5">
            <p className="text-3xl font-bold">{filteredBusinesses.length}</p>
            <p className="mt-2 text-sm font-semibold uppercase tracking-[0.24em] text-white/68">
              Active Listings
            </p>
          </div>
          <div className="rounded-[1.4rem] bg-white/10 p-5">
            <p className="text-3xl font-bold">{featuredBusinesses.length}</p>
            <p className="mt-2 text-sm font-semibold uppercase tracking-[0.24em] text-white/68">
              Featured Sponsors
            </p>
          </div>
          <div className="rounded-[1.4rem] bg-white/10 p-5">
            <p className="text-3xl font-bold">Fundraising</p>
            <p className="mt-2 text-sm font-semibold uppercase tracking-[0.24em] text-white/68">
              Promotion-Based Support
            </p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="rounded-[1.9rem] border border-line bg-[linear-gradient(135deg,#edf3ff,#ffffff)] px-6 py-7 shadow-[0_18px_40px_rgba(18,31,69,0.08)] md:px-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.26em] text-primary-soft">
                Sponsors
              </p>
              <h2 className="display-font mt-3 text-[2rem] font-semibold leading-tight text-primary md:text-[2.35rem]">
                Featured Sponsors
              </h2>
            </div>
            <div className="w-full max-w-xl xl:ml-8">
              <label className="block">
                <span className="mb-3 block text-sm font-semibold uppercase tracking-[0.2em] text-primary-soft">
                  Search Listings
                </span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by business name, category, or badge"
                  className="w-full rounded-[1.1rem] border border-line bg-white px-4 py-3 text-sm text-primary outline-none placeholder:text-muted/70 focus:border-primary-soft"
                />
              </label>
            </div>
          </div>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {featuredBusinesses.map((business) => (
            <BusinessCard
              key={business.name}
              business={business}
              featured
            />
          ))}
        </div>
        {loading ? (
          <div className="mt-10 rounded-[1.6rem] border border-line bg-white px-6 py-8 text-sm text-muted shadow-[0_18px_40px_rgba(18,31,69,0.08)]">
            Loading featured sponsor listings...
          </div>
        ) : null}
        {!loading && loadError ? (
          <div className="mt-10 rounded-[1.6rem] border border-rose-200 bg-rose-50 px-6 py-8 text-sm text-rose-700 shadow-[0_18px_40px_rgba(18,31,69,0.08)]">
            {loadError}
          </div>
        ) : null}
        {!loading && !loadError && !featuredBusinesses.length ? (
          <div className="mt-10 rounded-[1.6rem] border border-line bg-white px-6 py-8 text-sm text-muted shadow-[0_18px_40px_rgba(18,31,69,0.08)]">
            No featured sponsor matched your search.
          </div>
        ) : null}
      </section>

      <section className="pb-20">
        <div className="rounded-[1.9rem] border border-line bg-[linear-gradient(135deg,#edf3ff,#ffffff)] px-6 py-7 shadow-[0_18px_40px_rgba(18,31,69,0.08)] md:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.26em] text-primary-soft">
            Directory
          </p>
          <h2 className="display-font mt-3 text-[2rem] font-semibold leading-tight text-primary md:text-[2.35rem]">
            Business Showcase
          </h2>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {showcaseBusinesses.map((business) => (
            <BusinessCard
              key={business.name}
              business={business}
              featured={business.badge.toLowerCase() === "member business"}
            />
          ))}
        </div>
        {!loading && !loadError && !showcaseBusinesses.length ? (
          <div className="mt-10 rounded-[1.6rem] border border-line bg-white px-6 py-8 text-sm text-muted shadow-[0_18px_40px_rgba(18,31,69,0.08)]">
            No business listing matched your search.
          </div>
        ) : null}
        <div className="mt-10">
          <button
            type="button"
            onClick={() => {
              setSubmissionMessage("");
              setIsAdvertiseModalOpen(true);
            }}
            className="btn-primary"
          >
            Advertise Your Business
          </button>
          <p className="mt-3 text-sm text-muted">
            Send your business details directly to the admin for verification and publishing.
          </p>
          {submissionMessage ? (
            <div className="mt-4 rounded-[1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {submissionMessage}
            </div>
          ) : null}
        </div>
      </section>
      {isAdvertiseModalOpen ? (
        <BusinessShowcaseAdvertiseModal
          categoryOptions={categoryOptions}
          onClose={() => setIsAdvertiseModalOpen(false)}
          onSubmitted={() => {
            setSubmissionMessage("Business details submitted. Admin review is now pending.");
          }}
        />
      ) : null}
    </div>
  );
}
