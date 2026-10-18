// src/types/editor.ts
// Comprehensive type definitions for YT EDITOR Non-Linear Video Editing Studio

export type AspectRatioId = '16:9' | '9:16' | '1:1' | '4:5';

export interface ResolutionPreset {
  id: AspectRatioId;
  label: string;
  width: number;
  height: number;
  aspectRatio: string;
  description: string;
}

export const RESOLUTION_PRESETS: ResolutionPreset[] = [
  {
    id: '16:9',
    label: '16:9 Widescreen (1080p)',
    width: 1920,
    height: 1080,
    aspectRatio: '16 / 9',
    description: 'Standard YouTube Long-form, Documentary, Explainer (1920 x 1080)',
  },
  {
    id: '9:16',
    label: '9:16 Vertical (Shorts)',
    width: 1080,
    height: 1920,
    aspectRatio: '9 / 16',
    description: 'YouTube Shorts, TikTok, Instagram Reels (1080 x 1920)',
  },
  {
    id: '1:1',
    label: '1:1 Square (Feed)',
    width: 1080,
    height: 1080,
    aspectRatio: '1 / 1',
    description: 'Square Social Feed & Community Posts (1080 x 1080)',
  },
  {
    id: '4:5',
    label: '4:5 Portrait (Social)',
    width: 1080,
    height: 1350,
    aspectRatio: '4 / 5',
    description: 'High-visibility portrait feed videos (1080 x 1350)',
  },
];

export type ClipType = 'video' | 'audio' | 'image' | 'text' | 'color';

export type BlendMode =
  | 'normal'
  | 'screen'
  | 'multiply'
  | 'overlay'
  | 'lighten'
  | 'darken'
  | 'color-dodge'
  | 'difference';

export type FitMode = 'contain' | 'cover' | 'stretch';

export type TransitionType =
  | 'none'
  | 'dissolve'
  | 'dip-black'
  | 'dip-white'
  | 'wipe-left'
  | 'wipe-right'
  | 'zoom-in'
  | 'glitch';

export type ColorGradePreset =
  | 'natural'
  | 'teal-orange'
  | 'forensic-noir'
  | 'cyber-cyan'
  | 'warm-vintage'
  | 'high-contrast-bw'
  | 'bleach-bypass'
  | 'golden-hour';

export interface ColorGrading {
  preset: ColorGradePreset;
  brightness: number; // 0.5 to 1.5, default 1.0
  contrast: number;   // 0.5 to 1.8, default 1.0
  saturation: number; // 0.0 to 2.0, default 1.0
  temperature: number;// -50 (cool) to 50 (warm), default 0
  tint: number;       // -50 (green) to 50 (magenta), default 0
  exposure: number;   // -1.0 to 1.0, default 0
  vignette: number;   // 0.0 to 1.0, default 0
}

export interface TransformSettings {
  x: number;          // offset % from center (-100 to 100)
  y: number;          // offset % from center (-100 to 100)
  scale: number;      // 0.1 to 3.0, default 1.0
  rotation: number;   // degrees -180 to 180
  opacity: number;    // 0 to 1, default 1.0
  blendMode: BlendMode;
}

export interface AudioSettings {
  volume: number;     // 0.0 to 2.0, default 1.0
  mute: boolean;
  fadeIn: number;     // in seconds, e.g. 0.5
  fadeOut: number;    // in seconds, e.g. 0.5
  pan: number;        // -1.0 (left) to 1.0 (right), default 0
}

export interface TextSettings {
  text: string;
  fontFamily: string;
  fontSize: number;    // relative or px
  fontWeight: string;  // '400' | '600' | '800' | '900'
  color: string;
  backgroundColor?: string;
  boxPadding?: number;
  outlineColor?: string;
  outlineWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  align: 'left' | 'center' | 'right';
  letterSpacing?: number;
  animation?: 'none' | 'typewriter' | 'fade' | 'slide-up' | 'pop-bounce' | 'karaoke';
}

export interface ClipTransition {
  type: TransitionType;
  duration: number; // seconds, e.g. 0.5
}

export interface Clip {
  id: string;
  trackId: string;
  type: ClipType;
  name: string;
  startTime: number;    // In timeline seconds
  duration: number;     // Active length on timeline in seconds
  sourceDuration?: number; // Total length of media source in seconds
  inPoint: number;      // Source media start offset in seconds
  outPoint?: number;    // Source media end offset in seconds
  
  // Media source reference
  mediaUrl?: string;
  thumbnailUrl?: string;
  
  // Visual & Audio configuration
  transform: TransformSettings;
  fitMode: FitMode;
  colorGrade: ColorGrading;
  audio: AudioSettings;
  speed: number;        // 0.25 to 4.0, default 1.0
  
  // Type-specific properties
  textSettings?: TextSettings;
  solidColor?: string;
  
  // Transitions
  transitionIn?: ClipTransition;
  transitionOut?: ClipTransition;
  
  // Associated script/prompt metadata
  scriptSegmentIndex?: number;
  voiceoverDialogue?: string;
  visualPrompt?: string;
}

export interface Track {
  id: string;
  type: 'video' | 'audio';
  name: string;
  order: number;
  muted: boolean;
  locked: boolean;
  visible: boolean;
  solo?: boolean;
}

export interface MediaAsset {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image';
  category: 'footage' | 'music' | 'sfx' | 'graphics' | 'storyboard';
  url: string;
  thumbnailUrl?: string;
  duration?: number; // seconds
  width?: number;
  height?: number;
  sizeBytes?: number;
  createdAt: number;
  description?: string;
}

export interface ChapterMarker {
  id: string;
  time: number; // seconds
  title: string;
  color?: string;
}

export interface ProjectSettings {
  id: string;
  name: string;
  resolution: ResolutionPreset;
  frameRate: 24 | 30 | 60;
  duration: number; // Max sequence timeline duration in seconds, default 60s
  backgroundColor: string;
  createdAt: number;
  updatedAt: number;
}

export interface EditorProject {
  settings: ProjectSettings;
  tracks: Track[];
  clips: Clip[];
  markers: ChapterMarker[];
  assets: MediaAsset[];
}

export type EditorWorkspaceTab = 'edit' | 'color' | 'audio' | 'graphics' | 'export';

export type TimelineTool = 'select' | 'razor' | 'trim';

export interface TimelineState {
  currentTime: number;
  isPlaying: boolean;
  zoom: number; // Pixels per second, default 40
  snappingEnabled: boolean;
  rippleEditEnabled: boolean;
  selectedClipId: string | null;
  selectedTrackId: string | null;
  activeTool: TimelineTool;
  loopPlayback: boolean;
}
