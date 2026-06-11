"use client";

import { useMemo, useRef, useState } from "react";
import { Modal } from "@/components/modal";
import { NepalFlagIcon } from "@/components/nepal-flag-icon";
import { API_BASE_URL } from "@/lib/api";
import { findMemberRole, memberRoleOptions } from "@/lib/member-roles";

type FormState = {
  submitter_name: string;
  submitter_email: string;
  submitter_phone: string;
  name: string;
  role: string;
  category: "leadership" | "executive" | "advisory";
  phone: string;
  email: string;
  note: string;
};

const NEPAL_COUNTRY_CODE = "+977";

const emptyForm: FormState = {
  submitter_name: "",
  submitter_email: "",
  submitter_phone: "",
  name: "",
  role: "",
  category: "executive",
  phone: "",
  email: "",
  note: "",
};

function toTitleCase(value: string) {
  return value.replace(/\b([a-z])/g, (match) => match.toUpperCase());
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function MemberSubmissionModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitterIsMember, setSubmitterIsMember] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [submitterPhoneError, setSubmitterPhoneError] = useState("");
  const [memberPhoneError, setMemberPhoneError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleRoleSelect = (value: string) => {
    const meta = findMemberRole(value);
    setForm((current) => ({
      ...current,
      role: value,
      category: meta ? meta.category : current.category,
    }));
  };

  const handleSubmitterPhone = (raw: string) => {
    const digits = onlyDigits(raw).slice(0, 10);
    update("submitter_phone", digits);
    if (digits.length === 0 || digits.length === 10) {
      setSubmitterPhoneError("");
    } else {
      setSubmitterPhoneError("Enter exactly 10 digits after +977.");
    }
  };

  const handleMemberPhone = (raw: string) => {
    const digits = onlyDigits(raw).slice(0, 10);
    update("phone", digits);
    if (digits.length === 10) {
      setMemberPhoneError("");
    } else {
      setMemberPhoneError("Enter exactly 10 digits after +977.");
    }
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setPhoto(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
      setPhotoError("");
    } else {
      setPhotoPreview("");
    }
  };

  const toggleSubmitterIsMember = (checked: boolean) => {
    setSubmitterIsMember(checked);
    if (checked) {
      setMemberPhoneError("");
    }
  };

  const effectiveForm = useMemo(() => {
    if (!submitterIsMember) return form;
    return {
      ...form,
      name: form.submitter_name,
      phone: form.submitter_phone,
      email: form.submitter_email,
    };
  }, [form, submitterIsMember]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (
      form.submitter_phone.length > 0 &&
      form.submitter_phone.length !== 10
    ) {
      setSubmitterPhoneError("Enter exactly 10 digits after +977.");
      setError("Please fix the highlighted fields before submitting.");
      return;
    }

    if (submitterIsMember) {
      if (form.submitter_phone.length !== 10) {
        setSubmitterPhoneError("Enter exactly 10 digits after +977.");
        setError("Phone number is required when you submit as yourself.");
        return;
      }
    } else {
      if (form.phone.length !== 10) {
        setMemberPhoneError("Enter exactly 10 digits after +977.");
        setError("Please fix the highlighted fields before submitting.");
        return;
      }
    }

    if (!photo) {
      setPhotoError("A photo is required.");
      setError("Please upload a member photo before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      const finalForm = effectiveForm;
      const fields: Array<[keyof FormState, string]> = [
        ["submitter_name", finalForm.submitter_name],
        ["submitter_email", finalForm.submitter_email],
        [
          "submitter_phone",
          finalForm.submitter_phone
            ? `${NEPAL_COUNTRY_CODE}-${finalForm.submitter_phone}`
            : "",
        ],
        ["name", finalForm.name],
        ["role", finalForm.role],
        ["category", finalForm.category],
        ["phone", `${NEPAL_COUNTRY_CODE}-${finalForm.phone}`],
        ["email", finalForm.email],
        ["note", finalForm.note],
      ];
      fields.forEach(([key, value]) => payload.append(key, value));
      if (photo) payload.append("photo", photo);

      const response = await fetch(`${API_BASE_URL}/member-submissions/`, {
        method: "POST",
        body: payload,
      });

      if (!response.ok) {
        const text = await response.text();
        let message = "Unable to submit your details right now.";
        try {
          const data = JSON.parse(text);
          if (data?.detail) message = data.detail;
          else if (typeof data === "object" && data) {
            const firstField = Object.entries(data)[0];
            if (firstField) {
              const [field, value] = firstField;
              if (Array.isArray(value)) message = `${field}: ${value.join(" ")}`;
              else if (typeof value === "string") message = `${field}: ${value}`;
            }
          }
        } catch {
          if (text.trim()) message = text;
        }
        throw new Error(message);
      }

      setSubmitted(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to submit your details right now.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const phoneInputClasses =
    "w-full rounded-none border-0 bg-transparent px-3 py-2 text-sm outline-none focus:ring-0";

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Submit Your Member Details"
      size="lg"
    >
      {submitted ? (
        <div className="py-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600">
            ✓
          </div>
          <h3 className="mt-4 text-lg font-semibold text-primary">
            Thank you for your submission
          </h3>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            The KNBA admin team will review your details and contact you once a
            decision is made. You will see your profile published on the public
            members page if approved.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="btn-primary mt-6"
          >
            Close
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary-soft">
              Your Contact Info (submitter)
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <input
                type="text"
                required
                placeholder="Your name"
                value={form.submitter_name}
                onChange={(e) =>
                  update("submitter_name", toTitleCase(e.target.value))
                }
                className="rounded-[0.85rem] border border-line bg-[#f7f9ff] px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <input
                type="email"
                required
                placeholder="Your email"
                value={form.submitter_email}
                onChange={(e) => update("submitter_email", e.target.value)}
                className="rounded-[0.85rem] border border-line bg-[#f7f9ff] px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <div>
                <div className="flex items-center overflow-hidden rounded-[0.85rem] border border-line bg-[#f7f9ff]">
                  <span className="flex items-center gap-1 border-r border-line bg-white/60 px-2 text-xs font-semibold text-slate-600">
                    <NepalFlagIcon className="h-3.5 w-3.5" />
                    +977
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder={
                      submitterIsMember
                        ? "10-digit phone (required)"
                        : "Phone (optional)"
                    }
                    value={form.submitter_phone}
                    onChange={(e) => handleSubmitterPhone(e.target.value)}
                    className={phoneInputClasses}
                    required={submitterIsMember}
                  />
                </div>
                {submitterPhoneError ? (
                  <p className="mt-1 text-[0.7rem] font-medium text-rose-700">
                    {submitterPhoneError}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <label className="flex items-start gap-2 rounded-[1rem] border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm">
            <input
              type="checkbox"
              checked={submitterIsMember}
              onChange={(e) => toggleSubmitterIsMember(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-emerald-600"
            />
            <span className="text-emerald-900">
              <span className="font-semibold">I am submitting my own details.</span>
            </span>
          </label>

          {!submitterIsMember ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary-soft">
                Proposed Member Details
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  type="text"
                  required
                  placeholder="Full name as it should appear"
                  value={form.name}
                  onChange={(e) => update("name", toTitleCase(e.target.value))}
                  className="rounded-[0.85rem] border border-line bg-[#f7f9ff] px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <select
                  required
                  value={form.role}
                  onChange={(e) => handleRoleSelect(e.target.value)}
                  className="rounded-[0.85rem] border border-line bg-[#f7f9ff] px-3 py-2 text-sm outline-none focus:border-primary md:col-span-2"
                >
                  <option value="">Select role *</option>
                  {memberRoleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div>
                  <div className="flex items-center overflow-hidden rounded-[0.85rem] border border-line bg-[#f7f9ff]">
                    <span className="flex items-center gap-1 border-r border-line bg-white/60 px-2 text-xs font-semibold text-slate-600">
                      <NepalFlagIcon className="h-3.5 w-3.5" />
                      +977
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      required
                      maxLength={10}
                      placeholder="10-digit phone"
                      value={form.phone}
                      onChange={(e) => handleMemberPhone(e.target.value)}
                      className={phoneInputClasses}
                    />
                  </div>
                  {memberPhoneError ? (
                    <p className="mt-1 text-[0.7rem] font-medium text-rose-700">
                      {memberPhoneError}
                    </p>
                  ) : null}
                </div>
                <input
                  type="email"
                  required
                  placeholder="Member email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  className="rounded-[0.85rem] border border-line bg-[#f7f9ff] px-3 py-2 text-sm outline-none focus:border-primary md:col-span-2"
                />
                <input
                  type="text"
                  placeholder="Short note (e.g. business name, special role) - optional"
                  value={form.note}
                  onChange={(e) => update("note", e.target.value)}
                  className="rounded-[0.85rem] border border-line bg-[#f7f9ff] px-3 py-2 text-sm outline-none focus:border-primary md:col-span-2"
                />
              </div>
            </div>
          ) : (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary-soft">
                Member Details (auto-filled from above)
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <select
                  required
                  value={form.role}
                  onChange={(e) => handleRoleSelect(e.target.value)}
                  className="rounded-[0.85rem] border border-line bg-[#f7f9ff] px-3 py-2 text-sm outline-none focus:border-primary md:col-span-2"
                >
                  <option value="">Select role *</option>
                  {memberRoleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Short note (e.g. business name) - optional"
                  value={form.note}
                  onChange={(e) => update("note", e.target.value)}
                  className="rounded-[0.85rem] border border-line bg-[#f7f9ff] px-3 py-2 text-sm outline-none focus:border-primary md:col-span-2"
                />
              </div>
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary-soft">
              Photo *
            </p>
            <div
              className={`flex items-center gap-3 rounded-[1rem] border border-dashed bg-white px-3 py-3 ${
                photoError ? "border-rose-400" : "border-slate-300"
              }`}
            >
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="btn-secondary px-4 py-2 text-xs"
              >
                Choose Photo
              </button>
              {photoPreview ? (
                <div className="h-12 w-12 overflow-hidden rounded-xl border border-slate-200">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  Required. JPG/PNG/WebP.
                </p>
              )}
            </div>
            {photoError ? (
              <p className="mt-1 text-[0.7rem] font-medium text-rose-700">
                {photoError}
              </p>
            ) : null}
          </div>

          {error ? (
            <div className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Submitting..." : "Submit For Review"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
