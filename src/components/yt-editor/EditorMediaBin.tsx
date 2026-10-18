// src/components/yt-editor/EditorMediaBin.tsx
import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Music,
  Volume2,
  Type,
  Clapperboard,
  Plus,
  Play,
  Square,
  Sparkles,
  Search,
  Filter,
} from 'lucide-react';
import {
  EditorProject,
  MediaAsset,
  Clip,
  TextSettings,
} from '../../types/editor';
import {
  STOCK_IMAGES,
  STOCK_SFX,
  TITLE_PRESETS,
} from '../../services/editorDefaults';
import { audioStudioEngine } from '../../services/editorEngine';

interface EditorMediaBinProps {
  project: EditorProject;
  currentTime: number;
  onAddClipToTimeline: (clip: Omit<Clip, 'id'>) => void;
  onAddAsset: (asset: MediaAsset) => void;
  onImportEntireScript?: () => void;
  hasScriptData?: boolean;
}

type MediaBinTab = 'project' | 'stock' | 'audio' | 'titles' | 'story';

export const EditorMediaBin: React.FC<EditorMediaBinProps> = ({
  project,
  currentTime,
  onAddClipToTimeline,
  onAddAsset,
  onImportEntireScript,
  hasScriptData = false,
}) => {
  const [activeTab, setActiveTab] = useState<MediaBinTab>('stock');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingSfxId, setPlayingSfxId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const isVideo = file.type.startsWith('video');
      const isAudio = file.type.startsWith('audio');
      const isImage = file.type.startsWith('image');
      const objectUrl = URL.createObjectURL(file);

      const newAsset: MediaAsset = {
        id: `user_asset_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        type: isVideo ? 'video' : isAudio ? 'audio' : 'image',
        category: isAudio ? 'music' : 'footage',
        url: objectUrl,
        thumbnailUrl: isImage ? objectUrl : undefined,
        sizeBytes: file.size,
        duration: isVideo ? 10 : isAudio ? 15 : 5,
        createdAt: Date.now(),
      };

      onAddAsset(newAsset);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
    setActiveTab('project');
  };

  // Add stock image to V1 / V2
  const handleAddStockImage = (img: typeof STOCK_IMAGES[0]) => {
    onAddClipToTimeline({
      trackId: 'v1',
      type: 'image',
      name: img.name,
      startTime: currentTime,
      duration: 5.0,
      inPoint: 0,
      mediaUrl: img.url,
      thumbnailUrl: img.url,
      transform: { x: 0, y: 0, scale: 1.0, rotation: 0, opacity: 1.0, blendMode: 'normal' },
      fitMode: 'cover',
      colorGrade: { preset: 'teal-orange', brightness: 1, contrast: 1.05, saturation: 1.1, temperature: 0, tint: 0, exposure: 0, vignette: 0.2 },
      audio: { volume: 1.0, mute: false, fadeIn: 0.3, fadeOut: 0.3, pan: 0 },
      speed: 1.0,
      transitionIn: { type: 'dissolve', duration: 0.5 },
      transitionOut: { type: 'dissolve', duration: 0.5 },
    });
  };

  // Add SFX to A3
  const handleAddSfx = (sfx: typeof STOCK_SFX[0]) => {
    onAddClipToTimeline({
      trackId: 'a3',
      type: 'audio',
      name: sfx.name,
      startTime: currentTime,
      duration: sfx.duration,
      inPoint: 0,
      transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, blendMode: 'normal' },
      fitMode: 'contain',
      colorGrade: { preset: 'natural', brightness: 1, contrast: 1, saturation: 1, temperature: 0, tint: 0, exposure: 0, vignette: 0 },
      audio: { volume: 0.8, mute: false, fadeIn: 0, fadeOut: 0.1, pan: 0 },
      speed: 1.0,
    });
    audioStudioEngine.playSoundEffect(sfx.sfxType);
  };

  // Add Title Preset to V3
  const handleAddTitle = (preset: typeof TITLE_PRESETS[0]) => {
    onAddClipToTimeline({
      trackId: 'v3',
      type: 'text',
      name: preset.name,
      startTime: currentTime,
      duration: 4.5,
      inPoint: 0,
      transform: { x: 0, y: 0, scale: 1.0, rotation: 0, opacity: 1.0, blendMode: 'normal' },
      fitMode: 'contain',
      colorGrade: { preset: 'natural', brightness: 1, contrast: 1, saturation: 1, temperature: 0, tint: 0, exposure: 0, vignette: 0 },
      audio: { volume: 1.0, mute: false, fadeIn: 0, fadeOut: 0, pan: 0 },
      speed: 1.0,
      textSettings: {
        text: preset.text,
        fontFamily: 'Inter, sans-serif',
        fontSize: preset.fontSize,
        fontWeight: preset.fontWeight,
        color: preset.color,
        backgroundColor: preset.backgroundColor,
        boxPadding: preset.boxPadding,
        outlineColor: preset.outlineColor,
        outlineWidth: preset.outlineWidth,
        shadowColor: preset.shadowColor,
        shadowBlur: preset.shadowBlur,
        align: preset.align,
        animation: preset.animation,
      },
      transitionIn: { type: 'dissolve', duration: 0.4 },
      transitionOut: { type: 'dissolve', duration: 0.4 },
    });
  };

  // Preview SFX sound
  const handlePreviewSfx = (sfx: typeof STOCK_SFX[0]) => {
    setPlayingSfxId(sfx.id);
    audioStudioEngine.playSoundEffect(sfx.sfxType);
    setTimeout(() => {
      setPlayingSfxId(null);
    }, sfx.duration * 1000);
  };

  return (
    <div
      className="flex flex-col h-full border-r overflow-hidden select-none"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Header and Bin Tabs */}
      <div className="p-3 border-b border-[var(--border-subtle)] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            Project Media & Assets
          </span>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept="image/*,video/*,audio/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2 py-1 text-[11px] font-semibold rounded bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-[var(--text-primary)] flex items-center space-x-1 transition-colors"
          >
            <Upload className="w-3 h-3" />
            <span>Import</span>
          </button>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-5 gap-1 p-0.5 bg-[var(--bg-surface-elevated)] rounded-lg text-[11px]">
          <button
            onClick={() => setActiveTab('stock')}
            className={`py-1 rounded font-medium transition-all text-center ${
              activeTab === 'stock'
                ? 'bg-[var(--accent-primary)] text-[var(--bg-base)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Stock
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            className={`py-1 rounded font-medium transition-all text-center ${
              activeTab === 'audio'
                ? 'bg-[var(--accent-primary)] text-[var(--bg-base)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Audio
          </button>
          <button
            onClick={() => setActiveTab('titles')}
            className={`py-1 rounded font-medium transition-all text-center ${
              activeTab === 'titles'
                ? 'bg-[var(--accent-primary)] text-[var(--bg-base)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Titles
          </button>
          <button
            onClick={() => setActiveTab('project')}
            className={`py-1 rounded font-medium transition-all text-center ${
              activeTab === 'project'
                ? 'bg-[var(--accent-primary)] text-[var(--bg-base)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Project
          </button>
          <button
            onClick={() => setActiveTab('story')}
            className={`py-1 rounded font-medium transition-all text-center ${
              activeTab === 'story'
                ? 'bg-[var(--accent-primary)] text-[var(--bg-base)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Story
          </button>
        </div>
      </div>

      {/* Asset List Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {/* TAB 1: STOCK & CINEMATIC 4K */}
        {activeTab === 'stock' && (
          <div className="space-y-3">
            <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
              <span>Cinematic Visual Assets</span>
              <span>4 items</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {STOCK_IMAGES.map((img) => (
                <div
                  key={img.id}
                  className="group relative rounded-lg border overflow-hidden transition-all hover:border-[var(--accent-primary)]"
                  style={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div className="aspect-video w-full overflow-hidden bg-black relative">
                    <img
                      src={img.url}
                      alt={img.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                      <button
                        onClick={() => handleAddStockImage(img)}
                        className="px-2 py-1 rounded bg-[var(--accent-primary)] text-[var(--bg-base)] text-[10px] font-bold flex items-center space-x-1 shadow-md hover:scale-105 transition-transform"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                  <div className="p-1.5">
                    <p className="text-[11px] font-medium text-[var(--text-primary)] truncate">
                      {img.name}
                    </p>
                    <p className="text-[9px] text-[var(--text-muted)] truncate">
                      {img.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Solid color generators */}
            <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                Color Solid Backgrounds
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { name: 'Pure Black', hex: '#000000' },
                  { name: 'Dark Slate', hex: '#0f172a' },
                  { name: 'Cyber Blue', hex: '#0284c7' },
                  { name: 'Crimson', hex: '#881337' },
                ].map((c) => (
                  <button
                    key={c.name}
                    onClick={() =>
                      onAddClipToTimeline({
                        trackId: 'v1',
                        type: 'color',
                        name: `Solid: ${c.name}`,
                        solidColor: c.hex,
                        startTime: currentTime,
                        duration: 5.0,
                        inPoint: 0,
                        transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, blendMode: 'normal' },
                        fitMode: 'cover',
                        colorGrade: { preset: 'natural', brightness: 1, contrast: 1, saturation: 1, temperature: 0, tint: 0, exposure: 0, vignette: 0 },
                        audio: { volume: 1, mute: false, fadeIn: 0, fadeOut: 0, pan: 0 },
                        speed: 1,
                      })
                    }
                    className="p-1.5 rounded border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] text-center text-[10px] text-[var(--text-secondary)] flex flex-col items-center gap-1 transition-colors"
                  >
                    <div className="w-full h-4 rounded" style={{ backgroundColor: c.hex }} />
                    <span className="truncate w-full">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AUDIO & SOUND EFFECTS */}
        {activeTab === 'audio' && (
          <div className="space-y-3">
            <div className="text-[11px] text-[var(--text-muted)]">
              Interactive Sound Effects & Audio Layers
            </div>

            <div className="space-y-1.5">
              {STOCK_SFX.map((sfx) => (
                <div
                  key={sfx.id}
                  className="flex items-center justify-between p-2 rounded-lg border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] transition-colors"
                  style={{ backgroundColor: 'var(--bg-surface-elevated)' }}
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <button
                      onClick={() => handlePreviewSfx(sfx)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform ${
                        playingSfxId === sfx.id
                          ? 'bg-emerald-500 text-white scale-110 animate-pulse'
                          : 'bg-[var(--bg-surface-hover)] text-[var(--text-primary)] hover:scale-105'
                      }`}
                      title="Play / Preview SFX"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                        {sfx.name}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)] truncate">
                        {sfx.description} • {sfx.duration}s
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddSfx(sfx)}
                    className="p-1.5 rounded hover:bg-[var(--bg-surface-hover)] text-[var(--accent-primary)] hover:text-[var(--text-primary)]"
                    title="Add to A3 SFX Track"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Background Music Loop */}
            <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                Background Music Score
              </span>
              <div
                className="p-2.5 rounded-lg border border-[var(--border-subtle)] flex items-center justify-between"
                style={{ backgroundColor: 'var(--bg-surface-elevated)' }}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Music className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[var(--text-primary)]">
                      Documentary Ambient Synth
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      Subtle cinematic bed • 24.0s loop
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    onAddClipToTimeline({
                      trackId: 'a2',
                      type: 'audio',
                      name: 'Documentary Ambient Synth',
                      startTime: currentTime,
                      duration: 20.0,
                      inPoint: 0,
                      transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, blendMode: 'normal' },
                      fitMode: 'contain',
                      colorGrade: { preset: 'natural', brightness: 1, contrast: 1, saturation: 1, temperature: 0, tint: 0, exposure: 0, vignette: 0 },
                      audio: { volume: 0.45, mute: false, fadeIn: 1.0, fadeOut: 1.5, pan: 0 },
                      speed: 1,
                    })
                  }
                  className="px-2 py-1 rounded bg-[var(--accent-primary)] text-[var(--bg-base)] text-[10px] font-bold flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add to A2</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TITLES & LOWER THIRDS */}
        {activeTab === 'titles' && (
          <div className="space-y-3">
            <div className="text-[11px] text-[var(--text-muted)]">
              Broadcast Title Templates & Lower Thirds
            </div>

            <div className="space-y-2">
              {TITLE_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  className="p-2.5 rounded-lg border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] transition-all space-y-2"
                  style={{ backgroundColor: 'var(--bg-surface-elevated)' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--text-primary)]">
                      {preset.name}
                    </span>
                    <button
                      onClick={() => handleAddTitle(preset)}
                      className="px-2 py-0.5 rounded bg-[var(--accent-primary)] text-[var(--bg-base)] text-[10px] font-bold flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>

                  {/* Visual preview pill */}
                  <div className="p-2 rounded bg-black/60 flex items-center justify-center text-center">
                    <span
                      style={{
                        color: preset.color,
                        fontWeight: preset.fontWeight,
                        backgroundColor: preset.backgroundColor,
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: 12,
                      }}
                      className="truncate max-w-full"
                    >
                      {preset.text}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: PROJECT ASSETS / USER UPLOADS */}
        {activeTab === 'project' && (
          <div className="space-y-3">
            <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
              <span>Imported Media ({project.assets.length})</span>
            </div>

            {project.assets.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--text-muted)] space-y-2 border border-dashed border-[var(--border-subtle)] rounded-lg">
                <Upload className="w-6 h-6 mx-auto opacity-40" />
                <p>No user media imported yet</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1 text-xs font-semibold rounded bg-[var(--accent-primary)] text-[var(--bg-base)] inline-flex items-center space-x-1"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose Files</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {project.assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="group relative rounded-lg border overflow-hidden"
                    style={{
                      backgroundColor: 'var(--bg-surface-elevated)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div className="aspect-video w-full bg-black relative flex items-center justify-center overflow-hidden">
                      {asset.thumbnailUrl ? (
                        <img
                          src={asset.thumbnailUrl}
                          alt={asset.name}
                          className="w-full h-full object-cover"
                        />
                      ) : asset.type === 'audio' ? (
                        <Music className="w-6 h-6 text-indigo-400" />
                      ) : (
                        <Clapperboard className="w-6 h-6 text-sky-400" />
                      )}

                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          onClick={() => {
                            const isAudio = asset.type === 'audio';
                            onAddClipToTimeline({
                              trackId: isAudio ? 'a1' : 'v1',
                              type: asset.type,
                              name: asset.name,
                              startTime: currentTime,
                              duration: asset.duration || 5.0,
                              inPoint: 0,
                              mediaUrl: asset.url,
                              thumbnailUrl: asset.thumbnailUrl,
                              transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, blendMode: 'normal' },
                              fitMode: 'cover',
                              colorGrade: { preset: 'natural', brightness: 1, contrast: 1, saturation: 1, temperature: 0, tint: 0, exposure: 0, vignette: 0 },
                              audio: { volume: 1, mute: false, fadeIn: 0.2, fadeOut: 0.2, pan: 0 },
                              speed: 1,
                            });
                          }}
                          className="px-2 py-1 rounded bg-[var(--accent-primary)] text-[var(--bg-base)] text-[10px] font-bold flex items-center space-x-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add to Track</span>
                        </button>
                      </div>
                    </div>
                    <div className="p-1.5">
                      <p className="text-[11px] font-medium text-[var(--text-primary)] truncate">
                        {asset.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: STORY & SCRIPT INTEGRATION */}
        {activeTab === 'story' && (
          <div className="space-y-3">
            <div className="text-[11px] text-[var(--text-muted)]">
              Script Generator Integration
            </div>

            {hasScriptData ? (
              <div className="space-y-3">
                <div
                  className="p-3 rounded-lg border border-[var(--border-subtle)] space-y-2"
                  style={{ backgroundColor: 'var(--bg-surface-elevated)' }}
                >
                  <p className="text-xs font-semibold text-[var(--text-primary)]">
                    Active Script Connected
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Synchronize all scene segments, dialogue lines, and visual prompts directly into this timeline project.
                  </p>
                  {onImportEntireScript && (
                    <button
                      onClick={onImportEntireScript}
                      className="w-full py-1.5 rounded text-xs font-bold bg-[var(--accent-primary)] text-[var(--bg-base)] flex items-center justify-center space-x-1.5 shadow"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Re-Import Script to Timeline</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[var(--text-muted)] space-y-2 border border-dashed border-[var(--border-subtle)] rounded-lg p-4">
                <Clapperboard className="w-6 h-6 mx-auto opacity-40" />
                <p>No active script transferred yet.</p>
                <p className="text-[10px]">
                  Generate a script in the <strong>Script Generator</strong> tab and click <strong>"Open in YT Editor"</strong> to automatically map segments into timeline clips.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
