import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Discover } from '@/pages/Discover';
import { MySkills } from '@/pages/MySkills';
import { Settings } from '@/pages/Settings';
import { Compass, Package, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: Compass, label: '技能市集' },
  { to: '/my-skills', icon: Package, label: '我的技能' },
  { to: '/settings', icon: SettingsIcon, label: '设置中心' },
];

function AppLayout() {
  return (
    <div className="flex h-screen bg-background">
      {/* 侧边栏 - 科技感面板 */}
      <aside className="relative flex w-56 flex-col border-r border-border/60 bg-card/80 backdrop-blur-xl">
        {/* 左侧高光边 */}
        <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-primary/40 via-primary/20 to-transparent" />
        <div className="flex h-14 items-center border-b border-border/60 px-6">
          <h1 className="font-display text-lg font-semibold tracking-tight text-foreground">
            SkillHub
          </h1>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary/15 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.2)]'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* 主内容区 */}
      <main className="main-content-bg flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Discover />} />
          <Route path="/my-skills" element={<MySkills />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
