/**
 * สูตรคำนวณตาม doc/ASSET MAPPING.xlsx
 * (การคำนวณภาษีอสังหา / สังหาริมทรัพย์ / Sheet4 PIT / ประมาณการ)
 * ไม่ใช่คำแนะนำทางกฎหมายหรือภาษี
 */

import type {
  AcquisitionMethod,
  Asset,
  LandArea,
  MovableTransferType,
  OwnerEntityKind,
  RealEstateDetails,
  RealEstateRegistrationType,
  RecipientRelation,
  ShareDetails,
  TransferStep,
} from "./types";

// ─── Constants (จากชีต) ───────────────────────────────────────────────

export const TAX_RULES = {
  gift: {
    parentToChildExemption: 20_000_000,
    generalExemption: 10_000_000,
    rate: 0.05,
    otherRate: 0.1,
  },
  inheritance: {
    estateExemption: 100_000_000,
    linealRate: 0.05,
    otherRate: 0.1,
  },
  realEstate: {
    transferFeeRate: 0.02,
    inheritanceLinealFeeRate: 0.005,
    specificBusinessTaxRate: 0.033,
    stampDutyRate: 0.005,
    giftPitExemptionPerHeir: 20_000_000,
    giftPitRate: 0.05,
    inheritanceExemptionPerHeir: 100_000_000,
    inheritanceLinealRate: 0.05,
    inheritanceOtherRate: 0.1,
    juristicWithholdingRate: 0.01,
    /** ถือครอง ≥ 5 ปี → อากรแสตมป์ (ยกเว้น ธพส.) / < 5 → ธพส. */
    holdingYearsForStampInsteadOfSbt: 5,
  },
  asOfLabel: "1 ก.ค. 2566",
} as const;

/** หักค่าใช้จ่ายเหมาตามปีถือครอง (ซื้อ/อื่น) — Sheet4 */
export const PIT_EXPENSE_RATES_BY_YEAR: Record<number, number> = {
  1: 0.92,
  2: 0.84,
  3: 0.77,
  4: 0.71,
  5: 0.65,
  6: 0.6,
  7: 0.55,
  8: 0.5,
};

/** อัตราก้าวหน้า PIT บนเงินได้สุทธิเฉลี่ยต่อปี — ไม่ยกเว้น 150,000 */
export const PIT_BRACKETS: { upTo: number; rate: number }[] = [
  { upTo: 300_000, rate: 0.05 },
  { upTo: 500_000, rate: 0.1 },
  { upTo: 750_000, rate: 0.15 },
  { upTo: 1_000_000, rate: 0.2 },
  { upTo: 2_000_000, rate: 0.25 },
  { upTo: 5_000_000, rate: 0.3 },
  { upTo: Infinity, rate: 0.35 },
];

/** ประมาณการคร่าวๆ ตามช่วงราคาประเมิน — ชีต ประมาณการ */
export const ROUGH_PIT_ESTIMATE_BANDS: { maxExclusive: number; rate: number }[] =
  [
    { maxExclusive: 6_000_000, rate: 0.025 },
    { maxExclusive: 20_000_000, rate: 0.035 },
    { maxExclusive: 30_000_000, rate: 0.0625 },
    { maxExclusive: 40_000_000, rate: 0.0825 },
    { maxExclusive: 50_000_000, rate: 0.095 },
    { maxExclusive: 60_000_000, rate: 0.105 },
    { maxExclusive: 70_000_000, rate: 0.1125 },
    { maxExclusive: 80_000_000, rate: 0.12 },
    { maxExclusive: 90_000_000, rate: 0.125 },
    { maxExclusive: 100_000_000, rate: 0.1275 },
    { maxExclusive: Infinity, rate: 0.17 },
  ];

// ─── Area / holding helpers ───────────────────────────────────────────

export function areaToSqWah(area: LandArea): number {
  return (
    Math.max(0, area.rai) * 400 +
    Math.max(0, area.ngan) * 100 +
    Math.max(0, area.sqWah)
  );
}

export function appraisalValue(details: RealEstateDetails): number {
  return areaToSqWah(details.area) * Math.max(0, details.appraisalPerSqWah);
}

/** ปีถือครองสำหรับ PIT: MIN(ปีโอน − ปีได้มา + 1, 10) */
export function holdingYearsForPit(
  acquiredYearBe: number,
  transferYearBe: number,
): number {
  const raw = transferYearBe - acquiredYearBe + 1;
  return Math.min(10, Math.max(1, raw));
}

export function holdingYearsRaw(
  acquiredYearBe: number,
  transferYearBe: number,
): number {
  return Math.max(1, transferYearBe - acquiredYearBe + 1);
}

export function pitExpenseRate(
  years: number,
  acquisitionMethod: AcquisitionMethod = "purchase_or_other",
): number {
  if (
    acquisitionMethod === "inheritance" ||
    acquisitionMethod === "gift"
  ) {
    return 0.5;
  }
  const y = Math.min(8, Math.max(1, years));
  return PIT_EXPENSE_RATES_BY_YEAR[y] ?? 0.5;
}

/** คิดภาษีอัตราก้าวหน้าบนเงินได้สุทธิเฉลี่ยต่อปี */
export function progressivePitOnAverageIncome(averageIncome: number): number {
  let remaining = Math.max(0, averageIncome);
  let tax = 0;
  let prevCap = 0;
  for (const bracket of PIT_BRACKETS) {
    const span = bracket.upTo - prevCap;
    const taxableHere = Math.min(remaining, span);
    if (taxableHere <= 0) break;
    tax += taxableHere * bracket.rate;
    remaining -= taxableHere;
    prevCap = bracket.upTo;
    if (!Number.isFinite(bracket.upTo)) break;
  }
  return tax;
}

/**
 * ภาษีเงินได้บุคคลธรรมดาจากการโอนอสังหา (Sheet4 flow)
 * ราคาประเมิน → หักค่าใช้จ่ายเหมา → หารปี → อัตราก้าวหน้า → × ปี
 */
export function estimateRealEstatePersonalIncomeTax(input: {
  appraisal: number;
  acquiredYearBe: number;
  transferYearBe: number;
  acquisitionMethod?: AcquisitionMethod;
}): number {
  const years = holdingYearsForPit(input.acquiredYearBe, input.transferYearBe);
  const expenseRate = pitExpenseRate(
    years,
    input.acquisitionMethod ?? "purchase_or_other",
  );
  const base = Math.max(0, input.appraisal);
  const net = base * (1 - expenseRate);
  const average = net / years;
  const taxPerYear = progressivePitOnAverageIncome(average);
  return Math.round(taxPerYear * years);
}

export function roughPitEstimateRate(appraisal: number): number {
  const v = Math.max(0, appraisal);
  for (const band of ROUGH_PIT_ESTIMATE_BANDS) {
    if (v < band.maxExclusive) return band.rate;
  }
  return 0.17;
}

// ─── SBT vs stamp ─────────────────────────────────────────────────────

export type TransferDutyKind = "specific_business_tax" | "stamp_duty";

export function transferDutyKind(holdingYears: number): TransferDutyKind {
  return holdingYears >= TAX_RULES.realEstate.holdingYearsForStampInsteadOfSbt
    ? "stamp_duty"
    : "specific_business_tax";
}

function roundBaht(n: number): number {
  return Math.round(Math.max(0, n));
}

// ─── Real estate transfer cost breakdown ──────────────────────────────

export interface CostLine {
  key: string;
  label: string;
  amount: number;
  note?: string;
}

export interface RealEstateTransferResult {
  appraisal: number;
  salePrice: number;
  baseForDuty: number;
  holdingYears: number;
  dutyKind: TransferDutyKind | "none";
  lines: CostLine[];
  total: number;
}

export interface RealEstateTransferInput {
  appraisal: number;
  salePrice?: number;
  costBasis?: number;
  acquiredYearBe?: number;
  transferYearBe?: number;
  acquisitionMethod?: AcquisitionMethod;
  registrationType: RealEstateRegistrationType;
  ownerEntityKind: OwnerEntityKind;
  recipientRelation: RecipientRelation;
  heirCount: number;
  /** ส่วนที่โอน (บาท) — ถ้าไม่ใส่ใช้ทั้งราคาประเมิน */
  transferPortion?: number;
}

export function estimateRealEstateTransfer(
  input: RealEstateTransferInput,
): RealEstateTransferResult {
  const R = TAX_RULES.realEstate;
  const fullAppraisal = Math.max(0, input.appraisal);
  const portion =
    input.transferPortion != null && input.transferPortion > 0
      ? Math.min(input.transferPortion, fullAppraisal || input.transferPortion)
      : fullAppraisal;
  const scale =
    fullAppraisal > 0 ? portion / fullAppraisal : 1;
  const appraisal = roundBaht(fullAppraisal * scale);
  const salePrice = roundBaht((input.salePrice ?? appraisal) * scale);
  const transferYear = input.transferYearBe ?? 2569;
  const acquiredYear = input.acquiredYearBe ?? transferYear;
  const holdingYears = holdingYearsRaw(acquiredYear, transferYear);
  const dutyKind = transferDutyKind(holdingYears);
  const heirs = Math.max(1, input.heirCount);
  const lines: CostLine[] = [];

  const addFee = (rate: number, note?: string) => {
    lines.push({
      key: "transfer_fee",
      label: `ค่าธรรมเนียมการโอน (${(rate * 100).toFixed(rate < 0.01 ? 1 : 0)}%)`,
      amount: roundBaht(appraisal * rate),
      note,
    });
  };

  const addSbtOrStamp = (base: number) => {
    if (dutyKind === "specific_business_tax") {
      lines.push({
        key: "sbt",
        label: `ภาษีธุรกิจเฉพาะ (${(R.specificBusinessTaxRate * 100).toFixed(1)}%)`,
        amount: roundBaht(base * R.specificBusinessTaxRate),
        note: `ถือครอง ${holdingYears} ปี (< ${R.holdingYearsForStampInsteadOfSbt} ปี)`,
      });
    } else {
      lines.push({
        key: "stamp",
        label: `อากรแสตมป์ (${(R.stampDutyRate * 100).toFixed(1)}%)`,
        amount: roundBaht(base * R.stampDutyRate),
        note: `ถือครอง ${holdingYears} ปี (≥ ${R.holdingYearsForStampInsteadOfSbt} ปี)`,
      });
    }
  };

  // ── 1. การให้ — คู่สมรส / บุตรชอบด้วยกฎหมาย ──
  if (input.registrationType === "gift") {
    const isPreferred =
      input.recipientRelation === "spouse" ||
      input.recipientRelation === "lineal_descendant";

    addFee(R.transferFeeRate);

    if (isPreferred) {
      const exempt = R.giftPitExemptionPerHeir * heirs;
      const taxable = Math.max(0, appraisal - exempt);
      lines.push({
        key: "pit_gift",
        label: "ภาษีเงินได้ (การให้)",
        amount: roundBaht(taxable * R.giftPitRate),
        note:
          taxable <= 0
            ? `ยกเว้นไม่เกิน ${R.giftPitExemptionPerHeir.toLocaleString("th-TH")} บาท/คน × ${heirs}`
            : `ส่วนเกินหลังยกเว้น ${exempt.toLocaleString("th-TH")} บาท × 5%`,
      });
    } else {
      // คนอื่น — อ้างอิงอัตราการให้ทั่วไป 10% ส่วนเกิน 20 ลบ. (ชีตสังหาริมทรัพย์)
      const exempt = TAX_RULES.gift.parentToChildExemption;
      const taxable = Math.max(0, appraisal - exempt);
      lines.push({
        key: "pit_gift",
        label: "ภาษีเงินได้ (การให้ — คนอื่น)",
        amount: roundBaht(taxable * TAX_RULES.gift.otherRate),
        note: `ส่วนเกินหลังยกเว้น ${exempt.toLocaleString("th-TH")} บาท × 10%`,
      });
    }

    addSbtOrStamp(appraisal);
  }

  // ── 2. โอนซื้อขาย จากบุคคลธรรมดา ──
  else if (
    input.registrationType === "sale" &&
    input.ownerEntityKind === "individual"
  ) {
    addFee(R.transferFeeRate);
    const pit = estimateRealEstatePersonalIncomeTax({
      appraisal,
      acquiredYearBe: acquiredYear,
      transferYearBe: transferYear,
      acquisitionMethod: input.acquisitionMethod,
    });
    lines.push({
      key: "pit_sale",
      label: "ภาษีเงินได้บุคคลธรรมดา (อัตราก้าวหน้า)",
      amount: pit,
      note: "หักค่าใช้จ่ายเหมา → เฉลี่ยต่อปี → × ปีถือครอง",
    });
    addSbtOrStamp(appraisal);
  }

  // ── 3. โอนจากนิติบุคคล ──
  else if (
    input.ownerEntityKind === "juristic" ||
    input.registrationType === "to_juristic"
  ) {
    // ถ้าเป็น to_juristic จากบุคคล — ใช้สูตรขายจากบุคคล + ค่าธรรมเนียม
    if (
      input.registrationType === "to_juristic" &&
      input.ownerEntityKind === "individual"
    ) {
      addFee(R.transferFeeRate);
      const pit = estimateRealEstatePersonalIncomeTax({
        appraisal,
        acquiredYearBe: acquiredYear,
        transferYearBe: transferYear,
        acquisitionMethod: input.acquisitionMethod,
      });
      lines.push({
        key: "pit_sale",
        label: "ภาษีเงินได้บุคคลธรรมดา (อัตราก้าวหน้า)",
        amount: pit,
      });
      addSbtOrStamp(appraisal);
    } else {
      const base = Math.max(salePrice, appraisal);
      addFee(R.transferFeeRate);
      lines.push({
        key: "withholding",
        label: "ภาษีเงินได้หัก ณ ที่จ่าย (1%)",
        amount: roundBaht(base * R.juristicWithholdingRate),
        note: "ฐาน = สูงกว่าระหว่างราคาขายกับราคาประเมิน",
      });
      lines.push({
        key: "sbt",
        label: `ภาษีธุรกิจเฉพาะ (${(R.specificBusinessTaxRate * 100).toFixed(1)}%)`,
        amount: roundBaht(base * R.specificBusinessTaxRate),
      });
      lines.push({
        key: "stamp",
        label: "อากรแสตมป์",
        amount: 0,
        note: "ยกเว้น",
      });
      const cost = (input.costBasis ?? 0) * scale;
      const profit = Math.max(0, base - cost);
      // ภาษีเงินได้นิติบุคคลโดยประมาณ 20% ของกำไร — ชีตระบุ “ฐาน × กำไรสุทธิ”
      const citRate = 0.2;
      lines.push({
        key: "cit",
        label: "ภาษีเงินได้นิติบุคคล (ประมาณ 20% ของกำไร)",
        amount: roundBaht(profit * citRate),
        note:
          profit <= 0
            ? "ไม่มีกำไรจากการขาย"
            : `กำไร ${(profit).toLocaleString("th-TH")} บาท`,
      });
    }
  }

  // ── 4. โอนมรดก ──
  else if (input.registrationType === "inheritance") {
    if (input.recipientRelation === "spouse") {
      lines.push({
        key: "transfer_fee",
        label: "ค่าธรรมเนียมการโอน",
        amount: 0,
        note: "ยกเว้น (คู่สมรส)",
      });
      lines.push({
        key: "pit_inheritance",
        label: "ภาษีเงินได้ / ภาษีมรดก",
        amount: 0,
        note: "ยกเว้นคู่สมรส",
      });
    } else if (
      input.recipientRelation === "lineal_descendant" ||
      input.recipientRelation === "ascendant"
    ) {
      addFee(R.inheritanceLinealFeeRate, "ผู้สืบสันดาน / บุพการี");
      const exempt = R.inheritanceExemptionPerHeir * heirs;
      const taxable = Math.max(0, appraisal - exempt);
      lines.push({
        key: "pit_inheritance",
        label: "ภาษีมรดก (ผู้สืบสันดาน/บุพการี)",
        amount: roundBaht(taxable * R.inheritanceLinealRate),
        note:
          taxable <= 0
            ? `ยกเว้นไม่เกิน ${R.inheritanceExemptionPerHeir.toLocaleString("th-TH")} บาท/คน`
            : `ส่วนเกิน × 5%`,
      });
      lines.push({
        key: "stamp",
        label: `อากรแสตมป์ (${(R.stampDutyRate * 100).toFixed(1)}%)`,
        amount: roundBaht(appraisal * R.stampDutyRate),
      });
    } else {
      // นิติ / คนอื่น
      addFee(R.transferFeeRate, "นิติบุคคล / คนอื่น");
      const exempt = R.inheritanceExemptionPerHeir * heirs;
      const taxable = Math.max(0, appraisal - exempt);
      lines.push({
        key: "pit_inheritance",
        label: "ภาษีมรดก (คนอื่น/นิติ)",
        amount: roundBaht(taxable * R.inheritanceOtherRate),
        note: taxable <= 0 ? "อยู่ในวงเงินยกเว้น" : "ส่วนเกิน × 10%",
      });
      lines.push({
        key: "stamp",
        label: `อากรแสตมป์ (${(R.stampDutyRate * 100).toFixed(1)}%)`,
        amount: roundBaht(appraisal * R.stampDutyRate),
      });
    }
  }

  const total = lines.reduce((s, l) => s + l.amount, 0);

  return {
    appraisal,
    salePrice,
    baseForDuty: Math.max(salePrice, appraisal),
    holdingYears,
    dutyKind:
      input.registrationType === "inheritance"
        ? "none"
        : input.ownerEntityKind === "juristic"
          ? "specific_business_tax"
          : dutyKind,
    lines,
    total,
  };
}

// ─── Movable property ─────────────────────────────────────────────────

export interface MovableTransferInput {
  value: number;
  costBasis?: number;
  transferType: MovableTransferType;
  recipientRelation: RecipientRelation;
  heirCount: number;
  /** หุ้นในตลาด / กองทุน → กำไรบุคคลธรรมดายกเว้นเมื่อขาย */
  marketExemptGain?: boolean;
}

export interface MovableTransferResult {
  value: number;
  lines: CostLine[];
  total: number;
}

export function estimateMovableTransfer(
  input: MovableTransferInput,
): MovableTransferResult {
  const value = Math.max(0, input.value);
  const heirs = Math.max(1, input.heirCount);
  const lines: CostLine[] = [];

  if (input.transferType === "gift") {
    const preferred =
      input.recipientRelation === "spouse" ||
      input.recipientRelation === "lineal_descendant" ||
      input.recipientRelation === "ascendant";
    if (preferred) {
      const exempt =
        TAX_RULES.gift.parentToChildExemption * heirs;
      const taxable = Math.max(0, value - exempt);
      lines.push({
        key: "gift_tax",
        label: "ภาษีเงินได้ (การให้ — คู่สมรส/บุพการี/ผู้สืบสันดาน)",
        amount: roundBaht(taxable * TAX_RULES.gift.rate),
        note:
          taxable <= 0
            ? `ยกเว้นไม่เกิน ${TAX_RULES.gift.parentToChildExemption.toLocaleString("th-TH")} บาท/คน`
            : "ส่วนเกิน × 5%",
      });
    } else {
      const exempt = TAX_RULES.gift.parentToChildExemption;
      const taxable = Math.max(0, value - exempt);
      lines.push({
        key: "gift_tax",
        label: "ภาษีเงินได้ (การให้ — คนอื่น)",
        amount: roundBaht(taxable * TAX_RULES.gift.otherRate),
        note: "ส่วนเกิน 20 ลบ. × 10%",
      });
    }
  } else if (input.transferType === "inheritance") {
    if (input.recipientRelation === "spouse") {
      lines.push({
        key: "inheritance_tax",
        label: "ภาษีมรดก",
        amount: 0,
        note: "ยกเว้นคู่สมรส",
      });
    } else if (
      input.recipientRelation === "lineal_descendant" ||
      input.recipientRelation === "ascendant"
    ) {
      const exempt = TAX_RULES.inheritance.estateExemption * heirs;
      const taxable = Math.max(0, value - exempt);
      lines.push({
        key: "inheritance_tax",
        label: "ภาษีมรดก (บุพการี/ผู้สืบสันดาน)",
        amount: roundBaht(taxable * TAX_RULES.inheritance.linealRate),
      });
    } else {
      const exempt = TAX_RULES.inheritance.estateExemption;
      const taxable = Math.max(0, value - exempt);
      lines.push({
        key: "inheritance_tax",
        label: "ภาษีมรดก (คนอื่น)",
        amount: roundBaht(taxable * TAX_RULES.inheritance.otherRate),
      });
    }
  } else if (input.transferType === "sale") {
    if (input.marketExemptGain) {
      lines.push({
        key: "pit_sale",
        label: "ภาษีเงินได้บุคคล (ขายหุ้นในตลาด/กองทุน)",
        amount: 0,
        note: "โดยหลักได้รับยกเว้นภาษีเงินได้",
      });
    } else {
      const gain = Math.max(0, value - (input.costBasis ?? 0));
      // ใช้ PIT ก้าวหน้าแบบเฉลี่ยปีเดียว (ประมาณการ)
      const tax = roundBaht(progressivePitOnAverageIncome(gain));
      lines.push({
        key: "pit_sale",
        label: "ภาษีเงินได้จากกำไร (หุ้นนอกตลาด)",
        amount: tax,
        note: `กำไร ${(gain).toLocaleString("th-TH")} บาท × อัตราก้าวหน้า`,
      });
    }
  } else {
    // to_juristic — ประมาณการแบบขาย
    const gain = Math.max(0, value - (input.costBasis ?? 0));
    lines.push({
      key: "pit_sale",
      label: "ภาษีเงินได้ (โอนเข้านิติ — ประมาณการ)",
      amount: roundBaht(progressivePitOnAverageIncome(gain)),
    });
  }

  return {
    value,
    lines,
    total: lines.reduce((s, l) => s + l.amount, 0),
  };
}

// ─── Simple gift / inheritance (เครื่องคำนวณเดิม — ใช้บนหน้าประมาณการ) ─

export type TaxRecipientKind = "lineal" | "other";
export type GiftExemptionBand = "parent_to_child" | "general";

export interface GiftTaxInput {
  amount: number;
  band: GiftExemptionBand;
  usedExemption?: number;
}

export interface GiftTaxResult {
  amount: number;
  exemptionLimit: number;
  usedExemption: number;
  remainingExemption: number;
  taxable: number;
  tax: number;
  rate: number;
}

export interface InheritanceTaxInput {
  netEstate: number;
  recipient: TaxRecipientKind;
}

export interface InheritanceTaxResult {
  netEstate: number;
  exemption: number;
  taxable: number;
  tax: number;
  rate: number;
}

export function giftExemptionLimit(band: GiftExemptionBand): number {
  return band === "parent_to_child"
    ? TAX_RULES.gift.parentToChildExemption
    : TAX_RULES.gift.generalExemption;
}

export function estimateGiftTax(input: GiftTaxInput): GiftTaxResult {
  const amount = Math.max(0, input.amount);
  const exemptionLimit = giftExemptionLimit(input.band);
  const usedExemption = Math.min(
    exemptionLimit,
    Math.max(0, input.usedExemption ?? 0),
  );
  const remainingExemption = Math.max(0, exemptionLimit - usedExemption);
  const taxable = Math.max(0, amount - remainingExemption);
  const rate =
    input.band === "parent_to_child"
      ? TAX_RULES.gift.rate
      : TAX_RULES.gift.otherRate;
  const tax = Math.round(taxable * rate);

  return {
    amount,
    exemptionLimit,
    usedExemption,
    remainingExemption,
    taxable,
    tax,
    rate,
  };
}

export function estimateInheritanceTax(
  input: InheritanceTaxInput,
): InheritanceTaxResult {
  const netEstate = Math.max(0, input.netEstate);
  const exemption = TAX_RULES.inheritance.estateExemption;
  const taxable = Math.max(0, netEstate - exemption);
  const rate =
    input.recipient === "lineal"
      ? TAX_RULES.inheritance.linealRate
      : TAX_RULES.inheritance.otherRate;
  const tax = Math.round(taxable * rate);

  return { netEstate, exemption, taxable, tax, rate };
}

export function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(rate * 100 % 1 === 0 ? 0 : 1)}%`;
}

// ─── Asset helpers ────────────────────────────────────────────────────

export function shareDisplayValue(share: ShareDetails): number {
  if (share.subtype === "listed") {
    return share.marketValue ?? share.parValue ?? 0;
  }
  return share.bookValue ?? share.parValue ?? share.marketValue ?? 0;
}

export function resolveAssetValue(asset: Asset): number {
  if (asset.type === "real_estate" && asset.realEstate) {
    const appraised = appraisalValue(asset.realEstate);
    return appraised > 0 ? appraised : asset.value;
  }
  if (asset.type === "business" && asset.share) {
    const v = shareDisplayValue(asset.share);
    return v > 0 ? v : asset.value;
  }
  return asset.value;
}

export function defaultRecipientRelation(
  asset: Asset,
): RecipientRelation {
  return asset.recipientRelation ?? "lineal_descendant";
}

/** คำนวณค่าใช้จ่ายโอนจากทรัพย์สิน + ประเภทจดทะเบียน */
export function estimateTransferCostForAsset(
  asset: Asset,
  opts: {
    registrationType: RealEstateRegistrationType | MovableTransferType;
    recipientRelation?: RecipientRelation;
    transferAmount?: number;
    transferYearBe?: number;
    heirCount?: number;
  },
): { total: number; lines: CostLine[]; kind: "real_estate" | "movable" } {
  const relation =
    opts.recipientRelation ?? defaultRecipientRelation(asset);
  const heirs = Math.max(
    1,
    opts.heirCount ??
      asset.heirCount ??
      (asset.beneficiaries.length || 1),
  );

  if (asset.type === "real_estate") {
    const re = asset.realEstate;
    const appraisal = re ? appraisalValue(re) : asset.value;
    const result = estimateRealEstateTransfer({
      appraisal,
      salePrice: re?.salePrice,
      costBasis: re?.costBasis,
      acquiredYearBe: re?.acquiredYearBe,
      transferYearBe: opts.transferYearBe ?? re?.transferYearBe,
      acquisitionMethod: re?.acquisitionMethod,
      registrationType: opts.registrationType as RealEstateRegistrationType,
      ownerEntityKind: asset.ownerEntityKind ?? "individual",
      recipientRelation: relation,
      heirCount: heirs,
      transferPortion: opts.transferAmount,
    });
    return { total: result.total, lines: result.lines, kind: "real_estate" };
  }

  const value = opts.transferAmount ?? resolveAssetValue(asset);
  const marketExempt =
    asset.type === "business"
      ? asset.share?.subtype === "listed"
      : asset.type === "other"
        ? asset.otherDetails?.subtype === "fund"
        : asset.type === "finance";

  const result = estimateMovableTransfer({
    value,
    costBasis: asset.share?.costBasis,
    transferType: opts.registrationType as MovableTransferType,
    recipientRelation: relation,
    heirCount: heirs,
    marketExemptGain: marketExempt,
  });
  return { total: result.total, lines: result.lines, kind: "movable" };
}

/** คำนวณ estimatedTax ของขั้นแผนโอนใหม่จากทรัพย์สินที่ผูกไว้ */
export function recalculateStepTax(
  step: TransferStep,
  assets: Asset[],
): number | null {
  if (!step.assetId || !step.registrationType) return step.estimatedTax;
  const asset = assets.find((a) => a.id === step.assetId);
  if (!asset) return step.estimatedTax;

  const yearMatch = step.yearLabel.match(/25\d{2}/);
  const transferYearBe = yearMatch ? Number(yearMatch[0]) : undefined;

  const { total } = estimateTransferCostForAsset(asset, {
    registrationType: step.registrationType,
    recipientRelation: step.recipientRelation,
    transferAmount: step.transferAmount,
    transferYearBe,
    heirCount: step.heirCount,
  });
  return total;
}

export function summarizePortfolioTax(assets: Asset[]): {
  giftAccumulated: number;
  inheritanceWithoutPlan: number;
  remainingExemptionThisYear: number;
} {
  const totalValue = assets.reduce((s, a) => s + resolveAssetValue(a), 0);
  const inheritance = estimateInheritanceTax({
    netEstate: totalValue,
    recipient: "lineal",
  });

  const giftSteps = assets.filter((a) => a.plan === "transfer");
  let giftAccumulated = 0;
  for (const a of giftSteps) {
    const { total } = estimateTransferCostForAsset(a, {
      registrationType: "gift",
      recipientRelation: defaultRecipientRelation(a),
    });
    giftAccumulated += total;
  }

  return {
    giftAccumulated,
    inheritanceWithoutPlan: inheritance.tax,
    remainingExemptionThisYear: TAX_RULES.gift.parentToChildExemption,
  };
}
