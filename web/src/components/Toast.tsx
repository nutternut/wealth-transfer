"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import clsx from "clsx";

type ToastTone = "success" | "error" | "info";

type ToastItem = {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
};

type ToastInput = {
  title: string;
  description?: string;
  tone?: ToastTone;
  durationMs?: number;
};

interface ToastContextValue {
  toast: (input: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_META: Record<
  ToastTone,
  { icon: typeof CheckCircle2; wrap: string; iconWrap: string }
> = {
  success: {
    icon: CheckCircle2,
    wrap: "border-mint-100 bg-white",
    iconWrap: "bg-mint-brand-light text-mint-brand-dark",
  },
  error: {
    icon: AlertTriangle,
    wrap: "border-rose-100 bg-white",
    iconWrap: "bg-rose-50 text-rose-600",
  },
  info: {
    icon: Info,
    wrap: "border-sky-100 bg-white",
    iconWrap: "bg-sky-50 text-sky-700",
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const item: ToastItem = {
        id,
        title: input.title,
        description: input.description,
        tone: input.tone ?? "success",
      };
      setItems((prev) => [...prev.slice(-3), item]);
      window.setTimeout(() => dismiss(id), input.durationMs ?? 3200);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted
        ? createPortal(
            <div
              className="pointer-events-none fixed inset-x-0 bottom-0 z-[300] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
              aria-live="polite"
              aria-relevant="additions"
            >
              {items.map((item) => {
                const meta = TONE_META[item.tone];
                const Icon = meta.icon;
                return (
                  <div
                    key={item.id}
                    className={clsx(
                      "toast-item pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 shadow-[0_16px_40px_-18px_rgba(15,23,42,0.35)]",
                      meta.wrap,
                    )}
                    role="status"
                  >
                    <div
                      className={clsx(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                        meta.iconWrap,
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-800">
                        {item.title}
                      </div>
                      {item.description ? (
                        <div className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                          {item.description}
                        </div>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className="rounded-lg p-1 text-slate-300 transition hover:bg-slate-50 hover:text-slate-500"
                      onClick={() => dismiss(item.id)}
                      aria-label="ปิดการแจ้งเตือน"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
