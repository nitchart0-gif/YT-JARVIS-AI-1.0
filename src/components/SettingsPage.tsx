import React from 'react';
import {
  Palette,
  Sun,
  Moon,
  Laptop,
  Check,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Cpu,
  Info,
} from 'lucide-react';
import { useTheme } from '../theme/ThemeContext.tsx';
import { THEME_PRESETS, type ThemeMode, type ThemePreset } from '../theme/themeConfig.ts';

export const SettingsPage: React.FC = () => {
  const { mode, resolvedMode, preset, setMode, setPreset, resetToDefault } = useTheme();

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center space-x-3.5">
          <div
            className="p-3 rounded-xl text-black shadow-md"
            style={{
              backgroundColor: 'var(--accent-primary)',
              boxShadow: '0 0 16px -2px var(--accent-glow)',
            }}
          >
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              Appearance & Settings
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Customize visual presets, color modes, and workspace interface settings.
            </p>
          </div>
        </div>

        <button
          onClick={resetToDefault}
          className="px-3.5 py-2 rounded-xl text-xs font-medium border flex items-center space-x-1.5 transition-colors self-start sm:self-auto cursor-pointer"
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-secondary)',
          }}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Default</span>
        </button>
      </div>

      {/* 1. Dark / Light Mode Switcher */}
      <section
        className="rounded-2xl p-6 border shadow-xl backdrop-blur-md"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent-primary)' }}>
            <Sun className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Color Mode
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Choose between Dark mode, Light mode, or follow your system settings.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {[
            { id: 'dark' as ThemeMode, label: 'Dark Mode', icon: Moon, desc: 'Optimized for low-light deep focus' },
            { id: 'light' as ThemeMode, label: 'Light Mode', icon: Sun, desc: 'High-contrast bright daylight theme' },
            { id: 'system' as ThemeMode, label: 'System Default', icon: Laptop, desc: 'Syncs automatically with device OS' },
          ].map((item) => {
            const isSelected = mode === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setMode(item.id)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected ? 'ring-2' : ''
                }`}
                style={{
                  backgroundColor: isSelected ? 'var(--bg-surface-elevated)' : 'var(--bg-base)',
                  borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)',
                  boxShadow: isSelected ? '0 0 16px var(--accent-glow)' : 'none',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4" style={{ color: isSelected ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
                    <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                      {item.label}
                    </span>
                  </div>
                  {isSelected && <Check className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />}
                </div>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {item.desc}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Visual Theme Presets */}
      <section
        className="rounded-2xl p-6 border shadow-xl backdrop-blur-md"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent-primary)' }}>
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Visual Presets
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Select a specialized color theme. Each preset adapts cleanly to both Light and Dark modes.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {THEME_PRESETS.map((p) => {
            const isCurrent = preset === p.id;
            return (
              <div
                key={p.id}
                onClick={() => setPreset(p.id)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                  isCurrent ? 'ring-2' : 'hover:scale-[1.01]'
                }`}
                style={{
                  backgroundColor: isCurrent ? 'var(--bg-surface-elevated)' : 'var(--bg-base)',
                  borderColor: isCurrent ? 'var(--accent-primary)' : 'var(--border-subtle)',
                  boxShadow: isCurrent ? '0 0 20px var(--accent-glow)' : 'none',
                }}
              >
                {/* Visual Palette Preview Header */}
                <div
                  className="rounded-lg p-2.5 mb-3 flex items-center justify-between border"
                  style={{
                    backgroundColor: p.previewBg,
                    borderColor: 'rgba(128, 128, 128, 0.25)',
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded shadow-sm"
                      style={{
                        backgroundColor: p.previewCard,
                        color: p.previewText,
                        border: `1px solid ${p.previewAccent}40`,
                      }}
                    >
                      Card Surface
                    </span>
                    <span
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold"
                      style={{
                        backgroundColor: `${p.previewAccent}25`,
                        color: p.previewAccent,
                        border: `1px solid ${p.previewAccent}`,
                      }}
                    >
                      Accent
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <div className="w-3.5 h-3.5 rounded-full border" style={{ backgroundColor: p.previewBg, borderColor: '#666' }} title="Background" />
                    <div className="w-3.5 h-3.5 rounded-full border" style={{ backgroundColor: p.previewCard, borderColor: '#666' }} title="Surface" />
                    <div className="w-3.5 h-3.5 rounded-full shadow" style={{ backgroundColor: p.previewAccent }} title="Accent" />
                  </div>
                </div>

                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                      {p.name}
                    </span>
                    <span className="ml-2 text-[10px] font-medium" style={{ color: 'var(--accent-text)' }}>
                      {p.tagline}
                    </span>
                  </div>
                  {isCurrent && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center space-x-1"
                      style={{
                        backgroundColor: 'var(--accent-subtle)',
                        color: 'var(--accent-primary)',
                        borderColor: 'var(--border-focus)',
                      }}
                    >
                      <Check className="w-3 h-3" />
                      <span>Active</span>
                    </span>
                  )}
                </div>

                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {p.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. System Architecture & Model Lock Telemetry */}
      <section
        className="rounded-2xl p-6 border shadow-xl backdrop-blur-md"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent-primary)' }}>
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Workspace Architecture
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Core platform configuration and cryptographic integrity status.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div
            className="p-4 rounded-xl border space-y-1"
            style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}
          >
            <div className="font-semibold flex items-center space-x-1.5" style={{ color: 'var(--text-primary)' }}>
              <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
              <span>Mandatory Model</span>
            </div>
            <p className="font-mono text-[11px]" style={{ color: 'var(--accent-text)' }}>
              gemini-3.8-flash
            </p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              Locked constant with zero silent fallback.
            </p>
          </div>

          <div
            className="p-4 rounded-xl border space-y-1"
            style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}
          >
            <div className="font-semibold flex items-center space-x-1.5" style={{ color: 'var(--text-primary)' }}>
              <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
              <span>Key Encryption</span>
            </div>
            <p className="font-mono text-[11px]" style={{ color: 'var(--accent-text)' }}>
              AES-256-GCM
            </p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              Encrypted in memory/server secrets. Zero client exposure.
            </p>
          </div>

          <div
            className="p-4 rounded-xl border space-y-1"
            style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}
          >
            <div className="font-semibold flex items-center space-x-1.5" style={{ color: 'var(--text-primary)' }}>
              <Info className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
              <span>Drive Scope</span>
            </div>
            <p className="font-mono text-[11px]" style={{ color: 'var(--accent-text)' }}>
              drive.file
            </p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              Least-privilege permission for app-specific files.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
