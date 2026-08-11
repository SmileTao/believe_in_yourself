import { useEffect } from 'react';
import {
  LayoutDashboard,
  Target,
  Flame,
  Timer,
  BarChart3,
  BookOpen,
  Award,
  Settings as SettingsIcon,
  Network,
  Sparkles
} from 'lucide-react';
import { useAppStore } from './store';
import { APP_NAME_ZH, APP_SLOGAN } from '@shared/constants';
import Dashboard from './modules/dashboard/Dashboard';
import TimerPage from './modules/timer/Timer';
import Stats from './modules/stats/Stats';
import Skills from './modules/skills/Skills';
import Journal from './modules/journal/Journal';
import Achievements from './modules/achievements/Achievements';
import Plans from './modules/plans/Plans';
import Habits from './modules/habits/Habits';
import Settings from './modules/settings/Settings';
import Logo from './components/Logo';
import './App.less';

const NAV = [
  { key: 'dashboard', label: '今日', icon: LayoutDashboard },
  { key: 'plans', label: '计划', icon: Target },
  { key: 'habits', label: '打卡', icon: Flame },
  { key: 'timer', label: '番茄钟', icon: Timer },
  { key: 'stats', label: '统计', icon: BarChart3 },
  { key: 'skills', label: '技能树', icon: Network },
  { key: 'journal', label: '复盘', icon: BookOpen },
  { key: 'achievements', label: '成就', icon: Award },
  { key: 'settings', label: '设置', icon: SettingsIcon }
];

function Placeholder({ label }: { label: string }) {
  return (
    <div className="placeholder-module">
      <div className="surface-card">
        <h2>{label}</h2>
        <p className="muted">该模块将在后续阶段开放，敬请期待 🌱</p>
      </div>
    </div>
  );
}

export default function App() {
  const activeModule = useAppStore((s) => s.activeModule);
  const setActiveModule = useAppStore((s) => s.setActiveModule);
  const dbReady = useAppStore((s) => s.dbReady);
  const setDbReady = useAppStore((s) => s.setDbReady);
  const setDbInfo = useAppStore((s) => s.setDbInfo);

  // 启动连通性验证
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ping = await window.api.ping();
        const info = await window.api.dbInfo();
        if (cancelled) return;
        setDbInfo(info);
        setDbReady(Boolean(ping?.ok));
      } catch (err) {
        console.error('[shibie] 连接主进程失败', err);
        setDbReady(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setDbInfo, setDbReady]);

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard />;
      case 'plans':
        return <Plans />;
      case 'habits':
        return <Habits />;
      case 'timer':
        return <TimerPage />;
      case 'stats':
        return <Stats />;
      case 'skills':
        return <Skills />;
      case 'journal':
        return <Journal />;
      case 'achievements':
        return <Achievements />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <Logo size={36} />
          <div className="brand-text">
            <strong>{APP_NAME_ZH}</strong>
            <small>{APP_SLOGAN}</small>
          </div>
        </div>

        <nav className="nav">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = item.key === activeModule;
            return (
              <button
                key={item.key}
                className={`nav-item ${active ? 'active' : ''}`}
                onClick={() => setActiveModule(item.key)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className={`conn ${dbReady ? 'ok' : 'err'}`}>
          <Sparkles size={14} />
          <span>{dbReady ? '本地数据已就绪' : '连接中…'}</span>
        </div>
      </aside>

      <main className="content">{renderModule()}</main>
    </div>
  );
}
