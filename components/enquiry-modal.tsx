"use client";

import { useEffect, useState } from "react";
import { useOrganizationProfile } from "@/components/organization-profile-provider";
import { apiRequest } from "@/lib/api";
import { moveToNextFormField, resetEnterNavigationState } from "@/lib/enter-navigation";

export function EnquiryModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const { profile } = useOrganizationProfile();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    enquiryType: "General Enquiry",
    message: "",
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#091224]/62 p-4 backdrop-blur-sm">
      <div className="relative max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-[1.4rem] bg-white shadow-[0_30px_70px_rgba(9,18,36,0.3)]">
        <div className="bg-[linear-gradient(135deg,#273c75,#1e3799)] px-4 py-4 text-white md:px-5">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/14 text-base font-semibold text-white"
            aria-label="Close enquiry form"
          >
            x
          </button>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/72">
            Visitor Enquiry
          </p>
          <h2 className="display-font mt-1 text-2xl font-semibold">
            Send your message to {profile.short_name}.
          </h2>
        </div>

        <div className="p-4 md:p-5">
          <form
            className="grid gap-3"
            onKeyDown={moveToNextFormField}
            onBlurCapture={resetEnterNavigationState}
            onSubmit={async (event) => {
              event.preventDefault();
              setSubmitting(true);
              setSubmitted(false);
              setError("");

              try {
                await apiRequest("/contact-submissions/", {
                  method: "POST",
                  body: {
                    full_name: form.fullName,
                    email: form.email,
                    phone: form.phone,
                    subject: form.enquiryType,
                    message: form.message,
                  },
                });
                setSubmitted(true);
                setForm({
                  fullName: "",
                  phone: "",
                  email: "",
                  enquiryType: "General Enquiry",
                  message: "",
                });
              } catch (requestError) {
                setError(
                  requestError instanceof Error
                    ? requestError.message
                    : "Unable to send your enquiry right now.",
                );
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  Full Name
                </span>
                <input
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, fullName: event.target.value }))
                  }
                  className="w-full rounded-[0.85rem] border border-line bg-[#f7f9ff] px-3.5 py-2.5 text-sm outline-none transition focus:border-primary-soft"
                  placeholder="Your full name"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  Phone Number
                </span>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, phone: event.target.value }))
                  }
                  className="w-full rounded-[0.85rem] border border-line bg-[#f7f9ff] px-3.5 py-2.5 text-sm outline-none transition focus:border-primary-soft"
                  placeholder="+977-98XXXXXXXX"
                />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  Email Address
                </span>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, email: event.target.value }))
                  }
                  className="w-full rounded-[0.85rem] border border-line bg-[#f7f9ff] px-3.5 py-2.5 text-sm outline-none transition focus:border-primary-soft"
                  placeholder="name@example.com"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  Enquiry Type
                </span>
                <div className="relative">
                  <select
                    value={form.enquiryType}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, enquiryType: event.target.value }))
                    }
                    className="w-full appearance-none rounded-[0.85rem] border border-line bg-[#f7f9ff] px-3.5 py-2.5 pr-12 text-sm outline-none transition focus:border-primary-soft"
                  >
                    <option>General Enquiry</option>
                    <option>Membership</option>
                    <option>Partnership</option>
                    <option>Event Support</option>
                  </select>
                  <span className="admin-select-arrow pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-500" />
                </div>
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                Message
              </span>
              <textarea
                required
                rows={3}
                value={form.message}
                onChange={(event) =>
                  setForm((current) => ({ ...current, message: event.target.value }))
                }
                className="w-full rounded-[0.85rem] border border-line bg-[#f7f9ff] px-3.5 py-2.5 text-sm outline-none transition focus:border-primary-soft"
                placeholder={`Tell us how ${profile.short_name} can help you.`}
              />
            </label>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex min-h-[2.5rem] items-center justify-center rounded-full bg-[linear-gradient(135deg,#273c75,#1e3799)] px-4.5 py-2.5 text-sm font-bold text-white shadow-[0_14px_28px_rgba(30,55,153,0.22)]"
              >
                {submitting ? "Sending..." : "Submit Enquiry"}
              </button>
            </div>
          </form>

          {error ? (
            <div className="mt-5 rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          ) : null}

          {submitted ? (
            <div className="mt-5 rounded-[1.2rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              Your enquiry has been sent successfully.
            </div>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 -z-10"
        aria-label="Close enquiry modal overlay"
      />
    </div>
  );
}

