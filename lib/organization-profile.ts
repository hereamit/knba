import { MEDIA_BASE_URL } from "@/lib/api";

export type OrganizationProfile = {
  id?: number;
  organization_name: string;
  short_name: string;
  office_address: string;
  phone_number: string;
  email: string;
  logo?: string | null;
  logo_url: string;
  map_embed_url: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export const defaultOrganizationProfile: OrganizationProfile = {
  organization_name: "Khichapokhari Newroad Business Association",
  short_name: "KNBA",
  office_address: "Khichapokhari, New Road, Kathmandu",
  phone_number: "+977-1-5350000",
  email: "secretariat@knba.org.np",
  logo: "",
  logo_url: "",
  map_embed_url: "",
  is_active: true,
};

export function resolveOrganizationImageSrc(src: string) {
  if (!src) {
    return "";
  }

  if (/^(https?:|blob:|data:)/i.test(src)) {
    return src;
  }

  if (src.startsWith("/media/")) {
    return `${MEDIA_BASE_URL}${src}`;
  }

  if (src.startsWith("/")) {
    return src;
  }

  return `${MEDIA_BASE_URL}${src.startsWith("/") ? src : `/${src}`}`;
}

// Returns the embeddable map URL taken ONLY from the organization profile
// setting. Accepts a full Google Maps `<iframe ... src="...">` snippet or a
// bare https URL. Returns "" when nothing valid is configured (no hardcoded
// fallback map).
export function resolveOrganizationMapEmbedSrc(value: string) {
  const rawValue = value.trim();

  if (!rawValue) {
    return "";
  }

  const iframeSrcMatch = rawValue.match(/src=["']([^"']+)["']/i);
  if (iframeSrcMatch?.[1]) {
    return iframeSrcMatch[1];
  }

  if (/^https?:\/\//i.test(rawValue)) {
    return rawValue;
  }

  return "";
}
