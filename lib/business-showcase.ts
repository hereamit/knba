import { MEDIA_BASE_URL } from "@/lib/api";

export type BusinessShowcaseRecord = {
  id?: number;
  name: string;
  category: string;
  description: string;
  phone: string;
  address: string;
  image?: string | null;
  image_url?: string;
  image_src: string;
  badge: string;
  website_url: string;
  facebook_url: string;
  instagram_url: string;
  ecommerce_url: string;
  is_featured: boolean;
  display_order: number;
  is_active: boolean;
  created_at?: string;
};

export function resolveBusinessShowcaseImageSrc(src: string) {
  if (!src) {
    return "";
  }

  if (/^(https?:|blob:|data:)/i.test(src) || src.startsWith("/")) {
    return src;
  }

  return `${MEDIA_BASE_URL}${src.startsWith("/") ? src : `/${src}`}`;
}

export function normalizeBusinessShowcaseRecord(
  record: Partial<BusinessShowcaseRecord>,
): BusinessShowcaseRecord {
  const resolvedImageSource =
    record.image_src ??
    record.image_url ??
    (typeof record.image === "string" ? record.image : "");

  return {
    id: record.id,
    name: record.name ?? "Business Listing",
    category: record.category ?? "General",
    description: record.description ?? "",
    phone: record.phone ?? "",
    address: record.address ?? "",
    image: record.image ?? null,
    image_url: record.image_url ?? "",
    image_src: resolvedImageSource,
    badge: record.badge ?? "Business Showcase",
    website_url: record.website_url ?? "",
    facebook_url: record.facebook_url ?? "",
    instagram_url: record.instagram_url ?? "",
    ecommerce_url: record.ecommerce_url ?? "",
    is_featured: Boolean(record.is_featured),
    display_order: record.display_order ?? 0,
    is_active: record.is_active ?? true,
    created_at: record.created_at ?? "",
  };
}

export function mapBusinessShowcaseRecordToCard(record: BusinessShowcaseRecord) {
  const socialLinks = [
    ...(record.facebook_url
      ? [{ label: "Facebook", href: record.facebook_url }]
      : []),
    ...(record.instagram_url
      ? [{ label: "Instagram", href: record.instagram_url }]
      : []),
    ...(record.ecommerce_url ? [{ label: "Shop", href: record.ecommerce_url }] : []),
  ];

  return {
    name: record.name,
    category: record.category,
    description: record.description,
    phone: record.phone,
    address: record.address,
    image: resolveBusinessShowcaseImageSrc(record.image_src || (typeof record.image === "string" ? record.image : "")),
    badge: record.badge,
    websiteUrl: record.website_url || record.ecommerce_url || undefined,
    socialLinks,
    featured: record.is_featured,
  };
}

