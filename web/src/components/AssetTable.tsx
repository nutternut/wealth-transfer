"use client";

import clsx from "clsx";
import { Plus } from "lucide-react";
import {
  ASSET_TYPE_LABEL,
  DOC_LABEL,
  PLAN_LABEL,
  formatBaht,
  personName,
} from "@/lib/format";
import { useWealth } from "@/context/WealthContext";
import type { Asset, AssetType, DocumentStatus, PlanStatus } from "@/lib/types";

const TYPE_DOT: Record<AssetType, string> = {
  finance: "bg-sky-500",
  real_estate: "bg-rose-500",
  business: "bg-mint-brand",
  other: "bg-amber-500",
};

const PLAN_BADGE: Record<PlanStatus, string> = {
  keep: "bg-emerald-50 text-emerald-700 border-emerald-100",
  transfer: "bg-mint-brand-light text-mint-brand-dark border-mint-100",
  sell: "bg-amber-50 text-amber-700 border-amber-100",
  undecided: "bg-slate-50 text-slate-500 border-slate-100",
};

const DOC_BADGE: Record<DocumentStatus, string> = {
  complete: "bg-emerald-50 text-emerald-700 border-emerald-100",
  incomplete: "bg-rose-50 text-rose-700 border-rose-100",
  outdated: "bg-amber-50 text-amber-700 border-amber-100",
};

interface AssetTableProps {
  assets: Asset[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEdit: (asset: Asset) => void;
  onAdd?: () => void;
}

export function AssetTable({
  assets,
  selectedId,
  onSelect,
  onEdit,
  onAdd,
}: AssetTableProps) {
  const { family } = useWealth();

  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-slate-100 bg-white">
      <div className="flex items-start justify-between gap-3 border-b border-slate-50 p-4 sm:p-6">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">
            รายการทรัพย์สิน
          </h2>
          <p className="mt-0.5 text-[11px] text-slate-400 sm:text-xs">
            คลิกเพื่อเลือก · ดับเบิลคลิกเพื่อแก้ไข
          </p>
        </div>
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="ui-btn ui-btn-primary shrink-0 px-2.5 py-1.5 text-[11px] sm:px-3.5 sm:text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            เพิ่มทรัพย์สิน
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              <th className="px-6 py-3">ประเภท</th>
              <th className="px-6 py-3">ทรัพย์สิน</th>
              <th className="px-6 py-3">มูลค่า</th>
              <th className="px-6 py-3">ผู้ถือกรรมสิทธิ์</th>
              <th className="px-6 py-3">ผู้รับผลประโยชน์</th>
              <th className="px-6 py-3 text-center">แผน</th>
              <th className="px-6 py-3 text-center">เอกสาร</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-xs">
            {assets.map((asset) => {
              const selected = asset.id === selectedId;
              return (
                <tr
                  key={asset.id}
                  tabIndex={0}
                  onClick={() => onSelect(asset.id)}
                  onDoubleClick={() => onEdit(asset)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSelect(asset.id);
                  }}
                  className={clsx(
                    "cursor-pointer transition-colors duration-150",
                    selected ? "bg-mint-brand-light/50" : "hover:bg-slate-50/50",
                  )}
                >
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-2 font-medium text-slate-700">
                      <span
                        className={clsx(
                          "h-2 w-2 rounded-full",
                          TYPE_DOT[asset.type],
                        )}
                      />
                      {ASSET_TYPE_LABEL[asset.type]}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-800">
                    {asset.name}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700 tabular-nums">
                    {formatBaht(asset.value)}
                  </td>
                  <td className="max-w-[180px] truncate px-6 py-4 text-slate-500">
                    {asset.ownership
                      .map(
                        (o) =>
                          `${personName(o.personId, family)} (${o.percent}%)`,
                      )
                      .join(", ")}
                  </td>
                  <td className="max-w-[160px] truncate px-6 py-4 text-slate-500">
                    {asset.beneficiaries.length === 0
                      ? "— ยังไม่ระบุ —"
                      : asset.beneficiaries
                          .map((id) => personName(id, family))
                          .join(", ")}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={clsx(
                        "inline-flex rounded-full border px-2.5 py-1 text-[10px] leading-5 font-semibold",
                        PLAN_BADGE[asset.plan],
                      )}
                    >
                      {PLAN_LABEL[asset.plan]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={clsx(
                        "inline-flex rounded-full border px-2.5 py-1 text-[10px] leading-5 font-semibold",
                        DOC_BADGE[asset.documents],
                      )}
                    >
                      {DOC_LABEL[asset.documents]}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-50 bg-slate-50/50 p-4 text-xs sm:flex-row">
        <span className="text-slate-500">
          แสดงผล 1 ถึง {assets.length} จากทั้งหมด {assets.length} รายการ
        </span>
      </div>
    </div>
  );
}
