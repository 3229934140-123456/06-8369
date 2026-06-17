import { create } from 'zustand';
import type {
  Diagram, DiagramNode, DiagramEdge, Operation, Viewport, DiagramVersion,
  Comment, CursorPayload, User, NodeStyle, EdgeStyle
} from '@shared/types.js';
import { diagramApi } from '../lib/api.js';

// #region debug-point dp-logger
const DBG = (typeof window !== 'undefined') ? {
  url: 'http://127.0.0.1:7777/event',
  sid: 'collab-sync-bugs',
  log: (point: string, event: string, data: any = {}) => {
    try {
      fetch(DBG.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: DBG.sid, point, event, timestamp: Date.now(), data }),
      }).catch(() => {});
    } catch (e) {}
  },
} : { log: () => {} };
// #endregion

interface OnlinePeer {
  user: User;
  cursor?: CursorPayload;
  lastSeen: number;
}

interface HistoryState {
  past: Operation[][];
  future: Operation[][];
}

interface DiagramState {
  diagram: Diagram | null;
  loading: boolean;
  saving: boolean;
  selectedNodeIds: string[];
  selectedEdgeId: string | null;
  editingNodeId: string | null;
  peers: Map<string, OnlinePeer>;
  history: HistoryState;
  versions: DiagramVersion[];
  comments: Comment[];
  autoSaveTimer: any;

  loadDiagram: (id: string) => Promise<void>;
  setDiagram: (d: Diagram) => void;
  applyOps: (ops: Operation[], remote?: boolean) => void;
  undo: () => void;
  redo: () => void;

  selectNode: (id: string | null, multi?: boolean) => void;
  selectEdge: (id: string | null) => void;
  clearSelection: () => void;
  setEditingNode: (id: string | null) => void;

  updateViewport: (vp: Viewport) => void;
  addNode: (node: DiagramNode) => void;
  updateNode: (id: string, changes: Omit<Partial<DiagramNode>, 'style'> & { style?: Partial<NodeStyle> }) => void;
  deleteSelected: () => void;
  addEdge: (edge: DiagramEdge) => void;
  updateEdge: (id: string, changes: Omit<Partial<DiagramEdge>, 'style'> & { style?: Partial<EdgeStyle> }) => void;

  setPeer: (peer: OnlinePeer) => void;
  removePeer: (userId: string) => void;

  loadVersions: () => Promise<void>;
  createVersion: (meta?: { name?: string; message?: string }) => Promise<void>;
  restoreVersion: (vid: string) => Promise<void>;

  loadComments: () => Promise<void>;
  addComment: (data: { nodeId?: string; content: string }) => Promise<void>;
  addReply: (cid: string, content: string) => Promise<void>;
  resolveComment: (cid: string, resolved: boolean) => Promise<void>;

  rename: (name: string) => Promise<void>;
  save: () => Promise<void>;
  reset: () => void;
}

const cloneOps = (ops: Operation[]): Operation[] => ops.map(o => ({ ...o }) as Operation);

export const useDiagramStore = create<DiagramState>((set, get) => ({
  diagram: null,
  loading: false,
  saving: false,
  selectedNodeIds: [],
  selectedEdgeId: null,
  editingNodeId: null,
  peers: new Map(),
  history: { past: [], future: [] },
  versions: [],
  comments: [],
  autoSaveTimer: null,

  loadDiagram: async (id) => {
    set({ loading: true });
    try {
      const d = await diagramApi.get(id);
      set({ diagram: d, loading: false, history: { past: [], future: [] } });
      get().loadVersions();
      get().loadComments();
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  setDiagram: (d) => set({ diagram: d }),

  applyOps: (ops, remote = false) => {
    const state = get();
    if (!state.diagram) return;
    let nodes = state.diagram.nodes.map(n => ({ ...n, style: { ...n.style } }));
    let edges = state.diagram.edges.map(e => ({ ...e, style: { ...e.style }, points: e.points ? [...e.points] : undefined }));
    let viewport = state.diagram.viewport;

    // #region debug-point dp-02
    const opTypes = ops.map(o => o.type);
    const hasNodeUpdate = ops.some(o => o.type === 'node:update');
    DBG.log('dp-02', 'applyOps', {
      opTypes, remote, opsCount: ops.length,
      hasNodeUpdate, nodeIds: ops.filter(o => o.type === 'node:update').map((o: any) => o.nodeId),
    });
    // #endregion

    for (const op of ops) {
      switch (op.type) {
        case 'node:add':
          nodes.push({ ...op.node, style: { ...op.node.style } });
          break;
        case 'node:update': {
          const idx = nodes.findIndex(n => n.id === op.nodeId);
          if (idx >= 0) {
            nodes[idx] = {
              ...nodes[idx], ...op.changes,
              style: op.changes.style ? { ...nodes[idx].style, ...op.changes.style } : nodes[idx].style,
            };
            // #region debug-point dp-02
            DBG.log('dp-02', 'node:update applied', {
              nodeId: op.nodeId,
              oldX: nodes[idx].x, oldY: nodes[idx].y,
              changes: JSON.parse(JSON.stringify(op.changes)),
            });
            // #endregion
          }
          break;
        }
        case 'node:delete': {
          const removedIds = new Set(ops.filter(o => o.type === 'node:delete').map(o => (o as any).nodeId));
          nodes = nodes.filter(n => !removedIds.has(n.id));
          edges = edges.filter(e => !removedIds.has(e.source) && !removedIds.has(e.target));
          break;
        }
        case 'edge:add':
          edges.push({ ...op.edge, style: { ...op.edge.style }, points: op.edge.points ? [...op.edge.points] : undefined });
          break;
        case 'edge:update': {
          const idx = edges.findIndex(e => e.id === op.edgeId);
          if (idx >= 0) {
            edges[idx] = {
              ...edges[idx], ...(op.changes as any),
              style: op.changes.style ? { ...edges[idx].style, ...op.changes.style } : edges[idx].style,
            };
          }
          break;
        }
        case 'edge:delete':
          edges = edges.filter(e => e.id !== op.edgeId);
          break;
        case 'viewport:update':
          viewport = op.viewport;
          break;
      }
    }

    const nextDiagram = { ...state.diagram, nodes, edges, viewport };

    let nextHistory = state.history;
    if (!remote && ops.some(o => o.type !== 'viewport:update')) {
      nextHistory = {
        past: [...state.history.past, cloneOps(ops)],
        future: [],
      };
      if (nextHistory.past.length > 100) nextHistory.past.shift();
      // #region debug-point dp-02
      DBG.log('dp-02', 'history-push', {
        pastLen: nextHistory.past.length,
        opTypes, remote,
      });
      // #endregion
    } else if (remote) {
      // #region debug-point dp-02
      DBG.log('dp-02', 'history-skip-remote', { opTypes });
      // #endregion
    }

    set({ diagram: nextDiagram, history: nextHistory });

    if (!remote && ops.some(o => o.type !== 'viewport:update')) {
      get().save();
    }
  },

  undo: () => {
    const state = get();
    if (state.history.past.length === 0 || !state.diagram) return;
    const ops = [...state.history.past].pop()!;
    const inverse = ops.map<Operation>(op => {
      switch (op.type) {
        case 'node:add': return { type: 'node:delete', nodeId: op.node.id };
        case 'node:delete': return { type: 'node:add', node: state.diagram!.nodes.find(n => n.id === op.nodeId)! };
        case 'node:update': {
          const cur = state.diagram!.nodes.find(n => n.id === op.nodeId)!;
          return { type: 'node:update', nodeId: op.nodeId, changes: diffFrom(cur, op.changes as any) as any };
        }
        case 'edge:add': return { type: 'edge:delete', edgeId: op.edge.id };
        case 'edge:delete': return { type: 'edge:add', edge: state.diagram!.edges.find(e => e.id === op.edgeId)! };
        case 'edge:update': {
          const cur = state.diagram!.edges.find(e => e.id === op.edgeId)!;
          return { type: 'edge:update', edgeId: op.edgeId, changes: diffFrom(cur, op.changes as any) as any };
        }
        default: return op;
      }
    });
    get().applyOps(inverse);
    set({
      history: {
        past: state.history.past.slice(0, -1),
        future: [cloneOps(ops), ...state.history.future],
      },
    });
  },

  redo: () => {
    const state = get();
    if (state.history.future.length === 0) return;
    const ops = state.history.future[0];
    get().applyOps(ops);
    set({
      history: {
        past: [...state.history.past, cloneOps(ops)],
        future: state.history.future.slice(1),
      },
    });
  },

  selectNode: (id, multi) => {
    if (!id) { set({ selectedNodeIds: [] }); return; }
    set(s => ({
      selectedNodeIds: multi
        ? (s.selectedNodeIds.includes(id) ? s.selectedNodeIds.filter(x => x !== id) : [...s.selectedNodeIds, id])
        : [id],
      selectedEdgeId: null,
    }));
  },
  selectEdge: (id) => set({ selectedEdgeId: id, selectedNodeIds: [] }),
  clearSelection: () => set({ selectedNodeIds: [], selectedEdgeId: null }),
  setEditingNode: (id) => set({ editingNodeId: id }),

  updateViewport: (vp) => {
    if (!get().diagram) return;
    get().applyOps([{ type: 'viewport:update', viewport: vp }], true);
  },

  addNode: (node) => get().applyOps([{ type: 'node:add', node }]),
  updateNode: (id, changes) => get().applyOps([{ type: 'node:update', nodeId: id, changes }]),
  deleteSelected: () => {
    const s = get();
    const ops: Operation[] = [
      ...s.selectedNodeIds.map<Operation>(id => ({ type: 'node:delete', nodeId: id })),
      ...(s.selectedEdgeId ? [{ type: 'edge:delete', edgeId: s.selectedEdgeId } as Operation] : []),
    ];
    if (ops.length > 0) {
      get().applyOps(ops);
      set({ selectedNodeIds: [], selectedEdgeId: null });
    }
  },
  addEdge: (edge) => get().applyOps([{ type: 'edge:add', edge }]),
  updateEdge: (id, changes) => get().applyOps([{ type: 'edge:update', edgeId: id, changes }]),

  setPeer: (peer) => set(s => {
    const next = new Map(s.peers);
    next.set(peer.user.id, { ...(next.get(peer.user.id) ?? {}), ...peer });
    return { peers: next };
  }),
  removePeer: (userId) => set(s => {
    const next = new Map(s.peers);
    next.delete(userId);
    return { peers: next };
  }),

  loadVersions: async () => {
    const d = get().diagram;
    if (!d) return;
    const list = await diagramApi.listVersions(d.id);
    set({ versions: list });
  },
  createVersion: async (meta) => {
    const d = get().diagram;
    if (!d) return;
    // #region debug-point dp-05
    DBG.log('dp-05', 'createVersion:called', { diagramId: d.id, meta, nodeCount: d.nodes.length });
    // #endregion
    const v = await diagramApi.createVersion(d.id, meta);
    set(s => ({ versions: [v, ...s.versions] }));
  },
  restoreVersion: async (vid) => {
    const d = get().diagram;
    if (!d) return;
    // #region debug-point dp-05
    DBG.log('dp-05', 'restoreVersion:called', { diagramId: d.id, versionId: vid });
    // #endregion
    const restored = await diagramApi.restoreVersion(d.id, vid);
    // #region debug-point dp-05
    DBG.log('dp-05', 'restoreVersion:restored', {
      versionId: vid,
      restoredNodeCount: restored?.nodes.length,
      restoredEdgeCount: restored?.edges.length,
    });
    // #endregion
    set({ diagram: restored, history: { past: [], future: [] } });
    get().loadVersions();
  },

  loadComments: async () => {
    const d = get().diagram;
    if (!d) return;
    set({ comments: await diagramApi.listComments(d.id) });
  },
  addComment: async (data) => {
    const d = get().diagram;
    if (!d) return;
    const c = await diagramApi.createComment(d.id, data);
    set(s => ({ comments: [...s.comments, c] }));
  },
  addReply: async (cid, content) => {
    const d = get().diagram;
    if (!d) return;
    const reply = await diagramApi.addReply(d.id, cid, content);
    set(s => ({
      comments: s.comments.map(c => c.id === cid ? { ...c, replies: [...c.replies, reply] } : c),
    }));
  },
  resolveComment: async (cid, resolved) => {
    const d = get().diagram;
    if (!d) return;
    const c = await diagramApi.updateComment(d.id, cid, { resolved });
    set(s => ({ comments: s.comments.map(x => x.id === cid ? c ?? x : x) }));
  },

  rename: async (name) => {
    const d = get().diagram;
    if (!d || d.name === name) return;
    const updated = await diagramApi.update(d.id, { name });
    set({ diagram: { ...d, name: updated.name } });
  },

  save: async () => {
    const s = get();
    if (!s.diagram || s.saving) return;
    set({ saving: true });
    if (s.autoSaveTimer) clearTimeout(s.autoSaveTimer);
    const timer = setTimeout(async () => {
      try {
        const d = get().diagram;
        // #region debug-point dp-08
        DBG.log('dp-08', 'autosave:start', { diagramId: d?.id, nodeCount: d?.nodes.length });
        // #endregion
        if (d) {
          const result = await diagramApi.update(d.id, { nodes: d.nodes, edges: d.edges, viewport: d.viewport });
          // #region debug-point dp-08
          DBG.log('dp-08', 'autosave:done', { diagramId: d.id, success: !!result });
          // #endregion
        }
      } finally {
        set({ saving: false });
      }
    }, 800);
    set({ autoSaveTimer: timer });
  },

  reset: () => set({
    diagram: null, versions: [], comments: [],
    selectedNodeIds: [], selectedEdgeId: null, editingNodeId: null,
    peers: new Map(), history: { past: [], future: [] },
  }),
}));

function diffFrom<T extends Record<string, any>>(cur: T, changes: Partial<T>): Partial<T> {
  const out: any = {};
  for (const k of Object.keys(changes)) {
    out[k] = (cur as any)[k];
  }
  return out;
}
