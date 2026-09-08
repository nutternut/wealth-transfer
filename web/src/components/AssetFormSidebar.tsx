"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, X } from "lucide-react";
import { useWealth } from "@/context/WealthContext";
import {
  REAL_ESTATE_SUBTYPE_LABEL,
  RECIPIENT_RELATION_LABEL,
  SHARE_SUBTYPE_LABEL,
} from "@/lib/format";
import { appraisalValue, resolveAssetValue } from "@/lib/tax";
import type {
  AcquisitionMethod,
  Asset,
  AssetType,
  DocumentStatus,
  OtherSubtype,
  OwnerEntityKind,
  PlanStatus,
  RealEstateSubtype,
  RecipientRelation,
  ShareSubtype,
} from "@/lib/types";

interface AssetFormSidebarProps {
  open: boolean;
  asset: Asset | null;
  onClose: () => void;
  onSave: (asset: Asset) => void;
}

const emptyForm = (): Omit<Asset, "id"> => ({
  type: "business",
  name: "",
  value: 0,
  valuationDate: "2569-03",
  ownership: [{ personId: "father", percent: 100 }],
  beneficiaries: [],
  plan: "undecided",
  documents: "incomplete",
  controlPersonId: "father",
  ownerEntityKind: "individual",
  heirCount: 1,
  recipientRelation: "lineal_descendant",
  realEstate: {
    subtype: "land",
    area: { rai: 0, ngan: 0, sqWah: 0 },
    appraisalPerSqWah: 0,
    acquisitionMethod: "purchase_or_other",
    acquiredYearBe: 2560,
    transferYearBe: 2569,
  },
  share: {
    subtype: "unlisted",
    companyName: "",
    ownershipPercent: 100,
  },
  otherDetails: { subtype: "other" },
});

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 transition-all focus:border-mint-brand focus:ring-2 focus:ring-mint-200 focus:outline-none";

export function AssetFormSidebar({
  open,
  asset,
  onClose,
  onSave,
}: AssetFormSidebarProps) {
  const { family } = useWealth();
  const [form, setForm] = useState<Omit<Asset, "id"> & { id?: string }>(
    emptyForm(),
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    if (asset) setForm({ ...emptyForm(), ...asset });
    else setForm(emptyForm());
  }, [open, asset]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const computedValue = useMemo(() => {
    const draft = { ...form, id: form.id ?? "draft" } as Asset;
    return resolveAssetValue(draft);
  }, [form]);

  if (!open || !mounted) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const id = form.id ?? `a-${Date.now()}`;
    const payload: Asset = {
      id,
      type: form.type,
      name: form.name.trim() || "ทรัพย์สินใหม่",
      value: computedValue || Number(form.value) || 0,
      valuationDate: form.valuationDate,
      ownership: form.ownership,
      beneficiaries: form.beneficiaries,
      plan: form.plan,
      documents: form.documents,
      controlPersonId: form.controlPersonId,
      ownerEntityKind: form.ownerEntityKind,
      heirCount: form.heirCount,
      recipientRelation: form.recipientRelation,
      notes: form.notes,
      realEstate: form.type === "real_estate" ? form.realEstate : undefined,
      share: form.type === "business" ? form.share : undefined,
      otherDetails:
        form.type === "other" || form.type === "finance"
          ? form.otherDetails
          : undefined,
    };
    onSave(payload);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={asset ? "แก้ไขทรัพย์สิน" : "เพิ่มทรัพย์สินใหม่"}
    >
      <button
        type="button"
        className="absolute inset-0 z-0 bg-slate-900/45 backdrop-blur-sm"
        aria-label="ปิด"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-slate-100 bg-white text-left shadow-2xl">
        <div className="flex items-center justify-between border-b border-mint-100 bg-mint-brand-light px-6 py-4">
          <div className="flex items-center space-x-2.5 text-mint-brand-dark">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm">
              <Plus className="h-4 w-4 text-mint-brand" />
            </div>
            <h3 className="text-sm font-bold">
              {asset ? "แก้ไขทรัพย์สิน" : "เพิ่มทรัพย์สินใหม่"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-white hover:text-slate-600"
            aria-label="ปิด"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="max-h-[min(70vh,560px)] space-y-4 overflow-y-auto px-6 py-5">
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
              ฟิลด์ตาม Asset Mapping — ใช้คำนวณภาษีใน Transfer Plan
            </p>

            <Field label="ประเภททรัพย์สิน">
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, type: e.target.value as AssetType }))
                }
                className={fieldClass}
              >
                <option value="finance">เงินฝาก / การเงิน</option>
                <option value="real_estate">อสังหาริมทรัพย์</option>
                <option value="business">หุ้นส่วนบริษัท</option>
                <option value="other">สังหาริมทรัพย์อื่นๆ</option>
              </select>
            </Field>

            <Field label="ชื่อ">
              <input
                className={fieldClass}
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="เช่น หุ้นบริษัท ABC จำกัด"
              />
            </Field>

            {form.type === "real_estate" && form.realEstate && (
              <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                  รายละเอียดอสังหา
                </p>
                <Field label="ประเภทย่อย">
                  <select
                    className={fieldClass}
                    value={form.realEstate.subtype}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        realEstate: f.realEstate && {
                          ...f.realEstate,
                          subtype: e.target.value as RealEstateSubtype,
                        },
                      }))
                    }
                  >
                    {(
                      Object.keys(REAL_ESTATE_SUBTYPE_LABEL) as RealEstateSubtype[]
                    ).map((k) => (
                      <option key={k} value={k}>
                        {REAL_ESTATE_SUBTYPE_LABEL[k]}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="grid grid-cols-3 gap-2">
                  <Field label="ไร่">
                    <input
                      type="number"
                      className={fieldClass}
                      value={form.realEstate.area.rai}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          realEstate: f.realEstate && {
                            ...f.realEstate,
                            area: {
                              ...f.realEstate.area,
                              rai: Number(e.target.value),
                            },
                          },
                        }))
                      }
                    />
                  </Field>
                  <Field label="งาน">
                    <input
                      type="number"
                      className={fieldClass}
                      value={form.realEstate.area.ngan}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          realEstate: f.realEstate && {
                            ...f.realEstate,
                            area: {
                              ...f.realEstate.area,
                              ngan: Number(e.target.value),
                            },
                          },
                        }))
                      }
                    />
                  </Field>
                  <Field label="ตร.ว.">
                    <input
                      type="number"
                      className={fieldClass}
                      value={form.realEstate.area.sqWah}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          realEstate: f.realEstate && {
                            ...f.realEstate,
                            area: {
                              ...f.realEstate.area,
                              sqWah: Number(e.target.value),
                            },
                          },
                        }))
                      }
                    />
                  </Field>
                </div>
                <Field label="ราคาประเมินต่อตร.ว. (บาท)">
                  <input
                    type="number"
                    className={fieldClass}
                    value={form.realEstate.appraisalPerSqWah}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        realEstate: f.realEstate && {
                          ...f.realEstate,
                          appraisalPerSqWah: Number(e.target.value),
                        },
                      }))
                    }
                  />
                </Field>
                <p className="text-[11px] text-slate-500">
                  ราคาประเมินรวม{" "}
                  <span className="font-semibold tabular-nums text-slate-700">
                    {appraisalValue(form.realEstate).toLocaleString("th-TH")} บาท
                  </span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="ราคาซื้อขาย">
                    <input
                      type="number"
                      className={fieldClass}
                      value={form.realEstate.salePrice ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          realEstate: f.realEstate && {
                            ...f.realEstate,
                            salePrice: Number(e.target.value) || undefined,
                          },
                        }))
                      }
                    />
                  </Field>
                  <Field label="ราคาต้นทุน">
                    <input
                      type="number"
                      className={fieldClass}
                      value={form.realEstate.costBasis ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          realEstate: f.realEstate && {
                            ...f.realEstate,
                            costBasis: Number(e.target.value) || undefined,
                          },
                        }))
                      }
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="ปีได้มา (พ.ศ.)">
                    <input
                      type="number"
                      className={fieldClass}
                      value={form.realEstate.acquiredYearBe ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          realEstate: f.realEstate && {
                            ...f.realEstate,
                            acquiredYearBe: Number(e.target.value) || undefined,
                          },
                        }))
                      }
                    />
                  </Field>
                  <Field label="ปีโอน (พ.ศ.)">
                    <input
                      type="number"
                      className={fieldClass}
                      value={form.realEstate.transferYearBe ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          realEstate: f.realEstate && {
                            ...f.realEstate,
                            transferYearBe: Number(e.target.value) || undefined,
                          },
                        }))
                      }
                    />
                  </Field>
                </div>
                <Field label="วิธีได้มา">
                  <select
                    className={fieldClass}
                    value={form.realEstate.acquisitionMethod ?? "purchase_or_other"}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        realEstate: f.realEstate && {
                          ...f.realEstate,
                          acquisitionMethod: e.target
                            .value as AcquisitionMethod,
                        },
                      }))
                    }
                  >
                    <option value="inheritance">มรดก</option>
                    <option value="gift">ได้รับให้โดยเสน่หา</option>
                    <option value="purchase_or_other">ซื้อหรือได้มาโดยทางอื่น</option>
                  </select>
                </Field>
              </div>
            )}

            {form.type === "business" && form.share && (
              <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                  รายละเอียดหุ้น
                </p>
                <Field label="ประเภทหุ้น">
                  <select
                    className={fieldClass}
                    value={form.share.subtype}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        share: f.share && {
                          ...f.share,
                          subtype: e.target.value as ShareSubtype,
                        },
                      }))
                    }
                  >
                    {(Object.keys(SHARE_SUBTYPE_LABEL) as ShareSubtype[]).map(
                      (k) => (
                        <option key={k} value={k}>
                          {SHARE_SUBTYPE_LABEL[k]}
                        </option>
                      ),
                    )}
                  </select>
                </Field>
                <Field label="ชื่อบริษัท">
                  <input
                    className={fieldClass}
                    value={form.share.companyName ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        share: f.share && {
                          ...f.share,
                          companyName: e.target.value,
                        },
                      }))
                    }
                  />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="สัดส่วนถือหุ้น (%)">
                    <input
                      type="number"
                      className={fieldClass}
                      value={form.share.ownershipPercent ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          share: f.share && {
                            ...f.share,
                            ownershipPercent: Number(e.target.value),
                          },
                        }))
                      }
                    />
                  </Field>
                  <Field label="ทุนจดทะเบียน">
                    <input
                      type="number"
                      className={fieldClass}
                      value={form.share.registeredCapital ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          share: f.share && {
                            ...f.share,
                            registeredCapital: Number(e.target.value),
                          },
                        }))
                      }
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="ราคาพาร์">
                    <input
                      type="number"
                      className={fieldClass}
                      value={form.share.parValue ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          share: f.share && {
                            ...f.share,
                            parValue: Number(e.target.value),
                          },
                        }))
                      }
                    />
                  </Field>
                  <Field label="Book Value">
                    <input
                      type="number"
                      className={fieldClass}
                      value={form.share.bookValue ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          share: f.share && {
                            ...f.share,
                            bookValue: Number(e.target.value),
                          },
                        }))
                      }
                    />
                  </Field>
                  <Field label="ราคาตลาด">
                    <input
                      type="number"
                      className={fieldClass}
                      value={form.share.marketValue ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          share: f.share && {
                            ...f.share,
                            marketValue: Number(e.target.value),
                          },
                        }))
                      }
                    />
                  </Field>
                  <Field label="ต้นทุน">
                    <input
                      type="number"
                      className={fieldClass}
                      value={form.share.costBasis ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          share: f.share && {
                            ...f.share,
                            costBasis: Number(e.target.value),
                          },
                        }))
                      }
                    />
                  </Field>
                </div>
              </div>
            )}

            {(form.type === "finance" || form.type === "other") && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="มูลค่า (บาท)">
                  <input
                    className={fieldClass}
                    type="number"
                    value={form.value}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, value: Number(e.target.value) }))
                    }
                  />
                </Field>
                {form.type === "other" && form.otherDetails && (
                  <Field label="ประเภทย่อย">
                    <select
                      className={fieldClass}
                      value={form.otherDetails.subtype}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          otherDetails: {
                            subtype: e.target.value as OtherSubtype,
                          },
                        }))
                      }
                    >
                      <option value="fund">กองทุน</option>
                      <option value="vehicle">รถยนต์</option>
                      <option value="other">อื่นๆ</option>
                    </select>
                  </Field>
                )}
              </div>
            )}

            {(form.type === "real_estate" || form.type === "business") && (
              <p className="rounded-xl bg-mint-50/80 px-3 py-2 text-[11px] text-mint-brand-dark">
                มูลค่าคำนวณอัตโนมัติ{" "}
                <span className="font-semibold tabular-nums">
                  {computedValue.toLocaleString("th-TH")} บาท
                </span>
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label="วันที่ประเมิน">
                <input
                  className={fieldClass}
                  value={form.valuationDate ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, valuationDate: e.target.value }))
                  }
                />
              </Field>
              <Field label="จำนวนทายาท">
                <input
                  type="number"
                  min={1}
                  className={fieldClass}
                  value={form.heirCount ?? 1}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      heirCount: Math.max(1, Number(e.target.value) || 1),
                    }))
                  }
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="ผู้ถือกรรมสิทธิ์">
                <select
                  className={fieldClass}
                  value={form.ownerEntityKind ?? "individual"}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      ownerEntityKind: e.target.value as OwnerEntityKind,
                    }))
                  }
                >
                  <option value="individual">บุคคลธรรมดา</option>
                  <option value="juristic">นิติบุคคล</option>
                </select>
              </Field>
              <Field label="ผู้รับโอนหลัก">
                <select
                  className={fieldClass}
                  value={form.recipientRelation ?? "lineal_descendant"}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      recipientRelation: e.target.value as RecipientRelation,
                    }))
                  }
                >
                  {(
                    Object.keys(RECIPIENT_RELATION_LABEL) as RecipientRelation[]
                  ).map((k) => (
                    <option key={k} value={k}>
                      {RECIPIENT_RELATION_LABEL[k]}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="แผน">
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ["transfer", "โอน"],
                    ["sell", "ขาย"],
                    ["keep", "คงไว้"],
                    ["undecided", "ยังไม่ตัดสินใจ"],
                  ] as [PlanStatus, string][]
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, plan: value }))}
                    className={
                      form.plan === value
                        ? "rounded-xl border border-mint-200 bg-mint-brand-light px-3 py-2 text-xs font-semibold text-mint-brand"
                        : "rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50"
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="ผู้ควบคุม">
              <select
                className={fieldClass}
                value={form.controlPersonId ?? "father"}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    controlPersonId: e.target
                      .value as Asset["controlPersonId"],
                  }))
                }
              >
                {family.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="สถานะเอกสาร">
              <select
                className={fieldClass}
                value={form.documents}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    documents: e.target.value as DocumentStatus,
                  }))
                }
              >
                <option value="complete">ครบ</option>
                <option value="incomplete">ไม่ครบ</option>
                <option value="outdated">ราคาเก่า</option>
              </select>
            </Field>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-50 bg-slate-50/50 px-6 py-4">
            <button type="button" onClick={onClose} className="ui-btn ui-btn-ghost">
              ยกเลิก
            </button>
            <button type="submit" className="ui-btn ui-btn-primary">
              บันทึก
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-xs font-semibold text-slate-500">{label}</span>
      {children}
    </label>
  );
}
