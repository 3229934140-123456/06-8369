import React, { useState } from 'react';
import {
  Undo2, Redo2, ZoomIn, ZoomOut, Maximize2, Grid3X3, Download,
  Users, History, MessageSquare, Share2, Save, Settings, Home, FileText
} from 'lucide-react';
import { useDiagramStore } from '../../store/useDiagramStore.js';
import { useUserStore } from '../../store/useUserStore.js';
import { cn } from '../../lib/utils.js';
import { exportSvg, exportPng, exportPdf, getEmbedCode } from '../../lib/export.js';
import type { RightPanelTab } from './RightPanel.js';

interface Props {
  rightTab: RightPanelTab;
  onRightTabChange: (t: RightPanelTab) => void;
  onGoBack: () => void;
  onGoHome: () => void;
}

export const EditorToolbar: React.FC<Props> = ({ rightTab, onRightTabChange, onGoBack, onGoHome }) => {
  const diagram = useDiagramStore(s => s.diagram);
  const saving = useDiagramStore(s => s.saving);
  const undo = useDiagramStore(s => s.undo);
  const redo = useDiagramStore(s => s.redo);
  const updateViewport = useDiagramStore(s => s.updateViewport);
  const save = useDiagramStore(s => s.save);
  const history = useDiagramStore(s => s.history);
  const peers = useDiagramStore(s => s.peers);
  const rename = useDiagramStore(s => s.rename);
  const user = useUserStore(s => s.user);

  const [showExport, setShowExport] = useState(false);
  const [zoom, setZoom] = useState(diagram?.viewport.zoom ?? 1);

  React.useEffect(() => {
    setZoom(diagram?.viewport.zoom ?? 1);
  }, [diagram?.viewport.zoom]);

  const doZoom = (factor: number) => {
    if (!diagram) return;
    const newZoom = Math.max(0.25, Math.min(3, diagram.viewport.zoom * factor));
    const rect = document.querySelector('[data-editor-canvas-wrap]')?.getBoundingClientRect();
    const mx = rect ? rect.width / 2 : 400;
    const my = rect ? rect.height / 2 : 300;
    const ratio = newZoom / diagram.viewport.zoom;
    updateViewport({
      x: mx - (mx - diagram.viewport.x) * ratio,
      y: my - (my - diagram.viewport.y) * ratio,
      zoom: newZoom,
    });
  };

  const fitView = () => {
    if (!diagram || diagram.nodes.length === 0) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    diagram.nodes.forEach(n => {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + n.width);
      maxY = Math.max(maxY, n.y + n.height);
    });
    const rect = document.querySelector('[data-editor-canvas-wrap]')?.getBoundingClientRect();
    const w = rect?.width ?? 1000;
    const h = rect?.height ?? 700;
    const pad = 80;
    const contentW = maxX - minX + pad * 2;
    const contentH = maxY - minY + pad * 2;
    const z = Math.min(w / contentW, h / contentH, 1.2);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    updateViewport({
      x: w / 2 - cx * z,
      y: h / 2 - cy * z,
      zoom: z,
    });
  };

  return (
    <div className="glass-toolbar relative z-50 h-14 px-3 flex items-center gap-2 border-b border-graphite-200">
      <div className="flex items-center gap-1 pr-3 border-r border-graphite-200">
        <button onClick={onGoHome} className="btn-ghost btn !p-2" title="返回工作台">
          <Home size={18} />
        </button>
        <button onClick={onGoBack} className="btn-ghost btn !p-2" title="返回项目">
          <FileText size={18} />
        </button>
        <div className="w-px h-5 bg-graphite-200 mx-1" />
        <input
          defaultValue={diagram?.name ?? ''}
          onBlur={(e) => rename(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          className="bg-transparent px-2 py-1 rounded-md border border-transparent hover:border-graphite-200 focus:border-electric-500 focus:bg-white outline-none font-display font-semibold text-graphite-900 text-sm max-w-[260px]"
        />
        <span className={cn(
          'badge',
          saving ? 'badge-warning animate-pulse' : 'badge-success'
        )}>
          {saving ? '保存中...' : '已保存'}
        </span>
      </div>

      <div className="flex items-center gap-0.5">
        <button onClick={undo} disabled={history.past.length === 0}
          className="btn-ghost btn !p-2 disabled:opacity-40 disabled:cursor-not-allowed" title="撤销 (Ctrl+Z)">
          <Undo2 size={18} />
        </button>
        <button onClick={redo} disabled={history.future.length === 0}
          className="btn-ghost btn !p-2 disabled:opacity-40 disabled:cursor-not-allowed" title="重做 (Ctrl+Y)">
          <Redo2 size={18} />
        </button>
        <div className="w-px h-5 bg-graphite-200 mx-2" />
        <button onClick={() => doZoom(0.8)} className="btn-ghost btn !p-2" title="缩小">
          <ZoomOut size={18} />
        </button>
        <span className="text-xs text-graphite-600 font-mono w-14 text-center tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
        <button onClick={() => doZoom(1.25)} className="btn-ghost btn !p-2" title="放大">
          <ZoomIn size={18} />
        </button>
        <button onClick={fitView} className="btn-ghost btn !p-2" title="适配视图">
          <Maximize2 size={18} />
        </button>
        <div className="w-px h-5 bg-graphite-200 mx-2" />
        <button className="btn-ghost btn !p-2" title="网格/对齐">
          <Grid3X3 size={18} />
        </button>
        <button onClick={save} className="btn-ghost btn !p-2" title="立即保存">
          <Save size={18} />
        </button>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-0.5 pr-3 border-r border-graphite-200">
        {(['properties', 'versions', 'comments'] as const).map(tab => {
          const Icon = { properties: Settings, versions: History, comments: MessageSquare }[tab];
          const label = { properties: '属性', versions: '版本', comments: '讨论' }[tab];
          const count = tab === 'comments' ? useDiagramStore.getState().comments.length : 0;
          return (
            <button
              key={tab}
              onClick={() => onRightTabChange(tab)}
              className={cn(
                'btn !p-2 relative',
                rightTab === tab ? 'bg-electric-50 text-electric-600' : 'btn-ghost'
              )}
              title={label}
            >
              <Icon size={18} />
              {count > 0 && tab === 'comments' && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 pl-1">
        <div className="flex items-center -space-x-2">
          {[user, ...Array.from(peers.values()).map(p => p.user)].filter(Boolean).slice(0, 4).map((u, i) => (
            <div
              key={u!.id}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold border-2 border-white shadow-sm"
              style={{ backgroundColor: u!.color }}
              title={`${u!.name}${i === 0 ? '（你）' : ''}`}
            >
              {u!.avatar}
            </div>
          ))}
          {peers.size + 1 > 4 && (
            <div className="w-8 h-8 rounded-full bg-graphite-200 flex items-center justify-center text-graphite-600 text-xs font-semibold border-2 border-white">
              +{peers.size + 1 - 4}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowExport(v => !v)}
            className="btn-primary btn !py-1.5 !px-3 text-xs"
          >
            <Download size={15} />
            导出/分享
          </button>
          {showExport && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-glass border border-graphite-200 py-2 z-50 animate-fade-in">
              {[
                { label: '导出 SVG 矢量图', fn: () => exportSvg(), icon: '📐' },
                { label: '导出 PNG 图片', fn: () => exportPng(), icon: '🖼️' },
                { label: '导出 PDF 文档', fn: () => exportPdf(), icon: '📄' },
              ].map(({ label, fn, icon }) => (
                <button
                  key={label}
                  onClick={() => { fn(); setShowExport(false); }}
                  className="w-full px-4 py-2 text-left text-sm text-graphite-700 hover:bg-graphite-50 flex items-center gap-3"
                >
                  <span>{icon}</span>{label}
                </button>
              ))}
              <div className="my-1 border-t border-graphite-100" />
              <button
                onClick={() => { getEmbedCode(); setShowExport(false); }}
                className="w-full px-4 py-2 text-left text-sm text-graphite-700 hover:bg-graphite-50 flex items-center gap-3"
              >
                <Share2 size={16} className="text-electric-500" />获取嵌入代码
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
