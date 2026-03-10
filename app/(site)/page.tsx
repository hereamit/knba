import Image from "next/image";
import Link from "next/link";
import { HomeHeroSlider } from "@/components/home-hero-slider";
import { SectionHeading } from "@/components/section-heading";
import {
  galleryItems,
  heroSlides,
  homeStats,
  serviceHighlights,
} from "@/lib/site-data";

export default function HomePage() {
  return (
    <div className="pb-20">
      <section className="section-wrap pt-6 md:pt-10">
        <HomeHeroSlider slides={heroSlides} />
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
              src={galleryItems[1].src}
              alt={galleryItems[1].title}
              fill
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
            eyebrow="Gallery"
            title="Moments from events, market coordination, and member programs."
            description="A snapshot of KNBA activities across meetings, celebrations, training sessions, and collaboration on New Road."
          />
          <Link className="btn-primary" href="/gallery">
            View Full Gallery
          </Link>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {galleryItems.slice(0, 4).map((item) => (
            <article
              key={item.title}
              className="group panel overflow-hidden rounded-[1.6rem]"
            >
              <div className="relative h-72 overflow-hidden">
                <Image
                  src={item.src}
                  alt={item.title}
                  fill
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
