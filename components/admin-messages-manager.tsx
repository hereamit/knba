"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { API_BASE_URL, getValidAdminAccessToken } from "@/lib/api";
import { AdminPageHeader } from "@/components/admin-page-header";

const badgeOptions = ["Featured Sponsor", "Member Business", "Business Showcase"];

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
  website_url: string;
  facebook_url: string;
  instagram_url: string;
  ecommerce_url: string;
  badge?: string;
  display_order?: number;
  is_featured?: boolean;
  is_read?: boolean;
  review_status: string;
  created_at: string;
};

type ApprovalDraft = {
  name: string;
  category: string;
  description: string;
  phone: string;
  address: string;
  badge: string;
  website_url: string;
  facebook_url: string;
  instagram_url: string;
  ecommerce_url: string;
  display_order: string;
  is_featured: boolean;
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
  const searchParams = useSearchParams();
  const [contactMessages, setContactMessages] = useState<ContactSubmissionRecord[]>([]);
  const [businessMessages, setBusinessMessages] = useState<BusinessShowcaseSubmissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [approving, setApproving] = useState(false);
  const [isEditingApproval, setIsEditingApproval] = useState(false);
  const [selectedBusinessMessage, setSelectedBusinessMessage] =
    useState<BusinessShowcaseSubmissionRecord | null>(null);
  const [selectedContactMessage, setSelectedContactMessage] =
    useState<ContactSubmissionRecord | null>(null);
  const [approvalDraft, setApprovalDraft] = useState<ApprovalDraft>({
    name: "",
    category: "",
    description: "",
    phone: "",
    address: "",
    badge: "Business Showcase",
    website_url: "",
    facebook_url: "",
    instagram_url: "",
    ecommerce_url: "",
    display_order: "0",
    is_featured: false,
  });

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
        if (isCancelled) {
          return;
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

  const pendingBusinessMessages = useMemo(() => {
    return businessMessages.filter((item) => item.review_status === "pending");
  }, [businessMessages]);

  const markContactAsRead = useCallback(async (messageId: number) => {
    const accessToken = await getValidAdminAccessToken();
    const response = await fetch(`${API_BASE_URL}/contact-submissions/${messageId}/`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ is_read: true }),
    });

    if (!response.ok) {
      throw new Error("Unable to update contact message status.");
    }

    const updatedMessage = (await response.json()) as ContactSubmissionRecord;
    setContactMessages((current) =>
      current.map((message) => (message.id === updatedMessage.id ? updatedMessage : message)),
    );
    setSelectedContactMessage(updatedMessage);
  }, []);

  const markBusinessAsRead = useCallback(async (messageId: number) => {
    const accessToken = await getValidAdminAccessToken();
    const response = await fetch(`${API_BASE_URL}/business-showcase-submissions/${messageId}/`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ is_read: true }),
    });

    if (!response.ok) {
      throw new Error("Unable to update business submission status.");
    }

    const updatedMessage = (await response.json()) as BusinessShowcaseSubmissionRecord;
    setBusinessMessages((current) =>
      current.map((message) => (message.id === updatedMessage.id ? updatedMessage : message)),
    );
    setSelectedBusinessMessage(updatedMessage);
  }, []);

  useEffect(() => {
    if (!selectedBusinessMessage) {
      return;
    }

    setApprovalDraft({
      name: selectedBusinessMessage.name,
      category: selectedBusinessMessage.category,
      description: selectedBusinessMessage.description,
      phone: selectedBusinessMessage.phone,
      address: selectedBusinessMessage.address,
      badge: selectedBusinessMessage.badge ?? "Business Showcase",
      website_url: selectedBusinessMessage.website_url,
      facebook_url: selectedBusinessMessage.facebook_url,
      instagram_url: selectedBusinessMessage.instagram_url,
      ecommerce_url: selectedBusinessMessage.ecommerce_url,
      display_order: String(selectedBusinessMessage.display_order ?? 0),
      is_featured: Boolean(selectedBusinessMessage.is_featured),
    });
    setIsEditingApproval(false);
  }, [selectedBusinessMessage]);

  useEffect(() => {
    if (loading) {
      return;
    }

    const messageType = searchParams.get("message_type");
    const rawMessageId = searchParams.get("message_id");
    const messageId = Number(rawMessageId);

    if (!messageType || Number.isNaN(messageId)) {
      return;
    }

    if (messageType === "business") {
      const matchedBusinessMessage = businessMessages.find((message) => message.id === messageId);
      if (matchedBusinessMessage) {
        setSelectedBusinessMessage(matchedBusinessMessage);
        if (!matchedBusinessMessage.is_read) {
          void markBusinessAsRead(matchedBusinessMessage.id);
        }
      }
      return;
    }

    if (messageType === "contact") {
      const matchedContactMessage = contactMessages.find((message) => message.id === messageId);
      if (matchedContactMessage) {
        setSelectedContactMessage(matchedContactMessage);
        if (!matchedContactMessage.is_read) {
          void markContactAsRead(matchedContactMessage.id);
        }
      }
    }
  }, [
    businessMessages,
    contactMessages,
    loading,
    markBusinessAsRead,
    markContactAsRead,
    searchParams,
  ]);

  const approveSelectedMessage = useCallback(async () => {
    if (!selectedBusinessMessage) {
      return;
    }

    setApproving(true);
    setError("");
    setSuccess("");

    try {
      const accessToken = await getValidAdminAccessToken();
      const response = await fetch(
        `${API_BASE_URL}/business-showcase-submissions/${selectedBusinessMessage.id}/approve/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...approvalDraft,
            display_order: Number(approvalDraft.display_order || "0"),
          }),
        },
      );

      const payload = (await response.json().catch(() => null)) as
        | BusinessShowcaseSubmissionRecord
        | { detail?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          payload && typeof payload === "object" && "detail" in payload && payload.detail
            ? payload.detail
            : "Unable to approve this business showcase message.",
        );
      }

      const approvedMessage = payload as BusinessShowcaseSubmissionRecord;
      setSelectedBusinessMessage(approvedMessage);
      setIsEditingApproval(false);
      await loadMessages();
      setSuccess(`"${approvedMessage.name}" was approved and pushed to Business Showcase.`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to approve this business showcase message.",
      );
    } finally {
      setApproving(false);
    }
  }, [approvalDraft, loadMessages, selectedBusinessMessage]);

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

      {success ? (
        <div className="rounded-[1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {success}
        </div>
      ) : null}

      <section className="admin-card rounded-[1.2rem] p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">
              Business Showcase Messages
            </p>
            <p className="mt-1 text-sm text-slate-500">
              These are the business details users sent from the Business Showcase popup.
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
                    <tr key={message.id}>
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
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBusinessMessage(message);
                            if (!message.is_read) {
                              void markBusinessAsRead(message.id);
                            }
                          }}
                          className="admin-table-btn admin-table-btn-edit"
                        >
                          View
                        </button>
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
            Messages sent from the contact form.
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
                  <tr key={message.id}>
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
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedContactMessage(message);
                          if (!message.is_read) {
                            void markContactAsRead(message.id);
                          }
                        }}
                        className="admin-table-btn admin-table-btn-edit"
                      >
                        View
                      </button>
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

      {selectedBusinessMessage ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#091224]/62 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[1.4rem] bg-white shadow-[0_30px_70px_rgba(9,18,36,0.3)]">
            <div className="bg-[linear-gradient(135deg,#273c75,#1e3799)] px-5 py-5 text-white">
              <button
                type="button"
                onClick={() => setSelectedBusinessMessage(null)}
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/14 text-base font-semibold text-white"
                aria-label="Close business message"
              >
                x
              </button>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/72">
                Business Showcase Message
              </p>
              <h2 className="display-font mt-2 text-2xl font-semibold">
                {selectedBusinessMessage.name}
              </h2>
              <p className="mt-2 text-sm text-white/78">
                Submitted by {selectedBusinessMessage.submitter_name} on{" "}
                {formatDate(selectedBusinessMessage.created_at)}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={`mailto:${selectedBusinessMessage.submitter_email}?subject=Business%20Showcase%20Submission%20Follow-up`}
                  className="inline-flex min-h-[2.4rem] items-center justify-center rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white"
                >
                  Email Client
                </a>
                <a
                  href={`tel:${selectedBusinessMessage.phone}`}
                  className="inline-flex min-h-[2.4rem] items-center justify-center rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white"
                >
                  Call Client
                </a>
                {selectedBusinessMessage.review_status === "pending" ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingApproval((value) => !value)}
                    className="inline-flex min-h-[2.4rem] items-center justify-center rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white"
                  >
                    {isEditingApproval ? "Close Edit" : "Edit Before Approve"}
                  </button>
                ) : null}
              </div>
            </div>

            <div className="grid gap-6 p-5 md:grid-cols-2 md:p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-soft">
                    Category
                  </p>
                  {isEditingApproval ? (
                    <input
                      type="text"
                      value={approvalDraft.category}
                      onChange={(event) =>
                        setApprovalDraft((current) => ({
                          ...current,
                          category: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-[0.9rem] border border-line bg-white px-3 py-2 text-sm outline-none"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-slate-700">{approvalDraft.category}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-soft">
                    Phone
                  </p>
                  {isEditingApproval ? (
                    <input
                      type="text"
                      value={approvalDraft.phone}
                      onChange={(event) =>
                        setApprovalDraft((current) => ({
                          ...current,
                          phone: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-[0.9rem] border border-line bg-white px-3 py-2 text-sm outline-none"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-slate-700">{approvalDraft.phone}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-soft">
                    Address
                  </p>
                  {isEditingApproval ? (
                    <input
                      type="text"
                      value={approvalDraft.address}
                      onChange={(event) =>
                        setApprovalDraft((current) => ({
                          ...current,
                          address: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-[0.9rem] border border-line bg-white px-3 py-2 text-sm outline-none"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-slate-700">{approvalDraft.address}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-soft">
                    Status
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {selectedBusinessMessage.review_status}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-soft">
                    Submitted By
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {selectedBusinessMessage.submitter_name}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {selectedBusinessMessage.submitter_email}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-soft">
                    Business Name
                  </p>
                  {isEditingApproval ? (
                    <input
                      type="text"
                      value={approvalDraft.name}
                      onChange={(event) =>
                        setApprovalDraft((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-[0.9rem] border border-line bg-white px-3 py-2 text-sm outline-none"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-slate-700">{approvalDraft.name}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-soft">
                    Badge
                  </p>
                  {isEditingApproval ? (
                    <div className="relative mt-2">
                      <select
                        value={approvalDraft.badge}
                        onChange={(event) =>
                          setApprovalDraft((current) => ({
                            ...current,
                            badge: event.target.value,
                          }))
                        }
                        className="w-full appearance-none rounded-[0.9rem] border border-line bg-white px-3 py-2 pr-12 text-sm outline-none"
                      >
                        {badgeOptions.map((badge) => (
                          <option key={badge} value={badge}>
                            {badge}
                          </option>
                        ))}
                      </select>
                      <span className="admin-select-arrow pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-500" />
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-slate-700">{approvalDraft.badge}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-soft">
                    Display Order
                  </p>
                  {isEditingApproval ? (
                    <input
                      type="number"
                      min="0"
                      value={approvalDraft.display_order}
                      onChange={(event) =>
                        setApprovalDraft((current) => ({
                          ...current,
                          display_order: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-[0.9rem] border border-line bg-white px-3 py-2 text-sm outline-none"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-slate-700">{approvalDraft.display_order}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-soft">
                    Website
                  </p>
                  {isEditingApproval ? (
                    <input
                      type="url"
                      value={approvalDraft.website_url}
                      onChange={(event) =>
                        setApprovalDraft((current) => ({
                          ...current,
                          website_url: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-[0.9rem] border border-line bg-white px-3 py-2 text-sm outline-none"
                    />
                  ) : (
                    <p className="mt-1 break-all text-sm text-slate-700">
                      {approvalDraft.website_url || "Not provided"}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-soft">
                    Facebook
                  </p>
                  {isEditingApproval ? (
                    <input
                      type="url"
                      value={approvalDraft.facebook_url}
                      onChange={(event) =>
                        setApprovalDraft((current) => ({
                          ...current,
                          facebook_url: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-[0.9rem] border border-line bg-white px-3 py-2 text-sm outline-none"
                    />
                  ) : (
                    <p className="mt-1 break-all text-sm text-slate-700">
                      {approvalDraft.facebook_url || "Not provided"}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-soft">
                    Instagram / Shop
                  </p>
                  {isEditingApproval ? (
                    <div className="mt-2 space-y-2">
                      <input
                        type="url"
                        value={approvalDraft.instagram_url}
                        onChange={(event) =>
                          setApprovalDraft((current) => ({
                            ...current,
                            instagram_url: event.target.value,
                          }))
                        }
                        className="w-full rounded-[0.9rem] border border-line bg-white px-3 py-2 text-sm outline-none"
                      />
                      <input
                        type="url"
                        value={approvalDraft.ecommerce_url}
                        onChange={(event) =>
                          setApprovalDraft((current) => ({
                            ...current,
                            ecommerce_url: event.target.value,
                          }))
                        }
                        className="w-full rounded-[0.9rem] border border-line bg-white px-3 py-2 text-sm outline-none"
                      />
                      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={approvalDraft.is_featured}
                          onChange={(event) =>
                            setApprovalDraft((current) => ({
                              ...current,
                              is_featured: event.target.checked,
                            }))
                          }
                        />
                        Featured
                      </label>
                    </div>
                  ) : (
                    <>
                      <p className="mt-1 break-all text-sm text-slate-700">
                        {approvalDraft.instagram_url || "Not provided"}
                      </p>
                      <p className="mt-1 break-all text-sm text-slate-700">
                        {approvalDraft.ecommerce_url || "Not provided"}
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-soft">
                  Full Message
                </p>
                {isEditingApproval ? (
                  <textarea
                    rows={5}
                    value={approvalDraft.description}
                    onChange={(event) =>
                      setApprovalDraft((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    className="w-full rounded-[1rem] border border-line bg-white px-4 py-4 text-sm leading-7 text-slate-700 outline-none"
                  />
                ) : (
                  <div className="rounded-[1rem] border border-line bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700">
                    {approvalDraft.description || "No description provided."}
                  </div>
                )}
              </div>

              <div className="flex justify-end md:col-span-2">
                {selectedBusinessMessage.review_status === "pending" ? (
                  <button
                    type="button"
                    onClick={() => void approveSelectedMessage()}
                    disabled={approving}
                    className="btn-primary"
                  >
                    {approving ? "Approving..." : "Push To Business Showcase"}
                  </button>
                ) : (
                  <span className="admin-badge admin-badge-active">Approved</span>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedBusinessMessage(null)}
            className="absolute inset-0 -z-10"
            aria-label="Close business message overlay"
          />
        </div>
      ) : null}

      {selectedContactMessage ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#091224]/62 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[1.4rem] bg-white shadow-[0_30px_70px_rgba(9,18,36,0.3)]">
            <div className="bg-[linear-gradient(135deg,#16213f,#273c75)] px-5 py-5 text-white">
              <button
                type="button"
                onClick={() => setSelectedContactMessage(null)}
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/14 text-base font-semibold text-white"
                aria-label="Close contact message"
              >
                x
              </button>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/72">
                Contact Message
              </p>
              <h2 className="display-font mt-2 text-2xl font-semibold">
                {selectedContactMessage.subject}
              </h2>
              <p className="mt-2 text-sm text-white/78">
                From {selectedContactMessage.full_name} on{" "}
                {formatDate(selectedContactMessage.created_at)}
              </p>
            </div>

            <div className="grid gap-6 p-5 md:grid-cols-2 md:p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-soft">
                    Sender
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{selectedContactMessage.full_name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-soft">
                    Email
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{selectedContactMessage.email}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-soft">
                    Phone
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {selectedContactMessage.phone || "Not provided"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-soft">
                    Status
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {selectedContactMessage.is_read ? "Read" : "Unread"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-soft">
                    Contact Back
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3">
                    <a
                      href={`mailto:${selectedContactMessage.email}?subject=Re:%20${encodeURIComponent(selectedContactMessage.subject)}`}
                      className="inline-flex min-h-[2.4rem] items-center justify-center rounded-full border border-line px-4 py-2 text-sm font-semibold text-primary"
                    >
                      Email Sender
                    </a>
                    {selectedContactMessage.phone ? (
                      <a
                        href={`tel:${selectedContactMessage.phone}`}
                        className="inline-flex min-h-[2.4rem] items-center justify-center rounded-full border border-line px-4 py-2 text-sm font-semibold text-primary"
                      >
                        Call Sender
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-soft">
                  Full Message
                </p>
                <div className="rounded-[1rem] border border-line bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700">
                  {selectedContactMessage.message}
                </div>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedContactMessage(null)}
            className="absolute inset-0 -z-10"
            aria-label="Close contact message overlay"
          />
        </div>
      ) : null}
    </div>
  );
}

