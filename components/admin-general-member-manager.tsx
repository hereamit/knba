"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminFormModal } from "@/components/admin-form-modal";
import { AdminSavedModal } from "@/components/admin-saved-modal";
import { AdminIconButton } from "@/components/admin-table-icons";
import { NepalFlagIcon } from "@/components/nepal-flag-icon";
import { API_BASE_URL, getValidAdminAccessToken } from "@/lib/api";
import {
  moveToNextFormField,
  resetEnterNavigationState,
} from "@/lib/enter-navigation";

type GeneralMemberRecord = {
  id?: number;
  business_name: string;
  contact_person: string;
  category: string;
  phone: string;
  email: string;
  office_address: string;
  joined_date: string;
  note: string;
  is_active: boolean;
};

type GeneralMemberFormState = Omit<GeneralMemberRecord, "id">;

const emptyForm: GeneralMemberFormState = {
  business_name: "",
  contact_person: "",
  category: "",
  phone: "",
  email: "",
  office_address: "",
  joined_date: "",
  note: "",
  is_active: true,
};

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

export function AdminGeneralMemberManager() {
  const [items, setItems] = useState<GeneralMemberRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState<GeneralMemberFormState>(emptyForm);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const formRef = useRef<HTMLFormElement | null>(null);

  const filteredItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return items;
    }
    return items.filter((item) =>
      [item.business_name, item.contact_person, item.category, item.phone, item.email]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [items, searchQuery]);

  const persistCategories = useCallback((nextCategories: string[]) => {
    setCategoryOptions(nextCategories);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("knba_general_member_categories", JSON.stringify(nextCategories));
    }
  }, []);

  const syncCategoriesFromItems = useCallback(
    (records: GeneralMemberRecord[]) => {
      const itemCategories = records.map((item) => item.category.trim()).filter(Boolean);
      const savedCategories =
        typeof window !== "undefined"
          ? JSON.parse(window.localStorage.getItem("knba_general_member_categories") ?? "[]")
          : [];
      const mergedCategories = [...new Set([...savedCategories, ...itemCategories])].sort();
      persistCategories(mergedCategories);
    },
    [persistCategories],
  );

  const loadItems = useCallback(async () => {
    const response = await fetch(`${API_BASE_URL}/general-members/`, {
      headers: await getAuthHeaders(),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Unable to load general members.");
    }

    const data = (await response.json()) as GeneralMemberRecord[];
    setItems(data);
    syncCategoriesFromItems(data);
  }, [syncCategoriesFromItems]);

  useEffect(() => {
    let isCancelled = false;
    const run = async () => {
      try {
        if (!isCancelled && typeof window !== "undefined") {
          const storedCategories = JSON.parse(
            window.localStorage.getItem("knba_general_member_categories") ?? "[]",
          );
          if (Array.isArray(storedCategories) && storedCategories.length) {
            setCategoryOptions(
              storedCategories.filter((item): item is string => typeof item === "string"),
            );
          }
        }
        await loadItems();
      } catch (requestError) {
        if (!isCancelled) {
          setError(
            requestError instanceof Error ? requestError.message : "Unable to load general members.",
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
    setPhoneError("");
  };

  const openCreateForm = () => {
    resetForm();
    setError("");
    setSuccess("");
    setFormOpen(true);
  };

  const openEditForm = (item: GeneralMemberRecord) => {
    setForm({
      business_name: item.business_name,
      contact_person: item.contact_person,
      category: item.category,
      phone: getLocalNepalPhone(item.phone),
      email: item.email,
      office_address: item.office_address,
      joined_date: item.joined_date || "",
      note: item.note,
      is_active: item.is_active,
    });
    setEditingId(item.id ?? null);
    setPhoneError("");
    setError("");
    setSuccess("");
    setFormOpen(true);
  };

  return (
    <section className="space-y-5">
      <div className="admin-master-panel px-6 py-5 md:px-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2 className="text-[1rem] font-semibold uppercase tracking-[0.08em] text-primary">
            General Members
          </h2>
          <button
            type="button"
            onClick={openCreateForm}
            className="admin-master-btn admin-master-btn-primary"
          >
            Add General Member
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
        <AdminFormModal
          title={editingId ? "Edit General Member" : "Add General Member"}
          onClose={() => {
            setFormOpen(false);
            resetForm();
          }}
        >
        <form
          ref={formRef}
          onKeyDown={moveToNextFormField}
          onBlurCapture={resetEnterNavigationState}
          onSubmit={async (event) => {
            event.preventDefault();
            setSaving(true);
            setError("");
            setSuccess("");

            try {
              if (form.phone.length !== 10) {
                setPhoneError("Enter exactly 10 digits after +977.");
                throw new Error("Enter exactly 10 digits after +977.");
              }

              const payload = {
                business_name: form.business_name,
                contact_person: form.contact_person,
                category: form.category,
                phone: `${NEPAL_COUNTRY_CODE}-${form.phone}`,
                email: form.email,
                office_address: form.office_address,
                joined_date: form.joined_date || null,
                note: form.note,
                is_active: form.is_active,
              };

              const response = await fetch(
                editingId
                  ? `${API_BASE_URL}/general-members/${editingId}/`
                  : `${API_BASE_URL}/general-members/`,
                {
                  method: editingId ? "PATCH" : "POST",
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
                  getApiErrorMessage(data, `Unable to save general member. (${response.status})`),
                );
              }

              await loadItems();
              const isEditing = editingId !== null;
              resetForm();
              setFormOpen(false);
              const savedText = isEditing
                ? "General member updated."
                : "General member added.";
              setSuccess(savedText);
              setSavedMessage(savedText);
            } catch (requestError) {
              setError(
                requestError instanceof Error ? requestError.message : "Unable to save general member.",
              );
            } finally {
              setSaving(false);
            }
          }}
        >
          <div className="mx-auto max-w-[58rem]">
            <div className="mx-auto grid w-full justify-center gap-3 md:grid-cols-2 md:gap-x-8">
              <label className="admin-master-label w-full max-w-[25rem]">
                <span>Business Name</span>
                <input
                  type="text"
                  value={form.business_name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      business_name: toTitleCase(event.target.value),
                    }))
                  }
                  className="admin-master-input"
                  required
                />
              </label>
              <label className="admin-master-label w-full max-w-[25rem]">
                <span>Contact Person</span>
                <input
                  type="text"
                  value={form.contact_person}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      contact_person: toTitleCase(event.target.value),
                    }))
                  }
                  className="admin-master-input"
                  required
                />
              </label>
              <label className="admin-master-label w-full max-w-[25rem]">
                <span>Category</span>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <select
                      value={form.category}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, category: event.target.value }))
                      }
                      className="admin-master-input appearance-none pr-14"
                    >
                      <option value="">Select Category</option>
                      {categoryOptions.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-5 flex items-center text-[1.15rem] text-slate-500">
                      ▾
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextCategory = window.prompt("Add general member category");
                      const normalizedCategory = toTitleCase((nextCategory ?? "").trim());
                      if (!normalizedCategory) {
                        return;
                      }
                      const mergedCategories = [...new Set([...categoryOptions, normalizedCategory])].sort();
                      persistCategories(mergedCategories);
                      setForm((current) => ({ ...current, category: normalizedCategory }));
                    }}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-white shadow-[0_10px_24px_rgba(39,60,117,0.2)] transition hover:bg-primary-soft"
                    aria-label="Add category"
                  >
                    +
                  </button>
                </div>
              </label>
              <label className="admin-master-label w-full max-w-[25rem]">
                <span>Joined Date</span>
                <input
                  type="date"
                  value={form.joined_date}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, joined_date: event.target.value }))
                  }
                  className="admin-master-input"
                />
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
                />
              </label>
              <label className="admin-master-label w-full max-w-[25rem] md:col-span-2">
                <span>Office Address</span>
                <input
                  type="text"
                  value={form.office_address}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      office_address: toTitleCase(event.target.value),
                    }))
                  }
                  className="admin-master-input"
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
              <button type="submit" disabled={saving} className="admin-master-btn admin-master-btn-primary">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
            {error ? <p className="mt-2 text-right text-[0.72rem] font-medium text-rose-700">{error}</p> : null}
            {success ? <p className="mt-2 text-right text-[0.72rem] font-medium text-emerald-700">{success}</p> : null}
          </div>
        </form>
        </AdminFormModal>
      ) : null}

      <section className="admin-card rounded-[1.2rem] p-5 md:p-6">
        <div className="mb-4 flex justify-end">
          <label className="block w-full max-w-md">
            <span className="mb-2 block text-[0.68rem] font-medium uppercase tracking-[0.08em] text-slate-700">
              Search General Members
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by business, contact, category, phone, or email"
              className="admin-master-input"
            />
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-master-table min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left">
                <th>Business</th>
                <th>Contact</th>
                <th>Category</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Joined</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="rounded-[0.9rem] bg-slate-50 px-3 py-3 text-sm text-slate-500">
                    Loading general members...
                  </td>
                </tr>
              ) : filteredItems.length ? (
                filteredItems.map((item) => (
                  <tr key={item.id ?? `${item.business_name}-${item.phone}`}>
                    <td className="rounded-l-[0.9rem] bg-slate-50/90 px-3 py-1.5 text-sm text-slate-700">{item.business_name}</td>
                    <td className="bg-slate-50/90 px-3 py-1.5 text-sm text-slate-600">{item.contact_person}</td>
                    <td className="bg-slate-50/90 px-3 py-1.5 text-sm text-slate-600">{item.category || "-"}</td>
                    <td className="bg-slate-50/90 px-3 py-1.5 text-sm text-slate-600">{formatNepalPhone(item.phone)}</td>
                    <td className="bg-slate-50/90 px-3 py-1.5 text-sm text-slate-600">{item.email || "-"}</td>
                    <td className="bg-slate-50/90 px-3 py-1.5 text-sm text-slate-600">{item.joined_date || "-"}</td>
                    <td className="bg-slate-50/90 px-3 py-1.5 text-sm">
                      <span className={`admin-badge ${item.is_active ? "admin-badge-active" : "admin-badge-inactive"}`}>
                        {item.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="rounded-r-[0.9rem] bg-slate-50/90 px-3 py-1.5 text-right">
                      <div className="flex justify-end gap-2">
                        <AdminIconButton
                          variant="edit"
                          onClick={() => openEditForm(item)}
                          label="Edit general member"
                        />
                        <AdminIconButton
                          variant="delete"
                          label="Delete general member"
                          onClick={async () => {
                            setError("");
                            setSuccess("");
                            try {
                              const response = await fetch(`${API_BASE_URL}/general-members/${item.id}/`, {
                                method: "DELETE",
                                headers: await getAuthHeaders(),
                              });
                              if (!response.ok) {
                                throw new Error("Unable to delete general member.");
                              }
                              if (editingId === item.id) {
                                resetForm();
                                setFormOpen(false);
                              }
                              await loadItems();
                              setSuccess("General member deleted.");
                            } catch (requestError) {
                              setError(
                                requestError instanceof Error
                                  ? requestError.message
                                  : "Unable to delete general member.",
                              );
                            }
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="rounded-[0.9rem] bg-slate-50 px-3 py-3 text-sm text-slate-500">
                    {items.length
                      ? "No general member matched your search."
                      : "No general member found yet. Use the Add General Member button to create one."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {savedMessage ? (
        <AdminSavedModal message={savedMessage} onClose={() => setSavedMessage("")} />
      ) : null}
    </section>
  );
}
