"use client";

import { useMemo } from "react";
import { ArrowUpRight, CalendarRange, CircleDot, Scale } from "lucide-react";
import { AlertBanner } from "@/components/AlertBanner";
import { PlanSidePanels } from "@/components/PlanSidePanels";
import { TransferTimeline } from "@/components/TransferTimeline";
import { useWealth } from "@/context/WealthContext";
import { formatBahtCompact } from "@/lib/format";

export default function TransferPlanPage() {
  const { transferSteps, reorderTransferSteps } = useWealth();

  const summary = useMemo(() => {
    const total = transferSteps.length;
    const done = transferSteps.filter((s) => s.status === "done").length;
    const review = transferSteps.filter((s) => s.status === "review").length;
    const taxKnown = transferSteps
      .map((s) => s.estimatedTax)
      .filter((t): t is number => t !== null);
    const taxSum = taxKnown.reduce((a, b) => a + b, 0);
    const progress = total === 0 ? 0 : Math.round((done / total) * 100);
    return { total, done, review, taxSum, progress, taxCount: taxKnown.length };
  }, [transferSteps]);

  return (
    <div className="plan-page">
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div className="max-w-xl">
          <p className="mb-2 text-[11px] font-semibold tracking-[0.14em] text-mint-brand uppercase">
            แผนโอนมรดกตระกูล
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.75rem]">
            Wealth Transfer Plan
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            วางแผนโอนหลายปีเป็นลำดับ พร้อมประมาณการภาษี — กดปีเพื่อกระโดดหรือลากเรียงใหม่
          </p>
        </div>
        <button type="button" className="ui-btn ui-btn-primary shrink-0 shadow-[0_4px_12px_-2px_rgba(62,180,137,0.45)]">
          ส่งแผนให้ผู้เชี่ยวชาญตรวจทาน
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint-brand-light text-mint-brand">
            <CalendarRange className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              ขั้นตอนทั้งหมด
            </p>
            <p className="text-lg font-bold tracking-tight text-slate-900">
              {summary.total}{" "}
              <span className="text-xs font-medium text-slate-400">ขั้น</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <CircleDot className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              ความคืบหน้า
            </p>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-lg font-bold tracking-tight text-slate-900">
                {summary.progress}%
              </p>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-mint-brand transition-all duration-500"
                  style={{ width: `${Math.max(summary.progress, 4)}%` }}
                />
              </div>
            </div>
            <p className="mt-0.5 text-[10px] text-slate-400">
              {summary.review > 0
                ? `รอตรวจทาน ${summary.review} ขั้น`
                : `เสร็จแล้ว ${summary.done}/${summary.total}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Scale className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              ภาษีที่ประมาณได้
            </p>
            <p className="text-lg font-bold tracking-tight text-slate-900">
              {summary.taxCount === 0 ? "—" : formatBahtCompact(summary.taxSum)}
            </p>
            <p className="text-[10px] text-slate-400">
              จาก {summary.taxCount} ขั้นที่มีตัวเลข
            </p>
          </div>
        </div>
      </div>

      <AlertBanner
        messages={[
          "ตัวเลขภาษีเป็นประมาณการจากฐานข้อมูลอัปเดต 1 ก.ค. 2566 — ไม่ใช่คำแนะนำทางกฎหมายหรือภาษี ควรปรึกษาผู้เชี่ยวชาญก่อนดำเนินการ",
        ]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="plan-timeline-panel rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 lg:col-span-2">
          <TransferTimeline
            steps={transferSteps}
            onReorder={reorderTransferSteps}
          />
        </div>
        <PlanSidePanels />
      </div>
    </div>
  );
}
