"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin-page-header";
import { API_BASE_URL, getValidAdminAccessToken } from "@/lib/api";

type Counts = {
  contactTotal: number;
  contactUnread: number;
  businessTotal: number;
  businessPending: number;
  memberTotal: number;
  memberPending: number;
};

const initialCounts: Counts = {
  contactTotal: 0,
  contactUnread: 0,
  businessTotal: 0,
  businessPending: 0,
  memberTotal: 0,
  memberPending: 0,
};

export function AdminMessagesManager() {
  const [counts, setCounts] = useState<Counts>(initialCounts);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const token = await getValidAdminAccessToken();
    const headers = { Authorization: `Bearer ${token}` };
    const [contactRes, businessRes, memberRes] = await Promise.all([
      fetch(`${API_BASE_URL}/contact-submissions/`, { headers, cache: "no-store" }),
      fetch(`${API_BASE_URL}/business-showcase-submissions/`, { headers, cache: "no-store" }),
      fetch(`${API_BASE_URL}/member-submissions/`, { headers, cache: "no-store" }),
    ]);

    const [contact, business, members] = await Promise.all([
      contactRes.ok ? (contactRes.json() as Promise<Array<{ is_read: boolean }>>) : [],
      businessRes.ok
        ? (businessRes.json() as Promise<Array<{ review_status: string }>>)
        : [],
      memberRes.ok
        ? (memberRes.json() as Promise<Array<{ review_status: string }>>)
        : [],
    ]);

    setCounts({
      contactTotal: contact.length,
      contactUnread: contact.filter((m) => !m.is_read).length,
      businessTotal: business.length,
      businessPending: business.filter((m) => m.review_status === "pending").length,
      memberTotal: members.length,
      memberPending: members.filter((m) => m.review_status === "pending").length,
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
        if (!cancelled) setError("");
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Unable to load message counts.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const cards = [
    {
      label: "General Inquiry",
      href: "/admin/messages/contact",
      description: "Contact form submissions from public visitors.",
      total: counts.contactTotal,
      pendingLabel: `${counts.contactUnread} unread`,
      accent: "from-blue-500 to-indigo-600",
    },
    {
      label: "Business Ad",
      href: "/admin/messages/business",
      description: "Business showcase ads submitted for review.",
      total: counts.businessTotal,
      pendingLabel: `${counts.businessPending} pending`,
      accent: "from-amber-500 to-orange-600",
    },
    {
      label: "Member Submission",
      href: "/admin/messages/members",
      description: "Self-submitted member profiles waiting for approval.",
      total: counts.memberTotal,
      pendingLabel: `${counts.memberPending} pending`,
      accent: "from-emerald-500 to-green-600",
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Messages"
        description="All incoming form submissions, grouped by category."
      />

      {error ? (
        <div className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="admin-card group rounded-[1.2rem] p-6 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(18,31,69,0.12)]"
          >
            <div
              className={`mb-3 inline-flex rounded-full bg-gradient-to-r ${card.accent} px-3 py-1 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-white`}
            >
              {card.pendingLabel}
            </div>
            <h2 className="text-xl font-bold text-slate-800">{card.label}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {card.description}
            </p>
            <div className="mt-5 flex items-end justify-between">
              <span className="text-3xl font-bold text-primary">
                {loading ? "..." : card.total}
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-soft">
                View →
              </span>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
