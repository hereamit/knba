export type MemberCategory = "leadership" | "executive" | "advisory";

export type MemberRoleOption = {
  value: string;
  label: string;
  category: MemberCategory;
  display_order: number | null;
  max_count: number;
};

export const memberRoleOptions: MemberRoleOption[] = [
  {
    value: "President",
    label: "President",
    category: "leadership",
    display_order: 1,
    max_count: 1,
  },
  {
    value: "Founding President",
    label: "Founding President",
    category: "leadership",
    display_order: 2,
    max_count: 1,
  },
  {
    value: "Immediate Past President",
    label: "Immediate Past President",
    category: "leadership",
    display_order: 3,
    max_count: 1,
  },
  {
    value: "Past President",
    label: "Past President",
    category: "leadership",
    display_order: 4,
    max_count: 1,
  },
  {
    value: "Senior Vice President",
    label: "Senior Vice President",
    category: "leadership",
    display_order: 5,
    max_count: 1,
  },
  {
    value: "First Vice President",
    label: "First Vice President",
    category: "leadership",
    display_order: 6,
    max_count: 1,
  },
  {
    value: "Second Vice President",
    label: "Second Vice President",
    category: "leadership",
    display_order: 7,
    max_count: 1,
  },
  {
    value: "General Secretary",
    label: "General Secretary",
    category: "leadership",
    display_order: 8,
    max_count: 1,
  },
  {
    value: "Secretary",
    label: "Secretary",
    category: "leadership",
    display_order: 9,
    max_count: 1,
  },
  {
    value: "Treasurer",
    label: "Treasurer",
    category: "leadership",
    display_order: 10,
    max_count: 1,
  },
  {
    value: "Joint Treasurer",
    label: "Joint Treasurer",
    category: "leadership",
    display_order: 11,
    max_count: 1,
  },
  {
    value: "Executive Committee Member",
    label: "Executive Committee Member",
    category: "executive",
    display_order: null,
    max_count: 14,
  },
  {
    value: "Advisor",
    label: "Advisor",
    category: "advisory",
    display_order: null,
    max_count: 12,
  },
  {
    value: "Legal Advisor",
    label: "Legal Advisor",
    category: "advisory",
    display_order: null,
    max_count: 1,
  },
];

export function findMemberRole(value: string): MemberRoleOption | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return memberRoleOptions.find(
    (option) =>
      option.value === trimmed ||
      option.label === trimmed ||
      option.label.toLowerCase() === trimmed.toLowerCase(),
  );
}
