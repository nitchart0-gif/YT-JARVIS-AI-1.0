// src/components/yt-editor/EditorInspector.tsx
import React, { useState } from 'react';
import {
  Sliders,
  Type,
  Volume2,
  Sparkles,
  Layers,
  Move,
  RotateCw,
  Eye,
  Scissors,
  Check,
  Play,
  RotateCcw,
  Palette,
  Film,
} from 'lucide-react';
import {
  EditorProject,
  Clip,
  ColorGradePreset,
  BlendMode,
  FitMode,
} from '../../types/editor';
import { audioStudioEngine } from '../../services/editorEngine';

interface EditorInspectorProps {
  project: EditorProject;
  selectedClip: Clip | null;
  onUpdateClip: (clip: Clip) => void;
  onUpdateProjectSettings: (settings: Partial<EditorProject['settings']>) => void;
}

type InspectorSection = 'transform' | 'color' | 'audio' | 'text' | 'transitions';

export const EditorInspector: React.FC<EditorInspectorProps> = ({
  project,
  selectedClip,
  onUpdateClip,
  onUpdateProjectSettings,
}) => {
  const [activeSection, setActiveSection] = useState<InspectorSection>('transform');

  if (!selectedClip) {
    // Show Sequence & Project Properties when no clip is selected
    return (
      <div
        className="flex flex-col h-full border-l overflow-y-auto select-none p-4 space-y-4 custom-scrollbar text-xs"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="pb-3 border-b border-[var(--border-subtle)] space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-primary)]">
            Sequence Properties
          </span>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            {project.settings.name}
          </h3>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] text-[var(--text-secondary)] font-medium">
              Resolution Preset
            </label>
            <div className="p-2.5 rounded bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]">
              <p className="font-semibold text-[var(--text-primary)]">
                {project.settings.resolution.label}
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">
                {project.settings.resolution.width} x {project.settings.resolution.height} ({project.settings.resolution.aspectRatio})
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-[var(--text-secondary)] font-medium">
              Timeline Duration (Seconds)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min={10}
                max={180}
                value={project.settings.duration}
                onChange={(e) =>
                  onUpdateProjectSettings({ duration: Number(e.target.value) })
                }
                className="flex-1 accent-[var(--accent-primary)]"
              />
              <span className="font-mono font-bold text-[var(--text-primary)] w-10 text-right">
                {project.settings.duration}s
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-[var(--text-secondary)] font-medium">
              Background Canvas Color
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={project.settings.backgroundColor}
                onChange={(e) =>
                  onUpdateProjectSettings({ backgroundColor: e.target.value })
                }
                className="w-8 h-8 rounded border border-[var(--border-subtle)] cursor-pointer bg-transparent"
              />
              <span className="font-mono text-[var(--text-primary)]">
                {project.settings.backgroundColor}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2">
            <p className="text-[11px] text-[var(--text-muted)]">
              Tip: Click on any clip in the timeline or preview monitor to adjust transform, color grading, audio volume, or text typography.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Update helper
  const updateTransform = (partial: Partial<Clip['transform']>) => {
    onUpdateClip({
      ...selectedClip,
      transform: { ...selectedClip.transform, ...partial },
    });
  };

  const updateColorGrade = (partial: Partial<Clip['colorGrade']>) => {
    onUpdateClip({
      ...selectedClip,
      colorGrade: { ...selectedClip.colorGrade, ...partial },
    });
  };

  const updateAudio = (partial: Partial<Clip['audio']>) => {
    onUpdateClip({
      ...selectedClip,
      audio: { ...selectedClip.audio, ...partial },
    });
  };

  const updateText = (partial: Partial<NonNullable<Clip['textSettings']>>) => {
    if (!selectedClip.textSettings) return;
    onUpdateClip({
      ...selectedClip,
      textSettings: { ...selectedClip.textSettings, ...partial },
    });
  };

  return (
    <div
      className="flex flex-col h-full border-l overflow-y-auto select-none p-3 space-y-3 custom-scrollbar text-xs"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Selected Clip Header */}
      <div className="pb-2 border-b border-[var(--border-subtle)] space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-primary)]">
            Clip Inspector
          </span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
            {selectedClip.type}
          </span>
        </div>

        <input
          type="text"
          value={selectedClip.name}
          onChange={(e) => onUpdateClip({ ...selectedClip, name: e.target.value })}
          className="w-full px-2 py-1 text-xs font-semibold rounded bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] outline-none"
        />

        <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono">
          <span>Start: {selectedClip.startTime.toFixed(2)}s</span>
          <span>Duration: {selectedClip.duration.toFixed(2)}s</span>
        </div>
      </div>

      {/* Section Navigation Tabs */}
      <div className="grid grid-cols-4 gap-1 p-0.5 bg-[var(--bg-surface-elevated)] rounded-lg text-[10px]">
        <button
          onClick={() => setActiveSection('transform')}
          className={`py-1 rounded font-medium transition-all text-center ${
            activeSection === 'transform'
              ? 'bg-[var(--accent-primary)] text-[var(--bg-base)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Transform
        </button>
        <button
          onClick={() => setActiveSection('color')}
          className={`py-1 rounded font-medium transition-all text-center ${
            activeSection === 'color'
              ? 'bg-[var(--accent-primary)] text-[var(--bg-base)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Color
        </button>
        <button
          onClick={() => setActiveSection('audio')}
          className={`py-1 rounded font-medium transition-all text-center ${
            activeSection === 'audio'
              ? 'bg-[var(--accent-primary)] text-[var(--bg-base)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Audio
        </button>
        <button
          onClick={() => setActiveSection(selectedClip.type === 'text' ? 'text' : 'transitions')}
          className={`py-1 rounded font-medium transition-all text-center ${
            activeSection === 'text' || activeSection === 'transitions'
              ? 'bg-[var(--accent-primary)] text-[var(--bg-base)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          {selectedClip.type === 'text' ? 'Text' : 'Effects'}
        </button>
      </div>

      {/* SECTION 1: TRANSFORM & FRAMING */}
      {activeSection === 'transform' && (
        <div className="space-y-3">
          {/* Position X / Y */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                Position (X / Y)
              </span>
              <button
                onClick={() => updateTransform({ x: 0, y: 0 })}
                className="text-[10px] text-[var(--accent-primary)] hover:underline"
              >
                Reset Center
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-1.5 bg-[var(--bg-surface-elevated)] p-1.5 rounded border border-[var(--border-subtle)]">
                <span className="text-[10px] text-[var(--text-muted)] font-mono">X</span>
                <input
                  type="number"
                  value={selectedClip.transform.x}
                  onChange={(e) => updateTransform({ x: Number(e.target.value) })}
                  className="w-full bg-transparent text-xs text-[var(--text-primary)] outline-none"
                />
              </div>
              <div className="flex items-center space-x-1.5 bg-[var(--bg-surface-elevated)] p-1.5 rounded border border-[var(--border-subtle)]">
                <span className="text-[10px] text-[var(--text-muted)] font-mono">Y</span>
                <input
                  type="number"
                  value={selectedClip.transform.y}
                  onChange={(e) => updateTransform({ y: Number(e.target.value) })}
                  className="w-full bg-transparent text-xs text-[var(--text-primary)] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Scale */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">Scale</span>
              <span className="font-mono text-[var(--text-primary)] text-[10px]">
                {Math.round((selectedClip.transform.scale || 1.0) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.2}
              max={2.5}
              step={0.05}
              value={selectedClip.transform.scale || 1.0}
              onChange={(e) => updateTransform({ scale: Number(e.target.value) })}
              className="w-full accent-[var(--accent-primary)]"
            />
          </div>

          {/* Rotation */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">Rotation</span>
              <span className="font-mono text-[var(--text-primary)] text-[10px]">
                {selectedClip.transform.rotation || 0}°
              </span>
            </div>
            <input
              type="range"
              min={-180}
              max={180}
              value={selectedClip.transform.rotation || 0}
              onChange={(e) => updateTransform({ rotation: Number(e.target.value) })}
              className="w-full accent-[var(--accent-primary)]"
            />
          </div>

          {/* Opacity */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">Opacity</span>
              <span className="font-mono text-[var(--text-primary)] text-[10px]">
                {Math.round((selectedClip.transform.opacity ?? 1.0) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={selectedClip.transform.opacity ?? 1.0}
              onChange={(e) => updateTransform({ opacity: Number(e.target.value) })}
              className="w-full accent-[var(--accent-primary)]"
            />
          </div>

          {/* Blend Mode */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-[var(--text-secondary)]">Blend Mode</label>
            <select
              value={selectedClip.transform.blendMode || 'normal'}
              onChange={(e) => updateTransform({ blendMode: e.target.value as BlendMode })}
              className="w-full px-2 py-1.5 rounded bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] outline-none"
            >
              <option value="normal">Normal</option>
              <option value="screen">Screen (Lighten)</option>
              <option value="multiply">Multiply (Darken)</option>
              <option value="overlay">Overlay (Contrast)</option>
              <option value="lighten">Lighten</option>
              <option value="darken">Darken</option>
              <option value="difference">Difference</option>
            </select>
          </div>

          {/* Fit Mode */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-[var(--text-secondary)]">Framing / Fit Mode</label>
            <div className="grid grid-cols-3 gap-1">
              {(['cover', 'contain', 'stretch'] as FitMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onUpdateClip({ ...selectedClip, fitMode: mode })}
                  className={`py-1 rounded text-[10px] font-medium capitalize border transition-all ${
                    selectedClip.fitMode === mode
                      ? 'bg-[var(--accent-primary)] text-[var(--bg-base)] border-[var(--accent-primary)]'
                      : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: COLOR GRADING & LOOKS */}
      {activeSection === 'color' && (
        <div className="space-y-3">
          {/* Preset Styles */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-[var(--text-secondary)]">
              Color Grade Look Presets
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'natural', name: 'Natural Clean', br: 1, ct: 1, sat: 1, temp: 0 },
                { id: 'teal-orange', name: 'Teal & Orange', br: 1.02, ct: 1.1, sat: 1.2, temp: 6 },
                { id: 'forensic-noir', name: 'Forensic Noir', br: 0.95, ct: 1.18, sat: 0.8, temp: -8 },
                { id: 'cyber-cyan', name: 'Cyber Cyan', br: 1.0, ct: 1.12, sat: 1.25, temp: -12 },
                { id: 'golden-hour', name: 'Golden Hour', br: 1.05, ct: 1.05, sat: 1.2, temp: 15 },
                { id: 'high-contrast-bw', name: 'B&W Contrast', br: 1.0, ct: 1.3, sat: 0, temp: 0 },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() =>
                    updateColorGrade({
                      preset: p.id as ColorGradePreset,
                      brightness: p.br,
                      contrast: p.ct,
                      saturation: p.sat,
                      temperature: p.temp,
                    })
                  }
                  className={`p-1.5 rounded border text-left text-[10px] font-medium transition-all ${
                    selectedClip.colorGrade?.preset === p.id
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-subtle)] text-[var(--accent-primary)]'
                      : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
            {/* Brightness */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[var(--text-secondary)]">Brightness</span>
                <span className="font-mono text-[var(--text-primary)] text-[10px]">
                  {Math.round((selectedClip.colorGrade?.brightness ?? 1.0) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={1.6}
                step={0.05}
                value={selectedClip.colorGrade?.brightness ?? 1.0}
                onChange={(e) => updateColorGrade({ brightness: Number(e.target.value) })}
                className="w-full accent-[var(--accent-primary)]"
              />
            </div>

            {/* Contrast */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[var(--text-secondary)]">Contrast</span>
                <span className="font-mono text-[var(--text-primary)] text-[10px]">
                  {Math.round((selectedClip.colorGrade?.contrast ?? 1.0) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.6}
                max={1.8}
                step={0.05}
                value={selectedClip.colorGrade?.contrast ?? 1.0}
                onChange={(e) => updateColorGrade({ contrast: Number(e.target.value) })}
                className="w-full accent-[var(--accent-primary)]"
              />
            </div>

            {/* Saturation */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[var(--text-secondary)]">Saturation</span>
                <span className="font-mono text-[var(--text-primary)] text-[10px]">
                  {Math.round((selectedClip.colorGrade?.saturation ?? 1.0) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={2.0}
                step={0.05}
                value={selectedClip.colorGrade?.saturation ?? 1.0}
                onChange={(e) => updateColorGrade({ saturation: Number(e.target.value) })}
                className="w-full accent-[var(--accent-primary)]"
              />
            </div>

            {/* Temperature */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[var(--text-secondary)]">Temperature (Cool / Warm)</span>
                <span className="font-mono text-[var(--text-primary)] text-[10px]">
                  {selectedClip.colorGrade?.temperature ?? 0}
                </span>
              </div>
              <input
                type="range"
                min={-40}
                max={40}
                value={selectedClip.colorGrade?.temperature ?? 0}
                onChange={(e) => updateColorGrade({ temperature: Number(e.target.value) })}
                className="w-full accent-[var(--accent-primary)]"
              />
            </div>

            {/* Vignette */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[var(--text-secondary)]">Vignette Shading</span>
                <span className="font-mono text-[var(--text-primary)] text-[10px]">
                  {Math.round((selectedClip.colorGrade?.vignette ?? 0) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={0.8}
                step={0.05}
                value={selectedClip.colorGrade?.vignette ?? 0}
                onChange={(e) => updateColorGrade({ vignette: Number(e.target.value) })}
                className="w-full accent-[var(--accent-primary)]"
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: AUDIO & MIXER */}
      {activeSection === 'audio' && (
        <div className="space-y-3">
          {/* Volume dB */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">Master Volume</span>
              <span className="font-mono text-[var(--accent-primary)] font-bold text-[11px]">
                {selectedClip.audio?.mute
                  ? 'MUTED'
                  : `${Math.round((selectedClip.audio?.volume ?? 1.0) * 100)}%`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1.8}
              step={0.05}
              disabled={selectedClip.audio?.mute}
              value={selectedClip.audio?.volume ?? 1.0}
              onChange={(e) => updateAudio({ volume: Number(e.target.value) })}
              className="w-full accent-[var(--accent-primary)]"
            />
          </div>

          {/* Mute button */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => updateAudio({ mute: !selectedClip.audio?.mute })}
              className={`px-3 py-1 rounded text-xs font-semibold flex items-center space-x-1.5 border transition-colors ${
                selectedClip.audio?.mute
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                  : 'bg-[var(--bg-surface-elevated)] border-[var(--border-subtle)] text-[var(--text-primary)]'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{selectedClip.audio?.mute ? 'Unmute Clip' : 'Mute Clip'}</span>
            </button>
          </div>

          {/* Fade In & Out */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border-subtle)]">
            <div className="space-y-1">
              <label className="text-[10px] text-[var(--text-secondary)]">Fade In (sec)</label>
              <input
                type="number"
                min={0}
                max={5}
                step={0.1}
                value={selectedClip.audio?.fadeIn ?? 0}
                onChange={(e) => updateAudio({ fadeIn: Number(e.target.value) })}
                className="w-full p-1.5 rounded bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-[var(--text-secondary)]">Fade Out (sec)</label>
              <input
                type="number"
                min={0}
                max={5}
                step={0.1}
                value={selectedClip.audio?.fadeOut ?? 0}
                onChange={(e) => updateAudio({ fadeOut: Number(e.target.value) })}
                className="w-full p-1.5 rounded bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)]"
              />
            </div>
          </div>

          {/* Dialogue preview for script voiceover clips */}
          {selectedClip.voiceoverDialogue && (
            <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
              <label className="text-[11px] font-medium text-[var(--text-secondary)] flex items-center justify-between">
                <span>Spoken Dialogue Script</span>
                <button
                  onClick={() => audioStudioEngine.speakText(selectedClip.voiceoverDialogue || '')}
                  className="text-[10px] text-amber-400 hover:underline flex items-center space-x-0.5"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Preview Speech</span>
                </button>
              </label>
              <textarea
                value={selectedClip.voiceoverDialogue}
                onChange={(e) =>
                  onUpdateClip({ ...selectedClip, voiceoverDialogue: e.target.value })
                }
                rows={3}
                className="w-full p-2 text-xs rounded bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] outline-none"
              />
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: TEXT / TYPOGRAPHY (FOR TEXT CLIPS) */}
      {activeSection === 'text' && selectedClip.textSettings && (
        <div className="space-y-3">
          {/* Text Content */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-[var(--text-secondary)]">
              Title / Subtitle Content
            </label>
            <textarea
              value={selectedClip.textSettings.text}
              onChange={(e) => updateText({ text: e.target.value })}
              rows={2}
              className="w-full p-2 text-xs rounded bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] outline-none"
            />
          </div>

          {/* Font Family & Size */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] text-[var(--text-secondary)]">Font Family</label>
              <select
                value={selectedClip.textSettings.fontFamily}
                onChange={(e) => updateText({ fontFamily: e.target.value })}
                className="w-full p-1.5 rounded bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)]"
              >
                <option value="Inter, sans-serif">Inter</option>
                <option value="Impact, sans-serif">Impact</option>
                <option value="Montserrat, sans-serif">Montserrat</option>
                <option value="Courier New, monospace">Courier New</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-[var(--text-secondary)]">
                Font Size ({selectedClip.textSettings.fontSize}px)
              </label>
              <input
                type="number"
                min={20}
                max={140}
                value={selectedClip.textSettings.fontSize}
                onChange={(e) => updateText({ fontSize: Number(e.target.value) })}
                className="w-full p-1.5 rounded bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)]"
              />
            </div>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] text-[var(--text-secondary)]">Text Color</label>
              <div className="flex items-center space-x-1.5">
                <input
                  type="color"
                  value={selectedClip.textSettings.color}
                  onChange={(e) => updateText({ color: e.target.value })}
                  className="w-7 h-7 rounded border border-[var(--border-subtle)] bg-transparent cursor-pointer"
                />
                <span className="font-mono text-[10px] text-[var(--text-primary)]">
                  {selectedClip.textSettings.color}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-[var(--text-secondary)]">Badge Backdrop</label>
              <div className="flex items-center space-x-1.5">
                <input
                  type="color"
                  value={
                    selectedClip.textSettings.backgroundColor &&
                    selectedClip.textSettings.backgroundColor !== 'transparent'
                      ? '#000000'
                      : '#ffffff'
                  }
                  onChange={(e) => updateText({ backgroundColor: e.target.value })}
                  className="w-7 h-7 rounded border border-[var(--border-subtle)] bg-transparent cursor-pointer"
                />
                <button
                  onClick={() => updateText({ backgroundColor: 'transparent' })}
                  className="text-[10px] text-[var(--accent-primary)] hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Animation */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-[var(--text-secondary)]">
              Title Animation
            </label>
            <select
              value={selectedClip.textSettings.animation || 'none'}
              onChange={(e) => updateText({ animation: e.target.value as any })}
              className="w-full p-1.5 rounded bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)]"
            >
              <option value="none">None (Static)</option>
              <option value="typewriter">Typewriter (Reveals characters)</option>
              <option value="fade">Smooth Fade In</option>
              <option value="slide-up">Slide Up</option>
            </select>
          </div>
        </div>
      )}

      {/* SECTION 5: TRANSITIONS (FOR VIDEO / IMAGE CLIPS) */}
      {activeSection === 'transitions' && (
        <div className="space-y-3">
          <label className="text-[11px] font-medium text-[var(--text-secondary)]">
            Cut Transitions
          </label>

          <div className="space-y-2">
            <div className="p-2.5 rounded bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] space-y-1.5">
              <span className="text-[10px] font-bold uppercase text-[var(--accent-primary)]">
                Transition In (Head)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedClip.transitionIn?.type || 'none'}
                  onChange={(e) =>
                    onUpdateClip({
                      ...selectedClip,
                      transitionIn: {
                        type: e.target.value as any,
                        duration: selectedClip.transitionIn?.duration || 0.5,
                      },
                    })
                  }
                  className="p-1 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)]"
                >
                  <option value="none">Cut (None)</option>
                  <option value="dissolve">Cross Dissolve</option>
                  <option value="wipe-left">Wipe Left</option>
                  <option value="wipe-right">Wipe Right</option>
                  <option value="dip-black">Dip to Black</option>
                </select>

                <input
                  type="number"
                  min={0.1}
                  max={2.0}
                  step={0.1}
                  value={selectedClip.transitionIn?.duration || 0.5}
                  onChange={(e) =>
                    onUpdateClip({
                      ...selectedClip,
                      transitionIn: {
                        type: selectedClip.transitionIn?.type || 'dissolve',
                        duration: Number(e.target.value),
                      },
                    })
                  }
                  className="p-1 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)]"
                />
              </div>
            </div>

            <div className="p-2.5 rounded bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] space-y-1.5">
              <span className="text-[10px] font-bold uppercase text-[var(--accent-primary)]">
                Transition Out (Tail)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedClip.transitionOut?.type || 'none'}
                  onChange={(e) =>
                    onUpdateClip({
                      ...selectedClip,
                      transitionOut: {
                        type: e.target.value as any,
                        duration: selectedClip.transitionOut?.duration || 0.5,
                      },
                    })
                  }
                  className="p-1 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)]"
                >
                  <option value="none">Cut (None)</option>
                  <option value="dissolve">Cross Dissolve</option>
                  <option value="wipe-left">Wipe Left</option>
                  <option value="wipe-right">Wipe Right</option>
                  <option value="dip-black">Dip to Black</option>
                </select>

                <input
                  type="number"
                  min={0.1}
                  max={2.0}
                  step={0.1}
                  value={selectedClip.transitionOut?.duration || 0.5}
                  onChange={(e) =>
                    onUpdateClip({
                      ...selectedClip,
                      transitionOut: {
                        type: selectedClip.transitionOut?.type || 'dissolve',
                        duration: Number(e.target.value),
                      },
                    })
                  }
                  className="p-1 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)]"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
