"use client";

import { useState, useCallback } from "react";
import { Modal } from "@/components/modal";

type ConfirmState = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive: boolean;
  onConfirm: () => void | Promise<void>;
};

type ConfirmOptions = Partial<Omit<ConfirmState, "onConfirm">> & {
  onConfirm: () => void | Promise<void>;
};

export function useConfirm() {
  const [state, setState] = useState<ConfirmState | null>(null);
  const [working, setWorking] = useState(false);

  const confirm = useCallback((options: ConfirmOptions) => {
    setState({
      title: options.title ?? "Are you sure?",
      message: options.message ?? "This action cannot be undone.",
      confirmLabel: options.confirmLabel ?? "Confirm",
      cancelLabel: options.cancelLabel ?? "Cancel",
      destructive: options.destructive ?? true,
      onConfirm: options.onConfirm,
    });
  }, []);

  const close = useCallback(() => {
    if (!working) setState(null);
  }, [working]);

  const runConfirm = useCallback(async () => {
    if (!state) return;
    setWorking(true);
    try {
      await state.onConfirm();
      setState(null);
    } finally {
      setWorking(false);
    }
  }, [state]);

  const dialog = state ? (
    <Modal open={true} onClose={close} title={state.title} size="sm">
      <p className="text-sm leading-6 text-slate-600">{state.message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={close}
          disabled={working}
          className="admin-master-btn admin-master-btn-secondary"
        >
          {state.cancelLabel}
        </button>
        <button
          type="button"
          onClick={runConfirm}
          disabled={working}
          className={`admin-master-btn ${
            state.destructive
              ? "admin-master-btn-primary bg-rose-600 hover:bg-rose-700"
              : "admin-master-btn-primary"
          }`}
        >
          {working ? "Working..." : state.confirmLabel}
        </button>
      </div>
    </Modal>
  ) : null;

  return { confirm, dialog };
}
