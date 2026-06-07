"use client";

import { useCallback, useEffect, useState } from "react";
import { Modal } from "@/components/modal";
import { useConfirm } from "@/components/confirm-dialog";
import { API_BASE_URL, getValidAdminAccessToken } from "@/lib/api";
import {
  normalizeServiceRecord,
  sortServices,
  type ServiceRecord,
} from "@/lib/services";

type ServiceFormState = {
  tag: string;
  title: string;
  description: string;
  points: string;
  display_order: string;
  is_active: boolean;
};

const emptyForm: ServiceFormState = {
  tag: "",
  title: "",
  description: "",
  points: "",
  display_order: "1",
  is_active: true,
};

async function getAuthHeaders() {
  const accessToken = await getValidAdminAccessToken();
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

function toTitleCase(value: string) {
  return value.replace(/\b([a-z])/g, (match) => match.toUpperCase());
}

function parseApiPayload(rawText: string) {
  if (!rawText.trim()) return null;
  try {
    return JSON.parse(rawText) as unknown;
  } catch {
    return rawText;
  }
}

function getApiErrorMessage(data: unknown, fallback: string) {
  if (data && typeof data === "object") {
    if ("detail" in data && typeof data.detail === "string") {
      return data.detail;
    }
    const entries = Object.entries(data)
      .map(([field, value]) => {
        if (Array.isArray(value) && value.length) return `${field}: ${value.join(" ")}`;
        if (typeof value === "string") return `${field}: ${value}`;
        return "";
      })
      .filter(Boolean);
    if (entries.length) return entries.join(" ");
  }
  return fallback;
}

function splitPoints(value: string) {
  return value
    .split(/\r?\n/)
    .map((point) => point.trim())
    .filter(Boolean);
}

function EditIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export function AdminServiceManager() {
  const { confirm, dialog: confirmDialog } = useConfirm();
  const [items, setItems] = useState<ServiceRecord[]>([]);
  const [form, setForm] = useState<ServiceFormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadItems = useCallback(async () => {
    const response = await fetch(`${API_BASE_URL}/services/`, {
      headers: await getAuthHeaders(),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Unable to load service records.");
    const data = (await response.json()) as ServiceRecord[];
    setItems(sortServices(data.map(normalizeServiceRecord)));
  }, []);

  useEffect(() => {
    let isCancelled = false;
    (async () => {
      try {
        await loadItems();
      } catch (e) {
        if (!isCancelled) {
          setError(e instanceof Error ? e.message : "Unable to load service records.");
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    })();
    return () => {
      isCancelled = true;
    };
  }, [loadItems]);

  const resetForm = () => {
    setForm({
      ...emptyForm,
      display_order: String((items.at(-1)?.display_order ?? 0) + 1),
    });
    setEditingId(null);
  };

  const openCreateForm = () => {
    resetForm();
    setError("");
    setModalOpen(true);
  };

  const openEditForm = (item: ServiceRecord) => {
    setForm({
      tag: item.tag,
      title: item.title,
      description: item.description,
      points: item.points.join("\n"),
      display_order: String(item.display_order),
      is_active: item.is_active,
    });
    setEditingId(item.id ?? null);
    setError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setError("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        tag: toTitleCase(form.tag.trim()),
        title: toTitleCase(form.title.trim()),
        description: form.description.trim(),
        points: splitPoints(form.points),
        display_order: Number(form.display_order || "0"),
        is_active: form.is_active,
      };

      const response = await fetch(
        editingId ? `${API_BASE_URL}/services/${editingId}/` : `${API_BASE_URL}/services/`,
        {
          method: editingId ? "PATCH" : "POST",
          headers: await getAuthHeaders(),
          body: JSON.stringify(payload),
        },
      );

      const rawText = await response.text();
      const data = parseApiPayload(rawText);
      if (!response.ok) {
        if (typeof data === "string" && data.trim()) {
          throw new Error(data.length > 220 ? `${data.slice(0, 220).trim()}...` : data);
        }
        throw new Error(
          getApiErrorMessage(data, `Unable to save service record. (${response.status})`),
        );
      }

      await loadItems();
      setSuccess(editingId ? "Service updated." : "Service added.");
      setModalOpen(false);
      resetForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save service record.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: ServiceRecord) => {
    if (typeof item.id !== "number") return;
    confirm({
      title: "Delete service?",
      message: `"${item.title}" will be permanently removed from the public services page.`,
      confirmLabel: "Delete",
      destructive: true,
      onConfirm: async () => {
        setError("");
        setSuccess("");
        try {
          const response = await fetch(`${API_BASE_URL}/services/${item.id}/`, {
            method: "DELETE",
            headers: await getAuthHeaders(),
          });
          if (!response.ok) throw new Error("Unable to delete service.");
          await loadItems();
          setSuccess("Service deleted.");
        } catch (e) {
          setError(e instanceof Error ? e.message : "Unable to delete service.");
        }
      },
    });
  };

  return (
    <section className="space-y-5">
      <div className="admin-master-panel px-6 py-5 md:px-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[1rem] font-semibold uppercase tracking-[0.08em] text-primary">
              Services
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Manage the service cards shown on the public services page.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateForm}
            className="admin-master-btn admin-master-btn-primary"
          >
            Add Service
          </button>
        </div>
      </div>

      {error && !modalOpen ? (
        <div className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-[1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {success}
        </div>
      ) : null}

      <div className="rounded-[1.2rem] border border-[rgba(39,60,117,0.12)] bg-white/92 p-4 shadow-[0_18px_40px_rgba(18,31,69,0.05)]">
        <div className="overflow-x-auto">
          <table className="admin-master-table min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr>
                <th>Tag</th>
                <th>Title</th>
                <th>Points</th>
                <th>Order</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="rounded-[0.9rem] bg-slate-50 px-4 py-5 text-center text-sm text-slate-500"
                  >
                    Loading service records...
                  </td>
                </tr>
              ) : items.length ? (
                items.map((item) => (
                  <tr key={item.id ?? `${item.title}-${item.display_order}`}>
                    <td className="rounded-l-[0.9rem] bg-slate-50/90 px-3 py-2 text-sm font-semibold text-slate-700">
                      {item.tag}
                    </td>
                    <td className="bg-slate-50/90 px-3 py-2 text-sm text-slate-700">
                      {item.title}
                    </td>
                    <td className="bg-slate-50/90 px-3 py-2 text-sm text-slate-600">
                      {item.points.length}
                    </td>
                    <td className="bg-slate-50/90 px-3 py-2 text-sm text-slate-600">
                      {item.display_order}
                    </td>
                    <td className="bg-slate-50/90 px-3 py-2 text-sm text-slate-600">
                      <span
                        className={`admin-badge ${
                          item.is_active ? "admin-badge-active" : "admin-badge-inactive"
                        }`}
                      >
                        {item.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="rounded-r-[0.9rem] bg-slate-50/90 px-3 py-2 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditForm(item)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-primary transition hover:bg-primary/10"
                          aria-label={`Edit ${item.title}`}
                          title="Edit"
                        >
                          <EditIcon />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 transition hover:bg-rose-50"
                          aria-label={`Delete ${item.title}`}
                          title="Delete"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="rounded-[0.9rem] bg-slate-50 px-4 py-5 text-center text-sm text-slate-500"
                  >
                    No service records yet. Click &quot;Add Service&quot; to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? "Edit Service" : "Add Service"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="admin-master-label">
              <span>Tag</span>
              <input
                type="text"
                value={form.tag}
                onChange={(e) =>
                  setForm((c) => ({ ...c, tag: e.target.value }))
                }
                className="admin-master-input"
                required
              />
            </label>
            <label className="admin-master-label">
              <span>Display Order</span>
              <input
                type="number"
                min="0"
                value={form.display_order}
                onChange={(e) =>
                  setForm((c) => ({ ...c, display_order: e.target.value }))
                }
                className="admin-master-input"
                required
              />
            </label>
            <label className="admin-master-label md:col-span-2">
              <span>Title</span>
              <input
                type="text"
                value={form.title}
                onChange={(e) =>
                  setForm((c) => ({ ...c, title: e.target.value }))
                }
                className="admin-master-input"
                required
              />
            </label>
            <label className="admin-master-label md:col-span-2">
              <span>Description</span>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((c) => ({ ...c, description: e.target.value }))
                }
                className="admin-master-textarea"
                rows={3}
                required
              />
            </label>
            <label className="admin-master-label md:col-span-2">
              <span>Points (one per line)</span>
              <textarea
                value={form.points}
                onChange={(e) =>
                  setForm((c) => ({ ...c, points: e.target.value }))
                }
                className="admin-master-textarea"
                rows={4}
                placeholder="One point per line"
                required
              />
            </label>
          </div>

          <label className="inline-flex items-center gap-2 text-[0.62rem] font-medium uppercase tracking-[0.08em] text-slate-700">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) =>
                setForm((c) => ({ ...c, is_active: e.target.checked }))
              }
            />
            Active
          </label>

          {error ? (
            <div className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="admin-master-btn admin-master-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="admin-master-btn admin-master-btn-primary"
            >
              {saving ? "Saving..." : editingId ? "Update Service" : "Save Service"}
            </button>
          </div>
        </form>
      </Modal>

      {confirmDialog}
    </section>
  );
}
