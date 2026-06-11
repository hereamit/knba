"use client";

import { NepalFlagIcon } from "@/components/nepal-flag-icon";
import {
  type PhoneEntry,
  type PhoneType,
  createPhoneEntry,
  sanitizePhoneDigits,
} from "@/lib/phone";

type Tone = "admin" | "light";

type PhoneNumbersInputProps = {
  entries: PhoneEntry[];
  onChange: (entries: PhoneEntry[]) => void;
  tone?: Tone;
  error?: string;
};

const toneStyles: Record<
  Tone,
  {
    select: string;
    fieldWrap: string;
    prefix: string;
    input: string;
    addBtn: string;
    removeBtn: string;
    error: string;
  }
> = {
  admin: {
    select: "admin-master-input appearance-none w-[5.6rem] shrink-0 pr-7",
    fieldWrap:
      "flex min-w-0 flex-1 items-center overflow-hidden rounded-[0.9rem] border border-[rgba(39,60,117,0.12)] bg-white",
    prefix:
      "flex min-h-[1.8rem] items-center gap-1 border-r border-[rgba(39,60,117,0.1)] px-2 text-sm leading-none text-slate-600",
    input:
      "admin-master-input min-w-0 rounded-none border-0 shadow-none focus:shadow-none",
    addBtn:
      "admin-master-btn admin-master-btn-secondary min-h-[1.65rem] px-3 py-1 text-[0.62rem] font-medium",
    removeBtn:
      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-rose-200 bg-white text-base leading-none text-rose-600 transition hover:bg-rose-50",
    error: "mt-1 text-[0.68rem] font-medium text-rose-700",
  },
  light: {
    select:
      "w-[7rem] shrink-0 rounded-[0.95rem] border border-line bg-[#f7f9ff] px-3 py-3 text-sm outline-none transition focus:border-primary-soft",
    fieldWrap:
      "flex min-w-0 flex-1 items-center overflow-hidden rounded-[0.95rem] border border-line bg-[#f7f9ff]",
    prefix:
      "flex items-center gap-1 border-r border-line px-3 py-3 text-sm font-semibold text-primary",
    input: "min-w-0 w-full bg-transparent px-4 py-3 text-sm outline-none",
    addBtn:
      "inline-flex items-center gap-1 rounded-full border border-line px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary transition hover:border-primary-soft",
    removeBtn:
      "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-white text-base leading-none text-rose-600 transition hover:border-rose-300",
    error: "mt-1 text-xs font-medium text-rose-700",
  },
};

export function PhoneNumbersInput({
  entries,
  onChange,
  tone = "admin",
  error,
}: PhoneNumbersInputProps) {
  const styles = toneStyles[tone];

  const updateEntry = (id: string, patch: Partial<PhoneEntry>) => {
    onChange(entries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  };

  const removeEntry = (id: string) => {
    const next = entries.filter((entry) => entry.id !== id);
    onChange(next.length ? next : [createPhoneEntry("mobile")]);
  };

  const addEntry = () => {
    onChange([...entries, createPhoneEntry("mobile")]);
  };

  return (
    <div className="space-y-2">
      {entries.map((entry) => {
        const isMobile = entry.type === "mobile";

        return (
          <div key={entry.id} className="flex items-center gap-2">
            <div className="relative shrink-0">
              <select
                value={entry.type}
                onChange={(event) =>
                  updateEntry(entry.id, { type: event.target.value as PhoneType })
                }
                className={`${styles.select} appearance-none`}
                aria-label="Phone number type"
              >
                <option value="mobile">Mobile</option>
                <option value="landline">Landline</option>
              </select>
              <span className="admin-select-arrow pointer-events-none absolute inset-y-0 right-2 flex items-center text-slate-500" />
            </div>

            <div className={styles.fieldWrap}>
              {isMobile ? (
                <span className={styles.prefix}>
                  <NepalFlagIcon className="h-4 w-4" />
                  +977
                </span>
              ) : null}
              <input
                type="text"
                inputMode="numeric"
                value={entry.value}
                onChange={(event) =>
                  updateEntry(entry.id, { value: sanitizePhoneDigits(event.target.value) })
                }
                placeholder={isMobile ? "98XXXXXXXX" : "01XXXXXXX"}
                className={styles.input}
              />
            </div>

            <button
              type="button"
              onClick={() => removeEntry(entry.id)}
              className={styles.removeBtn}
              aria-label="Remove this number"
            >
              &times;
            </button>
          </div>
        );
      })}

      <button type="button" onClick={addEntry} className={styles.addBtn}>
        + Add number
      </button>

      {error ? <p className={styles.error}>{error}</p> : null}
    </div>
  );
}
