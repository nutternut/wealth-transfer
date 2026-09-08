"use client";

import { ChevronLeft, ChevronRight, Link2, Pencil, Plus, Trash2, Users } from "lucide-react";
import clsx from "clsx";
import { MemberAvatar } from "@/components/MemberAvatar";
import { FAMILY_RELATION_LABEL } from "@/lib/format";
import type { FamilyMember, FamilyRelation, PersonId } from "@/lib/types";

const PAGE_SIZE = 5;

const RELATION_CHIP: Record<FamilyRelation, string> = {
  parent: "bg-sky-50 text-sky-700 border-sky-100",
  spouse: "bg-rose-50 text-rose-700 border-rose-100",
  child: "bg-mint-brand-light text-mint-brand-dark border-mint-100",
  sibling: "bg-amber-50 text-amber-700 border-amber-100",
  other: "bg-slate-50 text-slate-600 border-slate-100",
};

interface FamilyMembersTableProps {
  members: FamilyMember[];
  usageByMember: Map<PersonId, number>;
  page: number;
  onPageChange: (page: number) => void;
  onAdd: () => void;
  onEdit: (member: FamilyMember) => void;
  onDelete: (member: FamilyMember) => void;
}

export function FamilyMembersTable({
  members,
  usageByMember,
  page,
  onPageChange,
  onAdd,
  onEdit,
  onDelete,
}: FamilyMembersTableProps) {
  const totalPages = Math.max(1, Math.ceil(members.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const rows = members.slice(start, start + PAGE_SIZE);
  const rangeStart = members.length === 0 ? 0 : start + 1;
  const rangeEnd = Math.min(start + PAGE_SIZE, members.length);

  return (
    <div className="mb-2 overflow-hidden rounded-2xl border border-slate-100 bg-white">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-50 p-6 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-900">สมาชิกตระกูล</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            ตารางสมาชิก · ใช้เลือกเป็นเจ้าของ ผู้ควบคุม หรือผู้รับโอน
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="ui-btn ui-btn-primary shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          เพิ่มสมาชิก
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              <th className="px-6 py-3">สมาชิก</th>
              <th className="px-6 py-3">ชื่อย่อ</th>
              <th className="px-6 py-3">ความสัมพันธ์</th>
              <th className="px-6 py-3">อ้างอิงทรัพย์สิน</th>
              <th className="px-6 py-3 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-xs">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-14 text-center">
                  <div className="mx-auto flex max-w-xs flex-col items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mint-brand-light text-mint-brand">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-700">
                        ยังไม่มีสมาชิก
                      </div>
                      <div className="mt-1 text-[11px] text-slate-400">
                        เริ่มต้นด้วยการเพิ่มพ่อ แม่ หรือบุตร
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onAdd}
                      className="ui-btn ui-btn-primary"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      เพิ่มสมาชิก
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((member) => {
                const usage = usageByMember.get(member.id) ?? 0;
                const relation = member.relation ?? "other";

                return (
                  <tr
                    key={member.id}
                    className="transition-colors duration-150 hover:bg-slate-50/70"
                  >
                    <td className="px-6 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <MemberAvatar member={member} size="sm" />
                        <span className="truncate font-semibold text-slate-800">
                          {member.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {member.shortName || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={clsx(
                          "inline-flex rounded-full border px-2.5 py-1 text-[10px] leading-5 font-semibold",
                          RELATION_CHIP[relation],
                        )}
                      >
                        {FAMILY_RELATION_LABEL[relation]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-slate-500">
                        <Link2 className="h-3.5 w-3.5" />
                        {usage > 0 ? `${usage} รายการ` : "ยังไม่ผูก"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          type="button"
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                          onClick={() => onEdit(member)}
                          aria-label={`แก้ไข ${member.name}`}
                          title="แก้ไข"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-40"
                          onClick={() => onDelete(member)}
                          disabled={members.length <= 1}
                          title={
                            members.length <= 1
                              ? "ต้องมีสมาชิกอย่างน้อย 1 คน"
                              : "ลบสมาชิก"
                          }
                          aria-label={`ลบ ${member.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-50 bg-slate-50/50 p-4 text-xs sm:flex-row">
        <span className="text-slate-500">
          {members.length === 0
            ? "ไม่มีรายการ"
            : `แสดงผล ${rangeStart} ถึง ${rangeEnd} จากทั้งหมด ${members.length} คน`}
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="ui-btn ui-btn-ghost px-2.5"
            onClick={() => onPageChange(Math.max(1, safePage - 1))}
            disabled={safePage <= 1}
            aria-label="หน้าก่อนหน้า"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={clsx(
                "inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-[11px] font-semibold transition-colors",
                pageNum === safePage
                  ? "bg-mint-brand text-white shadow-sm"
                  : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-700",
              )}
              aria-current={pageNum === safePage ? "page" : undefined}
            >
              {pageNum}
            </button>
          ))}

          <button
            type="button"
            className="ui-btn ui-btn-ghost px-2.5"
            onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
            disabled={safePage >= totalPages}
            aria-label="หน้าถัดไป"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export { PAGE_SIZE };
