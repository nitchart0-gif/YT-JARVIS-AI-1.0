// src/services/editorEngine.ts
// Real-time Canvas Rendering, Web Audio Synthesis, and MediaRecorder Export Engine for YT EDITOR

import {
  EditorProject,
  Clip,
  ColorGrading,
  TextSettings,
  ChapterMarker,
} from '../types/editor';

// Cache for loaded HTML images and videos
const mediaElementCache = new Map<string, HTMLImageElement | HTMLVideoElement>();

export function getCachedImage(url: string): HTMLImageElement | null {
  if (!url) return null;
  const cached = mediaElementCache.get(url);
  if (cached && cached instanceof HTMLImageElement && cached.complete && cached.naturalWidth > 0) {
    return cached;
  }
  if (!cached) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    mediaElementCache.set(url, img);
  }
  return null;
}

// Format seconds into SMPTE Timecode: HH:MM:SS:FF (or MM:SS:FF)
export function formatTimecode(seconds: number, frameRate: number = 30): string {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const totalFrames = Math.floor(seconds * frameRate);
  const frames = totalFrames % frameRate;
  const totalSeconds = Math.floor(seconds);
  const secs = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const mins = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);

  const pad = (n: number, z: number = 2) => String(n).padStart(z, '0');
  if (hours > 0) {
    return `${pad(hours)}:${pad(mins)}:${pad(secs)}:${pad(frames)}`;
  }
  return `${pad(mins)}:${pad(secs)}:${pad(frames)}`;
}

// Format seconds to simple MM:SS
export function formatDurationSimple(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

// -------------------------------------------------------------
// Canvas Rendering Engine
// -------------------------------------------------------------

export interface RenderOptions {
  showGuides?: boolean;
  showRuleOfThirds?: boolean;
  showTitleSafe?: boolean;
  showVerticalGuide?: boolean;
  showCenterCrosshair?: boolean;
  selectedClipId?: string | null;
  interactivePreview?: boolean;
}

export function renderTimelineToCanvas(
  canvas: HTMLCanvasElement,
  project: EditorProject,
  currentTime: number,
  options: RenderOptions = {}
): void {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  const { width, height } = project.settings.resolution;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  // 1. Clear with Project Background
  ctx.save();
  ctx.fillStyle = project.settings.backgroundColor || '#0a0a0c';
  ctx.fillRect(0, 0, width, height);

  // 2. Identify and sort video tracks from bottom to top (V1 lowest, V3 highest)
  const videoTracks = project.tracks
    .filter((t) => t.type === 'video' && t.visible)
    .sort((a, b) => a.order - b.order);

  // 3. Render active clips on visible video tracks
  for (const track of videoTracks) {
    const activeClips = project.clips.filter(
      (c) =>
        c.trackId === track.id &&
        c.startTime <= currentTime &&
        currentTime < c.startTime + c.duration
    );

    for (const clip of activeClips) {
      renderSingleClip(ctx, clip, currentTime, width, height);
    }
  }

  // 4. Render selected clip bounding box indicator if active
  if (options.selectedClipId) {
    const selectedClip = project.clips.find(
      (c) =>
        c.id === options.selectedClipId &&
        c.startTime <= currentTime &&
        currentTime < c.startTime + c.duration
    );
    if (selectedClip) {
      renderClipBoundingBox(ctx, selectedClip, width, height);
    }
  }

  // 5. Render Composition Guides if requested
  if (options.showGuides) {
    renderCompositionGuides(ctx, width, height, options, project.settings.resolution.id);
  }

  ctx.restore();
}

function renderSingleClip(
  ctx: CanvasRenderingContext2D,
  clip: Clip,
  currentTime: number,
  canvasWidth: number,
  canvasHeight: number
): void {
  ctx.save();

  // Local clip progress
  const timeIntoClip = currentTime - clip.startTime;
  const timeRemaining = clip.duration - timeIntoClip;

  // Transitions calculation
  let transitionAlpha = 1.0;
  let transitionOffset = 0;

  // In transition
  if (clip.transitionIn && clip.transitionIn.type !== 'none' && timeIntoClip < clip.transitionIn.duration) {
    const progress = Math.min(1, Math.max(0, timeIntoClip / clip.transitionIn.duration));
    if (clip.transitionIn.type === 'dissolve' || clip.transitionIn.type === 'dip-black' || clip.transitionIn.type === 'dip-white') {
      transitionAlpha *= progress;
    } else if (clip.transitionIn.type === 'wipe-left') {
      transitionOffset = (1 - progress) * canvasWidth;
    } else if (clip.transitionIn.type === 'wipe-right') {
      transitionOffset = -(1 - progress) * canvasWidth;
    }
  }

  // Out transition
  if (clip.transitionOut && clip.transitionOut.type !== 'none' && timeRemaining < clip.transitionOut.duration) {
    const progress = Math.min(1, Math.max(0, timeRemaining / clip.transitionOut.duration));
    if (clip.transitionOut.type === 'dissolve' || clip.transitionOut.type === 'dip-black' || clip.transitionOut.type === 'dip-white') {
      transitionAlpha *= progress;
    } else if (clip.transitionOut.type === 'wipe-left') {
      transitionOffset = -(1 - progress) * canvasWidth;
    } else if (clip.transitionOut.type === 'wipe-right') {
      transitionOffset = (1 - progress) * canvasWidth;
    }
  }

  // Global Opacity & Blend Mode
  ctx.globalAlpha = Math.max(0, Math.min(1, (clip.transform.opacity ?? 1.0) * transitionAlpha));
  if (clip.transform.blendMode && clip.transform.blendMode !== 'normal') {
    ctx.globalCompositeOperation = clip.transform.blendMode as GlobalCompositeOperation;
  }

  // Transform matrix (Translation, Scale, Rotation)
  const centerX = canvasWidth / 2 + (clip.transform.x / 100) * (canvasWidth / 2);
  const centerY = canvasHeight / 2 + (clip.transform.y / 100) * (canvasHeight / 2);

  ctx.translate(centerX + transitionOffset, centerY);
  if (clip.transform.rotation) {
    ctx.rotate((clip.transform.rotation * Math.PI) / 180);
  }
  const scale = clip.transform.scale || 1.0;
  ctx.scale(scale, scale);

  // Apply Color Grading CSS filter string
  const filterString = buildColorFilterString(clip.colorGrade);
  if (filterString) {
    ctx.filter = filterString;
  }

  // Draw Specific Clip Content based on Type
  if (clip.type === 'color' || clip.solidColor) {
    const color = clip.solidColor || '#18181b';
    ctx.fillStyle = color;
    ctx.fillRect(-canvasWidth / 2, -canvasHeight / 2, canvasWidth, canvasHeight);
  } else if (clip.type === 'image' || clip.type === 'video') {
    renderMediaClip(ctx, clip, canvasWidth, canvasHeight);
  } else if (clip.type === 'text' && clip.textSettings) {
    renderTextClip(ctx, clip.textSettings, timeIntoClip, canvasWidth, canvasHeight);
  }

  // Vignette effect if specified
  if (clip.colorGrade?.vignette && clip.colorGrade.vignette > 0) {
    renderVignette(ctx, canvasWidth, canvasHeight, clip.colorGrade.vignette);
  }

  ctx.restore();
}

function renderMediaClip(
  ctx: CanvasRenderingContext2D,
  clip: Clip,
  canvasWidth: number,
  canvasHeight: number
): void {
  const url = clip.mediaUrl || clip.thumbnailUrl;
  if (!url) {
    // Fallback placeholder pattern
    renderPlaceholderGraphic(ctx, clip.name, canvasWidth, canvasHeight);
    return;
  }

  const img = getCachedImage(url);
  if (img && img.complete && img.naturalWidth > 0) {
    const sw = img.naturalWidth;
    const sh = img.naturalHeight;
    const cw = canvasWidth;
    const ch = canvasHeight;

    let dw = cw;
    let dh = ch;
    let dx = -cw / 2;
    let dy = -ch / 2;

    if (clip.fitMode === 'contain') {
      const scale = Math.min(cw / sw, ch / sh);
      dw = sw * scale;
      dh = sh * scale;
      dx = -dw / 2;
      dy = -dh / 2;
    } else if (clip.fitMode === 'cover') {
      const scale = Math.max(cw / sw, ch / sh);
      dw = sw * scale;
      dh = sh * scale;
      dx = -dw / 2;
      dy = -dh / 2;
    }

    ctx.drawImage(img, dx, dy, dw, dh);
  } else {
    renderPlaceholderGraphic(ctx, clip.name, canvasWidth, canvasHeight);
  }
}

function renderPlaceholderGraphic(
  ctx: CanvasRenderingContext2D,
  title: string,
  width: number,
  height: number
): void {
  const w = width;
  const h = height;
  const grad = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  grad.addColorStop(0, '#090d16');
  grad.addColorStop(0.5, '#1e293b');
  grad.addColorStop(1, '#0f172a');
  ctx.fillStyle = grad;
  ctx.fillRect(-w / 2, -h / 2, w, h);

  // Grid pattern
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 2;
  const step = 80;
  for (let x = -w / 2; x <= w / 2; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, -h / 2);
    ctx.lineTo(x, h / 2);
    ctx.stroke();
  }
  for (let y = -h / 2; y <= h / 2; y += step) {
    ctx.beginPath();
    ctx.moveTo(-w / 2, y);
    ctx.lineTo(w / 2, y);
    ctx.stroke();
  }

  // Center title
  ctx.font = 'bold 36px Inter, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title || 'Video Media Track', 0, 0);
}

function renderTextClip(
  ctx: CanvasRenderingContext2D,
  ts: TextSettings,
  timeIntoClip: number,
  canvasWidth: number,
  _canvasHeight: number
): void {
  let displayText = ts.text || '';

  // Typewriter animation
  if (ts.animation === 'typewriter' && timeIntoClip > 0) {
    const speedCharsPerSec = 25;
    const charsToShow = Math.floor(timeIntoClip * speedCharsPerSec);
    displayText = displayText.slice(0, charsToShow);
  }

  const fontSize = ts.fontSize || 64;
  const fontFamily = ts.fontFamily || 'Inter, sans-serif';
  const fontWeight = ts.fontWeight || '700';
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.textAlign = ts.align || 'center';
  ctx.textBaseline = 'middle';

  // Measure text
  const metrics = ctx.measureText(displayText);
  const textWidth = metrics.width;
  const textHeight = fontSize * 1.2;

  let originX = 0;
  if (ts.align === 'left') originX = -textWidth / 2;
  if (ts.align === 'right') originX = textWidth / 2;

  // Background Box / Badge
  if (ts.backgroundColor && ts.backgroundColor !== 'transparent') {
    const pad = ts.boxPadding || 18;
    ctx.save();
    ctx.fillStyle = ts.backgroundColor;
    let bx = -textWidth / 2 - pad;
    if (ts.align === 'left') bx = -pad;
    if (ts.align === 'right') bx = -textWidth - pad;
    ctx.beginPath();
    roundRect(ctx, bx, -textHeight / 2 - pad / 2, textWidth + pad * 2, textHeight + pad, 8);
    ctx.fill();
    ctx.restore();
  }

  // Shadow
  if (ts.shadowColor && ts.shadowBlur) {
    ctx.shadowColor = ts.shadowColor;
    ctx.shadowBlur = ts.shadowBlur;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 4;
  }

  // Text Outline / Stroke
  if (ts.outlineWidth && ts.outlineWidth > 0 && ts.outlineColor) {
    ctx.strokeStyle = ts.outlineColor;
    ctx.lineWidth = ts.outlineWidth;
    ctx.lineJoin = 'round';
    ctx.strokeText(displayText, originX, 0);
  }

  // Text Fill
  ctx.fillStyle = ts.color || '#ffffff';
  ctx.fillText(displayText, originX, 0);
}

function renderVignette(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number
): void {
  ctx.save();
  const radius = Math.max(width, height) / 1.4;
  const grad = ctx.createRadialGradient(0, 0, radius * 0.4, 0, 0, radius);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(1, `rgba(0, 0, 0, ${Math.min(0.95, intensity * 0.85)})`);
  ctx.fillStyle = grad;
  ctx.fillRect(-width / 2, -height / 2, width, height);
  ctx.restore();
}

function buildColorFilterString(cg?: ColorGrading): string {
  if (!cg) return '';
  const parts: string[] = [];
  if (cg.brightness !== undefined && cg.brightness !== 1.0) {
    parts.push(`brightness(${Math.round(cg.brightness * 100)}%)`);
  }
  if (cg.contrast !== undefined && cg.contrast !== 1.0) {
    parts.push(`contrast(${Math.round(cg.contrast * 100)}%)`);
  }
  if (cg.saturation !== undefined && cg.saturation !== 1.0) {
    parts.push(`saturate(${Math.round(cg.saturation * 100)}%)`);
  }
  const totalHue = (cg.tint || 0) + (cg.temperature || 0);
  if (totalHue !== 0) {
    parts.push(`hue-rotate(${totalHue}deg)`);
  }
  return parts.join(' ');
}

function renderClipBoundingBox(
  ctx: CanvasRenderingContext2D,
  clip: Clip,
  canvasWidth: number,
  canvasHeight: number
): void {
  ctx.save();
  const cx = canvasWidth / 2 + (clip.transform.x / 100) * (canvasWidth / 2);
  const cy = canvasHeight / 2 + (clip.transform.y / 100) * (canvasHeight / 2);

  ctx.translate(cx, cy);
  if (clip.transform.rotation) {
    ctx.rotate((clip.transform.rotation * Math.PI) / 180);
  }
  const scale = clip.transform.scale || 1.0;
  ctx.scale(scale, scale);

  ctx.strokeStyle = '#38bdf8'; // Sky blue pro outline
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 6]);
  const boxW = canvasWidth * 0.7;
  const boxH = canvasHeight * 0.7;
  ctx.strokeRect(-boxW / 2, -boxH / 2, boxW, boxH);

  // Handles at 4 corners
  ctx.setLineDash([]);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 2;
  const hSize = 14;
  const corners = [
    [-boxW / 2, -boxH / 2],
    [boxW / 2, -boxH / 2],
    [boxW / 2, boxH / 2],
    [-boxW / 2, boxH / 2],
  ];
  for (const [x, y] of corners) {
    ctx.fillRect(x - hSize / 2, y - hSize / 2, hSize, hSize);
    ctx.strokeRect(x - hSize / 2, y - hSize / 2, hSize, hSize);
  }
  ctx.restore();
}

function renderCompositionGuides(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: RenderOptions,
  aspectRatioId: string
): void {
  ctx.save();

  // Rule of thirds
  if (options.showRuleOfThirds !== false) {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)'; // Subtle cyan
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    // Vertical 1/3 and 2/3
    ctx.beginPath();
    ctx.moveTo(width / 3, 0);
    ctx.lineTo(width / 3, height);
    ctx.moveTo((width * 2) / 3, 0);
    ctx.lineTo((width * 2) / 3, height);
    // Horizontal 1/3 and 2/3
    ctx.moveTo(0, height / 3);
    ctx.lineTo(width, height / 3);
    ctx.moveTo(0, (height * 2) / 3);
    ctx.lineTo(width, (height * 2) / 3);
    ctx.stroke();
  }

  // Center crosshair
  if (options.showCenterCrosshair) {
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)'; // Subtle red
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    const cSize = 24;
    ctx.beginPath();
    ctx.moveTo(width / 2 - cSize, height / 2);
    ctx.lineTo(width / 2 + cSize, height / 2);
    ctx.moveTo(width / 2, height / 2 - cSize);
    ctx.lineTo(width / 2, height / 2 + cSize);
    ctx.stroke();
  }

  // Title-safe margin (10% inner boundary)
  if (options.showTitleSafe) {
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.45)'; // Amber
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    const marginX = width * 0.1;
    const marginY = height * 0.1;
    ctx.strokeRect(marginX, marginY, width - marginX * 2, height - marginY * 2);
  }

  // 9:16 Vertical Shorts safe guide when on 16:9
  if (options.showVerticalGuide && aspectRatioId === '16:9') {
    const verticalWidth = height * (9 / 16);
    const startX = (width - verticalWidth) / 2;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    // Left darken bar
    ctx.fillRect(0, 0, startX, height);
    // Right darken bar
    ctx.fillRect(startX + verticalWidth, 0, startX, height);
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.8)'; // Pink vertical guideline
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.strokeRect(startX, 0, verticalWidth, height);
  }

  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
}

// -------------------------------------------------------------
// Real Web Audio API Synthesis Engine
// -------------------------------------------------------------

class WebAudioStudioEngine {
  private ctx: AudioContext | null = null;

  private initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public playSoundEffect(type: 'boom' | 'whoosh' | 'glitch' | 'pop' | 'riser' | 'shutter'): void {
    try {
      const ac = this.initContext();
      const now = ac.currentTime;

      if (type === 'boom') {
        // Deep sub-bass cinematic boom
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.exponentialRampToValueAtTime(32, now + 0.8);
        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start(now);
        osc.stop(now + 1.3);
      } else if (type === 'whoosh') {
        // Filtered noise sweep
        const bufferSize = ac.sampleRate * 0.6;
        const noiseBuffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const whiteNoise = ac.createBufferSource();
        whiteNoise.buffer = noiseBuffer;

        const filter = ac.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(250, now);
        filter.frequency.exponentialRampToValueAtTime(2800, now + 0.3);
        filter.frequency.exponentialRampToValueAtTime(400, now + 0.6);

        const gain = ac.createGain();
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.5, now + 0.25);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

        whiteNoise.connect(filter);
        filter.connect(gain);
        gain.connect(ac.destination);
        whiteNoise.start(now);
      } else if (type === 'glitch') {
        // Digital glitch square wave bursts
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.setValueAtTime(160, now + 0.05);
        osc.frequency.setValueAtTime(1400, now + 0.1);
        osc.frequency.setValueAtTime(420, now + 0.15);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start(now);
        osc.stop(now + 0.26);
      } else if (type === 'pop') {
        // High ping pop
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1750, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'riser') {
        // Ascending riser
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 1.2);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.4, now + 1.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.25);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start(now);
        osc.stop(now + 1.3);
      } else if (type === 'shutter') {
        // Camera shutter click
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(900, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.04);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start(now);
        osc.stop(now + 0.06);
      }
    } catch (e) {
      console.warn('WebAudio playback warning:', e);
    }
  }

  // Speak voiceover text using browser SpeechSynthesis API
  public speakText(text: string, onEnd?: () => void): void {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    if (onEnd) utterance.onend = onEnd;
    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const audioStudioEngine = new WebAudioStudioEngine();

// -------------------------------------------------------------
// Real Video Export via Canvas Stream & MediaRecorder
// -------------------------------------------------------------

export interface ExportProgress {
  currentSecond: number;
  totalSeconds: number;
  percentage: number;
  statusText: string;
  bytesExported: number;
}

export interface ExportOptions {
  resolutionWidth?: number;
  resolutionHeight?: number;
  fps?: number;
  bitrateBps?: number;
  mimeType?: string;
}

export async function exportProjectToVideo(
  project: EditorProject,
  options: ExportOptions = {},
  onProgress: (progress: ExportProgress) => void
): Promise<{ blob: Blob; mimeType: string }> {
  const width = options.resolutionWidth || project.settings.resolution.width;
  const height = options.resolutionHeight || project.settings.resolution.height;
  const fps = options.fps || project.settings.frameRate || 30;
  const totalDuration = Math.max(1, project.settings.duration);

  // Pick supported MIME type
  let chosenMime = 'video/webm;codecs=vp9,opus';
  if (options.mimeType && MediaRecorder.isTypeSupported(options.mimeType)) {
    chosenMime = options.mimeType;
  } else if (!MediaRecorder.isTypeSupported(chosenMime)) {
    chosenMime = MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
      ? 'video/webm;codecs=vp8'
      : MediaRecorder.isTypeSupported('video/webm')
      ? 'video/webm'
      : MediaRecorder.isTypeSupported('video/mp4')
      ? 'video/mp4'
      : '';
  }

  // Create dedicated offscreen canvas for rendering
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = width;
  exportCanvas.height = height;

  const stream = exportCanvas.captureStream(fps);

  // Setup MediaRecorder
  const recorderOptions: MediaRecorderOptions = {
    videoBitsPerSecond: options.bitrateBps || 5_000_000, // 5 Mbps
  };
  if (chosenMime) {
    recorderOptions.mimeType = chosenMime;
  }

  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(stream, recorderOptions);

  recorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  return new Promise((resolve, reject) => {
    recorder.onstop = () => {
      const finalBlob = new Blob(chunks, { type: chosenMime || 'video/webm' });
      resolve({ blob: finalBlob, mimeType: chosenMime || 'video/webm' });
    };

    recorder.onerror = (err) => {
      reject(err);
    };

    recorder.start(100);

    const frameIntervalMs = 1000 / fps;
    const stepDuration = 1 / fps;
    let currentRenderTime = 0;

    const renderStep = () => {
      if (currentRenderTime >= totalDuration) {
        // Complete
        onProgress({
          currentSecond: totalDuration,
          totalSeconds: totalDuration,
          percentage: 100,
          statusText: 'Finalizing video stream and encoding...',
          bytesExported: chunks.reduce((acc, c) => acc + c.size, 0),
        });
        setTimeout(() => {
          recorder.stop();
        }, 300);
        return;
      }

      // Render frame
      renderTimelineToCanvas(exportCanvas, project, currentRenderTime, {
        showGuides: false,
      });

      currentRenderTime += stepDuration;

      const pct = Math.min(99, Math.round((currentRenderTime / totalDuration) * 100));
      onProgress({
        currentSecond: currentRenderTime,
        totalSeconds: totalDuration,
        percentage: pct,
        statusText: `Rendering frame ${Math.floor(currentRenderTime * fps)} of ${Math.floor(totalDuration * fps)} (${formatDurationSimple(currentRenderTime)} / ${formatDurationSimple(totalDuration)})`,
        bytesExported: chunks.reduce((acc, c) => acc + c.size, 0),
      });

      // Schedule next frame with requestAnimationFrame for smooth execution
      requestAnimationFrame(renderStep);
    };

    renderStep();
  });
}

// -------------------------------------------------------------
// YouTube Chapters and SRT Subtitles Generators
// -------------------------------------------------------------

export function generateYouTubeChaptersText(
  project: EditorProject,
  customIntro: string = 'Introduction'
): string {
  const lines: string[] = [];

  // Always start with 00:00
  lines.push(`00:00 ${customIntro}`);

  // Sort chapter markers
  const markers = [...(project.markers || [])].sort((a, b) => a.time - b.time);
  for (const marker of markers) {
    if (marker.time > 0) {
      lines.push(`${formatDurationSimple(marker.time)} ${marker.title}`);
    }
  }

  // If no markers, generate chapters from clips on Track 1 (V1)
  if (markers.length === 0) {
    const v1Clips = project.clips
      .filter((c) => c.startTime > 0)
      .sort((a, b) => a.startTime - b.startTime);
    for (const clip of v1Clips) {
      lines.push(`${formatDurationSimple(clip.startTime)} ${clip.name}`);
    }
  }

  return lines.join('\n');
}

export function generateSrtSubtitles(project: EditorProject): string {
  // Collect text clips and dialogue clips
  const subtitleClips = project.clips
    .filter((c) => (c.type === 'text' && c.textSettings?.text) || c.voiceoverDialogue)
    .sort((a, b) => a.startTime - b.startTime);

  const srtBlocks: string[] = [];

  const formatSrtTime = (seconds: number) => {
    const totalSecs = Math.floor(seconds);
    const ms = Math.floor((seconds - totalSecs) * 1000);
    const secs = totalSecs % 60;
    const mins = Math.floor(totalSecs / 60) % 60;
    const hours = Math.floor(totalSecs / 3600);
    const pad = (n: number, z = 2) => String(n).padStart(z, '0');
    return `${pad(hours)}:${pad(mins)}:${pad(secs)},${pad(ms, 3)}`;
  };

  subtitleClips.forEach((clip, index) => {
    const startStr = formatSrtTime(clip.startTime);
    const endStr = formatSrtTime(clip.startTime + clip.duration);
    const text = clip.voiceoverDialogue || clip.textSettings?.text || clip.name;

    srtBlocks.push(`${index + 1}\n${startStr} --> ${endStr}\n${text}\n`);
  });

  return srtBlocks.join('\n');
}
