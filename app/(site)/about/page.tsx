"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarFlipbook } from "@/components/calendar-flipbook";
import { useOrganizationProfile } from "@/components/organization-profile-provider";
import { SectionHeading } from "@/components/section-heading";
import { API_BASE_URL } from "@/lib/api";
import {
  defaultAboutPageRecord,
  normalizeAboutPageRecord,
  type AboutPageRecord,
} from "@/lib/about-page";
import {
  milestones,
} from "@/lib/site-data";
import {
  resolveMemberPhotoSrc,
  type MemberRecord,
} from "@/lib/members";

const founderFocus = [
  "Collective representation for traders and market stakeholders",
  "Faster communication on local market issues and notices",
  "A stronger business identity for Khichapokhari and New Road",
];

function LeaderPortrait({
  member,
  fallbackLabel,
}: {
  member: MemberRecord | null;
  fallbackLabel: string;
}) {
  const photoSrc = member?.photo_src ? resolveMemberPhotoSrc(member.photo_src) : "";

  return (
    <div className="mx-auto h-40 w-40 overflow-hidden rounded-full border-4 border-white shadow-[0_20px_35px_rgba(30,55,153,0.18)]">
      {photoSrc ? (
        <img
          src={photoSrc}
          alt={member?.name ?? fallbackLabel}
          className="h-full w-full object-cover object-[center_18%]"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#dbe7ff,#bccdf8)] text-4xl font-semibold text-primary">
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

        if (!response.ok) {
          throw new Error("Unable to load about content.");
        }

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
        label: "Connected Businesses",
        value: `${about.stats.connected_businesses}+`,
        detail:
          "Committee members and general member business records combined into one connected network.",
      },
      {
        label: "Current Term Committee",
        value: `${about.stats.committee_members}`,
        detail: about.current_term_label
          ? `Active public roster linked to ${about.current_term_label}.`
          : "Active public roster linked to the current working term.",
      },
      {
        label: "General Members",
        value: `${about.stats.general_members}`,
        detail:
          "Internal connected business records maintained by the association for operations and follow-up.",
      },
      {
        label: "Leadership Positions",
        value: `${about.stats.leadership_members}`,
        detail: `${about.stats.executive_members} executive and ${about.stats.advisory_members} advisory records are active in the current structure.`,
      },
    ],
    [about],
  );

  return (
    <div className="section-wrap py-8 md:py-12">
      <section className="overflow-hidden rounded-[2.2rem] bg-[linear-gradient(135deg,#16213f,#273c75)] px-6 py-10 text-white md:px-10 md:py-12">
        <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-white/68">
              About The Association
            </p>
            <h1 className="display-font mt-4 max-w-4xl text-[2rem] font-semibold leading-tight md:text-[2.55rem]">
              A trusted business platform for one of Kathmandu&apos;s busiest
              commercial communities.
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-white/82">
              {profile.organization_name || about.settings.organization_name} brings merchants
              together through organized representation, practical coordination,
              and community-focused business support.
            </p>
            <p className="mt-4 max-w-3xl text-base leading-8 text-white/72">
              {about.settings.history_text}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {statCards.map((item) => (
              <article
                key={item.label}
                className="rounded-[1.4rem] border border-white/14 bg-white/10 p-5 backdrop-blur-sm"
              >
                <p className="text-3xl font-bold text-white">{item.value}</p>
                <h2 className="mt-2 text-sm font-semibold uppercase tracking-[0.14em] text-white/84">
                  {item.label}
                </h2>
                <p className="mt-3 text-sm leading-7 text-white/68">
                  {item.detail}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {loadError ? (
        <div className="mt-6 rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
          {loadError}. Showing fallback about content where live data is unavailable.
        </div>
      ) : null}

      <section className="grid gap-8 py-18 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
        <div className="panel rounded-[1.9rem] p-7">
          <div className="rounded-[1.6rem] bg-[linear-gradient(180deg,#f7faff,#edf3ff)] p-7 text-center">
            <LeaderPortrait
              member={about.founder}
              fallbackLabel="Founding Leadership"
            />
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-primary-soft">
              Founder&apos;s Word
            </p>
            <p className="mt-2 text-xl font-semibold text-primary">
              {about.founder?.name ?? "Founding Leadership"}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-600">
              {about.founder?.role ?? "Founder"}
            </p>
            <div className="mt-6 space-y-3 text-left">
              {founderFocus.map((point) => (
                <div
                  key={point}
                  className="flex items-start gap-3 rounded-[1rem] bg-white/78 px-4 py-3 text-sm leading-6 text-muted"
                >
                  <span className="mt-2 h-2.5 w-2.5 rounded-full bg-accent" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div>
          <SectionHeading
            eyebrow="Founder&apos;s Word"
            title="A shared association was built so market voices could carry real weight."
            description="KNBA was formed to create a credible platform for traders to coordinate their concerns, strengthen business relationships, and protect the identity of the local market community."
          />
          <blockquote className="mt-8 rounded-[1.8rem] border border-line bg-white p-8 text-base leading-8 text-muted shadow-[0_20px_40px_rgba(18,31,69,0.08)]">
            &quot;{about.settings.founder_message}&quot;
          </blockquote>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <article className="rounded-[1.4rem] border border-line bg-[linear-gradient(180deg,#ffffff,#f8faff)] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-soft">
                Representation
              </p>
              <p className="mt-3 text-sm leading-7 text-muted">
                A common platform for dealing with local authorities and shared
                market concerns.
              </p>
            </article>
            <article className="rounded-[1.4rem] border border-line bg-[linear-gradient(180deg,#ffffff,#f8faff)] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-soft">
                Coordination
              </p>
              <p className="mt-3 text-sm leading-7 text-muted">
                Better communication between businesses, stakeholders, and the
                wider neighborhood.
              </p>
            </article>
            <article className="rounded-[1.4rem] border border-line bg-[linear-gradient(180deg,#ffffff,#f8faff)] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-soft">
                Community
              </p>
              <p className="mt-3 text-sm leading-7 text-muted">
                Support for a cleaner, safer, and more organized trading
                environment.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="grid gap-8 pb-20 lg:grid-cols-[1.16fr_0.84fr] lg:items-center">
        <div className="panel overflow-hidden rounded-[1.9rem]">
          <div className="bg-[linear-gradient(135deg,#eef3ff,#ffffff)] p-8 md:p-10">
            <SectionHeading
              eyebrow="President&apos;s Message"
              title="Modern market leadership needs stronger systems, cleaner coordination, and dependable support."
              description={about.settings.president_message}
            />
            <div className="mt-8 rounded-[1.5rem] bg-[linear-gradient(135deg,#273c75,#1e3799)] p-7 text-white shadow-[0_18px_36px_rgba(30,55,153,0.22)]">
              <p className="text-lg leading-8 text-white/92">
                &quot;{about.settings.president_message}&quot;
              </p>
              <p className="mt-4 text-sm font-semibold uppercase tracking-[0.24em] text-white/72">
                {about.president?.role ?? "Current President"}
              </p>
            </div>
          </div>
        </div>
        <div className="panel rounded-[1.9rem] p-7">
          <div className="rounded-[1.6rem] bg-[linear-gradient(180deg,#f7faff,#edf3ff)] p-7 text-center">
            <LeaderPortrait
              member={about.president}
              fallbackLabel="President"
            />
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-primary-soft">
              Current Leadership
            </p>
            <p className="mt-2 text-xl font-semibold text-primary">
              {about.president?.name ?? "President"}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-600">
              {about.president?.role ?? "President"}
            </p>
            <p className="mt-4 text-sm leading-7 text-muted">
              {about.president?.note
                ? about.president.note
                : "Leading KNBA toward stronger member communication, better operational systems, and a more organized market environment."}
            </p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <SectionHeading
          eyebrow="Mission & Vision"
          title="A future-ready association with practical support at its core."
          description="KNBA is designed to protect member interests while improving the day-to-day business environment through advocacy, shared systems, and stronger local coordination."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <article className="panel overflow-hidden rounded-[1.8rem]">
            <div className="bg-[linear-gradient(135deg,#273c75,#1e3799)] px-8 py-6 text-white">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/72">
                Mission
              </p>
              <h2 className="display-font mt-3 text-[1.45rem] font-semibold leading-tight md:text-[1.72rem]">
                Support every member business with practical coordination and representation.
              </h2>
            </div>
            <div className="p-8">
              <p className="text-sm leading-8 text-muted">{about.settings.mission_text}</p>
            </div>
          </article>
          <article className="panel overflow-hidden rounded-[1.8rem]">
            <div className="bg-[linear-gradient(135deg,#273c75,#1e3799)] px-8 py-6 text-white">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/72">
                Vision
              </p>
              <h2 className="display-font mt-3 text-[1.45rem] font-semibold leading-tight md:text-[1.72rem]">
                Create a well-managed, trusted, and future-ready business district.
              </h2>
            </div>
            <div className="p-8">
              <p className="text-sm leading-8 text-muted">{about.settings.vision_text}</p>
            </div>
          </article>
        </div>
      </section>

      {about.settings.calendar_pdf_url ? (
        <section className="pb-20">
          <SectionHeading
            eyebrow="Association Calendar"
            title="Flip through the official KNBA calendar."
            description="Turn the pages like a real diary — use the arrows or simply swipe on touch screens. You can also download the full PDF."
          />
          <div className="mt-10 rounded-[1.9rem] bg-[linear-gradient(135deg,#eef3ff,#ffffff)] p-5 md:p-8">
            <CalendarFlipbook pdfUrl={about.settings.calendar_pdf_url} />
          </div>
          <div className="mt-8 flex justify-center">
            <a
              href={about.settings.calendar_pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(30,55,153,0.22)] transition hover:bg-primary-soft"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download Calendar (PDF)
            </a>
          </div>
        </section>
      ) : null}

      <section className="pb-20">
        <SectionHeading
          eyebrow="Milestones"
          title="How the association has grown with the market."
          description="From its formation to its current digital transition, KNBA has continued evolving to meet the needs of local businesses and the wider commercial community."
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-4">
          {milestones.map((milestone, index) => (
            <article
              key={milestone.year}
              className="panel relative rounded-[1.7rem] p-7"
            >
              <div className="flex items-center justify-between">
                <p className="text-4xl font-bold text-primary">{milestone.year}</p>
                <span className="chip">0{index + 1}</span>
              </div>
              <h3 className="mt-5 text-xl font-semibold text-primary-soft">
                {milestone.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-muted">
                {milestone.description}
              </p>
            </article>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link className="btn-primary" href="/member">
            Meet The Team
          </Link>
          <Link className="btn-secondary" href="/contact">
            Contact KNBA
          </Link>
        </div>
      </section>
    </div>
  );
}
