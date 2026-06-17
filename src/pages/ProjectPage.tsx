import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useUserStore } from '../store/useUserStore.js';
import { projectApi, diagramApi, authApi } from '../lib/api.js';
import type { Project, Diagram, DiagramType, MemberRole } from '@shared/types.js';
import { DIAGRAM_TYPE_LABELS, DEFAULT_VIEWPORT } from '@shared/types.js';
import {
  ArrowLeft, Plus, Search, Settings, Workflow, Users, Filter,
  Clock, FileDigit, MoreVertical, Trash2, Edit3, FolderKanban, Layers, X, ChevronDown, LayoutTemplate
} from 'lucide-react';
import { cn } from '../lib/utils.js';
import { NodeShapeRenderer } from '../components/editor/NodeShapeRenderer.js';

const TYPE_STYLES: Record<DiagramType, { Icon: any; label: string; color: string; bg: string }> = {
  flowchart: { Icon: Workflow, label: '流程图', color: 'text-electric-600', bg: 'bg-electric-500/10' },
  swimlane: { Icon: Layers, label: '泳道图', color: 'text-success-600', bg: 'bg-success-500/10' },
  er: { Icon: FileDigit, label: 'ER图', color: 'text-indigo-600', bg: 'bg-indigo-500/10' },
  sequence: { Icon: Workflow, label: '时序图', color: 'text-warning-600', bg: 'bg-warning-500/10' },
  topology: { Icon: Layers, label: '拓扑图', color: 'text-danger-600', bg: 'bg-danger-500/10' },
};

export const ProjectPage: React.FC = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const user = useUserStore(s => s.user);
  const [project, setProject] = useState<Project | null>(null);
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<DiagramType | 'all'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<DiagramType>('flowchart');
  const [creating, setCreating] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  const role = project?.members.find(m => m.userId === user?.id)?.role ?? (project?.ownerId === user?.id ? 'admin' : null) as MemberRole | null;
  const canEdit = role === 'admin' || role === 'editor';

  useEffect(() => {
    if (!projectId) return;
    (async () => {
      setLoading(true);
      try {
        const [p, d, m] = await Promise.all([
          projectApi.get(projectId),
          projectApi.listDiagrams(projectId),
          projectApi.listMembers(projectId),
        ]);
        setProject(p);
        setDiagrams(d);
        setMembers(m);
      } finally { setLoading(false); }
    })();
  }, [projectId]);

  const filtered = diagrams.filter(d => (
    (typeFilter === 'all' || d.type === typeFilter) &&
    (!search || d.name.toLowerCase().includes(search.toLowerCase()))
  ));

  const doCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || creating || !projectId) return;
    setCreating(true);
    try {
      const d = await diagramApi.create({ projectId, name: newName.trim(), type: newType });
      setDiagrams([d, ...diagrams]);
      setShowCreate(false);
      setNewName('');
      navigate(`/editor/${d.id}`);
    } finally { setCreating(false); }
  };

  const doDelete = async (id: string) => {
    if (!confirm('确定要删除这张图表吗？此操作不可撤销。')) return;
    await diagramApi.delete(id);
    setDiagrams(diagrams.filter(d => d.id !== id));
  };

  return (
    <div className="h-full w-full flex flex-col bg-graphite-50">
      <header className="h-16 border-b border-graphite-200 bg-white/80 backdrop-blur flex items-center gap-4 px-6 shrink-0">
        <button onClick={() => navigate('/dashboard')} className="p-2 rounded-lg hover:bg-graphite-100 text-graphite-500">
          <ArrowLeft size={20} />
        </button>
        <div className="h-8 w-px bg-graphite-200" />
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-xl text-graphite-900">{project?.name}</h2>
            {role && (
              <span className={cn('badge',
                role === 'admin' ? 'badge-admin' : role === 'editor' ? 'badge-editor' : 'badge-viewer'
              )}>
                {role === 'admin' ? '管理员' : role === 'editor' ? '编辑者' : '查看者'}
              </span>
            )}
          </div>
          <p className="text-xs text-graphite-500 mt-0.5 line-clamp-1 max-w-xl">{project?.description}</p>
        </div>

        <div className="flex-1" />

        <Link to={`/projects/${projectId}/settings`} className="btn-ghost btn">
          <Settings size={18} /> 项目设置
        </Link>
        <div className="flex -space-x-2">
          {members.slice(0, 4).map((m, i) => (
            <div key={m.id || i} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-[11px] font-bold shadow-sm"
              style={{ backgroundColor: m.color }} title={`${m.name} · ${m.role}`}>
              {m.avatar}
            </div>
          ))}
          {members.length > 4 && (
            <div className="w-8 h-8 rounded-full bg-graphite-200 border-2 border-white flex items-center justify-center text-[10px] font-semibold text-graphite-600">
              +{members.length - 4}
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex">
        <aside className="w-56 shrink-0 border-r border-graphite-200 bg-white p-4 space-y-6">
          <div>
            <div className="text-[11px] font-semibold text-graphite-400 uppercase tracking-wider mb-2 px-2">图表类型</div>
            <div className="space-y-0.5">
              {([
                ['all', '全部图表', Filter, 'bg-electric-50', 'text-electric-600'],
                ...Object.entries(TYPE_STYLES).map(([k, v]) => [k, v.label, v.Icon, v.bg, v.color]),
              ] as const).map(([key, label, Icon, bg, color]) => (
                <button key={key}
                  onClick={() => setTypeFilter(key as any)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    typeFilter === key
                      ? `${bg} ${color}`
                      : 'text-graphite-600 hover:bg-graphite-50'
                  )}>
                  <Icon size={16} />
                  <span>{label}</span>
                  <span className="ml-auto text-xs opacity-60">
                    {key === 'all' ? diagrams.length : diagrams.filter(d => d.type === key).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-graphite-400 uppercase tracking-wider mb-2 px-2">快捷操作</div>
            <div className="space-y-0.5">
              <Link to="/templates" className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-graphite-600 hover:bg-graphite-50">
                <LayoutTemplate size={16} /> 浏览模板库
              </Link>
              <Link to={`/projects/${projectId}/settings`} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-graphite-600 hover:bg-graphite-50">
                <Users size={16} /> 管理成员
              </Link>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto thin-scrollbar p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-graphite-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  className="input pl-10 py-2.5 bg-white" placeholder="搜索图表..." />
              </div>
              {canEdit && (
                <button onClick={() => setShowCreate(true)} className="btn-primary !py-2.5 !px-5 shadow-lg shadow-electric-500/25 shrink-0">
                  <Plus size={18} /> 新建图表
                </button>
              )}
            </div>

            {loading ? (
              <div className="animate-pulse grid grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-graphite-100 bg-white h-72" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="card p-20 text-center">
                <FileDigit size={56} className="mx-auto mb-4 text-graphite-300" />
                <p className="text-lg text-graphite-500 mb-4">还没有图表，从创建第一张开始吧</p>
                {canEdit && (
                  <button onClick={() => setShowCreate(true)} className="btn-primary">
                    <Plus size={18} /> 创建图表
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-5">
                {filtered.map((d, i) => {
                  const ts = TYPE_STYLES[d.type];
                  return (
                    <div key={d.id} className="card group overflow-hidden hover:shadow-panel hover:-translate-y-1 transition-all animate-fade-in"
                      style={{ animationDelay: `${i * 30}ms` }}>
                      <Link to={`/editor/${d.id}`} className="block">
                        <div className="h-48 canvas-grid relative overflow-hidden border-b border-graphite-100">
                          <div className="absolute inset-2 overflow-hidden rounded-lg bg-white/80 backdrop-blur shadow-inner flex items-center justify-center">
                            {d.nodes.length > 0 ? (
                              <div style={{
                                transform: 'scale(0.35)',
                                transformOrigin: 'center',
                                width: '600px',
                                height: '400px',
                                position: 'relative',
                              }}>
                                <svg width="600" height="400" viewBox="0 0 1200 700">
                                  <g transform="translate(50, 50) scale(0.8)">
                                    {d.edges.map((e, ei) => (
                                      <line key={ei} x1={50 + (ei * 137) % 900} y1={50 + (ei * 89) % 400}
                                        x2={200 + (ei * 173) % 900} y2={150 + (ei * 97) % 400}
                                        stroke={e.style.stroke} strokeWidth={e.style.strokeWidth} strokeDasharray={e.style.dashed ? '6 4' : undefined} />
                                    ))}
                                    {d.nodes.slice(0, 14).map((n, ni) => (
                                      <NodeShapeRenderer key={ni} node={{ ...n, id: `mini-${n.id}` }} selected={false} />
                                    ))}
                                  </g>
                                </svg>
                              </div>
                            ) : (
                              <div className="text-xs text-graphite-400">空图表</div>
                            )}
                          </div>
                          <div className={cn('absolute top-3 left-3 badge', ts.bg, ts.color)}>
                            <ts.Icon size={12} /> {ts.label}
                          </div>
                        </div>
                      </Link>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <Link to={`/editor/${d.id}`} className="min-w-0 flex-1">
                            <h4 className="font-semibold text-graphite-900 truncate group-hover:text-electric-600 transition-colors">
                              {d.name}
                            </h4>
                          </Link>
                          {canEdit && (
                            <div className="shrink-0 relative" onClick={e => e.stopPropagation()}>
                              <button className="p-1.5 rounded-lg hover:bg-graphite-100 text-graphite-400 hover:text-graphite-700">
                                <MoreVertical size={16} />
                              </button>
                              <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-glass border border-graphite-100 py-1 hidden group-hover:block z-10 animate-fade-in">
                                <button className="w-full px-3 py-1.5 text-xs text-left hover:bg-graphite-50 flex items-center gap-2 text-graphite-700">
                                  <Edit3 size={13} /> 重命名
                                </button>
                                <button onClick={() => doDelete(d.id)} className="w-full px-3 py-1.5 text-xs text-left hover:bg-danger-500/10 flex items-center gap-2 text-danger-500">
                                  <Trash2 size={13} /> 删除
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-graphite-400 mt-2">
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {timeAgo(d.updatedAt)} 更新
                          </span>
                          <span>{d.nodes.length} 节点 · {d.edges.length} 连线</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {canEdit && (
                  <button onClick={() => setShowCreate(true)}
                    className="rounded-2xl border-2 border-dashed border-graphite-300 hover:border-electric-400 hover:bg-electric-50/50 transition-all flex flex-col items-center justify-center text-graphite-400 hover:text-electric-600 min-h-[300px] group">
                    <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-current flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Plus size={28} />
                    </div>
                    <span className="text-sm font-semibold">创建新图表</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-in">
            <div className="px-6 py-5 border-b border-graphite-100 flex items-center justify-between">
              <h3 className="font-display font-semibold text-xl text-graphite-900">创建新图表</h3>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-graphite-100 text-graphite-400">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={doCreate} className="p-6 space-y-5">
              <div>
                <label className="text-xs font-semibold text-graphite-600 mb-1.5 block">图表名称</label>
                <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                  className="input py-2.5" placeholder="例如：用户下单流程" required />
              </div>

              <div>
                <label className="text-xs font-semibold text-graphite-600 mb-2 block">图表类型</label>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(TYPE_STYLES).map(([k, v]) => (
                    <button type="button" key={k} onClick={() => setNewType(k as DiagramType)}
                      className={cn(
                        'p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all',
                        newType === k
                          ? 'border-electric-500 bg-electric-50 ring-2 ring-electric-200'
                          : 'border-graphite-200 hover:border-graphite-300 hover:bg-graphite-50'
                      )}>
                      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', v.bg, v.color)}>
                        <v.Icon size={18} />
                      </div>
                      <span className="text-[11px] font-semibold text-graphite-700">{v.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary !py-2.5">取消</button>
                <button type="submit" disabled={creating || !newName.trim()}
                  className="btn-primary !py-2.5 shadow-lg shadow-electric-500/25 disabled:opacity-50">
                  {creating ? '创建中...' : <>创建并编辑 <Workflow size={16} /></>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), d = Math.floor(diff / 86400000);
  if (m < 1) return '刚刚'; if (m < 60) return `${m} 分钟前`;
  if (h < 24) return `${h} 小时前`; if (d < 30) return `${d} 天前`;
  return new Date(iso).toLocaleDateString('zh-CN');
}

export default ProjectPage;
