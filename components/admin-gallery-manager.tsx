"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE_URL, getValidAdminAccessToken } from "@/lib/api";
import {
  focusFirstFormField,
  moveToNextFormField,
  preventMouseOnlyUploadKeyboard,
  resetEnterNavigationState,
} from "@/lib/enter-navigation";
import {
  normalizeGalleryRecord,
  resolveGalleryImageSrc,
  type GalleryRecord,
} from "@/lib/gallery";

type GalleryFormState = {
  title: string;
  category: string;
  description: string;
  display_order: string;
  is_featured: boolean;
  show_in_slider: boolean;
  is_active: boolean;
};

const emptyForm: GalleryFormState = {
  title: "",
  category: "",
  description: "",
  display_order: "1",
  is_featured: false,
  show_in_slider: false,
  is_active: true,
};

async function getAuthHeaders() {
  const accessToken = await getValidAdminAccessToken();
  return {
    Authorization: `Bearer ${accessToken}`,
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

export function AdminGalleryManager() {
  const [items, setItems] = useState<GalleryRecord[]>([]);
  const [orderDrafts, setOrderDrafts] = useState<Record<string, string>>({});
  const [form, setForm] = useState<GalleryFormState>(emptyForm);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [imageMarkedForRemoval, setImageMarkedForRemoval] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const formRef = useRef<HTMLFormElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const editingItem = editingId
    ? items.find((item) => item.id === editingId) ?? null
    : null;
  const imageDisplayUrl =
    !imageMarkedForRemoval && (imagePreviewUrl || editingItem?.image_src || "");
  const resolvedPreviewImageSrc = imageDisplayUrl
    ? resolveGalleryImageSrc(imageDisplayUrl)
    : "";

  const hasDuplicateCategoryOrder = useCallback(
    (category: string, displayOrder: string, excludeId?: number | null) => {
      const normalizedCategory = category.trim().toLowerCase();
      const normalizedOrder = displayOrder.trim();

      if (!normalizedCategory || !normalizedOrder) {
        return false;
      }

      return items.some((item) => {
        if (excludeId && item.id === excludeId) {
          return false;
        }

        return (
          item.category.trim().toLowerCase() === normalizedCategory &&
          String(item.display_order) === normalizedOrder
        );
      });
    },
    [items],
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

  const persistCategories = useCallback((nextCategories: string[]) => {
    setCategoryOptions(nextCategories);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "knba_gallery_categories",
        JSON.stringify(nextCategories),
      );
    }
  }, []);

  const syncCategoriesFromItems = useCallback((records: GalleryRecord[]) => {
    const itemCategories = records
      .map((item) => item.category.trim())
      .filter(Boolean);
    const savedCategories =
      typeof window !== "undefined"
        ? JSON.parse(window.localStorage.getItem("knba_gallery_categories") ?? "[]")
        : [];
    const mergedCategories = [...new Set([...savedCategories, ...itemCategories])].sort();
    persistCategories(mergedCategories);
  }, [persistCategories]);

  const loadItems = useCallback(async () => {
    const response = await fetch(`${API_BASE_URL}/gallery/`, {
      headers: await getAuthHeaders(),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Unable to load gallery items.");
    }

    const data = (await response.json()) as GalleryRecord[];
    const normalizedItems = data.map(normalizeGalleryRecord);
    setItems(normalizedItems);
    setOrderDrafts(
      Object.fromEntries(
        normalizedItems
          .filter((item): item is GalleryRecord & { id: number } => typeof item.id === "number")
          .map((item) => [String(item.id), String(item.display_order)]),
      ),
    );
    syncCategoriesFromItems(normalizedItems);
  }, [syncCategoriesFromItems]);

  useEffect(() => {
    let isCancelled = false;

    const run = async () => {
      try {
        if (!isCancelled && typeof window !== "undefined") {
          const storedCategories = JSON.parse(
            window.localStorage.getItem("knba_gallery_categories") ?? "[]",
          );
          if (Array.isArray(storedCategories) && storedCategories.length) {
            setCategoryOptions(
              storedCategories.filter((item): item is string => typeof item === "string"),
            );
          }
        }
        if (!isCancelled) {
          await loadItems();
        }
      } catch (requestError) {
        if (!isCancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load gallery items.",
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
    setForm(emptyForm);
    setEditingId(null);
    setImageFile(null);
    setImageMarkedForRemoval(false);
  };

  const openCreateForm = () => {
    resetForm();
    setError("");
    setSuccess("");
    setFormOpen(true);
  };

  const openEditForm = (item: GalleryRecord) => {
    setForm({
      title: item.title,
      category: item.category,
      description: item.description,
      display_order: String(item.display_order),
      is_featured: item.is_featured,
      show_in_slider: item.show_in_slider,
      is_active: item.is_active,
    });
    setEditingId(item.id ?? null);
    setImageFile(null);
    setImageMarkedForRemoval(false);
    setError("");
    setSuccess("");
    setFormOpen(true);
  };

  const addCategoryOption = () => {
    const promptedCategory =
      typeof window !== "undefined"
        ? window.prompt("Enter gallery category")
        : null;
    const nextCategory = toTitleCase((promptedCategory ?? "").trim());
    if (!nextCategory) {
      return;
    }

    const nextOptions = [...new Set([...categoryOptions, nextCategory])].sort();
    persistCategories(nextOptions);
    setForm((current) => ({
      ...current,
      category: nextCategory,
    }));
    setError("");
    setSuccess(`Category "${nextCategory}" is ready to reuse.`);
  };

  const updateItemOrder = async (item: GalleryRecord) => {
    if (typeof item.id !== "number") {
      return;
    }

    const nextOrder = orderDrafts[String(item.id)] ?? String(item.display_order);
      if (!nextOrder.trim()) {
        setError("Display order cannot be empty.");
        return;
      }

      if (hasDuplicateCategoryOrder(item.category, nextOrder, item.id)) {
        setError(
          `Display order "${nextOrder}" is already used in the "${item.category}" category.`,
        );
        return;
      }

      setError("");
      setSuccess("");

    try {
      const payload = new FormData();
      payload.append("display_order", nextOrder);

      const response = await fetch(`${API_BASE_URL}/gallery/${item.id}/`, {
        method: "PATCH",
        headers: await getAuthHeaders(),
        body: payload,
      });

      const rawText = await response.text();
      const data = parseApiPayload(rawText);
      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(data, `Unable to update display order. (${response.status})`),
        );
      }

      await loadItems();
      setSuccess(`Display order updated for "${item.title}".`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update display order.",
      );
    }
  };

  const handleOrderCommit = async (item: GalleryRecord) => {
    if (typeof item.id !== "number") {
      return;
    }

    const nextOrder = orderDrafts[String(item.id)] ?? String(item.display_order);
    if (nextOrder === String(item.display_order)) {
      return;
    }

    await updateItemOrder(item);
  };

  return (
    <section className="space-y-5">
      <div className="admin-master-panel px-6 py-5 md:px-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[1rem] font-semibold uppercase tracking-[0.08em] text-primary">
              Gallery Manager
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
            {formOpen && editingId === null ? "Close Form" : "Add Image"}
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
          onKeyDown={moveToNextFormField}
          onBlurCapture={resetEnterNavigationState}
          onSubmit={async (event) => {
            event.preventDefault();
            setSaving(true);
            setError("");
            setSuccess("");

            try {
              const isEditing = editingId !== null;
              if (hasDuplicateCategoryOrder(form.category, form.display_order, editingId)) {
                throw new Error(
                  `Display order "${form.display_order}" is already used in the "${form.category}" category.`,
                );
              }

              const payload = new FormData();
              payload.append("title", form.title);
              payload.append("category", form.category);
              payload.append("description", form.description);
              payload.append("display_order", form.display_order || "0");
              payload.append("is_featured", String(form.is_featured));
              payload.append("show_in_slider", String(form.show_in_slider));
              payload.append("is_active", String(form.is_active));

              if (imageFile) {
                payload.append("image", imageFile);
              }
              if (imageMarkedForRemoval && !imageFile) {
                payload.append("image_clear", "1");
              }

              const response = await fetch(
                editingId
                  ? `${API_BASE_URL}/gallery/${editingId}/`
                  : `${API_BASE_URL}/gallery/`,
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
                  getApiErrorMessage(data, `Unable to save gallery item. (${response.status})`),
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
              setSuccess(isEditing ? "Gallery item updated." : "Gallery item added.");
            } catch (requestError) {
              setError(
                requestError instanceof Error
                  ? requestError.message
                  : "Unable to save gallery item.",
              );
            } finally {
              setSaving(false);
            }
          }}
        >
          <div className="mx-auto max-w-[54rem]">
            <div className="mx-auto grid w-full justify-center gap-3 md:grid-cols-2 md:gap-x-8">
              <label className="admin-master-label w-full max-w-[24rem]">
                <span>Title</span>
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: toTitleCase(event.target.value),
                    }))
                  }
                  className="admin-master-input"
                  required
                />
              </label>

              <label className="admin-master-label w-full max-w-[24rem]">
                <span>Category</span>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <select
                      value={form.category}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          category: event.target.value,
                        }))
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
                  rows={3}
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

              <label className="admin-master-label w-full max-w-[24rem]">
                <span>Image</span>
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
                        alt="Gallery preview"
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
                        aria-label="Remove image"
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
                  checked={form.show_in_slider}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, show_in_slider: event.target.checked }))
                  }
                />
                Show In Slider
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
        <div className="overflow-x-auto">
          <table className="admin-master-table min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left">
                <th>Image</th>
                <th>Title</th>
                <th>Category</th>
                <th>Order</th>
                <th>Featured</th>
                <th>Slider</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="rounded-[0.9rem] bg-slate-50 px-3 py-3 text-sm text-slate-500"
                  >
                    Loading gallery items...
                  </td>
                </tr>
              ) : items.length ? (
                items.map((item) => (
                  <tr key={item.id ?? item.title}>
                    <td className="rounded-l-[0.9rem] bg-slate-50/90 px-3 py-1.5 text-slate-700">
                      {resolveGalleryImageSrc(item.image_src) ? (
                        <div className="h-10 w-12 overflow-hidden rounded-xl bg-slate-200">
                          <img
                            src={resolveGalleryImageSrc(item.image_src)}
                            alt={item.title}
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
                      {item.title}
                    </td>
                    <td className="bg-slate-50/90 px-3 py-1.5 text-sm text-slate-600">
                      {item.category}
                    </td>
                    <td className="bg-slate-50/90 px-3 py-1.5 text-sm text-slate-600">
                      <div className="flex items-center">
                        <input
                          type="number"
                          min="0"
                          value={
                            typeof item.id === "number"
                              ? (orderDrafts[String(item.id)] ?? String(item.display_order))
                              : String(item.display_order)
                          }
                          onChange={(event) => {
                            if (typeof item.id !== "number") {
                              return;
                            }
                            setOrderDrafts((current) => ({
                              ...current,
                              [String(item.id)]: event.target.value,
                            }));
                          }}
                          onBlur={() => {
                            void handleOrderCommit(item);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              void handleOrderCommit(item);
                            }
                          }}
                          className="admin-master-input h-7 min-h-0 w-16 rounded-[0.7rem] px-2 py-0 text-[0.72rem]"
                        />
                      </div>
                    </td>
                    <td className="bg-slate-50/90 px-3 py-1.5 text-sm text-slate-600">
                      {item.is_featured ? "Featured" : "Standard"}
                    </td>
                    <td className="bg-slate-50/90 px-3 py-1.5 text-sm text-slate-600">
                      {item.show_in_slider ? "Shown" : "Hidden"}
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
                                `${API_BASE_URL}/gallery/${item.id}/`,
                                {
                                  method: "DELETE",
                                  headers: await getAuthHeaders(),
                                },
                              );
                              if (!response.ok) {
                                throw new Error("Unable to delete gallery item.");
                              }
                              if (editingId === item.id) {
                                resetForm();
                                setFormOpen(false);
                              }
                              await loadItems();
                              setSuccess("Gallery item deleted.");
                            } catch (requestError) {
                              setError(
                                requestError instanceof Error
                                  ? requestError.message
                                  : "Unable to delete gallery item.",
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
                    colSpan={8}
                    className="rounded-[0.9rem] bg-slate-50 px-3 py-3 text-sm text-slate-500"
                  >
                    No gallery items found yet. Use the Add Image button to create one.
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

