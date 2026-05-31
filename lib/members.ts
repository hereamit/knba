import { MEDIA_BASE_URL } from "@/lib/api";

export type MemberTermRecord = {
  id?: number;
  label: string;
  start_year: number;
  end_year: number;
  display_order: number;
  is_current: boolean;
  is_active: boolean;
  member_count?: number;
};

export type MemberRecord = {
  id?: number;
  term?: number | null;
  term_label?: string;
  term_start_year?: number;
  term_end_year?: number;
  name: string;
  category: string;
  category_label?: string;
  role: string;
  phone: string;
  email: string;
  note?: string;
  photo?: string | null;
  photo_url?: string;
  photo_src: string;
  display_order: number;
  is_active: boolean;
};

export function resolveMemberPhotoSrc(src: string) {
  if (!src) {
    return "";
  }

  if (/^(https?:|blob:|data:)/i.test(src) || src.startsWith("/")) {
    return src;
  }

  return `${MEDIA_BASE_URL}${src.startsWith("/") ? src : `/${src}`}`;
}

export function normalizeMemberRecord(record: Partial<MemberRecord>) {
  const resolvedPhotoSource =
    record.photo_src ??
    record.photo_url ??
    (typeof record.photo === "string" ? record.photo : "");

  return {
    id: record.id,
    term: record.term ?? null,
    term_label: record.term_label ?? "",
    term_start_year: record.term_start_year ?? undefined,
    term_end_year: record.term_end_year ?? undefined,
    name: record.name ?? "Committee Member",
    category: record.category ?? "executive",
    category_label: record.category_label ?? "",
    role: record.role ?? "Member",
    phone: record.phone ?? "",
    email: record.email ?? "",
    note: record.note ?? "",
    photo: record.photo ?? null,
    photo_url: record.photo_url ?? "",
    photo_src: resolvedPhotoSource,
    display_order: record.display_order ?? 0,
    is_active: record.is_active ?? true,
} satisfies MemberRecord;
}

export function sortMembers(records: MemberRecord[]) {
  return [...records].sort((left, right) => left.display_order - right.display_order);
}

export function normalizeMemberTermRecord(record: Partial<MemberTermRecord>) {
  return {
    id: record.id,
    label: record.label ?? "",
    start_year: record.start_year ?? 0,
    end_year: record.end_year ?? 0,
    display_order: record.display_order ?? 0,
    is_current: record.is_current ?? false,
    is_active: record.is_active ?? true,
    member_count: record.member_count ?? 0,
  } satisfies MemberTermRecord;
}
