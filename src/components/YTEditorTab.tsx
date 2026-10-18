// src/components/YTEditorTab.tsx
// YT EDITOR — Professional, Lightweight Non-Linear Video Editing Studio

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  EditorProject,
  Clip,
  MediaAsset,
  AspectRatioId,
  EditorWorkspaceTab,
  TimelineTool,
  RESOLUTION_PRESETS,
} from '../types/editor';
import {
  createInitialEditorProject,
  convertScriptToEditorProject,
} from '../services/editorDefaults';
import { EditorTopBar } from './yt-editor/EditorTopBar';
import { EditorMediaBin } from './yt-editor/EditorMediaBin';
import { EditorPreviewMonitor } from './yt-editor/EditorPreviewMonitor';
import { EditorTimeline } from './yt-editor/EditorTimeline';
import { EditorInspector } from './yt-editor/EditorInspector';
import { EditorExportModal } from './yt-editor/EditorExportModal';
import {
  EditorProjectManagerModal,
  SavedProjectMeta,
} from './yt-editor/EditorProjectManagerModal';
import { ScriptGenerationResponse } from '../services/api';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useProject } from '../context/ProjectContext.tsx';

interface YTEditorTabProps {
  userId: string;
  transferredScript?: ScriptGenerationResponse | null;
  transferredSourceTitle?: string;
  onNavigateToScripts?: () => void;
  onNavigateToSources?: () => void;
}

export const YTEditorTab: React.FC<YTEditorTabProps> = ({
  userId,
  transferredScript,
  transferredSourceTitle = 'Untitled Story',
  onNavigateToScripts,
  onNavigateToSources,
}) => {
  const { activeProject, activeProfile, switchAspectRatio } = useProject();
  const effectiveScript = transferredScript || activeProject?.scriptData || null;
  const effectiveSourceTitle =
    (transferredSourceTitle && transferredSourceTitle !== 'Untitled Story')
      ? transferredSourceTitle
      : (activeProject?.scriptData?.sourceTitle || activeProject?.name || 'Untitled Story');

  // 1. Storage Keys
  const projectListKey = `yt_editor_projects_list_${userId}`;
  const getProjectKey = (id: string) => `yt_editor_project_${userId}_${id}`;

  // 2. Load or Initialize Project
  const [project, setProject] = useState<EditorProject>(() => {
    try {
      const savedListRaw = localStorage.getItem(projectListKey);
      if (savedListRaw) {
        const list: SavedProjectMeta[] = JSON.parse(savedListRaw);
        if (list.length > 0) {
          const latestId = list[0].id;
          const savedData = localStorage.getItem(getProjectKey(latestId));
          if (savedData) {
            return JSON.parse(savedData);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load project from localStorage:', e);
    }
    return createInitialEditorProject(`proj_${Date.now()}`);
  });

  // Undo / Redo History
  const [historyPast, setHistoryPast] = useState<EditorProject[]>([]);
  const [historyFuture, setHistoryFuture] = useState<EditorProject[]>([]);
  const [isSaved, setIsSaved] = useState(true);

  // Playback & Timeline State
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(45); // px per second
  const [activeTool, setActiveTool] = useState<TimelineTool>('select');
  const [snappingEnabled, setSnappingEnabled] = useState(true);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [loopPlayback, setLoopPlayback] = useState(false);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<EditorWorkspaceTab>('edit');

  // Modals
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);
  const [savedProjectsList, setSavedProjectsList] = useState<SavedProjectMeta[]>([]);

  // Animation frame ref for smooth playback loop
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // Push to Undo history before mutations
  const pushHistory = useCallback((currentProj: EditorProject) => {
    setHistoryPast((prev) => [...prev.slice(-25), JSON.parse(JSON.stringify(currentProj))]);
    setHistoryFuture([]);
    setIsSaved(false);
  }, []);

  // Save Project to LocalStorage
  const handleSaveProject = useCallback(() => {
    try {
      localStorage.setItem(getProjectKey(project.settings.id), JSON.stringify(project));

      // Update project list
      const meta: SavedProjectMeta = {
        id: project.settings.id,
        name: project.settings.name,
        resolutionId: project.settings.resolution.id,
        duration: project.settings.duration,
        updatedAt: Date.now(),
        clipsCount: project.clips.length,
      };

      const existingRaw = localStorage.getItem(projectListKey);
      let list: SavedProjectMeta[] = existingRaw ? JSON.parse(existingRaw) : [];
      list = [meta, ...list.filter((p) => p.id !== meta.id)];
      localStorage.setItem(projectListKey, JSON.stringify(list));
      setSavedProjectsList(list);
      setIsSaved(true);
    } catch (e) {
      console.error('Error saving project:', e);
    }
  }, [project, projectListKey]);

  // Load project list on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(projectListKey);
      if (raw) {
        setSavedProjectsList(JSON.parse(raw));
      }
    } catch (e) {
      console.warn('Error reading project list:', e);
    }
  }, [projectListKey]);

  // Debounced auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSaveProject();
    }, 2000);
    return () => clearTimeout(timer);
  }, [project, handleSaveProject]);

  // Playback requestAnimationFrame Loop
  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = performance.now();

      const loop = (time: number) => {
        const delta = (time - lastTimeRef.current) / 1000;
        lastTimeRef.current = time;

        setCurrentTime((prev) => {
          const next = prev + delta;
          if (next >= project.settings.duration) {
            if (loopPlayback) {
              return 0;
            } else {
              setIsPlaying(false);
              return project.settings.duration;
            }
          }
          return next;
        });

        animFrameRef.current = requestAnimationFrame(loop);
      };

      animFrameRef.current = requestAnimationFrame(loop);
    } else {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, project.settings.duration, loopPlayback]);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if typing inside input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedClipId) {
          e.preventDefault();
          handleDeleteClip(selectedClipId);
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveProject();
      } else if (e.key.toLowerCase() === 'v') {
        setActiveTool('select');
      } else if (e.key.toLowerCase() === 'c') {
        setActiveTool('razor');
      } else if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey) {
        setSnappingEnabled((prev) => !prev);
      } else if (e.key === 'Home') {
        e.preventDefault();
        setCurrentTime(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setCurrentTime(project.settings.duration);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentTime((prev) => Math.max(0, prev - 1 / project.settings.frameRate));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentTime((prev) => Math.min(project.settings.duration, prev + 1 / project.settings.frameRate));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClipId, project.settings.duration, project.settings.frameRate, handleSaveProject]);

  // Undo / Redo Actions
  const handleUndo = () => {
    if (historyPast.length === 0) return;
    const previous = historyPast[historyPast.length - 1];
    setHistoryPast((prev) => prev.slice(0, prev.length - 1));
    setHistoryFuture((prev) => [JSON.parse(JSON.stringify(project)), ...prev]);
    setProject(previous);
  };

  const handleRedo = () => {
    if (historyFuture.length === 0) return;
    const next = historyFuture[0];
    setHistoryFuture((prev) => prev.slice(1));
    setHistoryPast((prev) => [...prev, JSON.parse(JSON.stringify(project))]);
    setProject(next);
  };

  // Mutators for Project Settings
  const handleUpdateProjectSettings = (settingsPartial: Partial<EditorProject['settings']>) => {
    pushHistory(project);
    setProject((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...settingsPartial,
        updatedAt: Date.now(),
      },
    }));
  };

  // Synchronize sequence dimensions with canonical active profile
  useEffect(() => {
    if (activeProfile?.aspectRatio && (activeProfile.aspectRatio === '9:16' || activeProfile.aspectRatio === '16:9')) {
      if (project.settings.resolution.id !== activeProfile.aspectRatio) {
        const matched = RESOLUTION_PRESETS.find((r) => r.id === activeProfile.aspectRatio);
        if (matched) {
          handleUpdateProjectSettings({ resolution: matched });
        }
      }
    }
  }, [activeProfile?.aspectRatio]);

  const handleChangeResolution = (aspectId: AspectRatioId) => {
    const preset = RESOLUTION_PRESETS.find((r) => r.id === aspectId) || RESOLUTION_PRESETS[0];
    handleUpdateProjectSettings({ resolution: preset });
    if (aspectId === '9:16' || aspectId === '16:9') {
      switchAspectRatio(aspectId);
    }
  };

  // Mutators for Clips
  const handleAddClip = (clipData: Omit<Clip, 'id'>) => {
    pushHistory(project);
    const newClip: Clip = {
      ...clipData,
      id: `clip_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    };
    setProject((prev) => ({
      ...prev,
      clips: [...prev.clips, newClip],
      settings: {
        ...prev.settings,
        duration: Math.max(prev.settings.duration, newClip.startTime + newClip.duration),
        updatedAt: Date.now(),
      },
    }));
    setSelectedClipId(newClip.id);
  };

  const handleUpdateClip = (updatedClip: Clip) => {
    setProject((prev) => ({
      ...prev,
      clips: prev.clips.map((c) => (c.id === updatedClip.id ? updatedClip : c)),
      settings: {
        ...prev.settings,
        duration: Math.max(prev.settings.duration, updatedClip.startTime + updatedClip.duration),
        updatedAt: Date.now(),
      },
    }));
    setIsSaved(false);
  };

  const handleDeleteClip = (clipId: string) => {
    pushHistory(project);
    setProject((prev) => ({
      ...prev,
      clips: prev.clips.filter((c) => c.id !== clipId),
      settings: { ...prev.settings, updatedAt: Date.now() },
    }));
    if (selectedClipId === clipId) setSelectedClipId(null);
  };

  const handleDuplicateClip = (clipId: string) => {
    const original = project.clips.find((c) => c.id === clipId);
    if (!original) return;
    pushHistory(project);

    const dupClip: Clip = {
      ...JSON.parse(JSON.stringify(original)),
      id: `clip_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      startTime: original.startTime + original.duration + 0.1,
      name: `${original.name} (Copy)`,
    };

    setProject((prev) => ({
      ...prev,
      clips: [...prev.clips, dupClip],
      settings: {
        ...prev.settings,
        duration: Math.max(prev.settings.duration, dupClip.startTime + dupClip.duration),
        updatedAt: Date.now(),
      },
    }));
    setSelectedClipId(dupClip.id);
  };

  // Razor / Split Tool implementation
  const handleSplitClip = (clipId: string, splitTime: number) => {
    const clip = project.clips.find((c) => c.id === clipId);
    if (!clip) return;
    if (splitTime <= clip.startTime || splitTime >= clip.startTime + clip.duration) return;

    pushHistory(project);

    const firstDuration = splitTime - clip.startTime;
    const secondDuration = clip.duration - firstDuration;

    // First half
    const firstHalf: Clip = {
      ...clip,
      duration: firstDuration,
    };

    // Second half
    const secondHalf: Clip = {
      ...JSON.parse(JSON.stringify(clip)),
      id: `clip_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: `${clip.name} (Part 2)`,
      startTime: splitTime,
      duration: secondDuration,
      inPoint: clip.inPoint + firstDuration,
    };

    setProject((prev) => ({
      ...prev,
      clips: prev.clips.map((c) => (c.id === clipId ? firstHalf : c)).concat(secondHalf),
      settings: { ...prev.settings, updatedAt: Date.now() },
    }));
    setSelectedClipId(secondHalf.id);
  };

  // Track Toggles
  const handleToggleTrackVisibility = (trackId: string) => {
    setProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) => (t.id === trackId ? { ...t, visible: !t.visible } : t)),
    }));
  };

  const handleToggleTrackMute = (trackId: string) => {
    setProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) => (t.id === trackId ? { ...t, muted: !t.muted } : t)),
    }));
  };

  const handleToggleTrackLock = (trackId: string) => {
    setProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) => (t.id === trackId ? { ...t, locked: !t.locked } : t)),
    }));
  };

  // Close gaps in track
  const handleCloseGaps = (trackId: string) => {
    pushHistory(project);
    const trackClips = [...project.clips.filter((c) => c.trackId === trackId)].sort(
      (a, b) => a.startTime - b.startTime
    );

    let curTime = 0;
    const updatedTrackClips = trackClips.map((c) => {
      const updated = { ...c, startTime: curTime };
      curTime += c.duration;
      return updated;
    });

    setProject((prev) => ({
      ...prev,
      clips: prev.clips
        .filter((c) => c.trackId !== trackId)
        .concat(updatedTrackClips),
    }));
  };

  // Convert Script to Project
  const handleImportScript = () => {
    if (!effectiveScript) return;
    pushHistory(project);
    const newProj = convertScriptToEditorProject(effectiveScript, effectiveSourceTitle);
    setProject(newProj);
    setCurrentTime(0);
    setSelectedClipId(null);
  };

  // Project Manager Handlers
  const handleNewProject = (name: string, aspectId: '16:9' | '9:16') => {
    pushHistory(project);
    const res = RESOLUTION_PRESETS.find((r) => r.id === aspectId) || RESOLUTION_PRESETS[0];
    const newProj = createInitialEditorProject(`proj_${Date.now()}`);
    newProj.settings.name = name;
    newProj.settings.resolution = res;
    setProject(newProj);
    setCurrentTime(0);
    setSelectedClipId(null);
    setIsProjectManagerOpen(false);
  };

  const handleLoadProject = (projectId: string) => {
    try {
      const raw = localStorage.getItem(getProjectKey(projectId));
      if (raw) {
        pushHistory(project);
        setProject(JSON.parse(raw));
        setCurrentTime(0);
        setSelectedClipId(null);
        setIsProjectManagerOpen(false);
      }
    } catch (e) {
      console.error('Failed to load project:', e);
    }
  };

  const handleDeleteProject = (projectId: string) => {
    localStorage.removeItem(getProjectKey(projectId));
    const updated = savedProjectsList.filter((p) => p.id !== projectId);
    localStorage.setItem(projectListKey, JSON.stringify(updated));
    setSavedProjectsList(updated);
  };

  const handleDuplicateProject = (projectId: string) => {
    const raw = localStorage.getItem(getProjectKey(projectId));
    if (!raw) return;
    const orig: EditorProject = JSON.parse(raw);
    const dup: EditorProject = {
      ...orig,
      settings: {
        ...orig.settings,
        id: `proj_${Date.now()}`,
        name: `${orig.settings.name} (Copy)`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    };
    localStorage.setItem(getProjectKey(dup.settings.id), JSON.stringify(dup));
    const meta: SavedProjectMeta = {
      id: dup.settings.id,
      name: dup.settings.name,
      resolutionId: dup.settings.resolution.id,
      duration: dup.settings.duration,
      updatedAt: Date.now(),
      clipsCount: dup.clips.length,
    };
    const updated = [meta, ...savedProjectsList];
    localStorage.setItem(projectListKey, JSON.stringify(updated));
    setSavedProjectsList(updated);
  };

  const selectedClip = project.clips.find((c) => c.id === selectedClipId) || null;

  return (
    <div
      className="flex flex-col h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-hidden select-none border rounded-2xl shadow-2xl relative"
      style={{
        backgroundColor: 'var(--bg-base)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* 1. TOP APPLICATION BAR */}
      <EditorTopBar
        project={project}
        activeWorkspaceTab={activeWorkspaceTab}
        canUndo={historyPast.length > 0}
        canRedo={historyFuture.length > 0}
        isSaved={isSaved}
        onUpdateProjectName={(name) => handleUpdateProjectSettings({ name })}
        onChangeResolution={handleChangeResolution}
        onChangeFrameRate={(fps) => handleUpdateProjectSettings({ frameRate: fps })}
        onSelectWorkspaceTab={(tab) => {
          setActiveWorkspaceTab(tab);
          if (tab === 'export') setIsExportModalOpen(true);
        }}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSave={handleSaveProject}
        onNewProject={() => setIsProjectManagerOpen(true)}
        onOpenProjectManager={() => setIsProjectManagerOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
      />

      {/* Script Sync Notification Banner if transferred script exists and not yet synced */}
      {effectiveScript && (
        <div className="h-9 px-4 bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 border-b border-amber-500/30 flex items-center justify-between text-xs text-amber-300 shrink-0">
          <div className="flex items-center space-x-2 truncate">
            <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
            <span className="truncate">
              Script <strong>"{effectiveSourceTitle}"</strong> available ({effectiveScript.segments?.length || 0} scenes).
            </span>
          </div>
          <button
            onClick={handleImportScript}
            className="px-2.5 py-1 rounded bg-amber-400 text-black font-bold text-[11px] shrink-0 hover:bg-amber-300 transition-colors flex items-center space-x-1 cursor-pointer"
          >
            <span>Convert to Timeline</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 2. MIDDLE WORKSPACE AREA (Media Bin | Preview Monitor | Inspector) */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left: Media Bin / Project Assets */}
        <div className="w-72 xl:w-80 shrink-0 h-full overflow-hidden">
          <EditorMediaBin
            project={project}
            currentTime={currentTime}
            onAddClipToTimeline={handleAddClip}
            onAddAsset={(asset) =>
              setProject((prev) => ({
                ...prev,
                assets: [asset, ...prev.assets],
              }))
            }
            onImportEntireScript={effectiveScript ? handleImportScript : undefined}
            hasScriptData={Boolean(effectiveScript)}
          />
        </div>

        {/* Center: Program Monitor */}
        <div className="flex-1 h-full overflow-hidden flex flex-col">
          <EditorPreviewMonitor
            project={project}
            currentTime={currentTime}
            isPlaying={isPlaying}
            selectedClip={selectedClip}
            loopPlayback={loopPlayback}
            onSeek={setCurrentTime}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
            onToggleLoop={() => setLoopPlayback(!loopPlayback)}
            onUpdateClipTransform={(clipId, transform) => {
              const clip = project.clips.find((c) => c.id === clipId);
              if (clip) handleUpdateClip({ ...clip, transform });
            }}
          />
        </div>

        {/* Right: Clip & Sequence Inspector */}
        <div className="w-80 xl:w-96 shrink-0 h-full overflow-hidden">
          <EditorInspector
            project={project}
            selectedClip={selectedClip}
            onUpdateClip={handleUpdateClip}
            onUpdateProjectSettings={handleUpdateProjectSettings}
          />
        </div>
      </div>

      {/* 3. BOTTOM MULTI-TRACK TIMELINE */}
      <div className="h-64 xl:h-72 shrink-0">
        <EditorTimeline
          project={project}
          currentTime={currentTime}
          zoom={zoom}
          activeTool={activeTool}
          snappingEnabled={snappingEnabled}
          selectedClipId={selectedClipId}
          onSeek={setCurrentTime}
          onSetZoom={setZoom}
          onSetActiveTool={setActiveTool}
          onToggleSnapping={() => setSnappingEnabled(!snappingEnabled)}
          onSelectClip={setSelectedClipId}
          onUpdateClip={handleUpdateClip}
          onDeleteClip={handleDeleteClip}
          onSplitClip={handleSplitClip}
          onDuplicateClip={handleDuplicateClip}
          onToggleTrackVisibility={handleToggleTrackVisibility}
          onToggleTrackMute={handleToggleTrackMute}
          onToggleTrackLock={handleToggleTrackLock}
          onCloseGaps={handleCloseGaps}
        />
      </div>

      {/* 4. MODALS */}
      <EditorExportModal
        project={project}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      <EditorProjectManagerModal
        isOpen={isProjectManagerOpen}
        currentProjectId={project.settings.id}
        savedProjects={savedProjectsList}
        onClose={() => setIsProjectManagerOpen(false)}
        onLoadProject={handleLoadProject}
        onNewProject={handleNewProject}
        onDeleteProject={handleDeleteProject}
        onDuplicateProject={handleDuplicateProject}
      />
    </div>
  );
};
