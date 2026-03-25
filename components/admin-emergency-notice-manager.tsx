"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminPageHeader } from "@/components/admin-page-header";
import { API_BASE_URL, getValidAdminAccessToken } from "@/lib/api";

type EmergencyNoticeRecord = {
  id?: number;
  label: string;
  message: string;
  button_label: string;
  pdf?: string | null;
  pdf_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type EmergencyNoticeFormState = {
  label: string;
  message: string;
  button_label: string;
  is_active: boolean;
};

const emptyForm: EmergencyNoticeFormState = {
  label: "Emergency Notice",
  message:
    "For urgent market coordination, safety concerns, or service disruption updates, contact the KNBA secretariat immediately.",
  button_label: "View Notice",
  is_active: true,
};

async function getAuthHeaders() {
  const accessToken = await getValidAdminAccessToken();
  return {
    Authorization: `Bearer ${accessToken}`,
  };
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

export function AdminEmergencyNoticeManager() {
  const [items, setItems] = useState<EmergencyNoticeRecord[]>([]);
  const [form, setForm] = useState<EmergencyNoticeFormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfMarkedForRemoval, setPdfMarkedForRemoval] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const editingItem = editingId
    ? items.find((item) => item.id === editingId) ?? null
    : null;
  const activePdfUrl =
    !pdfMarkedForRemoval && !pdfFile ? editingItem?.pdf_url ?? "" : "";
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    [],
  );

  const loadItems = useCallback(async () => {
    const response = await fetch(`${API_BASE_URL}/emergency-notices/`, {
      headers: await getAuthHeaders(),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Unable to load emergency notices.");
    }

    const data = (await response.json()) as EmergencyNoticeRecord[];
    setItems(data);
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
              : "Unable to load emergency notices.",
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
    setPdfFile(null);
    setPdfMarkedForRemoval(false);
    if (pdfInputRef.current) {
      pdfInputRef.current.value = "";
    }
  };

  const openCreateForm = () => {
    resetForm();
    setError("");
    setSuccess("");
    setFormOpen(true);
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLInputElement>("input")?.focus());
  };

  const openEditForm = (item: EmergencyNoticeRecord) => {
    setForm({
      label: item.label,
      message: item.message,
      button_label: item.button_label,
      is_active: item.is_active,
    });
    setEditingId(item.id ?? null);
    setPdfFile(null);
    setPdfMarkedForRemoval(false);
    if (pdfInputRef.current) {
      pdfInputRef.current.value = "";
    }
    setError("");
    setSuccess("");
    setFormOpen(true);
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLInputElement>("input")?.focus());
  };

  return (
    <section className="space-y-5">
      <AdminPageHeader
        title="Emergency Notice"
        description="Manage the urgent notice bar shown at the top of the public header and upload the linked PDF notice."
      />

      <div className="admin-master-panel px-6 py-5 md:px-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[1rem] font-semibold uppercase tracking-[0.08em] text-primary">
              Emergency Notice
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Keep one notice active so the public top bar shows the latest urgent update and PDF.
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
            {formOpen && editingId === null ? "Close Form" : "Add Notice"}
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
              const isEditing = editingId !== null;
              const payload = new FormData();
              payload.append("label", form.label.trim());
              payload.append("message", form.message.trim());
              payload.append("button_label", form.button_label.trim());
              payload.append("is_active", String(form.is_active));

              if (pdfFile) {
                payload.append("pdf", pdfFile);
              }

              if (pdfMarkedForRemoval && !pdfFile) {
                payload.append("pdf_clear", "1");
              }

              const response = await fetch(
                editingId
                  ? `${API_BASE_URL}/emergency-notices/${editingId}/`
                  : `${API_BASE_URL}/emergency-notices/`,
                {
                  method: editingId ? "PATCH" : "POST",
                  headers: await getAuthHeaders(),
                  body: payload,
                },
              );

              const rawText = await response.text();
              const data = parseApiPayload(rawText);
              if (!response.ok) {
                if (typeof data === "string" && data.trim()) {
                  throw new Error(data.length > 220 ? `${data.slice(0, 220).trim()}...` : data);
                }

                throw new Error(
                  getApiErrorMessage(data, `Unable to save emergency notice. (${response.status})`),
                );
              }

              await loadItems();
              resetForm();
              if (isEditing) {
                setFormOpen(false);
              } else {
                setFormOpen(true);
              }
              setSuccess(isEditing ? "Emergency notice updated." : "Emergency notice added.");
            } catch (requestError) {
              setError(
                requestError instanceof Error
                  ? requestError.message
                  : "Unable to save emergency notice.",
              );
            } finally {
              setSaving(false);
            }
          }}
        >
          <div className="mx-auto max-w-[54rem]">
            <div className="mx-auto grid w-full justify-center gap-3 md:grid-cols-2 md:gap-x-8">
              <label className="admin-master-label w-full max-w-[24rem]">
                <span>Label</span>
                <input
                  type="text"
                  value={form.label}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, label: event.target.value }))
                  }
                  className="admin-master-input"
                  required
                />
              </label>

              <label className="admin-master-label w-full max-w-[24rem]">
                <span>Button Label</span>
                <input
                  type="text"
                  value={form.button_label}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, button_label: event.target.value }))
                  }
                  className="admin-master-input"
                  required
                />
              </label>

              <label className="admin-master-label w-full max-w-[24rem] md:col-span-2">
                <span>Message</span>
                <textarea
                  value={form.message}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, message: event.target.value }))
                  }
                  className="admin-master-textarea"
                  rows={4}
                  required
                />
              </label>

              <label className="admin-master-label w-full max-w-[24rem]">
                <span>Notice PDF</span>
                <div className="flex min-h-[4rem] w-full items-center justify-between gap-3 rounded-[1rem] border border-dashed border-[rgba(39,60,117,0.18)] bg-white/80 px-3 py-2">
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={(event) => {
                      setPdfFile(event.target.files?.[0] ?? null);
                      setPdfMarkedForRemoval(false);
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => pdfInputRef.current?.click()}
                    className="admin-master-btn admin-master-btn-secondary min-h-[1.65rem] min-w-[5.8rem] px-2 py-1 text-[0.62rem] font-medium"
                  >
                    Upload PDF
                  </button>
                  <div className="min-w-0 flex-1 text-right text-[0.72rem] text-slate-600">
                    {pdfFile ? pdfFile.name : activePdfUrl ? "Current PDF uploaded" : "No PDF uploaded"}
                  </div>
                  {activePdfUrl ? (
                    <button
                      type="button"
                      onClick={() => {
                        setPdfFile(null);
                        setPdfMarkedForRemoval(true);
                        if (pdfInputRef.current) {
                          pdfInputRef.current.value = "";
                        }
                      }}
                      className="admin-table-btn admin-table-btn-delete shrink-0"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                {activePdfUrl ? (
                  <a
                    href={activePdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex text-[0.72rem] font-semibold text-primary hover:text-primary-soft"
                  >
                    View Current PDF
                  </a>
                ) : null}
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
                Active Notice
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
                {saving ? "Saving..." : editingId ? "Update Notice" : "Save Notice"}
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
                <th>Label</th>
                <th>Message</th>
                <th>PDF</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="rounded-[0.9rem] bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">
                    Loading emergency notices...
                  </td>
                </tr>
              ) : items.length ? (
                items.map((item) => (
                  <tr key={item.id ?? `${item.label}-${item.updated_at}`}>
                    <td className="rounded-l-[0.9rem] bg-slate-50/90 px-3 py-2 text-sm font-semibold text-slate-700">
                      {item.label}
                    </td>
                    <td className="max-w-[26rem] bg-slate-50/90 px-3 py-2 text-sm text-slate-600">
                      <p className="line-clamp-2">{item.message}</p>
                    </td>
                    <td className="bg-slate-50/90 px-3 py-2 text-sm text-slate-600">
                      {item.pdf_url ? (
                        <a
                          href={item.pdf_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex text-[0.72rem] font-semibold text-primary hover:text-primary-soft"
                        >
                          View PDF
                        </a>
                      ) : (
                        "No PDF"
                      )}
                    </td>
                    <td className="bg-slate-50/90 px-3 py-2 text-sm text-slate-600">
                      <span
                        className={`admin-badge ${item.is_active ? "admin-badge-active" : "admin-badge-inactive"}`}
                      >
                        {item.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="bg-slate-50/90 px-3 py-2 text-sm text-slate-600">
                      {item.updated_at ? dateFormatter.format(new Date(item.updated_at)) : "--"}
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
                            if (typeof item.id !== "number" || item.is_active) {
                              return;
                            }

                            try {
                              setError("");
                              setSuccess("");
                              const response = await fetch(
                                `${API_BASE_URL}/emergency-notices/${item.id}/activate/`,
                                {
                                  method: "POST",
                                  headers: await getAuthHeaders(),
                                },
                              );

                              if (!response.ok) {
                                throw new Error("Unable to activate emergency notice.");
                              }

                              await loadItems();
                              setSuccess(`"${item.label}" is now active in the header.`);
                            } catch (requestError) {
                              setError(
                                requestError instanceof Error
                                  ? requestError.message
                                  : "Unable to activate emergency notice.",
                              );
                            }
                          }}
                          className="admin-table-btn admin-table-btn-active"
                        >
                          {item.is_active ? "Live" : "Activate"}
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (typeof item.id !== "number") {
                              return;
                            }
                            if (!window.confirm(`Delete "${item.label}"?`)) {
                              return;
                            }

                            try {
                              setError("");
                              setSuccess("");
                              const response = await fetch(
                                `${API_BASE_URL}/emergency-notices/${item.id}/`,
                                {
                                  method: "DELETE",
                                  headers: await getAuthHeaders(),
                                },
                              );

                              if (!response.ok) {
                                throw new Error("Unable to delete emergency notice.");
                              }

                              if (editingId === item.id) {
                                resetForm();
                                setFormOpen(false);
                              }

                              await loadItems();
                              setSuccess("Emergency notice deleted.");
                            } catch (requestError) {
                              setError(
                                requestError instanceof Error
                                  ? requestError.message
                                  : "Unable to delete emergency notice.",
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
                    No emergency notices added yet. Use the form above to create the first one.
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
