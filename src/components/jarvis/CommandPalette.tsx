import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Clapperboard,
  Film,
  FileText,
  ImageIcon,
  Scissors,
  Settings,
  Sparkles,
  Smartphone,
  Tv,
  Plus,
  Palette,
  Check,
  X,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext.tsx';
import { useTheme } from '../../theme/ThemeContext.tsx';
import { NAVIGATION_ITEMS, type NavigationPageId } from '../../navigation.ts';

interface CommandPaletteProps {
  onNavigate: (page: NavigationPageId) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ onNavigate }) => {
  const {
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    activeProfile,
    switchAspectRatio,
    projects,
    selectProject,
    createProject,
    setJarvisAssistantOpen,
  } = useProject();

  const { preset, setPreset } = useTheme();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  interface CommandItem {
    id: string;
    title: string;
    subtitle: string;
    category: 'Tools' | 'Aspect Ratio' | 'Projects' | 'Theme' | 'Actions';
    icon: any;
    action: () => void;
    badge?: string;
  }

  const allCommands: CommandItem[] = [
    // Aspect Ratio commands
    {
      id: 'ratio-916',
      title: 'Switch to 9:16 Vertical Portrait',
      subtitle: '1080x1920 Full HD — YouTube Shorts, TikTok, Instagram Reels',
      category: 'Aspect Ratio',
      icon: Smartphone,
      action: () => {
        switchAspectRatio('9:16');
        setCommandPaletteOpen(false);
      },
      badge: activeProfile.aspectRatio === '9:16' ? 'ACTIVE' : undefined,
    },
    {
      id: 'ratio-169',
      title: 'Switch to 16:9 Widescreen Landscape',
      subtitle: '1920x1080 Full HD — Standard YouTube long-form, documentaries',
      category: 'Aspect Ratio',
      icon: Tv,
      action: () => {
        switchAspectRatio('16:9');
        setCommandPaletteOpen(false);
      },
      badge: activeProfile.aspectRatio === '16:9' ? 'ACTIVE' : undefined,
    },
    // Navigation Tools
    ...NAVIGATION_ITEMS.map((item) => ({
      id: `nav-${item.id}`,
      title: `Open ${item.label}`,
      subtitle: item.description,
      category: 'Tools' as const,
      icon: item.icon,
      action: () => {
        onNavigate(item.id);
        setCommandPaletteOpen(false);
      },
    })),
    // Quick Actions
    {
      id: 'new-916-proj',
      title: 'Create New 9:16 Project',
      subtitle: 'Initialize vertical shorts sequence with safe zones',
      category: 'Actions',
      icon: Plus,
      action: () => {
        createProject(`Shorts Video #${projects.length + 1}`, '9:16');
        onNavigate('scripts');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'new-169-proj',
      title: 'Create New 16:9 Project',
      subtitle: 'Initialize cinematic widescreen sequence',
      category: 'Actions',
      icon: Plus,
      action: () => {
        createProject(`Widescreen Feature #${projects.length + 1}`, '16:9');
        onNavigate('scripts');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'open-jarvis-assistant',
      title: 'Activate JARVIS AI Production Assistant',
      subtitle: 'Contextual script analysis, ratio guidance, and workflow assistance',
      category: 'Actions',
      icon: Sparkles,
      action: () => {
        setJarvisAssistantOpen(true);
        setCommandPaletteOpen(false);
      },
    },
    // Themes
    {
      id: 'theme-jarvis',
      title: 'Theme: JARVIS Black Gold',
      subtitle: 'Obsidian black with metallic gold and restrained neon amber',
      category: 'Theme',
      icon: Palette,
      action: () => {
        setPreset('jarvis-gold');
        setCommandPaletteOpen(false);
      },
      badge: preset === 'jarvis-gold' ? 'ACTIVE' : undefined,
    },
    {
      id: 'theme-carbon',
      title: 'Theme: Carbon Black',
      subtitle: 'Minimal pure black with crisp white monochrome highlights',
      category: 'Theme',
      icon: Palette,
      action: () => {
        setPreset('carbon-black');
        setCommandPaletteOpen(false);
      },
      badge: preset === 'carbon-black' ? 'ACTIVE' : undefined,
    },
  ];

  // Filter commands by query
  const filtered = allCommands.filter(
    (cmd) =>
      cmd.title.toLowerCase().includes(query.toLowerCase()) ||
      cmd.subtitle.toLowerCase().includes(query.toLowerCase()) ||
      cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(filtered.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(filtered.length, 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setCommandPaletteOpen(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        style={{
          backgroundColor: 'var(--bg-surface-elevated)',
          borderColor: 'var(--border-subtle)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 35px var(--accent-glow)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div
          className="flex items-center px-4 py-3.5 border-b"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <Search className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, tool name, or aspect ratio (9:16 / 16:9)..."
            className="flex-1 bg-transparent px-3 text-sm focus:outline-none placeholder:text-zinc-500"
            style={{ color: 'var(--text-primary)' }}
          />
          <kbd
            className="px-2 py-0.5 rounded text-[11px] font-mono border"
            style={{
              backgroundColor: 'var(--bg-base)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-muted)',
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              No commands matching "{query}"
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;

              return (
                <button
                  key={cmd.id}
                  onClick={cmd.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected ? 'ring-1' : ''
                  }`}
                  style={{
                    backgroundColor: isSelected ? 'var(--bg-surface-hover)' : 'transparent',
                    boxShadow: isSelected ? '0 0 0 1px var(--border-focus)' : 'none',
                  }}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className="p-2 rounded-lg border flex-shrink-0"
                      style={{
                        backgroundColor: isSelected ? 'var(--accent-subtle)' : 'var(--bg-base)',
                        borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)',
                        color: isSelected ? 'var(--accent-text)' : 'var(--text-secondary)',
                      }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {cmd.title}
                        </span>
                        {cmd.badge && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold"
                            style={{
                              backgroundColor: 'var(--accent-subtle)',
                              color: 'var(--accent-primary)',
                            }}
                          >
                            {cmd.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                        {cmd.subtitle}
                      </p>
                    </div>
                  </div>

                  <span
                    className="text-[11px] font-mono px-2 py-0.5 rounded border flex-shrink-0 ml-2"
                    style={{
                      backgroundColor: 'var(--bg-base)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {cmd.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div
          className="px-4 py-2 border-t flex items-center justify-between text-[11px] font-mono"
          style={{
            backgroundColor: 'var(--bg-base)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-muted)',
          }}
        >
          <div className="flex items-center space-x-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span style={{ color: 'var(--accent-primary)' }}>JARVIS Command HUD</span>
            <span>·</span>
            <span>v2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
