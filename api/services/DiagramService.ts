import { db, generateId, now } from '../repositories/index.js';
import { AuthService } from './AuthService.js';
import type { Diagram, DiagramNode, DiagramEdge, Operation, DiagramVersion, DiagramType, Viewport, ShareConfig, ShareScope } from '../../shared/types.js';
import { DEFAULT_VIEWPORT as DV } from '../../shared/types.js';
import http from 'node:http';

// #region debug-point dp-logger
const DBG_ENABLED = (process.env.DEBUG_COLLAB ?? '0') === '1';
const DBG = DBG_ENABLED ? {
  url: 'http://127.0.0.1:7777/event',
  sid: 'collab-sync-bugs',
  log: (point: string, event: string, data: any = {}) => {
    try {
      const body = JSON.stringify({ sessionId: DBG.sid, point, event, timestamp: Date.now(), data });
      const req = http.request(DBG.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      });
      req.write(body);
      req.end();
    } catch (e) {}
  },
} : { log: () => {} };
// #endregion

const applyOps = (nodes: DiagramNode[], edges: DiagramEdge[], ops: Operation[]): { nodes: DiagramNode[]; edges: DiagramEdge[] } => {
  let n = nodes.map(x => ({ ...x, style: { ...x.style } }));
  let e = edges.map(x => ({ ...x, style: { ...x.style }, points: x.points ? [...x.points] : undefined }));

  for (const op of ops) {
    switch (op.type) {
      case 'node:add':
        n.push({ ...op.node, style: { ...op.node.style } });
        break;
      case 'node:update':
        n = n.map(nd => nd.id === op.nodeId ? { ...nd, ...op.changes, style: op.changes.style ? { ...nd.style, ...op.changes.style } : nd.style } : nd);
        break;
      case 'node:delete':
        n = n.filter(nd => nd.id !== op.nodeId);
        e = e.filter(ed => ed.source !== op.nodeId && ed.target !== op.nodeId);
        break;
      case 'edge:add':
        e.push({ ...op.edge, style: { ...op.edge.style }, points: op.edge.points ? [...op.edge.points] : undefined });
        break;
      case 'edge:update':
        e = e.map(ed => ed.id === op.edgeId ? { ...ed, ...(op.changes as any), style: op.changes.style ? { ...ed.style, ...op.changes.style } : ed.style } : ed);
        break;
      case 'edge:delete':
        e = e.filter(ed => ed.id !== op.edgeId);
        break;
    }
  }
  return { nodes: n, edges: e };
};

export const DiagramService = {
  listByProject(projectId: string, userId: string): Diagram[] | undefined {
    if (!AuthService.canView(userId, projectId)) return undefined;
    return db.diagrams.findMany(d => d.projectId === projectId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map(d => ({ ...d, nodes: [], edges: [] } as Diagram));
  },

  getById(id: string, userId: string): Diagram | undefined {
    const d = db.diagrams.findById(id);
    if (!d) return undefined;
    if (!AuthService.canView(userId, d.projectId)) return undefined;
    return d;
  },

  getPublicById(id: string): Diagram | undefined {
    const d = db.diagrams.findById(id);
    if (!d) return undefined;
    return d;
  },

  create(userId: string, data: { projectId: string; name: string; type: DiagramType; templateId?: string }): Diagram | null {
    if (!AuthService.canEdit(userId, data.projectId)) return null;
    let nodes: DiagramNode[] = [];
    let edges: DiagramEdge[] = [];
    if (data.templateId) {
      const tpl = db.templates.findById(data.templateId);
      if (tpl) {
        nodes = tpl.nodes.map(n => ({ ...n, id: generateId('n'), style: { ...n.style } }));
        const idMap: Record<string, string> = {};
        tpl.nodes.forEach((orig, i) => { idMap[orig.id] = nodes[i].id; });
        edges = tpl.edges.map(e => ({
          ...e, id: generateId('e'),
          source: idMap[e.source] || e.source,
          target: idMap[e.target] || e.target,
          style: { ...e.style },
          points: e.points ? [...e.points] : undefined,
        }));
      }
    }
    const diagram: Diagram = {
      id: generateId('d'),
      projectId: data.projectId,
      name: data.name,
      type: data.type,
      createdAt: now(),
      updatedAt: now(),
      updatedBy: userId,
      viewport: { ...DV },
      nodes,
      edges,
      share: { scope: 'private', allowedMemberIds: [], updatedAt: now(), updatedBy: userId },
    };
    const created = db.diagrams.create(diagram);
    this.createVersion(userId, created.id, { name: '初始版本', message: '自动创建初始版本快照' });
    return created;
  },

  update(id: string, userId: string, changes: Partial<Diagram>): Diagram | undefined {
    const d = db.diagrams.findById(id);
    if (!d) return undefined;
    if (!AuthService.canEdit(userId, d.projectId)) return undefined;
    const hasContentChange = changes.nodes !== undefined || changes.edges !== undefined;
    const updated = db.diagrams.update(id, { ...changes, updatedAt: now(), updatedBy: userId });
    if (hasContentChange && updated) {
      setImmediate(() => this.maybeCreateAutoVersion(userId, id, 'content-update'));
    }
    return updated;
  },

  applyOperations(id: string, userId: string, ops: Operation[]): Diagram | undefined {
    const d = db.diagrams.findById(id);
    if (!d) return undefined;
    if (!AuthService.canEdit(userId, d.projectId)) return undefined;
    const vp = ops.find(o => o.type === 'viewport:update') as Operation & { viewport?: Viewport };
    const otherOps = ops.filter(o => o.type !== 'viewport:update');
    if (otherOps.length === 0 && !vp) return d;
    const { nodes, edges } = applyOps(d.nodes, d.edges, otherOps);
    const hasContentChange = otherOps.length > 0;
    const updated = db.diagrams.update(id, {
      nodes, edges,
      viewport: vp?.viewport ?? d.viewport,
      updatedAt: now(), updatedBy: userId,
    });
    if (hasContentChange && updated) {
      setImmediate(() => this.maybeCreateAutoVersion(userId, id, 'collab-ops'));
    }
    return updated;
  },

  maybeCreateAutoVersion(
    userId: string,
    diagramId: string,
    reason: 'content-update' | 'collab-ops'
  ) {
    try {
      const d = db.diagrams.findById(diagramId);
      if (!d) return;
      const existing = db.versions.findMany(v => v.diagramId === diagramId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const last = existing[0];
      const minIntervalMs = 60 * 1000;
      if (last) {
        const lastAge = Date.now() - new Date(last.createdAt).getTime();
        if (lastAge < minIntervalMs) return;
      }
      const sig = `${d.nodes.length}-${d.edges.length}-${d.nodes.reduce((s, n) => s + (n.x | 0) + (n.y | 0) + n.text.length, 0)}`;
      const lastSig = last?.snapshot ? `${last.snapshot.nodes.length}-${last.snapshot.edges.length}-${last.snapshot.nodes.reduce((s, n) => s + (n.x | 0) + (n.y | 0) + n.text.length, 0)}` : '';
      if (sig === lastSig) return;
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
      DBG.log('dp-05', 'createVersion:auto', {
        userId, diagramId, reason, stamp,
        nodeCount: d.nodes.length, edgeCount: d.edges.length,
      });
      db.versions.create({
        id: generateId('v'),
        diagramId,
        version: (existing[0]?.version ?? 0) + 1,
        name: `自动快照 ${stamp}`,
        message: `由 ${reason} 触发的自动快照`,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        snapshot: {
          nodes: d.nodes.map(n => ({ ...n, style: { ...n.style } })),
          edges: d.edges.map(e => ({ ...e, style: { ...e.style }, points: e.points ? [...e.points] : undefined })),
          viewport: { ...d.viewport },
        },
      });
    } catch (e) {
      console.error('[DiagramService] auto version error:', e);
    }
  },

  delete(id: string, userId: string): boolean {
    const d = db.diagrams.findById(id);
    if (!d) return false;
    const p = db.projects.findById(d.projectId);
    if (!p || (p.ownerId !== userId && AuthService.checkProjectPermission(userId, p.id) !== 'editor')) return false;
    db.versions.findMany(v => v.diagramId === id).forEach(v => db.versions.delete(v.id));
    db.comments.findMany(c => c.diagramId === id).forEach(c => db.comments.delete(c.id));
    return db.diagrams.delete(id);
  },

  createVersion(userId: string, diagramId: string, meta: { name?: string; message?: string } = {}) {
    const d = db.diagrams.findById(diagramId);
    if (!d) return null;
    // #region debug-point dp-05
    DBG.log('dp-05', 'createVersion:backend', {
      userId, diagramId, meta,
      nodeCount: d.nodes.length, edgeCount: d.edges.length,
    });
    // #endregion
    const existing = db.versions.findMany(v => v.diagramId === diagramId);
    const maxV = existing.reduce((m, v) => Math.max(m, v.version), 0);
    return db.versions.create({
      id: generateId('v'),
      diagramId,
      version: maxV + 1,
      name: meta.name,
      message: meta.message,
      createdBy: userId,
      createdAt: now(),
      snapshot: {
        nodes: d.nodes.map(n => ({ ...n, style: { ...n.style } })),
        edges: d.edges.map(e => ({ ...e, style: { ...e.style }, points: e.points ? [...e.points] : undefined })),
        viewport: { ...d.viewport },
      },
    });
  },

  listVersions(diagramId: string, userId: string) {
    const d = db.diagrams.findById(diagramId);
    if (!d || !AuthService.canView(userId, d.projectId)) return undefined;
    return db.versions.findMany(v => v.diagramId === diagramId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  restoreVersion(diagramId: string, userId: string, versionId: string) {
    const d = db.diagrams.findById(diagramId);
    if (!d || !AuthService.canEdit(userId, d.projectId)) return undefined;
    const v = db.versions.findById(versionId);
    if (!v || v.diagramId !== diagramId) return undefined;
    return db.diagrams.update(diagramId, {
      nodes: v.snapshot.nodes.map(n => ({ ...n, style: { ...n.style } })),
      edges: v.snapshot.edges.map(e => ({ ...e, style: { ...e.style }, points: e.points ? [...e.points] : undefined })),
      viewport: { ...v.snapshot.viewport },
      updatedAt: now(), updatedBy: userId,
    });
  },
};
