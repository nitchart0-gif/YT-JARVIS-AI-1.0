// src/components/yt-editor/EditorTimeline.tsx
import React, { useRef, useState, useEffect } from 'react';
import {
  Scissors,
  MousePointer,
  Trash2,
  Copy,
  Magnet,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Lock,
  Unlock,
  ZoomIn,
  ZoomOut,
  Maximize,
  Sparkles,
} from 'lucide-react';
import {
  EditorProject,
  Track,
  Clip,
  TimelineTool,
} from '../../types/editor';
import { formatDurationSimple } from '../../services/editorEngine';

interface EditorTimelineProps {
  project: EditorProject;
  currentTime: number;
  zoom: number; // Pixels per second
  activeTool: TimelineTool;
  snappingEnabled: boolean;
  selectedClipId: string | null;
  onSeek: (time: number) => void;
  onSetZoom: (zoom: number) => void;
  onSetActiveTool: (tool: TimelineTool) => void;
  onToggleSnapping: () => void;
  onSelectClip: (clipId: string | null) => void;
  onUpdateClip: (clip: Clip) => void;
  onDeleteClip: (clipId: string) => void;
  onSplitClip: (clipId: string, splitTime: number) => void;
  onDuplicateClip: (clipId: string) => void;
  onToggleTrackVisibility: (trackId: string) => void;
  onToggleTrackMute: (trackId: string) => void;
  onToggleTrackLock: (trackId: string) => void;
  onCloseGaps: (trackId: string) => void;
}

export const EditorTimeline: React.FC<EditorTimelineProps> = ({
  project,
  currentTime,
  zoom,
  activeTool,
  snappingEnabled,
  selectedClipId,
  onSeek,
  onSetZoom,
  onSetActiveTool,
  onToggleSnapping,
  onSelectClip,
  onUpdateClip,
  onDeleteClip,
  onSplitClip,
  onDuplicateClip,
  onToggleTrackVisibility,
  onToggleTrackMute,
  onToggleTrackLock,
  onCloseGaps,
}) => {
  const rulerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Playhead dragging state
  const [isScrubbing, setIsScrubbing] = useState(false);

  // Clip dragging/moving state
  const [draggingClip, setDraggingClip] = useState<{
    clipId: string;
    startMouseX: number;
    initialStartTime: number;
    duration: number;
    trackId: string;
  } | null>(null);

  // Clip edge trimming state ('left' or 'right')
  const [trimmingClip, setTrimmingClip] = useState<{
    clipId: string;
    edge: 'left' | 'right';
    startMouseX: number;
    initialStartTime: number;
    initialDuration: number;
  } | null>(null);

  const duration = project.settings.duration;
  const totalTimelineWidth = Math.max(1200, duration * zoom + 300);

  // Time conversion helpers
  const pixelToTime = (px: number) => Math.max(0, px / zoom);
  const timeToPixel = (sec: number) => sec * zoom;

  // Handle Playhead Scrubbing via Ruler
  const handleRulerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsScrubbing(true);
    updatePlayheadFromMouseEvent(e);
  };

  const updatePlayheadFromMouseEvent = (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const scrollLeft = scrollContainerRef.current?.scrollLeft || 0;
    const clickX = e.clientX - rect.left + scrollLeft;
    let newTime = Math.max(0, Math.min(duration, pixelToTime(clickX)));

    // Snap to nearest clip edge if enabled
    if (snappingEnabled) {
      const snapThreshold = 8 / zoom; // 8 pixels
      for (const c of project.clips) {
        if (Math.abs(c.startTime - newTime) < snapThreshold) {
          newTime = c.startTime;
          break;
        }
        if (Math.abs(c.startTime + c.duration - newTime) < snapThreshold) {
          newTime = c.startTime + c.duration;
          break;
        }
      }
    }

    onSeek(newTime);
  };

  // Global mouse move and up for scrubbing, dragging, and trimming
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isScrubbing) {
        updatePlayheadFromMouseEvent(e);
      } else if (draggingClip) {
        // Move clip along timeline
        const deltaPx = e.clientX - draggingClip.startMouseX;
        let newStartTime = Math.max(0, draggingClip.initialStartTime + deltaPx / zoom);

        // Snapping logic
        if (snappingEnabled) {
          const snapThreshold = 8 / zoom;
          // Snap to 0
          if (Math.abs(newStartTime) < snapThreshold) newStartTime = 0;
          // Snap to playhead
          if (Math.abs(newStartTime - currentTime) < snapThreshold) newStartTime = currentTime;
          // Snap to other clips on same track
          const otherClips = project.clips.filter(
            (c) => c.trackId === draggingClip.trackId && c.id !== draggingClip.clipId
          );
          for (const oc of otherClips) {
            if (Math.abs(oc.startTime + oc.duration - newStartTime) < snapThreshold) {
              newStartTime = oc.startTime + oc.duration;
              break;
            }
          }
        }

        const targetClip = project.clips.find((c) => c.id === draggingClip.clipId);
        if (targetClip) {
          onUpdateClip({
            ...targetClip,
            startTime: Number(newStartTime.toFixed(2)),
          });
        }
      } else if (trimmingClip) {
        // Trim clip edge
        const deltaPx = e.clientX - trimmingClip.startMouseX;
        const deltaSec = deltaPx / zoom;
        const targetClip = project.clips.find((c) => c.id === trimmingClip.clipId);
        if (!targetClip) return;

        if (trimmingClip.edge === 'left') {
          // Adjust start time and shorten duration
          const newStart = Math.max(0, trimmingClip.initialStartTime + deltaSec);
          const maxStart = trimmingClip.initialStartTime + trimmingClip.initialDuration - 0.2;
          const clampedStart = Math.min(newStart, maxStart);
          const newDuration = trimmingClip.initialDuration - (clampedStart - trimmingClip.initialStartTime);

          onUpdateClip({
            ...targetClip,
            startTime: Number(clampedStart.toFixed(2)),
            duration: Number(newDuration.toFixed(2)),
          });
        } else {
          // Adjust right edge (duration)
          const newDuration = Math.max(0.3, trimmingClip.initialDuration + deltaSec);
          onUpdateClip({
            ...targetClip,
            duration: Number(newDuration.toFixed(2)),
          });
        }
      }
    };

    const handleGlobalMouseUp = () => {
      setIsScrubbing(false);
      setDraggingClip(null);
      setTrimmingClip(null);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [
    isScrubbing,
    draggingClip,
    trimmingClip,
    zoom,
    snappingEnabled,
    currentTime,
    project.clips,
  ]);

  // Split selected clip at playhead position
  const handleSplitAtPlayhead = () => {
    if (!selectedClipId) return;
    const clip = project.clips.find((c) => c.id === selectedClipId);
    if (!clip) return;
    if (currentTime > clip.startTime && currentTime < clip.startTime + clip.duration) {
      onSplitClip(selectedClipId, currentTime);
    }
  };

  // Color mapping per track type
  const getClipBgColor = (clip: Clip) => {
    if (clip.trackId === 'v3') return 'bg-purple-900/60 border-purple-500/60 text-purple-200';
    if (clip.trackId === 'v2') return 'bg-cyan-900/60 border-cyan-500/60 text-cyan-200';
    if (clip.trackId === 'v1') return 'bg-blue-900/60 border-blue-500/60 text-blue-200';
    if (clip.trackId === 'a1') return 'bg-emerald-900/60 border-emerald-500/60 text-emerald-200';
    if (clip.trackId === 'a2') return 'bg-amber-900/60 border-amber-500/60 text-amber-200';
    return 'bg-rose-900/60 border-rose-500/60 text-rose-200';
  };

  return (
    <div
      className="flex flex-col h-full border-t overflow-hidden select-none"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Timeline Toolbar */}
      <div
        className="h-10 px-4 flex items-center justify-between border-b text-xs shrink-0"
        style={{
          backgroundColor: 'var(--bg-surface-elevated)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        {/* Left: Tools (Select, Razor, Delete, Duplicate) */}
        <div className="flex items-center space-x-1">
          {/* Select Tool */}
          <button
            onClick={() => onSetActiveTool('select')}
            className={`p-1.5 rounded flex items-center space-x-1 transition-colors ${
              activeTool === 'select'
                ? 'bg-[var(--accent-primary)] text-[var(--bg-base)] font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
            }`}
            title="Selection Tool (V)"
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden sm:inline">Select (V)</span>
          </button>

          {/* Razor / Split Tool */}
          <button
            onClick={() => onSetActiveTool('razor')}
            className={`p-1.5 rounded flex items-center space-x-1 transition-colors ${
              activeTool === 'razor'
                ? 'bg-amber-500 text-black font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
            }`}
            title="Razor Tool (C)"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden sm:inline">Razor (C)</span>
          </button>

          <div className="h-4 w-[1px] bg-[var(--border-subtle)] mx-1" />

          {/* Split at Playhead */}
          <button
            onClick={handleSplitAtPlayhead}
            disabled={!selectedClipId}
            className="p-1.5 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] disabled:opacity-30 disabled:hover:bg-transparent"
            title="Split Selected Clip at Playhead"
          >
            <Scissors className="w-3.5 h-3.5" />
          </button>

          {/* Duplicate Clip */}
          <button
            onClick={() => selectedClipId && onDuplicateClip(selectedClipId)}
            disabled={!selectedClipId}
            className="p-1.5 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] disabled:opacity-30 disabled:hover:bg-transparent"
            title="Duplicate Selected Clip (D)"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Delete Clip */}
          <button
            onClick={() => selectedClipId && onDeleteClip(selectedClipId)}
            disabled={!selectedClipId}
            className="p-1.5 rounded text-rose-400 hover:text-rose-300 hover:bg-[var(--bg-surface-hover)] disabled:opacity-30 disabled:hover:bg-transparent"
            title="Delete Selected Clip (Del / Backspace)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center: Snapping Magnet */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleSnapping}
            className={`px-2 py-1 rounded text-xs flex items-center space-x-1 transition-colors ${
              snappingEnabled
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30 font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            title="Snap Clips to Edges & Playhead (S)"
          >
            <Magnet className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden md:inline">Snapping</span>
          </button>
        </div>

        {/* Right: Timeline Zoom Sliders */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onSetZoom(Math.max(15, zoom - 10))}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <input
            type="range"
            min={15}
            max={120}
            value={zoom}
            onChange={(e) => onSetZoom(Number(e.target.value))}
            className="w-24 h-1 accent-[var(--accent-primary)] cursor-pointer"
          />
          <button
            onClick={() => onSetZoom(Math.min(120, zoom + 10))}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] text-[var(--text-muted)] font-mono w-9 text-right">
            {zoom}px/s
          </span>
        </div>
      </div>

      {/* Main Multi-Track Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track Headers Column (Fixed on Left) */}
        <div
          className="w-48 border-r shrink-0 flex flex-col z-10 select-none"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          {/* Header Corner Spacer (aligns with ruler) */}
          <div className="h-7 border-b border-[var(--border-subtle)] px-3 flex items-center text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Tracks
          </div>

          {/* Track Controls List */}
          <div className="flex-1 overflow-y-hidden">
            {project.tracks.map((track) => (
              <div
                key={track.id}
                className="h-14 px-3 flex items-center justify-between border-b border-[var(--border-subtle)] text-xs hover:bg-[var(--bg-surface-elevated)] transition-colors"
              >
                <div className="min-w-0 pr-2">
                  <p className="font-semibold text-[var(--text-primary)] truncate text-[11px]">
                    {track.name}
                  </p>
                  <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">
                    {track.type}
                  </p>
                </div>

                {/* Track Toggles */}
                <div className="flex items-center space-x-1 shrink-0">
                  {track.type === 'video' ? (
                    <button
                      onClick={() => onToggleTrackVisibility(track.id)}
                      className={`p-1 rounded ${
                        track.visible
                          ? 'text-[var(--text-primary)]'
                          : 'text-neutral-600 hover:text-neutral-400'
                      }`}
                      title="Toggle Visibility"
                    >
                      {track.visible ? (
                        <Eye className="w-3.5 h-3.5" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5" />
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => onToggleTrackMute(track.id)}
                      className={`p-1 rounded ${
                        !track.muted
                          ? 'text-[var(--text-primary)]'
                          : 'text-rose-400 hover:text-rose-300'
                      }`}
                      title="Toggle Track Mute"
                    >
                      {!track.muted ? (
                        <Volume2 className="w-3.5 h-3.5" />
                      ) : (
                        <VolumeX className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => onToggleTrackLock(track.id)}
                    className={`p-1 rounded ${
                      track.locked
                        ? 'text-amber-400'
                        : 'text-neutral-600 hover:text-neutral-400'
                    }`}
                    title="Lock Track"
                  >
                    {track.locked ? (
                      <Lock className="w-3.5 h-3.5" />
                    ) : (
                      <Unlock className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sequencer Scrollable Lanes & Ruler */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto overflow-y-hidden relative custom-scrollbar bg-[#080a0f]"
        >
          <div style={{ width: totalTimelineWidth }} className="relative h-full">
            {/* Time Ruler (Seconds and Frames markers) */}
            <div
              ref={rulerRef}
              onMouseDown={handleRulerMouseDown}
              className="h-7 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] relative cursor-pointer select-none"
            >
              {/* Generate ruler tick marks */}
              {Array.from({ length: Math.ceil(duration + 10) }).map((_, sec) => {
                const x = timeToPixel(sec);
                return (
                  <div
                    key={sec}
                    className="absolute top-0 bottom-0 border-l border-neutral-700/60 flex items-end pb-1 pl-1"
                    style={{ left: x }}
                  >
                    <span className="text-[9px] font-mono text-[var(--text-muted)] select-none">
                      {formatDurationSimple(sec)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Playhead Red Indicator Line */}
            <div
              className="absolute top-0 bottom-0 pointer-events-none z-30"
              style={{
                left: timeToPixel(currentTime),
                transform: 'translateX(-50%)',
              }}
            >
              {/* Playhead Head (Diamond) */}
              <div className="w-3.5 h-3.5 bg-red-500 rotate-45 mx-auto -mt-1 shadow-md border border-white/50" />
              {/* Playhead Stalk */}
              <div className="w-[2px] h-full bg-red-500 mx-auto opacity-90 shadow-sm" />
            </div>

            {/* Track Lanes */}
            <div className="relative">
              {project.tracks.map((track) => {
                const trackClips = project.clips.filter((c) => c.trackId === track.id);

                return (
                  <div
                    key={track.id}
                    className="h-14 border-b border-[var(--border-subtle)] relative group"
                    style={{
                      backgroundColor: track.locked
                        ? 'rgba(0, 0, 0, 0.4)'
                        : 'rgba(255, 255, 255, 0.01)',
                    }}
                    onClick={() => {
                      // Clicking empty lane area seeks playhead
                      if (activeTool === 'select') {
                        onSelectClip(null);
                      }
                    }}
                  >
                    {/* Render Clips on this Track */}
                    {trackClips.map((clip) => {
                      const clipLeft = timeToPixel(clip.startTime);
                      const clipWidth = Math.max(16, timeToPixel(clip.duration));
                      const isSelected = clip.id === selectedClipId;

                      return (
                        <div
                          key={clip.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (activeTool === 'razor') {
                              onSplitClip(clip.id, currentTime);
                            } else {
                              onSelectClip(clip.id);
                            }
                          }}
                          onMouseDown={(e) => {
                            if (track.locked || activeTool === 'razor') return;
                            e.stopPropagation();
                            onSelectClip(clip.id);
                            setDraggingClip({
                              clipId: clip.id,
                              startMouseX: e.clientX,
                              initialStartTime: clip.startTime,
                              duration: clip.duration,
                              trackId: clip.trackId,
                            });
                          }}
                          className={`absolute top-1 bottom-1 rounded border overflow-hidden cursor-move select-none flex items-center justify-between px-2 text-xs transition-shadow shadow-md ${getClipBgColor(
                            clip
                          )} ${
                            isSelected
                              ? 'ring-2 ring-[var(--accent-primary)] shadow-lg'
                              : 'opacity-90 hover:opacity-100'
                          }`}
                          style={{
                            left: clipLeft,
                            width: clipWidth,
                          }}
                        >
                          {/* Left Trim Handle */}
                          <div
                            onMouseDown={(e) => {
                              if (track.locked) return;
                              e.stopPropagation();
                              setTrimmingClip({
                                clipId: clip.id,
                                edge: 'left',
                                startMouseX: e.clientX,
                                initialStartTime: clip.startTime,
                                initialDuration: clip.duration,
                              });
                            }}
                            className="absolute left-0 top-0 bottom-0 w-2 hover:w-3 bg-white/20 hover:bg-[var(--accent-primary)] cursor-ew-resize transition-all z-20"
                            title="Drag to Trim In-Point"
                          />

                          {/* Clip Label and Visual Representation */}
                          <div className="flex items-center space-x-1.5 min-w-0 pr-1 truncate pointer-events-none z-10">
                            {clip.thumbnailUrl && (
                              <img
                                src={clip.thumbnailUrl}
                                alt=""
                                className="w-5 h-5 rounded object-cover shrink-0"
                              />
                            )}
                            <span className="font-semibold truncate text-[11px]">
                              {clip.name}
                            </span>
                          </div>

                          <span className="text-[10px] opacity-75 font-mono shrink-0 ml-1 pointer-events-none z-10">
                            {clip.duration.toFixed(1)}s
                          </span>

                          {/* Right Trim Handle */}
                          <div
                            onMouseDown={(e) => {
                              if (track.locked) return;
                              e.stopPropagation();
                              setTrimmingClip({
                                clipId: clip.id,
                                edge: 'right',
                                startMouseX: e.clientX,
                                initialStartTime: clip.startTime,
                                initialDuration: clip.duration,
                              });
                            }}
                            className="absolute right-0 top-0 bottom-0 w-2 hover:w-3 bg-white/20 hover:bg-[var(--accent-primary)] cursor-ew-resize transition-all z-20"
                            title="Drag to Trim Out-Point"
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
