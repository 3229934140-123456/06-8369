import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useUserStore } from '../store/useUserStore.js';
import { projectApi } from '../lib/api.js';
import type { Project, MemberRole } from '@shared/types.js';
import {
  ArrowLeft, Settings as SettingsIcon, Users, FolderKanban, Shield,
  MoreVertical, UserPlus, Crown, Pencil, Search, Trash2, X, Check, ChevronDown
} from 'lucide-react';
import { cn } from '../lib/utils.js';

const ROLE_OPTIONS: { key: MemberRole; label: string; Icon: any; badge: string; desc: string }[] = [
  { key: 'admin', label: '管理员', Icon: Crown, badge: 'badge-admin', desc: '完整管理权限，可删除项目' },
  { key: 'editor', label: '编辑者', Icon: Pencil, badge: 'badge-editor', desc: '编辑图表内容，管理评论' },
  { key: 'viewer', label: '查看者', Icon: Search, badge: 'badge-viewer', desc: '仅查看与评论，无法编辑' },
];

export const ProjectSettingsPage: React.FC = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const user = useUserStore(s => s.user);
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'general' | 'members'>('general');

  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<MemberRole>('editor');
  const [inviting, setInviting] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);

  const myRole = project?.members.find(m => m.userId === user?.id)?.role
    ?? (project?.ownerId === user?.id ? 'admin' : null) as MemberRole | null;
  const isAdmin = myRole === 'admin' || project?.ownerId === user?.id;

  useEffect(() => {
    if (!projectId) return;
    (async () => {
      setLoading(true);
      try {
        const [p, m] = await Promise.all([
          projectApi.get(projectId),
          projectApi.listMembers(projectId),
        ]);
        setProject(p);
        setMembers(m);
        setName(p.name);
        setDesc(p.description);
      } finally { setLoading(false); }
    })();
  }, [projectId]);

  const saveGeneral = async () => {
    if (!projectId || saving || !name.trim()) return;
    setSaving(true); setNameSaved(false);
    try {
      const p = await projectApi.update(projectId, { name: name.trim(), description: desc.trim() });
      if (p) {
        setProject(p);
        setNameSaved(true);
        setTimeout(() => setNameSaved(false), 2000);
      }
    } finally { setSaving(false); }
  };

  const doInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !inviteEmail.trim() || inviting) return;
    setInviting(true);
    try {
      await projectApi.addMember(projectId, inviteEmail.trim(), inviteRole);
      const m = await projectApi.listMembers(projectId);
      setMembers(m);
      setShowInvite(false);
      setInviteEmail('');
      setInviteRole('editor');
    } finally { setInviting(false); }
  };

  const changeRole = async (uid: string, role: MemberRole) => {
    if (!projectId) return;
    await projectApi.updateMemberRole(projectId, uid, role);
    const m = await projectApi.listMembers(projectId);
    setMembers(m);
    setEditingRole(null);
  };

  const removeMember = async (uid: string) => {
    if (!projectId) return;
    if (!confirm('确定要移除该成员吗？')) return;
    await projectApi.removeMember(projectId, uid);
    const m = await projectApi.listMembers(projectId);
    setMembers(m);
  };

  const deleteProject = async () => {
    if (!projectId) return;
    if (!confirm('确定要永久删除该项目吗？此操作不可撤销，所有图表将一并删除！')) return;
    if (!confirm('再次确认：该操作会删除所有图表、版本、评论，真的要继续吗？')) return;
    await projectApi.delete(projectId);
    navigate('/dashboard');
  };

  if (loading || !project) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-graphite-50">
        <div className="animate-pulse text-graphite-400 text-sm">加载中...</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-graphite-50">
      <header className="h-16 border-b border-graphite-200 bg-white/80 backdrop-blur flex items-center gap-4 px-6 shrink-0">
        <button onClick={() => navigate(`/projects/${projectId}`)} className="p-2 rounded-lg hover:bg-graphite-100 text-graphite-500">
          <ArrowLeft size={20} />
        </button>
        <div className="h-8 w-px bg-graphite-200" />
        <div>
          <h2 className="font-display font-bold text-xl text-graphite-900 flex items-center gap-2">
            <SettingsIcon size={20} className="text-electric-500" /> 项目设置
          </h2>
          <p className="text-xs text-graphite-500 mt-0.5">{project.name} 的配置与权限管理</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto thin-scrollbar p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-6 p-1 bg-graphite-100 rounded-xl w-fit">
            {([
              { k: 'general', label: '基本信息', Icon: FolderKanban },
              { k: 'members', label: `成员与权限 (${members.length})`, Icon: Users },
            ] as const).map(({ k, label, Icon }) => (
              <button key={k} onClick={() => setTab(k)}
                className={cn(
                  'px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all',
                  tab === k ? 'bg-white text-graphite-900 shadow-sm' : 'text-graphite-500 hover:text-graphite-800'
                )}>
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>

          {tab === 'general' && (
            <div className="space-y-6">
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-electric-50 flex items-center justify-center">
                    <FolderKanban size={18} className="text-electric-600" />
                  </div>
                  <h3 className="font-display font-semibold text-lg text-graphite-900">基本信息</h3>
                </div>
                <div className="space-y-5 max-w-2xl">
                  <div>
                    <label className="text-xs font-semibold text-graphite-600 mb-1.5 block">项目名称</label>
                    <input value={name} onChange={e => setName(e.target.value)} className="input py-2.5" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-graphite-600 mb-1.5 block">项目描述</label>
                    <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={4}
                      className="input resize-none" placeholder="介绍一下项目的目标和范围..." />
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <button onClick={saveGeneral} disabled={saving || !name.trim()}
                      className="btn-primary !py-2.5 shadow-md shadow-electric-500/20 disabled:opacity-50">
                      {saving ? '保存中...' : nameSaved ? (<><Check size={16} /> 已保存</>) : '保存更改'}
                    </button>
                    {nameSaved && <span className="text-success-600 text-sm">✓ 设置已更新</span>}
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="card p-6 border-danger-500/30 bg-danger-500/[0.02]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-danger-500/10 flex items-center justify-center">
                      <Shield size={18} className="text-danger-500" />
                    </div>
                    <h3 className="font-display font-semibold text-lg text-danger-600">危险操作</h3>
                  </div>
                  <p className="text-sm text-graphite-600 mb-5 leading-relaxed">
                    删除项目将永久移除所有图表、版本历史、成员评论及相关数据。此操作<strong className="text-danger-500">不可撤销</strong>。
                  </p>
                  <button onClick={deleteProject}
                    className="btn-danger !py-2.5 !px-5 bg-white border border-danger-200 text-danger-600 hover:bg-danger-500 hover:text-white">
                    <Trash2 size={18} /> 永久删除项目
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === 'members' && (
            <div className="card overflow-hidden">
              <div className="px-6 py-5 border-b border-graphite-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-success-500/10 flex items-center justify-center">
                    <Users size={18} className="text-success-600" />
                  </div>
                  <h3 className="font-display font-semibold text-lg text-graphite-900">团队成员</h3>
                  <span className="badge badge-success">{members.length} 人</span>
                </div>
                {isAdmin && (
                  <button onClick={() => setShowInvite(true)} className="btn-primary !py-2 !px-4">
                    <UserPlus size={16} /> 邀请成员
                  </button>
                )}
              </div>
              <div className="divide-y divide-graphite-100">
                {members.map((m, i) => {
                  const isOwner = m.id === project.ownerId;
                  return (
                    <div key={m.id || i} className="px-6 py-4 flex items-center gap-4 hover:bg-graphite-50/60 transition-colors">
                      <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold shadow-sm"
                        style={{ backgroundColor: m.color }}>
                        {m.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-graphite-900">{m.name}</span>
                          {isOwner && <span className="badge bg-warning-500 text-white"><Crown size={11} /> 所有者</span>}
                        </div>
                        <div className="text-xs text-graphite-500 truncate">{m.email}</div>
                      </div>

                      {!isOwner && (
                        editingRole === m.id ? (
                          <div className="flex items-center gap-1.5 animate-fade-in">
                            {ROLE_OPTIONS.map(opt => (
                              <button key={opt.key} onClick={() => changeRole(m.id, opt.key)}
                                className={cn(
                                  'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                                  m.role === opt.key
                                    ? 'bg-electric-500 border-electric-500 text-white'
                                    : 'bg-white border-graphite-200 text-graphite-600 hover:border-electric-300'
                                )}>
                                {opt.label}
                              </button>
                            ))}
                            <button onClick={() => setEditingRole(null)} className="p-1.5 rounded-lg hover:bg-graphite-100 text-graphite-400">
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <span className={cn('badge cursor-pointer', ROLE_OPTIONS.find(r => r.key === m.role)?.badge)}
                            onClick={() => isAdmin && setEditingRole(m.id)}
                            title={isAdmin ? '点击修改权限' : ''}>
                            {ROLE_OPTIONS.find(r => r.key === m.role)?.Icon &&
                              React.createElement(ROLE_OPTIONS.find(r => r.key === m.role)!.Icon, { size: 11 })}
                            {ROLE_OPTIONS.find(r => r.key === m.role)?.label}
                          </span>
                        )
                      )}
                      {isOwner && <span className="text-[11px] text-graphite-400 w-24 text-right font-mono">
                        {new Date(m.joinedAt || Date.now()).toLocaleDateString('zh-CN')}
                      </span>}

                      {isAdmin && !isOwner && editingRole !== m.id && (
                        <div className="relative">
                          <button className="p-1.5 rounded-lg hover:bg-graphite-100 text-graphite-400 hover:text-danger-500">
                            <MoreVertical size={16} />
                          </button>
                          <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-glass border border-graphite-100 py-1 hidden group-hover:block z-10">
                            <button onClick={() => removeMember(m.id)}
                              className="w-full px-4 py-2 text-sm text-left hover:bg-danger-500/10 text-danger-500 flex items-center gap-2">
                              <Trash2 size={14} /> 移除成员
                            </button>
                          </div>
                        </div>
                      )}
                      {isAdmin && !isOwner && editingRole !== m.id && (
                        <button onClick={() => removeMember(m.id)}
                          className="p-1.5 rounded-lg hover:bg-danger-500/10 text-graphite-400 hover:text-danger-500"
                          title="移除成员">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="px-6 py-5 bg-graphite-50 border-t border-graphite-100">
                <h4 className="text-xs font-semibold text-graphite-500 uppercase tracking-wider mb-3">权限说明</h4>
                <div className="grid grid-cols-3 gap-4">
                  {ROLE_OPTIONS.map(opt => (
                    <div key={opt.key} className="p-4 rounded-xl bg-white border border-graphite-100">
                      <span className={cn('badge mb-3', opt.badge)}>
                        <opt.Icon size={11} /> {opt.label}
                      </span>
                      <p className="text-xs text-graphite-500 leading-relaxed">{opt.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showInvite && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-in">
            <div className="px-6 py-5 border-b border-graphite-100 flex items-center justify-between">
              <h3 className="font-display font-semibold text-xl text-graphite-900 flex items-center gap-2">
                <UserPlus size={22} className="text-electric-500" /> 邀请成员
              </h3>
              <button onClick={() => setShowInvite(false)} className="p-1.5 rounded-lg hover:bg-graphite-100 text-graphite-400">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={doInvite} className="p-6 space-y-5">
              <div>
                <label className="text-xs font-semibold text-graphite-600 mb-1.5 block">成员邮箱</label>
                <input autoFocus type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                  className="input py-2.5" placeholder="teammate@company.com" required />
                <p className="mt-2 text-[11px] text-graphite-400 leading-relaxed">
                  演示环境可用邮箱：<code className="bg-graphite-100 px-1.5 py-0.5 rounded">zhangsan@example.com</code>、
                  <code className="bg-graphite-100 px-1.5 py-0.5 rounded">lisi@example.com</code>、
                  <code className="bg-graphite-100 px-1.5 py-0.5 rounded">wangwu@example.com</code>
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-graphite-600 mb-2 block">分配角色</label>
                <div className="space-y-2">
                  {ROLE_OPTIONS.map(opt => (
                    <label key={opt.key} className={cn(
                      'flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all',
                      inviteRole === opt.key
                        ? 'border-electric-500 bg-electric-50/50 ring-2 ring-electric-200'
                        : 'border-graphite-200 hover:border-graphite-300 bg-white'
                    )}>
                      <input type="radio" name="role" className="sr-only" checked={inviteRole === opt.key}
                        onChange={() => setInviteRole(opt.key)} />
                      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center',
                        inviteRole === opt.key ? `${opt.badge}` : 'bg-graphite-100 text-graphite-500')}>
                        <opt.Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-graphite-800">{opt.label}</div>
                        <div className="text-[11px] text-graphite-500 mt-0.5">{opt.desc}</div>
                      </div>
                      {inviteRole === opt.key && <Check size={18} className="text-electric-500" />}
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowInvite(false)} className="btn-secondary !py-2.5">取消</button>
                <button type="submit" disabled={inviting || !inviteEmail.trim()}
                  className="btn-primary !py-2.5 shadow-lg shadow-electric-500/25 disabled:opacity-50">
                  {inviting ? '邀请中...' : '发送邀请'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectSettingsPage;
