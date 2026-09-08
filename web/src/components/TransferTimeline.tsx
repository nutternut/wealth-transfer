"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import { GripVertical } from "lucide-react";
import { STEP_STATUS_LABEL, formatBaht } from "@/lib/format";
import type { TransferStep, TransferStepStatus } from "@/lib/types";

const STATUS_BADGE: Record<TransferStepStatus, string> = {
  review: "bg-sky-50 text-sky-700 border-sky-100",
  not_started: "bg-amber-50 text-amber-700 border-amber-100",
  concept: "bg-slate-50 text-slate-500 border-slate-100",
  done: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

const STATUS_DOT: Record<TransferStepStatus, string> = {
  review: "bg-sky-400",
  not_started: "bg-amber-400",
  concept: "bg-slate-300",
  done: "bg-emerald-400",
};

const STATUS_RING: Record<TransferStepStatus, string> = {
  review: "border-sky-300 bg-sky-50 text-sky-700",
  not_started: "border-amber-300 bg-amber-50 text-amber-700",
  concept: "border-slate-200 bg-white text-slate-500",
  done: "border-emerald-300 bg-emerald-50 text-emerald-700",
};

function taxLabel(value: number | null) {
  if (value === null) return "—";
  if (value === 0) return "฿0";
  return formatBaht(value);
}

function SortableStepRow({
  step,
  index,
  active,
  total,
}: {
  step: TransferStep;
  index: number;
  active: boolean;
  total: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: step.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      id={`plan-step-${step.id}`}
      ref={setNodeRef}
      style={style}
      className="relative flex gap-3 sm:gap-4"
    >
      {/* spine */}
      <div className="flex w-14 shrink-0 flex-col items-center sm:w-16">
        <div
          className={clsx(
            "z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 text-[11px] font-bold shadow-sm transition-all",
            STATUS_RING[step.status],
            active && "ring-2 ring-mint-brand/30 ring-offset-2",
          )}
        >
          {index + 1}
        </div>
        {index < total - 1 && (
          <div
            aria-hidden
            className="mt-1 w-px flex-1 bg-linear-to-b from-slate-200 to-slate-100"
          />
        )}
      </div>

      <article
        className={clsx(
          "plan-step-card mb-3 min-w-0 flex-1 overflow-hidden rounded-2xl border bg-white transition-all duration-200",
          isDragging
            ? "z-20 border-mint-200 shadow-lg ring-2 ring-mint-200"
            : active
              ? "border-mint-200 shadow-sm"
              : "border-slate-100 hover:border-slate-200 hover:shadow-sm",
        )}
      >
        <div className="flex items-stretch">
          <div className={clsx("w-1 shrink-0", STATUS_DOT[step.status])} />

          <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:flex-row sm:items-start sm:gap-4 sm:p-4">
            <div className="min-w-18 shrink-0">
              <p className="text-[10px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
                ปีเป้าหมาย
              </p>
              <p className="mt-0.5 text-lg font-bold tracking-tight text-slate-900">
                {step.yearLabel}
              </p>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={clsx(
                    "inline-flex rounded-full border px-2.5 py-0.5 text-[10px] leading-5 font-semibold",
                    STATUS_BADGE[step.status],
                  )}
                >
                  {STEP_STATUS_LABEL[step.status]}
                </span>
              </div>
              <h3 className="mt-2 text-sm leading-snug font-semibold text-slate-800">
                {step.title}
              </h3>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                {step.note}
              </p>
            </div>

            <div className="flex shrink-0 items-start justify-between gap-3 sm:flex-col sm:items-end">
              <div className="rounded-xl bg-slate-50 px-3 py-2 text-right sm:min-w-30">
                <p className="text-[10px] font-medium text-slate-400">
                  ภาษีโดยประมาณ
                </p>
                <p className="mt-0.5 text-sm font-bold tabular-nums text-slate-800">
                  {taxLabel(step.estimatedTax)}
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-slate-50 hover:text-slate-600"
                aria-label={`ลากเพื่อเรียงลำดับขั้นตอน ${step.yearLabel}`}
                {...attributes}
                {...listeners}
              >
                <GripVertical size={16} />
              </button>
            </div>
          </div>
        </div>
      </article>
    </li>
  );
}

interface TransferTimelineProps {
  steps: TransferStep[];
  onReorder: (orderedIds: string[]) => void;
}

export function TransferTimeline({ steps, onReorder }: TransferTimelineProps) {
  const sorted = useMemo(
    () => [...steps].sort((a, b) => a.order - b.order),
    [steps],
  );
  const [activeId, setActiveId] = useState<string | null>(
    () => sorted[0]?.id ?? null,
  );

  useEffect(() => {
    if (!activeId || sorted.some((s) => s.id === activeId)) return;
    setActiveId(sorted[0]?.id ?? null);
  }, [sorted, activeId]);

  const yearSpan = useMemo(() => {
    if (sorted.length === 0) return "ยังไม่มีขั้นตอน";
    const first = sorted[0].yearLabel;
    const last = sorted[sorted.length - 1].yearLabel;
    if (first === last) return first;
    return `${first} → ${last}`;
  }, [sorted]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = sorted.map((s) => s.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(ids, oldIndex, newIndex));
  }

  function jumpTo(id: string) {
    setActiveId(id);
    const el = document.getElementById(`plan-step-${id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            ไทม์ไลน์แผนโอน
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            กดปีด้านบนเพื่อกระโดด · ลากไอคอนเพื่อเรียงลำดับ
          </p>
        </div>
        <p className="text-[11px] font-medium text-slate-400">
          {sorted.length} ขั้นตอน · {yearSpan}
        </p>
      </div>

      {/* Year rail — scales to many years */}
      <div className="mb-5 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
            ข้ามไปยังปี
          </p>
          <p className="text-[10px] text-slate-400">
            เหมาะเมื่อแผนยาวหลายปี
          </p>
        </div>
        <div
          className="flex gap-1.5 overflow-x-auto pb-0.5"
          role="tablist"
          aria-label="ปีในแผนโอน"
        >
          {sorted.map((step, index) => {
            const selected = step.id === activeId;
            return (
              <button
                key={step.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => jumpTo(step.id)}
                className={clsx(
                  "flex shrink-0 flex-col items-center gap-1 rounded-xl border px-2.5 py-2 transition-all duration-150",
                  selected
                    ? "border-mint-brand bg-white shadow-sm"
                    : "border-transparent bg-white/60 hover:border-slate-200 hover:bg-white",
                )}
              >
                <span
                  className={clsx(
                    "text-[10px] font-bold tabular-nums",
                    selected ? "text-mint-brand" : "text-slate-500",
                  )}
                >
                  {step.yearLabel === "ระยะยาว" ? "ยาว" : step.yearLabel.slice(-2)}
                </span>
                <span
                  className={clsx(
                    "h-1.5 w-1.5 rounded-full",
                    STATUS_DOT[step.status],
                  )}
                  title={STEP_STATUS_LABEL[step.status]}
                />
                <span className="sr-only">
                  ขั้นที่ {index + 1}: {step.yearLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="max-h-[min(28rem,55vh)] overflow-y-auto pr-1 sm:max-h-[min(32rem,60vh)]"
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sorted.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <ol className="m-0 list-none p-0">
              {sorted.map((step, index) => (
                <SortableStepRow
                  key={step.id}
                  step={step}
                  index={index}
                  total={sorted.length}
                  active={step.id === activeId}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
