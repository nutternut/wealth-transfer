import { AlertTriangle } from "lucide-react";

export function AlertBanner({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null;

  return (
    <div
      role="status"
      className="mb-8 flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4 text-xs text-amber-800"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="flex-1 leading-relaxed font-medium">{messages.join(" และ ")}</p>
      <span className="shrink-0 text-[11px] text-amber-600/80">
        ดูทั้งหมด ({messages.length})
      </span>
    </div>
  );
}
