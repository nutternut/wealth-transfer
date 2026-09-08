"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { TaxEstimatePanel } from "@/components/TaxEstimatePanel";
import { useWealth } from "@/context/WealthContext";
import { formatBaht, formatBahtCompact, STEP_STATUS_LABEL } from "@/lib/format";
import {
  estimateInheritanceTax,
  summarizePortfolioTax,
  TAX_RULES,
} from "@/lib/tax";
import clsx from "clsx";

export default function TaxEstimatePage() {
  const { assets, transferSteps, totals } = useWealth();
  const [rulesOpen, setRulesOpen] = useState(false);

  const portfolioTax = useMemo(() => summarizePortfolioTax(assets), [assets]);

  const scenario = useMemo(() => {
    const withoutPlan = estimateInheritanceTax({
      netEstate: totals.totalValue,
      recipient: "lineal",
    }).tax;

    const withPlan = transferSteps
      .map((s) => s.estimatedTax)
      .filter((t): t is number => t !== null)
      .reduce((a, b) => a + b, 0);

    const knownSteps = transferSteps.filter((s) => s.estimatedTax !== null);
    const savings = Math.max(0, withoutPlan - withPlan);
    const savePct =
      withoutPlan > 0 ? Math.round((savings / withoutPlan) * 100) : 0;

    return { withoutPlan, withPlan, knownSteps, savings, savePct };
  }, [totals.totalValue, transferSteps]);

  const sortedSteps = useMemo(
    () => transferSteps.slice().sort((a, b) => a.order - b.order),
    [transferSteps],
  );

  return (
    <div className="plan-page tax-page">
      {/* Header */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-lg">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.75rem]">
            ประมาณการภาษี
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            ดูภาพรวมก่อน แล้วค่อยทดลองตัวเลข — ไม่ต้องเข้าใจกติกาทั้งหมดก็เริ่มได้
          </p>
        </div>
        <Link href="/transfer-plan" className="ui-btn ui-btn-ghost shrink-0">
          ดูแผนโอน
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Insight + calculator — equal split */}
      <div className="mb-8 grid gap-5 lg:grid-cols-2 lg:items-stretch lg:gap-6">
        <section className="tax-hero flex h-full flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_8px_30px_-12px_rgba(15,23,42,0.12)]">
          <div className="flex flex-1 flex-col bg-linear-to-br from-mint-50/80 via-white to-slate-50/60 px-5 py-6 sm:px-7 sm:py-7">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-mint-brand-light px-2.5 py-1 text-[11px] font-semibold text-mint-brand-dark">
                <Sparkles className="h-3 w-3" />
                สรุปจากพอร์ตตระกูล
              </span>
              <span className="text-[11px] text-slate-400">
                มูลค่ารวม {formatBahtCompact(totals.totalValue)}
              </span>
            </div>

            <div className="mt-5">
              <p className="text-xs font-medium text-slate-500">
                วางแผนโอนช่วยลดภาษีได้ประมาณ
              </p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-mint-brand-dark sm:text-[2.15rem]">
                {formatBahtCompact(scenario.savings)}
              </p>
              <p className="mt-2 max-w-sm text-xs leading-relaxed text-slate-500">
                เทียบกรณีปล่อยเป็นมรดกทั้งก้อน กับกรณีทำตามแผนโอนทีละขั้น
              </p>
            </div>

            <div className="mt-6 flex flex-1 flex-col gap-3">
              <TaxCompareChart
                withoutPlan={scenario.withoutPlan}
                withPlan={
                  scenario.knownSteps.length === 0 ? 0 : scenario.withPlan
                }
                savings={scenario.savings}
                savePct={scenario.savePct}
                hasSteps={scenario.knownSteps.length > 0}
              />

              <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2 sm:gap-3">
                <CompareCard
                  tone="bad"
                  eyebrow="ถ้าไม่มีแผน"
                  title={formatBaht(scenario.withoutPlan)}
                  subtitle="ภาษีมรดกโดยประมาณ"
                />
                <div className="flex items-center justify-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-mint-brand shadow-sm ring-1 ring-slate-100">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
                <CompareCard
                  tone="good"
                  eyebrow="ถ้าทำตามแผน"
                  title={
                    scenario.knownSteps.length === 0
                      ? "—"
                      : formatBaht(scenario.withPlan)
                  }
                  subtitle={
                    scenario.knownSteps.length === 0
                      ? "ยังไม่มีขั้นที่ประเมินภาษี"
                      : `จาก ${scenario.knownSteps.length} ขั้นในแผน`
                  }
                  badge={
                    scenario.savePct > 0
                      ? `ประหยัด ~${scenario.savePct}%`
                      : undefined
                  }
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-100/80 pt-4 text-[11px] text-slate-400">
              <span>
                สิทธิยกเว้นคงเหลือปีนี้{" "}
                <strong className="font-semibold text-slate-600">
                  {formatBahtCompact(portfolioTax.remainingExemptionThisYear)}
                </strong>
              </span>
              <span className="text-slate-200">·</span>
              <span>ประมาณการจากสูตร Asset Mapping</span>
            </div>
          </div>
        </section>

        <TaxEstimatePanel
          defaultAmount={
            assets.find((a) => a.id === "a2")?.value ?? 38_000_000
          }
          defaultUsedExemption={0}
          portfolioTotal={totals.totalValue}
        />
      </div>

      {/* Plan steps — simpler */}
      <section className="mb-6 rounded-2xl border border-slate-100 bg-white p-5 sm:p-6">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-bold tracking-tight text-slate-900">
              ภาษีในแผนโอนของคุณ
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              แต่ละขั้นคิดภาษีเท่าไหร่
            </p>
          </div>
          <Link
            href="/transfer-plan"
            className="text-[11px] font-semibold text-mint-brand hover:text-mint-brand-dark"
          >
            แก้ไขแผน
          </Link>
        </div>

        <ol className="space-y-2">
          {sortedSteps.map((step, i) => (
            <li
              key={step.id}
              className="flex items-center gap-3 rounded-xl border border-slate-50 bg-slate-50/40 px-3.5 py-3 transition-colors hover:bg-slate-50"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[11px] font-bold text-slate-500 ring-1 ring-slate-100">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-800">
                  {step.title}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  {step.yearLabel} · {STEP_STATUS_LABEL[step.status]}
                </p>
              </div>
              <p
                className={clsx(
                  "shrink-0 text-xs font-bold tabular-nums",
                  step.estimatedTax === 0
                    ? "text-mint-brand-dark"
                    : step.estimatedTax === null
                      ? "text-slate-400"
                      : "text-slate-900",
                )}
              >
                {step.estimatedTax === null
                  ? "ยังไม่ประเมิน"
                  : step.estimatedTax === 0
                    ? "฿0"
                    : formatBahtCompact(step.estimatedTax)}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Collapsible rules */}
      <section className="rounded-2xl border border-slate-100 bg-white">
        <button
          type="button"
          onClick={() => setRulesOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left sm:px-6"
          aria-expanded={rulesOpen}
        >
          <div>
            <p className="text-sm font-bold text-slate-800">
              กติกาแบบย่อ (ไม่บังคับอ่าน)
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              อัปเดต {TAX_RULES.asOfLabel} · ใช้ประมาณการในแอปเท่านั้น
            </p>
          </div>
          <ChevronDown
            className={clsx(
              "h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200",
              rulesOpen && "rotate-180",
            )}
          />
        </button>
        {rulesOpen && (
          <div className="border-t border-slate-50 px-5 pb-5 sm:px-6">
            <div className="grid gap-3 pt-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 px-4 py-3.5 text-xs leading-relaxed text-slate-600">
                <p className="font-bold text-slate-800">อสังหา (Asset Mapping)</p>
                <p className="mt-1.5">
                  ค่าธรรมเนียม 2% · ให้บุตรยกเว้น PIT{" "}
                  {formatBahtCompact(TAX_RULES.gift.parentToChildExemption)}
                  /คน · ส่วนเกิน 5% · ธพส. 3.3% หรืออากร 0.5% ตามปีถือครอง ·
                  ซื้อขายใช้ PIT อัตราก้าวหน้า (Sheet4)
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3.5 text-xs leading-relaxed text-slate-600">
                <p className="font-bold text-slate-800">ภาษีมรดก</p>
                <p className="mt-1.5">
                  ยกเว้น{" "}
                  {formatBahtCompact(TAX_RULES.inheritance.estateExemption)} ·
                  ลูก/พ่อแม่{" "}
                  {(TAX_RULES.inheritance.linealRate * 100).toFixed(0)}% ·
                  ทายาทอื่น{" "}
                  {(TAX_RULES.inheritance.otherRate * 100).toFixed(0)}%
                </p>
              </div>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
              ไม่ใช่คำแนะนำทางกฎหมายหรือภาษี — ควรปรึกษาผู้เชี่ยวชาญก่อนดำเนินการ
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function TaxCompareChart({
  withoutPlan,
  withPlan,
  savings,
  savePct,
  hasSteps,
}: {
  withoutPlan: number;
  withPlan: number;
  savings: number;
  savePct: number;
  hasSteps: boolean;
}) {
  const base = Math.max(withoutPlan, 1);
  const savedWidth = hasSteps ? Math.max(0, (savings / base) * 100) : 0;
  const paidWidth = hasSteps
    ? Math.max(0, (withPlan / base) * 100)
    : 100;

  return (
    <div className="flex flex-col rounded-2xl border border-slate-100/90 bg-white/70 p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold text-slate-500">
          ความคุ้มของแผนโอน
        </p>
        {savePct > 0 && (
          <span className="rounded-full bg-mint-brand px-2.5 py-0.5 text-[10px] font-bold text-white">
            ประหยัด ~{savePct}%
          </span>
        )}
      </div>

      <div
        role="img"
        aria-label={
          hasSteps
            ? `ประหยัดได้ ${formatBaht(savings)} จากภาษีไม่มีแผน ${formatBaht(withoutPlan)} เหลือจ่ายตามแผน ${formatBaht(withPlan)}`
            : `ภาษีไม่มีแผน ${formatBaht(withoutPlan)} ยังไม่มีขั้นที่ประเมินภาษี`
        }
      >
        <p className="text-[11px] font-medium text-slate-500">ประหยัดได้ประมาณ</p>
        <p className="mt-0.5 text-2xl font-bold tracking-tight tabular-nums text-mint-brand-dark">
          {hasSteps ? formatBahtCompact(savings) : "—"}
        </p>

        <div className="mt-4">
          <div className="mb-1.5 flex items-baseline justify-between gap-2 text-[10px] font-semibold">
            <span className="text-slate-400">
              ถ้าไม่มีแผน {formatBahtCompact(withoutPlan)}
            </span>
            <span className="tabular-nums text-mint-brand-dark">
              {hasSteps ? `เหลือจ่าย ${formatBahtCompact(withPlan)}` : "รอประเมิน"}
            </span>
          </div>

          <div className="tax-save-track overflow-hidden rounded-full bg-slate-100">
            <div className="tax-bar-h flex h-3.5 w-full sm:h-4">
              {hasSteps && savedWidth > 0 && (
                <div
                  className="tax-bar-h-save h-full min-w-1"
                  style={{ width: `${savedWidth}%` }}
                  title={`ประหยัด ${formatBaht(savings)}`}
                />
              )}
              <div
                className="tax-bar-h-paid h-full min-w-1"
                style={{ width: `${Math.max(paidWidth, hasSteps ? 0 : 100)}%` }}
                title={
                  hasSteps
                    ? `จ่ายตามแผน ${formatBaht(withPlan)}`
                    : `ภาษีไม่มีแผน ${formatBaht(withoutPlan)}`
                }
              />
            </div>
          </div>
        </div>

        <div className="mt-3.5 grid grid-cols-2 gap-2">
          <div className="flex items-start gap-2">
            <span
              aria-hidden
              className="mt-1 h-2 w-2 shrink-0 rounded-full bg-mint-brand"
            />
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-slate-400">ประหยัดไป</p>
              <p className="text-[12px] font-bold tabular-nums text-mint-brand-dark">
                {hasSteps ? formatBaht(savings) : "—"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span
              aria-hidden
              className="mt-1 h-2 w-2 shrink-0 rounded-full bg-rose-400"
            />
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-slate-400">
                {hasSteps ? "จ่ายตามแผน" : "ไม่มีแผน"}
              </p>
              <p className="text-[12px] font-bold tabular-nums text-rose-600">
                {hasSteps ? formatBaht(withPlan) : formatBaht(withoutPlan)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompareCard({
  tone,
  eyebrow,
  title,
  subtitle,
  badge,
}: {
  tone: "bad" | "good";
  eyebrow: string;
  title: string;
  subtitle: string;
  badge?: string;
}) {
  return (
    <div
      className={clsx(
        "relative flex min-w-0 flex-col justify-center rounded-2xl border px-3.5 py-3.5 sm:px-5 sm:py-4",
        tone === "bad"
          ? "border-rose-100/90 bg-rose-50/45"
          : "border-mint-100 bg-white shadow-[0_4px_16px_-6px_rgba(62,180,137,0.28)]",
      )}
    >
      {badge && (
        <span className="absolute top-2.5 right-2.5 rounded-md bg-mint-brand px-2 py-0.5 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
      <p
        className={clsx(
          "text-[11px] font-semibold",
          tone === "bad" ? "text-rose-600/80" : "text-mint-brand-dark",
          badge && "pr-16",
        )}
      >
        {eyebrow}
      </p>
      <p
        className={clsx(
          "mt-1 truncate text-lg font-bold tracking-tight tabular-nums sm:text-[1.35rem]",
          tone === "bad" ? "text-rose-700" : "text-slate-900",
        )}
      >
        {title}
      </p>
      <p className="mt-0.5 text-[11px] text-slate-500">{subtitle}</p>
    </div>
  );
}
