"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { EnquiryModal } from "@/components/enquiry-modal";
import { emergencyNotice, siteNavItems } from "@/lib/site-data";

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled((current) => {
        if (current) {
          return y > 24;
        }

        return y > 96;
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50">
        <div
          className={`overflow-hidden bg-[#c62828] text-white transition-all duration-300 ease-out ${
            scrolled
              ? "max-h-0 -translate-y-full border-b-0 py-0 opacity-0"
              : "max-h-24 translate-y-0 border-b border-white/10 opacity-100"
          }`}
        >
          <div className="section-wrap flex flex-col gap-1 py-2 text-xs font-semibold tracking-[0.08em] sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[#f7f9ff]">
              <span className="mr-2 rounded-full bg-white/12 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-[#dfe8ff]">
                {emergencyNotice.label}
              </span>
              {emergencyNotice.message}
            </p>
            <p className="whitespace-nowrap text-[#dfe8ff]">
              Hotline: {emergencyNotice.contact}
            </p>
          </div>
        </div>
        <div
          className={`border-b border-white/10 bg-[linear-gradient(135deg,#273c75,#1e3799)] backdrop-blur-xl transition-all duration-300 ease-out ${
            scrolled
              ? "shadow-[0_22px_48px_rgba(17,29,66,0.24)]"
              : "shadow-[0_16px_38px_rgba(30,55,153,0.24)]"
          }`}
        >
          <div className="section-wrap flex items-center justify-between gap-4 py-4 transition-all duration-300 ease-out">
            <Link
              href="/"
              className="flex items-center gap-3"
              onClick={() => setMenuOpen(false)}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/14 text-lg font-black text-white ring-1 ring-white/12 transition-all duration-300">
                K
              </div>
              <div className="transition-all duration-300">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#dfe8ff]">
                  Kathmandu
                </p>
                <p className="text-base font-bold text-[#f7f9ff] transition-all duration-300">
                  Khichapokhari Newroad Business Association
                </p>
              </div>
            </Link>

            <nav className="hidden items-center gap-2 text-white lg:flex">
              {siteNavItems.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === item.href
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                      active
                        ? "bg-white/18 !text-white"
                        : "!text-white hover:bg-white/10 hover:!text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={() => setEnquiryOpen(true)}
                className="btn-primary"
              >
                Visitor Enquiry
              </button>
            </nav>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/18 bg-white/10 text-white transition-all duration-300 lg:hidden"
              aria-label="Toggle navigation"
            >
              <span className="space-y-1">
                <span className="block h-0.5 w-5 bg-current" />
                <span className="block h-0.5 w-5 bg-current" />
                <span className="block h-0.5 w-5 bg-current" />
              </span>
            </button>
          </div>

          {menuOpen ? (
            <div className="section-wrap pb-4 lg:hidden">
              <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,#273c75,#1e3799)] p-3 text-white shadow-[0_18px_40px_rgba(9,18,36,0.16)]">
                <div className="flex flex-col gap-2">
                  {siteNavItems.map((item) => {
                    const active =
                      item.href === "/"
                        ? pathname === item.href
                        : pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className={`rounded-[1rem] px-4 py-3 text-sm font-semibold ${
                          active ? "bg-white/18 !text-white" : "!text-white"
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                  <button
                    type="button"
                    className="btn-primary mt-2"
                    onClick={() => {
                      setMenuOpen(false);
                      setEnquiryOpen(true);
                    }}
                  >
                    Visitor Enquiry
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </header>
      {enquiryOpen ? (
        <EnquiryModal onClose={() => setEnquiryOpen(false)} />
      ) : null}
    </>
  );
}
