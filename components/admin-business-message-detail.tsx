"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL, getValidAdminAccessToken } from "@/lib/api";
import { AdminPageHeader } from "@/components/admin-page-header";

const badgeOptions = ["Featured Sponsor", "Member Business", "Business Showcase"];

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

export function AdminBusinessMessageDetail() {
  const params = useParams<{ id: string }>();
  const messageId = Number(params?.id);
  const [message, setMessage] = useState<BusinessShowcaseSubmissionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [approving, setApproving] = useState(false);
  const [isEditingApproval, setIsEditingApproval] = useState(false);
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

  const syncDraft = useCallback((record: BusinessShowcaseSubmissionRecord) => {
    setApprovalDraft({
      name: record.name,
      category: record.category,
      description: record.description,
      phone: record.phone,
      address: record.address,
      badge: record.badge ?? "Business Showcase",
      website_url: record.website_url,
      facebook_url: record.facebook_url,
      instagram_url: record.instagram_url,
      ecommerce_url: record.ecommerce_url,
      display_order: String(record.display_order ?? 0),
      is_featured: Boolean(record.is_featured),
    });
  }, []);

  const loadMessage = useCallback(async () => {
    const accessToken = await getValidAdminAccessToken();
    const response = await fetch(`${API_BASE_URL}/business-showcase-submissions/${messageId}/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Unable to load this business submission.");
    }

    const data = (await response.json()) as BusinessShowcaseSubmissionRecord;
    setMessage(data);
    syncDraft(data);
    setIsEditingApproval(false);

    if (!data.is_read) {
      const patchResponse = await fetch(
        `${API_BASE_URL}/business-showcase-submissions/${messageId}/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ is_read: true }),
        },
      );

      if (patchResponse.ok) {
        const patched = (await patchResponse.json()) as BusinessShowcaseSubmissionRecord;
        setMessage(patched);
        syncDraft(patched);
      }
    }
  }, [messageId, syncDraft]);

  useEffect(() => {
    let isCancelled = false;

    const run = async () => {
      if (Number.isNaN(messageId)) {
        setError("Invalid business message.");
        setLoading(false);
        return;
      }

      try {
        await loadMessage();
        if (!isCancelled) {
          setError("");
        }
      } catch (requestError) {
        if (!isCancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load this business submission.",
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
  }, [loadMessage, messageId]);

  const approveMessage = useCallback(async () => {
    if (!message) {
      return;
    }

    setApproving(true);
    setError("");
    setSuccess("");

    try {
      const accessToken = await getValidAdminAccessToken();
      const response = await fetch(
        `${API_BASE_URL}/business-showcase-submissions/${message.id}/approve/`,
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
      setMessage(approvedMessage);
      syncDraft(approvedMessage);
      setIsEditingApproval(false);
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
  }, [approvalDraft, message, syncDraft]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Message History"
        description="Review the full business submission and approve it from a dedicated page."
      />

      <div>
        <Link
          href="/admin/messages"
          className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold text-primary transition hover:bg-slate-50"
        >
          <span aria-hidden="true">&lt;</span>
          Back to Messages
        </Link>
      </div>

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

      <section className="admin-card rounded-[1.2rem] overflow-hidden">
        {loading ? (
          <div className="px-6 py-6 text-sm text-slate-500">
            Loading business submission...
          </div>
        ) : message ? (
          <>
            <div className="bg-[linear-gradient(135deg,#16213f,#273c75)] px-6 py-5 text-white">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/72">
                    Business Showcase Message
                  </p>
                  <h2 className="display-font mt-2 text-2xl font-semibold">{message.name}</h2>
                  <p className="mt-2 text-sm text-white/78">
                    Submitted by {message.submitter_name} on {formatDate(message.created_at)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingApproval((current) => !current)}
                  className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  {isEditingApproval ? "Preview" : "Edit Approval Data"}
                </button>
              </div>
            </div>

            <div className="grid gap-6 p-6 md:grid-cols-2">
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
                  <p className="mt-1 text-sm text-slate-700">{message.review_status}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-soft">
                    Submitted By
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{message.submitter_name}</p>
                  <p className="mt-1 text-sm text-slate-700">{message.submitter_email}</p>
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
                {message.review_status === "pending" ? (
                  <button
                    type="button"
                    onClick={() => void approveMessage()}
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
          </>
        ) : (
          <div className="px-6 py-6 text-sm text-slate-500">Business message not found.</div>
        )}
      </section>
    </div>
  );
}
