// Shared helpers for entering/storing/displaying one or more phone numbers.
//
// A business can have several numbers (mobile + landline). Numbers are stored
// in a single comma-separated string on the model, e.g.
//   "+977-9801234567, 014445555"
// Mobile numbers carry the +977 country code; landlines keep their leading area
// code (e.g. 01) and no country code. Validation is intentionally lenient — it
// only blocks empty/obviously-too-short entries, never a specific digit count.

export type PhoneType = "mobile" | "landline";

export type PhoneEntry = {
  id: string;
  type: PhoneType;
  value: string; // local digits only, no country code or separators
};

export const NEPAL_COUNTRY_CODE = "+977";
export const MIN_PHONE_DIGITS = 6;
export const MAX_PHONE_DIGITS = 15;

let phoneEntryCounter = 0;

export function sanitizePhoneDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, MAX_PHONE_DIGITS);
}

export function createPhoneEntry(type: PhoneType = "mobile", value = ""): PhoneEntry {
  phoneEntryCounter += 1;
  return { id: `phone-${phoneEntryCounter}`, type, value: sanitizePhoneDigits(value) };
}

// Split a stored string into its individual number fragments.
export function splitPhoneNumbers(stored: string): string[] {
  if (!stored) {
    return [];
  }

  return stored
    .split(/[,/]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

// Turn a stored string back into editable rows (used when editing a record).
export function parsePhoneEntries(stored: string): PhoneEntry[] {
  return splitPhoneNumbers(stored).map((part) => {
    const isMobile = /^\+?977/.test(part.replace(/\s+/g, ""));
    const digits = sanitizePhoneDigits(part);

    if (isMobile) {
      return createPhoneEntry("mobile", digits.replace(/^977/, ""));
    }
    return createPhoneEntry("landline", digits);
  });
}

// Guarantee at least one editable row so the form always renders an input.
export function ensurePhoneEntries(entries: PhoneEntry[]): PhoneEntry[] {
  return entries.length ? entries : [createPhoneEntry("mobile")];
}

// Collapse the editable rows into the single stored string, validating leniently.
export function summarizePhoneEntries(entries: PhoneEntry[]): {
  value: string;
  error: string;
} {
  const cleaned = entries
    .map((entry) => ({ type: entry.type, digits: sanitizePhoneDigits(entry.value) }))
    .filter((entry) => entry.digits.length > 0);

  if (cleaned.length === 0) {
    return { value: "", error: "Add at least one phone number." };
  }

  if (cleaned.some((entry) => entry.digits.length < MIN_PHONE_DIGITS)) {
    return {
      value: "",
      error: `Each phone number needs at least ${MIN_PHONE_DIGITS} digits.`,
    };
  }

  const value = cleaned
    .map((entry) =>
      entry.type === "mobile" ? `${NEPAL_COUNTRY_CODE}-${entry.digits}` : entry.digits,
    )
    .join(", ");

  return { value, error: "" };
}

// A `tel:` href that keeps only the dialable characters.
export function phoneTelHref(value: string): string {
  return `tel:${value.replace(/[^\d+]/g, "")}`;
}
