// src/components/yt-editor/EditorPreviewMonitor.tsx
import React, { useRef, useEffect, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Maximize2,
  Camera,
  Grid,
  Volume2,
  VolumeX,
  Repeat,
  Sparkles,
} from 'lucide-react';
import { EditorProject, Clip } from '../../types/editor';
import {
  renderTimelineToCanvas,
  formatTimecode,
  formatDurationSimple,
  RenderOptions,
  audioStudioEngine,
} from '../../services/editorEngine';

interface EditorPreviewMonitorProps {
  project: EditorProject;
  currentTime: number;
  isPlaying: boolean;
  selectedClip: Clip | null;
  loopPlayback: boolean;
  onSeek: (time: number) => void;
  onTogglePlay: () => void;
  onToggleLoop: () => void;
  onUpdateClipTransform?: (clipId: string, transform: Clip['transform']) => void;
}

export const EditorPreviewMonitor: React.FC<EditorPreviewMonitorProps> = ({
  project,
  currentTime,
  isPlaying,
  selectedClip,
  loopPlayback,
  onSeek,
  onTogglePlay,
  onToggleLoop,
  onUpdateClipTransform,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Guide overlay states
  const [showGuides, setShowGuides] = useState(false);
  const [showRuleOfThirds, setShowRuleOfThirds] = useState(true);
  const [showTitleSafe, setShowTitleSafe] = useState(false);
  const [showVerticalGuide, setShowVerticalGuide] = useState(true);
  const [showCenterCrosshair, setShowCenterCrosshair] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [ttsSyncEnabled, setTtsSyncEnabled] = useState(false);

  // Dragging clip directly on preview monitor
  const [isDraggingClip, setIsDraggingClip] = useState(false);
  const dragStartPos = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({
    mouseX: 0,
    mouseY: 0,
    startX: 0,
    startY: 0,
  });

  // Re-render canvas whenever currentTime, project, or selectedClip changes
  useEffect(() => {
    if (!canvasRef.current) return;

    const renderOpts: RenderOptions = {
      showGuides,
      showRuleOfThirds,
      showTitleSafe,
      showVerticalGuide,
      showCenterCrosshair,
      selectedClipId: selectedClip?.id || null,
    };

    renderTimelineToCanvas(canvasRef.current, project, currentTime, renderOpts);
  }, [
    project,
    currentTime,
    showGuides,
    showRuleOfThirds,
    showTitleSafe,
    showVerticalGuide,
    showCenterCrosshair,
    selectedClip,
  ]);

  // TTS Voiceover Sync playback
  useEffect(() => {
    if (isPlaying && ttsSyncEnabled) {
      // Find any dialogue clip active right now
      const activeVoiceClip = project.clips.find(
        (c) =>
          c.trackId === 'a1' &&
          c.voiceoverDialogue &&
          Math.abs(c.startTime - currentTime) < 0.25
      );
      if (activeVoiceClip?.voiceoverDialogue) {
        audioStudioEngine.speakText(activeVoiceClip.voiceoverDialogue);
      }
    }
  }, [currentTime, isPlaying, ttsSyncEnabled, project.clips]);

  // Handle frame stepping
  const stepFrame = (frames: number) => {
    const frameDuration = 1 / project.settings.frameRate;
    const newTime = Math.max(0, Math.min(project.settings.duration, currentTime + frames * frameDuration));
    onSeek(newTime);
  };

  // Snapshot frame as PNG
  const handleTakeSnapshot = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${project.settings.name}_frame_${formatTimecode(currentTime, project.settings.frameRate).replace(/:/g, '-')}.png`;
    a.click();
    audioStudioEngine.playSoundEffect('shutter');
  };

  // Fullscreen monitor toggle
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  // Monitor canvas mouse drag interaction for moving selected clip
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedClip || !onUpdateClipTransform) return;
    setIsDraggingClip(true);
    dragStartPos.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: selectedClip.transform.x || 0,
      startY: selectedClip.transform.y || 0,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingClip || !selectedClip || !onUpdateClipTransform) return;
    const dx = e.clientX - dragStartPos.current.mouseX;
    const dy = e.clientY - dragStartPos.current.mouseY;

    // Convert pixel delta to percentage delta
    const deltaXPercent = (dx / 400) * 100;
    const deltaYPercent = (dy / 250) * 100;

    onUpdateClipTransform(selectedClip.id, {
      ...selectedClip.transform,
      x: Math.round(dragStartPos.current.startX + deltaXPercent),
      y: Math.round(dragStartPos.current.startY + deltaYPercent),
    });
  };

  const handleMouseUp = () => {
    setIsDraggingClip(false);
  };

  const { width, height, aspectRatio } = project.settings.resolution;

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full overflow-hidden select-none"
      style={{
        backgroundColor: 'var(--bg-base)',
      }}
    >
      {/* Monitor Top Status & Guide Toggles */}
      <div
        className="h-9 px-4 flex items-center justify-between border-b text-xs shrink-0"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex items-center space-x-2">
          <span className="font-mono font-bold text-[var(--accent-primary)] text-sm tracking-wider">
            {formatTimecode(currentTime, project.settings.frameRate)}
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">
            / {formatTimecode(project.settings.duration, project.settings.frameRate)}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
            {project.settings.resolution.label}
          </span>
        </div>

        {/* Utilities: Guides, Fullscreen, Snapshot */}
        <div className="flex items-center space-x-2">
          {/* TTS Dialogue Audio Toggle */}
          <button
            onClick={() => {
              setTtsSyncEnabled(!ttsSyncEnabled);
              if (ttsSyncEnabled) audioStudioEngine.stopSpeaking();
            }}
            className={`p-1 rounded text-xs flex items-center space-x-1 transition-colors ${
              ttsSyncEnabled
                ? 'bg-amber-500/20 text-amber-300 font-medium'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            title="Read Dialogue via Browser Text-to-Speech during playback"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[10px] hidden sm:inline">TTS Speech</span>
          </button>

          {/* Composition Guides Toggle */}
          <button
            onClick={() => setShowGuides(!showGuides)}
            className={`p-1.5 rounded transition-colors ${
              showGuides
                ? 'bg-[var(--accent-primary)] text-[var(--bg-base)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
            }`}
            title="Toggle Composition Overlays & Safe Guides"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          {/* Snapshot Button */}
          <button
            onClick={handleTakeSnapshot}
            className="p-1.5 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
            title="Capture Current Frame Snapshot (PNG)"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Monitor */}
          <button
            onClick={handleToggleFullscreen}
            className="p-1.5 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
            title="Toggle Fullscreen Monitor"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Guide options sub-bar (when guides active) */}
      {showGuides && (
        <div className="px-4 py-1.5 bg-[var(--bg-surface-elevated)] border-b border-[var(--border-subtle)] flex items-center space-x-4 text-[11px] text-[var(--text-secondary)]">
          <label className="flex items-center space-x-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showRuleOfThirds}
              onChange={(e) => setShowRuleOfThirds(e.target.checked)}
              className="accent-[var(--accent-primary)] rounded"
            />
            <span>Rule of Thirds</span>
          </label>
          <label className="flex items-center space-x-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showTitleSafe}
              onChange={(e) => setShowTitleSafe(e.target.checked)}
              className="accent-[var(--accent-primary)] rounded"
            />
            <span>Title Safe (10%)</span>
          </label>
          {project.settings.resolution.id === '16:9' && (
            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showVerticalGuide}
                onChange={(e) => setShowVerticalGuide(e.target.checked)}
                className="accent-[var(--accent-primary)] rounded"
              />
              <span>9:16 Shorts Guide</span>
            </label>
          )}
          <label className="flex items-center space-x-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showCenterCrosshair}
              onChange={(e) => setShowCenterCrosshair(e.target.checked)}
              className="accent-[var(--accent-primary)] rounded"
            />
            <span>Center Crosshair</span>
          </label>
        </div>
      )}

      {/* Center Canvas Viewport */}
      <div className="flex-1 flex items-center justify-center p-3 relative overflow-hidden bg-[#07090e]">
        <div
          className="relative max-w-full max-h-full flex items-center justify-center shadow-2xl rounded border border-neutral-800 overflow-hidden"
          style={{
            aspectRatio,
            width: project.settings.resolution.id === '9:16' ? 'auto' : '100%',
            height: project.settings.resolution.id === '9:16' ? '100%' : 'auto',
            maxHeight: '100%',
          }}
        >
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className={`w-full h-full object-contain ${
              selectedClip ? 'cursor-move' : 'cursor-default'
            }`}
          />
        </div>
      </div>

      {/* Bottom Transport Controls Bar */}
      <div
        className="h-12 px-4 flex items-center justify-between border-t select-none shrink-0"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        {/* Left: Frame Navigation */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onSeek(0)}
            className="p-1.5 rounded hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            title="Go to Start (Home)"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={() => stepFrame(-1)}
            className="px-2 py-1 rounded text-xs hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-mono"
            title="Step Back 1 Frame (J / Left Arrow)"
          >
            -1f
          </button>
        </div>

        {/* Center: Play / Pause Button */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onTogglePlay}
            className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 ${
              isPlaying
                ? 'bg-amber-400 text-black'
                : 'bg-[var(--accent-primary)] text-[var(--bg-base)]'
            }`}
            title="Play / Pause (Spacebar / K)"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={onToggleLoop}
            className={`p-1.5 rounded transition-colors ${
              loopPlayback
                ? 'bg-[var(--accent-primary)] text-[var(--bg-base)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
            }`}
            title="Toggle Playback Loop"
          >
            <Repeat className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Step Forward & Speed */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => stepFrame(1)}
            className="px-2 py-1 rounded text-xs hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-mono"
            title="Step Forward 1 Frame (L / Right Arrow)"
          >
            +1f
          </button>
          <button
            onClick={() => onSeek(project.settings.duration)}
            className="p-1.5 rounded hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            title="Go to End (End)"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
