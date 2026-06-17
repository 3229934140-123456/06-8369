import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUserStore } from '../store/useUserStore.js';
import { projectApi, templateApi } from '../lib/api.js';
import type { Project, Diagram } from '@shared/types.js';
import { DIAGRAM_TYPE_LABELS } from '@shared/types.js';
import {
  FolderKanban, Plus, Search, LogOut, Workflow, Layers, Users, History,
  FileDigit, ChevronRight, MoreVertical, Pencil, Trash2, ArrowUpRight, Clock, Sparkles, X
} from 'lucide-react';
import { cn } from '../lib/utils.js';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useUserStore(s => s.user);
  const logout = useUserStore(s => s.logout);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState({ projects: 0, diagrams: 0, collaborators: 0, versions: 0 });
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    (async () => {
      const [ps, st] = await Promise.all([projectApi.list(), templateApi.stats()]);
      setProjects(ps);
      setStats(st);
    })();
  }, []);

  const filtered = projects.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  );

  const doCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || creating) return;
    setCreating(true);
    try {
      const p = await projectApi.create({ name: newName.trim(), description: newDesc.trim() });
      setProjects([p, ...projects]);
      setShowCreate(false);
      setNewName('');
      setNewDesc('');
      navigate(`/projects/${p.id}`);
    } finally {
      setCreating(false);
    }
  };

  const memberColors = (uids: string[]) => {
    const colors: Record<string, string> = { 'u-1': '#3B82F6', 'u-2': '#10B981', 'u-3': '#F59E0B', 'u-4': '#F43F5E' };
    const avatars: Record<string, string> = { 'u-1': 'ZS', 'u-2': 'LS', 'u-3': 'WW', 'u-4': 'ZL' };
    return uids.slice(0, 4).map(id => ({
      color: colors[id] ?? '#64748B',
      av: avatars[id] ?? id.slice(0, 2).toUpperCase()
    }));
  };

  return (
    <div className="h-full w-full flex bg-graphite-50">
      <aside className="w-64 shrink-0 h-full border-r border-graphite-200 bg-white flex flex-col">
        <div className="h-16 px-5 flex items-center gap-2.5 border-b border-graphite-100">
          <div className="w-10 h-10 rounded-xl bg-indigo-700 text-white flex items-center justify-center shadow-md">
            <Workflow size={22} />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-graphite-900 leading-none">FlowSync</h1>
            <p className="text-[10px] text-graphite-500 mt-0.5">协作绘图画板</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-electric-50 text-electric-700 font-medium text-sm shadow-sm">
            <FolderKanban size={18} /> 项目工作台
          </button>
          <button onClick={() => navigate('/templates')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-graphite-600 font-medium text-sm hover:bg-graphite-50">
            <Layers size={18} /> 模板库
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-graphite-600 font-medium text-sm hover:bg-graphite-50">
            <History size={18} /> 最近编辑
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-graphite-600 font-medium text-sm hover:bg-graphite-50">
            <Users size={18} /> 团队成员
          </button>
        </nav>

        <div className="p-3 border-t border-graphite-100">
          <div className="p-3 rounded-xl bg-gradient-to-br from-electric-50 via-white to-success-50 border border-electric-100 mb-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles size={15} className="text-warning-500" />
              <span className="text-xs font-semibold text-graphite-800">专业版</span>
            </div>
            <p className="text-[11px] text-graphite-500 leading-relaxed mb-2">
              解锁无限图表数量、高级模板与离线导出功能
            </p>
            <button className="w-full btn-primary !py-1.5 !text-xs">立即升级</button>
          </div>

          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-graphite-50">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
              style={{ backgroundColor: user?.color ?? '#3B82F6' }}>
              {user?.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-graphite-800 truncate">{user?.name}</div>
              <div className="text-[11px] text-graphite-500 truncate">{user?.email}</div>
            </div>
            <button onClick={() => { logout(); navigate('/login'); }} className="p-1.5 rounded-lg hover:bg-danger-500/10 text-graphite-400 hover:text-danger-500">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto thin-scrollbar">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-sm text-graphite-500 mb-1">欢迎回来 👋</p>
              <h2 className="font-display font-bold text-3xl text-graphite-900">{user?.name} 的工作台</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-72">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-graphite-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  className="input pl-10 py-2.5 bg-white/80 backdrop-blur" placeholder="搜索项目..." />
              </div>
              <button onClick={() => setShowCreate(true)} className="btn-primary !py-2.5 !px-5 shadow-lg shadow-electric-500/25">
                <Plus size={18} /> 新建项目
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-10">
            {[
              { label: '项目总数', value: stats.projects, Icon: FolderKanban, color: 'text-electric-500', bg: 'bg-electric-50' },
              { label: '图表数量', value: stats.diagrams, Icon: FileDigit, color: 'text-success-500', bg: 'bg-success-500/10' },
              { label: '团队成员', value: stats.collaborators, Icon: Users, color: 'text-warning-500', bg: 'bg-warning-500/10' },
              { label: '版本快照', value: stats.versions, Icon: History, color: 'text-danger-500', bg: 'bg-danger-500/10' },
            ].map(({ label, value, Icon, color, bg }) => (
              <div key={label} className="card p-5 hover:shadow-panel transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs text-graphite-500 mb-1.5">{label}</div>
                    <div className="font-display font-bold text-2xl text-graphite-900 tabular-nums">{value}</div>
                  </div>
                  <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', bg)}>
                    <Icon className={color} size={22} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-5 flex items-end justify-between">
            <div>
              <h3 className="font-display font-semibold text-xl text-graphite-900 mb-1">我的项目</h3>
              <p className="text-sm text-graphite-500">共 {filtered.length} 个项目</p>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="card p-20 text-center">
              <FolderKanban size={56} className="mx-auto mb-4 text-graphite-300" />
              <p className="text-lg text-graphite-500 mb-4">还没有项目，开始创建第一个吧！</p>
              <button onClick={() => setShowCreate(true)} className="btn-primary">
                <Plus size={18} /> 新建项目
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-5">
              {filtered.map((p, i) => (
                <Link key={p.id} to={`/projects/${p.id}`}
                  className="card overflow-hidden group hover:-translate-y-1 hover:shadow-panel transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="h-36 bg-gradient-to-br from-indigo-700 via-indigo-800 to-electric-600 relative overflow-hidden">
                    <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 400 200" fill="none">
                      <g stroke="white" strokeWidth="1.5">
                        <rect x="40" y="60" width="90" height="55" rx="8" fill="white" fillOpacity="0.15" />
                        <polygon points="190,80 240,50 290,80 240,110" fill="white" fillOpacity="0.15" />
                        <ellipse cx="340" cy="90" rx="35" ry="22" fill="white" fillOpacity="0.15" />
                        <line x1="130" y1="87" x2="190" y2="80" strokeDasharray="4 4" />
                        <line x1="290" y1="80" x2="305" y2="88" strokeDasharray="4 4" />
                      </g>
                    </svg>
                    <div className="absolute top-3 right-3">
                      <button onClick={(e) => { e.preventDefault(); }}
                        className="w-8 h-8 rounded-lg bg-black/20 backdrop-blur flex items-center justify-center text-white/80 hover:bg-black/30">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                    <div className="absolute bottom-3 left-4 text-white/90 font-mono text-xs bg-black/25 backdrop-blur px-2 py-0.5 rounded-md">
                      {p.members.length} 成员 · 更新于 {timeAgo(p.updatedAt)}
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-display font-semibold text-lg text-graphite-900 group-hover:text-electric-600 transition-colors truncate pr-2">
                        {p.name}
                      </h4>
                      <ArrowUpRight size={18} className="text-graphite-300 group-hover:text-electric-500 shrink-0 mt-0.5" />
                    </div>
                    <p className="text-xs text-graphite-500 line-clamp-2 min-h-[32px] mb-4 leading-relaxed">
                      {p.description || '暂无项目描述'}
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-graphite-100">
                      <div className="flex -space-x-2">
                        {memberColors(p.members.map(m => m.userId)).map((m, mi) => (
                          <div key={mi} className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold shadow-sm"
                            style={{ backgroundColor: m.color }}>
                            {m.av}
                          </div>
                        ))}
                      </div>
                      <span className="text-[11px] text-graphite-400 flex items-center gap-1">
                        <Clock size={12} /> {timeAgo(p.createdAt)} 创建
                      </span>
                    </div>
                  </div>
                </Link>
              ))}

              <button onClick={() => setShowCreate(true)}
                className="rounded-2xl border-2 border-dashed border-graphite-300 hover:border-electric-400 hover:bg-electric-50/50 transition-all flex flex-col items-center justify-center text-graphite-400 hover:text-electric-600 min-h-[260px] group">
                <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-current flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Plus size={28} />
                </div>
                <span className="text-sm font-semibold">创建新项目</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-in">
            <div className="px-6 py-5 border-b border-graphite-100 flex items-center justify-between">
              <h3 className="font-display font-semibold text-xl text-graphite-900">创建项目</h3>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-graphite-100 text-graphite-400">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={doCreate} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-graphite-600 mb-1.5 block">项目名称</label>
                <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                  className="input py-2.5" placeholder="例如：电商平台重构" required />
              </div>
              <div>
                <label className="text-xs font-semibold text-graphite-600 mb-1.5 block">项目描述（选填）</label>
                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3}
                  className="input resize-none" placeholder="简单介绍一下这个项目..." />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary !py-2.5">取消</button>
                <button type="submit" disabled={creating || !newName.trim()} className="btn-primary !py-2.5 shadow-lg shadow-electric-500/25 disabled:opacity-50">
                  {creating ? '创建中...' : <>创建项目 <ChevronRight size={16} /></>}
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
  if (m < 1) return '刚刚';
  if (m < 60) return `${m} 分钟前`;
  if (h < 24) return `${h} 小时前`;
  if (d < 30) return `${d} 天前`;
  return new Date(iso).toLocaleDateString('zh-CN');
}

export default DashboardPage;
