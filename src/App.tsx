import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Discover } from '@/pages/Discover';
import { MySkills } from '@/pages/MySkills';
import { Settings } from '@/pages/Settings';
import { Compass, Package, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: Compass, label: '发现' },
  { to: '/my-skills', icon: Package, label: '我的 Skills' },
  { to: '/settings', icon: SettingsIcon, label: '设置' },
];

function AppLayout() {
  return (
    <div className="flex h-screen bg-background">
      {/* 侧边栏 */}
      <aside className="flex w-56 flex-col border-r bg-card">
        <div className="flex h-14 items-center border-b px-6">
          <h1 className="text-lg font-semibold">SkillHub</h1>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 overflow-auto">
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
