import {
  normalizeMemberRecord,
  type MemberRecord,
} from "@/lib/members";
import {
  defaultSiteSettings,
  normalizeSiteSettingsRecord,
  type SiteSettingsRecord,
} from "@/lib/site-settings";

export type AboutStatsRecord = {
  connected_businesses: number;
  committee_members: number;
  general_members: number;
  leadership_members: number;
  executive_members: number;
  advisory_members: number;
};

export type AboutPageRecord = {
  settings: SiteSettingsRecord;
  founder: MemberRecord | null;
  president: MemberRecord | null;
  current_term_label: string;
  current_term_start_year?: number;
  current_term_end_year?: number;
  stats: AboutStatsRecord;
};

export const defaultAboutStats: AboutStatsRecord = {
  connected_businesses: 0,
  committee_members: 0,
  general_members: 0,
  leadership_members: 0,
  executive_members: 0,
  advisory_members: 0,
};

export const defaultAboutPageRecord: AboutPageRecord = {
  settings: defaultSiteSettings,
  founder: null,
  president: null,
  current_term_label: "",
  current_term_start_year: undefined,
  current_term_end_year: undefined,
  stats: defaultAboutStats,
};

export function normalizeAboutPageRecord(record: unknown): AboutPageRecord {
  const payload = record && typeof record === "object" ? record : {};
  const currentTerm =
    "current_term" in payload &&
    payload.current_term &&
    typeof payload.current_term === "object"
      ? (payload.current_term as {
          label?: string;
          start_year?: number;
          end_year?: number;
        })
      : {};
  const rawStats =
    "stats" in payload && payload.stats && typeof payload.stats === "object"
      ? (payload.stats as Partial<AboutStatsRecord>)
      : {};

  return {
    settings: normalizeSiteSettingsRecord(
      "settings" in payload && payload.settings && typeof payload.settings === "object"
        ? (payload.settings as Partial<SiteSettingsRecord>)
        : {},
    ),
    founder:
      "founder" in payload && payload.founder && typeof payload.founder === "object"
        ? normalizeMemberRecord(payload.founder as Partial<MemberRecord>)
        : null,
    president:
      "president" in payload && payload.president && typeof payload.president === "object"
        ? normalizeMemberRecord(payload.president as Partial<MemberRecord>)
        : null,
    current_term_label:
      typeof currentTerm.label === "string" ? currentTerm.label : "",
    current_term_start_year:
      typeof currentTerm.start_year === "number" ? currentTerm.start_year : undefined,
    current_term_end_year:
      typeof currentTerm.end_year === "number" ? currentTerm.end_year : undefined,
    stats: {
      connected_businesses:
        typeof rawStats.connected_businesses === "number"
          ? rawStats.connected_businesses
          : 0,
      committee_members:
        typeof rawStats.committee_members === "number" ? rawStats.committee_members : 0,
      general_members:
        typeof rawStats.general_members === "number" ? rawStats.general_members : 0,
      leadership_members:
        typeof rawStats.leadership_members === "number"
          ? rawStats.leadership_members
          : 0,
      executive_members:
        typeof rawStats.executive_members === "number"
          ? rawStats.executive_members
          : 0,
      advisory_members:
        typeof rawStats.advisory_members === "number"
          ? rawStats.advisory_members
          : 0,
    },
  };
}
