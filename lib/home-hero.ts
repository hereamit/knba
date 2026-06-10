import { MEDIA_BASE_URL } from "@/lib/api";
import type { HeroSlide } from "@/lib/site-data";

export type HomeHeroImageRecord = {
  id?: number;
  title: string;
  image?: string | null;
  image_url?: string;
  image_src: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export function resolveHomeHeroImageSrc(src: string) {
  if (!src) {
    return "";
  }

  if (/^(https?:|blob:|data:)/i.test(src) || src.startsWith("/")) {
    return src;
  }

  return `${MEDIA_BASE_URL}${src.startsWith("/") ? src : `/${src}`}`;
}

export function normalizeHomeHeroImageRecord(
  record: Partial<HomeHeroImageRecord>,
  index = 0,
): HomeHeroImageRecord {
  const resolvedImageSource =
    record.image_src ??
    record.image_url ??
    (typeof record.image === "string" ? record.image : "");

  return {
    id: record.id,
    title: record.title ?? "",
    image: record.image ?? null,
    image_url: record.image_url ?? "",
    image_src: resolvedImageSource ?? "",
    display_order: record.display_order ?? index,
    is_active: record.is_active ?? true,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

export function mapHomeHeroImagesToSlider(records: HomeHeroImageRecord[]): HeroSlide[] {
  return records
    .filter((item) => item.is_active && item.image_src)
    .map((item, index) => ({
      eyebrow: "",
      title: item.title || `Hero ${index + 1}`,
      shortTitle: "",
      description: "",
      feature: "",
      image: resolveHomeHeroImageSrc(item.image_src),
      credit: "",
      primaryLabel: "",
      primaryHref: "",
      secondaryLabel: "",
      secondaryHref: "",
    }));
}
