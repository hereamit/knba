import { galleryItems as fallbackGalleryItems } from "@/lib/site-data";
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
  show_in_slider: boolean;
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

export const fallbackGalleryRecords: GalleryRecord[] = fallbackGalleryItems.map(
  (item, index) => ({
    id: index + 1,
    title: item.title,
    category: item.category,
    description: item.description,
    image_src: item.src,
    is_featured: index < 5,
    show_in_slider: index < 5,
    display_order: index + 1,
    is_active: true,
  }),
);

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
    show_in_slider: Boolean(record.show_in_slider),
    display_order: record.display_order ?? index + 1,
    is_active: record.is_active ?? true,
  };
}

export function mapGalleryRecordsToSlider(records: GalleryRecord[]) {
  return records
    .filter((item) => item.show_in_slider && item.image_src)
    .slice(0, 5)
    .map((item) => ({
      eyebrow: item.category,
      title: item.title,
      shortTitle: item.category,
      description: item.description,
      feature: "",
      image: resolveGalleryImageSrc(item.image_src),
      credit: "",
      primaryLabel: "",
      primaryHref: "",
      secondaryLabel: "",
      secondaryHref: "",
    }));
}
