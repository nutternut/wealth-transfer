"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  FileText,
  Gift,
  Landmark,
  ShieldCheck,
} from "lucide-react";
import { DOCUMENT_ITEMS } from "@/lib/mock-data";
import { DOC_ITEM_STATUS_LABEL, formatBaht } from "@/lib/format";
import { summarizePortfolioTax } from "@/lib/tax";
import { useWealth } from "@/context/WealthContext";
import type { DocumentItemStatus } from "@/lib/types";
import clsx from "clsx";

const DOC_STATUS: Record<DocumentItemStatus, { badge: string; bar: string }> = {
  draft: {
    badge: "bg-sky-50 text-sky-700 border-sky-100",
    bar: "bg-sky-400",
  },
  not_started: {
    badge: "bg-amber-50 text-amber-700 border-amber-100",
    bar: "bg-amber-400",
  },
  approved: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
    bar: "bg-emerald-400",
  },
};

export function PlanSidePanels() {
  const { assets } = useWealth();
  const taxSummary = useMemo(() => summarizePortfolioTax(assets), [assets]);
  const savings = Math.max(
    0,
    taxSummary.inheritanceWithoutPlan - taxSummary.giftAccumulated,
  );
  const docsDone = DOCUMENT_ITEMS.filter((d) => d.status === "approved").length;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div className="border-b border-slate-50 bg-linear-to-br from-mint-50/90 to-white px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                สรุปภาษีโดยประมาณ
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                คำนวณจากสูตร Asset Mapping
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-mint-brand shadow-sm ring-1 ring-mint-100">
              <Landmark className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 rounded-xl bg-white/80 px-4 py-3 ring-1 ring-mint-100/80">
            <p className="text-[10px] font-semibold tracking-wider text-mint-brand uppercase">
              ลดภาระมรดกได้ประมาณ
            </p>
            <p className="mt-1 text-xl font-bold tracking-tight text-slate-900 tabular-nums">
              {formatBaht(savings)}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              เมื่อเทียบกับกรณีไม่มีแผนโอน
            </p>
          </div>
        </div>

        <dl className="space-y-1 px-3 py-3 text-xs">
          <div className="flex items-center justify-between gap-4 rounded-xl px-3 py-2.5">
            <dt className="flex items-center gap-2 text-slate-500">
              <Gift className="h-3.5 w-3.5 text-slate-300" />
              ค่าใช้จ่ายโอน (แผนโอน)
            </dt>
            <dd className="font-semibold tabular-nums text-slate-800">
              {formatBaht(taxSummary.giftAccumulated)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl bg-rose-50/50 px-3 py-2.5">
            <dt className="flex items-center gap-2 text-slate-500">
              <Landmark className="h-3.5 w-3.5 text-rose-300" />
              ภาษีมรดก (ไม่มีแผน)
            </dt>
            <dd className="font-semibold tabular-nums text-rose-600">
              {formatBaht(taxSummary.inheritanceWithoutPlan)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl bg-mint-50/60 px-3 py-2.5">
            <dt className="flex items-center gap-2 text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-mint-brand" />
              สิทธิยกเว้นคงเหลือปีนี้
            </dt>
            <dd className="font-semibold tabular-nums text-mint-brand">
              {formatBaht(taxSummary.remainingExemptionThisYear)}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              สถานะเอกสาร
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              {docsDone}/{DOCUMENT_ITEMS.length} ผ่านแล้ว
            </p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
            <FileText className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-mint-brand transition-all duration-500"
            style={{
              width: `${Math.max(
                (docsDone / Math.max(DOCUMENT_ITEMS.length, 1)) * 100,
                docsDone === 0 ? 0 : 8,
              )}%`,
            }}
          />
        </div>

        <ul className="mt-4 space-y-2">
          {DOCUMENT_ITEMS.slice(0, 4).map((doc) => {
            const meta = DOC_STATUS[doc.status];
            return (
              <li
                key={doc.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-50 px-3 py-2.5 transition-colors hover:border-slate-100 hover:bg-slate-50/60"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className={clsx("h-1.5 w-1.5 shrink-0 rounded-full", meta.bar)}
                  />
                  <span className="truncate text-xs font-medium text-slate-700">
                    {doc.name}
                  </span>
                </div>
                <span
                  className={clsx(
                    "inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] leading-5 font-semibold",
                    meta.badge,
                  )}
                >
                  {doc.status === "approved" && (
                    <CheckCircle2 className="h-3 w-3" />
                  )}
                  {DOC_ITEM_STATUS_LABEL[doc.status]}
                </span>
              </li>
            );
          })}
        </ul>

        <Link
          href="/documents"
          className="mt-4 inline-flex text-[11px] font-semibold text-mint-brand hover:text-mint-brand-dark"
        >
          ดูเอกสารทั้งหมด →
        </Link>
      </section>
    </div>
  );
}
