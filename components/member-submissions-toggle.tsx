"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL, getValidAdminAccessToken } from "@/lib/api";

async function getAuthHeaders() {
  const accessToken = await getValidAdminAccessToken();
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

export function MemberSubmissionsToggle() {
  const [open, setOpen] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/site-settings/`, {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Failed to load settings.");
        const data = (await response.json()) as { member_submissions_open?: boolean };
        if (!cancelled) setOpen(Boolean(data.member_submissions_open));
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load settings.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggle = async () => {
    if (open === null) return;
    const nextValue = !open;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/site-settings/`, {
        method: "PATCH",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ member_submissions_open: nextValue }),
      });
      if (!response.ok) throw new Error("Failed to update.");
      setOpen(nextValue);
      setMessage(
        nextValue
          ? "Submissions are now OPEN. The submit button is visible on the public site."
          : "Submissions are now CLOSED. The general visitor enquiry button is visible.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="admin-card rounded-[1rem] p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-slate-800">Member Submissions Window</h2>
        {open !== null ? (
          <span
            className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold ${
              open
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {open ? "OPEN" : "CLOSED"}
          </span>
        ) : null}
      </div>

      {loading ? (
        <p className="mt-3 text-xs text-slate-500">Loading...</p>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleToggle}
            disabled={saving}
            className={`inline-flex min-h-[2rem] items-center justify-center rounded-full px-3.5 py-1 text-xs font-semibold text-white transition ${
              open
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-[linear-gradient(135deg,#273c75,#1e3799)] hover:opacity-90"
            }`}
          >
            {saving ? "Saving..." : open ? "Close" : "Open"}
          </button>
          {message ? (
            <span className="text-xs font-medium text-emerald-700">{message}</span>
          ) : null}
          {error ? (
            <span className="text-xs font-medium text-rose-700">{error}</span>
          ) : null}
        </div>
      )}
    </article>
  );
}
