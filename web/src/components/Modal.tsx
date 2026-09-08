"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import clsx from "clsx";

type ModalTone = "mint" | "rose" | "slate";

const TONE_HEADER: Record<ModalTone, string> = {
  mint: "border-mint-100 bg-mint-brand-light text-mint-brand-dark",
  rose: "border-rose-100 bg-rose-50 text-rose-700",
  slate: "border-slate-100 bg-slate-50 text-slate-700",
};

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: ReactNode;
  tone?: ModalTone;
  size?: "sm" | "md";
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  icon,
  tone = "mint",
  size = "md",
  children,
  footer,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const titleId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[220] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="absolute inset-0 z-0 bg-slate-900/45 backdrop-blur-[3px] transition-opacity"
        aria-label="ปิด"
        onClick={onClose}
      />

      <div
        className={clsx(
          "modal-panel relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-slate-100 bg-white shadow-2xl sm:rounded-3xl",
          size === "sm" ? "sm:max-w-md" : "sm:max-w-lg",
        )}
      >
        <div
          className={clsx(
            "flex items-start justify-between gap-3 border-b px-5 py-4 sm:px-6",
            TONE_HEADER[tone],
          )}
        >
          <div className="flex min-w-0 items-start gap-3">
            {icon ? (
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                {icon}
              </div>
            ) : null}
            <div className="min-w-0">
              <h3 id={titleId} className="text-sm font-bold tracking-tight">
                {title}
              </h3>
              {description ? (
                <p className="mt-0.5 text-[11px] leading-relaxed opacity-80">
                  {description}
                </p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-current/50 transition hover:bg-white/80 hover:text-current"
            aria-label="ปิด"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {children}
        </div>

        {footer ? (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-50 bg-slate-50/70 px-5 py-4 sm:px-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
