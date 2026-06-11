"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/modal";
import { useConfirm } from "@/components/confirm-dialog";
import { API_BASE_URL, getValidAdminAccessToken } from "@/lib/api";
import { findMemberRole, memberRoleOptions } from "@/lib/member-roles";

type SubmissionRecord = {
  id: number;
  submitter_name: string;
  submitter_email: string;
  submitter_phone: string;
  name: string;
  role: string;
  category: "leadership" | "executive" | "advisory";
  phone: string;
  email: string;
  note: string;
  photo: string | null;
  photo_src: string;
  is_read: boolean;
  review_status: "pending" | "approved" | "rejected";
  admin_notes: string;
  reviewed_at: string | null;
  published_member: number | null;
  created_at: string;
  updated_at: string;
};

type StatusFilter = "all" | "pending" | "approved" | "rejected";

type TermOption = {
  id: number;
  label: string;
  is_current: boolean;
};

async function getAuthHeaders() {
  const accessToken = await getValidAdminAccessToken();
  return { Authorization: `Bearer ${accessToken}` };
}

function formatDateTime(value: string) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function statusBadge(status: SubmissionRecord["review_status"]) {
  const map = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-rose-50 text-rose-700 border-rose-200",
  } as const;
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[0.7rem] font-semibold capitalize ${map[status]}`}
    >
      {status}
    </span>
  );
}

export function AdminMemberSubmissionsManager() {
  const { confirm, dialog: confirmDialog } = useConfirm();
  const [items, setItems] = useState<SubmissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [selected, setSelected] = useState<SubmissionRecord | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    role: "",
    category: "executive" as SubmissionRecord["category"],
    phone: "",
    email: "",
    note: "",
    admin_notes: "",
    term: "",
  });
  const [terms, setTerms] = useState<TermOption[]>([]);
  const [working, setWorking] = useState(false);

  const loadItems = useCallback(async () => {
    const response = await fetch(`${API_BASE_URL}/member-submissions/`, {
      headers: await getAuthHeaders(),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Unable to load submissions.");
    const data = (await response.json()) as SubmissionRecord[];
    setItems(data);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadItems();
        const termResp = await fetch(`${API_BASE_URL}/member-terms/`, {
          headers: await getAuthHeaders(),
          cache: "no-store",
        });
        if (termResp.ok) {
          const termsData = (await termResp.json()) as TermOption[];
          if (!cancelled) setTerms(termsData);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Unable to load submissions.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadItems]);

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((item) => item.review_status === filter);
  }, [items, filter]);

  const counts = useMemo(
    () => ({
      pending: items.filter((i) => i.review_status === "pending").length,
      approved: items.filter((i) => i.review_status === "approved").length,
      rejected: items.filter((i) => i.review_status === "rejected").length,
    }),
    [items],
  );

  const openDetail = (item: SubmissionRecord) => {
    const defaultTerm =
      terms.find((t) => t.is_current)?.id ?? terms[0]?.id ?? "";
    setSelected(item);
    setEditForm({
      name: item.name,
      role: item.role,
      category: item.category,
      phone: item.phone,
      email: item.email,
      note: item.note,
      admin_notes: item.admin_notes,
      term: String(defaultTerm),
    });
    setError("");
    setSuccess("");
  };

  const closeDetail = () => {
    if (!working) setSelected(null);
  };

  const handleApprove = async () => {
    if (!selected) return;
    setWorking(true);
    setError("");
    try {
      const payload = new FormData();
      Object.entries(editForm).forEach(([k, v]) => payload.append(k, String(v)));
      const roleMeta = findMemberRole(editForm.role);
      if (roleMeta?.display_order != null) {
        payload.set("display_order", String(roleMeta.display_order));
      }
      const response = await fetch(
        `${API_BASE_URL}/member-submissions/${selected.id}/approve/`,
        {
          method: "POST",
          headers: await getAuthHeaders(),
          body: payload,
        },
      );
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Approve failed.");
      }
      await loadItems();
      setSuccess(`Approved "${selected.name}" — published to members list.`);
      setSelected(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Approve failed.");
    } finally {
      setWorking(false);
    }
  };

  const handleReject = () => {
    if (!selected) return;
    confirm({
      title: "Reject submission?",
      message: `"${selected.name}" will be marked as rejected. The submitter won't be published.`,
      confirmLabel: "Reject",
      destructive: true,
      onConfirm: async () => {
        setWorking(true);
        setError("");
        try {
          const payload = new FormData();
          payload.append("admin_notes", editForm.admin_notes);
          const response = await fetch(
            `${API_BASE_URL}/member-submissions/${selected.id}/reject/`,
            {
              method: "POST",
              headers: await getAuthHeaders(),
              body: payload,
            },
          );
          if (!response.ok) throw new Error("Reject failed.");
          await loadItems();
          setSuccess(`Rejected "${selected.name}".`);
          setSelected(null);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Reject failed.");
        } finally {
          setWorking(false);
        }
      },
    });
  };

  const handleDelete = (item: SubmissionRecord) => {
    confirm({
      title: "Delete submission?",
      message: `"${item.name}" will be permanently removed from the submissions list.`,
      confirmLabel: "Delete",
      destructive: true,
      onConfirm: async () => {
        setError("");
        try {
          const response = await fetch(
            `${API_BASE_URL}/member-submissions/${item.id}/`,
            {
              method: "DELETE",
              headers: await getAuthHeaders(),
            },
          );
          if (!response.ok) throw new Error("Delete failed.");
          await loadItems();
          setSuccess("Submission deleted.");
        } catch (e) {
          setError(e instanceof Error ? e.message : "Delete failed.");
        }
      },
    });
  };

  return (
    <section className="space-y-5">
      <div className="admin-master-panel px-6 py-5 md:px-7">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[1rem] font-semibold uppercase tracking-[0.08em] text-primary">
              Member Submissions
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              {counts.pending} pending · {counts.approved} approved · {counts.rejected}{" "}
              rejected
            </p>
          </div>
          <Link href="/admin/members" className="admin-master-btn admin-master-btn-secondary">
            ← Back to Members
          </Link>
        </div>
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

      <section className="admin-card rounded-[1.2rem] p-5 md:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {(["pending", "approved", "rejected", "all"] as StatusFilter[]).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(status)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition ${
                filter === status
                  ? "bg-primary text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {status}
              {status !== "all" && (
                <span className="ml-1.5 rounded-full bg-white/30 px-1.5 py-0 text-[0.65rem]">
                  {counts[status as keyof typeof counts]}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="admin-master-table min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left">
                <th>Submitter</th>
                <th>Proposed Member</th>
                <th>Role / Category</th>
                <th>Status</th>
                <th>Submitted</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="rounded-[0.9rem] bg-slate-50 px-3 py-3 text-sm text-slate-500"
                  >
                    Loading submissions...
                  </td>
                </tr>
              ) : filtered.length ? (
                filtered.map((item) => (
                  <tr key={item.id}>
                    <td className="rounded-l-[0.9rem] bg-slate-50/90 px-3 py-2 text-sm">
                      <div className="font-medium text-slate-700">{item.submitter_name}</div>
                      <div className="text-xs text-slate-500">{item.submitter_email}</div>
                    </td>
                    <td className="bg-slate-50/90 px-3 py-2 text-sm">
                      <div className="font-medium text-slate-700">{item.name}</div>
                      <div className="text-xs text-slate-500">{item.email}</div>
                    </td>
                    <td className="bg-slate-50/90 px-3 py-2 text-sm">
                      <div className="text-slate-700">{item.role}</div>
                      <div className="text-xs capitalize text-slate-500">{item.category}</div>
                    </td>
                    <td className="bg-slate-50/90 px-3 py-2 text-sm">
                      {statusBadge(item.review_status)}
                    </td>
                    <td className="bg-slate-50/90 px-3 py-2 text-xs text-slate-600">
                      {formatDateTime(item.created_at)}
                    </td>
                    <td className="rounded-r-[0.9rem] bg-slate-50/90 px-3 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openDetail(item)}
                          className="admin-table-btn admin-table-btn-edit"
                        >
                          Review
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="admin-table-btn admin-table-btn-delete"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="rounded-[0.9rem] bg-slate-50 px-3 py-4 text-sm text-slate-500"
                  >
                    No submissions match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        open={!!selected}
        onClose={closeDetail}
        title={selected ? `Review: ${selected.name}` : ""}
        size="lg"
      >
        {selected ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[auto_1fr]">
              {selected.photo_src ? (
                <img
                  src={selected.photo_src}
                  alt={selected.name}
                  className="h-28 w-28 rounded-2xl border border-slate-200 object-cover"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-slate-100 text-3xl font-bold text-slate-400">
                  {selected.name.charAt(0)}
                </div>
              )}
              <div className="space-y-1 text-sm">
                <div>
                  <span className="font-semibold text-slate-700">Submitted by:</span>{" "}
                  {selected.submitter_name}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Submitter email:</span>{" "}
                  {selected.submitter_email}
                </div>
                {selected.submitter_phone ? (
                  <div>
                    <span className="font-semibold text-slate-700">Submitter phone:</span>{" "}
                    {selected.submitter_phone}
                  </div>
                ) : null}
                <div>
                  <span className="font-semibold text-slate-700">Submitted on:</span>{" "}
                  {formatDateTime(selected.created_at)}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Status:</span>{" "}
                  {statusBadge(selected.review_status)}
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary-soft">
                Member fields (editable before approve)
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="admin-master-label">
                  <span>Name</span>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm((c) => ({ ...c, name: e.target.value }))
                    }
                    className="admin-master-input"
                  />
                </label>
                <label className="admin-master-label md:col-span-2">
                  <span>Role</span>
                  <select
                    value={editForm.role}
                    onChange={(e) => {
                      const value = e.target.value;
                      const meta = findMemberRole(value);
                      setEditForm((c) => ({
                        ...c,
                        role: value,
                        category: meta ? meta.category : c.category,
                      }));
                    }}
                    className="admin-master-input"
                  >
                    <option value="">Select role</option>
                    {memberRoleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                    {editForm.role && !findMemberRole(editForm.role) ? (
                      <option value={editForm.role}>
                        {editForm.role} (custom)
                      </option>
                    ) : null}
                  </select>
                </label>
                <label className="admin-master-label">
                  <span>Committee Term *</span>
                  <select
                    value={editForm.term}
                    onChange={(e) =>
                      setEditForm((c) => ({ ...c, term: e.target.value }))
                    }
                    className="admin-master-input"
                  >
                    {terms.length === 0 ? (
                      <option value="">No terms available — create one first</option>
                    ) : (
                      <>
                        <option value="">Select a term</option>
                        {terms.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.label}
                            {t.is_current ? " (current)" : ""}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </label>
                <label className="admin-master-label">
                  <span>Phone</span>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm((c) => ({ ...c, phone: e.target.value }))
                    }
                    className="admin-master-input"
                  />
                </label>
                <label className="admin-master-label md:col-span-2">
                  <span>Email</span>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm((c) => ({ ...c, email: e.target.value }))
                    }
                    className="admin-master-input"
                  />
                </label>
                <label className="admin-master-label md:col-span-2">
                  <span>Note</span>
                  <input
                    type="text"
                    value={editForm.note}
                    onChange={(e) =>
                      setEditForm((c) => ({ ...c, note: e.target.value }))
                    }
                    className="admin-master-input"
                  />
                </label>
                <label className="admin-master-label md:col-span-2">
                  <span>Admin notes (internal)</span>
                  <textarea
                    rows={2}
                    value={editForm.admin_notes}
                    onChange={(e) =>
                      setEditForm((c) => ({ ...c, admin_notes: e.target.value }))
                    }
                    className="admin-master-textarea"
                  />
                </label>
              </div>
            </div>

            {error ? (
              <p className="text-sm font-medium text-rose-700">{error}</p>
            ) : null}

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeDetail}
                disabled={working}
                className="admin-master-btn admin-master-btn-secondary"
              >
                Close
              </button>
              {selected.review_status !== "rejected" ? (
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={working}
                  className="admin-master-btn bg-rose-600 text-white hover:bg-rose-700"
                >
                  Reject
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleApprove}
                disabled={working}
                className="admin-master-btn admin-master-btn-primary bg-emerald-600 hover:bg-emerald-700"
              >
                {working
                  ? "Working..."
                  : selected.review_status === "approved"
                    ? "Update Published Member"
                    : "Approve & Publish"}
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      {confirmDialog}
    </section>
  );
}
