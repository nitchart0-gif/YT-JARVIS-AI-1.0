import React from 'react';
import { type User } from 'firebase/auth';
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  LogIn,
  User as UserIcon,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';
import { NAVIGATION_ITEMS, type NavigationPageId } from '../../navigation.ts';
import { useTheme } from '../../theme/ThemeContext.tsx';

interface SidebarProps {
  user: User | null;
  activePage: NavigationPageId;
  onSelectPage: (id: NavigationPageId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onSignOut: () => void;
  onSignIn?: () => void;
  signingOut: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  activePage,
  onSelectPage,
  collapsed,
  onToggleCollapse,
  onSignOut,
  onSignIn,
  signingOut,
}) => {
  const { resolvedMode, toggleMode } = useTheme();

  return (
    <aside
      className={`hidden md:flex flex-col border-r transition-all duration-300 z-30 select-none relative backdrop-blur-2xl h-screen sticky top-0 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
      style={{
        backgroundColor: 'rgba(6, 6, 9, 0.94)',
        borderColor: 'rgba(212, 175, 55, 0.22)',
        boxShadow: '4px 0 24px -4px rgba(0, 0, 0, 0.8)',
      }}
    >
      {/* Top Futuristic Header & Reactor Emblem */}
      <div
        className="h-20 flex items-center px-4 border-b justify-between relative overflow-hidden"
        style={{ borderColor: 'rgba(212, 175, 55, 0.2)' }}
      >
        {/* Subtle amber beam accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#f5d77f] to-transparent opacity-75" />

        <div className="flex items-center space-x-3 overflow-hidden">
          {/* Animated JARVIS Reactor Emblem */}
          <div className="relative w-11 h-11 flex-shrink-0 flex items-center justify-center">
            {/* Outer spinning ring */}
            <div
              className="absolute inset-0 rounded-full border border-amber-400/40 animate-jarvis-spin-slow"
              style={{
                borderTopColor: '#f5d77f',
                borderRightColor: 'transparent',
              }}
            />
            {/* Inner reverse ring */}
            <div
              className="absolute inset-1.5 rounded-full border border-amber-500/30 animate-jarvis-spin-reverse"
              style={{
                borderBottomColor: '#f5d77f',
                borderLeftColor: 'transparent',
              }}
            />
            {/* Luminous center core */}
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 flex items-center justify-center shadow-lg shadow-amber-500/50">
              <div className="w-2 h-2 rounded-full bg-black/90" />
            </div>
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="text-sm font-black tracking-widest text-[#f5d77f] hud-text-glow font-mono">
                  J.A.R.V.I.S.
                </span>
                <span className="text-[10px] font-mono text-amber-400/70">v4.2</span>
              </div>
              <p className="text-[10px] font-mono tracking-wider text-zinc-400 truncate">
                YT-AI CREATOR STUDIO
              </p>
            </div>
          )}
        </div>

        {/* Collapse toggle button */}
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand Navigation HUD' : 'Collapse Navigation HUD'}
          className="p-1.5 rounded-lg border text-amber-300 hover:text-white transition-all cursor-pointer bg-black/40 hover:bg-amber-500/10"
          style={{ borderColor: 'rgba(212, 175, 55, 0.3)' }}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation HUD Items */}
      <nav className="flex-1 py-4 px-2 space-y-1.5 overflow-y-auto">
        {NAVIGATION_ITEMS.map((item, index) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          const indexCode = `0${index + 1}`.slice(-2);

          return (
            <button
              key={item.id}
              onClick={() => onSelectPage(item.id)}
              title={collapsed ? `${item.label} — ${item.description}` : undefined}
              className={`w-full flex items-center rounded-xl transition-all text-xs cursor-pointer relative group ${
                collapsed ? 'justify-center p-3' : 'px-3 py-2.5 space-x-3'
              } ${
                isActive
                  ? 'border border-amber-400/70 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent text-white font-bold shadow-lg shadow-amber-500/15'
                  : 'border border-transparent hover:border-amber-500/30 hover:bg-amber-500/5 text-zinc-400 hover:text-amber-200'
              }`}
            >
              {/* Luminous Gold Vertical Indicator */}
              {isActive && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-gradient-to-b from-[#ffea9f] via-[#d4af37] to-[#aa841c] rounded-r shadow-sm shadow-amber-400" />
              )}

              {/* Icon with Gold Tint */}
              <Icon
                className={`w-4 h-4 flex-shrink-0 transition-colors ${
                  isActive ? 'text-[#f5d77f]' : 'text-zinc-500 group-hover:text-amber-300'
                }`}
              />

              {!collapsed && (
                <div className="flex-1 flex items-center justify-between overflow-hidden">
                  <div className="flex items-center space-x-2 truncate text-left">
                    <span className="text-[10px] font-mono text-amber-400/50">[{indexCode}]</span>
                    <span className={`truncate tracking-wide ${isActive ? 'text-white' : 'text-zinc-300'}`}>
                      {item.label}
                    </span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold tracking-wider ${
                        isActive
                          ? 'border border-amber-400/60 bg-amber-400/20 text-[#f5d77f]'
                          : 'border border-amber-500/20 bg-black/40 text-amber-400/80'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer HUD: System Telemetry & Auth */}
      <div
        className="p-3 border-t space-y-2.5"
        style={{ borderColor: 'rgba(212, 175, 55, 0.2)' }}
      >
        {/* System Online Status Telemetry */}
        {!collapsed && (
          <div className="flex items-center justify-between text-[10px] font-mono px-2 py-1 rounded bg-black/50 border border-amber-500/20">
            <span className="text-zinc-400">SYS // STATUS</span>
            <span className="flex items-center space-x-1.5 text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>ONLINE</span>
            </span>
          </div>
        )}

        {/* User Card */}
        {user ? (
          <div className={`flex items-center rounded-xl p-2 border ${collapsed ? 'justify-center' : 'justify-between'} border-amber-500/20 bg-black/40`}>
            <div className="flex items-center space-x-2 min-w-0">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-7 h-7 rounded-full border border-amber-400/60 object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 text-xs font-bold">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
              )}
              {!collapsed && (
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">
                    {user.displayName || 'Creator'}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500 truncate">
                    {user.email || 'Authenticated'}
                  </div>
                </div>
              )}
            </div>

            {!collapsed && (
              <button
                onClick={onSignOut}
                disabled={signingOut}
                title="Sign out"
                className="p-1 rounded-lg text-zinc-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            {!collapsed ? (
              <button
                onClick={onSignIn}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold jarvis-gold-btn cursor-pointer shadow-md"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In With Google</span>
              </button>
            ) : (
              <button
                onClick={onSignIn}
                title="Sign in with Google"
                className="w-full flex items-center justify-center p-2 rounded-xl text-black jarvis-gold-btn cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
