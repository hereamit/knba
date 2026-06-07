"use client";

import { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { moveToNextFormField, resetEnterNavigationState } from "@/lib/enter-navigation";

const NEPAL_COUNTRY_CODE = "+977";

type AdvertiseFormState = {
  submitter_name: string;
  submitter_email: string;
  name: string;
  category: string;
  description: string;
  phone: string;
  address: string;
  website_url: string;
  facebook_url: string;
  instagram_url: string;
  ecommerce_url: string;
};

const emptyForm: AdvertiseFormState = {
  submitter_name: "",
  submitter_email: "",
  name: "",
  category: "",
  description: "",
  phone: "",
  address: "",
  website_url: "",
  facebook_url: "",
  instagram_url: "",
  ecommerce_url: "",
};

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
  const [form, setForm] = useState<AdvertiseFormState>(emptyForm);
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

  const labelClass =
    "mb-1 block text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-primary";
  const inputClass =
    "w-full rounded-lg border border-line bg-[#f7f9ff] px-3 py-2 text-[13px] outline-none transition focus:border-primary-soft focus:bg-white";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#091224]/68 p-3 backdrop-blur-sm md:p-4">
      <div className="relative flex max-h-[96vh] w-full max-w-4xl flex-col overflow-hidden rounded-[1.4rem] bg-white shadow-[0_30px_70px_rgba(9,18,36,0.3)]">
        <div className="relative overflow-hidden bg-[linear-gradient(135deg,#16213f,#273c75,#1e3799)] px-5 py-3.5 text-white">
          <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#fbbf24]/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-32 w-32 rounded-full bg-[#5d6cda]/30 blur-3xl" />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/14 text-sm font-semibold text-white transition hover:bg-white/24"
            aria-label="Close advertise form"
          >
            ×
          </button>
          <div className="relative flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#fbbf24,#f97316)] text-base font-black text-white shadow-[0_10px_25px_rgba(249,115,22,0.35)]">
              ★
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-white/72">
                Advertise Your Business
              </p>
              <h2 className="display-font text-lg font-bold leading-tight md:text-xl">
                Showcase your brand on KNBA.
              </h2>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto px-5 py-4">
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
              className="grid gap-3"
              onKeyDown={moveToNextFormField}
              onBlurCapture={resetEnterNavigationState}
              onSubmit={async (event) => {
                event.preventDefault();
                setSubmitting(true);
                setError("");

                try {
                  if (form.phone.length !== 10) {
                    setPhoneError("Enter exactly 10 digits after +977.");
                    throw new Error("Enter exactly 10 digits after +977.");
                  }

                  const payload = new FormData();
                  payload.append("submitter_name", form.submitter_name);
                  payload.append("submitter_email", form.submitter_email);
                  payload.append("name", form.name);
                  payload.append("category", form.category);
                  payload.append("description", form.description);
                  payload.append("phone", `${NEPAL_COUNTRY_CODE}-${form.phone}`);
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
                  setForm(emptyForm);
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
              <div className="grid gap-3 md:grid-cols-3">
                <label className="block">
                  <span className={labelClass}>Contact Person</span>
                  <input
                    ref={firstInputRef}
                    type="text"
                    value={form.submitter_name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, submitter_name: event.target.value }))
                    }
                    className={inputClass}
                    placeholder="Your name"
                    required
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Contact Email</span>
                  <input
                    type="email"
                    value={form.submitter_email}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, submitter_email: event.target.value }))
                    }
                    className={inputClass}
                    placeholder="name@example.com"
                    required
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Business Phone</span>
                  <div className="flex items-center overflow-hidden rounded-lg border border-line bg-[#f7f9ff] focus-within:border-primary-soft focus-within:bg-white">
                    <span className="border-r border-line px-2.5 py-2 text-[12px] font-semibold text-primary">
                      {NEPAL_COUNTRY_CODE}
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
                      className="w-full bg-transparent px-3 py-2 text-[13px] outline-none"
                      placeholder="98XXXXXXXX"
                      required
                    />
                  </div>
                  {phoneError ? (
                    <p className="mt-1 text-[11px] font-medium text-rose-700">{phoneError}</p>
                  ) : null}
                </label>

                <label className="block">
                  <span className={labelClass}>Business Name</span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, name: event.target.value }))
                    }
                    className={inputClass}
                    placeholder="Business or brand name"
                    required
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Category</span>
                  <input
                    list="business-showcase-category-options"
                    type="text"
                    value={form.category}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, category: event.target.value }))
                    }
                    className={inputClass}
                    placeholder="Retail, Jewellery..."
                    required
                  />
                  <datalist id="business-showcase-category-options">
                    {categoryOptions.map((option) => (
                      <option key={option} value={option} />
                    ))}
                  </datalist>
                </label>
                <label className="block">
                  <span className={labelClass}>Address</span>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, address: event.target.value }))
                    }
                    className={inputClass}
                    placeholder="Business address"
                    required
                  />
                </label>

                <label className="block md:col-span-3">
                  <span className={labelClass}>Description</span>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, description: event.target.value }))
                    }
                    className={`${inputClass} resize-none`}
                    placeholder="Briefly describe what your business offers."
                  />
                </label>

                <label className="block">
                  <span className={labelClass}>Website</span>
                  <input
                    type="url"
                    value={form.website_url}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, website_url: event.target.value }))
                    }
                    className={inputClass}
                    placeholder="https://"
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Facebook</span>
                  <input
                    type="url"
                    value={form.facebook_url}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, facebook_url: event.target.value }))
                    }
                    className={inputClass}
                    placeholder="facebook.com/..."
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Instagram</span>
                  <input
                    type="url"
                    value={form.instagram_url}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, instagram_url: event.target.value }))
                    }
                    className={inputClass}
                    placeholder="instagram.com/..."
                  />
                </label>

                <label className="block md:col-span-1">
                  <span className={labelClass}>Ecommerce</span>
                  <input
                    type="url"
                    value={form.ecommerce_url}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, ecommerce_url: event.target.value }))
                    }
                    className={inputClass}
                    placeholder="https://"
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className={labelClass}>Business Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                    className="block w-full rounded-lg border border-dashed border-line bg-[#f7f9ff] px-2.5 py-1.5 text-[12px] text-muted file:mr-3 file:rounded-full file:border-0 file:bg-[linear-gradient(135deg,#273c75,#1e3799)] file:px-3 file:py-1.5 file:text-[12px] file:font-semibold file:text-white"
                  />
                </label>
              </div>

              {error ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] font-medium text-rose-700">
                  {error}
                </div>
              ) : null}

              <div className="flex flex-wrap justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex min-h-[2.25rem] items-center justify-center rounded-full border border-line px-4 py-1.5 text-[13px] font-semibold text-primary transition hover:border-primary-soft"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex min-h-[2.25rem] items-center justify-center rounded-full bg-[linear-gradient(135deg,#eb2f06,#ff6b4a)] px-5 py-1.5 text-[13px] font-bold text-white shadow-[0_10px_24px_rgba(235,47,6,0.25)] transition hover:-translate-y-0.5 disabled:opacity-60"
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
