"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { API_BASE_URL, MEDIA_BASE_URL, getValidAdminAccessToken } from "@/lib/api";
import { PhoneNumbersInput } from "@/components/phone-numbers-input";
import {
  ensurePhoneEntries,
  parsePhoneEntries,
  summarizePhoneEntries,
  type PhoneEntry,
} from "@/lib/phone";
import {
  focusFirstFormField,
  moveToNextFormField,
  preventMouseOnlyUploadKeyboard,
  resetEnterNavigationState,
} from "@/lib/enter-navigation";

type BusinessShowcaseRecord = {
  id?: number;
  name: string;
  category: string;
  description: string;
  phone: string;
  address: string;
  image?: string | null;
  image_url?: string;
  image_src: string;
  badge: string;
  website_url: string;
  facebook_url: string;
  instagram_url: string;
  ecommerce_url: string;
  is_featured: boolean;
  display_order: number;
  is_active: boolean;
  created_at?: string;
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
  image?: string | null;
  image_url?: string;
  image_src: string;
  badge: string;
  website_url: string;
  facebook_url: string;
  instagram_url: string;
  ecommerce_url: string;
  is_featured: boolean;
  display_order: number;
  review_status: string;
  admin_notes: string;
  reviewed_at?: string | null;
  published_item?: number | null;
  created_at: string;
};

type BusinessShowcaseFormState = {
  name: string;
  category: string;
  description: string;
  phoneEntries: PhoneEntry[];
  address: string;
  badge: string;
  website_url: string;
  facebook_url: string;
  instagram_url: string;
  ecommerce_url: string;
  is_featured: boolean;
  display_order: string;
  is_active: boolean;
};

function createEmptyForm(): BusinessShowcaseFormState {
  return {
    name: "",
    category: "",
    description: "",
    phoneEntries: ensurePhoneEntries([]),
    address: "",
    badge: "Business Showcase",
    website_url: "",
    facebook_url: "",
    instagram_url: "",
    ecommerce_url: "",
    is_featured: false,
    display_order: "1",
    is_active: true,
  };
}

const badgeOptions = ["Featured Sponsor", "Member Business", "Business Showcase"];

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

function toTitleCase(value: string) {
  return value.replace(/\b([a-z])/g, (match) => match.toUpperCase());
}

function resolveBusinessImageSrc(src: string) {
  if (!src) {
    return "";
  }

  if (/^(https?:|blob:|data:)/i.test(src) || src.startsWith("/")) {
    return src;
  }

  return `${MEDIA_BASE_URL}${src.startsWith("/") ? src : `/${src}`}`;
}

function normalizeBusinessShowcaseRecord(record: Partial<BusinessShowcaseRecord>) {
  const resolvedImageSource =
    record.image_src ??
    record.image_url ??
    (typeof record.image === "string" ? record.image : "");

  return {
    id: record.id,
    name: record.name ?? "Business Listing",
    category: record.category ?? "General",
    description: record.description ?? "",
    phone: record.phone ?? "",
    address: record.address ?? "",
    image: record.image ?? null,
    image_url: record.image_url ?? "",
    image_src: resolvedImageSource,
    badge: record.badge ?? "Business Showcase",
    website_url: record.website_url ?? "",
    facebook_url: record.facebook_url ?? "",
    instagram_url: record.instagram_url ?? "",
    ecommerce_url: record.ecommerce_url ?? "",
    is_featured: Boolean(record.is_featured),
    display_order: record.display_order ?? 0,
    is_active: record.is_active ?? true,
    created_at: record.created_at ?? "",
  } satisfies BusinessShowcaseRecord;
}

function normalizeBusinessShowcaseSubmissionRecord(
  record: Partial<BusinessShowcaseSubmissionRecord>,
) {
  const resolvedImageSource =
    record.image_src ??
    record.image_url ??
    (typeof record.image === "string" ? record.image : "");

  return {
    id: record.id ?? 0,
    submitter_name: record.submitter_name ?? "",
    submitter_email: record.submitter_email ?? "",
    name: record.name ?? "Business Submission",
    category: record.category ?? "General",
    description: record.description ?? "",
    phone: record.phone ?? "",
    address: record.address ?? "",
    image: record.image ?? null,
    image_url: record.image_url ?? "",
    image_src: resolvedImageSource,
    badge: record.badge ?? "Business Showcase",
    website_url: record.website_url ?? "",
    facebook_url: record.facebook_url ?? "",
    instagram_url: record.instagram_url ?? "",
    ecommerce_url: record.ecommerce_url ?? "",
    is_featured: Boolean(record.is_featured),
    display_order: record.display_order ?? 0,
    review_status: record.review_status ?? "pending",
    admin_notes: record.admin_notes ?? "",
    reviewed_at: record.reviewed_at ?? null,
    published_item: record.published_item ?? null,
    created_at: record.created_at ?? "",
  } satisfies BusinessShowcaseSubmissionRecord;
}

function formatSubmissionDate(value: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export function AdminBusinessShowcaseManager() {
  const [items, setItems] = useState<BusinessShowcaseRecord[]>([]);
  const [submissions, setSubmissions] = useState<BusinessShowcaseSubmissionRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState<BusinessShowcaseFormState>(createEmptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [imageMarkedForRemoval, setImageMarkedForRemoval] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submissionLoading, setSubmissionLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingSubmissionId, setProcessingSubmissionId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [submissionError, setSubmissionError] = useState("");
  const [success, setSuccess] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const formRef = useRef<HTMLFormElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const editingItem = editingId
    ? items.find((item) => item.id === editingId) ?? null
    : null;
  const imageDisplayUrl =
    !imageMarkedForRemoval && (imagePreviewUrl || editingItem?.image_src || "");
  const resolvedPreviewImageSrc = imageDisplayUrl
    ? resolveBusinessImageSrc(imageDisplayUrl)
    : "";
  const filteredItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const sortedItems = [...items].sort(
      (left, right) =>
        new Date(right.created_at ?? "").getTime() - new Date(left.created_at ?? "").getTime(),
    );

    if (!normalizedQuery) {
      return sortedItems;
    }

    return sortedItems.filter((item) =>
      [item.name, item.category, item.badge].join(" ").toLowerCase().includes(normalizedQuery),
    );
  }, [items, searchQuery]);

  const persistCategories = useCallback((nextCategories: string[]) => {
    setCategoryOptions(nextCategories);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "knba_business_showcase_categories",
        JSON.stringify(nextCategories),
      );
    }
  }, []);

  const syncCategoriesFromItems = useCallback(
    (records: BusinessShowcaseRecord[]) => {
      const recordCategories = records.map((item) => item.category.trim()).filter(Boolean);
      const savedCategories =
        typeof window !== "undefined"
          ? JSON.parse(
              window.localStorage.getItem("knba_business_showcase_categories") ?? "[]",
            )
          : [];
      const mergedCategories = [...new Set([...savedCategories, ...recordCategories])].sort();
      persistCategories(mergedCategories);
    },
    [persistCategories],
  );

  const getNextCategoryOrder = useCallback(
    (category: string) => {
      const normalizedCategory = category.trim().toLowerCase();
      if (!normalizedCategory) {
        return "1";
      }

      const highestOrder = items
        .filter((item) => item.category.trim().toLowerCase() === normalizedCategory)
        .reduce((maxValue, item) => Math.max(maxValue, item.display_order), 0);

      return String(highestOrder + 1);
    },
    [items],
  );

  const loadItems = useCallback(async () => {
    const response = await fetch(`${API_BASE_URL}/business-showcase/`, {
      headers: await getAuthHeaders(),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Unable to load business showcase items.");
    }

    const data = (await response.json()) as BusinessShowcaseRecord[];
    const normalizedItems = data.map(normalizeBusinessShowcaseRecord);
    setItems(normalizedItems);
    syncCategoriesFromItems(normalizedItems);
  }, [syncCategoriesFromItems]);

  const loadSubmissions = useCallback(async () => {
    const response = await fetch(`${API_BASE_URL}/business-showcase-submissions/?status=pending`, {
      headers: await getAuthHeaders(),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Unable to load pending business submissions.");
    }

    const data = (await response.json()) as BusinessShowcaseSubmissionRecord[];
    setSubmissions(data.map(normalizeBusinessShowcaseSubmissionRecord));
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const run = async () => {
      try {
        if (!isCancelled && typeof window !== "undefined") {
          const storedCategories = JSON.parse(
            window.localStorage.getItem("knba_business_showcase_categories") ?? "[]",
          );
          if (Array.isArray(storedCategories) && storedCategories.length) {
            setCategoryOptions(
              storedCategories.filter((item): item is string => typeof item === "string"),
            );
          }
        }
        if (!isCancelled) {
          await Promise.all([loadItems(), loadSubmissions()]);
        }
      } catch (requestError) {
        if (!isCancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load business showcase data.",
          );
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
          setSubmissionLoading(false);
        }
      }
    };

    void run();

    return () => {
      isCancelled = true;
    };
  }, [loadItems, loadSubmissions]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl("");
      return;
    }

    const nextUrl = URL.createObjectURL(imageFile);
    setImagePreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [imageFile]);

  useEffect(() => {
    if (!formOpen || editingId !== null) {
      return;
    }

    setForm((current) => ({
      ...current,
      display_order: getNextCategoryOrder(current.category),
    }));
  }, [editingId, form.category, formOpen, getNextCategoryOrder]);

  const resetForm = () => {
    setForm(createEmptyForm());
    setEditingId(null);
    setImageFile(null);
    setImageMarkedForRemoval(false);
    setPhoneError("");
  };

  const openCreateForm = () => {
    resetForm();
    setError("");
    setSuccess("");
    setFormOpen(true);
  };

  const openEditForm = (item: BusinessShowcaseRecord) => {
    setForm({
      name: item.name,
      category: item.category,
      description: item.description,
      phoneEntries: ensurePhoneEntries(parsePhoneEntries(item.phone)),
      address: item.address,
      badge: item.badge,
      website_url: item.website_url,
      facebook_url: item.facebook_url,
      instagram_url: item.instagram_url,
      ecommerce_url: item.ecommerce_url,
      is_featured: item.is_featured,
      display_order: String(item.display_order),
      is_active: item.is_active,
    });
    setEditingId(item.id ?? null);
    setImageFile(null);
    setImageMarkedForRemoval(false);
    setError("");
    setSuccess("");
    setPhoneError("");
    setFormOpen(true);
  };

  const addCategoryOption = () => {
    const promptedCategory =
      typeof window !== "undefined" ? window.prompt("Enter business category") : null;
    const nextCategory = toTitleCase((promptedCategory ?? "").trim());
    if (!nextCategory) {
      return;
    }

    const nextOptions = [...new Set([...categoryOptions, nextCategory])].sort();
    persistCategories(nextOptions);
    setForm((current) => ({ ...current, category: nextCategory }));
    setError("");
    setSuccess(`Category "${nextCategory}" is ready to reuse.`);
  };

  const approveSubmission = useCallback(
    async (submission: BusinessShowcaseSubmissionRecord) => {
      setProcessingSubmissionId(submission.id);
      setSubmissionError("");
      setError("");
      setSuccess("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/business-showcase-submissions/${submission.id}/approve/`,
          {
            method: "POST",
            headers: {
              ...(await getAuthHeaders()),
              "Content-Type": "application/json",
            },
            body: JSON.stringify({}),
          },
        );

        const rawText = await response.text();
        const data = parseApiPayload(rawText);
        if (!response.ok) {
          throw new Error(
            getApiErrorMessage(data, `Unable to approve business submission. (${response.status})`),
          );
        }

        await Promise.all([loadItems(), loadSubmissions()]);
        setSuccess(`"${submission.name}" was approved and published.`);
      } catch (requestError) {
        setSubmissionError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to approve business submission.",
        );
      } finally {
        setProcessingSubmissionId(null);
      }
    },
    [loadItems, loadSubmissions],
  );

  const rejectSubmission = useCallback(
    async (submission: BusinessShowcaseSubmissionRecord) => {
      const note =
        typeof window !== "undefined"
          ? window.prompt("Optional rejection note for this submission:", submission.admin_notes)
          : "";

      if (note === null) {
        return;
      }

      setProcessingSubmissionId(submission.id);
      setSubmissionError("");
      setError("");
      setSuccess("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/business-showcase-submissions/${submission.id}/reject/`,
          {
            method: "POST",
            headers: {
              ...(await getAuthHeaders()),
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ admin_notes: note.trim() }),
          },
        );

        const rawText = await response.text();
        const data = parseApiPayload(rawText);
        if (!response.ok) {
          throw new Error(
            getApiErrorMessage(data, `Unable to reject business submission. (${response.status})`),
          );
        }

        await loadSubmissions();
        setSuccess(`"${submission.name}" was rejected.`);
      } catch (requestError) {
        setSubmissionError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to reject business submission.",
        );
      } finally {
        setProcessingSubmissionId(null);
      }
    },
    [loadSubmissions],
  );

  return (
    <section className="space-y-5">
      <div className="admin-master-panel px-6 py-5 md:px-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[1rem] font-semibold uppercase tracking-[0.08em] text-primary">
              Business Showcase
            </h2>
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
            {formOpen && editingId === null ? "Close Form" : "Add Business"}
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

      <section className="admin-card rounded-[1.2rem] p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-primary">
              Pending Submissions
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Review details sent from the Business Showcase popup and publish them in one step.
            </p>
          </div>
          <span className="admin-badge">
            {submissionLoading ? "Loading..." : `${submissions.length} Pending`}
          </span>
        </div>

        {submissionError ? (
          <div className="mt-4 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {submissionError}
          </div>
        ) : null}

        <div className="mt-5 space-y-4">
          {submissionLoading ? (
            <div className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
              Loading pending business submissions...
            </div>
          ) : submissions.length ? (
            submissions.map((submission) => {
              const isProcessing = processingSubmissionId === submission.id;

              return (
                <article
                  key={submission.id}
                  className="rounded-[1.1rem] border border-[rgba(39,60,117,0.12)] bg-slate-50/90 p-4"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex gap-4">
                      {resolveBusinessImageSrc(submission.image_src) ? (
                        <div className="h-20 w-24 shrink-0 overflow-hidden rounded-[1rem] bg-slate-200">
                          <img
                            src={resolveBusinessImageSrc(submission.image_src)}
                            alt={submission.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-20 w-24 shrink-0 items-center justify-center rounded-[1rem] bg-slate-200 text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">
                          No Image
                        </div>
                      )}

                      <div className="space-y-2">
                        <div>
                          <p className="text-lg font-semibold text-slate-800">{submission.name}</p>
                          <p className="text-sm text-slate-500">
                            {submission.category} • {submission.phone}
                          </p>
                        </div>
                        <p className="text-sm leading-6 text-slate-600">{submission.description}</p>
                        <div className="grid gap-1 text-sm text-slate-600 md:grid-cols-2">
                          <p>
                            <span className="font-semibold text-slate-800">Address:</span>{" "}
                            {submission.address}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-800">Submitted by:</span>{" "}
                            {submission.submitter_name}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-800">Email:</span>{" "}
                            {submission.submitter_email}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-800">Received:</span>{" "}
                            {formatSubmissionDate(submission.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2 xl:justify-end">
                      <button
                        type="button"
                        onClick={() => void approveSubmission(submission)}
                        disabled={isProcessing}
                        className="admin-table-btn admin-table-btn-edit"
                      >
                        {isProcessing ? "Working..." : "Approve & Publish"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void rejectSubmission(submission)}
                        disabled={isProcessing}
                        className="admin-table-btn admin-table-btn-delete"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
              No pending business submissions right now.
            </div>
          )}
        </div>
      </section>

      {formOpen ? (
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
              const phoneSummary = summarizePhoneEntries(form.phoneEntries);
              if (phoneSummary.error) {
                setPhoneError(phoneSummary.error);
                throw new Error(phoneSummary.error);
              }
              setPhoneError("");

              const payload = new FormData();
              payload.append("name", form.name);
              payload.append("category", form.category);
              payload.append("description", form.description);
              payload.append("phone", phoneSummary.value);
              payload.append("address", form.address);
              payload.append("badge", form.badge);
              payload.append("website_url", form.website_url);
              payload.append("facebook_url", form.facebook_url);
              payload.append("instagram_url", form.instagram_url);
              payload.append("ecommerce_url", form.ecommerce_url);
              payload.append("is_featured", String(form.is_featured));
              payload.append("display_order", form.display_order || "0");
              payload.append("is_active", String(form.is_active));

              if (imageFile) {
                payload.append("image", imageFile);
              }
              if (imageMarkedForRemoval && !imageFile) {
                payload.append("image_clear", "1");
              }

              const response = await fetch(
                editingId
                  ? `${API_BASE_URL}/business-showcase/${editingId}/`
                  : `${API_BASE_URL}/business-showcase/`,
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
                  getApiErrorMessage(
                    data,
                    `Unable to save business showcase item. (${response.status})`,
                  ),
                );
              }

              await loadItems();
              resetForm();
              if (isEditing) {
                setFormOpen(false);
              } else {
                setFormOpen(true);
                requestAnimationFrame(() => focusFirstFormField(formRef.current));
              }
              setSuccess(isEditing ? "Business listing updated." : "Business listing added.");
            } catch (requestError) {
              setError(
                requestError instanceof Error
                  ? requestError.message
                  : "Unable to save business showcase item.",
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
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: toTitleCase(event.target.value) }))
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
                      required
                    >
                      <option value="">Select Category</option>
                      {categoryOptions.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    <span className="admin-select-arrow pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-500" />
                  </div>
                  <button
                    type="button"
                    onClick={addCategoryOption}
                    className="admin-master-btn admin-master-btn-primary min-h-[1.8rem] w-[1.8rem] shrink-0 px-0 py-0 text-[0.82rem] font-medium"
                    aria-label="Add category"
                  >
                    +
                  </button>
                </div>
              </label>
              <label className="admin-master-label w-full max-w-[25rem] md:col-span-2">
                <span>Description</span>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, description: event.target.value }))
                  }
                  className="admin-master-textarea"
                  rows={3}
                />
              </label>
              <label className="admin-master-label w-full max-w-[25rem]">
                <span>Phone</span>
                <PhoneNumbersInput
                  entries={form.phoneEntries}
                  onChange={(phoneEntries) => {
                    setForm((current) => ({ ...current, phoneEntries }));
                    if (phoneError) {
                      setPhoneError("");
                    }
                  }}
                  tone="admin"
                  error={phoneError}
                />
              </label>
              <label className="admin-master-label w-full max-w-[25rem]">
                <span>Address</span>
                <input
                  type="text"
                  value={form.address}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, address: toTitleCase(event.target.value) }))
                  }
                  className="admin-master-input"
                  required
                />
              </label>
              <label className="admin-master-label w-full max-w-[25rem]">
                <span>Badge</span>
                <div className="relative">
                  <select
                  value={form.badge}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, badge: event.target.value }))
                  }
                  className="admin-master-input appearance-none pr-14"
                  required
                  >
                    {badgeOptions.map((badge) => (
                      <option key={badge} value={badge}>
                        {badge}
                      </option>
                    ))}
                  </select>
                  <span className="admin-select-arrow pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-500" />
                </div>
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
              <label className="admin-master-label w-full max-w-[25rem]">
                <span>Website Url</span>
                <input
                  type="url"
                  value={form.website_url}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, website_url: event.target.value }))
                  }
                  className="admin-master-input"
                />
              </label>
              <label className="admin-master-label w-full max-w-[25rem]">
                <span>Facebook Url</span>
                <input
                  type="url"
                  value={form.facebook_url}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, facebook_url: event.target.value }))
                  }
                  className="admin-master-input"
                />
              </label>
              <label className="admin-master-label w-full max-w-[25rem]">
                <span>Instagram Url</span>
                <input
                  type="url"
                  value={form.instagram_url}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, instagram_url: event.target.value }))
                  }
                  className="admin-master-input"
                />
              </label>
              <label className="admin-master-label w-full max-w-[25rem]">
                <span>Ecommerce Url</span>
                <input
                  type="url"
                  value={form.ecommerce_url}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, ecommerce_url: event.target.value }))
                  }
                  className="admin-master-input"
                />
              </label>
              <label className="admin-master-label w-full max-w-[25rem] md:col-span-2">
                <span>Featured Image</span>
                <div className="flex min-h-[4rem] w-[52%] min-w-[12.5rem] items-center justify-between gap-3 rounded-[1rem] border border-dashed border-[rgba(39,60,117,0.18)] bg-white/80 px-3 py-2">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      setImageFile(event.target.files?.[0] ?? null);
                      setImageMarkedForRemoval(false);
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    onKeyDown={preventMouseOnlyUploadKeyboard}
                    className="admin-master-btn admin-master-btn-secondary min-h-[1.65rem] min-w-[5.2rem] px-2 py-1 text-[0.62rem] font-medium"
                    style={{ fontSize: "0.62rem", fontWeight: 500 }}
                  >
                    Upload Image
                  </button>
                  {resolvedPreviewImageSrc ? (
                    <div className="group relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      <img
                        src={resolvedPreviewImageSrc}
                        alt="Business preview"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreviewUrl("");
                          setImageMarkedForRemoval(true);
                          if (imageInputRef.current) {
                            imageInputRef.current.value = "";
                          }
                        }}
                        className="absolute inset-0 flex items-center justify-center bg-[#091224]/0 text-base font-semibold text-white opacity-0 transition group-hover:bg-[#091224]/70 group-hover:opacity-100"
                        aria-label="Remove business image"
                      >
                        x
                      </button>
                    </div>
                  ) : null}
                </div>
              </label>
            </div>

            <div className="mt-3 flex flex-wrap gap-5">
              <label className="inline-flex items-center gap-2 text-[0.62rem] font-medium uppercase tracking-[0.08em] text-slate-700">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, is_featured: event.target.checked }))
                  }
                />
                Featured
              </label>
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

      <section className="admin-card rounded-[1.2rem] p-5 md:p-6">
        <div className="mb-4 flex justify-end">
          <label className="block w-full max-w-md">
            <span className="mb-2 block text-[0.68rem] font-medium uppercase tracking-[0.08em] text-slate-700">
              Search Listings
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name, category, or badge"
              className="admin-master-input"
            />
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-master-table min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left">
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Phone</th>
                <th>Badge</th>
                <th>Featured</th>
                <th>Status</th>
                <th>Order</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="rounded-[0.9rem] bg-slate-50 px-3 py-3 text-sm text-slate-500"
                  >
                    Loading business showcase items...
                  </td>
                </tr>
              ) : filteredItems.length ? (
                filteredItems.map((item) => (
                  <tr key={item.id ?? item.name}>
                    <td className="rounded-l-[0.9rem] bg-slate-50/90 px-3 py-1.5 text-slate-700">
                      {resolveBusinessImageSrc(item.image_src) ? (
                        <div className="h-10 w-12 overflow-hidden rounded-xl bg-slate-200">
                          <img
                            src={resolveBusinessImageSrc(item.image_src)}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-10 w-12 items-center justify-center rounded-xl bg-slate-200 text-[10px] font-medium text-slate-500">
                          Image
                        </div>
                      )}
                    </td>
                    <td className="bg-slate-50/90 px-3 py-1.5 text-sm text-slate-700">
                      {item.name}
                    </td>
                    <td className="bg-slate-50/90 px-3 py-1.5 text-sm text-slate-600">
                      {item.category}
                    </td>
                    <td className="bg-slate-50/90 px-3 py-1.5 text-sm text-slate-600">
                      {item.phone}
                    </td>
                    <td className="bg-slate-50/90 px-3 py-1.5 text-sm text-slate-600">
                      {item.badge}
                    </td>
                    <td className="bg-slate-50/90 px-3 py-1.5 text-sm text-slate-600">
                      {item.is_featured ? "Featured" : "Standard"}
                    </td>
                    <td className="bg-slate-50/90 px-3 py-1.5 text-sm">
                      <span
                        className={`admin-badge ${
                          item.is_active ? "admin-badge-active" : "admin-badge-inactive"
                        }`}
                      >
                        {item.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="bg-slate-50/90 px-3 py-1.5 text-sm text-slate-600">
                      {item.display_order}
                    </td>
                    <td className="rounded-r-[0.9rem] bg-slate-50/90 px-3 py-1.5 text-right">
                      <div className="flex justify-end gap-2">
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
                            setError("");
                            setSuccess("");
                            try {
                              const response = await fetch(
                                `${API_BASE_URL}/business-showcase/${item.id}/`,
                                {
                                  method: "DELETE",
                                  headers: await getAuthHeaders(),
                                },
                              );
                              if (!response.ok) {
                                throw new Error("Unable to delete business listing.");
                              }
                              if (editingId === item.id) {
                                resetForm();
                                setFormOpen(false);
                              }
                              await loadItems();
                              setSuccess("Business listing deleted.");
                            } catch (requestError) {
                              setError(
                                requestError instanceof Error
                                  ? requestError.message
                                  : "Unable to delete business listing.",
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
                  <td
                    colSpan={9}
                    className="rounded-[0.9rem] bg-slate-50 px-3 py-3 text-sm text-slate-500"
                  >
                    {items.length
                      ? "No business showcase listing matched your search."
                      : "No business showcase listing found yet. Use the Add Business button to create one."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

