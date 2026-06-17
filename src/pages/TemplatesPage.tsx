import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUserStore } from '../store/useUserStore.js';
import { projectApi, templateApi, diagramApi } from '../lib/api.js';
import type { Project, DiagramTemplate, DiagramType, ProjectMember } from '@shared/types.js';
import { DIAGRAM_TYPE_LABELS } from '@shared/types.js';
import {
  ArrowLeft, Layers, LayoutTemplate, Search, Plus, Workflow, Database,
  GitBranch, Activity, Network, Sparkles, FolderKanban, ChevronDown, X, Check, FolderPlus
} from 'lucide-react';
import { NodeShapeRenderer } from '../components/editor/NodeShapeRenderer.jsx';
import { cn } from '../lib/utils.js';

const TYPE_FILTERS: { key: DiagramType | 'all'; label: string; Icon: any }[] = [
  { key: 'all', label: '全部', Icon: Layers },
  { key: 'flowchart', label: '流程图', Icon: Workflow },
  { key: 'swimlane', label: '泳道图', Icon: GitBranch },
  { key: 'er', label: 'ER图', Icon: Database },
  { key: 'sequence', label: '时序图', Icon: Activity },
  { key: 'topology', label: '网络拓扑', Icon: Network },
];

const CATEGORIES = ['全部', '业务流程', '系统架构', '数据建模', '接口设计', '基础设施', 'DevOps'];

export const TemplatesPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useUserStore(s => s.user);
  const [templates, setTemplates] = useState<DiagramTemplate[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<DiagramType | 'all'>('all');
  const [category, setCategory] = useState('全部');
  const [useModal, setUseModal] = useState<DiagramTemplate | null>(null);
  const [targetProjectId, setTargetProjectId] = useState('');
  const [diagramName, setDiagramName] = useState('');
  const [using, setUsing] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [ts, ps] = await Promise.all([templateApi.list(), projectApi.list()]);
        setTemplates(ts);
        setProjects(ps);
        if (ps.length > 0) setTargetProjectId(ps[0].id);
      } finally { setLoading(false); }
    })();
  }, []);

  const filtered = templates.filter(t => {
    const matchType = typeFilter === 'all' || t.type === typeFilter;
    const matchCat = category === '全部' || t.category === category;
    const matchQ = !query || t.name.includes(query) || t.description.includes(query);
    return matchType && matchCat && matchQ;
  });

  const openUse = (t: DiagramTemplate) => {
    setUseModal(t);
    setDiagramName(t.name);
  };

  const confirmUse = async () => {
    if (!useModal || !targetProjectId || !diagramName.trim() || using) return;
    setUsing(true);
    try {
      const d = await diagramApi.create({
        projectId: targetProjectId,
        name: diagramName.trim(),
        type: useModal.type,
        templateId: useModal.id,
      });
      navigate(`/editor/${d.id}`);
    } finally { setUsing(false); }
  };

  const doCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || creating) return;
    setCreating(true);
    try {
      const p = await projectApi.create({ name: newProjectName.trim(), description: '' });
      setProjects([p, ...projects]);
      setTargetProjectId(p.id);
      setShowCreateProject(false);
      setNewProjectName('');
    } finally { setCreating(false); }
  };

  const targetProject = projects.find(p => p.id === targetProjectId);

  return (
    <div className="h-full w-full flex flex-col bg-graphite-50">
      <header className="h-16 border-b border-graphite-200 bg-white/80 backdrop-blur flex items-center gap-4 px-6 shrink-0">
        <button onClick={() => navigate('/dashboard')} className="p-2 rounded-lg hover:bg-graphite-100 text-graphite-500">
          <ArrowLeft size={20} />
        </button>
        <div className="h-8 w-px bg-graphite-200" />
        <div>
          <h2 className="font-display font-bold text-xl text-graphite-900 flex items-center gap-2">
            <LayoutTemplate size={22} className="text-electric-500" /> 模板库
          </h2>
          <p className="text-xs text-graphite-500 mt-0.5">从预设模板快速创建，让设计事半功倍</p>
        </div>
        <div className="flex-1" />
        <div className="relative w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-graphite-400" />
          <input value={query} onChange={e => setQuery(e.target.value)}
            className="input pl-10 py-2 bg-white" placeholder="搜索模板..." />
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex">
        <aside className="w-60 shrink-0 border-r border-graphite-200 bg-white p-4 overflow-y-auto thin-scrollbar">
          <div className="space-y-6">
            <div>
              <div className="text-[11px] font-semibold text-graphite-400 uppercase tracking-wider mb-2 px-2">图表类型</div>
              <div className="space-y-0.5">
                {TYPE_FILTERS.map(({ key, label, Icon }) => (
                  <button key={key}
                    onClick={() => setTypeFilter(key)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                      typeFilter === key
                        ? 'bg-electric-50 text-electric-600'
                        : 'text-graphite-600 hover:bg-graphite-50'
                    )}>
                    <Icon size={16} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-graphite-400 uppercase tracking-wider mb-2 px-2">模板分类</div>
              <div className="space-y-0.5">
                {CATEGORIES.map(cat => (
                  <button key={cat}
                    onClick={() => setCategory(cat)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                      category === cat
                        ? 'bg-success-500/10 text-success-600'
                        : 'text-graphite-600 hover:bg-graphite-50'
                    )}>
                    <Sparkles size={16} />
                    <span>{cat}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto thin-scrollbar p-8">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="animate-pulse grid grid-cols-3 gap-5">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-graphite-100 bg-white h-80" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="card p-20 text-center">
                <Layers size={56} className="mx-auto mb-4 text-graphite-300" />
                <p className="text-lg text-graphite-500">未找到匹配的模板</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-5">
                {filtered.map((t, i) => (
                  <div key={t.id} className="card group overflow-hidden hover:-translate-y-1 hover:shadow-panel transition-all animate-fade-in"
                    style={{ animationDelay: `${i * 30}ms` }}>
                    <div className="h-52 canvas-grid relative overflow-hidden border-b border-graphite-100 bg-white">
                      <div className="absolute inset-3 overflow-hidden rounded-lg shadow-inner bg-white flex items-center justify-center">
                        <div style={{ transform: 'scale(0.42)', transformOrigin: 'center' }}>
                          <svg width="900" height="520" viewBox="0 0 900 520">
                            <defs>
                              <marker id="tpl-arrow" viewBox="0 0 10 10" refX="8" refY="5"
                                markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
                              </marker>
                            </defs>
                            <g transform="translate(20, 10)">
                              {t.nodes.map((n, ni) => (
                                <NodeShapeRenderer key={ni} node={{ ...n, id: `tpl-${n.id}` }} selected={false} />
                              ))}
                              {t.edges.map((e, ei) => (
                                <line key={ei} x1={100 + ei * 200} y1={60 + (ei % 3) * 90}
                                  x2={280 + ei * 180} y2={130 + (ei % 4) * 70}
                                  stroke={e.style.stroke} strokeWidth={e.style.strokeWidth}
                                  strokeDasharray={e.style.dashed ? '6 4' : undefined}
                                  markerEnd="url(#tpl-arrow)" />
                              ))}
                            </g>
                          </svg>
                        </div>
                      </div>
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className="badge bg-white/90 backdrop-blur text-graphite-700 shadow-sm border border-graphite-100">
                          {DIAGRAM_TYPE_LABELS[t.type]}
                        </span>
                        <span className="badge bg-warning-500/15 text-warning-600">
                          {t.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-display font-semibold text-graphite-900 mb-1">{t.name}</h4>
                          <p className="text-xs text-graphite-500 line-clamp-2 min-h-[32px] leading-relaxed">
                            {t.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-4 mt-3 border-t border-graphite-100">
                        <div className="text-[11px] text-graphite-400 flex items-center gap-1">
                          <Layers size={12} /> {t.nodes.length} 节点 · {t.edges.length} 连线
                        </div>
                        <button onClick={() => openUse(t)} className="btn-primary !py-1.5 !px-3 !text-xs">
                          <Plus size={13} /> 套用模板
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {useModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-in">
            <div className="px-6 py-5 border-b border-graphite-100 flex items-center justify-between">
              <h3 className="font-display font-semibold text-xl text-graphite-900">使用模板</h3>
              <button onClick={() => setUseModal(null)} className="p-1.5 rounded-lg hover:bg-graphite-100 text-graphite-400">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="p-4 rounded-xl bg-gradient-to-br from-electric-50/50 to-success-50/50 border border-electric-100">
                <div className="text-xs text-electric-600 font-semibold mb-1">选中模板</div>
                <div className="font-display font-semibold text-graphite-900">{useModal.name}</div>
                <div className="text-xs text-graphite-500 mt-0.5">
                  {DIAGRAM_TYPE_LABELS[useModal.type]} · {useModal.category}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-graphite-600 mb-1.5 block">目标项目</label>
                <div className="relative">
                  <button type="button" onClick={() => setShowProjectMenu(v => !v)}
                    className="w-full input !text-left py-2.5 flex items-center justify-between pr-10">
                    <span className="flex items-center gap-2">
                      <FolderKanban size={16} className="text-electric-500" />
                      {targetProject?.name ?? '选择项目'}
                    </span>
                    <ChevronDown size={16} className="text-graphite-400" />
                  </button>
                  {showProjectMenu && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-glass border border-graphite-100 py-1.5 z-10 max-h-60 overflow-y-auto thin-scrollbar animate-fade-in">
                      {projects.map(p => (
                        <button key={p.id} onClick={() => { setTargetProjectId(p.id); setShowProjectMenu(false); }}
                          className={cn(
                            'w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-graphite-50',
                            p.id === targetProjectId && 'bg-electric-50 text-electric-700'
                          )}>
                          <FolderKanban size={15} className="text-graphite-400 shrink-0" />
                          <span className="truncate flex-1">{p.name}</span>
                          {p.id === targetProjectId && <Check size={15} className="text-electric-500" />}
                        </button>
                      ))}
                      <div className="my-1 border-t border-graphite-100" />
                      <button onClick={() => { setShowProjectMenu(false); setShowCreateProject(true); }}
                        className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-success-50 text-success-600 font-medium">
                        <FolderPlus size={15} /> 创建新项目
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-graphite-600 mb-1.5 block">图表名称</label>
                <input value={diagramName} onChange={e => setDiagramName(e.target.value)}
                  className="input py-2.5" placeholder="为你的图表命名" required />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setUseModal(null)} className="btn-secondary !py-2.5">取消</button>
                <button onClick={confirmUse} disabled={using || !targetProjectId || !diagramName.trim()}
                  className="btn-primary !py-2.5 shadow-lg shadow-electric-500/25 disabled:opacity-50">
                  {using ? '创建中...' : <>创建并编辑 <Workflow size={16} /></>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreateProject && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-in">
            <div className="px-6 py-5 border-b border-graphite-100 flex items-center justify-between">
              <h3 className="font-display font-semibold text-xl text-graphite-900">创建新项目</h3>
              <button onClick={() => setShowCreateProject(false)} className="p-1.5 rounded-lg hover:bg-graphite-100 text-graphite-400">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={doCreateProject} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-graphite-600 mb-1.5 block">项目名称</label>
                <input autoFocus value={newProjectName} onChange={e => setNewProjectName(e.target.value)}
                  className="input py-2.5" placeholder="例如：新系统架构方案" required />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreateProject(false)} className="btn-secondary !py-2.5">取消</button>
                <button type="submit" disabled={creating || !newProjectName.trim()}
                  className="btn-primary !py-2.5 disabled:opacity-50">
                  {creating ? '创建中...' : '创建项目'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplatesPage;
