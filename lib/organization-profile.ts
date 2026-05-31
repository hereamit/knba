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
  map_embed_url:
    "https://www.google.com/maps?q=Khichapokhari%20New%20Road%20Kathmandu&output=embed",
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

export function resolveOrganizationMapEmbedSrc(value: string) {
  const rawValue = value.trim();

  if (!rawValue) {
    return defaultOrganizationProfile.map_embed_url;
  }

  const iframeSrcMatch = rawValue.match(/src=["']([^"']+)["']/i);
  if (iframeSrcMatch?.[1]) {
    return iframeSrcMatch[1];
  }

  if (/^https?:\/\//i.test(rawValue)) {
    return rawValue;
  }

  return defaultOrganizationProfile.map_embed_url;
}
