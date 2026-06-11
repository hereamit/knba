type IconProps = {
  className?: string;
};

export function EditIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export function TrashIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

const ACTION_VARIANTS = {
  edit: { className: "admin-table-btn-edit", title: "Edit", Icon: EditIcon },
  delete: { className: "admin-table-btn-delete", title: "Delete", Icon: TrashIcon },
} as const;

export function AdminIconButton({
  variant,
  onClick,
  label,
}: {
  variant: keyof typeof ACTION_VARIANTS;
  onClick: () => void;
  label: string;
}) {
  const { className, title, Icon } = ACTION_VARIANTS[variant];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`admin-table-btn ${className} admin-table-btn-icon`}
      title={title}
      aria-label={label}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
