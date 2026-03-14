"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL, getValidAdminAccessToken } from "@/lib/api";
import { AdminPageHeader } from "@/components/admin-page-header";

type DashboardMetricSummary = {
  members: number;
  events: number;
  gallery_items: number;
  unread_messages: number;
};

type DashboardMessage = {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

type DashboardMemberBreakdown = {
  category: string;
  total: number;
};

type DashboardSummaryResponse = {
  metrics: DashboardMetricSummary;
  member_breakdown: DashboardMemberBreakdown[];
  recent_messages: DashboardMessage[];
};

function formatDateTime(value: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function toTitleCase(value: string) {
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function AdminDashboardManager() {
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCancelled = false;

    const loadDashboard = async () => {
      try {
        const accessToken = await getValidAdminAccessToken();
        const response = await fetch(`${API_BASE_URL}/dashboard/summary/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load admin dashboard summary.");
        }

        const data = (await response.json()) as DashboardSummaryResponse;
        if (!isCancelled) {
          setSummary(data);
        }
      } catch (requestError) {
        if (!isCancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load admin dashboard summary.",
          );
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      isCancelled = true;
    };
  }, []);

  const metrics = summary?.metrics ?? {
    members: 0,
    events: 0,
    gallery_items: 0,
    unread_messages: 0,
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Dashboard"
        description="Overview of association performance, pending requests, and incoming messages."
      />

      {error ? (
        <div className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="admin-card overflow-hidden rounded-[1.2rem]">
          <div className="h-2 w-full bg-[linear-gradient(135deg,#273c75,#1e3799)]" />
          <div className="p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Active Members
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-800">
              {loading ? "--" : metrics.members}
            </p>
          </div>
        </article>
        <article className="admin-card overflow-hidden rounded-[1.2rem]">
          <div className="h-2 w-full bg-[linear-gradient(135deg,#0f766e,#14b8a6)]" />
          <div className="p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Events
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-800">
              {loading ? "--" : metrics.events}
            </p>
          </div>
        </article>
        <article className="admin-card overflow-hidden rounded-[1.2rem]">
          <div className="h-2 w-full bg-[linear-gradient(135deg,#b45309,#f59e0b)]" />
          <div className="p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Gallery Items
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-800">
              {loading ? "--" : metrics.gallery_items}
            </p>
          </div>
        </article>
        <article className="admin-card overflow-hidden rounded-[1.2rem]">
          <div className="h-2 w-full bg-[linear-gradient(135deg,#7f1d1d,#ef4444)]" />
          <div className="p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Unread Messages
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-800">
              {loading ? "--" : metrics.unread_messages}
            </p>
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <article className="admin-card rounded-[1.2rem] p-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Member Breakdown
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-800">
              Active member categories
            </h2>
          </div>
          <div className="mt-6 space-y-4">
            {loading ? (
              <div className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                Loading member summary...
              </div>
            ) : summary?.member_breakdown.length ? (
              summary.member_breakdown.map((item) => (
                <div
                  key={item.category}
                  className="flex items-center justify-between rounded-[1rem] border border-slate-200 p-4"
                >
                  <p className="font-semibold text-slate-800">{toTitleCase(item.category)}</p>
                  <span className="admin-badge">{item.total}</span>
                </div>
              ))
            ) : (
              <div className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                No member breakdown available.
              </div>
            )}
          </div>
        </article>

        <article className="admin-card rounded-[1.2rem] p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Recent Messages
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-800">
                Contact the association office
              </h2>
            </div>
            <span className="admin-badge">Live from contact form</span>
          </div>
          <div className="mt-6 space-y-4">
            {loading ? (
              <div className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                Loading recent messages...
              </div>
            ) : summary?.recent_messages.length ? (
              summary.recent_messages.map((message) => (
                <article
                  key={message.id}
                  className="rounded-[1rem] border border-slate-200 bg-slate-50/90 p-5"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-lg font-bold text-slate-800">{message.full_name}</p>
                      <p className="text-sm text-slate-500">{message.email}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="admin-badge">{message.subject}</span>
                      <span className="text-sm font-semibold text-slate-500">
                        {formatDateTime(message.created_at)}
                      </span>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{message.message}</p>
                </article>
              ))
            ) : (
              <div className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                No recent contact messages found.
              </div>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
