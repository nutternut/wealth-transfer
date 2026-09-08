"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  Calculator,
  Gift,
  Landmark,
  Percent,
  ShieldCheck,
} from "lucide-react";
import clsx from "clsx";
import {
  estimateGiftTax,
  estimateInheritanceTax,
  estimateRealEstateTransfer,
  formatPercent,
  giftExemptionLimit,
  TAX_RULES,
  type GiftExemptionBand,
  type TaxRecipientKind,
} from "@/lib/tax";
import {
  formatBaht,
  formatBahtCompact,
  RECIPIENT_RELATION_LABEL,
  REGISTRATION_TYPE_LABEL,
} from "@/lib/format";
import type {
  OwnerEntityKind,
  RealEstateRegistrationType,
  RecipientRelation,
} from "@/lib/types";

type Mode = "gift" | "inheritance" | "real_estate";

const MODES = [
  { id: "real_estate" as const, label: "อสังหา", icon: Building2 },
  { id: "gift" as const, label: "ภาษีการให้", icon: Gift },
  { id: "inheritance" as const, label: "ภาษีมรดก", icon: Landmark },
] as const;

function parseAmount(raw: string): number {
  const n = Number(raw.replace(/,/g, "").trim());
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function formatInputNumber(n: number): string {
  if (!n) return "";
  return new Intl.NumberFormat("th-TH").format(n);
}

const fieldClass =
  "w-full rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-xs font-medium tabular-nums text-slate-800 outline-none transition placeholder:font-normal placeholder:text-slate-300 focus:border-mint-brand focus:ring-2 focus:ring-mint-100";

const labelClass =
  "mb-1.5 block text-[11px] font-medium text-slate-500";

export function TaxEstimatePanel({
  defaultAmount,
  defaultUsedExemption = 0,
  portfolioTotal,
}: {
  defaultAmount: number;
  defaultUsedExemption?: number;
  portfolioTotal?: number;
}) {
  const [mode, setMode] = useState<Mode>("real_estate");
  const [amountRaw, setAmountRaw] = useState(
    formatInputNumber(
      portfolioTotal && portfolioTotal > 0
        ? Math.min(defaultAmount, portfolioTotal)
        : defaultAmount,
    ),
  );
  const [band, setBand] = useState<GiftExemptionBand>("parent_to_child");
  const [usedRaw, setUsedRaw] = useState(
    formatInputNumber(defaultUsedExemption),
  );
  const [recipient, setRecipient] = useState<TaxRecipientKind>("lineal");

  const [regType, setRegType] =
    useState<RealEstateRegistrationType>("gift");
  const [relation, setRelation] =
    useState<RecipientRelation>("lineal_descendant");
  const [ownerKind, setOwnerKind] = useState<OwnerEntityKind>("individual");
  const [heirCount, setHeirCount] = useState(1);
  const [acquiredYear, setAcquiredYear] = useState(2555);
  const [transferYear, setTransferYear] = useState(2569);
  const [salePriceRaw, setSalePriceRaw] = useState("");

  const amount = parseAmount(amountRaw);
  const usedExemption = parseAmount(usedRaw);
  const salePrice = parseAmount(salePriceRaw);

  const gift = useMemo(
    () => estimateGiftTax({ amount, band, usedExemption }),
    [amount, band, usedExemption],
  );

  const inheritance = useMemo(
    () => estimateInheritanceTax({ netEstate: amount, recipient }),
    [amount, recipient],
  );

  const realEstate = useMemo(
    () =>
      estimateRealEstateTransfer({
        appraisal: amount,
        salePrice: salePrice || undefined,
        acquiredYearBe: acquiredYear,
        transferYearBe: transferYear,
        acquisitionMethod: "purchase_or_other",
        registrationType: regType,
        ownerEntityKind: ownerKind,
        recipientRelation: relation,
        heirCount,
      }),
    [
      amount,
      salePrice,
      acquiredYear,
      transferYear,
      regType,
      ownerKind,
      relation,
      heirCount,
    ],
  );

  const resultAmount =
    mode === "real_estate"
      ? realEstate.total
      : mode === "gift"
        ? gift.tax
        : inheritance.tax;

  const resultLabel =
    mode === "real_estate"
      ? "รวมค่าใช้จ่ายโดยประมาณ"
      : mode === "gift"
        ? "ภาษีการให้โดยประมาณ"
        : "ภาษีมรดกโดยประมาณ";

  const resultHint =
    mode === "real_estate"
      ? `ถือครอง ${realEstate.holdingYears} ปี${
          realEstate.dutyKind !== "none"
            ? ` · ${realEstate.dutyKind === "stamp_duty" ? "อากรแสตมป์" : "ภาษีธุรกิจเฉพาะ"}`
            : ""
        }`
      : null;

  return (
    <section className="tax-calc flex h-full w-full flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_8px_30px_-12px_rgba(15,23,42,0.12)]">
      {/* Header + mode */}
      <div className="px-5 pt-5 pb-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-mint-brand text-white shadow-[0_6px_16px_-4px_rgba(62,180,137,0.55)]">
            <Calculator className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold tracking-tight text-slate-900">
              เครื่องคำนวณประมาณการ
            </h2>
            <p className="text-[11px] text-slate-400">
              Asset Mapping · กติกา {TAX_RULES.asOfLabel}
            </p>
          </div>
        </div>

        <div
          className="mt-4 flex gap-0.5 rounded-xl bg-slate-100/90 p-1"
          role="tablist"
          aria-label="ประเภทภาษี"
        >
          {MODES.map((tab) => {
            const Icon = tab.icon;
            const active = mode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setMode(tab.id)}
                className={clsx(
                  "flex flex-1 items-center justify-center gap-1 rounded-lg px-1.5 py-1 text-[8px] transition-all duration-200 sm:text-[9px]",
                  active
                    ? "bg-white font-semibold text-slate-900 shadow-sm"
                    : "font-medium text-slate-500 hover:text-slate-700",
                )}
              >
                <Icon
                  className={clsx(
                    "h-3 w-3",
                    active ? "text-mint-brand" : "opacity-70",
                  )}
                />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Inputs */}
      <div className="space-y-3.5 px-5 pb-4 sm:px-6">
        <label className="block">
          <span className={labelClass}>
            {mode === "inheritance"
              ? "มูลค่ามรดกสุทธิ (บาท)"
              : mode === "real_estate"
                ? "ราคาประเมินที่ดิน (บาท)"
                : "มูลค่าของที่ให้ (บาท)"}
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={amountRaw}
            onChange={(e) => setAmountRaw(e.target.value)}
            onBlur={() => setAmountRaw(formatInputNumber(amount))}
            className={fieldClass}
            placeholder="0"
          />
        </label>

        {mode === "real_estate" && (
          <>
            <FieldSelect
              label="ประเภทการจดทะเบียน"
              value={regType}
              onChange={(v) => setRegType(v as RealEstateRegistrationType)}
              options={(
                Object.keys(REGISTRATION_TYPE_LABEL) as RealEstateRegistrationType[]
              ).map((k) => ({
                value: k,
                label: REGISTRATION_TYPE_LABEL[k],
              }))}
            />
            <FieldSelect
              label="ผู้รับโอน"
              value={relation}
              onChange={(v) => setRelation(v as RecipientRelation)}
              options={(
                Object.keys(RECIPIENT_RELATION_LABEL) as RecipientRelation[]
              ).map((k) => ({
                value: k,
                label: RECIPIENT_RELATION_LABEL[k],
              }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <FieldSelect
                label="ผู้โอน"
                value={ownerKind}
                onChange={(v) => setOwnerKind(v as OwnerEntityKind)}
                options={[
                  { value: "individual", label: "บุคคลธรรมดา" },
                  { value: "juristic", label: "นิติบุคคล" },
                ]}
              />
              <label className="block">
                <span className={labelClass}>จำนวนทายาท</span>
                <input
                  type="number"
                  min={1}
                  value={heirCount}
                  onChange={(e) =>
                    setHeirCount(Math.max(1, Number(e.target.value) || 1))
                  }
                  className={fieldClass}
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className={labelClass}>ปีได้มา (พ.ศ.)</span>
                <input
                  type="number"
                  value={acquiredYear}
                  onChange={(e) => setAcquiredYear(Number(e.target.value))}
                  className={fieldClass}
                />
              </label>
              <label className="block">
                <span className={labelClass}>ปีโอน (พ.ศ.)</span>
                <input
                  type="number"
                  value={transferYear}
                  onChange={(e) => setTransferYear(Number(e.target.value))}
                  className={fieldClass}
                />
              </label>
            </div>
            <label className="block">
              <span className={labelClass}>ราคาซื้อขาย (บาท) — ถ้ามี</span>
              <input
                type="text"
                inputMode="numeric"
                value={salePriceRaw}
                onChange={(e) => setSalePriceRaw(e.target.value)}
                onBlur={() =>
                  setSalePriceRaw(salePrice ? formatInputNumber(salePrice) : "")
                }
                className={fieldClass}
                placeholder="เท่ากับราคาประเมิน"
              />
            </label>
          </>
        )}

        {mode === "gift" && (
          <>
            <fieldset>
              <legend className={labelClass}>ประเภทการให้</legend>
              <div className="grid gap-2">
                {(
                  [
                    {
                      id: "parent_to_child" as const,
                      title: "บิดามารดา → บุตรชอบด้วยกฎหมาย",
                      sub: `ยกเว้น ${formatBahtCompact(TAX_RULES.gift.parentToChildExemption)}/ปี · ${formatPercent(TAX_RULES.gift.rate)}`,
                    },
                    {
                      id: "general" as const,
                      title: "การให้ทั่วไป / คนอื่น",
                      sub: `ยกเว้น ${formatBahtCompact(TAX_RULES.gift.generalExemption)}/ปี · ${formatPercent(TAX_RULES.gift.otherRate)}`,
                    },
                  ] as const
                ).map((opt) => (
                  <ChoiceCard
                    key={opt.id}
                    active={band === opt.id}
                    title={opt.title}
                    sub={opt.sub}
                    onClick={() => setBand(opt.id)}
                  />
                ))}
              </div>
            </fieldset>

            <label className="block">
              <span className={labelClass}>
                สิทธิยกเว้นที่ใช้ไปแล้วปีนี้ (บาท)
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={usedRaw}
                onChange={(e) => setUsedRaw(e.target.value)}
                onBlur={() => setUsedRaw(formatInputNumber(usedExemption))}
                className={fieldClass}
                placeholder="0"
              />
              <p className="mt-1.5 text-[11px] text-slate-400">
                เพดานยกเว้น {formatBaht(giftExemptionLimit(band))} · คงเหลือประมาณ{" "}
                {formatBaht(gift.remainingExemption)}
              </p>
            </label>
          </>
        )}

        {mode === "inheritance" && (
          <fieldset>
            <legend className={labelClass}>ความสัมพันธ์ทายาท</legend>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  {
                    id: "lineal" as const,
                    title: "บุพการี / ผู้สืบสันดาน",
                    sub: `อัตรา ${formatPercent(TAX_RULES.inheritance.linealRate)}`,
                  },
                  {
                    id: "other" as const,
                    title: "ทายาทอื่น",
                    sub: `อัตรา ${formatPercent(TAX_RULES.inheritance.otherRate)}`,
                  },
                ] as const
              ).map((opt) => (
                <ChoiceCard
                  key={opt.id}
                  active={recipient === opt.id}
                  title={opt.title}
                  sub={opt.sub}
                  onClick={() => setRecipient(opt.id)}
                />
              ))}
            </div>
            <p className="mt-2.5 text-[11px] leading-relaxed text-slate-400">
              ยกเว้นมรดกสุทธิ{" "}
              {formatBaht(TAX_RULES.inheritance.estateExemption)} ก่อนคิดภาษี
            </p>
          </fieldset>
        )}
      </div>

      {/* Result — below inputs */}
      <div className="mt-auto mx-5 mb-5 overflow-hidden rounded-2xl bg-linear-to-br from-mint-brand to-mint-brand-dark px-5 py-4 text-white shadow-[0_10px_28px_-10px_rgba(62,180,137,0.45)] sm:mx-6 sm:mb-6 sm:px-5">
        <p className="text-[11px] font-medium text-white/75">{resultLabel}</p>
        <p className="mt-1 text-[1.75rem] font-bold tracking-tight tabular-nums sm:text-[1.85rem]">
          {formatBaht(resultAmount)}
        </p>
        {resultHint && (
          <p className="mt-1 text-[11px] text-white/70">{resultHint}</p>
        )}

        {mode === "real_estate" ? (
          <dl className="mt-4 max-h-40 space-y-1.5 overflow-y-auto pr-0.5">
            {realEstate.lines.map((line) => (
              <div
                key={line.key + line.label}
                className="flex items-start justify-between gap-3 rounded-xl bg-white/10 px-3 py-2 text-[11px] backdrop-blur-sm"
              >
                <div className="min-w-0">
                  <dt className="text-white/85">{line.label}</dt>
                  {line.note && (
                    <p className="mt-0.5 text-[10px] text-white/55">{line.note}</p>
                  )}
                </div>
                <dd className="shrink-0 font-semibold tabular-nums">
                  {formatBaht(line.amount)}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <dl className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur-sm">
              <dt className="flex items-center gap-1 text-[10px] text-white/70">
                <ShieldCheck className="h-3 w-3" />
                ส่วนเกินยกเว้น
              </dt>
              <dd className="mt-1 text-sm font-bold tabular-nums">
                {formatBaht(
                  mode === "gift" ? gift.taxable : inheritance.taxable,
                )}
              </dd>
            </div>
            <div className="rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur-sm">
              <dt className="flex items-center gap-1 text-[10px] text-white/70">
                <Percent className="h-3 w-3" />
                อัตราที่ใช้
              </dt>
              <dd className="mt-1 text-sm font-bold tabular-nums">
                {formatPercent(mode === "gift" ? gift.rate : inheritance.rate)}
              </dd>
            </div>
          </dl>
        )}
      </div>
    </section>
  );
}

function ChoiceCard({
  active,
  title,
  sub,
  onClick,
}: {
  active: boolean;
  title: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "rounded-xl border px-3 py-3 text-left transition-all duration-150",
        active
          ? "border-mint-brand/50 bg-mint-50 ring-1 ring-mint-brand/25"
          : "border-slate-200/80 bg-slate-50/40 hover:border-slate-300 hover:bg-white",
      )}
    >
      <p className="text-xs font-semibold text-slate-800">{title}</p>
      <p
        className={clsx(
          "mt-0.5 text-[10px]",
          active ? "text-mint-brand-dark" : "text-slate-400",
        )}
      >
        {sub}
      </p>
    </button>
  );
}

function FieldSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={fieldClass}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
