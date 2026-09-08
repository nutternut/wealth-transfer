import type {
  AssetType,
  DocumentItemCategory,
  DocumentItemStatus,
  DocumentStatus,
  FamilyMember,
  FamilyRelation,
  PersonId,
  PlanStatus,
  RealEstateRegistrationType,
  RealEstateSubtype,
  RecipientRelation,
  ShareSubtype,
  TransferStepStatus,
} from "./types";
import { FAMILY } from "./mock-data";

export function formatBaht(value: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatBahtCompact(value: number): string {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `฿${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  return formatBaht(value);
}

export function personName(
  id: PersonId,
  family: FamilyMember[] = FAMILY,
): string {
  return family.find((p) => p.id === id)?.name ?? id;
}

export const FAMILY_RELATION_LABEL: Record<FamilyRelation, string> = {
  parent: "บุพการี",
  spouse: "คู่สมรส",
  child: "บุตร / ผู้สืบสันดาน",
  sibling: "พี่น้อง",
  other: "อื่นๆ",
};

export const ASSET_TYPE_LABEL: Record<AssetType, string> = {
  finance: "การเงิน",
  real_estate: "อสังหา",
  business: "ธุรกิจ",
  other: "อื่นๆ",
};

export const REAL_ESTATE_SUBTYPE_LABEL: Record<RealEstateSubtype, string> = {
  land: "ที่ดิน",
  land_building: "ที่ดินพร้อมสิ่งปลูกสร้าง",
  building: "สิ่งปลูกสร้าง",
  condo: "ห้องชุด",
};

export const SHARE_SUBTYPE_LABEL: Record<ShareSubtype, string> = {
  listed: "หุ้นในตลาดหลักทรัพย์",
  unlisted: "หุ้นนอกตลาด",
};

export const RECIPIENT_RELATION_LABEL: Record<RecipientRelation, string> = {
  spouse: "คู่สมรส",
  lineal_descendant: "ผู้สืบสันดาน / บุตร",
  ascendant: "บุพการี",
  other: "อื่นๆ",
};

export const REGISTRATION_TYPE_LABEL: Record<
  RealEstateRegistrationType,
  string
> = {
  gift: "การให้",
  sale: "การโอนซื้อขาย",
  inheritance: "การโอนมรดก",
  to_juristic: "การโอนเข้านิติบุคคล",
};

export const PLAN_LABEL: Record<PlanStatus, string> = {
  transfer: "โอน",
  sell: "ขาย",
  keep: "คงไว้",
  undecided: "รอตัดสินใจ",
};

export const DOC_LABEL: Record<DocumentStatus, string> = {
  complete: "ครบ",
  incomplete: "ไม่ครบ",
  outdated: "ราคาเก่า",
};

export const DOC_ITEM_STATUS_LABEL: Record<DocumentItemStatus, string> = {
  draft: "ร่างแล้ว",
  not_started: "ยังไม่เริ่ม",
  approved: "ผ่านแล้ว",
};

export const DOC_CATEGORY_LABEL: Record<DocumentItemCategory, string> = {
  will: "พินัยกรรม",
  gift: "หนังสือให้",
  power_of_attorney: "มอบอำนาจ",
  ownership: "เอกสารสิทธิ์",
  other: "อื่นๆ",
};

export const STEP_STATUS_LABEL: Record<TransferStepStatus, string> = {
  review: "รอตรวจทาน",
  not_started: "ยังไม่เริ่ม",
  concept: "แนวคิดเบื้องต้น",
  done: "เสร็จแล้ว",
};
