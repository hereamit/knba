"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE_URL, getValidAdminAccessToken } from "@/lib/api";
import {
  defaultSiteSettings,
  normalizeSiteSettingsRecord,
  type SiteSettingsRecord,
} from "@/lib/site-settings";

type HomeFormState = {
  home_about_eyebrow: string;
  home_about_title: string;
  home_services_eyebrow: string;
  home_services_title: string;
  home_services_description: string;
  home_business_eyebrow: string;
  home_business_title: string;
  home_business_description: string;
  home_gallery_eyebrow: string;
  home_gallery_title: string;
  home_gallery_description: string;
};

const HOME_FIELDS = [
  {
    section: "About section",
    fields: [
      { key: "home_about_eyebrow", label: "Eyebrow (small label)", rows: 1 },
      { key: "home_about_title", label: "Heading", rows: 2 },
    ],
  },
  {
    section: "Core Services section",
    fields: [
      { key: "home_services_eyebrow", label: "Eyebrow (small label)", rows: 1 },
      { key: "home_services_title", label: "Heading", rows: 2 },
      { key: "home_services_description", label: "Description", rows: 3 },
    ],
  },
  {
    section: "Business Showcase section",
    fields: [
      { key: "home_business_eyebrow", label: "Eyebrow (small label)", rows: 1 },
      { key: "home_business_title", label: "Heading", rows: 2 },
      { key: "home_business_description", label: "Description", rows: 3 },
    ],
  },
  {
    section: "Gallery section",
    fields: [
      { key: "home_gallery_eyebrow", label: "Eyebrow (small label)", rows: 1 },
      { key: "home_gallery_title", label: "Heading", rows: 2 },
      { key: "home_gallery_description", label: "Description", rows: 3 },
    ],
  },
] as const satisfies ReadonlyArray<{
  section: string;
  fields: ReadonlyArray<{ key: keyof HomeFormState; label: string; rows: number }>;
}>;

function getHomeFormState(settings: SiteSettingsRecord): HomeFormState {
  return {
    home_about_eyebrow: settings.home_about_eyebrow,
    home_about_title: settings.home_about_title,
    home_services_eyebrow: settings.home_services_eyebrow,
    home_services_title: settings.home_services_title,
    home_services_description: settings.home_services_description,
    home_business_eyebrow: settings.home_business_eyebrow,
    home_business_title: settings.home_business_title,
    home_business_description: settings.home_business_description,
    home_gallery_eyebrow: settings.home_gallery_eyebrow,
    home_gallery_title: settings.home_gallery_title,
    home_gallery_description: settings.home_gallery_description,
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

export function AdminHomeManager() {
  const [form, setForm] = useState<HomeFormState>(getHomeFormState(defaultSiteSettings));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const formRef = useRef<HTMLFormElement | null>(null);

  const loadHomeContent = useCallback(async () => {
    const accessToken = await getValidAdminAccessToken();
    const response = await fetch(`${API_BASE_URL}/site-settings/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Unable to load home page content.");
    }

    const settingsData = normalizeSiteSettingsRecord(
      (await response.json()) as Partial<SiteSettingsRecord>,
    );
    setForm(getHomeFormState(settingsData));
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const run = async () => {
      try {
        if (!isCancelled) {
          await loadHomeContent();
        }
      } catch (requestError) {
        if (!isCancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load home page content.",
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
  }, [loadHomeContent]);

  return (
    <section className="space-y-5">
      <div className="admin-master-panel px-6 py-5 md:px-7">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[1rem] font-semibold uppercase tracking-[0.08em] text-primary">
              Home Page
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Edit the section headings shown on the public home page.
            </p>
          </div>
          <div className="rounded-full border border-[rgba(39,60,117,0.15)] bg-white/80 px-4 py-2 text-xs font-medium text-slate-600">
            Slider, services, businesses, and gallery items are managed in their own screens.
          </div>
        </div>
      </div>

      {error && !loading ? (
        <div className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      <form
        ref={formRef}
        className="rounded-[1.2rem] border border-[rgba(39,60,117,0.12)] bg-[linear-gradient(180deg,#dbe7ff_0%,#c9d9fb_100%)] p-4 shadow-[0_18px_40px_rgba(18,31,69,0.06)] md:p-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setSaving(true);
          setError("");
          setSuccess("");

          try {
            const accessToken = await getValidAdminAccessToken();
            const body = Object.fromEntries(
              Object.entries(form).map(([key, value]) => [key, value.trim()]),
            );
            const response = await fetch(`${API_BASE_URL}/site-settings/`, {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(body),
            });

            const rawText = await response.text();
            const payload = parseApiPayload(rawText);
            if (!response.ok) {
              throw new Error(
                getApiErrorMessage(payload, `Unable to save home page content. (${response.status})`),
              );
            }

            const normalizedSettings = normalizeSiteSettingsRecord(
              payload && typeof payload === "object"
                ? (payload as Partial<SiteSettingsRecord>)
                : {},
            );
            setForm(getHomeFormState(normalizedSettings));
            setSuccess("Home page content updated.");
          } catch (requestError) {
            setError(
              requestError instanceof Error
                ? requestError.message
                : "Unable to save home page content.",
            );
          } finally {
            setSaving(false);
          }
        }}
      >
        <div className="mx-auto max-w-[64rem] space-y-6">
          {HOME_FIELDS.map((group) => (
            <fieldset key={group.section} className="space-y-3">
              <legend className="text-sm font-semibold uppercase tracking-[0.08em] text-primary">
                {group.section}
              </legend>
              <div className="grid gap-3 md:grid-cols-2 md:gap-x-8">
                {group.fields.map((field) => (
                  <label
                    key={field.key}
                    className={`admin-master-label ${
                      field.key.endsWith("description") || field.key.endsWith("title")
                        ? "md:col-span-2"
                        : ""
                    }`}
                  >
                    <span>{field.label}</span>
                    <textarea
                      value={form[field.key]}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, [field.key]: event.target.value }))
                      }
                      className="admin-master-textarea"
                      rows={field.rows}
                      required
                    />
                  </label>
                ))}
              </div>
            </fieldset>
          ))}

          {success ? (
            <p className="text-sm font-medium text-emerald-700">{success}</p>
          ) : null}
          {error && !loading ? (
            <p className="text-sm font-medium text-rose-700">{error}</p>
          ) : null}

          <div className="flex justify-end">
            <button
              type="submit"
              className="admin-master-btn admin-master-btn-primary"
              disabled={saving || loading}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
