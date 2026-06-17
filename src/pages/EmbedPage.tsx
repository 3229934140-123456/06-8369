import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { diagramApi } from '../lib/api.js';
import type { Diagram } from '@shared/types.js';
import { NodeShapeRenderer } from '../components/editor/NodeShapeRenderer.jsx';
import { DIAGRAM_TYPE_LABELS } from '@shared/types.js';
import { Loader, Workflow, RefreshCw } from 'lucide-react';

// #region debug-point dp-logger
const DBG_ENABLED = (typeof window !== 'undefined') && window.localStorage.getItem('DEBUG_COLLAB') === '1';
const DBG = DBG_ENABLED ? {
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

export const EmbedPage: React.FC = () => {
  const { diagramId } = useParams<{ diagramId: string }>();
  const [diagram, setDiagram] = useState<Diagram | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [syncedAt, setSyncedAt] = useState<string>('');
  const [isLive, setIsLive] = useState(false);
  const lastHashRef = useRef<string>('');
  const pollTimerRef = useRef<number | null>(null);

  const computeHash = (d: Diagram) => {
    let h = `N${d.nodes.length}|E${d.edges.length}|`;
    for (const n of d.nodes) {
      h += `[${n.id}|${n.type}|${n.x.toFixed(1)},${n.y.toFixed(1)},${n.width},${n.height}|${n.zIndex}|${encodeURIComponent(n.text)}|${n.style.fill}|${n.style.stroke}|${n.style.strokeWidth}|${n.style.borderRadius}|${n.style.fontSize}|${n.style.fontColor}|${n.style.fontFamily}|${n.style.opacity}]`;
    }
    h += '||';
    for (const e of d.edges) {
      h += `[${e.id}|${e.source}->${e.target}|${e.sourcePort ?? ''}|${e.targetPort ?? ''}|${encodeURIComponent(e.label ?? '')}|${e.style.stroke}|${e.style.strokeWidth}|${e.style.dashed ? 1 : 0}|${e.style.arrowStart ? 1 : 0}|${e.style.arrowEnd ? 1 : 0}|${e.style.curve}|${(e.points ?? []).map(p => p.x.toFixed(0) + ',' + p.y.toFixed(0)).join(';')}]`;
    }
    return h;
  };

  const load = async (silent = false) => {
    if (!diagramId) return;
    // #region debug-point dp-06
    DBG.log('dp-06', 'embed-load', { diagramId, polling: !!pollTimerRef.current, silent });
    // #endregion
    if (!silent) { setLoading(true); }
    setError('');
    try {
      const d = await diagramApi.getPublicEmbed(diagramId);
      const hash = computeHash(d);
      if (lastHashRef.current !== hash) {
        lastHashRef.current = hash;
        setDiagram(d);
        // #region debug-point dp-06
        DBG.log('dp-06', 'embed-content-changed', { diagramId, newHash: hash.slice(0, 60) });
        // #endregion
      }
      setSyncedAt(new Date().toLocaleTimeString('zh-CN'));
      setIsLive(true);
    } catch (e: any) {
      setError(e.message ?? '加载失败');
      setIsLive(false);
    } finally { if (!silent) setLoading(false); }
  };

  useEffect(() => {
    lastHashRef.current = '';
    load(false);
    const id = window.setInterval(() => load(true), 2000);
    pollTimerRef.current = id;
    return () => {
      if (pollTimerRef.current) window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    };
  }, [diagramId]);

  if (loading) return (
    <div className="h-full w-full flex items-center justify-center bg-white">
      <Loader className="animate-spin text-electric-500" size={32} />
    </div>
  );

  if (error || !diagram) return (
    <div className="h-full w-full flex items-center justify-center bg-graphite-50 p-8">
      <div className="text-center">
        <div className="text-danger-500 font-semibold mb-2">无法加载图表</div>
        <p className="text-sm text-graphite-500 mb-4">{error}</p>
        <Link to="/login" className="btn-primary">登录查看</Link>
      </div>
    </div>
  );

  const nodes = diagram.nodes;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  nodes.forEach(n => {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + n.width);
    maxY = Math.max(maxY, n.y + n.height);
  });
  if (nodes.length === 0) { minX = 0; minY = 0; maxX = 800; maxY = 600; }
  const pad = 60;
  const contentW = maxX - minX + pad * 2;
  const contentH = maxY - minY + pad * 2;
  const offsetX = -minX + pad;
  const offsetY = -minY + pad;

  return (
    <div className="h-full w-full flex flex-col bg-white">
      <div className="shrink-0 flex items-center justify-between px-4 py-2 bg-graphite-50 border-b border-graphite-100">
        <div className="flex items-center gap-2">
          <Workflow size={15} className="text-electric-500" />
          <span className="text-sm font-semibold text-graphite-700 truncate">{diagram.name}</span>
          <span className="text-[10px] text-graphite-400 px-2 py-0.5 rounded-full bg-graphite-100">
            {DIAGRAM_TYPE_LABELS[diagram.type]}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[10px] text-success-600 bg-success-500/10 px-2 py-0.5 rounded-full">
            <span className={`w-1.5 h-1.5 rounded-full bg-success-500${isLive ? ' animate-pulse' : ''}`} />
            {isLive ? '实时同步中' : '同步中断'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-graphite-400">
            {syncedAt ? `同步于 ${syncedAt}` : '加载中...'}
          </span>
          <button onClick={() => load(false)} className="p-1.5 rounded-md hover:bg-graphite-100 text-graphite-500" title="手动刷新">
            <RefreshCw size={14} />
          </button>
          <Link to="/login" className="text-[11px] text-electric-500 hover:underline font-semibold">在 FlowSync 打开</Link>
        </div>
      </div>
      <div className="flex-1 overflow-auto canvas-grid">
        <div className="p-8 flex items-center justify-center min-h-full">
          <svg
            width={contentW}
            height={contentH}
            viewBox={`0 0 ${contentW} ${contentH}`}
            className="rounded-2xl shadow-lg bg-white"
          >
            <g transform={`translate(${offsetX}, ${offsetY})`}>
              {diagram.edges.map((e, i) => {
                const src = nodes.find(n => n.id === e.source);
                const tgt = nodes.find(n => n.id === e.target);
                if (!src || !tgt) return null;
                const getP = (n: any, port: string) => {
                  if (port === 'top') return { x: n.x + n.width / 2, y: n.y };
                  if (port === 'bottom') return { x: n.x + n.width / 2, y: n.y + n.height };
                  if (port === 'left') return { x: n.x, y: n.y + n.height / 2 };
                  return { x: n.x + n.width, y: n.y + n.height / 2 };
                };
                const autoPorts = (() => {
                  const ports = ['right', 'bottom', 'left', 'top'] as const;
                  let best: any = null;
                  for (const sp of ports) for (const tp of ports) {
                    const p1 = getP(src, sp), p2 = getP(tgt, tp);
                    const d = Math.hypot(p1.x - p2.x, p1.y - p2.y);
                    if (!best || d < best.d) best = { d, sp, tp };
                  }
                  return best;
                })();
                const sp = e.sourcePort ?? autoPorts.sp;
                const tp = e.targetPort ?? autoPorts.tp;
                const p1 = getP(src, sp), p2 = getP(tgt, tp);
                const dx = p2.x - p1.x, dy = p2.y - p1.y;
                const d = Math.hypot(dx, dy);
                const cs = Math.min(d * 0.4, 120);
                const off = (p: string, s: number): [number, number] =>
                  ({ right: [s, 0], left: [-s, 0], top: [0, -s], bottom: [0, s] } as any)[p];
                const c1 = off(sp, cs), c2 = off(tp, cs);
                const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
                return (
                  <g key={e.id}>
                    <defs>
                      <marker id={`em-${i}-a`} viewBox="0 0 10 10" refX="8" refY="5"
                        markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill={e.style.stroke} />
                      </marker>
                    </defs>
                    <path d={`M ${p1.x} ${p1.y} C ${p1.x + c1[0]} ${p1.y + c1[1]}, ${p2.x + c2[0]} ${p2.y + c2[1]}, ${p2.x} ${p2.y}`}
                      fill="none" stroke={e.style.stroke} strokeWidth={e.style.strokeWidth}
                      strokeDasharray={e.style.dashed ? '8 5' : undefined}
                      markerEnd={e.style.arrowEnd ? `url(#em-${i}-a)` : undefined} />
                    {e.label && (
                      <g>
                        <rect x={mid.x - (e.label.length * 7) / 2 - 6} y={mid.y - 10}
                          width={e.label.length * 7 + 12} height={20} rx={4}
                          fill="white" stroke={e.style.stroke} strokeWidth={1} opacity={0.95} />
                        <text x={mid.x} y={mid.y + 4} textAnchor="middle"
                          fontFamily="Inter" fontSize={12} fill={e.style.stroke}>
                          {e.label}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
              {nodes.map(n => (
                <NodeShapeRenderer key={n.id} node={n} selected={false} />
              ))}
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default EmbedPage;
