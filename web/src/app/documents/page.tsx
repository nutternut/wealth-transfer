"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  CircleDashed,
  FileCheck2,
  FilePenLine,
  FileText,
  ScrollText,
  Users,
} from "lucide-react";
import { useWealth } from "@/context/WealthContext";
import { DOCUMENT_ITEMS } from "@/lib/mock-data";
import {
  ASSET_TYPE_LABEL,
  DOC_CATEGORY_LABEL,
  DOC_ITEM_STATUS_LABEL,
  DOC_LABEL,
  formatBahtCompact,
} from "@/lib/format";
import type {
  DocumentItem,
  DocumentItemCategory,
  DocumentItemStatus,
  DocumentStatus,
} from "@/lib/types";
import clsx from "clsx";

const STATUS_META: Record<
  DocumentItemStatus,
  { badge: string; bar: string; icon: typeof CheckCircle2 }
> = {
  draft: {
    badge: "bg-sky-50 text-sky-700 border-sky-100",
    bar: "bg-sky-400",
    icon: FilePenLine,
  },
  not_started: {
    badge: "bg-amber-50 text-amber-700 border-amber-100",
    bar: "bg-amber-400",
    icon: CircleDashed,
  },
  approved: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
    bar: "bg-emerald-400",
    icon: CheckCircle2,
  },
};

const ASSET_DOC_META: Record<DocumentStatus, { badge: string; hint: string }> = {
  complete: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
    hint: "เอกสารครบ",
  },
  incomplete: {
    badge: "bg-amber-50 text-amber-700 border-amber-100",
    hint: "ยังขาดเอกสาร",
  },
  outdated: {
    badge: "bg-rose-50 text-rose-700 border-rose-100",
    hint: "ต้องอัปเดตมูลค่า/เอกสาร",
  },
};

const FILTERS: { id: "all" | DocumentItemCategory; label: string }[] = [
  { id: "all", label: "ทั้งหมด" },
  { id: "will", label: "พินัยกรรม" },
  { id: "gift", label: "หนังสือให้" },
  { id: "ownership", label: "เอกสารสิทธิ์" },
  { id: "power_of_attorney", label: "มอบอำนาจ" },
];

const WILL_CHECKLIST = [
  "ระบุผู้ทำพินัยกรรมและวันจัดทำให้ชัดเจน",
  "ระบุผู้รับมรดกและสัดส่วนทรัพย์สินให้สอดคล้องกับแผนโอน",
  "มีพยานอย่างน้อย 2 คน ที่ไม่ใช่ผู้รับมรดก",
  "แนบบัญชีทรัพย์สินและเอกสารสิทธิ์ที่เกี่ยวข้อง",
  "เก็บต้นฉบับในที่ปลอดภัย และแจ้งผู้ที่เกี่ยวข้อง",
];

type FilterId = (typeof FILTERS)[number]["id"];

export default function DocumentsPage() {
  const { assets } = useWealth();
  const [filter, setFilter] = useState<FilterId>("all");

  const summary = useMemo(() => {
    const total = DOCUMENT_ITEMS.length;
    const approved = DOCUMENT_ITEMS.filter((d) => d.status === "approved").length;
    const draft = DOCUMENT_ITEMS.filter((d) => d.status === "draft").length;
    const notStarted = DOCUMENT_ITEMS.filter(
      (d) => d.status === "not_started",
    ).length;
    const wills = DOCUMENT_ITEMS.filter((d) => d.category === "will");
    const willReady = wills.every((d) => d.status === "approved");
    const progress =
      total === 0 ? 0 : Math.round((approved / total) * 100);
    return { total, approved, draft, notStarted, wills, willReady, progress };
  }, []);

  const filteredDocs = useMemo(() => {
    if (filter === "all") return DOCUMENT_ITEMS;
    return DOCUMENT_ITEMS.filter((d) => d.category === filter);
  }, [filter]);

  const assetAttention = useMemo(
    () =>
      assets.filter(
        (a) => a.documents === "incomplete" || a.documents === "outdated",
      ),
    [assets],
  );

  return (
    <div className="plan-page">
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div className="max-w-xl">
          <p className="mb-2 text-[11px] font-semibold tracking-[0.14em] text-mint-brand uppercase">
            เอกสารทางกฎหมาย
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.75rem]">
            เอกสารและพินัยกรรม
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            ติดตามสถานะเอกสารโอนและพินัยกรรม — ให้พร้อมก่อนถึงขั้นในแผนโอน
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/transfer-plan" className="ui-btn ui-btn-ghost shrink-0">
            ดูแผนโอน
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            className="ui-btn ui-btn-primary shrink-0 shadow-[0_4px_12px_-2px_rgba(62,180,137,0.45)]"
          >
            เพิ่มเอกสาร
            <FileText className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint-brand-light text-mint-brand">
            <FileCheck2 className="h-4 w-4" />
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
              ผ่านแล้ว {summary.approved}/{summary.total} ฉบับ
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <FilePenLine className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              กำลังดำเนินการ
            </p>
            <p className="text-lg font-bold tracking-tight text-slate-900">
              {summary.draft}{" "}
              <span className="text-xs font-medium text-slate-400">ร่าง</span>
            </p>
            <p className="text-[10px] text-slate-400">
              ยังไม่เริ่ม {summary.notStarted} ฉบับ
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3.5">
          <div
            className={clsx(
              "flex h-10 w-10 items-center justify-center rounded-xl",
              summary.willReady
                ? "bg-emerald-50 text-emerald-600"
                : "bg-amber-50 text-amber-600",
            )}
          >
            <ScrollText className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              พินัยกรรม
            </p>
            <p className="text-lg font-bold tracking-tight text-slate-900">
              {summary.willReady ? "พร้อมแล้ว" : "ยังไม่ครบ"}
            </p>
            <p className="text-[10px] text-slate-400">
              {
                summary.wills.filter((d) => d.status === "approved").length
              }
              /{summary.wills.length} รายการที่เกี่ยวข้อง
            </p>
          </div>
        </div>
      </div>

      {/* Will spotlight */}
      <section className="mb-8 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_8px_30px_-12px_rgba(15,23,42,0.12)]">
        <div className="bg-linear-to-br from-mint-50/90 via-white to-slate-50 px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-mint-brand-light px-2.5 py-1 text-[11px] font-semibold text-mint-brand-dark">
              <ScrollText className="h-3 w-3" />
              จุดสำคัญของแผน
            </span>
            <span className="text-[11px] text-slate-400">
              เชื่อมกับขั้น “จัดทำพินัยกรรมฉบับใหม่” ในแผนโอน
            </span>
          </div>

          <div className="mt-4 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <h2 className="max-w-md text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                พินัยกรรมฉบับใหม่{" "}
                <span
                  className={clsx(
                    "text-base font-semibold sm:text-lg",
                    summary.willReady
                      ? "text-mint-brand-dark"
                      : "text-amber-600",
                  )}
                >
                  {summary.willReady ? "ผ่านแล้ว" : "ยังต้องจัดทำ"}
                </span>
              </h2>
              <p className="mt-2 max-w-md text-xs leading-relaxed text-slate-500">
                พินัยกรรมช่วยกำหนดผู้รับมรดกเมื่อถึงเวลา — ควรสอดคล้องกับแผนโอนและเอกสารสิทธิ์ของทรัพย์สินแต่ละรายการ
              </p>

              <ul className="mt-5 space-y-2">
                {summary.wills.map((doc) => (
                  <WillDocRow key={doc.id} doc={doc} />
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 sm:p-5">
              <div className="mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-mint-brand" />
                <p className="text-sm font-bold text-slate-800">
                  เช็กลิสต์ก่อนลงนาม
                </p>
              </div>
              <ol className="space-y-2.5">
                {WILL_CHECKLIST.map((item, i) => (
                  <li
                    key={item}
                    className="flex gap-2.5 text-xs leading-relaxed text-slate-600"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-50 text-[10px] font-bold text-slate-400 ring-1 ring-slate-100">
                      {i + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-[11px] leading-relaxed text-slate-400">
                ไม่ใช่คำแนะนำทางกฎหมาย — ควรปรึกษาทนายความก่อนจัดทำพินัยกรรม
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        {/* Document list */}
        <section className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 lg:col-span-2">
          <div className="mb-5">
            <h2 className="text-base font-bold tracking-tight text-slate-900">
              รายการเอกสาร
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              กรองตามประเภทเอกสาร
            </p>

            <div
              role="tablist"
              aria-label="กรองประเภทเอกสาร"
              className="mt-4 flex gap-0.5 overflow-x-auto rounded-xl bg-slate-100/90 p-1"
            >
              {FILTERS.map((f) => {
                const count =
                  f.id === "all"
                    ? DOCUMENT_ITEMS.length
                    : DOCUMENT_ITEMS.filter((d) => d.category === f.id).length;
                const active = filter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setFilter(f.id)}
                    className={clsx(
                      "flex min-w-0 shrink-0 flex-1 items-center justify-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition-all duration-200",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint-brand",
                      active
                        ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80"
                        : "text-slate-500 hover:bg-white/60 hover:text-slate-700",
                    )}
                  >
                    <span className="truncate">{f.label}</span>
                    <span
                      className={clsx(
                        "inline-flex h-4 min-w-4 items-center justify-center rounded px-1 text-[8px] font-bold tabular-nums",
                        active
                          ? "bg-mint-brand-light text-mint-brand-dark"
                          : "bg-slate-200/80 text-slate-500",
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <ul className="space-y-2">
            {filteredDocs.map((doc) => {
              const meta = STATUS_META[doc.status];
              const StatusIcon = meta.icon;
              return (
                <li
                  key={doc.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-50 bg-slate-50/40 px-3.5 py-3.5 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span
                      className={clsx(
                        "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-slate-100",
                        doc.category === "will"
                          ? "text-mint-brand"
                          : "text-slate-400",
                      )}
                    >
                      {doc.category === "will" ? (
                        <ScrollText className="h-4 w-4" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-semibold text-slate-800">
                          {doc.name}
                        </p>
                        <span className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 ring-1 ring-slate-100">
                          {DOC_CATEGORY_LABEL[doc.category]}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                        {doc.description}
                      </p>
                      {doc.updatedLabel && (
                        <p className="mt-1 text-[10px] text-slate-400">
                          อัปเดต {doc.updatedLabel}
                        </p>
                      )}
                    </div>
                  </div>
                  <span
                    className={clsx(
                      "inline-flex shrink-0 items-center gap-1 self-start rounded-full border px-2.5 py-1 text-[10px] leading-5 font-semibold sm:self-center",
                      meta.badge,
                    )}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {DOC_ITEM_STATUS_LABEL[doc.status]}
                  </span>
                </li>
              );
            })}
            {filteredDocs.length === 0 && (
              <li className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-xs text-slate-400">
                ไม่มีเอกสารในหมวดนี้
              </li>
            )}
          </ul>
        </section>

        {/* Asset docs needing attention */}
        <section className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold tracking-tight text-slate-900">
                เอกสารตามทรัพย์สิน
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                รายการที่ยังไม่ครบหรือราคาเก่า
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>

          {assetAttention.length === 0 ? (
            <div className="mt-6 rounded-xl bg-emerald-50/60 px-4 py-5 text-center">
              <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-600" />
              <p className="mt-2 text-xs font-semibold text-emerald-800">
                เอกสารทรัพย์สินครบแล้ว
              </p>
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {assetAttention.map((asset) => {
                const meta = ASSET_DOC_META[asset.documents];
                return (
                  <li
                    key={asset.id}
                    className="rounded-xl border border-slate-50 px-3 py-3 transition-colors hover:bg-slate-50/60"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-800">
                          {asset.name}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          {ASSET_TYPE_LABEL[asset.type]} ·{" "}
                          {formatBahtCompact(asset.value)}
                        </p>
                      </div>
                      <span
                        className={clsx(
                          "inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                          meta.badge,
                        )}
                      >
                        {DOC_LABEL[asset.documents]}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[10px] text-slate-400">
                      {meta.hint}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}

          <Link
            href="/wealth-map"
            className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold text-mint-brand hover:text-mint-brand-dark"
          >
            ไปแก้ที่ Wealth Map
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </section>
      </div>
    </div>
  );
}

function WillDocRow({ doc }: { doc: DocumentItem }) {
  const meta = STATUS_META[doc.status];
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-white/80 bg-white/80 px-3.5 py-2.5 ring-1 ring-slate-100/80">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className={clsx("h-1.5 w-1.5 shrink-0 rounded-full", meta.bar)} />
        <span className="truncate text-xs font-medium text-slate-700">
          {doc.name}
        </span>
      </div>
      <span
        className={clsx(
          "inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold",
          meta.badge,
        )}
      >
        {DOC_ITEM_STATUS_LABEL[doc.status]}
      </span>
    </li>
  );
}
