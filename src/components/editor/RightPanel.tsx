import React, { useState } from 'react';
import { useDiagramStore } from '../../store/useDiagramStore.js';
import { useUserStore } from '../../store/useUserStore.js';
import type { DiagramNode, DiagramEdge } from '@shared/types.js';
import { Palette, Type, Square, Send, CheckCircle2, MessageCircle, RotateCcw, Plus, Clock, User } from 'lucide-react';
import { cn } from '../../lib/utils.js';
import { authApi } from '../../lib/api.js';

export type RightPanelTab = 'properties' | 'versions' | 'comments';

interface Props {
  tab: RightPanelTab;
}

export const RightPanel: React.FC<Props> = ({ tab }) => {
  return (
    <div className="w-80 h-full border-l border-graphite-200 bg-white flex flex-col overflow-hidden">
      {tab === 'properties' && <PropertiesPanel />}
      {tab === 'versions' && <VersionsPanel />}
      {tab === 'comments' && <CommentsPanel />}
    </div>
  );
};

const PropertiesPanel: React.FC = () => {
  const diagram = useDiagramStore(s => s.diagram);
  const selectedIds = useDiagramStore(s => s.selectedNodeIds);
  const selectedEdgeId = useDiagramStore(s => s.selectedEdgeId);
  const updateNode = useDiagramStore(s => s.updateNode);
  const updateEdge = useDiagramStore(s => s.updateEdge);

  const node = selectedIds.length === 1 ? diagram?.nodes.find(n => n.id === selectedIds[0]) : undefined;
  const edge = diagram?.edges.find(e => e.id === selectedEdgeId);

  const style = node?.style;

  return (
    <div className="flex-1 overflow-y-auto thin-scrollbar">
      <div className="px-4 py-3 border-b border-graphite-100 flex items-center gap-2">
        <Palette size={16} className="text-electric-500" />
        <h3 className="font-display font-semibold text-sm text-graphite-800">属性设置</h3>
      </div>

      {!node && !edge && (
        <div className="p-6 text-center text-sm text-graphite-400">
          <Square size={32} className="mx-auto mb-3 opacity-40" />
          选择一个节点或连线来编辑属性
        </div>
      )}

      {node && (
        <div className="p-4 space-y-5 text-sm">
          <div>
            <label className="text-xs font-medium text-graphite-600 mb-1.5 block">节点文本</label>
            <textarea
              value={node.text}
              onChange={(e) => updateNode(node.id, { text: e.target.value })}
              rows={3}
              className="input font-mono text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-graphite-600 mb-1.5 block">X 坐标</label>
              <input type="number" value={Math.round(node.x)}
                onChange={(e) => updateNode(node.id, { x: Number(e.target.value) })}
                className="input font-mono text-xs py-1.5" />
            </div>
            <div>
              <label className="text-xs font-medium text-graphite-600 mb-1.5 block">Y 坐标</label>
              <input type="number" value={Math.round(node.y)}
                onChange={(e) => updateNode(node.id, { y: Number(e.target.value) })}
                className="input font-mono text-xs py-1.5" />
            </div>
            <div>
              <label className="text-xs font-medium text-graphite-600 mb-1.5 block">宽度</label>
              <input type="number" value={node.width}
                onChange={(e) => updateNode(node.id, { width: Number(e.target.value) })}
                className="input font-mono text-xs py-1.5" />
            </div>
            <div>
              <label className="text-xs font-medium text-graphite-600 mb-1.5 block">高度</label>
              <input type="number" value={node.height}
                onChange={(e) => updateNode(node.id, { height: Number(e.target.value) })}
                className="input font-mono text-xs py-1.5" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-graphite-600 mb-2 block flex items-center gap-1.5">
              <Palette size={13} /> 外观样式
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-graphite-500">填充颜色</span>
                <div className="flex items-center gap-2 mt-1">
                  <input type="color" value={style!.fill}
                    onChange={(e) => updateNode(node.id, { style: { fill: e.target.value } })}
                    className="w-8 h-8 rounded border border-graphite-200 cursor-pointer" />
                  <input value={style!.fill}
                    onChange={(e) => updateNode(node.id, { style: { fill: e.target.value } })}
                    className="input font-mono text-xs py-1 flex-1" />
                </div>
              </div>
              <div>
                <span className="text-[11px] text-graphite-500">边框颜色</span>
                <div className="flex items-center gap-2 mt-1">
                  <input type="color" value={style!.stroke}
                    onChange={(e) => updateNode(node.id, { style: { stroke: e.target.value } })}
                    className="w-8 h-8 rounded border border-graphite-200 cursor-pointer" />
                  <input value={style!.stroke}
                    onChange={(e) => updateNode(node.id, { style: { stroke: e.target.value } })}
                    className="input font-mono text-xs py-1 flex-1" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div>
                <span className="text-[11px] text-graphite-500">边框宽度</span>
                <input type="number" min={0} max={10} step={0.5} value={style!.strokeWidth}
                  onChange={(e) => updateNode(node.id, { style: { strokeWidth: Number(e.target.value) } })}
                  className="input font-mono text-xs py-1.5 mt-1" />
              </div>
              <div>
                <span className="text-[11px] text-graphite-500">圆角</span>
                <input type="number" min={0} value={style!.borderRadius}
                  onChange={(e) => updateNode(node.id, { style: { borderRadius: Number(e.target.value) } })}
                  className="input font-mono text-xs py-1.5 mt-1" />
              </div>
              <div>
                <span className="text-[11px] text-graphite-500">字号</span>
                <input type="number" min={8} max={48} value={style!.fontSize}
                  onChange={(e) => updateNode(node.id, { style: { fontSize: Number(e.target.value) } })}
                  className="input font-mono text-xs py-1.5 mt-1" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-[11px] text-graphite-500">文字颜色</span>
              <div className="flex items-center gap-2 mt-1">
                <input type="color" value={style!.fontColor}
                  onChange={(e) => updateNode(node.id, { style: { fontColor: e.target.value } })}
                  className="w-8 h-8 rounded border border-graphite-200 cursor-pointer" />
                <input value={style!.fontColor}
                  onChange={(e) => updateNode(node.id, { style: { fontColor: e.target.value } })}
                  className="input font-mono text-xs py-1 flex-1" />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-graphite-100">
            <div className="grid grid-cols-4 gap-2">
              {[
                { c: '#FFFFFF', l: '白' },
                { c: '#EFF6FF', l: '蓝' },
                { c: '#DCFCE7', l: '绿' },
                { c: '#FEF3C7', l: '黄' },
                { c: '#FEE2E2', l: '红' },
                { c: '#FDF2F8', l: '粉' },
                { c: '#F0FDFA', l: '青' },
                { c: '#F8FAFC', l: '灰' },
              ].map(c => (
                <button key={c.c}
                  onClick={() => updateNode(node.id, { style: { fill: c.c } })}
                  className={cn(
                    'h-8 rounded-md border transition-all',
                    style!.fill === c.c ? 'border-electric-500 ring-2 ring-electric-200' : 'border-graphite-200 hover:border-graphite-300'
                  )}
                  style={{ backgroundColor: c.c }}
                  title={c.l}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {edge && !node && (
        <div className="p-4 space-y-5 text-sm">
          <div>
            <label className="text-xs font-medium text-graphite-600 mb-1.5 block">连线标签</label>
            <input
              value={edge.label ?? ''}
              onChange={(e) => updateEdge(edge.id, { label: e.target.value })}
              className="input font-mono text-xs"
              placeholder="添加标签..."
            />
          </div>

          <div>
            <label className="text-xs font-medium text-graphite-600 mb-2 block">连线样式</label>
            <div className="space-y-3">
              <div>
                <span className="text-[11px] text-graphite-500">线条颜色</span>
                <div className="flex items-center gap-2 mt-1">
                  <input type="color" value={edge.style.stroke}
                    onChange={(e) => updateEdge(edge.id, { style: { stroke: e.target.value } })}
                    className="w-8 h-8 rounded border border-graphite-200 cursor-pointer" />
                  <input value={edge.style.stroke}
                    onChange={(e) => updateEdge(edge.id, { style: { stroke: e.target.value } })}
                    className="input font-mono text-xs py-1 flex-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-graphite-500">粗细</span>
                  <input type="number" min={1} max={10} step={0.5} value={edge.style.strokeWidth}
                    onChange={(e) => updateEdge(edge.id, { style: { strokeWidth: Number(e.target.value) } })}
                    className="input font-mono text-xs py-1.5 mt-1" />
                </div>
                <div>
                  <span className="text-[11px] text-graphite-500">弯曲</span>
                  <select value={edge.style.curve}
                    onChange={(e) => updateEdge(edge.id, { style: { curve: e.target.value as any } })}
                    className="input text-xs py-1.5 mt-1">
                    <option value="bezier">贝塞尔</option>
                    <option value="straight">直线</option>
                    <option value="orthogonal">正交</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-xs text-graphite-600 cursor-pointer">
                  <input type="checkbox" checked={edge.style.dashed}
                    onChange={(e) => updateEdge(edge.id, { style: { dashed: e.target.checked } })} />
                  虚线
                </label>
                <label className="flex items-center gap-2 text-xs text-graphite-600 cursor-pointer">
                  <input type="checkbox" checked={edge.style.arrowEnd}
                    onChange={(e) => updateEdge(edge.id, { style: { arrowEnd: e.target.checked } })} />
                  末端箭头
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const VersionsPanel: React.FC = () => {
  const versions = useDiagramStore(s => s.versions);
  const restore = useDiagramStore(s => s.restoreVersion);
  const createVersion = useDiagramStore(s => s.createVersion);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const currentUser = useUserStore(s => s.user);
  const allUsers = React.useMemo(() => authApi.listUsers().catch(() => [] as any[]), []);
  const [users, setUsers] = useState<any[]>([]);

  React.useEffect(() => { allUsers.then(setUsers); }, [allUsers]);

  const getAuthor = (id: string) => users.find(u => u.id === id)?.name ?? '协作者';
  const getColor = (id: string) => users.find(u => u.id === id)?.color ?? '#3B82F6';

  return (
    <div className="flex-1 overflow-y-auto thin-scrollbar flex flex-col">
      <div className="px-4 py-3 border-b border-graphite-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RotateCcw size={16} className="text-electric-500" />
          <h3 className="font-display font-semibold text-sm text-graphite-800">版本历史</h3>
        </div>
        <button onClick={async () => { setCreating(true); await createVersion({ name: name || undefined }); setName(''); setCreating(false); }}
          className="text-xs btn-primary btn !py-1 !px-2.5">
          <Plus size={14} /> 保存快照
        </button>
      </div>

      <div className="px-4 py-3 border-b border-graphite-100">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="输入版本名保存当前..."
          className="input text-xs py-1.5"
          disabled={creating}
        />
      </div>

      <div className="flex-1 relative version-timeline py-3 px-4 space-y-4">
        {versions.length === 0 && (
          <div className="text-center py-12 text-sm text-graphite-400">
            <Clock size={28} className="mx-auto mb-2 opacity-40" />
            暂无版本历史
          </div>
        )}
        {versions.map((v, i) => (
          <div key={v.id} className="flex gap-3 pl-2 animate-slide-in" style={{ animationDelay: `${i * 30}ms` }}>
            <div className={cn('version-dot shrink-0 mt-0.5', i === 0 ? 'version-dot-current' : 'border-graphite-300 text-graphite-400')}>
              <Clock size={11} />
            </div>
            <div className="flex-1 min-w-0 card p-3 hover:border-electric-300 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-graphite-800 truncate">
                    {v.name ?? `版本 v${v.version}`}
                  </div>
                  {v.message && (
                    <div className="text-xs text-graphite-500 mt-0.5 line-clamp-2">{v.message}</div>
                  )}
                </div>
                {i !== 0 && (
                  <button
                    onClick={() => restore(v.id)}
                    className="text-[11px] btn-secondary btn !py-1 !px-2 shrink-0"
                  >
                    回滚
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1.5 text-[11px] text-graphite-500">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: getColor(v.createdBy), fontSize: 8 }}>
                    {getAuthor(v.createdBy).slice(0, 1)}
                  </div>
                  {getAuthor(v.createdBy)}
                </div>
                <span className="text-[11px] text-graphite-400">
                  {new Date(v.createdAt).toLocaleString('zh-CN', {
                    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
                {i === 0 && <span className="badge badge-success">当前版本</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CommentsPanel: React.FC = () => {
  const comments = useDiagramStore(s => s.comments);
  const diagram = useDiagramStore(s => s.diagram);
  const selectedNodeIds = useDiagramStore(s => s.selectedNodeIds);
  const addComment = useDiagramStore(s => s.addComment);
  const addReply = useDiagramStore(s => s.addReply);
  const resolveComment = useDiagramStore(s => s.resolveComment);
  const currentUser = useUserStore(s => s.user);
  const [text, setText] = useState('');
  const [replyMap, setReplyMap] = useState<Record<string, string>>({});
  const allUsers = React.useMemo(() => authApi.listUsers().catch(() => [] as any[]), []);
  const [users, setUsers] = useState<any[]>([]);

  React.useEffect(() => { allUsers.then(setUsers); }, [allUsers]);

  const userMap = Object.fromEntries(users.map(u => [u.id, u]));
  const getU = (id: string) => userMap[id] ?? { name: '协作者', color: '#3B82F6', avatar: 'C' };

  const submit = async () => {
    if (!text.trim()) return;
    await addComment({
      nodeId: selectedNodeIds.length === 1 ? selectedNodeIds[0] : undefined,
      content: text.trim(),
    });
    setText('');
  };

  const submitReply = async (cid: string) => {
    const t = replyMap[cid];
    if (!t?.trim()) return;
    await addReply(cid, t.trim());
    setReplyMap(m => ({ ...m, [cid]: '' }));
  };

  const targetNodeName = (nid?: string) => {
    if (!nid || !diagram) return;
    const n = diagram.nodes.find(n => n.id === nid);
    return n?.text?.split('\n')[0] ?? '未知节点';
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-graphite-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle size={16} className="text-electric-500" />
          <h3 className="font-display font-semibold text-sm text-graphite-800">团队讨论</h3>
          <span className="badge badge-warning">{comments.length}</span>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-graphite-100 space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder={
            selectedNodeIds.length === 1
              ? `评论节点「${targetNodeName(selectedNodeIds[0]) ?? ''}」...`
              : '添加全局评论或选择节点...'
          }
          className="input resize-none text-xs py-2"
          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit(); }}
        />
        <div className="flex justify-between items-center">
          <span className="text-[11px] text-graphite-400">Ctrl + Enter 发送</span>
          <button onClick={submit} disabled={!text.trim()} className="btn-primary btn !py-1 !px-3 text-xs">
            <Send size={13} /> 发送
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto thin-scrollbar p-4 space-y-4">
        {comments.length === 0 && (
          <div className="text-center py-16 text-sm text-graphite-400">
            <MessageCircle size={32} className="mx-auto mb-2 opacity-40" />
            还没有讨论，开始第一条评论吧
          </div>
        )}
        {comments.map(c => {
          const a = getU(c.authorId);
          const isMine = a.id === currentUser?.id;
          return (
            <div key={c.id} className={cn('space-y-2', c.resolved && 'opacity-60')}>
              {c.nodeId && (
                <div className="flex items-center gap-1.5 text-[11px] text-graphite-500 px-1">
                  <Type size={12} /> 评论节点：<span className="font-medium text-graphite-700">{targetNodeName(c.nodeId)}</span>
                </div>
              )}
              <div className={cn('flex gap-2 items-start', isMine && 'flex-row-reverse')}>
                <div className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                  style={{ backgroundColor: a.color }}>
                  {a.avatar}
                </div>
                <div className="flex-1 max-w-[82%]">
                  <div className={cn(
                    'flex items-center gap-2 mb-1 text-[11px] text-graphite-500',
                    isMine && 'flex-row-reverse'
                  )}>
                    <span className="font-semibold text-graphite-700">{a.name}{isMine && ' (你)'}</span>
                    <span>{new Date(c.createdAt).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit', month: 'numeric', day: 'numeric' })}</span>
                  </div>
                  <div className={cn('comment-bubble', isMine ? 'comment-bubble-mine' : 'comment-bubble-other')}>
                    <p className="text-sm whitespace-pre-wrap">{c.content}</p>
                  </div>
                  <div className={cn('flex items-center gap-3 mt-1.5 text-[11px]', isMine && 'justify-end')}>
                    <button
                      onClick={() => resolveComment(c.id, !c.resolved)}
                      className={cn(
                        'flex items-center gap-1 hover:underline',
                        c.resolved ? 'text-success-500' : 'text-graphite-500'
                      )}>
                      <CheckCircle2 size={12} />{c.resolved ? '已解决' : '标记解决'}
                    </button>
                    <button
                      onClick={() => setReplyMap(m => ({ ...m, [c.id]: m[c.id] ?? '' }))}
                      className="text-graphite-500 hover:text-electric-500 hover:underline"
                    >
                      回复
                    </button>
                  </div>
                </div>
              </div>

              {c.replies.length > 0 && (
                <div className="ml-10 space-y-2 border-l-2 border-graphite-100 pl-3">
                  {c.replies.map(r => {
                    const ra = getU(r.authorId);
                    const rm = ra.id === currentUser?.id;
                    return (
                      <div key={r.id} className={cn('flex gap-2 items-start', rm && 'flex-row-reverse')}>
                        <div className="w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                          style={{ backgroundColor: ra.color }}>
                          {ra.avatar}
                        </div>
                        <div className="flex-1 max-w-[82%]">
                          <div className={cn('mb-0.5 text-[10px] text-graphite-500 flex items-center gap-1.5', rm && 'flex-row-reverse')}>
                            <span className="font-semibold text-graphite-600">{ra.name}</span>
                            <span>{new Date(r.createdAt).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className={cn('comment-bubble !py-2 !px-2.5 text-[12px]', rm ? 'comment-bubble-mine' : 'comment-bubble-other')}>
                            {r.content}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {replyMap[c.id] !== undefined && (
                <div className="ml-10 mt-2 flex gap-2">
                  <input
                    value={replyMap[c.id]}
                    onChange={(e) => setReplyMap(m => ({ ...m, [c.id]: e.target.value }))}
                    placeholder="回复评论..."
                    className="input text-xs py-1.5 flex-1"
                    onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submitReply(c.id); }}
                  />
                  <button onClick={() => submitReply(c.id)} className="btn-primary btn !py-1 !px-2.5 text-xs">
                    <Send size={12} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
