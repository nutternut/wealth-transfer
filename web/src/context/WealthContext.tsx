"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  FAMILY,
  INITIAL_ASSETS,
  INITIAL_FAMILY_PROFILE,
  INITIAL_OWNERSHIP_GRAPHS,
  INITIAL_TRANSFER_STEPS,
} from "@/lib/mock-data";
import { recalculateStepTax, resolveAssetValue } from "@/lib/tax";
import type {
  Asset,
  DiagramEdge,
  DiagramNode,
  FamilyMember,
  FamilyProfile,
  OwnershipGraph,
  PersonId,
  TransferStep,
} from "@/lib/types";

function withCalculatedTaxes(
  steps: TransferStep[],
  assetList: Asset[],
): TransferStep[] {
  return steps.map((step) => {
    const tax = recalculateStepTax(step, assetList);
    return tax === step.estimatedTax ? step : { ...step, estimatedTax: tax };
  });
}

interface WealthContextValue {
  assets: Asset[];
  graphs: OwnershipGraph[];
  activeDiagramAssetId: string;
  setActiveDiagramAssetId: (assetId: string) => void;
  activeGraph: OwnershipGraph | null;
  transferSteps: TransferStep[];
  family: FamilyMember[];
  familyProfile: FamilyProfile;
  updateFamilyProfile: (profile: FamilyProfile) => void;
  saveFamilyMember: (member: FamilyMember) => void;
  removeFamilyMember: (
    id: PersonId,
  ) => { ok: true } | { ok: false; reason: string };
  selectedAssetId: string | null;
  formOpen: boolean;
  editingAsset: Asset | null;
  setSelectedAssetId: (id: string | null) => void;
  openCreateForm: () => void;
  openEditForm: (asset: Asset) => void;
  closeForm: () => void;
  saveAsset: (asset: Asset) => void;
  updateDiagramNodePosition: (id: string, x: number, y: number) => void;
  updateDiagramNode: (
    id: string,
    patch: Partial<Pick<DiagramNode, "label" | "sublabel" | "kind">>,
  ) => void;
  addDiagramNode: (kind: "person" | "asset") => void;
  removeDiagramNode: (id: string) => void;
  addDiagramEdge: (from: string, to: string, label?: string) => void;
  reorderTransferSteps: (orderedIds: string[]) => void;
  totals: {
    totalValue: number;
    count: number;
    pendingDecision: number;
    pendingReview: number;
    outdated: number;
  };
}

const WealthContext = createContext<WealthContextValue | null>(null);

function patchGraph(
  graphs: OwnershipGraph[],
  assetId: string,
  updater: (graph: OwnershipGraph) => OwnershipGraph,
) {
  return graphs.map((g) => (g.assetId === assetId ? updater(g) : g));
}

function memberIsReferenced(assets: Asset[], id: PersonId) {
  return assets.some(
    (a) =>
      a.controlPersonId === id ||
      a.beneficiaries.includes(id) ||
      a.ownership.some((o) => o.personId === id),
  );
}

export function WealthProvider({ children }: { children: ReactNode }) {
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [graphs, setGraphs] = useState(INITIAL_OWNERSHIP_GRAPHS);
  const [activeDiagramAssetId, setActiveDiagramAssetId] = useState("a3");
  const [transferStepsRaw, setTransferStepsRaw] = useState(
    INITIAL_TRANSFER_STEPS,
  );
  const [family, setFamily] = useState<FamilyMember[]>(FAMILY);
  const [familyProfile, setFamilyProfile] = useState(INITIAL_FAMILY_PROFILE);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>("a3");
  const [formOpen, setFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const transferSteps = useMemo(
    () => withCalculatedTaxes(transferStepsRaw, assets),
    [transferStepsRaw, assets],
  );

  const activeGraph = useMemo(
    () => graphs.find((g) => g.assetId === activeDiagramAssetId) ?? null,
    [graphs, activeDiagramAssetId],
  );

  const totals = useMemo(() => {
    const totalValue = assets.reduce((sum, a) => sum + resolveAssetValue(a), 0);
    return {
      totalValue,
      count: assets.length,
      pendingDecision: assets.filter((a) => a.plan === "undecided").length,
      pendingReview: transferSteps.filter((s) => s.status === "review").length,
      outdated: assets.filter((a) => a.documents === "outdated").length,
    };
  }, [assets, transferSteps]);

  const openCreateForm = useCallback(() => {
    setEditingAsset(null);
    setFormOpen(true);
  }, []);

  const openEditForm = useCallback((asset: Asset) => {
    setEditingAsset(asset);
    setFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditingAsset(null);
  }, []);

  const saveAsset = useCallback((asset: Asset) => {
    const normalized: Asset = {
      ...asset,
      value: resolveAssetValue(asset) || asset.value,
    };
    setAssets((prev) => {
      const exists = prev.some((a) => a.id === normalized.id);
      if (exists)
        return prev.map((a) => (a.id === normalized.id ? normalized : a));
      return [normalized, ...prev];
    });
    setSelectedAssetId(normalized.id);
    setFormOpen(false);
    setEditingAsset(null);
  }, []);

  const updateFamilyProfile = useCallback((profile: FamilyProfile) => {
    setFamilyProfile({
      name: profile.name.trim() || "ตระกูล",
      note: profile.note?.trim() || undefined,
    });
  }, []);

  const saveFamilyMember = useCallback((member: FamilyMember) => {
    setFamily((prev) => {
      const next: FamilyMember = {
        ...member,
        name: member.name.trim() || "สมาชิกใหม่",
        shortName: member.shortName.trim() || member.name.trim() || "ใหม่",
      };
      const exists = prev.some((m) => m.id === next.id);
      if (exists) return prev.map((m) => (m.id === next.id ? next : m));
      return [...prev, next];
    });
  }, []);

  const removeFamilyMember = useCallback(
    (id: PersonId) => {
      if (memberIsReferenced(assets, id)) {
        return {
          ok: false as const,
          reason: "สมาชิกนี้ถูกอ้างอิงในทรัพย์สินแล้ว แก้หรือลบการอ้างอิงก่อน",
        };
      }
      if (family.length <= 1) {
        return {
          ok: false as const,
          reason: "ต้องมีสมาชิกอย่างน้อย 1 คน",
        };
      }
      setFamily((prev) => prev.filter((m) => m.id !== id));
      return { ok: true as const };
    },
    [assets, family.length],
  );

  const updateDiagramNodePosition = useCallback(
    (id: string, x: number, y: number) => {
      setGraphs((prev) =>
        patchGraph(prev, activeDiagramAssetId, (g) => ({
          ...g,
          nodes: g.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)),
        })),
      );
    },
    [activeDiagramAssetId],
  );

  const updateDiagramNode = useCallback(
    (
      id: string,
      patch: Partial<Pick<DiagramNode, "label" | "sublabel" | "kind">>,
    ) => {
      setGraphs((prev) =>
        patchGraph(prev, activeDiagramAssetId, (g) => ({
          ...g,
          nodes: g.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
        })),
      );
    },
    [activeDiagramAssetId],
  );

  const addDiagramNode = useCallback(
    (kind: "person" | "asset") => {
      const id = `${activeDiagramAssetId}-n-${Date.now()}`;
      const node: DiagramNode = {
        id,
        kind,
        label: kind === "person" ? "สมาชิกใหม่" : "ทรัพย์สินใหม่",
        sublabel: kind === "person" ? "แตะดินสอเพื่อแก้ไข" : "มูลค่า —",
        x: 180 + Math.random() * 160,
        y: 120 + Math.random() * 120,
      };
      setGraphs((prev) =>
        patchGraph(prev, activeDiagramAssetId, (g) => ({
          ...g,
          nodes: [...g.nodes, node],
        })),
      );
    },
    [activeDiagramAssetId],
  );

  const removeDiagramNode = useCallback(
    (id: string) => {
      setGraphs((prev) =>
        patchGraph(prev, activeDiagramAssetId, (g) => ({
          ...g,
          nodes: g.nodes.filter((n) => n.id !== id),
          edges: g.edges.filter((e) => e.from !== id && e.to !== id),
        })),
      );
    },
    [activeDiagramAssetId],
  );

  const addDiagramEdge = useCallback(
    (from: string, to: string, label = "ความสัมพันธ์") => {
      if (from === to) return;
      const edge: DiagramEdge = {
        id: `${activeDiagramAssetId}-e-${Date.now()}`,
        from,
        to,
        label,
      };
      setGraphs((prev) =>
        patchGraph(prev, activeDiagramAssetId, (g) => {
          const exists = g.edges.some(
            (e) => e.from === from && e.to === to,
          );
          if (exists) return g;
          return { ...g, edges: [...g.edges, edge] };
        }),
      );
    },
    [activeDiagramAssetId],
  );

  const handleSetActiveDiagramAssetId = useCallback((assetId: string) => {
    setActiveDiagramAssetId(assetId);
    setSelectedAssetId(assetId);
  }, []);

  const reorderTransferSteps = useCallback((orderedIds: string[]) => {
    setTransferStepsRaw((prev) => {
      const map = new Map(prev.map((s) => [s.id, s]));
      return orderedIds
        .map((id, order) => {
          const step = map.get(id);
          return step ? { ...step, order } : null;
        })
        .filter((s): s is TransferStep => s !== null);
    });
  }, []);

  const value = useMemo(
    () => ({
      assets,
      graphs,
      activeDiagramAssetId,
      setActiveDiagramAssetId: handleSetActiveDiagramAssetId,
      activeGraph,
      transferSteps,
      family,
      familyProfile,
      updateFamilyProfile,
      saveFamilyMember,
      removeFamilyMember,
      selectedAssetId,
      formOpen,
      editingAsset,
      setSelectedAssetId,
      openCreateForm,
      openEditForm,
      closeForm,
      saveAsset,
      updateDiagramNodePosition,
      updateDiagramNode,
      addDiagramNode,
      removeDiagramNode,
      addDiagramEdge,
      reorderTransferSteps,
      totals,
    }),
    [
      assets,
      graphs,
      activeDiagramAssetId,
      handleSetActiveDiagramAssetId,
      activeGraph,
      transferSteps,
      family,
      familyProfile,
      updateFamilyProfile,
      saveFamilyMember,
      removeFamilyMember,
      selectedAssetId,
      formOpen,
      editingAsset,
      openCreateForm,
      openEditForm,
      closeForm,
      saveAsset,
      updateDiagramNodePosition,
      updateDiagramNode,
      addDiagramNode,
      removeDiagramNode,
      addDiagramEdge,
      reorderTransferSteps,
      totals,
    ],
  );

  return (
    <WealthContext.Provider value={value}>{children}</WealthContext.Provider>
  );
}

export function useWealth() {
  const ctx = useContext(WealthContext);
  if (!ctx) throw new Error("useWealth must be used within WealthProvider");
  return ctx;
}
