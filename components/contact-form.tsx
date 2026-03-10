"use client";

import { useState } from "react";
import { apiRequest } from "@/lib/api";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    subject: "",
    message: "",
  });

  return (
    <section className="panel rounded-[2rem] p-6 md:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-soft">
        Send Message
      </p>
      <h2 className="mt-4 text-4xl font-bold text-primary">
        Contact the association office.
      </h2>
      <p className="mt-4 text-sm leading-8 text-muted">
        Send your inquiry to the KNBA office and the message will be delivered
        to the admin inbox.
      </p>

      <form
        className="mt-8 space-y-5"
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
                phone: "",
                subject: form.subject,
                message: form.message,
              },
            });
            setSubmitted(true);
            setForm({
              fullName: "",
              email: "",
              subject: "",
              message: "",
            });
          } catch (requestError) {
            setError(
              requestError instanceof Error
                ? requestError.message
                : "Unable to send your inquiry right now.",
            );
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-primary">
              Full Name
            </span>
            <input
              type="text"
              required
              value={form.fullName}
              onChange={(event) =>
                setForm((current) => ({ ...current, fullName: event.target.value }))
              }
              className="w-full rounded-[1rem] border border-line bg-[#f7f9ff] px-4 py-3 outline-none transition focus:border-primary"
              placeholder="Your name"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-primary">
              Email Address
            </span>
            <input
              type="email"
              required
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
              className="w-full rounded-[1rem] border border-line bg-[#f7f9ff] px-4 py-3 outline-none transition focus:border-primary"
              placeholder="name@example.com"
            />
          </label>
        </div>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-primary">
            Subject
          </span>
          <input
            type="text"
            required
            value={form.subject}
            onChange={(event) =>
              setForm((current) => ({ ...current, subject: event.target.value }))
            }
            className="w-full rounded-[1rem] border border-line bg-[#f7f9ff] px-4 py-3 outline-none transition focus:border-primary"
            placeholder="What do you need help with?"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-primary">
            Message
          </span>
          <textarea
            required
            rows={6}
            value={form.message}
            onChange={(event) =>
              setForm((current) => ({ ...current, message: event.target.value }))
            }
            className="w-full rounded-[1rem] border border-line bg-[#f7f9ff] px-4 py-3 outline-none transition focus:border-primary"
            placeholder="Write your message here"
          />
        </label>
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? "Sending..." : "Submit Inquiry"}
        </button>
      </form>

      {error ? (
        <div className="mt-5 rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      {submitted ? (
        <div className="mt-5 rounded-[1.2rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Your inquiry has been sent successfully.
        </div>
      ) : null}
    </section>
  );
}
