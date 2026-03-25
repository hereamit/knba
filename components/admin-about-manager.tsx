"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { API_BASE_URL, getValidAdminAccessToken } from "@/lib/api";
import {
  defaultAboutPageRecord,
  normalizeAboutPageRecord,
  type AboutPageRecord,
} from "@/lib/about-page";
import {
  defaultSiteSettings,
  normalizeSiteSettingsRecord,
  type SiteSettingsRecord,
} from "@/lib/site-settings";

type AboutFormState = {
  history_text: string;
  founder_message: string;
  president_message: string;
  mission_text: string;
  vision_text: string;
};

const emptySummary = defaultAboutPageRecord;

function getAboutFormState(settings: SiteSettingsRecord): AboutFormState {
  return {
    history_text: settings.history_text,
    founder_message: settings.founder_message,
    president_message: settings.president_message,
    mission_text: settings.mission_text,
    vision_text: settings.vision_text,
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

export function AdminAboutManager() {
  const [form, setForm] = useState<AboutFormState>(getAboutFormState(defaultSiteSettings));
  const [summary, setSummary] = useState<AboutPageRecord>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const formRef = useRef<HTMLFormElement | null>(null);

  const loadAboutContent = useCallback(async () => {
    const accessToken = await getValidAdminAccessToken();
    const [settingsResponse, summaryResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/site-settings/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }),
      fetch(`${API_BASE_URL}/about-page/`, {
        cache: "no-store",
      }),
    ]);

    if (!settingsResponse.ok || !summaryResponse.ok) {
      throw new Error("Unable to load about page content.");
    }

    const settingsData = normalizeSiteSettingsRecord(
      (await settingsResponse.json()) as Partial<SiteSettingsRecord>,
    );
    const summaryData = normalizeAboutPageRecord(await summaryResponse.json());

    setForm(getAboutFormState(settingsData));
    setSummary(summaryData);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const run = async () => {
      try {
        if (!isCancelled) {
          await loadAboutContent();
        }
      } catch (requestError) {
        if (!isCancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load about page content.",
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
  }, [loadAboutContent]);

  const summaryCards = useMemo(
    () => [
      {
        label: "Connected Businesses",
        value: String(summary.stats.connected_businesses),
        detail: "Committee members plus general member business records.",
      },
      {
        label: "Active Term",
        value: summary.current_term_label || "Not set",
        detail: "Public about page leadership data comes from the current term.",
      },
      {
        label: "Committee Members",
        value: String(summary.stats.committee_members),
        detail: "Active current-term member records visible on the website.",
      },
      {
        label: "General Members",
        value: String(summary.stats.general_members),
        detail: "Internal connected business records used for association operations.",
      },
    ],
    [summary],
  );

  return (
    <section className="space-y-5">
      <div className="admin-master-panel px-6 py-5 md:px-7">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[1rem] font-semibold uppercase tracking-[0.08em] text-primary">
              About
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Manage the public About page copy from one backend form.
            </p>
          </div>
          <div className="rounded-full border border-[rgba(39,60,117,0.15)] bg-white/80 px-4 py-2 text-xs font-medium text-slate-600">
            Founder and president names, roles, and photos come from current term member records.
          </div>
        </div>
      </div>

      {error && !loading ? (
        <div className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <article key={card.label} className="admin-card rounded-[1.1rem] p-5">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-primary-soft">
              {card.label}
            </p>
            <p className="mt-3 text-2xl font-semibold text-slate-800">{card.value}</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">{card.detail}</p>
          </article>
        ))}
      </section>

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
            const response = await fetch(`${API_BASE_URL}/site-settings/`, {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                history_text: form.history_text.trim(),
                founder_message: form.founder_message.trim(),
                president_message: form.president_message.trim(),
                mission_text: form.mission_text.trim(),
                vision_text: form.vision_text.trim(),
              }),
            });

            const rawText = await response.text();
            const payload = parseApiPayload(rawText);
            if (!response.ok) {
              throw new Error(
                getApiErrorMessage(payload, `Unable to save about page content. (${response.status})`),
              );
            }

            const normalizedSettings = normalizeSiteSettingsRecord(
              payload && typeof payload === "object"
                ? (payload as Partial<SiteSettingsRecord>)
                : {},
            );
            setForm(getAboutFormState(normalizedSettings));
            await loadAboutContent();
            setSuccess("About page content updated.");
            requestAnimationFrame(() =>
              formRef.current?.querySelector<HTMLTextAreaElement>("textarea")?.focus(),
            );
          } catch (requestError) {
            setError(
              requestError instanceof Error
                ? requestError.message
                : "Unable to save about page content.",
            );
          } finally {
            setSaving(false);
          }
        }}
      >
        <div className="mx-auto max-w-[64rem]">
          <div className="grid gap-3 md:grid-cols-2 md:gap-x-8">
            <label className="admin-master-label md:col-span-2">
              <span>Association History</span>
              <textarea
                value={form.history_text}
                onChange={(event) =>
                  setForm((current) => ({ ...current, history_text: event.target.value }))
                }
                className="admin-master-textarea"
                rows={5}
                required
              />
            </label>

            <label className="admin-master-label">
              <span>Founder&apos;s Message</span>
              <textarea
                value={form.founder_message}
                onChange={(event) =>
                  setForm((current) => ({ ...current, founder_message: event.target.value }))
                }
                className="admin-master-textarea"
                rows={5}
                required
              />
            </label>

            <label className="admin-master-label">
              <span>President&apos;s Message</span>
              <textarea
                value={form.president_message}
                onChange={(event) =>
                  setForm((current) => ({ ...current, president_message: event.target.value }))
                }
                className="admin-master-textarea"
                rows={5}
                required
              />
            </label>

            <label className="admin-master-label">
              <span>Mission</span>
              <textarea
                value={form.mission_text}
                onChange={(event) =>
                  setForm((current) => ({ ...current, mission_text: event.target.value }))
                }
                className="admin-master-textarea"
                rows={4}
                required
              />
            </label>

            <label className="admin-master-label">
              <span>Vision</span>
              <textarea
                value={form.vision_text}
                onChange={(event) =>
                  setForm((current) => ({ ...current, vision_text: event.target.value }))
                }
                className="admin-master-textarea"
                rows={4}
                required
              />
            </label>
          </div>

          {success ? (
            <p className="mt-4 text-sm font-medium text-emerald-700">{success}</p>
          ) : null}
          {error && !loading ? (
            <p className="mt-4 text-sm font-medium text-rose-700">{error}</p>
          ) : null}

          <div className="mt-5 flex justify-end">
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
