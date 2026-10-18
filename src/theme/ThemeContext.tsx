import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { THEME_PRESETS, type ThemeMode, type ThemePreset } from './themeConfig.ts';

interface ThemeContextType {
  mode: ThemeMode;
  resolvedMode: 'dark' | 'light';
  preset: ThemePreset;
  setMode: (mode: ThemeMode) => void;
  setPreset: (preset: ThemePreset) => void;
  toggleMode: () => void;
  resetToDefault: () => void;
  currentPresetDef: (typeof THEME_PRESETS)[0];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Read saved mode or default to system
  const [mode, setModeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('workspace_theme_mode') as ThemeMode;
      if (saved && (saved === 'dark' || saved === 'light' || saved === 'system')) {
        return saved;
      }
    } catch {}
    return 'dark'; // Default dark for enterprise AI workspace
  });

  // Read saved preset or default to carbon-black (Theme 1: Deep Pure Black)
  const [preset, setPresetState] = useState<ThemePreset>(() => {
    try {
      const saved = localStorage.getItem('workspace_theme_preset') as ThemePreset;
      if (saved && THEME_PRESETS.some((p) => p.id === saved)) {
        return saved;
      }
    } catch {}
    return 'carbon-black';
  });

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  // Listen to OS theme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const resolvedMode: 'dark' | 'light' = useMemo(() => {
    if (mode === 'system') {
      return systemIsDark ? 'dark' : 'light';
    }
    return mode;
  }, [mode, systemIsDark]);

  const currentPresetDef = useMemo(() => {
    return THEME_PRESETS.find((p) => p.id === preset) || THEME_PRESETS[0];
  }, [preset]);

  // Apply CSS variables and classes to document root
  useEffect(() => {
    const root = document.documentElement;

    // Apply dark/light class
    if (resolvedMode === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }

    root.setAttribute('data-theme', preset);
    root.setAttribute('data-mode', resolvedMode);

    // Apply tokens
    const tokens = currentPresetDef.vars[resolvedMode];
    Object.entries(tokens).forEach(([key, val]) => {
      root.style.setProperty(key, val);
    });
  }, [resolvedMode, preset, currentPresetDef]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem('workspace_theme_mode', newMode);
    } catch {}
  };

  const setPreset = (newPreset: ThemePreset) => {
    setPresetState(newPreset);
    try {
      localStorage.setItem('workspace_theme_preset', newPreset);
    } catch {}
  };

  const toggleMode = () => {
    const next = resolvedMode === 'dark' ? 'light' : 'dark';
    setMode(next);
  };

  const resetToDefault = () => {
    setMode('dark');
    setPreset('carbon-black');
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        resolvedMode,
        preset,
        setMode,
        setPreset,
        toggleMode,
        resetToDefault,
        currentPresetDef,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
