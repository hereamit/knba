"use client";
import Link from "next/link";
import { useOrganizationProfile } from "@/components/organization-profile-provider";
import { resolveOrganizationImageSrc } from "@/lib/organization-profile";
import { footerSocialLinks, officeHours, siteNavItems } from "@/lib/site-data";

export function SiteFooter() {
  const { profile } = useOrganizationProfile();

  return (
    <footer className="mt-20 bg-[#101a35] text-white">
      <div className="section-wrap grid gap-8 py-14 md:grid-cols-2 xl:grid-cols-[1.15fr_0.75fr_0.75fr_0.9fr]">
        <div>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[1.2rem] bg-[linear-gradient(135deg,#273c75,#1e3799)] text-xl font-black text-white">
              {profile.logo_url ? (
                <img
                  src={resolveOrganizationImageSrc(profile.logo_url)}
                  alt={profile.short_name}
                  className="h-full w-full object-contain p-2"
                />
              ) : (
                profile.short_name.slice(0, 1)
              )}
            </div>
            <h2 className="display-font max-w-sm text-2xl font-semibold">
              {profile.organization_name}
            </h2>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.26em] text-white/60">
            Pages
          </p>
          <div className="mt-5 flex flex-col gap-3 text-sm text-white/78">
            {siteNavItems.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-white">
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.26em] text-white/60">
            Social
          </p>
          <div className="mt-5 flex flex-col gap-3 text-sm text-white/78">
            {footerSocialLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.26em] text-white/60">
            Office Hours
          </p>
          <div className="mt-5 flex flex-col gap-3 text-sm text-white/78">
            {officeHours.map((item) => (
              <div key={item.label}>
                <p className="font-semibold text-white">{item.label}</p>
                <p className="mt-1 text-white/68">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="section-wrap flex flex-col gap-3 py-5 text-sm text-white/62 md:flex-row md:items-center md:justify-between">
          <p>© 2026 {profile.short_name}. All rights reserved.</p>
          <p>{profile.office_address}, Nepal</p>
        </div>
      </div>
    </footer>
  );
}
