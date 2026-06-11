"use client";

import { useEffect } from "react";

export function AdminSavedModal({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2200);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Enter") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#091224]/62 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-[1.6rem] bg-white p-8 text-center shadow-[0_30px_70px_rgba(9,18,36,0.3)]">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <svg
            className="h-12 w-12 text-emerald-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12.5l2.5 2.5 5-5.5" />
          </svg>
        </div>
        <h2 className="mt-5 text-xl font-bold text-slate-800">Saved successfully</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {message || "Your record was saved successfully."}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="admin-master-btn admin-master-btn-primary mt-6 w-full justify-center"
        >
          Close
        </button>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 -z-10"
        aria-label="Close confirmation"
      />
    </div>
  );
}
