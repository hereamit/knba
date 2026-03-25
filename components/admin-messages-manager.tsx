"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
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

export function AdminMessagesManager() {
  const router = useRouter();
  const [contactMessages, setContactMessages] = useState<ContactSubmissionRecord[]>([]);
  const [businessMessages, setBusinessMessages] = useState<BusinessShowcaseSubmissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMessages = useCallback(async () => {
    const accessToken = await getValidAdminAccessToken();
    const [contactResponse, businessResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/contact-submissions/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }),
      fetch(`${API_BASE_URL}/business-showcase-submissions/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }),
    ]);

    if (!contactResponse.ok) {
      throw new Error("Unable to load contact messages.");
    }

    if (!businessResponse.ok) {
      throw new Error("Unable to load business showcase submissions.");
    }

    const [contactData, businessData] = await Promise.all([
      contactResponse.json() as Promise<ContactSubmissionRecord[]>,
      businessResponse.json() as Promise<BusinessShowcaseSubmissionRecord[]>,
    ]);

    setContactMessages(contactData);
    setBusinessMessages(businessData);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const run = async () => {
      try {
        await loadMessages();
        if (!isCancelled) {
          setError("");
        }
      } catch (requestError) {
        if (!isCancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load portal messages.",
          );
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      isCancelled = true;
    };
  }, [loadMessages]);

  const pendingBusinessMessages = useMemo(
    () => businessMessages.filter((item) => item.review_status === "pending"),
    [businessMessages],
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Messages"
        description="Review incoming contact requests and business showcase submissions."
      />

      {error ? (
        <div className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="admin-card rounded-[1.2rem] p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">
              Business Showcase Messages
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Open each submission in a dedicated page to review details and approval status.
            </p>
          </div>
          <span className="admin-badge">{pendingBusinessMessages.length} Pending</span>
        </div>

        <div className="mt-5 overflow-x-auto">
          {loading ? (
            <div className="rounded-[1rem] bg-slate-50 px-4 py-4 text-sm text-slate-500">
              Loading business showcase messages...
            </div>
          ) : businessMessages.length ? (
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
                {businessMessages.map((message) => {
                  const isPending = message.review_status === "pending";

                  return (
                    <tr
                      key={message.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/admin/messages/business/${message.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          router.push(`/admin/messages/business/${message.id}`);
                        }
                      }}
                      tabIndex={0}
                    >
                      <td className="rounded-l-[0.9rem] bg-slate-50/90 px-3 py-2 text-sm text-slate-700">
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
                          onClick={(event) => event.stopPropagation()}
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
              No business showcase messages found yet.
            </div>
          )}
        </div>
      </section>

      <section className="admin-card rounded-[1.2rem] p-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">
            Contact Messages
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Open each message in a dedicated page to read the conversation history and reply.
          </p>
        </div>

        <div className="mt-5 overflow-x-auto">
          {loading ? (
            <div className="rounded-[1rem] bg-slate-50 px-4 py-4 text-sm text-slate-500">
              Loading contact messages...
            </div>
          ) : contactMessages.length ? (
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
                {contactMessages.map((message) => (
                  <tr
                    key={message.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/admin/messages/contact/${message.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        router.push(`/admin/messages/contact/${message.id}`);
                      }
                    }}
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
                          message.is_read ? "admin-badge-active" : "admin-badge-inactive"
                        }`}
                      >
                        {message.is_read ? "read" : "unread"}
                      </span>
                    </td>
                    <td className="rounded-r-[0.9rem] bg-slate-50/90 px-3 py-2 text-right">
                      <Link
                        href={`/admin/messages/contact/${message.id}`}
                        onClick={(event) => event.stopPropagation()}
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
              No contact messages found yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
