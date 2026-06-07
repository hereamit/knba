"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE_URL, getValidAdminAccessToken } from "@/lib/api";
import { AdminPageHeader } from "@/components/admin-page-header";

type BusinessShowcaseSubmissionRecord = {
  id: number;
  submitter_name: string;
  submitter_email: string;
  name: string;
  category: string;
  description: string;
  phone: string;
  address: string;
  is_read?: boolean;
  review_status: string;
  created_at: string;
};

function formatDate(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function AdminBusinessMessagesList() {
  const router = useRouter();
  const [items, setItems] = useState<BusinessShowcaseSubmissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const token = await getValidAdminAccessToken();
    const response = await fetch(
      `${API_BASE_URL}/business-showcase-submissions/`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );
    if (!response.ok) throw new Error("Unable to load business submissions.");
    setItems((await response.json()) as BusinessShowcaseSubmissionRecord[]);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
        if (!cancelled) setError("");
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Unable to load.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const pending = useMemo(
    () => items.filter((item) => item.review_status === "pending"),
    [items],
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Business Ad Submissions"
        description="Business showcase ads submitted by members for review."
      />

      {error ? (
        <div className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="admin-card rounded-[1.2rem] p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {items.length} total · {pending.length} pending
          </span>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="rounded-[1rem] bg-slate-50 px-4 py-4 text-sm text-slate-500">
              Loading submissions...
            </div>
          ) : items.length ? (
            <table className="admin-master-table min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left">
                  <th>Business</th>
                  <th>Category</th>
                  <th>Phone</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((message) => {
                  const isPending = message.review_status === "pending";
                  return (
                    <tr
                      key={message.id}
                      className="cursor-pointer"
                      onClick={() =>
                        router.push(`/admin/messages/business/${message.id}`)
                      }
                      tabIndex={0}
                    >
                      <td className="rounded-l-[0.9rem] bg-slate-50/90 px-3 py-2 text-sm">
                        <p className="font-semibold text-slate-800">{message.name}</p>
                      </td>
                      <td className="bg-slate-50/90 px-3 py-2 text-sm text-slate-600">
                        {message.category}
                      </td>
                      <td className="bg-slate-50/90 px-3 py-2 text-sm text-slate-600">
                        {message.phone}
                      </td>
                      <td className="bg-slate-50/90 px-3 py-2 text-sm text-slate-600">
                        {formatDate(message.created_at)}
                      </td>
                      <td className="bg-slate-50/90 px-3 py-2 text-sm">
                        <span
                          className={`admin-badge ${
                            isPending ? "admin-badge-inactive" : "admin-badge-active"
                          }`}
                        >
                          {message.review_status}
                        </span>
                      </td>
                      <td className="rounded-r-[0.9rem] bg-slate-50/90 px-3 py-2 text-right">
                        <Link
                          href={`/admin/messages/business/${message.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="admin-table-btn admin-table-btn-edit"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="rounded-[1rem] bg-slate-50 px-4 py-4 text-sm text-slate-500">
              No business submissions yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
