import { useState, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Newspaper,
  CheckSquare,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Moon,
  Sun,
  Rss,
  PanelLeft,
  PanelLeftClose,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Badge, Spinner } from './ui';
import { APP_VERSION } from '../lib/appVersion';

const SIDEBAR_LOGO = '/aurum-logo.png';
const SIDEBAR_COLLAPSED_LOGO = '/aurum-logo-collapsed.png';

const navItems = [
  { to: '/', label: 'Central de Notícias', icon: Newspaper, end: true },
  { to: '/fontes', label: 'Fontes de Notícias', icon: Rss, end: false },
  { to: '/aprovacao', label: 'Central de Aprovação', icon: CheckSquare, end: false },
  { to: '/usuarios', label: 'Gestão de Usuários', icon: Users, end: false },
  { to: '/configuracoes', label: 'Configurações & API', icon: Settings, end: false },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { user, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    setMenuOpen(false);
    try {
      await signOut();
      navigate('/login');
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      <aside
        className={`fixed lg:sticky lg:top-0 lg:self-start lg:h-screen lg:overflow-y-auto inset-y-0 left-0 z-40 bg-brand-950 text-brand-100 flex flex-col transform transition-all duration-200 relative ${
          sidebarCollapsed ? 'w-64 lg:w-20' : 'w-64 lg:w-64'
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className={`h-16 flex items-center border-b border-brand-900 ${sidebarCollapsed ? 'justify-center px-3' : 'gap-2 px-5'}`}>
          <div className={`shrink-0 ${sidebarCollapsed ? 'w-8 h-8' : 'w-[172px] h-10'}`}>
            <img
              src={sidebarCollapsed ? SIDEBAR_COLLAPSED_LOGO : SIDEBAR_LOGO}
              alt="Aurum DI"
              className="block h-full w-full object-contain"
            />
          </div>
        </div>

        <nav className={`flex-1 py-4 space-y-1 ${sidebarCollapsed ? 'px-2' : 'px-3'}`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                title={sidebarCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center rounded-lg text-sm font-medium transition-colors ${sidebarCollapsed ? 'justify-center px-2.5 py-3' : 'gap-3 px-3 py-2.5'} ${
                    isActive
                      ? 'bg-gold-500 text-brand-950'
                      : 'text-brand-100 hover:bg-brand-800 hover:text-white'
                  }`
                }
              >
                <Icon size={18} />
                {!sidebarCollapsed && item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-brand-900">
          <button
            onClick={() => setSidebarCollapsed((value) => !value)}
            className={`hidden lg:flex w-full items-center rounded-lg text-sm text-brand-100 hover:bg-brand-800 hover:text-white transition-colors ${sidebarCollapsed ? 'justify-center px-3 py-2' : 'gap-2 px-3 py-2'}`}
            aria-label={sidebarCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
            title={sidebarCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          >
            {sidebarCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
            {!sidebarCollapsed && 'Recolher barra lateral'}
          </button>
          <button
            onClick={toggleTheme}
            title={sidebarCollapsed ? (theme === 'dark' ? 'Tema claro' : 'Tema escuro') : undefined}
            className={`w-full flex items-center rounded-lg text-sm text-brand-100 hover:bg-brand-800 hover:text-white transition-colors ${sidebarCollapsed ? 'justify-center px-3 py-2' : 'gap-2 px-3 py-2'}`}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {!sidebarCollapsed && (theme === 'dark' ? 'Tema claro' : 'Tema escuro')}
          </button>
          {!sidebarCollapsed && (
            <>
              <div className="px-3 py-2 text-xs text-brand-400">
                © {new Date().getFullYear()} Aurum DI
              </div>
              <div className="mx-3 mb-2 rounded-md border border-brand-800 bg-brand-900/60 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wide text-brand-400">
                  Versão do sistema
                </div>
                <div className="mt-0.5 font-mono text-sm font-semibold text-gold-400">
                  v{APP_VERSION}
                </div>
              </div>
            </>
          )}
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            aria-label="Abrir menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="hidden lg:block text-sm font-medium text-slate-500 dark:text-slate-400">
            Inteligência de mercado & briefings
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              aria-label="Alternar tema"
              title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gold-100 text-gold-800 dark:bg-gold-900 dark:text-gold-200 flex items-center justify-center text-sm font-semibold">
                  {(user?.email ?? '?').charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-tight truncate max-w-[180px]">
                    {user?.email}
                  </div>
                  <div className="text-xs text-slate-400 leading-tight">
                    {profile?.role ?? 'viewer'}
                  </div>
                </div>
                <ChevronDown size={16} className="text-slate-400" />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-lg z-40 py-1">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                        {user?.email}
                      </div>
                      <div className="mt-1">
                        <Badge status={profile?.role ?? 'viewer'} />
                      </div>
                    </div>
                    <button
                      onClick={handleSignOut}
                      disabled={signingOut}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
                    >
                      {signingOut ? <Spinner className="w-4 h-4" /> : <LogOut size={16} />}
                      {signingOut ? 'Saindo...' : 'Sair'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
