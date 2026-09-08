import { formatBahtCompact } from "@/lib/format";
import { AlertTriangle, CheckCircle2, Clock3, Wallet } from "lucide-react";

interface SummaryCardsProps {
  totalValue: number;
  count: number;
  pendingDecision: number;
  pendingReview: number;
  outdated: number;
}

export function SummaryCards({
  totalValue,
  count,
  pendingDecision,
  pendingReview,
  outdated,
}: SummaryCardsProps) {
  const items = [
    {
      label: "มูลค่ารวม",
      value: formatBahtCompact(totalValue),
      hint: `${count} รายการ`,
      icon: Wallet,
      tone: "text-mint-brand bg-mint-brand-light",
    },
    {
      label: "รอตัดสินใจ",
      value: String(pendingDecision),
      hint: "โอน / ขาย / คงไว้",
      icon: Clock3,
      tone: "text-amber-600 bg-amber-50",
    },
    {
      label: "รอตรวจทาน",
      value: String(pendingReview),
      hint: "ส่งผู้เชี่ยวชาญแล้ว",
      icon: CheckCircle2,
      tone: "text-sky-600 bg-sky-50",
    },
    {
      label: "ข้อมูลไม่อัปเดต",
      value: String(outdated),
      hint: "ราคาประเมินเก่า",
      icon: AlertTriangle,
      tone: "text-rose-600 bg-rose-50",
    },
  ];

  return (
    <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-3.5 sm:p-5"
          >
            <div className="mb-3 flex items-start justify-between gap-2 sm:mb-4">
              <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase sm:text-[11px]">
                {item.label}
              </p>
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:h-9 sm:w-9 ${item.tone}`}
              >
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
            </div>
            <p className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              {item.value}
            </p>
            <p className="mt-1 text-[11px] text-slate-400 sm:text-xs">
              {item.hint}
            </p>
          </div>
        );
      })}
    </div>
  );
}
