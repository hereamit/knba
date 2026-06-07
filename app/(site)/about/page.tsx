"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useOrganizationProfile } from "@/components/organization-profile-provider";
import { API_BASE_URL } from "@/lib/api";
import {
  defaultAboutPageRecord,
  normalizeAboutPageRecord,
  type AboutPageRecord,
} from "@/lib/about-page";
import { resolveMemberPhotoSrc, type MemberRecord } from "@/lib/members";

function LeaderPortrait({
  member,
  fallbackLabel,
  size = "lg",
}: {
  member: MemberRecord | null;
  fallbackLabel: string;
  size?: "md" | "lg" | "xl";
}) {
  const photoSrc = member?.photo_src ? resolveMemberPhotoSrc(member.photo_src) : "";
  const sizeClasses = {
    md: "h-32 w-32 text-3xl",
    lg: "h-44 w-44 text-4xl",
    xl: "h-56 w-56 text-5xl",
  }[size];

  return (
    <div
      className={`relative ${sizeClasses} overflow-hidden rounded-full border-[6px] border-white shadow-[0_25px_55px_rgba(30,55,153,0.28)]`}
    >
      {photoSrc ? (
        <img
          src={photoSrc}
          alt={member?.name ?? fallbackLabel}
          className="h-full w-full object-cover object-[center_18%]"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#dbe7ff,#bccdf8)] font-bold text-primary">
          {(member?.name ?? fallbackLabel).charAt(0)}
        </div>
      )}
    </div>
  );
}

export default function AboutPage() {
  const { profile } = useOrganizationProfile();
  const [about, setAbout] = useState<AboutPageRecord>(defaultAboutPageRecord);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isCancelled = false;
    const loadAboutData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/about-page/`, {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Unable to load about content.");
        if (!isCancelled) {
          setAbout(normalizeAboutPageRecord(await response.json()));
          setLoadError("");
        }
      } catch (error) {
        if (!isCancelled) {
          setAbout(defaultAboutPageRecord);
          setLoadError(
            error instanceof Error ? error.message : "Unable to load about content.",
          );
        }
      }
    };
    void loadAboutData();
    return () => {
      isCancelled = true;
    };
  }, []);

  const statCards = useMemo(
    () => [
      {
        label: "Committee Members",
        value: `${about.stats.committee_members}`,
        accent: "from-[#3b82f6] to-[#273c75]",
      },
      {
        label: "General Members",
        value: `${about.stats.general_members}`,
        accent: "from-[#6366f1] to-[#3730a3]",
      },
      {
        label: "Leadership",
        value: `${about.stats.leadership_members}`,
        accent: "from-[#8b5cf6] to-[#4c1d95]",
      },
    ],
    [about],
  );

  const orgName = profile.organization_name || about.settings.organization_name;

  return (
    <div className="pb-16">
      {/* HERO */}
      <section className="section-wrap relative pt-6 md:pt-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#0f1a35_0%,#1e3799_55%,#3b3eb0_100%)] px-6 py-8 text-white md:px-10 md:py-10">
          {/* decorative blobs */}
          <div className="pointer-events-none absolute -top-20 -right-16 h-64 w-64 rounded-full bg-white/8 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-12 h-60 w-60 rounded-full bg-[#5d6cda]/40 blur-3xl" />
          <div className="pointer-events-none absolute right-10 top-8 h-24 w-24 rounded-full border border-white/15" />

          <div className="relative max-w-4xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/8 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-white/85 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              About the Association
            </span>
            <h1 className="h-hero mt-4 text-white">
              The trusted business voice of Khichapokhari &amp; New Road.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/85 md:text-[0.95rem]">
              {orgName} brings merchants together through organized representation,
              practical coordination, and community-focused business support.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link
                className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2 text-sm font-semibold !text-primary transition hover:bg-white/90"
                href="/member"
              >
                Meet the Committee
              </Link>
              <Link
                className="inline-flex items-center justify-center rounded-full border border-white/30 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                href="/contact"
              >
                Get in Touch
              </Link>
            </div>
          </div>

          {/* Stat strip - inside hero card */}
          <div className="relative mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {statCards.map((item) => (
              <article
                key={item.label}
                className="rounded-[1.1rem] border border-white/14 bg-white/8 px-3.5 py-2.5 backdrop-blur-sm"
              >
                <p className="text-xl font-bold text-white md:text-2xl">
                  {item.value}
                </p>
                <p className="mt-1 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-white/72">
                  {item.label}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {loadError ? (
        <div className="section-wrap mt-8">
          <div className="rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
            {loadError}. Showing fallback content where live data is unavailable.
          </div>
        </div>
      ) : null}

      {/* ABOUT US */}
      <section className="section-wrap mt-12 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary-soft">
            <span className="h-px w-10 bg-primary-soft" />
            {about.settings.about_eyebrow}
          </p>
          <h2 className="h-section mt-3 text-primary">
            {about.settings.about_title}
          </h2>
          <p className="mt-4 text-justify text-sm leading-7 text-muted hyphens-auto">
            {about.settings.history_text}
          </p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-[1rem] border border-line bg-white px-3 py-3.5 text-center">
              <p className="text-2xl font-bold text-primary">
                {about.stats.connected_businesses}+
              </p>
              <p className="mt-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Businesses
              </p>
            </div>
            <div className="rounded-[1rem] border border-line bg-white px-3 py-3.5 text-center">
              <p className="text-2xl font-bold text-primary">
                {about.stats.committee_members}
              </p>
              <p className="mt-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Committee
              </p>
            </div>
            <div className="rounded-[1rem] border border-line bg-white px-3 py-3.5 text-center">
              <p className="text-2xl font-bold text-primary">
                {about.stats.general_members}
              </p>
              <p className="mt-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Members
              </p>
            </div>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -left-6 -top-6 h-32 w-32 rounded-[2rem] bg-[linear-gradient(135deg,#fbbf24,#f97316)] opacity-20 blur-2xl" />
          <div className="absolute -bottom-8 -right-6 h-32 w-32 rounded-[2rem] bg-[linear-gradient(135deg,#5d6cda,#1e3799)] opacity-20 blur-2xl" />
          <div className="relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-[linear-gradient(135deg,#16213f,#273c75)] p-7 text-white shadow-[0_20px_45px_rgba(17,29,66,0.24)]">
            <p className="display-font text-[4.5rem] font-bold leading-none text-white/20">
              &ldquo;
            </p>
            <p className="-mt-9 text-sm leading-7 text-white/90 md:text-base md:leading-8">
              {about.settings.about_quote}
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white/85">
                {about.settings.about_quote_label}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FOUNDER */}
      <section className="section-wrap mt-14">
        <article className="relative grid overflow-hidden rounded-[1.8rem] border border-line bg-white shadow-[0_24px_55px_rgba(18,31,69,0.08)] lg:grid-cols-[5fr_7fr]">
          <div className="relative flex items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#fef3c7,#fbbf24)] px-6 py-10 md:py-12">
            <div className="pointer-events-none absolute -top-16 -left-12 h-44 w-44 rounded-full bg-white/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-10 h-48 w-48 rounded-full bg-[#f97316]/40 blur-3xl" />
            <div className="relative flex flex-col items-center text-center">
              <LeaderPortrait
                member={about.founder}
                fallbackLabel="Founding Leadership"
                size="lg"
              />
              <div className="mt-5 rounded-full bg-white/85 px-4 py-1.5 backdrop-blur-sm">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.24em] text-[#92400e]">
                  Founder
                </p>
              </div>
              <p className="mt-3 text-lg font-bold text-[#1f1300]">
                {about.founder?.name ?? "Founding Leadership"}
              </p>
              <p className="mt-1 text-xs font-semibold text-[#7c2d12]">
                {about.founder?.role ?? "Founder"}
              </p>
            </div>
          </div>
          <div className="relative flex flex-col justify-center px-6 py-10 md:px-10 md:py-12">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary-soft">
              <span className="h-px w-10 bg-primary-soft" />
              Founder&apos;s Word
            </p>
            <h2 className="h-sub mt-3 text-primary">
              Built on shared purpose, anchored in our market.
            </h2>
            <blockquote className="relative mt-5 pl-6 text-justify text-sm leading-7 text-muted hyphens-auto md:text-[0.95rem]">
              <span className="absolute -left-1 top-0 h-full w-1 rounded-full bg-[linear-gradient(180deg,#fbbf24,#f97316)]" />
              &ldquo;{about.settings.founder_message}&rdquo;
            </blockquote>
          </div>
        </article>
      </section>

      {/* PRESIDENT */}
      <section className="section-wrap mt-10">
        <article className="relative grid overflow-hidden rounded-[1.8rem] border border-line shadow-[0_24px_55px_rgba(18,31,69,0.12)] lg:grid-cols-[7fr_5fr]">
          <div className="relative flex flex-col justify-center bg-[linear-gradient(135deg,#16213f,#1e3799)] px-6 py-10 text-white md:px-10 md:py-12">
            <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-white/8 blur-3xl" />
            <div className="pointer-events-none absolute -top-16 -right-10 h-48 w-48 rounded-full bg-[#5d6cda]/40 blur-3xl" />
            <p className="relative inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/72">
              <span className="h-px w-10 bg-white/40" />
              President&apos;s Message
            </p>
            <h2 className="h-sub relative mt-3">
              Modern market leadership.
              <br />
              <span className="text-white/70">Practical, organized, dependable.</span>
            </h2>
            <blockquote className="relative mt-5 pl-6 text-justify text-sm leading-7 text-white/85 hyphens-auto md:text-[0.95rem]">
              <span className="absolute -left-1 top-0 h-full w-1 rounded-full bg-[linear-gradient(180deg,#fbbf24,#f97316)]" />
              &ldquo;{about.settings.president_message}&rdquo;
            </blockquote>
          </div>
          <div className="relative flex items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#dbeafe,#bfdbfe)] px-6 py-10 md:py-12">
            <div className="pointer-events-none absolute -top-16 -right-12 h-44 w-44 rounded-full bg-white/40 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-[#1e3799]/25 blur-3xl" />
            <div className="relative flex flex-col items-center text-center">
              <LeaderPortrait member={about.president} fallbackLabel="President" size="lg" />
              <div className="mt-5 rounded-full bg-white/85 px-4 py-1.5 backdrop-blur-sm">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.24em] text-primary-soft">
                  Current President
                </p>
              </div>
              <p className="mt-3 text-lg font-bold text-primary">
                {about.president?.name ?? "President"}
              </p>
              <p className="mt-1 text-xs font-semibold text-primary-soft">
                {about.president?.role ?? "President"}
              </p>
              {about.president?.note ? (
                <p className="mt-3 max-w-xs text-xs leading-6 text-slate-700">
                  {about.president.note}
                </p>
              ) : null}
            </div>
          </div>
        </article>
      </section>

      {/* MISSION + VISION */}
      <section className="section-wrap mt-14">
        <div className="text-center">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary-soft">
            <span className="h-px w-10 bg-primary-soft" />
            Mission &amp; Vision
            <span className="h-px w-10 bg-primary-soft" />
          </p>
          <h2 className="h-section mt-3 text-primary">
            A future-ready association with practical support at its core.
          </h2>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <article className="group relative overflow-hidden rounded-[1.6rem] border border-line bg-white shadow-[0_18px_45px_rgba(18,31,69,0.06)] transition hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(30,55,153,0.18)]">
            <div className="relative bg-[linear-gradient(135deg,#fbbf24,#f97316)] px-6 py-5 text-white">
              <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-white/20 blur-2xl" />
              <div className="relative flex items-center justify-between">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.28em] text-white/85">
                  Our Mission
                </p>
                <span className="display-font text-2xl font-black text-white/85">01</span>
              </div>
              <h3 className="h-card mt-2 text-white">Why we exist</h3>
            </div>
            <div className="px-6 py-5">
              <p className="text-justify text-sm leading-7 text-muted hyphens-auto">{about.settings.mission_text}</p>
            </div>
          </article>
          <article className="group relative overflow-hidden rounded-[1.6rem] border border-line bg-white shadow-[0_18px_45px_rgba(18,31,69,0.06)] transition hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(30,55,153,0.18)]">
            <div className="relative bg-[linear-gradient(135deg,#5d6cda,#1e3799)] px-6 py-5 text-white">
              <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-white/20 blur-2xl" />
              <div className="relative flex items-center justify-between">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.28em] text-white/85">
                  Our Vision
                </p>
                <span className="display-font text-2xl font-black text-white/85">02</span>
              </div>
              <h3 className="h-card mt-2 text-white">Where we&apos;re headed</h3>
            </div>
            <div className="px-6 py-5">
              <p className="text-justify text-sm leading-7 text-muted hyphens-auto">{about.settings.vision_text}</p>
            </div>
          </article>
        </div>
      </section>

    </div>
  );
}
