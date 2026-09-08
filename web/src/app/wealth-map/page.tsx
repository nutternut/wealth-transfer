"use client";

import { useState } from "react";
import { Table2, Waypoints } from "lucide-react";
import { AssetDiagram } from "@/components/AssetDiagram";
import { AssetFormSidebar } from "@/components/AssetFormSidebar";
import { AssetTable } from "@/components/AssetTable";
import { SummaryCards } from "@/components/SummaryCards";
import { useWealth } from "@/context/WealthContext";
import clsx from "clsx";

export default function WealthMapPage() {
  const {
    assets,
    selectedAssetId,
    formOpen,
    editingAsset,
    totals,
    setSelectedAssetId,
    setActiveDiagramAssetId,
    openCreateForm,
    openEditForm,
    closeForm,
    saveAsset,
  } = useWealth();

  const [view, setView] = useState<"table" | "diagram">("table");

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <div
          className="inline-flex rounded-lg border border-slate-100 bg-slate-50 p-0.5"
          role="group"
          aria-label="สลับมุมมอง"
        >
          <button
            type="button"
            onClick={() => setView("table")}
            title="ตาราง"
            aria-label="ตาราง"
            aria-pressed={view === "table"}
            className={clsx(
              "inline-flex h-7 w-7 items-center justify-center rounded-md transition",
              view === "table"
                ? "bg-white text-slate-700 shadow-sm"
                : "text-slate-400 hover:text-slate-600",
            )}
          >
            <Table2 className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => setView("diagram")}
            title="แผนภาพ"
            aria-label="แผนภาพ"
            aria-pressed={view === "diagram"}
            className={clsx(
              "inline-flex h-7 w-7 items-center justify-center rounded-md transition",
              view === "diagram"
                ? "bg-white text-slate-700 shadow-sm"
                : "text-slate-400 hover:text-slate-600",
            )}
          >
            <Waypoints className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>
      </div>

      <SummaryCards {...totals} />

      {view === "table" ? (
        <AssetTable
          assets={assets}
          selectedId={selectedAssetId}
          onSelect={(id) => {
            setSelectedAssetId(id);
            if (["a2", "a3", "a7"].includes(id)) {
              setActiveDiagramAssetId(id);
            }
          }}
          onEdit={openEditForm}
          onAdd={openCreateForm}
        />
      ) : (
        <AssetDiagram />
      )}

      <AssetFormSidebar
        open={formOpen}
        asset={editingAsset}
        onClose={closeForm}
        onSave={saveAsset}
      />
    </div>
  );
}
