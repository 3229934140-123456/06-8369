import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '../store/useUserStore.js';
import { ArrowRight, Workflow, Layers, GitBranch, Users, Zap, ShieldCheck, Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useUserStore(s => s.login);
  const loading = useUserStore(s => s.loading);
  const [email, setEmail] = useState('zhangsan@example.com');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState('');

  const from = (location.state as any)?.from?.pathname ?? '/dashboard';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message ?? '登录失败');
    }
  };

  return (
    <div className="h-full w-full relative overflow-hidden flex">
      <div className="hidden lg:flex lg:w-1/2 flex-col relative bg-hero-gradient text-white overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <svg width="100%" height="100%" viewBox="0 0 800 900" fill="none" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="lg1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            <g stroke="url(#lg1)" strokeWidth="2" fill="none" opacity="0.8">
              <rect x="80" y="120" width="180" height="80" rx="12" className="animate-float" />
              <rect x="500" y="80" width="160" height="90" rx="18" style={{ animationDelay: '1s' }} className="animate-float" />
              <polygon points="320,300 410,360 320,420 230,360" />
              <ellipse cx="620" cy="280" rx="70" ry="40" />
              <rect x="100" y="480" width="220" height="110" rx="8" />
              <path d="M 260 200 L 320 300 M 580 170 L 365 340 M 620 320 L 580 460 M 210 440 L 380 380" strokeDasharray="6 6" />
              <circle cx="680" cy="560" r="60" />
              <path d="M 300 620 Q 500 580 700 640" strokeDasharray="4 8" />
              <path d="M 120 750 L 250 700 L 380 750 L 520 690 L 660 750" />
            </g>
          </svg>
        </div>
        <div className="relative z-10 flex-1 flex flex-col p-12">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
              <Workflow size={26} />
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl">FlowSync</h1>
              <p className="text-xs text-white/70 mt-0.5">协作绘图画板</p>
            </div>
          </div>

          <div className="flex-1 max-w-md">
            <h2 className="font-display font-bold text-4xl leading-tight mb-4">
              为技术团队打造的
              <span className="bg-gradient-to-r from-electric-400 to-success-500 bg-clip-text text-transparent"> 协作绘图平台</span>
            </h2>
            <p className="text-white/80 text-lg mb-12 leading-relaxed">
              多人实时协作、版本回溯、图表讨论，一站式搞定流程图、架构图、ER图与时序图。
            </p>

            <div className="grid grid-cols-2 gap-4">
              {[
                { Icon: Zap, title: '实时协作', desc: '毫秒级同步，所见即所得' },
                { Icon: Layers, title: '丰富图表', desc: '5类专业形状库' },
                { Icon: GitBranch, title: '版本管理', desc: '任意历史一键回溯' },
                { Icon: ShieldCheck, title: '权限管控', desc: '按角色精细授权' },
              ].map(({ Icon, title, desc }) => (
                <div key={title} className="p-4 rounded-xl bg-white/5 backdrop-blur border border-white/10 hover:bg-white/10 transition-colors">
                  <Icon size={22} className="text-electric-400 mb-2" />
                  <div className="text-sm font-semibold mb-0.5">{title}</div>
                  <div className="text-xs text-white/60">{desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6 pt-8 text-xs text-white/50">
            <div className="flex -space-x-2">
              {[
                { c: '#3B82F6', n: '张' },
                { c: '#10B981', n: '李' },
                { c: '#F59E0B', n: '王' },
                { c: '#F43F5E', n: '赵' },
              ].map(u => (
                <div key={u.n} className="w-8 h-8 rounded-full border-2 border-indigo-800 flex items-center justify-center text-[11px] font-bold" style={{ backgroundColor: u.c }}>
                  {u.n}
                </div>
              ))}
            </div>
            <div>
              <Users size={12} className="inline mr-1.5 -mt-0.5 opacity-70" />
              已有 <b className="text-white/80">12,000+</b> 团队正在使用
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-gradient-to-br from-graphite-50 via-white to-electric-50/40">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-indigo-700 text-white flex items-center justify-center">
              <Workflow size={22} />
            </div>
            <h1 className="font-display font-bold text-xl text-graphite-800">FlowSync</h1>
          </div>

          <div className="mb-8">
            <h2 className="font-display font-bold text-3xl text-graphite-900 mb-2">欢迎回来 👋</h2>
            <p className="text-graphite-500">登录以继续你的架构与流程设计</p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-graphite-600 mb-1.5 block">邮箱</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="input py-2.5" placeholder="you@company.com" />
            </div>
            <div>
              <label className="text-xs font-semibold text-graphite-600 mb-1.5 block flex justify-between">
                密码
                <span className="font-normal text-graphite-400 cursor-pointer hover:text-electric-500">忘记密码?</span>
              </label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="input py-2.5" placeholder="••••••••" />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-danger-500/10 border border-danger-500/30 text-danger-500 text-sm">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full btn-primary !py-3 text-base font-semibold shadow-lg shadow-electric-500/25 disabled:opacity-60">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <><span>登录 FlowSync</span><ArrowRight size={18} /></>}
            </button>
          </form>

          <div className="mt-8 p-4 rounded-xl bg-gradient-to-br from-electric-50 to-success-50/60 border border-electric-100">
            <div className="text-xs font-semibold text-electric-600 mb-2 flex items-center gap-1.5">
              <Zap size={14} /> 体验模式
            </div>
            <p className="text-xs text-graphite-600 mb-3 leading-relaxed">
              点击上方按钮，使用演示账号登录（已为你预填），立即体验协作编辑、版本回溯等所有功能。
            </p>
            <button type="button" onClick={submit} className="w-full btn-secondary !py-2 text-sm font-medium border-electric-200 text-electric-700 hover:bg-white">
              使用演示账号进入
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-graphite-400">
            登录即代表你同意 <a className="text-electric-500 hover:underline">服务条款</a> 与 <a className="text-electric-500 hover:underline">隐私政策</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
