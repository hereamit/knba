"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE_URL, getValidAdminAccessToken } from "@/lib/api";
import { AdminPageHeader } from "@/components/admin-page-header";

type ContactReplyRecord = {
  id: number;
  subject: string;
  body: string;
  recipient_email: string;
  attachment_url: string;
  attachment_name: string;
  sent_by_name: string;
  delivery_status: string;
  error_message: string;
  created_at: string;
};

type ContactSubmissionRecord = {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
  replies?: ContactReplyRecord[];
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

function getAttachmentType(url: string, name: string) {
  const source = `${name} ${url}`.toLowerCase();
  if (/\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/.test(source)) {
    return "image";
  }
  if (/\.pdf(\?|$)/.test(source)) {
    return "pdf";
  }
  return "file";
}

export function AdminContactMessageDetail() {
  const params = useParams<{ id: string }>();
  const messageId = Number(params?.id);
  const [message, setMessage] = useState<ContactSubmissionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [replying, setReplying] = useState(false);
  const [deletingReplyId, setDeletingReplyId] = useState<number | null>(null);
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [replyAttachment, setReplyAttachment] = useState<File | null>(null);

  const loadMessage = useCallback(async () => {
    const accessToken = await getValidAdminAccessToken();
    const response = await fetch(`${API_BASE_URL}/contact-submissions/${messageId}/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Unable to load this contact message.");
    }

    const data = (await response.json()) as ContactSubmissionRecord;
    setMessage(data);
    setReplySubject(`Re: ${data.subject}`);
    setReplyBody("");
    setReplyAttachment(null);

    if (!data.is_read) {
      const patchResponse = await fetch(`${API_BASE_URL}/contact-submissions/${messageId}/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_read: true }),
      });

      if (patchResponse.ok) {
        const patched = (await patchResponse.json()) as ContactSubmissionRecord;
        setMessage(patched);
      }
    }
  }, [messageId]);

  useEffect(() => {
    let isCancelled = false;

    const run = async () => {
      if (Number.isNaN(messageId)) {
        setError("Invalid contact message.");
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
              : "Unable to load this contact message.",
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

  const sendReply = useCallback(async () => {
    if (!message) {
      return;
    }

    setReplying(true);
    setError("");
    setSuccess("");

    try {
      const accessToken = await getValidAdminAccessToken();
      const formData = new FormData();
      formData.append("subject", replySubject);
      formData.append("body", replyBody);
      if (replyAttachment) {
        formData.append("attachment", replyAttachment);
      }
      const response = await fetch(`${API_BASE_URL}/contact-submissions/${message.id}/reply/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as
        | { detail?: string; reply?: ContactReplyRecord }
        | null;

      const reply = payload?.reply;
      if (reply) {
        setMessage((current) =>
          current
            ? {
                ...current,
                is_read: true,
                replies: [reply, ...(current.replies ?? [])],
              }
            : current,
        );
      }

      if (!response.ok) {
        throw new Error(payload?.detail || "Unable to send reply.");
      }

      setReplyBody("");
      setReplyAttachment(null);
      setSuccess(payload?.detail || "Reply sent successfully.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to send reply.");
    } finally {
      setReplying(false);
    }
  }, [message, replyAttachment, replyBody, replySubject]);

  const replyHistory = useMemo(() => message?.replies ?? [], [message?.replies]);

  const deleteReply = useCallback(
    async (replyId: number) => {
      setDeletingReplyId(replyId);
      setError("");
      setSuccess("");

      try {
        const accessToken = await getValidAdminAccessToken();
        const response = await fetch(`${API_BASE_URL}/contact-replies/${replyId}/`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("Unable to delete this reply history item.");
        }

        setMessage((current) =>
          current
            ? {
                ...current,
                replies: (current.replies ?? []).filter((reply) => reply.id !== replyId),
              }
            : current,
        );
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to delete this reply history item.",
        );
      } finally {
        setDeletingReplyId(null);
      }
    },
    [],
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Message History"
        description="Read the sender message and manage the full reply history from one page."
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

      {error && !message ? (
        <div className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="admin-card rounded-[1.2rem] overflow-hidden">
        {loading ? (
          <div className="px-6 py-6 text-sm text-slate-500">Loading message history...</div>
        ) : message ? (
          <>
            <div className="bg-[linear-gradient(135deg,#16213f,#273c75)] px-6 py-5 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/72">
                Contact Message
              </p>
              <h2 className="display-font mt-2 text-2xl font-semibold">{message.subject}</h2>
              <p className="mt-2 text-sm text-white/78">
                From {message.full_name} on {formatDate(message.created_at)}
              </p>
            </div>

            <div className="grid gap-6 p-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-soft">
                    Sender
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{message.full_name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-soft">
                    Email
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{message.email}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-soft">
                    Phone
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{message.phone || "Not provided"}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-soft">
                    Status
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {message.is_read ? "Read" : "Unread"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-soft">
                    Contact Back
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3">
                    <a
                      href={`mailto:${message.email}?subject=Re:%20${encodeURIComponent(message.subject)}`}
                      className="inline-flex min-h-[2.4rem] items-center justify-center rounded-full border border-line px-4 py-2 text-sm font-semibold text-primary"
                    >
                      Email Sender
                    </a>
                    {message.phone ? (
                      <a
                        href={`tel:${message.phone}`}
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
                  {message.message}
                </div>
              </div>

              <div className="space-y-3 md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-soft">
                  Reply From Portal
                </p>
                <input
                  type="text"
                  value={replySubject}
                  onChange={(event) => setReplySubject(event.target.value)}
                  className="w-full rounded-[0.95rem] border border-line bg-white px-4 py-3 text-sm outline-none"
                  placeholder="Reply subject"
                />
                <textarea
                  rows={5}
                  value={replyBody}
                  onChange={(event) => setReplyBody(event.target.value)}
                  className="w-full rounded-[1rem] border border-line bg-white px-4 py-4 text-sm leading-7 outline-none"
                  placeholder={`Write your reply to ${message.full_name}.`}
                />
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-soft">
                    Attachment
                  </label>
                  <input
                    type="file"
                    onChange={(event) => setReplyAttachment(event.target.files?.[0] ?? null)}
                    className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-full file:border file:border-line file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary"
                  />
                  {replyAttachment ? (
                    <p className="text-xs text-slate-500">{replyAttachment.name}</p>
                  ) : null}
                </div>
                <div className="flex justify-end">
                  <div className="flex max-w-[22rem] flex-col items-end gap-2">
                    <button
                      type="button"
                      onClick={() => void sendReply()}
                      disabled={replying}
                      className="btn-primary"
                    >
                      {replying ? "Sending..." : "Send Reply"}
                    </button>
                    {error ? <p className="text-right text-xs font-medium text-rose-700">{error}</p> : null}
                    {success ? (
                      <p className="text-right text-xs font-medium text-emerald-700">{success}</p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="space-y-3 md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-soft">
                  Reply History
                </p>
                {replyHistory.length ? (
                  <div className="space-y-3">
                    {replyHistory.map((reply) => (
                      <div
                        key={reply.id}
                        className="rounded-[1rem] border border-line bg-slate-50 px-4 py-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-800">{reply.subject}</p>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-500">
                              {formatDate(reply.created_at)}
                            </span>
                            <button
                              type="button"
                              onClick={() => void deleteReply(reply.id)}
                              disabled={deletingReplyId === reply.id}
                              className="rounded-full border border-rose-200 px-3 py-1 text-[11px] font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingReplyId === reply.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </div>
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary-soft">
                          {reply.delivery_status}
                          {reply.sent_by_name ? ` by ${reply.sent_by_name}` : ""}
                        </p>
                        <p className="mt-3 text-sm leading-7 text-slate-700">{reply.body}</p>
                        {reply.attachment_url ? (
                          getAttachmentType(reply.attachment_url, reply.attachment_name) === "image" ? (
                            <a
                              href={reply.attachment_url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 inline-flex items-center gap-3 rounded-[0.9rem] border border-line bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-primary"
                            >
                              <img
                                src={reply.attachment_url}
                                alt={reply.attachment_name || "Reply attachment"}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                              <span className="font-medium text-slate-700">
                                {reply.attachment_name || "View image"}
                              </span>
                            </a>
                          ) : getAttachmentType(reply.attachment_url, reply.attachment_name) === "pdf" ? (
                            <a
                              href={reply.attachment_url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 inline-flex items-center gap-3 rounded-[0.9rem] border border-line bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-primary"
                            >
                              <span className="flex h-9 w-9 items-center justify-center rounded-[0.7rem] bg-rose-50 text-base font-bold text-rose-700">
                                PDF
                              </span>
                              <span className="font-medium text-slate-700">
                                {reply.attachment_name || "Open PDF"}
                              </span>
                            </a>
                          ) : (
                            <a
                              href={reply.attachment_url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 inline-flex items-center gap-3 rounded-[0.9rem] border border-line bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-primary"
                            >
                              <span className="flex h-9 w-9 items-center justify-center rounded-[0.7rem] bg-slate-100 text-base font-bold text-slate-600">
                                F
                              </span>
                              <span className="font-medium text-slate-700">
                                {reply.attachment_name || "View attachment"}
                              </span>
                            </a>
                          )
                        ) : null}
                        {reply.error_message ? (
                          <p className="mt-3 text-xs font-medium text-rose-700">
                            {reply.error_message}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[1rem] border border-dashed border-line bg-slate-50 px-4 py-4 text-sm text-slate-500">
                    No reply history yet.
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="px-6 py-6 text-sm text-slate-500">Message not found.</div>
        )}
      </section>
    </div>
  );
}
