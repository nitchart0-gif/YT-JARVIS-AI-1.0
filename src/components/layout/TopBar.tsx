import React from 'react';
import { type User } from 'firebase/auth';
import { Menu, Sparkles, LogIn, User as UserIcon, Search, ShieldCheck } from 'lucide-react';
import { NAVIGATION_ITEMS, type NavigationPageId } from '../../navigation.ts';
import { useProject } from '../../context/ProjectContext.tsx';

interface TopBarProps {
  user: User | null;
  activePage: NavigationPageId;
  onOpenMobileDrawer: () => void;
  onSignIn?: () => void;
  onSignOut?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  user,
  activePage,
  onOpenMobileDrawer,
  onSignIn,
}) => {
  const { setCommandPaletteOpen, setJarvisAssistantOpen, isJarvisAssistantOpen, activeProfile } = useProject();
  const currentItem = NAVIGATION_ITEMS.find((item) => item.id === activePage) || NAVIGATION_ITEMS[0];

  return (
    <header
      className="h-16 border-b px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20 backdrop-blur-2xl select-none"
      style={{
        backgroundColor: 'rgba(6, 6, 9, 0.88)',
        borderColor: 'rgba(212, 175, 55, 0.22)',
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.7)',
      }}
    >
      {/* Subtle Top Gold Laser Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#f5d77f] to-transparent opacity-80" />

      {/* Left: Mobile Menu Button & Futuristic HUD Breadcrumb */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        <button
          onClick={onOpenMobileDrawer}
          className="md:hidden p-2 rounded-xl border text-xs cursor-pointer bg-black/50 text-amber-300 hover:bg-amber-500/10"
          style={{ borderColor: 'rgba(212, 175, 55, 0.3)' }}
          aria-label="Open navigation menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center space-x-2 text-[10px] font-mono tracking-widest uppercase">
            <span className="text-[#f5d77f] font-bold">J.A.R.V.I.S. HUD</span>
            <span className="text-amber-500/50">::</span>
            <span className="text-zinc-400">CREATOR STUDIO</span>
            <span className="text-amber-500/50">/</span>
            <span className="text-[#f5d77f] font-bold">{currentItem.label}</span>
          </div>
          <div className="flex items-center space-x-2">
            <h1 className="text-sm font-black tracking-wide text-white uppercase font-mono">
              {currentItem.label}
            </h1>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-amber-500/30 bg-amber-500/10 text-amber-300">
              {activeProfile.aspectRatio}
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls HUD */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Quick Search / Command Palette shortcut */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs cursor-pointer hover:border-amber-400 transition-all bg-black/60 hover:bg-amber-500/10"
          style={{ borderColor: 'rgba(212, 175, 55, 0.3)', color: '#e6d5b8' }}
          title="Open Command Palette (Ctrl+K or Cmd+K)"
        >
          <Search className="w-3.5 h-3.5 text-[#f5d77f]" />
          <span className="text-[11px] font-mono tracking-wider">COMMANDS</span>
          <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono border border-amber-500/30 bg-black/50 text-[#f5d77f]">
            ⌘K
          </kbd>
        </button>

        {/* JARVIS Assistant Trigger */}
        <button
          onClick={() => setJarvisAssistantOpen(!isJarvisAssistantOpen)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
            isJarvisAssistantOpen
              ? 'jarvis-gold-btn'
              : 'border-amber-500/40 bg-black/50 text-amber-300 hover:border-amber-300 hover:bg-amber-500/15'
          }`}
          title="Toggle JARVIS AI Production Assistant"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline font-mono tracking-wider">JARVIS AI</span>
        </button>

        {/* AI Model Indicator */}
        <div className="hidden lg:flex items-center space-x-2 text-[10px] font-mono px-2.5 py-1 rounded-xl border border-amber-500/20 bg-black/50 text-zinc-300">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-sm shadow-amber-400" />
          <span className="text-zinc-400">ENGINE:</span>
          <span className="text-white font-bold">gemini-3.8-flash</span>
        </div>

        {/* Auth status action in TopBar */}
        {user ? (
          <div
            className="flex items-center space-x-2 px-2.5 py-1 rounded-xl border text-xs bg-black/60"
            style={{ borderColor: 'rgba(212, 175, 55, 0.3)' }}
          >
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-5 h-5 rounded-full object-cover border border-amber-400/50"
                referrerPolicy="no-referrer"
              />
            ) : (
              <UserIcon className="w-4 h-4 text-amber-400" />
            )}
            <span className="text-[11px] font-mono text-zinc-200 hidden sm:inline">
              {user.displayName?.split(' ')[0] || 'Creator'}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Active Connection" />
          </div>
        ) : (
          <button
            onClick={onSignIn}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold jarvis-gold-btn cursor-pointer shadow-md"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-mono">Sign In</span>
            <span className="sm:hidden font-mono">Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
