"use client";

import { ContactForm } from "@/components/contact-form";
import { SectionHeading } from "@/components/section-heading";
import { useOrganizationProfile } from "@/components/organization-profile-provider";
import { resolveOrganizationMapEmbedSrc } from "@/lib/organization-profile";

export default function ContactPage() {
  const { profile } = useOrganizationProfile();

  const contactDetails = [
    {
      label: "Address",
      value: profile.office_address,
      note: "Located in the main commercial corridor near the New Road market area.",
    },
    {
      label: "Phone",
      value: profile.phone_number,
      note: "Call during office hours for membership assistance and general coordination.",
    },
    {
      label: "Email",
      value: profile.email,
      note: "Use email for formal requests, partnerships, and documentation inquiries.",
    },
  ];

  return (
    <div className="section-wrap py-8 md:py-12">
      <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#16213f,#273c75)] px-6 py-12 text-white md:px-10">
          <p className="text-sm font-semibold uppercase tracking-[0.26em] text-white/72">
            Contact
          </p>
          <div className="mt-10 grid gap-4">
            {contactDetails.map((item) => (
              <article
                key={item.label}
                className="rounded-[1.35rem] border border-white/14 bg-white/10 p-5"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/62">
                  {item.label}
                </p>
                <p className="mt-3 text-base font-semibold">{item.value}</p>
                <p className="mt-2 text-sm leading-7 text-white/76">{item.note}</p>
              </article>
            ))}
          </div>
        </div>
        <ContactForm />
      </section>

      <section className="py-20">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="overflow-hidden rounded-[1.8rem] border border-line bg-white shadow-[0_18px_42px_rgba(18,31,69,0.08)]">
            <iframe
              title={`${profile.short_name} Location Map`}
              src={resolveOrganizationMapEmbedSrc(profile.map_embed_url)}
              className="h-[420px] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div>
            <SectionHeading
              eyebrow="Office Visit"
              title={`Find the ${profile.short_name} office near the New Road commercial center.`}
              description={`${profile.short_name} can serve as a coordination point for member support, issue reporting, documentation help, and collaborative planning. Appointments are recommended for formal meetings and partnership visits.`}
            />
            <div className="mt-8 space-y-4 text-sm leading-8 text-muted">
              <p>Physical Location: {profile.office_address}, Nepal.</p>
              <p>
                Office Hours: Sunday to Friday, 10:00 AM to 5:00 PM, excluding
                public holidays and major festival closures.
              </p>
              <p>
                For urgent member issues, {profile.short_name} can prioritize
                coordination with ward offices, market stakeholders, and service
                partners.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
