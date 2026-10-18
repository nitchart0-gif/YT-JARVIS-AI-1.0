import React from 'react';
import { type User } from 'firebase/auth';
import {
  Clapperboard,
  X,
  LogOut,
  LogIn,
  User as UserIcon,
  Sun,
  Moon,
} from 'lucide-react';
import { NAVIGATION_ITEMS, type NavigationPageId } from '../../navigation.ts';
import { useTheme } from '../../theme/ThemeContext.tsx';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  activePage: NavigationPageId;
  onSelectPage: (id: NavigationPageId) => void;
  onSignOut: () => void;
  onSignIn?: () => void;
  signingOut: boolean;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  user,
  activePage,
  onSelectPage,
  onSignOut,
  onSignIn,
  signingOut,
}) => {
  const { resolvedMode, toggleMode } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Container */}
      <div
        className="relative w-72 max-w-[85vw] h-full flex flex-col shadow-2xl border-r z-10 animate-in slide-in-from-left duration-200"
        style={{
          backgroundColor: 'var(--bg-base)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        {/* Drawer Header */}
        <div
          className="h-16 flex items-center px-4 border-b justify-between"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center space-x-3">
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center font-bold shadow"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: '#050506',
              }}
            >
              <Clapperboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-black flex items-center space-x-1" style={{ color: 'var(--text-primary)' }}>
                <span style={{ color: 'var(--accent-primary)' }}>JARVIS</span>
                <span>·</span>
                <span>YT-AI</span>
              </h2>
              <p className="text-[10px] font-mono tracking-tight" style={{ color: 'var(--text-muted)' }}>
                CREATOR STUDIO
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border text-xs cursor-pointer"
            style={{
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          {NAVIGATION_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectPage(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-xs font-medium cursor-pointer ${
                  isActive
                    ? 'font-bold shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
                style={{
                  backgroundColor: isActive ? 'var(--accent-primary)' : 'transparent',
                  color: isActive ? '#050506' : 'var(--text-secondary)',
                  boxShadow: isActive ? '0 0 16px -3px var(--accent-glow)' : 'none',
                }}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold tracking-wider ${
                      isActive
                        ? 'bg-black/20 text-black'
                        : 'border'
                    }`}
                    style={{
                      borderColor: isActive ? 'transparent' : 'var(--border-subtle)',
                      color: isActive ? '#050506' : 'var(--accent-text)',
                      backgroundColor: isActive ? 'rgba(0, 0, 0, 0.15)' : 'var(--accent-subtle)',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Drawer Footer */}
        <div
          className="p-4 border-t space-y-3"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          {/* Theme Switcher */}
          <button
            onClick={toggleMode}
            className="w-full flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer"
            style={{
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            <div className="flex items-center space-x-2">
              {resolvedMode === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-400" />
              )}
              <span>{resolvedMode === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </div>
            <span className="text-[10px] font-mono capitalize" style={{ color: 'var(--text-muted)' }}>
              {resolvedMode}
            </span>
          </button>

          {/* User Profile & Sign Out / In */}
          {user ? (
            <div
              className="p-2.5 rounded-xl border flex items-center justify-between"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center space-x-2.5 overflow-hidden">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border"
                    style={{ borderColor: 'var(--border-subtle)' }}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border"
                    style={{
                      backgroundColor: 'var(--accent-subtle)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--accent-primary)',
                    }}
                  >
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                    {user.displayName || 'Google Account'}
                  </div>
                  <div className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                    {user.email}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  onSignOut();
                  onClose();
                }}
                disabled={signingOut}
                className="p-1.5 rounded-lg border text-xs hover:bg-rose-500/10 hover:text-rose-400 transition-colors cursor-pointer"
                style={{
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-secondary)',
                }}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              className="p-2.5 rounded-xl border flex items-center justify-between"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="min-w-0">
                <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Local Creator
                </div>
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  Offline Storage
                </div>
              </div>
              <button
                onClick={() => {
                  if (onSignIn) onSignIn();
                  onClose();
                }}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold text-black cursor-pointer jarvis-gold-btn"
              >
                <LogIn className="w-3.5 h-3.5 text-black" />
                <span>Sign In</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
