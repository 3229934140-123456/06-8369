import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Lock, LogIn, ArrowLeft, RefreshCw, Workflow, Edit3, Eye } from 'lucide-react';
import { useUserStore } from '../store/useUserStore.js';
import { diagramApi } from '../lib/api.js';
import type { Diagram, DiagramType, DiagramNode, DiagramEdge } from '@shared/types.js';
import { DIAGRAM_TYPE_LABELS } from '@shared/types.js';
import { NodeShapeRenderer } from '../components/editor/NodeShapeRenderer.js';
import { EdgeRenderer } from '../components/editor/EdgeRenderer.js';

export const SharePage: React.FC = () => {
  const { diagramId } = useParams<{ diagramId: string }>();
  const navigate = useNavigate();
  const [diagram, setDiagram] = useState<Diagram | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errorKind, setErrorKind] = useState<'denied' | 'login_required' | 'not_found'>('not_found');
  const [syncedAt, setSyncedAt] = useState<string>('');
  const [isLive, setIsLive] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const lastHashRef = useRef<string>('');
  const pollTimerRef = useRef<number | null>(null);

  const currentUser = useUserStore(s => s.user);

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
    if (!silent) { setLoading(true); }
    setError('');
    try {
      let d: Diagram | null = null;
      let triedEdit = false;
      try {
        d = await diagramApi.getPublicEmbed(diagramId);
      } catch {
        d = null;
      }
      if (!d && currentUser) {
        try {
          d = await diagramApi.get(diagramId);
          triedEdit = true;
        } catch (e: any) {
          if (e.status === 403) { setErrorKind('denied'); }
          d = null;
        }
      }
      if (!d) {
        if (!currentUser) setErrorKind('login_required');
        else setErrorKind('denied');
        throw new Error('无权访问或图表不存在');
      }
      setCanEdit(triedEdit);
      const hash = computeHash(d);
      if (lastHashRef.current !== hash) {
        lastHashRef.current = hash;
        setDiagram(d);
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
  }, [diagramId, currentUser?.id]);

  if (error && !diagram) {
    return (
      <div className="w-screen h-screen bg-graphite-50 flex flex-col">
        <div className="shrink-0 flex items-center justify-between px-5 py-3 bg-white border-b border-graphite-100">
          <Link to="/login" className="flex items-center gap-2">
            <Workflow size={18} className="text-electric-500" />
            <span className="font-display font-bold text-lg text-graphite-800">FlowSync</span>
          </Link>
          <Link to="/login" className="text-[12px] text-electric-500 hover:underline font-semibold">
            返回登录
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-sm w-full bg-white rounded-2xl shadow-soft border border-graphite-100 p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-danger-500/10 mx-auto mb-4 flex items-center justify-center">
              <Lock size={28} className="text-danger-500" />
            </div>
            <h2 className="font-display font-bold text-xl text-graphite-800 mb-2">
              {errorKind === 'login_required' ? '请先登录' : '访问受限'}
            </h2>
            <p className="text-sm text-graphite-500 leading-relaxed mb-6">
              {errorKind === 'login_required'
                ? '这个图表可能需要登录才能查看，请先使用 FlowSync 账号登录。'
                : '你没有访问这个图表的权限。请向图表所有者请求分享权限或登录正确的账号。'}
            </p>
            <div className="space-y-2">
              <Link to="/login" className="btn btn-primary w-full !py-2.5 text-sm flex items-center justify-center gap-2">
                {errorKind === 'login_required' ? <LogIn size={16} /> : <LogIn size={16} />}
                {errorKind === 'login_required' ? '登录 FlowSync' : '切换账号登录'}
              </Link>
              <button onClick={() => { navigate(-1); }} className="btn btn-ghost w-full !py-2 text-sm flex items-center justify-center gap-2">
                <ArrowLeft size={14} /> 返回上一页
              </button>
            </div>
            <div className="mt-6 pt-5 border-t border-graphite-100 text-[11px] text-graphite-400 leading-relaxed">
              图表 ID：<code className="font-mono text-graphite-600">{diagramId}</code>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !diagram) {
    return (
      <div className="w-screen h-screen bg-graphite-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Workflow size={36} className="text-electric-500 animate-pulse" />
          <div className="text-sm text-graphite-500">正在加载图表…</div>
        </div>
      </div>
    );
  }

  if (!diagram) return null;
  const nodes = diagram.nodes;
  const edges = diagram.edges;
  const vpTransform = `translate(${diagram.viewport.x} ${diagram.viewport.y}) scale(${diagram.viewport.zoom})`;
  const minX = Math.min(...nodes.map(n => n.x), 0);
  const minY = Math.min(...nodes.map(n => n.y), 0);
  const maxX = Math.max(...nodes.map(n => n.x + n.width), 1000);
  const maxY = Math.max(...nodes.map(n => n.y + n.height), 700);
  const padding = 80;

  return (
    <div className="w-screen h-screen bg-graphite-50 flex flex-col overflow-hidden">
      <div className="shrink-0 flex items-center justify-between px-5 py-2.5 bg-white border-b border-graphite-100">
        <div className="flex items-center gap-3">
          <Link to="/login" className="flex items-center gap-2">
            <Workflow size={16} className="text-electric-500" />
            <span className="font-display font-bold text-sm text-graphite-800">FlowSync</span>
          </Link>
          <span className="text-graphite-200">|</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-graphite-700 truncate">{diagram.name}</span>
            <span className="text-[10px] text-graphite-400 px-2 py-0.5 rounded-full bg-graphite-100">
              {DIAGRAM_TYPE_LABELS[diagram.type as DiagramType]}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] text-success-600 bg-success-500/10 px-2 py-0.5 rounded-full">
              <span className={`w-1.5 h-1.5 rounded-full bg-success-500${isLive ? ' animate-pulse' : ''}`} />
              {isLive ? '实时同步' : '已断开'}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-graphite-500 bg-graphite-100 px-2 py-0.5 rounded-full">
              {canEdit ? <Edit3 size={11} /> : <Eye size={11} />}
              {canEdit ? '可编辑' : '只读'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-graphite-400">
            同步于 {syncedAt}
          </span>
          <button onClick={() => load(false)} className="p-1.5 rounded-md hover:bg-graphite-100 text-graphite-500" title="手动刷新">
            <RefreshCw size={14} />
          </button>
          {canEdit && (
            <Link to={`/editor/${diagram.id}`} className="btn btn-primary !py-1.5 !px-3 text-xs">
              <Edit3 size={13} /> 在编辑器中打开
            </Link>
          )}
          {!currentUser && (
            <Link to="/login" className="btn btn-ghost !py-1.5 !px-3 text-xs font-semibold text-electric-500">
              登录
            </Link>
          )}
        </div>
      </div>

      <div className="flex-1 relative overflow-auto">
        <svg
          width={maxX - minX + padding * 2}
          height={maxY - minY + padding * 2}
          viewBox={`${minX - padding} ${minY - padding} ${maxX - minX + padding * 2} ${maxY - minY + padding * 2}`}
          style={{ display: 'block', margin: '0 auto', background: '#fafbfc' }}
        >
          <defs>
            <pattern id="sp-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#eef0f4" strokeWidth="0.5" />
            </pattern>
            <marker id="sp-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="#374151" />
            </marker>
          </defs>
          <rect x={minX - padding} y={minY - padding} width={maxX - minX + padding * 2} height={maxY - minY + padding * 2} fill="url(#sp-grid)" />
          <g transform={vpTransform}>
            {edges.map(edge => (
              <EdgeRenderer
                key={edge.id}
                edge={edge as DiagramEdge}
                nodes={nodes as DiagramNode[]}
                selected={false}
              />
            ))}
            {[...nodes].sort((a, b) => a.zIndex - b.zIndex).map(node => (
              <NodeShapeRenderer
                key={node.id}
                node={node as DiagramNode}
                selected={false}
              />
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
};
