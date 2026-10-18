// src/components/yt-editor/EditorProjectManagerModal.tsx
import React, { useState } from 'react';
import {
  X,
  FolderOpen,
  Plus,
  Trash2,
  Copy,
  Calendar,
  Clock,
  Sparkles,
  Film,
  Tv,
  Smartphone,
} from 'lucide-react';
import { EditorProject, RESOLUTION_PRESETS } from '../../types/editor';
import { createInitialEditorProject } from '../../services/editorDefaults';

export interface SavedProjectMeta {
  id: string;
  name: string;
  resolutionId: string;
  duration: number;
  updatedAt: number;
  clipsCount: number;
}

interface EditorProjectManagerModalProps {
  isOpen: boolean;
  currentProjectId: string;
  savedProjects: SavedProjectMeta[];
  onClose: () => void;
  onLoadProject: (projectId: string) => void;
  onNewProject: (name: string, aspectRatioId: '16:9' | '9:16') => void;
  onDeleteProject: (projectId: string) => void;
  onDuplicateProject: (projectId: string) => void;
}

export const EditorProjectManagerModal: React.FC<EditorProjectManagerModalProps> = ({
  isOpen,
  currentProjectId,
  savedProjects,
  onClose,
  onLoadProject,
  onNewProject,
  onDeleteProject,
  onDuplicateProject,
}) => {
  if (!isOpen) return null;

  const [newProjectName, setNewProjectName] = useState('New Video Cut');
  const [newProjectAspect, setNewProjectAspect] = useState<'16:9' | '9:16'>('16:9');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    onNewProject(newProjectName.trim(), newProjectAspect);
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div
        className="w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        style={{
          backgroundColor: 'var(--bg-surface-elevated)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        {/* Top Header */}
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--bg-base)',
              }}
            >
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                YT EDITOR Projects
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Manage, load, or create non-linear timeline projects
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar text-xs">
          {/* New Project Button / Form */}
          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-2.5 rounded-xl border border-dashed border-[var(--border-subtle)] hover:border-[var(--accent-primary)] hover:bg-[var(--bg-surface-hover)] text-[var(--accent-primary)] font-semibold flex items-center justify-center space-x-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Project</span>
            </button>
          ) : (
            <form
              onSubmit={handleCreateSubmit}
              className="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-3"
            >
              <span className="font-bold text-[var(--text-primary)]">
                New Project Setup
              </span>

              <div className="space-y-1">
                <label className="text-[11px] text-[var(--text-secondary)]">
                  Project Title
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  autoFocus
                  className="w-full px-3 py-1.5 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-[var(--text-secondary)]">
                  Target Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewProjectAspect('16:9')}
                    className={`py-2 rounded-lg border text-center font-medium flex items-center justify-center space-x-1.5 transition-all ${
                      newProjectAspect === '16:9'
                        ? 'bg-[var(--accent-primary)] text-[var(--bg-base)] border-[var(--accent-primary)] shadow-sm'
                        : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
                    }`}
                  >
                    <Tv className="w-3.5 h-3.5" />
                    <span>16:9 (1920x1080)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewProjectAspect('9:16')}
                    className={`py-2 rounded-lg border text-center font-medium flex items-center justify-center space-x-1.5 transition-all ${
                      newProjectAspect === '9:16'
                        ? 'bg-[var(--accent-primary)] text-[var(--bg-base)] border-[var(--accent-primary)] shadow-sm'
                        : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>9:16 Shorts (1080x1920)</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold shadow"
                  style={{
                    backgroundColor: 'var(--accent-primary)',
                    color: 'var(--bg-base)',
                  }}
                >
                  Create Project
                </button>
              </div>
            </form>
          )}

          {/* Project List */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Saved Sequences ({savedProjects.length})
            </span>

            {savedProjects.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] py-4 text-center">
                No saved projects found.
              </p>
            ) : (
              savedProjects.map((p) => {
                const isCurrent = p.id === currentProjectId;

                return (
                  <div
                    key={p.id}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      isCurrent
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-subtle)] shadow-sm'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)]'
                    }`}
                  >
                    <div
                      className="min-w-0 cursor-pointer flex-1"
                      onClick={() => onLoadProject(p.id)}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-[var(--text-primary)] truncate text-xs">
                          {p.name}
                        </span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[var(--accent-primary)] text-[var(--bg-base)]">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                        {p.resolutionId} • {p.duration}s • {p.clipsCount} clips • Updated {new Date(p.updatedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0 ml-2">
                      <button
                        onClick={() => onDuplicateProject(p.id)}
                        className="p-1.5 rounded hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        title="Duplicate Project"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteProject(p.id)}
                        className="p-1.5 rounded hover:bg-[var(--bg-surface-hover)] text-rose-400 hover:text-rose-300"
                        title="Delete Project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
