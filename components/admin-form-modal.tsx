"use client";

import { useEffect, type ReactNode } from "react";

export function AdminFormModal({
  title,
  subtitle,
  onClose,
  children,
  maxWidthClass = "max-w-3xl",
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  maxWidthClass?: string;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#091224]/62 p-4 backdrop-blur-sm">
      <div
        className={`relative max-h-[90vh] w-full overflow-y-auto rounded-[1.4rem] bg-white shadow-[0_30px_70px_rgba(9,18,36,0.3)] ${maxWidthClass}`}
      >
        <div className="bg-[linear-gradient(135deg,#273c75,#1e3799)] px-5 py-4 text-white">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/14 text-base font-semibold text-white transition hover:bg-white/24"
            aria-label="Close form"
          >
            x
          </button>
          <h2 className="text-lg font-semibold uppercase tracking-[0.08em]">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-white/72">{subtitle}</p> : null}
        </div>
        <div className="p-5 md:p-6">{children}</div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 -z-10"
        aria-label="Close form overlay"
      />
    </div>
  );
}
