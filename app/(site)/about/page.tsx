import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";
import {
  homeStats,
  milestones,
  organizationPrinciples,
  presidentMessage,
  siteHistory,
} from "@/lib/site-data";

const founderFocus = [
  "Collective representation for traders and market stakeholders",
  "Faster communication on local market issues and notices",
  "A stronger business identity for Khichapokhari and New Road",
];

export default function AboutPage() {
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
              Khichapokhari Newroad Business Association brings merchants
              together through organized representation, practical coordination,
              and community-focused business support.
            </p>
            <p className="mt-4 max-w-3xl text-base leading-8 text-white/72">
              {siteHistory}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {homeStats.map((item) => (
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

      <section className="grid gap-8 py-18 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
        <div className="panel rounded-[1.9rem] p-7">
          <div className="rounded-[1.6rem] bg-[linear-gradient(180deg,#f7faff,#edf3ff)] p-7 text-center">
            <div className="mx-auto h-36 w-36 overflow-hidden rounded-full border-4 border-white shadow-[0_20px_35px_rgba(30,55,153,0.18)]">
              <Image
                src="/people/advisory-1.jpg"
                alt="Founding leadership portrait"
                width={144}
                height={144}
                className="h-full w-full object-cover"
              />
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-primary-soft">
              Founder&apos;s Word
            </p>
            <p className="mt-2 text-xl font-semibold text-primary">
              Founding Leadership
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
            eyebrow="Founder's Word"
            title="A shared association was built so market voices could carry real weight."
            description="KNBA was formed to create a credible platform for traders to coordinate their concerns, strengthen business relationships, and protect the identity of the local market community."
          />
          <blockquote className="mt-8 rounded-[1.8rem] border border-line bg-white p-8 text-base leading-8 text-muted shadow-[0_20px_40px_rgba(18,31,69,0.08)]">
            &quot;Our market has always relied on trust, cooperation, and quick
            coordination. KNBA was created so businesses could solve common
            issues together and move forward with a united voice.&quot;
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
              eyebrow="President's Message"
              title="Modern market leadership needs stronger systems, cleaner coordination, and dependable support."
              description={presidentMessage}
            />
            <div className="mt-8 rounded-[1.5rem] bg-[linear-gradient(135deg,#273c75,#1e3799)] p-7 text-white shadow-[0_18px_36px_rgba(30,55,153,0.22)]">
              <p className="text-lg leading-8 text-white/92">
                &quot;Our focus is to make KNBA practical for every member by
                combining accountability, clearer communication, and service
                systems that help the market operate smoothly.&quot;
              </p>
              <p className="mt-4 text-sm font-semibold uppercase tracking-[0.24em] text-white/72">
                Current President
              </p>
            </div>
          </div>
        </div>
        <div className="panel rounded-[1.9rem] p-7">
          <div className="rounded-[1.6rem] bg-[linear-gradient(180deg,#f7faff,#edf3ff)] p-7 text-center">
            <div className="mx-auto h-40 w-40 overflow-hidden rounded-full border-4 border-white shadow-[0_20px_35px_rgba(30,55,153,0.18)]">
              <Image
                src="/people/president.jpg"
                alt="Current president portrait"
                width={160}
                height={160}
                className="h-full w-full object-cover"
              />
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-primary-soft">
              Current Leadership
            </p>
            <p className="mt-2 text-xl font-semibold text-primary">President</p>
            <p className="mt-4 text-sm leading-7 text-muted">
              Leading KNBA toward stronger member communication, better
              operational systems, and a more organized market environment.
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
          {organizationPrinciples.map((item) => (
            <article
              key={item.title}
              className="panel overflow-hidden rounded-[1.8rem]"
            >
              <div className="bg-[linear-gradient(135deg,#273c75,#1e3799)] px-8 py-6 text-white">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/72">
                  {item.label}
                </p>
                <h2 className="display-font mt-3 text-[1.45rem] font-semibold leading-tight md:text-[1.72rem]">
                  {item.title}
                </h2>
              </div>
              <div className="p-8">
                <p className="text-sm leading-8 text-muted">{item.description}</p>
                <ul className="mt-6 space-y-3 text-sm text-muted">
                  {item.points.map((point) => (
                    <li key={point} className="flex gap-3">
                      <span className="mt-2 h-2.5 w-2.5 rounded-full bg-accent" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

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
