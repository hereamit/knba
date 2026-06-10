"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NepalFlagIcon } from "@/components/nepal-flag-icon";
import { API_BASE_URL, getValidAdminAccessToken } from "@/lib/api";
import {
  focusFirstFormField,
  moveToNextFormField,
  preventMouseOnlyUploadKeyboard,
  resetEnterNavigationState,
} from "@/lib/enter-navigation";
import {
  normalizeMemberRecord,
  normalizeMemberTermRecord,
  resolveMemberPhotoSrc,
  type MemberRecord,
  type MemberTermRecord,
} from "@/lib/members";

type MemberTermFormState = {
  label: string;
  start_year: string;
  end_year: string;
  display_order: string;
  is_current: boolean;
  is_active: boolean;
};

type MemberFormState = {
  term: string;
  name: string;
  category: string;
  role: string;
  phone: string;
  email: string;
  note: string;
  display_order: string;
  is_active: boolean;
};

const emptyTermForm: MemberTermFormState = {
  label: "",
  start_year: "",
  end_year: "",
  display_order: "1",
  is_current: true,
  is_active: true,
};

const emptyMemberForm: MemberFormState = {
  term: "",
  name: "",
  category: "leadership",
  role: "",
  phone: "",
  email: "",
  note: "",
  display_order: "1",
  is_active: true,
};

const categoryOptions = [
  { value: "leadership", label: "Leadership" },
  { value: "executive", label: "Executive Committee" },
  { value: "advisory", label: "Advisory Panel" },
];

const NEPAL_COUNTRY_CODE = "+977";

function toTitleCase(value: string) {
  return value.replace(/\b([a-z])/g, (match) => match.toUpperCase());
}

function getLocalNepalPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("977") && digits.length >= 13) {
    return digits.slice(3, 13);
  }
  if (digits.startsWith("0") && digits.length >= 11) {
    return digits.slice(1, 11);
  }
  return digits.slice(0, 10);
}

function formatNepalPhone(value: string) {
  const localNumber = getLocalNepalPhone(value);
  return localNumber ? `${NEPAL_COUNTRY_CODE}-${localNumber}` : "";
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

async function getAuthHeaders() {
  const accessToken = await getValidAdminAccessToken();
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

export function AdminMemberManager({
  section = "all",
}: {
  section?: "all" | "terms" | "members";
}) {
  const [terms, setTerms] = useState<MemberTermRecord[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<number | null>(null);
  const [termForm, setTermForm] = useState<MemberTermFormState>(emptyTermForm);
  const [editingTermId, setEditingTermId] = useState<number | null>(null);
  const [termFormOpen, setTermFormOpen] = useState(false);
  const [termLoading, setTermLoading] = useState(true);
  const [termSaving, setTermSaving] = useState(false);
  const [termError, setTermError] = useState("");
  const [termSuccess, setTermSuccess] = useState("");

  const [items, setItems] = useState<MemberRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState<MemberFormState>(emptyMemberForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [photoMarkedForRemoval, setPhotoMarkedForRemoval] = useState(false);
  const [roleOptions, setRoleOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const formRef = useRef<HTMLFormElement | null>(null);
  const termFormRef = useRef<HTMLFormElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const selectedTerm = selectedTermId
    ? terms.find((term) => term.id === selectedTermId) ?? null
    : null;

  const editingItem = editingId ? items.find((item) => item.id === editingId) ?? null : null;
  const showTermsSection = section === "all" || section === "terms";
  const showMembersSection = section === "all" || section === "members";

  const photoDisplayUrl =
    !photoMarkedForRemoval && (photoPreviewUrl || editingItem?.photo_src || "");
  const resolvedPreviewPhotoSrc = photoDisplayUrl ? resolveMemberPhotoSrc(photoDisplayUrl) : "";

  const filteredItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return items;
    }

    return items.filter((item) =>
      [item.name, item.category_label, item.role, item.email, item.term_label]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [items, searchQuery]);

  const persistRoles = useCallback((nextRoles: string[]) => {
    setRoleOptions(nextRoles);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("knba_member_roles", JSON.stringify(nextRoles));
    }
  }, []);

  const syncRolesFromItems = useCallback(
    (records: MemberRecord[]) => {
      const recordRoles = records.map((item) => item.role.trim()).filter(Boolean);
      const savedRoles =
        typeof window !== "undefined"
          ? JSON.parse(window.localStorage.getItem("knba_member_roles") ?? "[]")
          : [];
      const mergedRoles = [...new Set([...savedRoles, ...recordRoles])].sort();
      persistRoles(mergedRoles);
    },
    [persistRoles],
  );

  const loadTerms = useCallback(async () => {
    const response = await fetch(`${API_BASE_URL}/member-terms/`, {
      headers: await getAuthHeaders(),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Unable to load member terms.");
    }

    const data = (await response.json()) as MemberTermRecord[];
    const normalizedTerms = data
      .map(normalizeMemberTermRecord)
      .sort((left, right) => left.display_order - right.display_order);

    setTerms(normalizedTerms);
    setSelectedTermId((current) => {
      if (current && normalizedTerms.some((term) => term.id === current)) {
        return current;
      }
      return normalizedTerms.find((term) => term.is_current)?.id ?? normalizedTerms[0]?.id ?? null;
    });
  }, []);

  const loadMembers = useCallback(async (termId?: number | null) => {
    const activeTermId = termId ?? selectedTermId;

    if (!activeTermId) {
      setItems([]);
      setLoading(false);
      return;
    }

    const response = await fetch(`${API_BASE_URL}/members/?term=${activeTermId}`, {
      headers: await getAuthHeaders(),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Unable to load member records.");
    }

    const data = (await response.json()) as MemberRecord[];
    const normalizedItems = data
      .map(normalizeMemberRecord)
      .sort((left, right) => left.display_order - right.display_order);
    setItems(normalizedItems);
    syncRolesFromItems(normalizedItems);
  }, [selectedTermId, syncRolesFromItems]);

  useEffect(() => {
    let isCancelled = false;

    const run = async () => {
      try {
        await loadTerms();
      } catch (requestError) {
        if (!isCancelled) {
          setTermError(
            requestError instanceof Error ? requestError.message : "Unable to load member terms.",
          );
        }
      } finally {
        if (!isCancelled) {
          setTermLoading(false);
        }
      }
    };

    void run();
    return () => {
      isCancelled = true;
    };
  }, [loadTerms]);

  useEffect(() => {
    let isCancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setError("");
        if (!selectedTermId) {
          setItems([]);
          return;
        }
        await loadMembers(selectedTermId);
      } catch (requestError) {
        if (!isCancelled) {
          setError(
            requestError instanceof Error ? requestError.message : "Unable to load member records.",
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
  }, [selectedTermId, loadMembers]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedRoles = JSON.parse(window.localStorage.getItem("knba_member_roles") ?? "[]");
    if (Array.isArray(storedRoles) && storedRoles.length) {
      setRoleOptions(storedRoles.filter((item): item is string => typeof item === "string"));
    }
  }, []);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreviewUrl("");
      return;
    }

    const nextUrl = URL.createObjectURL(photoFile);
    setPhotoPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [photoFile]);

  const resetTermForm = () => {
    setTermForm(emptyTermForm);
    setEditingTermId(null);
  };

  const openCreateTermForm = () => {
    resetTermForm();
    setTermForm({
      ...emptyTermForm,
      display_order: String((terms.at(-1)?.display_order ?? 0) + 1),
    });
    setTermError("");
    setTermSuccess("");
    setTermFormOpen(true);
  };

  const openEditTermForm = (term: MemberTermRecord) => {
    setTermForm({
      label: term.label,
      start_year: String(term.start_year),
      end_year: String(term.end_year),
      display_order: String(term.display_order),
      is_current: term.is_current,
      is_active: term.is_active,
    });
    setEditingTermId(term.id ?? null);
    setTermError("");
    setTermSuccess("");
    setTermFormOpen(true);
  };

  const resetMemberForm = () => {
    setForm({
      ...emptyMemberForm,
      term: selectedTermId ? String(selectedTermId) : "",
    });
    setEditingId(null);
    setPhotoFile(null);
    setPhotoMarkedForRemoval(false);
    setPhoneError("");
  };

  const openCreateMemberForm = () => {
    resetMemberForm();
    setForm({
      ...emptyMemberForm,
      term: selectedTermId ? String(selectedTermId) : "",
      display_order: String((items.at(-1)?.display_order ?? 0) + 1),
    });
    setError("");
    setSuccess("");
    setFormOpen(true);
  };

  const openEditForm = (item: MemberRecord) => {
    setForm({
      term: item.term ? String(item.term) : selectedTermId ? String(selectedTermId) : "",
      name: item.name,
      category: item.category,
      role: item.role,
      phone: getLocalNepalPhone(item.phone),
      email: item.email,
      note: item.note ?? "",
      display_order: String(item.display_order),
      is_active: item.is_active,
    });
    setEditingId(item.id ?? null);
    setPhotoFile(null);
    setPhotoMarkedForRemoval(false);
    setPhoneError("");
    setError("");
    setSuccess("");
    setFormOpen(true);
  };

  const addRoleOption = () => {
    const promptedRole =
      typeof window !== "undefined" ? window.prompt("Enter member role") : null;
    const nextRole = toTitleCase((promptedRole ?? "").trim());
    if (!nextRole) {
      return;
    }

    const nextOptions = [...new Set([...roleOptions, nextRole])].sort();
    persistRoles(nextOptions);
    setForm((current) => ({ ...current, role: nextRole }));
    setError("");
    setSuccess(`Role "${nextRole}" is ready to reuse.`);
  };

  return (
    <section className="space-y-6">
      {showTermsSection ? (
      <div className="admin-master-panel px-6 py-5 md:px-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[1rem] font-semibold uppercase tracking-[0.08em] text-primary">
              Member Terms
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              if (termFormOpen && editingTermId === null) {
                setTermFormOpen(false);
                return;
              }
              openCreateTermForm();
            }}
            className="admin-master-btn admin-master-btn-primary"
          >
            {termFormOpen && editingTermId === null ? "Close Form" : "Add Term"}
          </button>
        </div>
      </div>
      ) : null}

      {showTermsSection && !termFormOpen && termError ? (
        <div className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {termError}
        </div>
      ) : null}

      {showTermsSection && !termFormOpen && termSuccess ? (
        <div className="rounded-[1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {termSuccess}
        </div>
      ) : null}

      {showTermsSection && termFormOpen ? (
        <form
          ref={termFormRef}
          className="rounded-[1.2rem] border border-[rgba(39,60,117,0.12)] bg-[linear-gradient(180deg,#dbe7ff_0%,#c9d9fb_100%)] p-4 shadow-[0_18px_40px_rgba(18,31,69,0.06)] md:p-5"
          onKeyDown={moveToNextFormField}
          onBlurCapture={resetEnterNavigationState}
          onSubmit={async (event) => {
            event.preventDefault();
            setTermSaving(true);
            setTermError("");
            setTermSuccess("");

            try {
              const isEditing = editingTermId !== null;
              const payload = {
                label: termForm.label.trim(),
                start_year: Number(termForm.start_year),
                end_year: Number(termForm.end_year),
                display_order: Number(termForm.display_order || 0),
                is_current: termForm.is_current,
                is_active: termForm.is_active,
              };

              const response = await fetch(
                editingTermId
                  ? `${API_BASE_URL}/member-terms/${editingTermId}/`
                  : `${API_BASE_URL}/member-terms/`,
                {
                  method: editingTermId ? "PATCH" : "POST",
                  headers: {
                    ...(await getAuthHeaders()),
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(payload),
                },
              );

              const rawText = await response.text();
              const data = parseApiPayload(rawText);
              if (!response.ok) {
                throw new Error(
                  getApiErrorMessage(data, `Unable to save member term. (${response.status})`),
                );
              }

              await loadTerms();
              resetTermForm();
              if (isEditing) {
                setTermFormOpen(false);
              } else {
                setTermFormOpen(true);
                requestAnimationFrame(() => focusFirstFormField(termFormRef.current));
              }
              setTermSuccess(isEditing ? "Term updated." : "Term added.");
            } catch (requestError) {
              setTermError(
                requestError instanceof Error ? requestError.message : "Unable to save member term.",
              );
            } finally {
              setTermSaving(false);
            }
          }}
        >
          <div className="mx-auto max-w-[58rem]">
            <div className="mx-auto grid w-full justify-center gap-3 md:grid-cols-2 md:gap-x-8">
              <label className="admin-master-label w-full max-w-[25rem]">
                <span>Term Label</span>
                <input
                  type="text"
                  value={termForm.label}
                  onChange={(event) =>
                    setTermForm((current) => ({
                      ...current,
                      label: toTitleCase(event.target.value),
                    }))
                  }
                  className="admin-master-input"
                  placeholder="2025-2027 Working Committee"
                />
              </label>
              <label className="admin-master-label w-full max-w-[25rem]">
                <span>Display Order</span>
                <input
                  type="number"
                  min="0"
                  value={termForm.display_order}
                  onChange={(event) =>
                    setTermForm((current) => ({ ...current, display_order: event.target.value }))
                  }
                  className="admin-master-input"
                  required
                />
              </label>
              <label className="admin-master-label w-full max-w-[25rem]">
                <span>Start Year</span>
                <input
                  type="number"
                  min="2000"
                  value={termForm.start_year}
                  onChange={(event) =>
                    setTermForm((current) => ({ ...current, start_year: event.target.value }))
                  }
                  className="admin-master-input"
                  required
                />
              </label>
              <label className="admin-master-label w-full max-w-[25rem]">
                <span>End Year</span>
                <input
                  type="number"
                  min="2000"
                  value={termForm.end_year}
                  onChange={(event) =>
                    setTermForm((current) => ({ ...current, end_year: event.target.value }))
                  }
                  className="admin-master-input"
                  required
                />
              </label>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-4">
              <label className="inline-flex items-center gap-2 text-[0.62rem] font-medium uppercase tracking-[0.08em] text-slate-700">
                <input
                  type="checkbox"
                  checked={termForm.is_current}
                  onChange={(event) =>
                    setTermForm((current) => ({ ...current, is_current: event.target.checked }))
                  }
                />
                Current
              </label>
              <label className="inline-flex items-center gap-2 text-[0.62rem] font-medium uppercase tracking-[0.08em] text-slate-700">
                <input
                  type="checkbox"
                  checked={termForm.is_active}
                  onChange={(event) =>
                    setTermForm((current) => ({ ...current, is_active: event.target.checked }))
                  }
                />
                Active
              </label>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={termSaving}
                className="admin-master-btn admin-master-btn-primary"
              >
                {termSaving ? "Saving..." : "Save"}
              </button>
            </div>
            {termError ? (
              <p className="mt-2 text-right text-[0.72rem] font-medium text-rose-700">
                {termError}
              </p>
            ) : null}
            {termSuccess ? (
              <p className="mt-2 text-right text-[0.72rem] font-medium text-emerald-700">
                {termSuccess}
              </p>
            ) : null}
          </div>
        </form>
      ) : null}

      {showTermsSection ? (
      <section className="admin-card rounded-[1.2rem] p-5 md:p-6">
        <div className="overflow-x-auto">
          <table className="admin-master-table min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left">
                <th>Term</th>
                <th>Years</th>
                <th>Members</th>
                <th>Current</th>
                <th>Status</th>
                <th>Order</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {termLoading ? (
                <tr>
                  <td colSpan={7} className="rounded-[0.9rem] bg-slate-50 px-3 py-3 text-sm text-slate-500">
                    Loading member terms...
                  </td>
                </tr>
              ) : terms.length ? (
                terms.map((term) => (
                  <tr key={term.id}>
                    <td className="rounded-l-[0.9rem] bg-slate-50/90 px-3 py-1.5 text-sm text-slate-700">
                      {term.label}
                    </td>
                    <td className="bg-slate-50/90 px-3 py-1.5 text-sm text-slate-600">
                      {term.start_year}-{term.end_year}
                    </td>
                    <td className="bg-slate-50/90 px-3 py-1.5 text-sm text-slate-600">
                      {term.member_count ?? 0}
                    </td>
                    <td className="bg-slate-50/90 px-3 py-1.5 text-sm">
                      <span className={`admin-badge ${term.is_current ? "admin-badge-active" : "admin-badge-inactive"}`}>
                        {term.is_current ? "Current" : "Archive"}
                      </span>
                    </td>
                    <td className="bg-slate-50/90 px-3 py-1.5 text-sm">
                      <span className={`admin-badge ${term.is_active ? "admin-badge-active" : "admin-badge-inactive"}`}>
                        {term.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="bg-slate-50/90 px-3 py-1.5 text-sm text-slate-600">{term.display_order}</td>
                    <td className="rounded-r-[0.9rem] bg-slate-50/90 px-3 py-1.5 text-right">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setSelectedTermId(term.id ?? null)} className="admin-table-btn admin-table-btn-edit">
                          Use
                        </button>
                        {!term.is_current ? (
                          <button
                            type="button"
                            onClick={async () => {
                              setTermError("");
                              setTermSuccess("");
                              try {
                                const response = await fetch(`${API_BASE_URL}/member-terms/${term.id}/activate/`, {
                                  method: "POST",
                                  headers: await getAuthHeaders(),
                                });
                                if (!response.ok) {
                                  throw new Error("Unable to activate term.");
                                }
                                await loadTerms();
                                setTermSuccess("Current term updated.");
                              } catch (requestError) {
                                setTermError(
                                  requestError instanceof Error ? requestError.message : "Unable to activate term.",
                                );
                              }
                            }}
                            className="admin-table-btn admin-table-btn-edit"
                          >
                            Current
                          </button>
                        ) : null}
                        <button type="button" onClick={() => openEditTermForm(term)} className="admin-table-btn admin-table-btn-edit">
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            setTermError("");
                            setTermSuccess("");
                            try {
                              const response = await fetch(`${API_BASE_URL}/member-terms/${term.id}/`, {
                                method: "DELETE",
                                headers: await getAuthHeaders(),
                              });
                              if (!response.ok) {
                                throw new Error("Unable to delete member term.");
                              }
                              if (selectedTermId === term.id) {
                                setSelectedTermId(null);
                              }
                              await loadTerms();
                              setTermSuccess("Term deleted.");
                            } catch (requestError) {
                              setTermError(
                                requestError instanceof Error ? requestError.message : "Unable to delete member term.",
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
                  <td colSpan={7} className="rounded-[0.9rem] bg-slate-50 px-3 py-3 text-sm text-slate-500">
                    No term found yet. Use the Add Term button to create one first.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      ) : null}

      {showMembersSection ? (
      <div className="admin-master-panel px-6 py-5 md:px-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[1rem] font-semibold uppercase tracking-[0.08em] text-primary">
              Members
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {selectedTerm
                ? `Creating and listing records for ${selectedTerm.label}.`
                : "Create a term first, then register members under that term."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="admin-master-label w-full min-w-[14rem] max-w-[18rem]">
              <span>Active Term</span>
              <div className="relative">
                <select
                  value={selectedTermId ?? ""}
                  onChange={(event) => setSelectedTermId(Number(event.target.value) || null)}
                  className="admin-master-input appearance-none pr-14"
                  disabled={!terms.length}
                >
                  <option value="">Select Term</option>
                  {terms.map((term) => (
                    <option key={term.id} value={term.id}>
                      {term.label}
                    </option>
                  ))}
                </select>
                <span className="admin-select-arrow pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-500" />
              </div>
            </label>
            <button
              type="button"
              onClick={() => {
                if (formOpen && editingId === null) {
                  setFormOpen(false);
                  return;
                }
                openCreateMemberForm();
              }}
              className="admin-master-btn admin-master-btn-primary"
              disabled={!selectedTermId}
            >
              {formOpen && editingId === null ? "Close Form" : "Add Member"}
            </button>
          </div>
        </div>
      </div>
      ) : null}

      {showMembersSection && !formOpen && error ? (
        <div className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      {showMembersSection && !formOpen && success ? (
        <div className="rounded-[1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {success}
        </div>
      ) : null}

      {showMembersSection && formOpen ? (
        <form
          ref={formRef}
          className="rounded-[1.2rem] border border-[rgba(39,60,117,0.12)] bg-[linear-gradient(180deg,#dbe7ff_0%,#c9d9fb_100%)] p-4 shadow-[0_18px_40px_rgba(18,31,69,0.06)] md:p-5"
          onKeyDown={moveToNextFormField}
          onBlurCapture={resetEnterNavigationState}
          onSubmit={async (event) => {
            event.preventDefault();
            setSaving(true);
            setError("");
            setSuccess("");

            try {
              const isEditing = editingId !== null;
              if (!form.term) {
                throw new Error("Select a term before saving the member.");
              }
              if (form.phone.length !== 10) {
                setPhoneError("Enter exactly 10 digits after +977.");
                throw new Error("Enter exactly 10 digits after +977.");
              }

              const payload = new FormData();
              payload.append("term", form.term);
              payload.append("name", form.name);
              payload.append("category", form.category);
              payload.append("role", form.role);
              payload.append("phone", `${NEPAL_COUNTRY_CODE}-${form.phone}`);
              payload.append("email", form.email);
              payload.append("note", form.note);
              payload.append("display_order", form.display_order || "0");
              payload.append("is_active", String(form.is_active));

              if (photoFile) {
                payload.append("photo", photoFile);
              }
              if (photoMarkedForRemoval && !photoFile) {
                payload.append("photo_clear", "1");
              }

              const response = await fetch(
                editingId ? `${API_BASE_URL}/members/${editingId}/` : `${API_BASE_URL}/members/`,
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
                  getApiErrorMessage(data, `Unable to save member record. (${response.status})`),
                );
              }

              await loadMembers(Number(form.term));
              resetMemberForm();
              if (isEditing) {
                setFormOpen(false);
              } else {
                setFormOpen(true);
                requestAnimationFrame(() => focusFirstFormField(formRef.current));
              }
              setSuccess(isEditing ? "Member record updated." : "Member record added.");
            } catch (requestError) {
              setError(
                requestError instanceof Error ? requestError.message : "Unable to save member record.",
              );
            } finally {
              setSaving(false);
            }
          }}
        >
          <div className="mx-auto max-w-[58rem]">
            <div className="mx-auto grid w-full justify-center gap-3 md:grid-cols-2 md:gap-x-8">
              <label className="admin-master-label w-full max-w-[25rem]">
                <span>Term</span>
                <div className="relative">
                  <select
                    value={form.term}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, term: event.target.value }))
                    }
                    className="admin-master-input appearance-none pr-14"
                    required
                  >
                    <option value="">Select Term</option>
                    {terms.map((term) => (
                      <option key={term.id} value={term.id}>
                        {term.label}
                      </option>
                    ))}
                  </select>
                  <span className="admin-select-arrow pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-500" />
                </div>
              </label>
              <label className="admin-master-label w-full max-w-[25rem]">
                <span>Section</span>
                <div className="relative">
                  <select
                    value={form.category}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, category: event.target.value }))
                    }
                    className="admin-master-input appearance-none pr-14"
                    required
                  >
                    {categoryOptions.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  <span className="admin-select-arrow pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-500" />
                </div>
              </label>
              <label className="admin-master-label w-full max-w-[25rem]">
                <span>Name</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: toTitleCase(event.target.value) }))
                  }
                  className="admin-master-input"
                  required
                />
              </label>
              <label className="admin-master-label w-full max-w-[25rem]">
                <span>Role</span>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <select
                      value={form.role}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, role: event.target.value }))
                      }
                      className="admin-master-input appearance-none pr-14"
                      required
                    >
                      <option value="">Select Role</option>
                      {roleOptions.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                    <span className="admin-select-arrow pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-500" />
                  </div>
                  <button
                    type="button"
                    onClick={addRoleOption}
                    className="admin-master-btn admin-master-btn-primary min-h-[1.8rem] w-[1.8rem] shrink-0 px-0 py-0 text-[0.82rem] font-medium"
                    aria-label="Add role"
                  >
                    +
                  </button>
                </div>
              </label>
              <label className="admin-master-label w-full max-w-[25rem]">
                <span>Phone</span>
                <div className="flex items-center overflow-hidden rounded-[0.9rem] border border-[rgba(39,60,117,0.12)] bg-white">
                  <span className="flex min-h-[1.8rem] items-center border-r border-[rgba(39,60,117,0.1)] px-3 leading-none">
                    <NepalFlagIcon className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    value={form.phone}
                    onChange={(event) => {
                      const digitsOnly = event.target.value.replace(/\D/g, "");
                      if (digitsOnly.length > 10) {
                        setPhoneError("Only 10 digits are allowed after +977.");
                        return;
                      }
                      setPhoneError(
                        digitsOnly.length > 0 && digitsOnly.length < 10
                          ? "Enter exactly 10 digits after +977."
                          : "",
                      );
                      setForm((current) => ({ ...current, phone: digitsOnly }));
                    }}
                    className="admin-master-input rounded-none border-0 shadow-none focus:shadow-none"
                    required
                  />
                </div>
                {phoneError ? (
                  <p className="mt-1 text-[0.68rem] font-medium text-rose-700">{phoneError}</p>
                ) : null}
              </label>
              <label className="admin-master-label w-full max-w-[25rem]">
                <span>Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, email: event.target.value }))
                  }
                  className="admin-master-input"
                  required
                />
              </label>
              <label className="admin-master-label w-full max-w-[25rem]">
                <span>Display Order</span>
                <input
                  type="number"
                  min="0"
                  value={form.display_order}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, display_order: event.target.value }))
                  }
                  className="admin-master-input"
                  required
                />
              </label>
              <label className="admin-master-label w-full max-w-[25rem] md:col-span-2">
                <span>Note</span>
                <input
                  type="text"
                  value={form.note}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, note: event.target.value }))
                  }
                  className="admin-master-input"
                />
              </label>
              <label className="admin-master-label w-full max-w-[25rem] md:col-span-2">
                <span>Photo</span>
                <div className="flex min-h-[4rem] w-[52%] min-w-[12.5rem] items-center justify-between gap-3 rounded-[1rem] border border-dashed border-[rgba(39,60,117,0.18)] bg-white/80 px-3 py-2">
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      setPhotoFile(event.target.files?.[0] ?? null);
                      setPhotoMarkedForRemoval(false);
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    onKeyDown={preventMouseOnlyUploadKeyboard}
                    className="admin-master-btn admin-master-btn-secondary min-h-[1.65rem] min-w-[5.2rem] px-2 py-1 text-[0.62rem] font-medium"
                    style={{ fontSize: "0.62rem", fontWeight: 500 }}
                  >
                    Upload Photo
                  </button>
                  {resolvedPreviewPhotoSrc ? (
                    <div className="group relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      <img
                        src={resolvedPreviewPhotoSrc}
                        alt="Member preview"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoFile(null);
                          setPhotoPreviewUrl("");
                          setPhotoMarkedForRemoval(true);
                          if (photoInputRef.current) {
                            photoInputRef.current.value = "";
                          }
                        }}
                        className="absolute inset-0 flex items-center justify-center bg-[#091224]/0 text-base font-semibold text-white opacity-0 transition group-hover:bg-[#091224]/70 group-hover:opacity-100"
                        aria-label="Remove member photo"
                      >
                        x
                      </button>
                    </div>
                  ) : null}
                </div>
              </label>
            </div>

            <label className="mt-3 inline-flex items-center gap-2 text-[0.62rem] font-medium uppercase tracking-[0.08em] text-slate-700">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) =>
                  setForm((current) => ({ ...current, is_active: event.target.checked }))
                }
              />
              Active
            </label>

            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="admin-master-btn admin-master-btn-primary"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
            {error ? (
              <p className="mt-2 text-right text-[0.72rem] font-medium text-rose-700">
                {error}
              </p>
            ) : null}
            {success ? (
              <p className="mt-2 text-right text-[0.72rem] font-medium text-emerald-700">
                {success}
              </p>
            ) : null}
          </div>
        </form>
      ) : null}

      {showMembersSection ? (
      <section className="admin-card rounded-[1.2rem] p-5 md:p-6">
        <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <label className="block w-full max-w-md">
            <span className="mb-2 block text-[0.68rem] font-medium uppercase tracking-[0.08em] text-slate-700">
              Search Members
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name, section, role, email, or term"
              className="admin-master-input"
            />
          </label>
          {selectedTerm ? (
            <div className="rounded-[0.9rem] border border-[rgba(39,60,117,0.12)] bg-slate-50 px-4 py-2 text-sm text-slate-700">
              Showing: <span className="font-semibold text-primary">{selectedTerm.label}</span>
            </div>
          ) : null}
        </div>
        <div className="overflow-x-auto">
          <table className="admin-master-table min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left">
                <th>Photo</th>
                <th>Name</th>
                <th>Term</th>
                <th>Section</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Order</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="rounded-[0.9rem] bg-slate-50 px-3 py-3 text-sm text-slate-500">
                    Loading member records...
                  </td>
                </tr>
              ) : filteredItems.length ? (
                filteredItems.map((item) => (
                  <tr key={item.id ?? item.email}>
                    <td className="rounded-l-[0.9rem] bg-slate-50/90 px-3 py-1.5 text-slate-700">
                      {item.photo_src ? (
                        <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-200">
                          <img src={resolveMemberPhotoSrc(item.photo_src)} alt={item.name} className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-[10px] font-medium text-slate-500">
                          Img
                        </div>
                      )}
                    </td>
                    <td className="bg-slate-50/90 px-3 py-1.5 text-sm text-slate-700">{item.name}</td>
                    <td className="bg-slate-50/90 px-3 py-1.5 text-sm text-slate-600">{item.term_label}</td>
                    <td className="bg-slate-50/90 px-3 py-1.5 text-sm text-slate-600">{item.category_label || item.category}</td>
                    <td className="bg-slate-50/90 px-3 py-1.5 text-sm text-slate-600">{item.role}</td>
                    <td className="bg-slate-50/90 px-3 py-1.5 text-sm text-slate-600">{formatNepalPhone(item.phone)}</td>
                    <td className="bg-slate-50/90 px-3 py-1.5 text-sm text-slate-600">{item.email}</td>
                    <td className="bg-slate-50/90 px-3 py-1.5 text-sm text-slate-600">{item.display_order}</td>
                    <td className="bg-slate-50/90 px-3 py-1.5 text-sm">
                      <span className={`admin-badge ${item.is_active ? "admin-badge-active" : "admin-badge-inactive"}`}>
                        {item.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="rounded-r-[0.9rem] bg-slate-50/90 px-3 py-1.5 text-right">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => openEditForm(item)} className="admin-table-btn admin-table-btn-edit">
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            setError("");
                            setSuccess("");
                            try {
                              const response = await fetch(`${API_BASE_URL}/members/${item.id}/`, {
                                method: "DELETE",
                                headers: await getAuthHeaders(),
                              });
                              if (!response.ok) {
                                throw new Error("Unable to delete member record.");
                              }
                              if (editingId === item.id) {
                                resetMemberForm();
                                setFormOpen(false);
                              }
                              await loadMembers(selectedTermId);
                              setSuccess("Member record deleted.");
                            } catch (requestError) {
                              setError(
                                requestError instanceof Error ? requestError.message : "Unable to delete member record.",
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
                  <td colSpan={10} className="rounded-[0.9rem] bg-slate-50 px-3 py-3 text-sm text-slate-500">
                    {selectedTerm
                      ? items.length
                        ? "No member record matched your search."
                        : "No member record found for this term yet. Use the Add Member button to create one."
                      : "Create or select a term first."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      ) : null}
    </section>
  );
}

