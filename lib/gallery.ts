import { MEDIA_BASE_URL } from "@/lib/api";

export type GalleryRecord = {
  id?: number;
  title: string;
  category: string;
  description: string;
  image?: string | null;
  image_url?: string;
  image_src: string;
  is_featured: boolean;
  display_order: number;
  is_active: boolean;
};

type GalleryApiRecord = Partial<GalleryRecord> & {
  image_url?: string;
  image_src?: string;
};

export function resolveGalleryImageSrc(src: string) {
  if (!src) {
    return "";
  }

  if (/^(https?:|blob:|data:)/i.test(src) || src.startsWith("/")) {
    return src;
  }

  return `${MEDIA_BASE_URL}${src.startsWith("/") ? src : `/${src}`}`;
}

export function normalizeGalleryRecord(record: GalleryApiRecord, index = 0): GalleryRecord {
  const resolvedImageSource =
    record.image_src ??
    record.image_url ??
    (typeof record.image === "string" ? record.image : "");

  return {
    id: record.id ?? index + 1,
    title: record.title ?? "Gallery Image",
    category: record.category ?? "General",
    description: record.description ?? "",
    image: record.image ?? null,
    image_url: record.image_url ?? "",
    image_src: resolvedImageSource,
    is_featured: Boolean(record.is_featured),
    display_order: record.display_order ?? index + 1,
    is_active: record.is_active ?? true,
  };
}
