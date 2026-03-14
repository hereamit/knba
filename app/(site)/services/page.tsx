import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";
import { serviceHighlights, supportSteps } from "@/lib/site-data";

export default function ServicesPage() {
  return (
    <div className="section-wrap py-8 md:py-12">
      <section className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#16213f_0%,#273c75_52%,#1e3799_100%)] px-6 py-12 text-white shadow-[0_20px_42px_rgba(18,31,69,0.18)] md:px-10">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">
          Services
        </p>
        <h1 className="display-font mt-4 max-w-4xl text-[2.05rem] font-semibold leading-tight md:text-[2.65rem]">
          Member-centered services for smoother business operation in New Road.
        </h1>
        <p className="mt-6 max-w-3xl text-base leading-8 text-white/78">
          KNBA can serve as a practical nonprofit support platform for local
          businesses by coordinating communication, solving shared market
          challenges, and opening access to training, visibility, and
          institutional support.
        </p>
      </section>

      <section className="py-20">
        <div className="grid gap-6 xl:grid-cols-2">
          {serviceHighlights.map((service) => (
            <article
              key={service.title}
              className="panel overflow-hidden rounded-[1.7rem]"
            >
              <div className="border-b border-line px-8 py-7">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">
                  {service.tag}
                </p>
                <h2 className="mt-4 text-[1.55rem] font-bold text-primary md:text-[1.8rem]">
                  {service.title}
                </h2>
              </div>
              <div className="p-8">
                <p className="text-sm leading-8 text-muted">
                  {service.description}
                </p>
                <ul className="mt-6 space-y-4 text-sm text-muted">
                  {service.points.map((point) => (
                    <li key={point} className="flex gap-3">
                      <span className="mt-2 h-2.5 w-2.5 rounded-full bg-primary-soft" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] bg-[linear-gradient(135deg,#16213f,#273c75)] px-6 py-12 text-white md:px-10">
        <SectionHeading
          eyebrow="How Support Works"
          title="A simple operating model for effective member service."
          description="The association can combine field-level coordination with structured follow-up so requests do not get lost and members can see progress clearly."
          light
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {supportSteps.map((step, index) => (
            <article
              key={step.title}
              className="rounded-[1.5rem] border border-white/12 bg-white/8 p-6"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/60">
                Step {index + 1}
              </p>
              <h2 className="mt-4 text-2xl font-semibold">{step.title}</h2>
              <p className="mt-4 text-sm leading-7 text-white/76">
                {step.description}
              </p>
            </article>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="btn-primary" href="/contact">
            Request Support
          </Link>
          <Link className="btn-outline" href="/login">
            Admin Operations
          </Link>
        </div>
      </section>
    </div>
  );
}
