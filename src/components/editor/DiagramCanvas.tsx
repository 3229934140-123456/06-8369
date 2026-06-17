import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useDiagramStore } from '../../store/useDiagramStore.js';
import { NodeShapeRenderer } from './NodeShapeRenderer.js';
import { EdgeRenderer } from './EdgeRenderer.js';
import { useUserStore } from '../../store/useUserStore.js';
import { useCollaboration } from '../../hooks/useCollaboration.js';
import type { DiagramNode, DiagramEdge, Viewport, PortType, DEFAULT_VIEWPORT, DEFAULT_EDGE_STYLE, DEFAULT_NODE_STYLE } from '@shared/types.js';
import { DEFAULT_VIEWPORT as DV, DEFAULT_EDGE_STYLE as DES, DEFAULT_NODE_STYLE as DNS } from '@shared/types.js';
import { screenToViewport, snapToGrid, computeAutoPorts, getPortPosition, buildEdgePath, getNewZIndex } from '../../lib/geometry.js';
import { PeerCursors } from './PeerCursors.js';
import { getShapeDefinition } from '@shared/shape-types.js';

interface Props {
  diagramId: string;
  readOnly?: boolean;
}

type DragMode =
  | { kind: 'none' }
  | { kind: 'pan'; startX: number; startY: number; startVp: Viewport }
  | { kind: 'node'; nodeIds: string[]; startX: number; startY: number; originalPos: Map<string, { x: number; y: number }> }
  | { kind: 'connect'; sourceId: string; sourcePort: PortType; x: number; y: number }
  | { kind: 'select'; startX: number; startY: number; curX: number; curY: number }
  | { kind: 'resize'; nodeId: string; handle: 'nw' | 'ne' | 'sw' | 'se'; startX: number; startY: number; orig: DiagramNode };

const SVG_NS = 'http://www.w3.org/2000/svg';
const GRID_SIZE = 20;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;

export const DiagramCanvas: React.FC<Props> = ({ diagramId, readOnly = false }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragMode>({ kind: 'none' });
  const [connectTo, setConnectTo] = useState<{ x: number; y: number; targetNode?: DiagramNode; targetPort?: PortType } | null>(null);

  const diagram = useDiagramStore(s => s.diagram);
  const viewport = diagram?.viewport ?? DV;
  const nodes = diagram?.nodes ?? [];
  const edges = diagram?.edges ?? [];
  const selectedIds = useDiagramStore(s => s.selectedNodeIds);
  const selectedEdgeId = useDiagramStore(s => s.selectedEdgeId);
  const applyOps = useDiagramStore(s => s.applyOps);
  const selectNode = useDiagramStore(s => s.selectNode);
  const selectEdge = useDiagramStore(s => s.selectEdge);
  const clearSelection = useDiagramStore(s => s.clearSelection);
  const setEditingNode = useDiagramStore(s => s.setEditingNode);
  const deleteSelected = useDiagramStore(s => s.deleteSelected);
  const addNode = useDiagramStore(s => s.addNode);
  const addEdge = useDiagramStore(s => s.addEdge);
  const undo = useDiagramStore(s => s.undo);
  const redo = useDiagramStore(s => s.redo);
  const updateViewport = useDiagramStore(s => s.updateViewport);

  const user = useUserStore(s => s.user);
  const { sendCursor } = useCollaboration(diagramId);

  const vpTransform = `translate(${viewport.x} ${viewport.y}) scale(${viewport.zoom})`;

  const getVpFromEvent = useCallback((e: React.MouseEvent | MouseEvent) => {
    const rect = svgRef.current!.getBoundingClientRect();
    return screenToViewport(viewport, e.clientX - rect.left, e.clientY - rect.top);
  }, [viewport]);

  const handleSvgMouseDown = (e: React.MouseEvent) => {
    if (readOnly) return;
    if (e.target !== e.currentTarget) return;
    if (e.button === 1 || e.shiftKey || e.altKey || e.button === 2) {
      setDrag({ kind: 'pan', startX: e.clientX, startY: e.clientY, startVp: { ...viewport } });
      return;
    }
    setDrag({ kind: 'select', startX: e.clientX, startY: e.clientY, curX: e.clientX, curY: e.clientY });
    clearSelection();
  };

  const handleNodeMouseDown = (e: React.MouseEvent, node: DiagramNode) => {
    if (readOnly) return;
    e.stopPropagation();
    const multi = e.shiftKey || e.metaKey;
    const alreadySelected = selectedIds.includes(node.id);
    if (!alreadySelected && !multi) selectNode(node.id, false);
    const ids = alreadySelected ? (multi ? selectedIds : [node.id]) : (multi ? [...selectedIds, node.id] : [node.id]);
    const map = new Map<string, { x: number; y: number }>();
    ids.forEach(id => {
      const n = nodes.find(n => n.id === id);
      if (n) map.set(id, { x: n.x, y: n.y });
    });
    setDrag({ kind: 'node', nodeIds: ids, startX: e.clientX, startY: e.clientY, originalPos: map });
    if (!alreadySelected) selectNode(node.id, multi);
  };

  const handleNodeDoubleClick = (e: React.MouseEvent, node: DiagramNode) => {
    if (readOnly) return;
    e.stopPropagation();
    setEditingNode(node.id);
  };

  const handleEdgeMouseDown = (e: React.MouseEvent, edge: DiagramEdge) => {
    if (readOnly) return;
    e.stopPropagation();
    selectEdge(edge.id);
  };

  const handlePortMouseDown = (nodeId: string, port: PortType, e: React.MouseEvent) => {
    if (readOnly) return;
    e.stopPropagation();
    selectNode(nodeId, false);
    const rect = svgRef.current!.getBoundingClientRect();
    const p = screenToViewport(viewport, e.clientX - rect.left, e.clientY - rect.top);
    setDrag({ kind: 'connect', sourceId: nodeId, sourcePort: port, x: p.x, y: p.y });
    setConnectTo({ x: p.x, y: p.y });
  };

  useEffect(() => {
    if (drag.kind === 'none') return;

    const onMove = (e: MouseEvent) => {
      const rect = svgRef.current!.getBoundingClientRect();
      const p = screenToViewport(viewport, e.clientX - rect.left, e.clientY - rect.top);

      if (drag.kind === 'pan') {
        const dx = (e.clientX - drag.startX);
        const dy = (e.clientY - drag.startY);
        updateViewport({ ...drag.startVp, x: drag.startVp.x + dx, y: drag.startVp.y + dy });
        return;
      }
      if (drag.kind === 'select') {
        setDrag({ ...drag, curX: e.clientX, curY: e.clientY });
        return;
      }
      if (drag.kind === 'node') {
        const dx = (e.clientX - drag.startX) / viewport.zoom;
        const dy = (e.clientY - drag.startY) / viewport.zoom;
        const ops = drag.nodeIds.map(id => {
          const orig = drag.originalPos.get(id)!;
          return {
            type: 'node:update' as const,
            nodeId: id,
            changes: { x: snapToGrid(orig.x + dx, GRID_SIZE), y: snapToGrid(orig.y + dy, GRID_SIZE) },
          };
        });
        // #region debug-point dp-01
        const remoteFlag = true;
        DBG.log('dp-01', 'node-drag-move', {
          nodeIds: drag.nodeIds,
          dx, dy,
          opPreview: ops.map(o => ({ id: o.nodeId, x: o.changes.x, y: o.changes.y })),
          remote: remoteFlag,
          note: 'applyOps called with remote=true - will NOT push history or broadcast',
        });
        // #endregion
        applyOps(ops, remoteFlag);
        return;
      }
      if (drag.kind === 'connect') {
        const hover = nodes.find(n => n.id !== drag.sourceId
          && p.x >= n.x && p.x <= n.x + n.width
          && p.y >= n.y && p.y <= n.y + n.height);
        if (hover) {
          const { targetPort } = computeAutoPorts(nodes.find(x => x.id === drag.sourceId)!, hover);
          const portPos = getPortPosition(hover, targetPort);
          setConnectTo({ x: portPos.x, y: portPos.y, targetNode: hover, targetPort });
        } else {
          setConnectTo({ x: p.x, y: p.y });
        }
        setDrag({ ...drag, x: p.x, y: p.y });
        return;
      }
    };

    const onUp = (e: MouseEvent) => {
      if (drag.kind === 'select') {
        const rect = svgRef.current!.getBoundingClientRect();
        const x1 = Math.min(drag.startX, drag.curX) - rect.left;
        const y1 = Math.min(drag.startY, drag.curY) - rect.top;
        const x2 = Math.max(drag.startX, drag.curX) - rect.left;
        const y2 = Math.max(drag.startY, drag.curY) - rect.top;
        const a = screenToViewport(viewport, x1, y1);
        const b = screenToViewport(viewport, x2, y2);
        const hits: string[] = [];
        for (const n of nodes) {
          const cx = n.x + n.width / 2, cy = n.y + n.height / 2;
          if (cx >= a.x && cx <= b.x && cy >= a.y && cy <= b.y) hits.push(n.id);
        }
        if (hits.length === 1) selectNode(hits[0], false);
        else if (hits.length > 1) hits.forEach((id, i) => selectNode(id, i > 0));
      }
      if (drag.kind === 'connect' && connectTo?.targetNode) {
        const src = nodes.find(n => n.id === drag.sourceId)!;
        const tgt = connectTo.targetNode;
        const { sourcePort, targetPort } = computeAutoPorts(src, tgt);
        addEdge({
          id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          source: drag.sourceId,
          target: tgt.id,
          sourcePort, targetPort,
          style: { ...DES },
        });
      }
      setDrag({ kind: 'none' });
      setConnectTo(null);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [drag, viewport, nodes, connectTo, applyOps, addEdge, selectNode, updateViewport]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.isComposing) return;
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      else if (meta && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
      else if ((e.key === 'Delete' || e.key === 'Backspace') && (selectedIds.length > 0 || selectedEdgeId)) { e.preventDefault(); deleteSelected(); }
      else if (e.key === 'Escape') { clearSelection(); setEditingNode(null); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, deleteSelected, clearSelection, setEditingNode, selectedIds.length, selectedEdgeId]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!diagram) return;
      e.preventDefault();
      const rect = svgRef.current!.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, viewport.zoom * factor));
      const ratio = newZoom / viewport.zoom;
      const newX = mx - (mx - viewport.x) * ratio;
      const newY = my - (my - viewport.y) * ratio;
      updateViewport({ x: newX, y: newY, zoom: newZoom });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [viewport, diagram, updateViewport]);

  useEffect(() => {
    let raf = 0;
    const send = (e: MouseEvent) => {
      if (!user || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const p = screenToViewport(viewport, e.clientX - rect.left, e.clientY - rect.top);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        sendCursor({ x: p.x, y: p.y, viewport, selectedNodeId: selectedIds[0] });
      });
    };
    wrapRef.current?.addEventListener('mousemove', send);
    return () => { wrapRef.current?.removeEventListener('mousemove', send); cancelAnimationFrame(raf); };
  }, [user, viewport, selectedIds, sendCursor]);

  useEffect(() => {
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      if (readOnly || !diagram) return;
      const shapeType = e.dataTransfer?.getData('application/x-flowsync-shape');
      if (!shapeType) return;
      const def = getShapeDefinition(shapeType);
      const rect = svgRef.current!.getBoundingClientRect();
      const p = screenToViewport(viewport, e.clientX - rect.left, e.clientY - rect.top);
      const w = def?.defaultWidth ?? 140;
      const h = def?.defaultHeight ?? 80;
      addNode({
        id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: shapeType,
        x: snapToGrid(p.x - w / 2, GRID_SIZE),
        y: snapToGrid(p.y - h / 2, GRID_SIZE),
        width: w, height: h,
        text: def?.name ?? '节点',
        style: { ...DNS },
        zIndex: getNewZIndex(nodes),
      });
    };
    const el = wrapRef.current;
    el?.addEventListener('drop', onDrop);
    return () => el?.removeEventListener('drop', onDrop);
  }, [diagram, viewport, nodes, addNode, readOnly]);

  const selectBox = drag.kind === 'select' ? (() => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const x1 = Math.min(drag.startX, drag.curX) - rect.left;
    const y1 = Math.min(drag.startY, drag.curY) - rect.top;
    const x2 = Math.max(drag.startX, drag.curX) - rect.left;
    const y2 = Math.max(drag.startY, drag.curY) - rect.top;
    const a = screenToViewport(viewport, x1, y1);
    const b = screenToViewport(viewport, x2, y2);
    return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y };
  })() : null;

  const connectPath = (() => {
    if (drag.kind !== 'connect') return null;
    const src = nodes.find(n => n.id === drag.sourceId);
    if (!src) return null;
    const sp = getPortPosition(src, drag.sourcePort);
    const x2 = connectTo?.x ?? drag.x;
    const y2 = connectTo?.y ?? drag.y;
    const dx = x2 - sp.x, dy = y2 - sp.y;
    const cs = Math.min(Math.hypot(dx, dy) * 0.4, 80);
    const portMap: Record<PortType, [number, number]> = { right: [cs, 0], left: [-cs, 0], top: [0, -cs], bottom: [0, cs] };
    const off = portMap[drag.sourcePort];
    return `M ${sp.x} ${sp.y} C ${sp.x + off[0]} ${sp.y + off[1]}, ${x2 - dx * 0.2} ${y2 - dy * 0.2}, ${x2} ${y2}`;
  })();

  return (
    <div
      ref={wrapRef}
      className="canvas-grid absolute inset-0 overflow-hidden"
      style={{ cursor: drag.kind === 'pan' ? 'grabbing' : drag.kind === 'none' ? 'default' : undefined }}
      onDragOver={(e) => { e.preventDefault(); }}
    >
      <svg ref={svgRef} width="100%" height="100%" onMouseDown={handleSvgMouseDown}
        style={{ display: 'block', touchAction: 'none' }}>
        <g transform={vpTransform}>
          {edges.map(edge => (
            <EdgeRenderer
              key={edge.id}
              edge={edge}
              nodes={nodes}
              selected={edge.id === selectedEdgeId}
              onMouseDown={(e) => handleEdgeMouseDown(e, edge)}
            />
          ))}

          {connectPath && (
            <path d={connectPath} fill="none" stroke="#3B82F6" strokeWidth={2}
              strokeDasharray="6 4" pointerEvents="none" />
          )}

          {[...nodes].sort((a, b) => a.zIndex - b.zIndex).map(node => (
            <NodeShapeRenderer
              key={node.id}
              node={node}
              selected={selectedIds.includes(node.id)}
              onMouseDown={(e) => handleNodeMouseDown(e, node)}
              onDoubleClick={(e) => handleNodeDoubleClick(e, node)}
              onPortMouseDown={readOnly ? undefined : (port, e) => handlePortMouseDown(node.id, port, e)}
            />
          ))}

          {selectBox && (
            <rect className="selection-marquee"
              x={selectBox.x} y={selectBox.y}
              width={selectBox.w} height={selectBox.h} />
          )}
        </g>
      </svg>

      <PeerCursors viewport={viewport} />

      {!readOnly && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-graphite-500 bg-white/70 backdrop-blur px-3 py-1 rounded-full border border-graphite-200 pointer-events-none">
          滚轮缩放 · Shift+拖动平移 · 从端口拖出创建连线 · Del 删除 · Ctrl+Z 撤销
        </div>
      )}
    </div>
  );
};
