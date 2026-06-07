"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL, getValidAdminAccessToken } from "@/lib/api";
import { AdminPageHeader } from "@/components/admin-page-header";

type ContactSubmissionRecord = {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  is_read: boolean;
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

export function AdminContactMessagesList() {
  const router = useRouter();
  const [items, setItems] = useState<ContactSubmissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const token = await getValidAdminAccessToken();
    const response = await fetch(`${API_BASE_URL}/contact-submissions/`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Unable to load contact messages.");
    setItems((await response.json()) as ContactSubmissionRecord[]);
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

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="General Inquiry"
        description="Contact form submissions from the public website."
      />

      {error ? (
        <div className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="admin-card rounded-[1.2rem] p-6">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="rounded-[1rem] bg-slate-50 px-4 py-4 text-sm text-slate-500">
              Loading inquiries...
            </div>
          ) : items.length ? (
            <table className="admin-master-table min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left">
                  <th>Name</th>
                  <th>Subject</th>
                  <th>Email</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((message) => (
                  <tr
                    key={message.id}
                    className="cursor-pointer"
                    onClick={() =>
                      router.push(`/admin/messages/contact/${message.id}`)
                    }
                    tabIndex={0}
                  >
                    <td className="rounded-l-[0.9rem] bg-slate-50/90 px-3 py-2 text-sm font-semibold text-slate-800">
                      {message.full_name}
                    </td>
                    <td className="bg-slate-50/90 px-3 py-2 text-sm text-slate-600">
                      {message.subject}
                    </td>
                    <td className="bg-slate-50/90 px-3 py-2 text-sm text-slate-600">
                      {message.email}
                    </td>
                    <td className="bg-slate-50/90 px-3 py-2 text-sm text-slate-600">
                      {formatDate(message.created_at)}
                    </td>
                    <td className="bg-slate-50/90 px-3 py-2 text-sm">
                      <span
                        className={`admin-badge ${
                          message.is_read
                            ? "admin-badge-active"
                            : "admin-badge-inactive"
                        }`}
                      >
                        {message.is_read ? "read" : "unread"}
                      </span>
                    </td>
                    <td className="rounded-r-[0.9rem] bg-slate-50/90 px-3 py-2 text-right">
                      <Link
                        href={`/admin/messages/contact/${message.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="admin-table-btn admin-table-btn-edit"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="rounded-[1rem] bg-slate-50 px-4 py-4 text-sm text-slate-500">
              No inquiries received yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
