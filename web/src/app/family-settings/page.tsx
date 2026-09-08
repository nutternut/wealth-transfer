"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  HeartHandshake,
  ImagePlus,
  Link2,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import clsx from "clsx";
import {
  FamilyMembersTable,
  PAGE_SIZE,
} from "@/components/FamilyMembersTable";
import { MemberAvatar } from "@/components/MemberAvatar";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { useWealth } from "@/context/WealthContext";
import {
  AVATAR_COLOR_PRESETS,
  readImageAsDataUrl,
  resolveAvatarColor,
} from "@/lib/avatar";
import { FAMILY_RELATION_LABEL } from "@/lib/format";
import type {
  FamilyMember,
  FamilyRelation,
  PersonId,
} from "@/lib/types";

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-all placeholder:text-slate-300 focus:border-mint-brand focus:ring-2 focus:ring-mint-200 focus:outline-none";

const RELATION_OPTIONS = Object.entries(FAMILY_RELATION_LABEL) as [
  FamilyRelation,
  string,
][];

type MemberModalMode = "create" | "edit" | null;

function emptyMember(): FamilyMember {
  return {
    id: `m-${Date.now()}`,
    name: "",
    shortName: "",
    relation: "other",
    avatarColor: AVATAR_COLOR_PRESETS[5],
  };
}

export default function FamilySettingsPage() {
  const {
    assets,
    family,
    familyProfile,
    updateFamilyProfile,
    saveFamilyMember,
    removeFamilyMember,
  } = useWealth();
  const { toast } = useToast();

  const [profileDraft, setProfileDraft] = useState(familyProfile);
  const [memberModal, setMemberModal] = useState<MemberModalMode>(null);
  const [draft, setDraft] = useState<FamilyMember | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FamilyMember | null>(null);
  const [page, setPage] = useState(1);

  const usageByMember = useMemo(() => {
    const map = new Map<PersonId, number>();
    for (const member of family) map.set(member.id, 0);
    for (const asset of assets) {
      const ids = new Set<PersonId>([
        ...asset.ownership.map((o) => o.personId),
        ...asset.beneficiaries,
        ...(asset.controlPersonId ? [asset.controlPersonId] : []),
      ]);
      for (const id of ids) {
        map.set(id, (map.get(id) ?? 0) + 1);
      }
    }
    return map;
  }, [assets, family]);

  const linkedCount = useMemo(
    () => [...usageByMember.values()].filter((n) => n > 0).length,
    [usageByMember],
  );

  const totalPages = Math.max(1, Math.ceil(family.length / PAGE_SIZE));

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const profileDirty =
    profileDraft.name !== familyProfile.name ||
    (profileDraft.note ?? "") !== (familyProfile.note ?? "");

  function openCreate() {
    setFormError(null);
    setDraft(emptyMember());
    setMemberModal("create");
  }

  function openEdit(member: FamilyMember) {
    setFormError(null);
    setDraft({ ...member });
    setMemberModal("edit");
  }

  function closeMemberModal() {
    setMemberModal(null);
    setDraft(null);
    setFormError(null);
  }

  function handleSaveMember(e: React.FormEvent) {
    e.preventDefault();
    if (!draft || !memberModal) return;
    if (!draft.name.trim()) {
      setFormError("กรุณาระบุชื่อสมาชิก");
      return;
    }
    const isCreate = memberModal === "create";
    saveFamilyMember(draft);
    if (isCreate) {
      setPage(Math.ceil((family.length + 1) / PAGE_SIZE));
    }
    closeMemberModal();
    toast({
      tone: "success",
      title: isCreate ? "เพิ่มสมาชิกแล้ว" : "บันทึกการแก้ไขแล้ว",
      description: isCreate
        ? `เพิ่ม “${draft.name.trim()}” เข้าตระกูลเรียบร้อย`
        : `อัปเดตข้อมูล “${draft.name.trim()}” เรียบร้อย`,
    });
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    const result = removeFamilyMember(deleteTarget.id);
    if (!result.ok) {
      toast({
        tone: "error",
        title: "ลบไม่ได้",
        description: result.reason,
      });
      setDeleteTarget(null);
      return;
    }
    toast({
      tone: "success",
      title: "ลบสมาชิกแล้ว",
      description: `นำ “${deleteTarget.name}” ออกจากตระกูลเรียบร้อย`,
    });
    setDeleteTarget(null);
  }

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    updateFamilyProfile(profileDraft);
    toast({
      tone: "success",
      title: "บันทึกโปรไฟล์แล้ว",
      description: `ชื่อตระกูลอัปเดตเป็น “${profileDraft.name.trim() || "ตระกูล"}”`,
    });
  }

  const deleteUsage = deleteTarget
    ? (usageByMember.get(deleteTarget.id) ?? 0)
    : 0;

  return (
    <div className="plan-page family-settings-page">
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.75rem]">
          การตั้งค่าตระกูล
        </h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-500">
          ตั้งชื่อตระกูลและสมาชิก — ใช้ร่วมกันทั้ง Wealth Map, แผนโอน
          และประมาณการภาษี
        </p>
      </div>

      <section className="family-hero mb-8 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_8px_30px_-12px_rgba(15,23,42,0.12)]">
        <div className="relative bg-linear-to-br from-mint-50/90 via-white to-slate-50 px-5 py-6 sm:px-8 sm:py-8">
          <div
            className="pointer-events-none absolute -top-16 -right-10 h-48 w-48 rounded-full bg-mint-200/30 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-20 left-10 h-40 w-40 rounded-full bg-sky-100/50 blur-3xl"
            aria-hidden
          />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-mint-brand-light px-2.5 py-1 text-[11px] font-semibold text-mint-brand-dark">
                  <Sparkles className="h-3 w-3" />
                  โปรไฟล์ตระกูล
                </span>
                <span className="text-[11px] text-slate-400">
                  แสดงในแดชบอร์ดและรายงาน
                </span>
              </div>

              <div className="mt-5 flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-mint-brand to-mint-brand-dark text-white shadow-[0_10px_24px_-10px_rgba(62,180,137,0.85)]">
                  <HeartHandshake className="h-7 w-7" />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                    {profileDraft.name.trim() || "ยังไม่ได้ตั้งชื่อตระกูล"}
                  </h2>
                  <p className="mt-1 line-clamp-2 max-w-md text-xs leading-relaxed text-slate-500">
                    {profileDraft.note?.trim() ||
                      "เพิ่มหมายเหตุสั้นๆ เพื่อบอกเป้าหมายการโอนของตระกูล"}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex -space-x-2">
                {family.slice(0, 6).map((member) => (
                  <MemberAvatar
                    key={member.id}
                    member={member}
                    size="sm"
                    className="!rounded-full border-2 border-white"
                  />
                ))}
                {family.length > 6 ? (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-semibold text-slate-500">
                    +{family.length - 6}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="grid w-full shrink-0 grid-cols-3 gap-3 sm:max-w-xl lg:w-[28rem]">
              <StatPill
                icon={Users}
                label="สมาชิก"
                value={String(family.length)}
                hint="ในตระกูล"
                tone="mint"
              />
              <StatPill
                icon={Link2}
                label="ผูกทรัพย์สิน"
                value={String(linkedCount)}
                hint="ถูกอ้างอิง"
                tone="sky"
              />
              <StatPill
                icon={UserRound}
                label="ยังว่าง"
                value={String(family.length - linkedCount)}
                hint="ยังไม่ผูก"
                tone="amber"
              />
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSaveProfile}
          className="relative space-y-4 border-t border-slate-50 px-5 py-6 sm:px-8"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5 sm:col-span-1">
              <span className="block text-xs font-semibold text-slate-500">
                ชื่อตระกูล
              </span>
              <input
                className={fieldClass}
                value={profileDraft.name}
                onChange={(e) =>
                  setProfileDraft((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="เช่น ตระกูล สมบูรณ์"
              />
            </label>
            <label className="block space-y-1.5 sm:col-span-1">
              <span className="block text-xs font-semibold text-slate-500">
                หมายเหตุ
              </span>
              <input
                className={fieldClass}
                value={profileDraft.note ?? ""}
                onChange={(e) =>
                  setProfileDraft((p) => ({ ...p, note: e.target.value }))
                }
                placeholder="เป้าหมายการโอนสั้นๆ"
              />
            </label>
          </div>
          <div className="flex items-center justify-end gap-3">
            {profileDirty ? (
              <span className="text-[11px] text-slate-400">
                มีการแก้ไขที่ยังไม่บันทึก
              </span>
            ) : null}
            <button
              type="submit"
              className="ui-btn ui-btn-primary"
              disabled={!profileDirty}
            >
              บันทึกโปรไฟล์
            </button>
          </div>
        </form>
      </section>

      <FamilyMembersTable
        members={family}
        usageByMember={usageByMember}
        page={page}
        onPageChange={setPage}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
      />

      <Modal
        open={memberModal !== null && draft !== null}
        onClose={closeMemberModal}
        title={memberModal === "edit" ? "แก้ไขสมาชิก" : "เพิ่มสมาชิกใหม่"}
        description={
          memberModal === "edit"
            ? "ปรับชื่อและความสัมพันธ์ให้ตรงกับโครงสร้างตระกูล"
            : "สมาชิกใหม่จะใช้เลือกได้ใน Wealth Map และแผนโอน"
        }
        icon={
          memberModal === "edit" ? (
            <Pencil className="h-4 w-4 text-mint-brand" />
          ) : (
            <Plus className="h-4 w-4 text-mint-brand" />
          )
        }
        footer={
          <>
            <button
              type="button"
              onClick={closeMemberModal}
              className="ui-btn ui-btn-ghost"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              form="family-member-form"
              className="ui-btn ui-btn-primary"
            >
              {memberModal === "edit" ? "บันทึกการแก้ไข" : "เพิ่มสมาชิก"}
            </button>
          </>
        }
      >
        {draft ? (
          <MemberAvatarForm
            draft={draft}
            setDraft={setDraft}
            formError={formError}
            setFormError={setFormError}
            onSubmit={handleSaveMember}
          />
        ) : null}
      </Modal>

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="ยืนยันการลบสมาชิก"
        description="การลบจะเอาสมาชิกออกจากรายชื่อตระกูลทันที"
        tone="rose"
        size="sm"
        icon={<Trash2 className="h-4 w-4 text-rose-500" />}
        footer={
          <>
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="ui-btn ui-btn-ghost"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="ui-btn bg-rose-500 text-white hover:bg-rose-600"
              disabled={family.length <= 1}
            >
              ลบสมาชิก
            </button>
          </>
        }
      >
        {deleteTarget ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50/70 px-3.5 py-3">
              <MemberAvatar member={deleteTarget} size="md" />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-800">
                  {deleteTarget.name}
                </div>
                <div className="text-[11px] text-slate-500">
                  {FAMILY_RELATION_LABEL[deleteTarget.relation ?? "other"]}
                  {deleteTarget.shortName
                    ? ` · ย่อ ${deleteTarget.shortName}`
                    : ""}
                </div>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-slate-500">
              {deleteUsage > 0
                ? `สมาชิกนี้อ้างอิงในทรัพย์สิน ${deleteUsage} รายการ — อาจลบไม่ได้จนกว่าจะแก้การอ้างอิงก่อน`
                : "สมาชิกนี้ยังไม่ถูกอ้างอิงในทรัพย์สิน สามารถลบได้อย่างปลอดภัย"}
            </p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function MemberAvatarForm({
  draft,
  setDraft,
  formError,
  setFormError,
  onSubmit,
}: {
  draft: FamilyMember;
  setDraft: (member: FamilyMember) => void;
  formError: string | null;
  setFormError: (value: string | null) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const selectedColor = resolveAvatarColor(draft);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setFormError(null);
    try {
      const dataUrl = await readImageAsDataUrl(file);
      setDraft({ ...draft, avatarUrl: dataUrl });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form id="family-member-form" onSubmit={onSubmit} className="space-y-4">
      <div className="relative overflow-hidden rounded-3xl border border-mint-100/80 bg-linear-to-br from-mint-50 via-white to-slate-50 p-5">
        <div
          className="pointer-events-none absolute -top-10 right-0 h-28 w-28 rounded-full opacity-40 blur-2xl"
          style={{ background: selectedColor }}
          aria-hidden
        />

        <div className="relative flex flex-col items-center text-center">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="group relative"
            aria-label="อัปโหลดรูปโปรไฟล์"
          >
            <div
              className="absolute -inset-1 rounded-[1.5rem] opacity-30 blur-md transition group-hover:opacity-50"
              style={{ background: selectedColor }}
              aria-hidden
            />
            <MemberAvatar
              member={draft}
              size="xl"
              className="relative shadow-[0_12px_28px_-12px_rgba(15,23,42,0.45)] ring-4 ring-white"
            />
            <span className="absolute inset-0 flex items-center justify-center rounded-[1.35rem] bg-slate-900/0 transition group-hover:bg-slate-900/35">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-700 opacity-0 shadow-sm transition group-hover:opacity-100">
                <Camera className="h-4 w-4" />
              </span>
            </span>
          </button>

          <div className="mt-3 min-w-0">
            <div className="truncate text-sm font-bold tracking-tight text-slate-900">
              {draft.name.trim() || "ชื่อสมาชิก"}
            </div>
            <div className="mt-0.5 text-[11px] text-slate-400">
              {FAMILY_RELATION_LABEL[draft.relation ?? "other"]}
              {draft.shortName.trim()
                ? ` · ย่อ ${draft.shortName.trim()}`
                : ""}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200/80 transition hover:text-mint-brand-dark hover:ring-mint-200"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              <ImagePlus className="h-3.5 w-3.5" />
              {uploading ? "กำลังอัปโหลด…" : "อัปโหลดรูป"}
            </button>
            {draft.avatarUrl ? (
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1.5 text-[11px] font-semibold text-rose-500 shadow-sm ring-1 ring-rose-100 transition hover:bg-rose-50"
                onClick={() => setDraft({ ...draft, avatarUrl: undefined })}
              >
                <X className="h-3.5 w-3.5" />
                ลบรูป
              </button>
            ) : null}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        <div className="relative mt-5 rounded-2xl bg-white/80 px-3 py-3 shadow-sm ring-1 ring-slate-100 backdrop-blur-sm">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-500">
              เลือกสีโปรไฟล์
            </span>
            <span className="text-[10px] text-slate-400">
              {draft.avatarUrl ? "ใช้รูปอยู่ตอนนี้" : "ใช้ตัวอักษรย่อ"}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {AVATAR_COLOR_PRESETS.map((color) => {
              const active = !draft.avatarUrl && selectedColor === color;
              return (
                <button
                  key={color}
                  type="button"
                  title={color}
                  aria-label={`เลือกสี ${color}`}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      avatarColor: color,
                      avatarUrl: undefined,
                    })
                  }
                  className={clsx(
                    "h-7 w-7 rounded-full transition duration-150",
                    active
                      ? "scale-110 ring-2 ring-slate-900 ring-offset-2"
                      : "hover:scale-110 ring-1 ring-black/10",
                  )}
                  style={{ background: color }}
                />
              );
            })}
            <label
              className="relative inline-flex h-7 w-7 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-white text-[10px] font-bold text-slate-400 shadow-sm ring-1 ring-dashed ring-slate-300 transition hover:text-mint-brand hover:ring-mint-brand"
              title="เลือกสีเอง"
            >
              +
              <input
                type="color"
                className="absolute inset-0 cursor-pointer opacity-0"
                value={selectedColor}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    avatarColor: e.target.value,
                    avatarUrl: undefined,
                  })
                }
                aria-label="เลือกสีเอง"
              />
            </label>
          </div>
        </div>
      </div>

      {formError ? (
        <div
          className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-[11px] text-rose-700"
          role="alert"
        >
          {formError}
        </div>
      ) : null}

      <label className="block space-y-1.5">
        <span className="block text-xs font-semibold text-slate-500">
          ชื่อเต็ม
        </span>
        <input
          className={fieldClass}
          value={draft.name}
          onChange={(e) => {
            setFormError(null);
            setDraft({ ...draft, name: e.target.value });
          }}
          placeholder="เช่น คุณพ่อ"
          autoFocus
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="block text-xs font-semibold text-slate-500">
            ชื่อย่อ
          </span>
          <input
            className={fieldClass}
            value={draft.shortName}
            onChange={(e) =>
              setDraft({ ...draft, shortName: e.target.value })
            }
            placeholder="เช่น พ่อ"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="block text-xs font-semibold text-slate-500">
            ความสัมพันธ์
          </span>
          <select
            className={fieldClass}
            value={draft.relation ?? "other"}
            onChange={(e) =>
              setDraft({
                ...draft,
                relation: e.target.value as FamilyRelation,
              })
            }
          >
            {RELATION_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </form>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  hint: string;
  tone: "mint" | "sky" | "amber";
}) {
  const styles = {
    mint: {
      card: "border-mint-100/80 from-mint-50/90 via-white to-white",
      bar: "from-mint-brand to-emerald-400",
      icon: "bg-mint-brand-light text-mint-brand-dark ring-mint-100",
      value: "text-mint-brand-dark",
    },
    sky: {
      card: "border-sky-100/80 from-sky-50/90 via-white to-white",
      bar: "from-sky-400 to-cyan-400",
      icon: "bg-sky-50 text-sky-600 ring-sky-100",
      value: "text-sky-700",
    },
    amber: {
      card: "border-amber-100/80 from-amber-50/90 via-white to-white",
      bar: "from-amber-400 to-orange-300",
      icon: "bg-amber-50 text-amber-600 ring-amber-100",
      value: "text-amber-700",
    },
  }[tone];

  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-2xl border bg-linear-to-b px-4 py-3.5 shadow-[0_8px_20px_-14px_rgba(15,23,42,0.25)]",
        styles.card,
      )}
    >
      <div
        className={clsx("absolute inset-x-0 top-0 h-1 bg-linear-to-r", styles.bar)}
        aria-hidden
      />
      <div
        className={clsx(
          "mb-3 flex h-9 w-9 items-center justify-center rounded-xl ring-1",
          styles.icon,
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-[10px] font-semibold tracking-wide text-slate-400">
        {label}
      </div>
      <div
        className={clsx(
          "mt-1 text-2xl font-bold tracking-tight tabular-nums",
          styles.value,
        )}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[10px] text-slate-400">{hint}</div>
    </div>
  );
}
