"use client";

import { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { PhoneNumbersInput } from "@/components/phone-numbers-input";
import {
  ensurePhoneEntries,
  summarizePhoneEntries,
  type PhoneEntry,
} from "@/lib/phone";
import { moveToNextFormField, resetEnterNavigationState } from "@/lib/enter-navigation";

type AdvertiseFormState = {
  submitter_name: string;
  submitter_email: string;
  name: string;
  category: string;
  description: string;
  phoneEntries: PhoneEntry[];
  address: string;
  website_url: string;
  facebook_url: string;
  instagram_url: string;
  ecommerce_url: string;
};

function createEmptyForm(): AdvertiseFormState {
  return {
    submitter_name: "",
    submitter_email: "",
    name: "",
    category: "",
    description: "",
    phoneEntries: ensurePhoneEntries([]),
    address: "",
    website_url: "",
    facebook_url: "",
    instagram_url: "",
    ecommerce_url: "",
  };
}

function getApiErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    if ("detail" in payload && typeof payload.detail === "string") {
      return payload.detail;
    }

    const entries = Object.values(payload)
      .flatMap((value) => {
        if (Array.isArray(value)) {
          return value.filter((item): item is string => typeof item === "string");
        }
        return typeof value === "string" ? [value] : [];
      })
      .filter(Boolean);

    if (entries.length) {
      return entries.join(" ");
    }
  }

  return fallback;
}

export function BusinessShowcaseAdvertiseModal({
  onClose,
  onSubmitted,
  categoryOptions,
}: {
  onClose: () => void;
  onSubmitted: () => void;
  categoryOptions: string[];
}) {
  const [form, setForm] = useState<AdvertiseFormState>(createEmptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const firstInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    requestAnimationFrame(() => firstInputRef.current?.focus());
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#091224]/68 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[1.6rem] bg-white shadow-[0_30px_70px_rgba(9,18,36,0.3)]">
        <div className="bg-[linear-gradient(135deg,#16213f,#273c75)] px-5 py-5 text-white md:px-6">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/14 text-base font-semibold text-white"
            aria-label="Close advertise form"
          >
            x
          </button>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/72">
            Advertise Your Business
          </p>
          <h2 className="display-font mt-2 text-2xl font-semibold md:text-[2rem]">
            Send your business details to KNBA for review.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/78">
            Your submission goes to the admin review queue first. Once verified, it can be
            published to the Business Showcase with minimal admin work.
          </p>
        </div>

        <div className="p-5 md:p-6">
          {submitted ? (
            <div className="space-y-4">
              <div className="rounded-[1.2rem] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-medium text-emerald-700">
                Your business details were sent to the admin for review.
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-primary"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form
              className="grid gap-4"
              onKeyDown={moveToNextFormField}
              onBlurCapture={resetEnterNavigationState}
              onSubmit={async (event) => {
                event.preventDefault();
                setSubmitting(true);
                setError("");

                try {
                  const phoneSummary = summarizePhoneEntries(form.phoneEntries);
                  if (phoneSummary.error) {
                    setPhoneError(phoneSummary.error);
                    throw new Error(phoneSummary.error);
                  }
                  setPhoneError("");

                  const payload = new FormData();
                  payload.append("submitter_name", form.submitter_name);
                  payload.append("submitter_email", form.submitter_email);
                  payload.append("name", form.name);
                  payload.append("category", form.category);
                  payload.append("description", form.description);
                  payload.append("phone", phoneSummary.value);
                  payload.append("address", form.address);
                  payload.append("website_url", form.website_url);
                  payload.append("facebook_url", form.facebook_url);
                  payload.append("instagram_url", form.instagram_url);
                  payload.append("ecommerce_url", form.ecommerce_url);

                  if (imageFile) {
                    payload.append("image", imageFile);
                  }

                  const response = await fetch(`${API_BASE_URL}/business-showcase-submissions/`, {
                    method: "POST",
                    body: payload,
                  });

                  const responsePayload = await response.json().catch(() => null);
                  if (!response.ok) {
                    throw new Error(
                      getApiErrorMessage(
                        responsePayload,
                        "Unable to submit your business details.",
                      ),
                    );
                  }

                  setSubmitted(true);
                  setForm(createEmptyForm());
                  setImageFile(null);
                  setPhoneError("");
                  onSubmitted();
                } catch (requestError) {
                  setError(
                    requestError instanceof Error
                      ? requestError.message
                      : "Unable to submit your business details.",
                  );
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                    Contact Person
                  </span>
                  <input
                    ref={firstInputRef}
                    type="text"
                    value={form.submitter_name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, submitter_name: event.target.value }))
                    }
                    className="w-full rounded-[0.95rem] border border-line bg-[#f7f9ff] px-4 py-3 text-sm outline-none transition focus:border-primary-soft"
                    placeholder="Your name"
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                    Contact Email
                  </span>
                  <input
                    type="email"
                    value={form.submitter_email}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, submitter_email: event.target.value }))
                    }
                    className="w-full rounded-[0.95rem] border border-line bg-[#f7f9ff] px-4 py-3 text-sm outline-none transition focus:border-primary-soft"
                    placeholder="name@example.com"
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                    Business Name
                  </span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, name: event.target.value }))
                    }
                    className="w-full rounded-[0.95rem] border border-line bg-[#f7f9ff] px-4 py-3 text-sm outline-none transition focus:border-primary-soft"
                    placeholder="Business or brand name"
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                    Category
                  </span>
                  <input
                    list="business-showcase-category-options"
                    type="text"
                    value={form.category}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, category: event.target.value }))
                    }
                    className="w-full rounded-[0.95rem] border border-line bg-[#f7f9ff] px-4 py-3 text-sm outline-none transition focus:border-primary-soft"
                    placeholder="Retail, Jewellery, Electronics..."
                    required
                  />
                  <datalist id="business-showcase-category-options">
                    {categoryOptions.map((option) => (
                      <option key={option} value={option} />
                    ))}
                  </datalist>
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                    Business Phone
                  </span>
                  <PhoneNumbersInput
                    entries={form.phoneEntries}
                    onChange={(phoneEntries) => {
                      setForm((current) => ({ ...current, phoneEntries }));
                      if (phoneError) {
                        setPhoneError("");
                      }
                    }}
                    tone="light"
                    error={phoneError}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                    Address
                  </span>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, address: event.target.value }))
                    }
                    className="w-full rounded-[0.95rem] border border-line bg-[#f7f9ff] px-4 py-3 text-sm outline-none transition focus:border-primary-soft"
                    placeholder="Business address"
                    required
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                    Description
                  </span>
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, description: event.target.value }))
                    }
                    className="w-full rounded-[0.95rem] border border-line bg-[#f7f9ff] px-4 py-3 text-sm outline-none transition focus:border-primary-soft"
                    placeholder="Briefly describe what your business offers."
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                    Website Url
                  </span>
                  <input
                    type="url"
                    value={form.website_url}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, website_url: event.target.value }))
                    }
                    className="w-full rounded-[0.95rem] border border-line bg-[#f7f9ff] px-4 py-3 text-sm outline-none transition focus:border-primary-soft"
                    placeholder="https://"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                    Facebook Url
                  </span>
                  <input
                    type="url"
                    value={form.facebook_url}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, facebook_url: event.target.value }))
                    }
                    className="w-full rounded-[0.95rem] border border-line bg-[#f7f9ff] px-4 py-3 text-sm outline-none transition focus:border-primary-soft"
                    placeholder="https://facebook.com/..."
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                    Instagram Url
                  </span>
                  <input
                    type="url"
                    value={form.instagram_url}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, instagram_url: event.target.value }))
                    }
                    className="w-full rounded-[0.95rem] border border-line bg-[#f7f9ff] px-4 py-3 text-sm outline-none transition focus:border-primary-soft"
                    placeholder="https://instagram.com/..."
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                    Ecommerce Url
                  </span>
                  <input
                    type="url"
                    value={form.ecommerce_url}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, ecommerce_url: event.target.value }))
                    }
                    className="w-full rounded-[0.95rem] border border-line bg-[#f7f9ff] px-4 py-3 text-sm outline-none transition focus:border-primary-soft"
                    placeholder="https://"
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                    Business Image
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                    className="block w-full rounded-[0.95rem] border border-dashed border-line bg-[#f7f9ff] px-4 py-3 text-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-[linear-gradient(135deg,#273c75,#1e3799)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                  />
                </label>
              </div>

              {error ? (
                <div className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {error}
                </div>
              ) : null}

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex min-h-[2.75rem] items-center justify-center rounded-full border border-line px-5 py-3 text-sm font-semibold text-primary transition hover:border-primary-soft"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                >
                  {submitting ? "Submitting..." : "Send To Admin"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 -z-10"
        aria-label="Close advertise modal overlay"
      />
    </div>
  );
}
