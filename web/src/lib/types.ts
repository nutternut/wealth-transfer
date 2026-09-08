export type AssetType = "finance" | "real_estate" | "business" | "other";

export type PlanStatus = "transfer" | "sell" | "keep" | "undecided";

export type DocumentStatus = "complete" | "incomplete" | "outdated";

export type PersonId = string;

export type FamilyRelation =
  | "parent"
  | "spouse"
  | "child"
  | "sibling"
  | "other";

/** อสังหา — จากชีต INPUT */
export type RealEstateSubtype =
  | "land"
  | "land_building"
  | "building"
  | "condo";

/** หุ้น — ในตลาด / นอกตลาด */
export type ShareSubtype = "listed" | "unlisted";

/** สังหาริมทรัพย์อื่นๆ */
export type OtherSubtype = "fund" | "vehicle" | "other";

/** วิธีได้มาของอสังหา */
export type AcquisitionMethod = "inheritance" | "gift" | "purchase_or_other";

export type OwnerEntityKind = "individual" | "juristic";

/** ผู้รับโอนตาม Asset Mapping */
export type RecipientRelation =
  | "spouse"
  | "lineal_descendant"
  | "ascendant"
  | "other";

/** ประเภทจดทะเบียนอสังหา */
export type RealEstateRegistrationType =
  | "gift"
  | "sale"
  | "inheritance"
  | "to_juristic";

/** ประเภทโอนสังหาริมทรัพย์ */
export type MovableTransferType = "gift" | "inheritance" | "sale" | "to_juristic";

export interface OwnershipShare {
  personId: PersonId;
  percent: number;
  role?: string;
}

/** เนื้อที่: ไร่ / งาน / ตารางวา */
export interface LandArea {
  rai: number;
  ngan: number;
  sqWah: number;
}

export interface RealEstateDetails {
  subtype: RealEstateSubtype;
  area: LandArea;
  /** ราคาประเมินต่อตารางวา (บาท) */
  appraisalPerSqWah: number;
  /** ราคาซื้อขาย (บาท) — ใช้เมื่อโอนซื้อขาย / จากนิติ */
  salePrice?: number;
  /** ราคาต้นทุน — กรณีโอนออกจากนิติบุคคล */
  costBasis?: number;
  /** ปี พ.ศ. ที่ได้กรรมสิทธิ์ */
  acquiredYearBe?: number;
  /** ปี พ.ศ. ที่โอน */
  transferYearBe?: number;
  acquisitionMethod?: AcquisitionMethod;
}

export interface ShareDetails {
  subtype: ShareSubtype;
  companyName?: string;
  registeredCapital?: number;
  ownershipPercent?: number;
  parValue?: number;
  marketValue?: number;
  bookValue?: number;
  costBasis?: number;
}

export interface OtherDetails {
  subtype: OtherSubtype;
}

export interface DiagramNode {
  id: string;
  label: string;
  sublabel?: string;
  kind: "person" | "asset";
  x: number;
  y: number;
}

export interface DiagramEdge {
  id: string;
  from: string;
  to: string;
  label: string;
}

export interface OwnershipGraph {
  assetId: string;
  title: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

export interface Asset {
  id: string;
  type: AssetType;
  name: string;
  /** มูลค่าแสดงผลหลัก (บาท) — คำนวณจากรายละเอียดเมื่อมี */
  value: number;
  valuationDate?: string;
  ownership: OwnershipShare[];
  beneficiaries: PersonId[];
  plan: PlanStatus;
  documents: DocumentStatus;
  controlPersonId?: PersonId;
  notes?: string;
  /** บุคคลธรรมดา / นิติบุคคล */
  ownerEntityKind?: OwnerEntityKind;
  /** จำนวนทายาท (ใช้ยกเว้นภาษีการให้ต่อคน) */
  heirCount?: number;
  /** ความสัมพันธ์ผู้รับโอนหลัก */
  recipientRelation?: RecipientRelation;
  realEstate?: RealEstateDetails;
  share?: ShareDetails;
  otherDetails?: OtherDetails;
}

export type TransferStepStatus =
  | "review"
  | "not_started"
  | "concept"
  | "done";

export interface TransferStep {
  id: string;
  yearLabel: string;
  title: string;
  note: string;
  estimatedTax: number | null;
  status: TransferStepStatus;
  order: number;
  /** เชื่อมไปยังทรัพย์สินเพื่อคำนวณจากสูตร Asset Mapping */
  assetId?: string;
  registrationType?: RealEstateRegistrationType | MovableTransferType;
  recipientRelation?: RecipientRelation;
  /** ส่วนมูลค่าที่โอนในขั้นนี้ (บาท) — ถ้าไม่ใส่ใช้ทั้งก้อน */
  transferAmount?: number;
  /** ทับจำนวนทายาทของทรัพย์สิน (เช่น โอนให้คนเดียว = 1) */
  heirCount?: number;
}

export interface FamilyMember {
  id: PersonId;
  name: string;
  shortName: string;
  relation?: FamilyRelation;
  /** สี avatar ที่เลือกเอง (hex) — ถ้าไม่มีใช้สีตามความสัมพันธ์ */
  avatarColor?: string;
  /** รูป avatar เป็น data URL หรือ URL */
  avatarUrl?: string;
}

export interface FamilyProfile {
  name: string;
  note?: string;
}

export type DocumentItemStatus = "draft" | "not_started" | "approved";

export type DocumentItemCategory = "will" | "gift" | "power_of_attorney" | "ownership" | "other";

export interface DocumentItem {
  id: string;
  name: string;
  status: DocumentItemStatus;
  category: DocumentItemCategory;
  description: string;
  /** ปี พ.ศ. หรือวันที่อัปเดตล่าสุด */
  updatedLabel?: string;
  /** เชื่อมกับขั้นในแผนโอน (ถ้ามี) */
  relatedStepId?: string;
  /** เชื่อมกับทรัพย์สิน (ถ้ามี) */
  relatedAssetId?: string;
}
