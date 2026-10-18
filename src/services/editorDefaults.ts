// src/services/editorDefaults.ts
// Default templates, stock assets, and converters for YT EDITOR

import {
  EditorProject,
  Track,
  Clip,
  MediaAsset,
  RESOLUTION_PRESETS,
} from '../types/editor';
import { ScriptGenerationResponse } from './api';

// Image asset paths generated in the applet
export const STOCK_IMAGES = [
  {
    id: 'asset_cleanroom',
    name: 'Semiconductor Fabrication Cleanroom',
    url: '/src/assets/images/tech_cleanroom_wafer_1791974643356.jpg',
    category: 'footage' as const,
    type: 'image' as const,
    description: 'Cinematic 35mm wafer robotics in cleanroom chamber',
  },
  {
    id: 'asset_datacenter',
    name: 'AI Supercomputing Datacenter Hall',
    url: '/src/assets/images/datacenter_ai_server_1791974660383.jpg',
    category: 'footage' as const,
    type: 'image' as const,
    description: 'Massive towering server racks with amber & cyan diagnostic arrays',
  },
  {
    id: 'asset_microchip',
    name: 'Microchip Die Macro Etching',
    url: '/src/assets/images/microchip_macro_die_1791974683816.jpg',
    category: 'footage' as const,
    type: 'image' as const,
    description: 'Gold etched silicon circuitry and iridescent reflections',
  },
  {
    id: 'asset_war_room',
    name: 'Investigative Briefing War Room',
    url: '/src/assets/images/investigative_war_room_1791974716462.jpg',
    category: 'footage' as const,
    type: 'image' as const,
    description: 'Twilight intelligence room with geopolitical telemetry screens',
  },
];

export const STOCK_SFX: { id: string; name: string; sfxType: 'boom' | 'whoosh' | 'glitch' | 'pop' | 'riser' | 'shutter'; duration: number; description: string }[] = [
  { id: 'sfx_boom', name: 'Cinematic Sub-Bass Boom', sfxType: 'boom', duration: 1.5, description: 'Deep impactful low-end hit for dramatic emphasis' },
  { id: 'sfx_whoosh', name: 'Fast Whoosh Transition', sfxType: 'whoosh', duration: 0.6, description: 'Smooth filtered air sweep for scene cuts' },
  { id: 'sfx_glitch', name: 'Digital Data Glitch', sfxType: 'glitch', duration: 0.3, description: 'Cybernetic distortion pop for tech transitions' },
  { id: 'sfx_pop', name: 'UI Pop Accent', sfxType: 'pop', duration: 0.1, description: 'Crisp ping for lower-third and subtitle pops' },
  { id: 'sfx_riser', name: 'Suspense Tension Riser', sfxType: 'riser', duration: 1.3, description: 'Ascending sawtooth pitch sweep leading into a reveal' },
  { id: 'sfx_shutter', name: 'Camera Shutter Snapshot', sfxType: 'shutter', duration: 0.1, description: 'Documentary freeze-frame audio snap' },
];

export const TITLE_PRESETS = [
  {
    id: 'title_cinematic_hook',
    name: 'Cinematic Story Hook',
    text: 'THE UNTOLD SILICON CRISIS',
    fontSize: 58,
    fontWeight: '900',
    color: '#ffffff',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    boxPadding: 20,
    outlineColor: '#000000',
    outlineWidth: 3,
    shadowColor: 'rgba(0,0,0,0.8)',
    shadowBlur: 16,
    align: 'center' as const,
    animation: 'typewriter' as const,
  },
  {
    id: 'title_modern_lower_third',
    name: 'Modern Lower-Third Badge',
    text: 'DR. ELENA VANCE // RESEARCH DIRECTORY',
    fontSize: 34,
    fontWeight: '700',
    color: '#38bdf8',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    boxPadding: 16,
    outlineColor: 'transparent',
    outlineWidth: 0,
    align: 'left' as const,
    animation: 'slide-up' as const,
  },
  {
    id: 'title_breaking_news',
    name: 'Breaking News Banner',
    text: 'BREAKING: GLOBAL SUPPLY PROTOCOL SHIFT',
    fontSize: 42,
    fontWeight: '800',
    color: '#fef08a',
    backgroundColor: 'rgba(185, 28, 28, 0.95)',
    boxPadding: 18,
    outlineColor: '#000000',
    outlineWidth: 2,
    align: 'center' as const,
    animation: 'pop-bounce' as const,
  },
  {
    id: 'title_yellow_sub',
    name: 'High-Impact Viral Subtitle',
    text: 'Everything changed in 48 hours...',
    fontSize: 46,
    fontWeight: '800',
    color: '#facc15',
    backgroundColor: 'transparent',
    boxPadding: 0,
    outlineColor: '#000000',
    outlineWidth: 6,
    shadowColor: 'rgba(0,0,0,0.9)',
    shadowBlur: 8,
    align: 'center' as const,
    animation: 'karaoke' as const,
  },
];

export function createDefaultTracks(): Track[] {
  return [
    { id: 'v3', type: 'video', name: 'V3: Titles & Graphics', order: 3, muted: false, locked: false, visible: true },
    { id: 'v2', type: 'video', name: 'V2: B-Roll & Overlays', order: 2, muted: false, locked: false, visible: true },
    { id: 'v1', type: 'video', name: 'V1: Main Footage (A-Roll)', order: 1, muted: false, locked: false, visible: true },
    { id: 'a1', type: 'audio', name: 'A1: Voiceover & Dialogue', order: 1, muted: false, locked: false, visible: true },
    { id: 'a2', type: 'audio', name: 'A2: Background Music', order: 2, muted: false, locked: false, visible: true },
    { id: 'a3', type: 'audio', name: 'A3: Sound Effects (SFX)', order: 3, muted: false, locked: false, visible: true },
  ];
}

export function createInitialEditorProject(projectId: string = 'proj_default'): EditorProject {
  const tracks = createDefaultTracks();

  const assets: MediaAsset[] = STOCK_IMAGES.map((img) => ({
    id: img.id,
    name: img.name,
    type: img.type,
    category: img.category,
    url: img.url,
    thumbnailUrl: img.url,
    duration: 10,
    width: 1920,
    height: 1080,
    createdAt: Date.now(),
    description: img.description,
  }));

  // Initial demo sequence: A 24-second tight documentary sequence
  const clips: Clip[] = [
    // V1 Clip 1: Cleanroom
    {
      id: 'clip_v1_1',
      trackId: 'v1',
      type: 'image',
      name: 'Semiconductor Fabrication Intro',
      startTime: 0,
      duration: 6.0,
      inPoint: 0,
      mediaUrl: STOCK_IMAGES[0].url,
      thumbnailUrl: STOCK_IMAGES[0].url,
      transform: { x: 0, y: 0, scale: 1.05, rotation: 0, opacity: 1.0, blendMode: 'normal' },
      fitMode: 'cover',
      colorGrade: { preset: 'teal-orange', brightness: 1.02, contrast: 1.08, saturation: 1.15, temperature: 4, tint: -2, exposure: 0, vignette: 0.3 },
      audio: { volume: 1.0, mute: false, fadeIn: 0.5, fadeOut: 0.5, pan: 0 },
      speed: 1.0,
      transitionIn: { type: 'dissolve', duration: 0.8 },
      transitionOut: { type: 'dissolve', duration: 0.6 },
    },
    // V1 Clip 2: Datacenter
    {
      id: 'clip_v1_2',
      trackId: 'v1',
      type: 'image',
      name: 'AI Datacenter Infrastructure',
      startTime: 6.0,
      duration: 6.0,
      inPoint: 0,
      mediaUrl: STOCK_IMAGES[1].url,
      thumbnailUrl: STOCK_IMAGES[1].url,
      transform: { x: 0, y: 0, scale: 1.0, rotation: 0, opacity: 1.0, blendMode: 'normal' },
      fitMode: 'cover',
      colorGrade: { preset: 'cyber-cyan', brightness: 1.0, contrast: 1.12, saturation: 1.2, temperature: -8, tint: 4, exposure: 0.05, vignette: 0.25 },
      audio: { volume: 1.0, mute: false, fadeIn: 0.4, fadeOut: 0.4, pan: 0 },
      speed: 1.0,
      transitionIn: { type: 'dissolve', duration: 0.6 },
      transitionOut: { type: 'dissolve', duration: 0.5 },
    },
    // V1 Clip 3: Microchip Macro
    {
      id: 'clip_v1_3',
      trackId: 'v1',
      type: 'image',
      name: 'Microchip Die Architecture',
      startTime: 12.0,
      duration: 6.0,
      inPoint: 0,
      mediaUrl: STOCK_IMAGES[2].url,
      thumbnailUrl: STOCK_IMAGES[2].url,
      transform: { x: 0, y: 0, scale: 1.1, rotation: 0, opacity: 1.0, blendMode: 'normal' },
      fitMode: 'cover',
      colorGrade: { preset: 'golden-hour', brightness: 1.04, contrast: 1.1, saturation: 1.25, temperature: 12, tint: -4, exposure: 0, vignette: 0.35 },
      audio: { volume: 1.0, mute: false, fadeIn: 0.5, fadeOut: 0.5, pan: 0 },
      speed: 1.0,
      transitionIn: { type: 'dissolve', duration: 0.5 },
      transitionOut: { type: 'dissolve', duration: 0.5 },
    },
    // V1 Clip 4: War Room
    {
      id: 'clip_v1_4',
      trackId: 'v1',
      type: 'image',
      name: 'Global Decision Briefing',
      startTime: 18.0,
      duration: 6.0,
      inPoint: 0,
      mediaUrl: STOCK_IMAGES[3].url,
      thumbnailUrl: STOCK_IMAGES[3].url,
      transform: { x: 0, y: 0, scale: 1.02, rotation: 0, opacity: 1.0, blendMode: 'normal' },
      fitMode: 'cover',
      colorGrade: { preset: 'forensic-noir', brightness: 0.95, contrast: 1.15, saturation: 0.9, temperature: -5, tint: 2, exposure: -0.05, vignette: 0.4 },
      audio: { volume: 1.0, mute: false, fadeIn: 0.5, fadeOut: 1.0, pan: 0 },
      speed: 1.0,
      transitionIn: { type: 'dissolve', duration: 0.5 },
      transitionOut: { type: 'dip-black', duration: 1.0 },
    },

    // V3 Clip 1: Title Hook
    {
      id: 'clip_v3_title',
      trackId: 'v3',
      type: 'text',
      name: 'Title Hook: The Silicon Frontier',
      startTime: 0.5,
      duration: 4.5,
      inPoint: 0,
      transform: { x: 0, y: -25, scale: 1.0, rotation: 0, opacity: 1.0, blendMode: 'normal' },
      fitMode: 'contain',
      colorGrade: { preset: 'natural', brightness: 1, contrast: 1, saturation: 1, temperature: 0, tint: 0, exposure: 0, vignette: 0 },
      audio: { volume: 1.0, mute: false, fadeIn: 0, fadeOut: 0, pan: 0 },
      speed: 1.0,
      textSettings: {
        text: 'THE SILICON FRONTIER',
        fontFamily: 'Inter, sans-serif',
        fontSize: 54,
        fontWeight: '900',
        color: '#ffffff',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        boxPadding: 22,
        outlineColor: '#000000',
        outlineWidth: 3,
        shadowColor: 'rgba(0,0,0,0.8)',
        shadowBlur: 16,
        align: 'center',
        animation: 'typewriter',
      },
      transitionIn: { type: 'dissolve', duration: 0.5 },
      transitionOut: { type: 'dissolve', duration: 0.5 },
    },
    // V3 Clip 2: Subtitle
    {
      id: 'clip_v3_sub',
      trackId: 'v3',
      type: 'text',
      name: 'Subtitle: Inside the Fab',
      startTime: 6.5,
      duration: 4.8,
      inPoint: 0,
      transform: { x: 0, y: 35, scale: 1.0, rotation: 0, opacity: 1.0, blendMode: 'normal' },
      fitMode: 'contain',
      colorGrade: { preset: 'natural', brightness: 1, contrast: 1, saturation: 1, temperature: 0, tint: 0, exposure: 0, vignette: 0 },
      audio: { volume: 1.0, mute: false, fadeIn: 0, fadeOut: 0, pan: 0 },
      speed: 1.0,
      textSettings: {
        text: 'Where 2-nanometer precision dictates global power.',
        fontFamily: 'Inter, sans-serif',
        fontSize: 38,
        fontWeight: '700',
        color: '#facc15',
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        boxPadding: 16,
        outlineColor: '#000000',
        outlineWidth: 2,
        shadowColor: 'rgba(0,0,0,0.9)',
        shadowBlur: 10,
        align: 'center',
        animation: 'fade',
      },
      transitionIn: { type: 'dissolve', duration: 0.4 },
      transitionOut: { type: 'dissolve', duration: 0.4 },
    },

    // A1 Voiceover Dialogue clips
    {
      id: 'clip_a1_vo1',
      trackId: 'a1',
      type: 'audio',
      name: 'VO 1: Silicon Genesis',
      startTime: 0.8,
      duration: 5.0,
      inPoint: 0,
      transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, blendMode: 'normal' },
      fitMode: 'contain',
      colorGrade: { preset: 'natural', brightness: 1, contrast: 1, saturation: 1, temperature: 0, tint: 0, exposure: 0, vignette: 0 },
      audio: { volume: 1.0, mute: false, fadeIn: 0.2, fadeOut: 0.2, pan: 0 },
      speed: 1.0,
      voiceoverDialogue: 'Inside the ultra-pure cleanrooms, robotic handlers inspect single atomic layers with ultraviolet lasers.',
    },
    {
      id: 'clip_a1_vo2',
      trackId: 'a1',
      type: 'audio',
      name: 'VO 2: Supercomputing Grid',
      startTime: 6.4,
      duration: 5.2,
      inPoint: 0,
      transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, blendMode: 'normal' },
      fitMode: 'contain',
      colorGrade: { preset: 'natural', brightness: 1, contrast: 1, saturation: 1, temperature: 0, tint: 0, exposure: 0, vignette: 0 },
      audio: { volume: 1.0, mute: false, fadeIn: 0.2, fadeOut: 0.2, pan: 0 },
      speed: 1.0,
      voiceoverDialogue: 'Millions of gigawatts power the neural clusters that process mankind’s largest foundation models.',
    },

    // A2 Background Music
    {
      id: 'clip_a2_music',
      trackId: 'a2',
      type: 'audio',
      name: 'Ambient Electronic Soundscape',
      startTime: 0,
      duration: 24.0,
      inPoint: 0,
      transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, blendMode: 'normal' },
      fitMode: 'contain',
      colorGrade: { preset: 'natural', brightness: 1, contrast: 1, saturation: 1, temperature: 0, tint: 0, exposure: 0, vignette: 0 },
      audio: { volume: 0.45, mute: false, fadeIn: 1.5, fadeOut: 2.0, pan: 0 },
      speed: 1.0,
    },

    // A3 Sound Effects
    {
      id: 'clip_a3_sfx1',
      trackId: 'a3',
      type: 'audio',
      name: 'Sub-Bass Impact Boom',
      startTime: 0.1,
      duration: 1.5,
      inPoint: 0,
      transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, blendMode: 'normal' },
      fitMode: 'contain',
      colorGrade: { preset: 'natural', brightness: 1, contrast: 1, saturation: 1, temperature: 0, tint: 0, exposure: 0, vignette: 0 },
      audio: { volume: 0.85, mute: false, fadeIn: 0, fadeOut: 0.3, pan: 0 },
      speed: 1.0,
    },
    {
      id: 'clip_a3_sfx2',
      trackId: 'a3',
      type: 'audio',
      name: 'Whoosh Cut Transition',
      startTime: 5.7,
      duration: 0.6,
      inPoint: 0,
      transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, blendMode: 'normal' },
      fitMode: 'contain',
      colorGrade: { preset: 'natural', brightness: 1, contrast: 1, saturation: 1, temperature: 0, tint: 0, exposure: 0, vignette: 0 },
      audio: { volume: 0.7, mute: false, fadeIn: 0, fadeOut: 0.1, pan: 0 },
      speed: 1.0,
    },
    {
      id: 'clip_a3_sfx3',
      trackId: 'a3',
      type: 'audio',
      name: 'Digital Glitch Hit',
      startTime: 11.8,
      duration: 0.4,
      inPoint: 0,
      transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, blendMode: 'normal' },
      fitMode: 'contain',
      colorGrade: { preset: 'natural', brightness: 1, contrast: 1, saturation: 1, temperature: 0, tint: 0, exposure: 0, vignette: 0 },
      audio: { volume: 0.75, mute: false, fadeIn: 0, fadeOut: 0.1, pan: 0 },
      speed: 1.0,
    },
  ];

  return {
    settings: {
      id: projectId,
      name: 'The Silicon Frontier — Master Cut',
      resolution: RESOLUTION_PRESETS[0], // 16:9 1080p
      frameRate: 30,
      duration: 24.0,
      backgroundColor: '#05070c',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    tracks,
    clips,
    markers: [
      { id: 'm1', time: 0, title: 'Introduction & Cleanroom' },
      { id: 'm2', time: 6.0, title: 'AI Infrastructure Scale' },
      { id: 'm3', time: 12.0, title: 'Microchip Architecture' },
      { id: 'm4', time: 18.0, title: 'Geopolitical Impact' },
    ],
    assets,
  };
}

// Convert a generated script response into an organized video project
export function convertScriptToEditorProject(
  script: ScriptGenerationResponse,
  sourceTitle: string = 'Untitled Story'
): EditorProject {
  const tracks = createDefaultTracks();
  const clips: Clip[] = [];
  let currentTime = 0;

  const stockAssets: MediaAsset[] = STOCK_IMAGES.map((img) => ({
    id: img.id,
    name: img.name,
    type: img.type,
    category: img.category,
    url: img.url,
    thumbnailUrl: img.url,
    duration: 10,
    width: 1920,
    height: 1080,
    createdAt: Date.now(),
    description: img.description,
  }));

  const isShorts =
    script.contentMode?.toLowerCase().includes('short') ||
    (script.durationSeconds && script.durationSeconds <= 60);
  const resolution = isShorts ? RESOLUTION_PRESETS[1] : RESOLUTION_PRESETS[0];

  script.segments.forEach((seg, idx) => {
    // Estimate segment duration in seconds from script segment or fallback
    const words = (seg.voiceover || '').split(/\s+/).filter(Boolean).length;
    const estimatedDuration = seg.estimatedDurationSeconds || Math.max(3.5, Math.min(12, Math.round(words / 2.5)));
    const imageAsset = STOCK_IMAGES[idx % STOCK_IMAGES.length];

    // V1 Video Clip
    clips.push({
      id: `clip_v1_seg_${idx}`,
      trackId: 'v1',
      type: 'image',
      name: `Scene ${idx + 1}: ${seg.type || 'Segment'}`,
      startTime: currentTime,
      duration: estimatedDuration,
      inPoint: 0,
      mediaUrl: imageAsset.url,
      thumbnailUrl: imageAsset.url,
      transform: { x: 0, y: 0, scale: 1.04, rotation: 0, opacity: 1.0, blendMode: 'normal' },
      fitMode: 'cover',
      colorGrade: { preset: 'teal-orange', brightness: 1.02, contrast: 1.08, saturation: 1.1, temperature: 2, tint: 0, exposure: 0, vignette: 0.2 },
      audio: { volume: 1.0, mute: false, fadeIn: 0.3, fadeOut: 0.3, pan: 0 },
      speed: 1.0,
      scriptSegmentIndex: idx,
      transitionIn: idx > 0 ? { type: 'dissolve', duration: 0.4 } : undefined,
    });

    // V3 Title / Subtitle Clip
    if (idx === 0) {
      clips.push({
        id: `clip_v3_hook`,
        trackId: 'v3',
        type: 'text',
        name: `Hook: ${sourceTitle.slice(0, 30)}`,
        startTime: currentTime + 0.3,
        duration: Math.min(estimatedDuration - 0.5, 4.0),
        inPoint: 0,
        transform: { x: 0, y: -25, scale: 1.0, rotation: 0, opacity: 1.0, blendMode: 'normal' },
        fitMode: 'contain',
        colorGrade: { preset: 'natural', brightness: 1, contrast: 1, saturation: 1, temperature: 0, tint: 0, exposure: 0, vignette: 0 },
        audio: { volume: 1.0, mute: false, fadeIn: 0, fadeOut: 0, pan: 0 },
        speed: 1.0,
        textSettings: {
          text: sourceTitle.toUpperCase().slice(0, 36),
          fontFamily: 'Inter, sans-serif',
          fontSize: isShorts ? 42 : 52,
          fontWeight: '900',
          color: '#ffffff',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          boxPadding: 18,
          outlineColor: '#000000',
          outlineWidth: 3,
          shadowColor: 'rgba(0,0,0,0.8)',
          shadowBlur: 14,
          align: 'center',
          animation: 'typewriter',
        },
        transitionIn: { type: 'dissolve', duration: 0.3 },
      });
    } else {
      // Subtitle line
      clips.push({
        id: `clip_v3_sub_${idx}`,
        trackId: 'v3',
        type: 'text',
        name: `Sub ${idx + 1}`,
        startTime: currentTime + 0.2,
        duration: Math.max(0.5, estimatedDuration - 0.4),
        inPoint: 0,
        transform: { x: 0, y: isShorts ? 30 : 35, scale: 1.0, rotation: 0, opacity: 1.0, blendMode: 'normal' },
        fitMode: 'contain',
        colorGrade: { preset: 'natural', brightness: 1, contrast: 1, saturation: 1, temperature: 0, tint: 0, exposure: 0, vignette: 0 },
        audio: { volume: 1.0, mute: false, fadeIn: 0, fadeOut: 0, pan: 0 },
        speed: 1.0,
        textSettings: {
          text: (seg.voiceover || '').slice(0, 60) + ((seg.voiceover || '').length > 60 ? '...' : ''),
          fontFamily: 'Inter, sans-serif',
          fontSize: isShorts ? 32 : 36,
          fontWeight: '700',
          color: '#facc15',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          boxPadding: 14,
          outlineColor: '#000000',
          outlineWidth: 2,
          shadowColor: 'rgba(0,0,0,0.8)',
          shadowBlur: 8,
          align: 'center',
          animation: 'fade',
        },
      });
    }

    // A1 Voiceover Clip
    clips.push({
      id: `clip_a1_dialogue_${idx}`,
      trackId: 'a1',
      type: 'audio',
      name: `VO ${idx + 1}: ${seg.type || 'Dialogue'}`,
      startTime: currentTime + 0.2,
      duration: Math.max(0.5, estimatedDuration - 0.3),
      inPoint: 0,
      transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, blendMode: 'normal' },
      fitMode: 'contain',
      colorGrade: { preset: 'natural', brightness: 1, contrast: 1, saturation: 1, temperature: 0, tint: 0, exposure: 0, vignette: 0 },
      audio: { volume: 1.0, mute: false, fadeIn: 0.1, fadeOut: 0.1, pan: 0 },
      speed: 1.0,
      voiceoverDialogue: seg.voiceover,
    });

    currentTime += estimatedDuration;
  });

  // A2 Background Music Track spanning entire length
  clips.push({
    id: `clip_a2_bgm`,
    trackId: 'a2',
    type: 'audio',
    name: 'Documentary Ambient Score',
    startTime: 0,
    duration: currentTime,
    inPoint: 0,
    transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, blendMode: 'normal' },
    fitMode: 'contain',
    colorGrade: { preset: 'natural', brightness: 1, contrast: 1, saturation: 1, temperature: 0, tint: 0, exposure: 0, vignette: 0 },
    audio: { volume: 0.4, mute: false, fadeIn: 1.5, fadeOut: 2.0, pan: 0 },
    speed: 1.0,
  });

  return {
    settings: {
      id: `proj_script_${Date.now()}`,
      name: `${sourceTitle} — Video Cut`,
      resolution,
      frameRate: 30,
      duration: Math.max(10, Math.ceil(currentTime)),
      backgroundColor: '#06080e',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    tracks,
    clips,
    markers: script.segments.map((s, i) => ({
      id: `m_${i}`,
      time: clips.find((c) => c.id === `clip_v1_seg_${i}`)?.startTime || 0,
      title: s.type || `Scene ${i + 1}`,
    })),
    assets: stockAssets,
  };
}
