"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE_URL, getValidAdminAccessToken } from "@/lib/api";
import {
  normalizeHomeHeroImageRecord,
  resolveHomeHeroImageSrc,
  type HomeHeroImageRecord,
} from "@/lib/home-hero";

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

async function readError(response: Response, fallback: string) {
  const rawText = await response.text();
  if (!rawText.trim()) {
    return `${fallback} (${response.status})`;
  }
  try {
    return getApiErrorMessage(JSON.parse(rawText), fallback);
  } catch {
    return fallback;
  }
}

export function AdminHomeHeroManager() {
  const [items, setItems] = useState<HomeHeroImageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | "new" | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadItems = useCallback(async () => {
    const accessToken = await getValidAdminAccessToken();
    const response = await fetch(`${API_BASE_URL}/home-hero-images/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Unable to load home hero images.");
    }

    const data = (await response.json()) as HomeHeroImageRecord[];
    setItems(data.map((record, index) => normalizeHomeHeroImageRecord(record, index)));
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
              : "Unable to load home hero images.",
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

  const handleAdd = async () => {
    if (!file) {
      setError("Choose an image to upload.");
      return;
    }

    setBusyId("new");
    setError("");
    setSuccess("");

    try {
      const accessToken = await getValidAdminAccessToken();
      const payload = new FormData();
      payload.append("image", file);
      payload.append("title", title.trim());
      payload.append("display_order", String(items.length));
      payload.append("is_active", "true");

      const response = await fetch(`${API_BASE_URL}/home-hero-images/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: payload,
      });

      if (!response.ok) {
        throw new Error(await readError(response, "Unable to upload image."));
      }

      setTitle("");
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await loadItems();
      setSuccess("Hero image added.");
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Unable to upload image.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const updateItemField = (
    id: number,
    field: "title" | "display_order" | "is_active",
    value: string | number | boolean,
  ) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const handleSave = async (item: HomeHeroImageRecord) => {
    if (item.id === undefined) {
      return;
    }

    setBusyId(item.id);
    setError("");
    setSuccess("");

    try {
      const accessToken = await getValidAdminAccessToken();
      const response = await fetch(`${API_BASE_URL}/home-hero-images/${item.id}/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: item.title.trim(),
          display_order: Number(item.display_order) || 0,
          is_active: item.is_active,
        }),
      });

      if (!response.ok) {
        throw new Error(await readError(response, "Unable to save image."));
      }

      await loadItems();
      setSuccess("Hero image updated.");
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Unable to save image.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Remove this hero image?")) {
      return;
    }

    setBusyId(id);
    setError("");
    setSuccess("");

    try {
      const accessToken = await getValidAdminAccessToken();
      const response = await fetch(`${API_BASE_URL}/home-hero-images/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok && response.status !== 404) {
        throw new Error(await readError(response, "Unable to delete image."));
      }

      await loadItems();
      setSuccess("Hero image removed.");
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Unable to delete image.",
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="space-y-5">
      <div className="admin-master-panel px-6 py-5 md:px-7">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[1rem] font-semibold uppercase tracking-[0.08em] text-primary">
              Home Hero Images
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              The top sliding photos on the home page. Active images here replace the
              automatic gallery slideshow.
            </p>
          </div>
          <div className="rounded-full border border-[rgba(39,60,117,0.15)] bg-white/80 px-4 py-2 text-xs font-medium text-slate-600">
            Lowest order shows first. Remove all to fall back to the gallery slideshow.
          </div>
        </div>
      </div>

      {error && !loading ? (
        <div className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-[1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {success}
        </div>
      ) : null}

      <div className="rounded-[1.2rem] border border-[rgba(39,60,117,0.12)] bg-[linear-gradient(180deg,#dbe7ff_0%,#c9d9fb_100%)] p-4 shadow-[0_18px_40px_rgba(18,31,69,0.06)] md:p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <label className="admin-master-label">
            <span>Image file</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="admin-master-input bg-white"
            />
          </label>
          <label className="admin-master-label">
            <span>Caption (optional, used as alt text)</span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="admin-master-input"
              placeholder="e.g. New Road market gate"
            />
          </label>
          <button
            type="button"
            onClick={handleAdd}
            className="admin-master-btn admin-master-btn-primary"
            disabled={busyId === "new" || loading}
          >
            {busyId === "new" ? "Uploading..." : "Add image"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-slate-500">Loading hero images...</p>
        ) : items.length === 0 ? (
          <p className="rounded-[1rem] border border-dashed border-[rgba(39,60,117,0.2)] bg-white px-4 py-6 text-sm text-slate-500">
            No hero images yet. Upload one above, or the home page keeps using the gallery slideshow.
          </p>
        ) : (
          items.map((item) => (
            <article
              key={item.id}
              className="flex flex-col gap-4 rounded-[1.1rem] border border-[rgba(39,60,117,0.12)] bg-white p-4 md:flex-row md:items-center"
            >
              <div className="h-20 w-32 shrink-0 overflow-hidden rounded-[0.8rem] bg-slate-100">
                {item.image_src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolveHomeHeroImageSrc(item.image_src)}
                    alt={item.title || "Hero image"}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>

              <label className="admin-master-label flex-1">
                <span>Caption</span>
                <input
                  type="text"
                  value={item.title}
                  onChange={(event) =>
                    item.id !== undefined &&
                    updateItemField(item.id, "title", event.target.value)
                  }
                  className="admin-master-input"
                  placeholder="Alt text"
                />
              </label>

              <label className="admin-master-label w-24">
                <span>Order</span>
                <input
                  type="number"
                  min={0}
                  value={item.display_order}
                  onChange={(event) =>
                    item.id !== undefined &&
                    updateItemField(item.id, "display_order", Number(event.target.value))
                  }
                  className="admin-master-input"
                />
              </label>

              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={item.is_active}
                  onChange={(event) =>
                    item.id !== undefined &&
                    updateItemField(item.id, "is_active", event.target.checked)
                  }
                />
                Active
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSave(item)}
                  className="admin-master-btn admin-master-btn-primary"
                  disabled={busyId === item.id}
                >
                  {busyId === item.id ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => item.id !== undefined && handleDelete(item.id)}
                  className="rounded-[0.8rem] border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                  disabled={busyId === item.id}
                >
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
