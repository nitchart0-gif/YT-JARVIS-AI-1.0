// src/components/yt-editor/EditorTopBar.tsx
import React, { useState } from 'react';
import {
  Film,
  Undo2,
  Redo2,
  Download,
  FolderOpen,
  Plus,
  Save,
  Check,
  Tv,
  Smartphone,
  Square,
  Sparkles,
  Sliders,
  Volume2,
  Type,
  Maximize2,
} from 'lucide-react';
import {
  EditorProject,
  EditorWorkspaceTab,
  RESOLUTION_PRESETS,
  AspectRatioId,
} from '../../types/editor';

interface EditorTopBarProps {
  project: EditorProject;
  activeWorkspaceTab: EditorWorkspaceTab;
  canUndo: boolean;
  canRedo: boolean;
  isSaved: boolean;
  onUpdateProjectName: (name: string) => void;
  onChangeResolution: (aspectRatioId: AspectRatioId) => void;
  onChangeFrameRate: (fps: 24 | 30 | 60) => void;
  onSelectWorkspaceTab: (tab: EditorWorkspaceTab) => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onNewProject: () => void;
  onOpenProjectManager: () => void;
  onOpenExportModal: () => void;
}

export const EditorTopBar: React.FC<EditorTopBarProps> = ({
  project,
  activeWorkspaceTab,
  canUndo,
  canRedo,
  isSaved,
  onUpdateProjectName,
  onChangeResolution,
  onChangeFrameRate,
  onSelectWorkspaceTab,
  onUndo,
  onRedo,
  onSave,
  onNewProject,
  onOpenProjectManager,
  onOpenExportModal,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(project.settings.name);

  const handleNameSubmit = () => {
    if (tempName.trim()) {
      onUpdateProjectName(tempName.trim());
    } else {
      setTempName(project.settings.name);
    }
    setIsEditingName(false);
  };

  const currentRes = project.settings.resolution;

  return (
    <header
      className="h-14 px-4 flex items-center justify-between border-b select-none shrink-0 gap-3 z-20 backdrop-blur-md"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Left: App Identity & Project Name */}
      <div className="flex items-center space-x-3 shrink-0">
        <div className="flex items-center space-x-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold shadow-md"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--bg-base)',
            }}
          >
            <Film className="w-4 h-4" />
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="font-extrabold tracking-tight text-sm text-[var(--text-primary)]">
              YT EDITOR
            </span>
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase"
              style={{
                backgroundColor: 'var(--accent-subtle)',
                color: 'var(--accent-primary)',
              }}
            >
              STUDIO
            </span>
          </div>
        </div>

        <div className="h-5 w-[1px] bg-[var(--border-subtle)]" />

        {/* Project Name (Editable) */}
        <div className="flex items-center space-x-2">
          {isEditingName ? (
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameSubmit();
                if (e.key === 'Escape') {
                  setTempName(project.settings.name);
                  setIsEditingName(false);
                }
              }}
              autoFocus
              className="px-2 py-1 text-xs font-semibold rounded bg-[var(--bg-surface-elevated)] border border-[var(--border-focus)] text-[var(--text-primary)] outline-none w-56"
            />
          ) : (
            <button
              onClick={() => {
                setTempName(project.settings.name);
                setIsEditingName(true);
              }}
              className="text-xs font-medium text-[var(--text-primary)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-surface-hover)] px-2 py-1 rounded transition-colors flex items-center space-x-1.5 max-w-[200px] truncate"
              title="Click to rename project"
            >
              <span className="truncate">{project.settings.name}</span>
            </button>
          )}

          {/* Saved Status Indicator */}
          <div className="flex items-center text-[10px] text-[var(--text-muted)] space-x-1">
            {isSaved ? (
              <span className="flex items-center text-emerald-400 space-x-0.5" title="All edits saved">
                <Check className="w-3 h-3" />
                <span className="hidden sm:inline">Saved</span>
              </span>
            ) : (
              <span className="text-amber-400 font-medium" title="Unsaved changes">● Unsaved</span>
            )}
          </div>
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center space-x-0.5 ml-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded hover:bg-[var(--bg-surface-hover)] disabled:opacity-30 disabled:hover:bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded hover:bg-[var(--bg-surface-hover)] disabled:opacity-30 disabled:hover:bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Center: Workspace Layout Tabs */}
      <div className="hidden lg:flex items-center rounded-lg p-0.5 bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-xs">
        <button
          onClick={() => onSelectWorkspaceTab('edit')}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-md font-medium transition-all ${
            activeWorkspaceTab === 'edit'
              ? 'bg-[var(--accent-primary)] text-[var(--bg-base)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
          }`}
        >
          <Film className="w-3 h-3" />
          <span>Edit</span>
        </button>
        <button
          onClick={() => onSelectWorkspaceTab('color')}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-md font-medium transition-all ${
            activeWorkspaceTab === 'color'
              ? 'bg-[var(--accent-primary)] text-[var(--bg-base)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
          }`}
        >
          <Sliders className="w-3 h-3" />
          <span>Color</span>
        </button>
        <button
          onClick={() => onSelectWorkspaceTab('audio')}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-md font-medium transition-all ${
            activeWorkspaceTab === 'audio'
              ? 'bg-[var(--accent-primary)] text-[var(--bg-base)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
          }`}
        >
          <Volume2 className="w-3 h-3" />
          <span>Audio</span>
        </button>
        <button
          onClick={() => onSelectWorkspaceTab('graphics')}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-md font-medium transition-all ${
            activeWorkspaceTab === 'graphics'
              ? 'bg-[var(--accent-primary)] text-[var(--bg-base)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
          }`}
        >
          <Type className="w-3 h-3" />
          <span>Titles</span>
        </button>
      </div>

      {/* Right: Project Format Controls & Action Buttons */}
      <div className="flex items-center space-x-2 shrink-0">
        {/* Aspect Ratio Switcher */}
        <div className="flex items-center space-x-1 bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] rounded-lg p-0.5">
          <button
            onClick={() => onChangeResolution('16:9')}
            title="16:9 Widescreen (1920x1080)"
            className={`p-1.5 rounded text-xs flex items-center space-x-1 transition-all ${
              currentRes.id === '16:9'
                ? 'bg-[var(--accent-primary)] text-[var(--bg-base)] font-bold shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Tv className="w-3 h-3" />
            <span className="hidden xl:inline text-[11px]">16:9</span>
          </button>
          <button
            onClick={() => onChangeResolution('9:16')}
            title="9:16 Vertical Shorts (1080x1920)"
            className={`p-1.5 rounded text-xs flex items-center space-x-1 transition-all ${
              currentRes.id === '9:16'
                ? 'bg-[var(--accent-primary)] text-[var(--bg-base)] font-bold shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Smartphone className="w-3 h-3" />
            <span className="hidden xl:inline text-[11px]">Shorts</span>
          </button>
          <button
            onClick={() => onChangeResolution('1:1')}
            title="1:1 Square (1080x1080)"
            className={`p-1.5 rounded text-xs flex items-center space-x-1 transition-all ${
              currentRes.id === '1:1'
                ? 'bg-[var(--accent-primary)] text-[var(--bg-base)] font-bold shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Square className="w-3 h-3" />
            <span className="hidden xl:inline text-[11px]">1:1</span>
          </button>
        </div>

        {/* FPS selector */}
        <select
          value={project.settings.frameRate}
          onChange={(e) => onChangeFrameRate(Number(e.target.value) as 24 | 30 | 60)}
          className="text-[11px] font-semibold bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] rounded-lg px-2 py-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] outline-none cursor-pointer"
          title="Project Timeline Framerate"
        >
          <option value={24}>24 fps (Cinema)</option>
          <option value={30}>30 fps (Video)</option>
          <option value={60}>60 fps (Smooth)</option>
        </select>

        {/* Projects / Open */}
        <button
          onClick={onOpenProjectManager}
          className="p-1.5 text-xs font-medium rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] flex items-center space-x-1.5 transition-colors"
          title="Manage & Load Projects"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Projects</span>
        </button>

        {/* Save */}
        <button
          onClick={onSave}
          className="p-1.5 text-xs font-medium rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] flex items-center space-x-1 transition-colors"
          title="Save Project (Ctrl+S)"
        >
          <Save className="w-3.5 h-3.5" />
        </button>

        {/* Export Video Button */}
        <button
          onClick={onOpenExportModal}
          className="px-3 py-1.5 text-xs font-bold rounded-lg flex items-center space-x-1.5 shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98]"
          style={{
            backgroundColor: 'var(--accent-primary)',
            color: 'var(--bg-base)',
          }}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Video</span>
        </button>
      </div>
    </header>
  );
};
