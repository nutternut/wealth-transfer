"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
  type OnConnect,
  type OnNodeDrag,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import clsx from "clsx";
import {
  BriefcaseBusiness,
  Building2,
  Maximize2,
  Pencil,
  Trash2,
  UserRound,
} from "lucide-react";
import { useWealth } from "@/context/WealthContext";
import { Modal } from "@/components/Modal";
import type { DiagramNode } from "@/lib/types";

type OwnershipNodeData = {
  label: string;
  sublabel?: string;
  kind: "person" | "asset";
  initials: string;
  onEdit?: () => void;
};

type OwnershipNode = Node<OwnershipNodeData, "ownership">;

function initialsFrom(label: string) {
  const cleaned = label.replace(/คุณ|บุตร|คน|หุ้น|บริษัท|ที่ดิน/g, "").trim();
  return cleaned.slice(0, 2) || label.slice(0, 2);
}

function OwnershipNodeView({ data, selected }: NodeProps<OwnershipNode>) {
  const isAsset = data.kind === "asset";

  return (
    <div
      className={clsx(
        "relative w-[230px] overflow-hidden rounded-2xl border shadow-lg backdrop-blur-sm transition-all",
        isAsset
          ? "border-mint-brand/30 bg-gradient-to-br from-mint-brand to-mint-brand-dark text-white shadow-mint-brand/30"
          : "border-slate-100/90 bg-white/95 text-slate-800 shadow-slate-200/70",
        selected &&
          "scale-[1.02] ring-2 ring-mint-brand/60 ring-offset-2 ring-offset-[#f4faf7]",
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2.5 !w-2.5 !border-2 !border-white !bg-mint-brand"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2.5 !w-2.5 !border-2 !border-white !bg-mint-brand"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="r"
        className="!h-2.5 !w-2.5 !border-2 !border-white !bg-mint-brand"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="l"
        className="!h-2.5 !w-2.5 !border-2 !border-white !bg-mint-brand"
      />

      <button
        type="button"
        className={clsx(
          "nodrag nopan absolute top-1.5 right-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-lg transition",
          isAsset
            ? "bg-white/15 text-white hover:bg-white/25"
            : "bg-slate-50 text-slate-500 hover:bg-mint-brand-light hover:text-mint-brand",
        )}
        aria-label="แก้ไขโหนด"
        title="แก้ไข"
        onClick={(e) => {
          e.stopPropagation();
          data.onEdit?.();
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
      </button>

      <div className="flex items-center gap-3 px-3.5 py-3 pr-9">
        <div
          className={clsx(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold",
            isAsset
              ? "bg-white/20 text-white"
              : "bg-mint-brand-light text-mint-brand-dark",
          )}
        >
          {isAsset ? (
            <Building2 className="h-5 w-5" strokeWidth={1.75} />
          ) : (
            data.initials
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-bold tracking-tight">
            {data.label}
          </p>
          {data.sublabel && (
            <p
              className={clsx(
                "mt-0.5 truncate text-[10px] leading-snug",
                isAsset ? "text-white/75" : "text-slate-400",
              )}
            >
              {data.sublabel}
            </p>
          )}
        </div>
      </div>

      <div
        className={clsx(
          "flex items-center gap-1.5 border-t px-3.5 py-1.5 text-[9px] font-semibold tracking-wide uppercase",
          isAsset
            ? "border-white/15 bg-black/10 text-white/80"
            : "border-slate-50 bg-slate-50/80 text-slate-400",
        )}
      >
        {isAsset ? (
          <>
            <BriefcaseBusiness className="h-3 w-3" />
            ทรัพย์สินหลัก
          </>
        ) : (
          <>
            <UserRound className="h-3 w-3" />
            สมาชิกตระกูล
          </>
        )}
      </div>
    </div>
  );
}

const nodeTypes = { ownership: OwnershipNodeView };

function toFlowNodes(
  nodes: DiagramNode[],
  onEdit?: (id: string) => void,
): OwnershipNode[] {
  return nodes.map((n) => ({
    id: n.id,
    type: "ownership" as const,
    position: { x: n.x, y: n.y },
    data: {
      label: n.label,
      sublabel: n.sublabel,
      kind: n.kind,
      initials: initialsFrom(n.label),
      onEdit: onEdit ? () => onEdit(n.id) : undefined,
    },
    draggable: true,
  }));
}

function toFlowEdges(
  edges: { id: string; from: string; to: string; label: string }[],
  highlightIds: Set<string>,
  hasHighlight: boolean,
): Edge[] {
  return edges.map((e) => {
    const active = !hasHighlight || highlightIds.has(e.id);
    return {
      id: e.id,
      source: e.from,
      target: e.to,
      type: "smoothstep",
      animated: active,
      label: e.label,
      labelStyle: {
        fill: active ? "#2C8564" : "#94a3b8",
        fontSize: 10,
        fontWeight: 600,
      },
      labelBgStyle: {
        fill: active ? "#E8F7F2" : "#f8fafc",
        fillOpacity: 0.95,
      },
      labelBgPadding: [5, 8] as [number, number],
      labelBgBorderRadius: 8,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 16,
        height: 16,
        color: active ? "#3EB489" : "#cbd5e1",
      },
      style: {
        stroke: active ? "#3EB489" : "#e2e8f0",
        strokeWidth: active ? 2.25 : 1.25,
        opacity: active ? 0.95 : 0.35,
      },
    };
  });
}

function collectConnectedEdgeIds(
  nodeId: string,
  edges: { id: string; from: string; to: string }[],
) {
  const related = new Set<string>();
  const visited = new Set<string>([nodeId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const e of edges) {
      const touch = visited.has(e.from) || visited.has(e.to);
      if (!touch || related.has(e.id)) continue;
      related.add(e.id);
      visited.add(e.from);
      visited.add(e.to);
      changed = true;
    }
  }
  return related;
}

function EditNodeModal({
  node,
  onClose,
  onSave,
  onRequestDelete,
}: {
  node: DiagramNode;
  onClose: () => void;
  onSave: (patch: { label: string; sublabel: string }) => void;
  onRequestDelete: () => void;
}) {
  const [label, setLabel] = useState(node.label);
  const [sublabel, setSublabel] = useState(node.sublabel ?? "");

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        aria-label="ปิด"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-5 shadow-2xl">
        <h3 className="text-sm font-bold text-slate-900">แก้ไขโหนด</h3>
        <p className="mt-0.5 text-[11px] text-slate-400">
          แตะไอคอนดินสอ หรือดับเบิลคลิก/ดับเบิลแท็บโหนด
        </p>
        <label className="mt-4 block space-y-1.5">
          <span className="text-xs font-semibold text-slate-500">ชื่อ</span>
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-mint-brand focus:ring-2 focus:ring-mint-200 focus:outline-none"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            autoFocus
          />
        </label>
        <label className="mt-3 block space-y-1.5">
          <span className="text-xs font-semibold text-slate-500">
            รายละเอียด / %
          </span>
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-mint-brand focus:ring-2 focus:ring-mint-200 focus:outline-none"
            value={sublabel}
            onChange={(e) => setSublabel(e.target.value)}
            placeholder="เช่น ถือ 60%"
          />
        </label>
        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-rose-600 transition hover:bg-rose-50"
            onClick={onRequestDelete}
            aria-label="ลบโหนด"
            title="ลบโหนด"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <div className="flex gap-2">
            <button type="button" className="ui-btn ui-btn-ghost" onClick={onClose}>
              ยกเลิก
            </button>
            <button
              type="button"
              className="ui-btn ui-btn-primary"
              onClick={() =>
                onSave({
                  label: label.trim() || node.label,
                  sublabel: sublabel.trim(),
                })
              }
            >
              บันทึก
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteNodeModal({
  node,
  open,
  onClose,
  onConfirm,
}: {
  node: DiagramNode | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="ยืนยันการลบ"
      description="การลบจะเอาโหนดและเส้นเชื่อมที่เกี่ยวกับโหนดนี้ออกจากแผนภาพ"
      tone="rose"
      size="sm"
      icon={<Trash2 className="h-4 w-4 text-rose-600" />}
      footer={
        <>
          <button type="button" className="ui-btn ui-btn-ghost" onClick={onClose}>
            ยกเลิก
          </button>
          <button
            type="button"
            className="ui-btn bg-rose-600 text-white hover:bg-rose-700"
            onClick={onConfirm}
            aria-label="ลบโหนด"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-slate-600">
        ต้องการลบโหนด{" "}
        <span className="font-semibold text-slate-900">
          “{node?.label ?? "โหนดนี้"}”
        </span>{" "}
        ออกจากแผนภาพหรือไม่?
      </p>
    </Modal>
  );
}

function DiagramCanvas() {
  const {
    graphs,
    activeGraph,
    activeDiagramAssetId,
    setActiveDiagramAssetId,
    updateDiagramNodePosition,
    updateDiagramNode,
    removeDiagramNode,
    addDiagramEdge,
  } = useWealth();

  const sourceNodes = activeGraph?.nodes ?? [];
  const sourceEdges = activeGraph?.edges ?? [];

  const [nodes, setNodes, onNodesChange] = useNodesState<OwnershipNode>(
    toFlowNodes(sourceNodes),
  );
  const [highlightIds, setHighlightIds] = useState<Set<string>>(new Set());
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<DiagramNode | null>(null);
  const [pendingDeleteNode, setPendingDeleteNode] =
    useState<DiagramNode | null>(null);
  const hasHighlight = highlightIds.size > 0;
  const lastTapRef = useRef<{ id: string; time: number } | null>(null);

  const openEditNode = useCallback(
    (id: string) => {
      const raw = sourceNodes.find((n) => n.id === id);
      if (raw) setEditingNode(raw);
    },
    [sourceNodes],
  );

  const [edges, setEdges, onEdgesChange] = useEdgesState(
    toFlowEdges(sourceEdges, highlightIds, hasHighlight),
  );
  const { fitView } = useReactFlow();

  useEffect(() => {
    setNodes(toFlowNodes(sourceNodes, openEditNode));
    setSelectedNodeId(null);
    setHighlightIds(new Set());
    const t = window.setTimeout(
      () => fitView({ padding: 0.28, duration: 250 }),
      40,
    );
    return () => window.clearTimeout(t);
    // Switch graph only — avoid reset on every node drag save
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDiagramAssetId]);

  useEffect(() => {
    setNodes((prev) => {
      const prevMap = new Map(prev.map((n) => [n.id, n]));
      return toFlowNodes(sourceNodes, openEditNode).map((n) => {
        const existing = prevMap.get(n.id);
        return {
          ...n,
          selected: existing?.selected,
          style: existing?.style,
        };
      });
    });
  }, [sourceNodes, openEditNode, setNodes]);

  useEffect(() => {
    setEdges(toFlowEdges(sourceEdges, highlightIds, highlightIds.size > 0));
  }, [sourceEdges, highlightIds, setEdges]);

  const onNodeDragStop: OnNodeDrag<OwnershipNode> = useCallback(
    (_event, node) => {
      updateDiagramNodePosition(node.id, node.position.x, node.position.y);
    },
    [updateDiagramNodePosition],
  );

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      addDiagramEdge(connection.source, connection.target, "ความสัมพันธ์");
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: "smoothstep",
            animated: true,
            style: { stroke: "#3EB489", strokeWidth: 2 },
          },
          eds,
        ),
      );
    },
    [addDiagramEdge, setEdges],
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: OwnershipNode) => {
      const now = Date.now();
      const last = lastTapRef.current;
      if (last && last.id === node.id && now - last.time < 400) {
        lastTapRef.current = null;
        openEditNode(node.id);
        return;
      }
      lastTapRef.current = { id: node.id, time: now };
      setSelectedNodeId(node.id);
      setHighlightIds(collectConnectedEdgeIds(node.id, sourceEdges));
    },
    [sourceEdges, openEditNode],
  );

  const onPaneClick = useCallback(() => {
    lastTapRef.current = null;
    setSelectedNodeId(null);
    setHighlightIds(new Set());
  }, []);

  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: OwnershipNode) => {
      openEditNode(node.id);
    },
    [openEditNode],
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (editingNode || pendingDeleteNode) return;
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (!selectedNodeId) return;
      e.preventDefault();
      const raw = sourceNodes.find((n) => n.id === selectedNodeId);
      if (raw) setPendingDeleteNode(raw);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editingNode, pendingDeleteNode, selectedNodeId, sourceNodes]);

  function confirmDeleteNode() {
    if (!pendingDeleteNode) return;
    removeDiagramNode(pendingDeleteNode.id);
    setPendingDeleteNode(null);
    setEditingNode(null);
    setSelectedNodeId(null);
    setHighlightIds(new Set());
  }

  const dimmedNodeIds = useMemo(() => {
    if (!hasHighlight || !selectedNodeId) return new Set<string>();
    const keep = new Set<string>([selectedNodeId]);
    for (const e of sourceEdges) {
      if (highlightIds.has(e.id)) {
        keep.add(e.from);
        keep.add(e.to);
      }
    }
    const dim = new Set<string>();
    for (const n of sourceNodes) {
      if (!keep.has(n.id)) dim.add(n.id);
    }
    return dim;
  }, [hasHighlight, selectedNodeId, highlightIds, sourceEdges, sourceNodes]);

  useEffect(() => {
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        style: {
          ...n.style,
          opacity: dimmedNodeIds.has(n.id) ? 0.35 : 1,
          filter: dimmedNodeIds.has(n.id) ? "grayscale(0.4)" : undefined,
        },
      })),
    );
  }, [dimmedNodeIds, setNodes]);

  return (
    <>
      <div className="mb-4">
        <div
          className="inline-flex max-w-full items-center gap-0.5 rounded-lg border border-slate-100 bg-slate-50/90 p-0.5"
          role="tablist"
          aria-label="เลือกแผนภาพทรัพย์สิน"
        >
          {graphs.map((g) => {
            const active = g.assetId === activeDiagramAssetId;
            return (
              <button
                key={g.assetId}
                type="button"
                role="tab"
                aria-selected={active}
                title={g.title}
                onClick={() => setActiveDiagramAssetId(g.assetId)}
                className={clsx(
                  "inline-flex h-7 items-center justify-center rounded-md px-2.5 text-[10px] leading-none font-semibold whitespace-nowrap transition",
                  active
                    ? "bg-mint-brand text-white shadow-sm"
                    : "text-slate-500 hover:bg-white hover:text-mint-brand-dark",
                )}
              >
                {g.title}
              </button>
            );
          })}
        </div>
      </div>

      <div className="ownership-canvas relative h-[540px] overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={onNodeDragStop}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          fitViewOptions={{ padding: 0.28 }}
          minZoom={0.25}
          maxZoom={2}
          panOnScroll
          selectionOnDrag={false}
          panOnDrag
          proOptions={{ hideAttribution: true }}
          className="!bg-white"
        >
          <Background
            id="dots"
            variant={BackgroundVariant.Dots}
            gap={18}
            size={1.35}
            color="rgba(62, 180, 137, 0.45)"
          />
          <Controls
            showInteractive={false}
            className="!m-3 !overflow-hidden !rounded-2xl !border !border-slate-100 !bg-white/95 !shadow-md"
          />
          <MiniMap
            width={56}
            height={36}
            nodeStrokeWidth={1.5}
            pannable
            zoomable
            nodeColor={(n) =>
              (n.data as OwnershipNodeData)?.kind === "asset"
                ? "#3EB489"
                : "#fff"
            }
            maskColor="rgba(15, 23, 42, 0.06)"
            className="!m-3 !overflow-hidden !rounded-lg !border !border-slate-100 !bg-white !shadow-md"
          />
        </ReactFlow>

        <button
          type="button"
          onClick={() => fitView({ padding: 0.28, duration: 300 })}
          className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-500 shadow-md hover:text-mint-brand"
          title="จัดให้อยู่กลาง"
          aria-label="จัดให้อยู่กลาง"
        >
          <Maximize2 className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>

      {editingNode && (
        <EditNodeModal
          node={editingNode}
          onClose={() => setEditingNode(null)}
          onSave={(patch) => {
            updateDiagramNode(editingNode.id, patch);
            setEditingNode(null);
          }}
          onRequestDelete={() => setPendingDeleteNode(editingNode)}
        />
      )}

      <DeleteNodeModal
        node={pendingDeleteNode}
        open={pendingDeleteNode !== null}
        onClose={() => setPendingDeleteNode(null)}
        onConfirm={confirmDeleteNode}
      />
    </>
  );
}

export function AssetDiagram() {
  const { addDiagramNode } = useWealth();

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">แผนภาพกรรมสิทธิ์</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            กดเพิ่มโหนด · แตะดินสอหรือดับเบิลแท็บเพื่อแก้ไข · กด Delete เมื่อเลือกโหนด
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => addDiagramNode("person")}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-1.5 transition hover:border-mint-100 hover:bg-mint-brand-light/50"
            aria-label="เพิ่มบุคคล"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-mint-brand shadow-sm">
              <UserRound className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
            <span className="text-[11px] font-semibold text-slate-600">บุคคล</span>
          </button>
          <button
            type="button"
            onClick={() => addDiagramNode("asset")}
            className="inline-flex items-center gap-2 rounded-xl border border-mint-100 bg-mint-brand-light/70 px-3 py-1.5 transition hover:bg-mint-brand-light"
            aria-label="เพิ่มทรัพย์สิน"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-mint-brand text-white shadow-sm">
              <Building2 className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
            <span className="text-[11px] font-semibold text-mint-brand-dark">
              ทรัพย์สิน
            </span>
          </button>
        </div>
      </div>

      <ReactFlowProvider>
        <DiagramCanvas />
      </ReactFlowProvider>
    </div>
  );
}
