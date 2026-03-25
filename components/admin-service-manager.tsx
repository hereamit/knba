"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  if (!rawText.trim()) {
    return null;
  }

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
        if (Array.isArray(value) && value.length) {
          return `${field}: ${value.join(" ")}`;
        }
        if (typeof value === "string") {
          return `${field}: ${value}`;
        }
        return "";
      })
      .filter(Boolean);

    if (entries.length) {
      return entries.join(" ");
    }
  }

  return fallback;
}

function splitPoints(value: string) {
  return value
    .split(/\r?\n/)
    .map((point) => point.trim())
    .filter(Boolean);
}

export function AdminServiceManager() {
  const [items, setItems] = useState<ServiceRecord[]>([]);
  const [form, setForm] = useState<ServiceFormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const formRef = useRef<HTMLFormElement | null>(null);

  const loadItems = useCallback(async () => {
    const response = await fetch(`${API_BASE_URL}/services/`, {
      headers: await getAuthHeaders(),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Unable to load service records.");
    }

    const data = (await response.json()) as ServiceRecord[];
    setItems(sortServices(data.map(normalizeServiceRecord)));
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const run = async () => {
      try {
        if (!isCancelled) {
          await loadItems();
        }
      } catch (requestError) {
        if (!isCancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load service records.",
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
  }, [loadItems]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const openCreateForm = () => {
    resetForm();
    setError("");
    setSuccess("");
    setFormOpen(true);
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLInputElement>("input")?.focus());
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
    setSuccess("");
    setFormOpen(true);
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLInputElement>("input")?.focus());
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
            onClick={() => {
              if (formOpen && editingId === null) {
                setFormOpen(false);
                return;
              }
              openCreateForm();
            }}
            className="admin-master-btn admin-master-btn-primary"
          >
            {formOpen && editingId === null ? "Close Form" : "Add Service"}
          </button>
        </div>
      </div>

      {!formOpen && error ? (
        <div className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      {!formOpen && success ? (
        <div className="rounded-[1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {success}
        </div>
      ) : null}

      {formOpen ? (
        <form
          ref={formRef}
          className="rounded-[1.2rem] border border-[rgba(39,60,117,0.12)] bg-[linear-gradient(180deg,#dbe7ff_0%,#c9d9fb_100%)] p-4 shadow-[0_18px_40px_rgba(18,31,69,0.06)] md:p-5"
          onSubmit={async (event) => {
            event.preventDefault();
            setSaving(true);
            setError("");
            setSuccess("");

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
              resetForm();
              if (editingId !== null) {
                setFormOpen(false);
                setSuccess("Service record updated.");
              } else {
                setFormOpen(true);
                setSuccess("Service record added.");
              }
            } catch (requestError) {
              setError(
                requestError instanceof Error
                  ? requestError.message
                  : "Unable to save service record.",
              );
            } finally {
              setSaving(false);
            }
          }}
        >
          <div className="mx-auto max-w-[54rem]">
            <div className="mx-auto grid w-full justify-center gap-3 md:grid-cols-2 md:gap-x-8">
              <label className="admin-master-label w-full max-w-[24rem]">
                <span>Tag</span>
                <input
                  type="text"
                  value={form.tag}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, tag: event.target.value }))
                  }
                  className="admin-master-input"
                  required
                />
              </label>

              <label className="admin-master-label w-full max-w-[24rem]">
                <span>Display Order</span>
                <input
                  type="number"
                  min="0"
                  value={form.display_order}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      display_order: event.target.value,
                    }))
                  }
                  className="admin-master-input"
                  required
                />
              </label>

              <label className="admin-master-label w-full max-w-[24rem] md:col-span-2">
                <span>Title</span>
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, title: event.target.value }))
                  }
                  className="admin-master-input"
                  required
                />
              </label>

              <label className="admin-master-label w-full max-w-[24rem] md:col-span-2">
                <span>Description</span>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  className="admin-master-textarea"
                  rows={4}
                  required
                />
              </label>

              <label className="admin-master-label w-full max-w-[24rem] md:col-span-2">
                <span>Points</span>
                <textarea
                  value={form.points}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      points: event.target.value,
                    }))
                  }
                  className="admin-master-textarea"
                  rows={5}
                  placeholder="One point per line"
                  required
                />
              </label>
            </div>

            <div className="mt-3 flex flex-wrap gap-5">
              <label className="inline-flex items-center gap-2 text-[0.62rem] font-medium uppercase tracking-[0.08em] text-slate-700">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, is_active: event.target.checked }))
                  }
                />
                Active
              </label>
            </div>

            {formOpen && error ? (
              <div className="mt-4 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {error}
              </div>
            ) : null}

            {formOpen && success ? (
              <div className="mt-4 rounded-[1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                {success}
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setFormOpen(false);
                  setError("");
                }}
                className="admin-master-btn admin-master-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="admin-master-btn admin-master-btn-primary"
                disabled={saving}
              >
                {saving ? "Saving..." : editingId ? "Update Service" : "Save Service"}
              </button>
            </div>
          </div>
        </form>
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
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="rounded-[0.9rem] bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">
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
                      <span className={`admin-badge ${item.is_active ? "admin-badge-active" : "admin-badge-inactive"}`}>
                        {item.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="rounded-r-[0.9rem] bg-slate-50/90 px-3 py-2 text-sm text-slate-600">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(item)}
                          className="admin-table-btn admin-table-btn-edit"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (typeof item.id !== "number") {
                              return;
                            }
                            if (!window.confirm(`Delete "${item.title}"?`)) {
                              return;
                            }

                            try {
                              setError("");
                              setSuccess("");
                              const response = await fetch(`${API_BASE_URL}/services/${item.id}/`, {
                                method: "DELETE",
                                headers: await getAuthHeaders(),
                              });

                              if (!response.ok) {
                                throw new Error("Unable to delete service record.");
                              }

                              await loadItems();
                              if (editingId === item.id) {
                                resetForm();
                                setFormOpen(false);
                              }
                              setSuccess("Service record deleted.");
                            } catch (requestError) {
                              setError(
                                requestError instanceof Error
                                  ? requestError.message
                                  : "Unable to delete service record.",
                              );
                            }
                          }}
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
                  <td colSpan={6} className="rounded-[0.9rem] bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">
                    No service records found. Use the form above to add the first service.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
