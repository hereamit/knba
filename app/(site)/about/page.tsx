import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";
import {
  milestones,
  organizationPrinciples,
  presidentMessage,
  siteHistory,
} from "@/lib/site-data";

export default function AboutPage() {
  return (
    <div className="section-wrap py-8 md:py-12">
      <section className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#16213f,#273c75)] px-6 py-12 text-white md:px-10">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/72">
          About The Association
        </p>
        <h1 className="display-font mt-4 max-w-4xl text-[2.05rem] font-semibold leading-tight md:text-[2.65rem]">
          A business association built to protect, organize, and uplift the
          Khichapokhari and New Road market community.
        </h1>
        <p className="mt-6 max-w-3xl text-base leading-8 text-white/78">
          {siteHistory}
        </p>
      </section>

      <section className="grid gap-8 py-20 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="panel rounded-[1.8rem] p-5">
          <div className="relative h-[420px] overflow-hidden rounded-[1.4rem]">
            <Image
              src="/photos/asan-tole.jpg"
              alt="Historic business district view in Kathmandu"
              fill
              className="object-cover"
            />
          </div>
        </div>
        <div>
          <SectionHeading
            eyebrow="Founder’s Word"
            title="A shared platform was essential for keeping business voices heard."
            description="The founding leadership created KNBA to ensure that traders in Khichapokhari and New Road had a credible collective body for coordination, advocacy, and mutual support."
          />
          <blockquote className="mt-8 rounded-[1.6rem] border border-line bg-white p-8 text-base leading-8 text-muted shadow-[0_18px_40px_rgba(18,31,69,0.08)]">
            “Our market has always thrived on trust, cooperation, and quick
            adaptation. KNBA was formed so that merchants could solve common
            issues together and speak with one clear, respected voice.”
          </blockquote>
          <p className="mt-5 text-sm font-semibold uppercase tracking-[0.24em] text-primary-soft">
            Founding Leadership
          </p>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <SectionHeading
            eyebrow="President’s Message"
            title="Modern business needs stronger coordination, cleaner systems, and better service."
            description={presidentMessage}
          />
          <div className="mt-8 rounded-[1.6rem] border border-line bg-[linear-gradient(135deg,#eef3ff,#ffffff)] p-8">
            <p className="text-lg leading-8 text-primary">
              “Our priority is to make KNBA a practical support system for every
              member, combining tradition, accountability, and modern business
              services that help the market operate smoothly.”
            </p>
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.24em] text-accent">
              Current President
            </p>
          </div>
        </div>
        <div className="panel rounded-[1.8rem] p-5">
          <div className="relative h-[420px] overflow-hidden rounded-[1.4rem]">
            <Image
              src="/photos/kathmandu-market.jpg"
              alt="Current market activity in Kathmandu"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="py-20">
        <SectionHeading
          eyebrow="Mission & Vision"
          title="A future-ready market association with strong community roots."
          description="KNBA combines business representation with neighborhood stewardship, helping members adapt to economic change while preserving New Road’s commercial identity."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {organizationPrinciples.map((item) => (
            <article
              key={item.title}
              className="panel overflow-hidden rounded-[1.6rem]"
            >
              <div className="bg-[linear-gradient(135deg,#273c75,#1e3799)] px-8 py-6 text-white">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/74">
                  {item.label}
                </p>
                <h2 className="display-font mt-3 text-[1.55rem] font-semibold md:text-[1.8rem]">
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
          title="Important moments in the association’s growth."
          description="The association has evolved from a coordination forum into a more structured support network for merchants and the wider market ecosystem."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {milestones.map((milestone) => (
            <article key={milestone.year} className="panel rounded-[1.6rem] p-7">
              <p className="text-4xl font-bold text-primary">{milestone.year}</p>
              <h3 className="mt-4 text-xl font-semibold text-primary-soft">
                {milestone.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-muted">
                {milestone.description}
              </p>
            </article>
          ))}
        </div>
        <div className="mt-10">
          <Link className="btn-primary" href="/contact">
            Meet The Team
          </Link>
        </div>
      </section>
    </div>
  );
}
