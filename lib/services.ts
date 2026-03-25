import { serviceHighlights } from "@/lib/site-data";

export type ServiceRecord = {
  id?: number;
  tag: string;
  title: string;
  description: string;
  points: string[];
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export const fallbackServiceRecords: ServiceRecord[] = serviceHighlights.map(
  (item, index) => ({
    id: index + 1,
    tag: item.tag,
    title: item.title,
    description: item.description,
    points: item.points,
    display_order: index + 1,
    is_active: true,
  }),
);

export function normalizeServiceRecord(record: Partial<ServiceRecord>, index = 0): ServiceRecord {
  const points = Array.isArray(record.points)
    ? record.points.filter((point): point is string => typeof point === "string" && point.trim().length > 0)
    : [];

  return {
    id: record.id,
    tag: record.tag ?? "Service",
    title: record.title ?? "Association Service",
    description: record.description ?? "",
    points,
    display_order: record.display_order ?? index + 1,
    is_active: record.is_active ?? true,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

export function sortServices(records: ServiceRecord[]) {
  return [...records].sort((left, right) => left.display_order - right.display_order);
}
