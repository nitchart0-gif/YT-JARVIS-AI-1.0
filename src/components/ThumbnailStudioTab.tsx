import React, { useState, useEffect, useRef } from 'react';
import {
  Image as ImageIcon,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Download,
  AlertCircle,
  FileText,
  Clock,
  ChevronDown,
  Layers,
  Sliders,
  ExternalLink,
  ShieldCheck,
  Maximize2,
  Eye,
  Camera,
  Palette,
  Type,
  Grid,
  Smartphone,
  Monitor,
  Upload,
  Undo,
  RotateCcw,
  Zap,
  Info,
  CheckCircle2,
} from 'lucide-react';
import {
  api,
  type ThumbnailStudioPackage,
  type ThumbnailProductionConcept,
  type ScriptGenerationResponse,
} from '../services/api.ts';
import {
  type SourceItem,
  getSavedSources,
  subscribeSources,
} from '../services/sourceRepository.ts';
import { useProject } from '../context/ProjectContext.tsx';

// Built-in 4K-grade photorealistic documentary assets generated for the studio
const PRESET_ASSETS = [
  {
    key: 'cleanroom',
    name: 'Silicon Cleanroom & Wafer Inspection',
    path: '/src/assets/images/tech_cleanroom_wafer_1791974643356.jpg',
    description: 'Robotic wafer inspection, glowing amber laser & clinical white cleanroom',
    tag: 'Hardware Lab',
  },
  {
    key: 'datacenter',
    name: 'AI Supercluster Server Hall',
    path: '/src/assets/images/datacenter_ai_server_1791974660383.jpg',
    description: 'Towering enterprise AI server racks with glowing cyan/amber diagnostic LEDs',
    tag: 'Infrastructure',
  },
  {
    key: 'microchip',
    name: 'Macro Silicon Quantum Die Architecture',
    path: '/src/assets/images/microchip_macro_die_1791974683816.jpg',
    description: 'Extreme macro etched gold microcircuits with prismatic rainbow diffraction',
    tag: 'Silicon Teardown',
  },
  {
    key: 'warroom',
    name: 'Geopolitical Intelligence Briefing Room',
    path: '/src/assets/images/investigative_war_room_1791974716462.jpg',
    description: 'Moody conference room, confidential documents and glowing telemetry world map',
    tag: 'Investigation',
  },
];

const COLOR_GRADE_PRESETS = [
  {
    id: 'teal-orange',
    name: 'Cinematic Teal & Amber',
    cssFilter: 'contrast(120%) saturate(125%) hue-rotate(-8deg)',
    description: 'Documentary blockbusters, high visual drama',
  },
  {
    id: 'forensic-dark',
    name: 'Moody Forensic Noir',
    cssFilter: 'contrast(135%) brightness(88%) saturate(85%)',
    description: 'Deep investigative blacks with sharp focal point',
  },
  {
    id: 'cyber-gold',
    name: 'Hardware Gold & Deep Cyan',
    cssFilter: 'contrast(125%) brightness(96%) sepia(20%) saturate(130%)',
    description: 'Gleaming semiconductor silicon and precision labs',
  },
  {
    id: 'crisp-editorial',
    name: 'Crisp Bloomberg Editorial',
    cssFilter: 'contrast(115%) brightness(102%) saturate(110%)',
    description: 'High journalistic clarity with clean whites',
  },
  {
    id: 'raw-neutral',
    name: 'Raw Natural Photographic',
    cssFilter: 'none',
    description: 'Unprocessed natural lens response',
  },
];

const HEADLINE_COLOR_PRESETS = [
  { label: 'Warning Yellow', hex: '#FACC15', textClass: 'text-amber-300', bgClass: 'bg-amber-400 text-black' },
  { label: 'Breaking Red', hex: '#EF4444', textClass: 'text-red-500', bgClass: 'bg-red-600 text-white' },
  { label: 'Pure White', hex: '#FFFFFF', textClass: 'text-white', bgClass: 'bg-white text-black' },
  { label: 'Electric Cyan', hex: '#22D3EE', textClass: 'text-cyan-400', bgClass: 'bg-cyan-400 text-black' },
  { label: 'Cyber Lime', hex: '#A3E635', textClass: 'text-lime-400', bgClass: 'bg-lime-400 text-black' },
  { label: 'Deep Blue', hex: '#3B82F6', textClass: 'text-blue-500', bgClass: 'bg-blue-600 text-white' },
];

interface ThumbnailStudioTabProps {
  userId: string;
  transferredScript?: ScriptGenerationResponse | null;
  transferredSourceTitle?: string;
  transferredSourceArticle?: string;
  transferredConcept?: any;
  onNavigateToScripts?: () => void;
  onNavigateToSources?: () => void;
}

export const ThumbnailStudioTab: React.FC<ThumbnailStudioTabProps> = ({
  userId,
  transferredScript,
  transferredSourceTitle,
  transferredSourceArticle,
  transferredConcept,
  onNavigateToScripts,
  onNavigateToSources,
}) => {
  // Input Context State
  const [savedSources, setSavedSources] = useState<SourceItem[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string>('transferred');
  const [customTitle, setCustomTitle] = useState<string>(transferredSourceTitle || '');
  const [customText, setCustomText] = useState<string>(
    transferredScript?.segments?.map((s) => s.voiceover).join('\n') || transferredSourceArticle || ''
  );

  // Status & Generation State
  const [loading, setLoading] = useState<boolean>(false);
  const [regeneratingConceptId, setRegeneratingConceptId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Thumbnail Studio Package
  const [thumbPackage, setThumbPackage] = useState<ThumbnailStudioPackage | null>(null);
  const [selectedConceptIndex, setSelectedConceptIndex] = useState<number>(0);

  // Live Canvas Studio Interactive Controls
  const [selectedImageSrc, setSelectedImageSrc] = useState<string>(PRESET_ASSETS[0].path);
  const [selectedAssetKey, setSelectedAssetKey] = useState<string>('cleanroom');
  const [activeColorGradeId, setActiveColorGradeId] = useState<string>('teal-orange');
  const [vignetteEnabled, setVignetteEnabled] = useState<boolean>(true);
  const [vignetteStrength, setVignetteStrength] = useState<number>(0.65);
  const [contrastAdjustment, setContrastAdjustment] = useState<number>(115);
  const [brightnessAdjustment, setBrightnessAdjustment] = useState<number>(98);
  const [saturationAdjustment, setSaturationAdjustment] = useState<number>(110);

  // Typography Controls
  const [headlineText, setHeadlineText] = useState<string>('THE HIDDEN TRUTH');
  const [subHeadlineText, setSubHeadlineText] = useState<string>('INVESTIGATION');
  const [headlineColor, setHeadlineColor] = useState<string>('#FACC15');
  const [headlinePosition, setHeadlinePosition] = useState<'top-left' | 'center-left' | 'bottom-left' | 'top-right' | 'bottom-right'>('bottom-left');
  const [headlineStyle, setHeadlineStyle] = useState<'solid-pill' | 'dark-box' | 'heavy-shadow' | 'gradient-glow' | 'minimal-outline'>('solid-pill');
  const [fontFamily, setFontFamily] = useState<'impact' | 'sans' | 'serif'>('impact');
  const [fontSize, setFontSize] = useState<number>(56); // Canvas base font size
  const [letterSpacing, setLetterSpacing] = useState<number>(1);

  // Authoritative Project Production Profile Hook
  const { activeProfile } = useProject();

  // Thumbnail destination format override: 'project_default' | '16:9' | '9:16'
  const [formatOverride, setFormatOverride] = useState<'project_default' | '16:9' | '9:16'>('project_default');

  const resolvedThumbRatio: '9:16' | '16:9' = formatOverride === 'project_default'
    ? (activeProfile.aspectRatio || '16:9')
    : formatOverride;

  const isPortraitThumb = resolvedThumbRatio === '9:16';
  const canvasWidth = isPortraitThumb ? 720 : 1280;
  const canvasHeight = isPortraitThumb ? 1280 : 720;

  // Preview Overlays
  const [showRuleOfThirds, setShowRuleOfThirds] = useState<boolean>(false);
  const [showYouTubeOverlay, setShowYouTubeOverlay] = useState<boolean>(false);
  const [showMobilePreview, setShowMobilePreview] = useState<boolean>(false);

  // Canvas ref for high-res PNG export
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const storageKey = `thumbnail_studio_package_${userId}`;

  // Load Saved Sources
  useEffect(() => {
    const unsubscribe = subscribeSources(userId, (sources) => {
      setSavedSources(sources);
    });
    return () => unsubscribe();
  }, [userId]);

  // Handle incoming transferred data
  useEffect(() => {
    if (transferredSourceTitle) {
      setCustomTitle(transferredSourceTitle);
    }
    if (transferredScript?.segments?.length) {
      setCustomText(transferredScript.segments.map((s) => s.voiceover).join('\n'));
    } else if (transferredSourceArticle) {
      setCustomText(transferredSourceArticle);
    }
  }, [transferredScript, transferredSourceTitle, transferredSourceArticle]);

  // Load persisted package or auto-generate initial
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.concepts && parsed.concepts.length > 0) {
          setThumbPackage(parsed);
          applyConceptToStudio(parsed.concepts[0]);
          return;
        }
      }
    } catch {}

    // Auto-generate if we have title/text
    handleGeneratePackage();
  }, [userId]);

  // Handle concept from SEO Studio
  useEffect(() => {
    if (transferredConcept) {
      if (transferredConcept.thumbnailText) {
        setHeadlineText(transferredConcept.thumbnailText.toUpperCase());
      }
      if (transferredConcept.title) {
        setSubHeadlineText(transferredConcept.title.slice(0, 16).toUpperCase());
      }
      showToast('Loaded concept from SEO Studio!');
    }
  }, [transferredConcept]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Apply a concept to the live canvas studio
  const applyConceptToStudio = (concept: ThumbnailProductionConcept, index?: number) => {
    if (typeof index === 'number') {
      setSelectedConceptIndex(index);
    }
    setHeadlineText(concept.headlineText || 'THE SECRET CHIP');
    setSubHeadlineText(concept.subHeadlineText || 'SPECIAL REPORT');
    setHeadlineColor(concept.headlineColor || '#FACC15');
    setHeadlinePosition(concept.headlinePosition || 'bottom-left');
    setHeadlineStyle(concept.headlineStyle || 'solid-pill');

    // Match recommended preset asset
    const asset = PRESET_ASSETS.find((a) => a.key === concept.recommendedAssetKey) || PRESET_ASSETS[0];
    setSelectedAssetKey(asset.key);
    setSelectedImageSrc(asset.path);

    showToast(`Loaded Concept #${concept.conceptNumber} into Studio Canvas!`);
  };

  // Generate Thumbnail Package
  const handleGeneratePackage = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const titleToUse = customTitle.trim() || 'Semiconductor AI Race';
      const textToUse = customText.trim() || 'Next generation silicon architecture, precision fabrication cleanrooms, and data center scaling.';

      const result = await api.generateThumbnailPackage({
        userId,
        sourceTitle: titleToUse,
        sourceText: textToUse,
        scriptText: customText,
        contentMode: 'Tech & Hardware',
      });

      setThumbPackage(result);
      try {
        localStorage.setItem(storageKey, JSON.stringify(result));
      } catch {}

      if (result.concepts && result.concepts.length > 0) {
        applyConceptToStudio(result.concepts[0], 0);
      }
      showToast('Generated 5 Cinematic Thumbnail Concepts!');
    } catch (err: any) {
      console.error('Failed to generate thumbnail package:', err);
      setErrorMessage(err.message || 'Failed to generate thumbnail studio package.');
    } finally {
      setLoading(false);
    }
  };

  // Regenerate single concept
  const handleRegenerateConcept = async (conceptNumber: number) => {
    if (!thumbPackage) return;
    const target = thumbPackage.concepts.find((c) => c.conceptNumber === conceptNumber);
    if (!target) return;

    setRegeneratingConceptId(target.id);
    try {
      const res = await api.regenerateThumbnailConcept({
        userId,
        conceptNumber,
        genre: target.genre,
        sourceTitle: customTitle || thumbPackage.sourceTitle,
        scriptText: customText,
        currentHeadline: headlineText,
      });

      const updatedConcepts = thumbPackage.concepts.map((c) =>
        c.conceptNumber === conceptNumber ? res.concept : c
      );
      const updatedPkg = { ...thumbPackage, concepts: updatedConcepts };
      setThumbPackage(updatedPkg);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updatedPkg));
      } catch {}

      if (selectedConceptIndex === conceptNumber - 1) {
        applyConceptToStudio(res.concept, selectedConceptIndex);
      }
      showToast(`Refreshed Concept #${conceptNumber}!`);
    } catch (err: any) {
      console.error('Failed to regenerate concept:', err);
    } finally {
      setRegeneratingConceptId(null);
    }
  };

  // Custom Image Upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedImageSrc(reader.result);
        setSelectedAssetKey('custom-upload');
        showToast('Custom thumbnail background loaded!');
      }
    };
    reader.readAsDataURL(file);
  };

  // Live Canvas 1280x720 Rendering & Export
  const handleDownloadPNG = () => {
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // 1. Draw image with contrast/brightness adjustments
      ctx.save();
      const currentGrade = COLOR_GRADE_PRESETS.find((p) => p.id === activeColorGradeId);
      const filterParts = [];
      if (currentGrade && currentGrade.cssFilter !== 'none') {
        filterParts.push(currentGrade.cssFilter);
      }
      filterParts.push(`contrast(${contrastAdjustment}%)`);
      filterParts.push(`brightness(${brightnessAdjustment}%)`);
      filterParts.push(`saturate(${saturationAdjustment}%)`);
      ctx.filter = filterParts.join(' ');

      // Cover dynamic canvas aspect ratio (1280x720 or 720x1280)
      const imgAspect = img.width / img.height;
      const targetAspect = canvasWidth / canvasHeight;
      let renderW = canvasWidth;
      let renderH = canvasHeight;
      let offsetX = 0;
      let offsetY = 0;

      if (imgAspect > targetAspect) {
        renderW = canvasHeight * imgAspect;
        offsetX = -(renderW - canvasWidth) / 2;
      } else {
        renderH = canvasWidth / imgAspect;
        offsetY = -(renderH - canvasHeight) / 2;
      }
      ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
      ctx.restore();

      // 2. Draw Vignette & cinematic contrast gradient
      if (vignetteEnabled) {
        ctx.save();
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        const maxRadius = Math.max(canvasWidth, canvasHeight) / 1.4;
        const radGrad = ctx.createRadialGradient(centerX, centerY, 150, centerX, centerY, maxRadius);
        radGrad.addColorStop(0, 'rgba(0,0,0,0)');
        radGrad.addColorStop(0.7, `rgba(0,0,0,${vignetteStrength * 0.45})`);
        radGrad.addColorStop(1, `rgba(0,0,0,${vignetteStrength * 0.88})`);
        ctx.fillStyle = radGrad;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.restore();
      }

      // 3. Draw Subheadline / Kicker Badge
      const padX = isPortraitThumb ? 40 : 64;
      const padY = isPortraitThumb ? 80 : 64;
      let posX = padX;
      let posY = canvasHeight - padY - 80;

      if (headlinePosition === 'top-left') {
        posX = padX;
        posY = padY + 120;
      } else if (headlinePosition === 'center-left') {
        posX = padX;
        posY = canvasHeight / 2;
      } else if (headlinePosition === 'top-right') {
        posX = canvasWidth - padX - (isPortraitThumb ? 320 : 480);
        posY = padY + 120;
      } else if (headlinePosition === 'bottom-right') {
        posX = canvasWidth - padX - (isPortraitThumb ? 320 : 480);
        posY = canvasHeight - padY - 140;
      }

      // Kicker badge
      if (subHeadlineText.trim()) {
        ctx.save();
        const badgeFont = '900 18px "Inter", system-ui, sans-serif';
        ctx.font = badgeFont;
        const textMetrics = ctx.measureText(subHeadlineText.toUpperCase());
        const badgeW = textMetrics.width + 24;
        const badgeH = 32;
        const badgeY = posY - 80;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.beginPath();
        ctx.roundRect(posX, badgeY, badgeW, badgeH, 6);
        ctx.fill();
        ctx.strokeStyle = headlineColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = headlineColor;
        ctx.textBaseline = 'middle';
        ctx.fillText(subHeadlineText.toUpperCase(), posX + 12, badgeY + 16);
        ctx.restore();
      }

      // 4. Draw Headline Text
      ctx.save();
      const fontName = fontFamily === 'impact' ? 'Impact, "Arial Black", sans-serif' : fontFamily === 'serif' ? 'Georgia, serif' : '"Inter", system-ui, sans-serif';
      const actualFontSize = Math.round(fontSize * 1.5);
      ctx.font = `900 ${actualFontSize}px ${fontName}`;
      ctx.textBaseline = 'alphabetic';

      const words = headlineText.toUpperCase().split(' ');
      let lines: string[] = [];
      let curLine = '';

      for (let i = 0; i < words.length; i++) {
        const test = curLine ? `${curLine} ${words[i]}` : words[i];
        if (ctx.measureText(test).width > 700 && curLine) {
          lines.push(curLine);
          curLine = words[i];
        } else {
          curLine = test;
        }
      }
      if (curLine) lines.push(curLine);

      const lineHeight = actualFontSize * 1.05;

      lines.forEach((line, lIdx) => {
        const curY = posY + lIdx * lineHeight;
        const metrics = ctx.measureText(line);
        const lineW = metrics.width;

        if (headlineStyle === 'solid-pill') {
          ctx.save();
          ctx.fillStyle = headlineColor;
          ctx.fillRect(posX - 16, curY - actualFontSize * 0.88, lineW + 32, actualFontSize * 1.15);
          ctx.restore();

          // Black text inside solid pill
          ctx.fillStyle = '#000000';
          ctx.fillText(line, posX, curY);
        } else if (headlineStyle === 'dark-box') {
          ctx.save();
          ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
          ctx.fillRect(posX - 16, curY - actualFontSize * 0.88, lineW + 32, actualFontSize * 1.15);
          ctx.restore();

          ctx.fillStyle = headlineColor;
          ctx.fillText(line, posX, curY);
        } else if (headlineStyle === 'heavy-shadow') {
          // Layered multi-drop shadow
          ctx.save();
          ctx.shadowColor = '#000000';
          ctx.shadowBlur = 18;
          ctx.shadowOffsetX = 6;
          ctx.shadowOffsetY = 6;
          ctx.fillStyle = headlineColor;
          ctx.fillText(line, posX, curY);

          ctx.shadowBlur = 32;
          ctx.shadowOffsetX = 10;
          ctx.shadowOffsetY = 10;
          ctx.fillText(line, posX, curY);
          ctx.restore();
        } else {
          // Default bold stroke + fill
          ctx.save();
          ctx.lineWidth = 10;
          ctx.strokeStyle = '#000000';
          ctx.strokeText(line, posX, curY);
          ctx.fillStyle = headlineColor;
          ctx.fillText(line, posX, curY);
          ctx.restore();
        }
      });

      ctx.restore();

      // Trigger download
      const link = document.createElement('a');
      link.download = `${(customTitle || 'youtube-thumbnail').toLowerCase().replace(/[^\w-]/g, '_')}_1280x720.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('1280x720 Production Thumbnail Downloaded!');
    };
    img.src = selectedImageSrc;
  };

  const activeGradeObj = COLOR_GRADE_PRESETS.find((g) => g.id === activeColorGradeId) || COLOR_GRADE_PRESETS[0];
  const activeConcept = thumbPackage?.concepts[selectedConceptIndex] || null;

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-emerald-500 text-white font-medium text-xs shadow-2xl flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* 1. Page Header & Context Banner */}
      <section
        className="rounded-2xl p-6 border shadow-xl backdrop-blur-md relative overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div
              className="p-3.5 rounded-2xl text-black shadow-lg flex-shrink-0"
              style={{
                backgroundColor: 'var(--accent-primary)',
                boxShadow: '0 0 16px -2px var(--accent-glow)',
              }}
            >
              <ImageIcon className="w-7 h-7 text-black" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  YouTube Thumbnail Studio
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-sky-500/10 text-sky-400 border border-sky-500/30">
                  16:9 Cinematic
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
                  4K Photorealism
                </span>
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                Professional editorial & tech documentary thumbnails. High contrast, grounded realism, punchy headline typography, and ready-to-use Midjourney & Imagen prompts.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onNavigateToScripts && (
              <button
                type="button"
                onClick={onNavigateToScripts}
                className="px-3.5 py-2 rounded-xl text-xs font-medium border flex items-center space-x-1.5 transition-colors cursor-pointer hover:bg-white/5"
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-secondary)',
                }}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Script Generator</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleGeneratePackage}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-bold text-black shadow-md flex items-center space-x-2 transition-all transform hover:scale-[1.02] cursor-pointer jarvis-gold-btn"
            >
              <Sparkles className={`w-4 h-4 text-black ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Synthesizing...' : 'Generate New Package'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPNG}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md flex items-center space-x-2 transition-all transform hover:scale-[1.02] cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download 1280x720 PNG</span>
            </button>
          </div>
        </div>

        {/* Source & Title Context Bar */}
        <div className="mt-5 pt-4 border-t flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex flex-1 items-center space-x-2">
            <span className="font-semibold text-[11px]" style={{ color: 'var(--text-muted)' }}>Project Story:</span>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Enter story topic or select saved source..."
              className="flex-1 px-3 py-1.5 rounded-lg border text-xs font-medium outline-none transition-colors"
              style={{
                backgroundColor: 'var(--bg-base)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {savedSources.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-[11px]" style={{ color: 'var(--text-muted)' }}>Load Source:</span>
              <select
                value={selectedSourceId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedSourceId(id);
                  const matched = savedSources.find((s) => s.id === id);
                  if (matched) {
                    setCustomTitle(matched.title);
                    setCustomText(matched.text);
                  }
                }}
                className="px-3 py-1.5 rounded-lg border text-xs outline-none cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="transferred">Current Context</option>
                {savedSources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </section>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. MAIN WORKSPACE: Live 16:9 Canvas Designer & Controls */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left Column: Interactive 16:9 Canvas & Viewport */}
        <div className="xl:col-span-8 space-y-5">
          <section
            className="rounded-2xl p-5 border shadow-xl backdrop-blur-md space-y-4"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            {/* Viewport Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                  Live 16:9 Studio Viewport
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                  1280 × 720 px
                </span>
              </div>

              {/* Preview Modes */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowRuleOfThirds(!showRuleOfThirds)}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center space-x-1.5 transition-colors cursor-pointer ${
                    showRuleOfThirds ? 'bg-sky-500/20 text-sky-400 border-sky-500/40' : 'text-slate-400 hover:bg-slate-800/20 border-slate-700'
                  }`}
                  title="Toggle 3x3 Rule of Thirds Grid"
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Rule of Thirds</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowYouTubeOverlay(!showYouTubeOverlay)}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center space-x-1.5 transition-colors cursor-pointer ${
                    showYouTubeOverlay ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'text-slate-400 hover:bg-slate-800/20 border-slate-700'
                  }`}
                  title="Simulate YouTube Player & Duration Pill (Safety Test)"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span className="text-[11px]">YouTube UI Test</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowMobilePreview(!showMobilePreview)}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center space-x-1.5 transition-colors cursor-pointer ${
                    showMobilePreview ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'text-slate-400 hover:bg-slate-800/20 border-slate-700'
                  }`}
                  title="Check legibility at small mobile feed dimensions"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Mobile View</span>
                </button>
              </div>

              {/* Dynamic Aspect Ratio & Destination Override Controls */}
              <div className="flex items-center space-x-1.5 p-1 rounded-lg border text-xs font-mono" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}>
                <span className="text-[10px] px-1 text-zinc-500 font-bold">FORMAT:</span>
                <button
                  type="button"
                  onClick={() => setFormatOverride('project_default')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                    formatOverride === 'project_default' ? 'bg-amber-400 text-black' : 'text-zinc-400 hover:text-white'
                  }`}
                  title={`Follow canonical project ratio (${activeProfile.aspectRatio})`}
                >
                  Auto ({activeProfile.aspectRatio})
                </button>
                <button
                  type="button"
                  onClick={() => setFormatOverride('16:9')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                    formatOverride === '16:9' ? 'bg-amber-400 text-black' : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Override to 16:9 Landscape YouTube Thumbnail"
                >
                  16:9
                </button>
                <button
                  type="button"
                  onClick={() => setFormatOverride('9:16')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                    formatOverride === '9:16' ? 'bg-amber-400 text-black' : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Override to 9:16 Vertical Shorts Cover"
                >
                  9:16
                </button>
              </div>
            </div>

            {/* Destination Override Explanation Banner */}
            {formatOverride !== 'project_default' && formatOverride !== activeProfile.aspectRatio && (
              <div className="px-3 py-1.5 rounded-lg border text-[11px] font-mono flex items-center justify-between" style={{ backgroundColor: 'var(--accent-subtle)', borderColor: 'var(--border-subtle)', color: 'var(--accent-text)' }}>
                <span>Destination override active: Generating {formatOverride} thumbnail for {activeProfile.aspectRatio} project</span>
                <button onClick={() => setFormatOverride('project_default')} className="underline hover:text-white cursor-pointer ml-2">Reset to Project Default</button>
              </div>
            )}

            {/* The Dynamic Canvas Viewport (16:9 or 9:16) */}
            <div
              className={`relative w-full ${isPortraitThumb ? 'max-w-[360px] aspect-[9/16] mx-auto' : 'aspect-video'} rounded-xl overflow-hidden border shadow-2xl bg-black select-none group`}
              style={{ borderColor: 'var(--border-focus)' }}
            >
              {/* Background Photographic Image with Filters */}
              <img
                src={selectedImageSrc}
                alt="Documentary Thumbnail"
                className="w-full h-full object-cover transition-all duration-300"
                style={{
                  filter: `${activeGradeObj.cssFilter !== 'none' ? activeGradeObj.cssFilter : ''} contrast(${contrastAdjustment}%) brightness(${brightnessAdjustment}%) saturate(${saturationAdjustment}%)`,
                }}
                referrerPolicy="no-referrer"
              />

              {/* Cinematic Vignette Overlay */}
              {vignetteEnabled && (
                <div
                  className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                  style={{
                    background: `radial-gradient(circle at center, transparent 35%, rgba(0,0,0,${vignetteStrength * 0.5}) 70%, rgba(0,0,0,${vignetteStrength * 0.95}) 100%)`,
                  }}
                />
              )}

              {/* Rule of Thirds Grid Guide */}
              {showRuleOfThirds && (
                <div className="absolute inset-0 pointer-events-none z-10 grid grid-cols-3 grid-rows-3 border border-sky-400/20">
                  <div className="border-r border-b border-sky-400/30" />
                  <div className="border-r border-b border-sky-400/30" />
                  <div className="border-b border-sky-400/30" />
                  <div className="border-r border-b border-sky-400/30" />
                  <div className="border-r border-b border-sky-400/30" />
                  <div className="border-b border-sky-400/30" />
                  <div className="border-r border-sky-400/30" />
                  <div className="border-r border-sky-400/30" />
                  <div />
                  {/* Safe text zone indicator */}
                  <div className="absolute top-2 left-2 text-[10px] font-mono text-sky-300 bg-sky-950/70 px-2 py-0.5 rounded border border-sky-500/30">
                    Primary Focal Zone: Left 1/3 (Typography) | Right 2/3 (Visual Anchor)
                  </div>
                </div>
              )}

              {/* YouTube UI Overlay Simulator */}
              {showYouTubeOverlay && (
                <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-white/80 bg-black/60 px-2 py-1 rounded backdrop-blur-sm">
                      YouTube Player Safe-Zone Preview
                    </span>
                  </div>

                  <div className="flex items-end justify-between">
                    <div className="h-1 flex-1 bg-red-600 rounded-full mr-4 shadow" />
                    {/* Crucial YouTube duration pill that blocks bottom right corner! */}
                    <div className="px-2 py-0.5 rounded bg-black/90 text-white font-bold text-xs tracking-wider border border-white/10 shadow-lg">
                      14:22
                    </div>
                  </div>
                </div>
              )}

              {/* Rendered Headline Overlay (Responsive to Position) */}
              <div
                className={`absolute z-10 flex flex-col pointer-events-none transition-all duration-300 p-6 md:p-8 ${
                  headlinePosition === 'top-left'
                    ? 'top-0 left-0 items-start text-left'
                    : headlinePosition === 'center-left'
                    ? 'top-1/2 -translate-y-1/2 left-0 items-start text-left'
                    : headlinePosition === 'top-right'
                    ? 'top-0 right-0 items-end text-right'
                    : headlinePosition === 'bottom-right'
                    ? 'bottom-8 right-6 items-end text-right'
                    : 'bottom-0 left-0 items-start text-left'
                }`}
                style={{ maxWidth: '78%' }}
              >
                {/* Subheadline / Kicker Pill */}
                {subHeadlineText.trim() && (
                  <div
                    className="mb-2 px-2.5 py-1 rounded-md text-[11px] md:text-xs font-black tracking-widest uppercase border shadow-xl flex items-center space-x-1.5"
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.85)',
                      borderColor: headlineColor,
                      color: headlineColor,
                    }}
                  >
                    <span>{subHeadlineText}</span>
                  </div>
                )}

                {/* Primary Headline Box / Shadow */}
                <div
                  className={`font-black uppercase tracking-tight transition-all duration-200 leading-[0.95] ${
                    fontFamily === 'impact'
                      ? 'font-["Impact",_"Arial_Black",_sans-serif]'
                      : fontFamily === 'serif'
                      ? 'font-serif'
                      : 'font-sans'
                  } ${
                    headlineStyle === 'solid-pill'
                      ? 'p-2 md:p-3 rounded-lg shadow-2xl'
                      : headlineStyle === 'dark-box'
                      ? 'p-2 md:p-3 rounded-lg bg-black/85 backdrop-blur-sm border border-white/10 shadow-2xl'
                      : headlineStyle === 'heavy-shadow'
                      ? 'drop-shadow-[0_8px_16px_rgba(0,0,0,0.95)] drop-shadow-[0_2px_4px_rgba(0,0,0,1)]'
                      : headlineStyle === 'gradient-glow'
                      ? 'drop-shadow-[0_0_24px_rgba(250,204,21,0.6)] drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]'
                      : 'stroke-black'
                  }`}
                  style={{
                    backgroundColor: headlineStyle === 'solid-pill' ? headlineColor : undefined,
                    color: headlineStyle === 'solid-pill' ? '#000000' : headlineColor,
                    fontSize: `clamp(1.75rem, 5vw, ${fontSize * 0.7}px)`,
                    letterSpacing: `${letterSpacing}px`,
                  }}
                >
                  {headlineText || 'ENTER HEADLINE'}
                </div>
              </div>
            </div>

            {/* Mobile Viewport Simulation Widget */}
            {showMobilePreview && (
              <div className="p-4 rounded-xl border space-y-2 bg-slate-950/60" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center justify-between text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  <span>Mobile Search Result Simulation (168 × 94 px)</span>
                  <span className="text-[10px] text-emerald-400">✓ If text is unreadable here, simplify to 2-3 bold words</span>
                </div>
                <div className="flex items-center space-x-4">
                  {/* Miniature 168px Card */}
                  <div className="w-[168px] h-[94px] rounded-lg overflow-hidden relative border border-slate-700 bg-black flex-shrink-0 shadow-lg">
                    <img
                      src={selectedImageSrc}
                      alt="Mini Preview"
                      className="w-full h-full object-cover"
                      style={{
                        filter: `${activeGradeObj.cssFilter !== 'none' ? activeGradeObj.cssFilter : ''} contrast(${contrastAdjustment}%)`,
                      }}
                      referrerPolicy="no-referrer"
                    />
                    <div
                      className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tight"
                      style={{
                        backgroundColor: headlineStyle === 'solid-pill' ? headlineColor : 'rgba(0,0,0,0.85)',
                        color: headlineStyle === 'solid-pill' ? '#000000' : headlineColor,
                      }}
                    >
                      {headlineText.slice(0, 16)}
                    </div>
                  </div>

                  <div className="text-xs space-y-1">
                    <p className="font-bold text-white truncate max-w-sm">
                      {customTitle || 'Semiconductor AI Race: The Billion-Dollar Silicon Battle'}
                    </p>
                    <p className="text-[11px] text-slate-400">Tech Documentary • 248K views • 2 days ago</p>
                  </div>
                </div>
              </div>
            )}

            {/* Background Image Selection Gallery */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold flex items-center space-x-1.5" style={{ color: 'var(--text-primary)' }}>
                  <Camera className="w-3.5 h-3.5 text-sky-400" />
                  <span>Documentary Background Photography Asset:</span>
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg border text-[11px] font-medium flex items-center space-x-1.5 transition-colors cursor-pointer hover:bg-slate-800/20"
                  style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                >
                  <Upload className="w-3 h-3 text-sky-400" />
                  <span>Upload Custom Image</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PRESET_ASSETS.map((asset) => {
                  const isSelected = selectedAssetKey === asset.key;
                  return (
                    <button
                      key={asset.key}
                      type="button"
                      onClick={() => {
                        setSelectedAssetKey(asset.key);
                        setSelectedImageSrc(asset.path);
                        showToast(`Switched to: ${asset.name}`);
                      }}
                      className={`rounded-xl border p-2 flex flex-col text-left space-y-1.5 transition-all cursor-pointer relative group ${
                        isSelected ? 'border-sky-500 ring-2 ring-sky-500/30' : 'hover:border-slate-600'
                      }`}
                      style={{
                        backgroundColor: isSelected ? 'var(--bg-surface-elevated)' : 'var(--bg-base)',
                        borderColor: isSelected ? 'var(--border-focus)' : 'var(--border-subtle)',
                      }}
                    >
                      <div className="w-full aspect-video rounded-lg overflow-hidden bg-black relative">
                        <img
                          src={asset.path}
                          alt={asset.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/80 text-white">
                          {asset.tag}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {asset.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Typography & Lighting Controls */}
        <div className="xl:col-span-4 space-y-5">
          {/* Headline Typography Panel */}
          <section
            className="rounded-2xl p-5 border shadow-xl backdrop-blur-md space-y-4"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex items-center space-x-2 pb-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <Type className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                Headline Typography Studio
              </h3>
            </div>

            {/* Primary Headline Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold block" style={{ color: 'var(--text-muted)' }}>
                Primary Headline (2-4 Words Max):
              </label>
              <input
                type="text"
                value={headlineText}
                onChange={(e) => setHeadlineText(e.target.value.toUpperCase())}
                placeholder="E.G. THE SECRET CHIP"
                maxLength={30}
                className="w-full px-3 py-2 rounded-xl border text-sm font-black tracking-wider outline-none font-mono"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderColor: 'var(--border-focus)',
                  color: 'var(--text-primary)',
                }}
              />
              <div className="flex justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
                <span>{headlineText.split(' ').filter(Boolean).length} words</span>
                <span>{headlineText.length}/30 characters</span>
              </div>
            </div>

            {/* Subheadline / Kicker */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold block" style={{ color: 'var(--text-muted)' }}>
                Subheadline / Category Kicker (Optional):
              </label>
              <input
                type="text"
                value={subHeadlineText}
                onChange={(e) => setSubHeadlineText(e.target.value.toUpperCase())}
                placeholder="E.G. EXCLUSIVE ACCESS"
                maxLength={20}
                className="w-full px-3 py-1.5 rounded-xl border text-xs font-bold outline-none font-mono"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {/* Color Presets */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold block" style={{ color: 'var(--text-muted)' }}>
                Headline Color Preset:
              </label>
              <div className="flex flex-wrap gap-2">
                {HEADLINE_COLOR_PRESETS.map((color) => {
                  const isCur = headlineColor.toLowerCase() === color.hex.toLowerCase();
                  return (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => setHeadlineColor(color.hex)}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                        isCur ? 'ring-2 ring-offset-2 ring-sky-500 scale-105' : 'hover:scale-102'
                      }`}
                      style={{
                        backgroundColor: 'var(--bg-base)',
                        borderColor: isCur ? color.hex : 'var(--border-subtle)',
                        color: color.hex,
                      }}
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color.hex }} />
                      <span className="text-[10px]">{color.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Headline Style & Container */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold block" style={{ color: 'var(--text-muted)' }}>
                Badge & Style Treatment:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setHeadlineStyle('solid-pill')}
                  className={`p-2 rounded-xl border text-center font-bold text-[11px] transition-colors cursor-pointer ${
                    headlineStyle === 'solid-pill' ? 'bg-amber-400 text-black border-amber-500' : 'hover:bg-slate-800/20'
                  }`}
                  style={{
                    backgroundColor: headlineStyle === 'solid-pill' ? headlineColor : 'var(--bg-base)',
                    color: headlineStyle === 'solid-pill' ? '#000000' : 'var(--text-primary)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  Solid Pill Box
                </button>

                <button
                  type="button"
                  onClick={() => setHeadlineStyle('dark-box')}
                  className={`p-2 rounded-xl border text-center font-bold text-[11px] transition-colors cursor-pointer ${
                    headlineStyle === 'dark-box' ? 'border-sky-500 text-sky-400 bg-black/80' : 'hover:bg-slate-800/20'
                  }`}
                  style={{
                    backgroundColor: headlineStyle === 'dark-box' ? 'rgba(0,0,0,0.85)' : 'var(--bg-base)',
                    color: headlineStyle === 'dark-box' ? headlineColor : 'var(--text-primary)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  Dark Contrast Box
                </button>

                <button
                  type="button"
                  onClick={() => setHeadlineStyle('heavy-shadow')}
                  className={`p-2 rounded-xl border text-center font-bold text-[11px] transition-colors cursor-pointer ${
                    headlineStyle === 'heavy-shadow' ? 'border-sky-500 text-sky-400' : 'hover:bg-slate-800/20'
                  }`}
                  style={{
                    backgroundColor: 'var(--bg-base)',
                    borderColor: headlineStyle === 'heavy-shadow' ? 'var(--border-focus)' : 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  Cinema Depth Shadow
                </button>

                <button
                  type="button"
                  onClick={() => setHeadlineStyle('gradient-glow')}
                  className={`p-2 rounded-xl border text-center font-bold text-[11px] transition-colors cursor-pointer ${
                    headlineStyle === 'gradient-glow' ? 'border-sky-500 text-sky-400' : 'hover:bg-slate-800/20'
                  }`}
                  style={{
                    backgroundColor: 'var(--bg-base)',
                    borderColor: headlineStyle === 'gradient-glow' ? 'var(--border-focus)' : 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  Gradient Halo Glow
                </button>
              </div>
            </div>

            {/* Position Selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold block" style={{ color: 'var(--text-muted)' }}>
                Screen Placement (Avoid Bottom-Right YouTube Timestamp):
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setHeadlinePosition('top-left')}
                  className={`p-1.5 rounded-lg border font-semibold ${
                    headlinePosition === 'top-left' ? 'bg-sky-500/20 text-sky-400 border-sky-500' : 'hover:bg-slate-800/20'
                  }`}
                  style={{ backgroundColor: headlinePosition === 'top-left' ? undefined : 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}
                >
                  Top Left
                </button>
                <button
                  type="button"
                  onClick={() => setHeadlinePosition('center-left')}
                  className={`p-1.5 rounded-lg border font-semibold ${
                    headlinePosition === 'center-left' ? 'bg-sky-500/20 text-sky-400 border-sky-500' : 'hover:bg-slate-800/20'
                  }`}
                  style={{ backgroundColor: headlinePosition === 'center-left' ? undefined : 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}
                >
                  Center Left
                </button>
                <button
                  type="button"
                  onClick={() => setHeadlinePosition('bottom-left')}
                  className={`p-1.5 rounded-lg border font-semibold ${
                    headlinePosition === 'bottom-left' ? 'bg-sky-500/20 text-sky-400 border-sky-500' : 'hover:bg-slate-800/20'
                  }`}
                  style={{ backgroundColor: headlinePosition === 'bottom-left' ? undefined : 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}
                >
                  ★ Bottom Left
                </button>
                <button
                  type="button"
                  onClick={() => setHeadlinePosition('top-right')}
                  className={`p-1.5 rounded-lg border font-semibold ${
                    headlinePosition === 'top-right' ? 'bg-sky-500/20 text-sky-400 border-sky-500' : 'hover:bg-slate-800/20'
                  }`}
                  style={{ backgroundColor: headlinePosition === 'top-right' ? undefined : 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}
                >
                  Top Right
                </button>
                <button
                  type="button"
                  onClick={() => setHeadlinePosition('bottom-right')}
                  className={`p-1.5 rounded-lg border font-semibold ${
                    headlinePosition === 'bottom-right' ? 'bg-amber-500/20 text-amber-400 border-amber-500' : 'hover:bg-slate-800/20'
                  }`}
                  style={{ backgroundColor: headlinePosition === 'bottom-right' ? undefined : 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}
                  title="Warning: Timestamp pill may overlap in video player"
                >
                  Bottom Right ⚠
                </button>
              </div>
            </div>
          </section>

          {/* Color Grading & Lighting Panel */}
          <section
            className="rounded-2xl p-5 border shadow-xl backdrop-blur-md space-y-4"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex items-center space-x-2 pb-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <Palette className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                Cinematic Color Grading & Vignette
              </h3>
            </div>

            {/* Presets */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold block" style={{ color: 'var(--text-muted)' }}>
                Documentary LUT Preset:
              </label>
              <select
                value={activeColorGradeId}
                onChange={(e) => setActiveColorGradeId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-xs outline-none cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                {COLOR_GRADE_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] italic" style={{ color: 'var(--text-muted)' }}>
                {activeGradeObj.description}
              </p>
            </div>

            {/* Vignette Toggle & Slider */}
            <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Cinematic Edge Vignette
                </span>
                <input
                  type="checkbox"
                  checked={vignetteEnabled}
                  onChange={(e) => setVignetteEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-500 cursor-pointer"
                />
              </div>

              {vignetteEnabled && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    <span>Subtle</span>
                    <span>Intensity: {Math.round(vignetteStrength * 100)}%</span>
                    <span>Heavy Drama</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="1.0"
                    step="0.05"
                    value={vignetteStrength}
                    onChange={(e) => setVignetteStrength(parseFloat(e.target.value))}
                    className="w-full accent-sky-500 cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Contrast Slider */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                <span>Contrast:</span>
                <span className="font-mono text-sky-400">{contrastAdjustment}%</span>
              </div>
              <input
                type="range"
                min="90"
                max="160"
                step="5"
                value={contrastAdjustment}
                onChange={(e) => setContrastAdjustment(parseInt(e.target.value, 10))}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>
          </section>
        </div>
      </div>

      {/* 3. SECTION: 5 DIVERSE CINEMATIC THUMBNAIL CONCEPTS */}
      {thumbPackage && (
        <section
          className="rounded-2xl p-6 border shadow-xl backdrop-blur-md space-y-6"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4" style={{ borderColor: 'var(--border-subtle)' }}>
            <div>
              <div className="flex items-center space-x-2.5">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  5 Angles
                </span>
                <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  Cinematic Thumbnail Production Concepts
                </h3>
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                5 distinct documentary visual angles. Click &ldquo;Apply to Canvas&rdquo; to test any concept in the live designer.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  const allPrompts = thumbPackage.concepts
                    .map(
                      (c) =>
                        `=== Concept #${c.conceptNumber}: ${c.conceptName} (${c.genre}) ===\nHeadline: "${c.headlineText}"\nFocal Subject: ${c.focalSubject}\nLighting & Optics: ${c.lightingAndOptics}\n\n[MIDJOURNEY v6.1 PROMPT]\n${c.imagePromptMidjourney}\n\n[IMAGEN 3 PROMPT]\n${c.imagePromptImagen}\n\n[NEGATIVE PROMPT]\n${c.negativePrompt}`
                    )
                    .join('\n\n----------------------------------------\n\n');
                  copyToClipboard(allPrompts, 'all_prompts');
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center space-x-1.5 transition-colors cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                {copiedKey === 'all_prompts' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'all_prompts' ? 'Copied All Prompts!' : 'Copy All AI Prompts'}</span>
              </button>
            </div>
          </div>

          {/* Concepts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {thumbPackage.concepts.map((concept, idx) => {
              const isSelected = selectedConceptIndex === idx;
              const isRegen = regeneratingConceptId === concept.id;
              const isCopied = copiedKey === `concept_prompt_${idx}`;

              return (
                <div
                  key={concept.id}
                  className={`rounded-xl p-4 border flex flex-col justify-between space-y-3 transition-all ${
                    isSelected ? 'ring-2 ring-sky-500 shadow-xl' : 'hover:border-slate-600'
                  }`}
                  style={{
                    backgroundColor: isSelected ? 'var(--bg-surface-elevated)' : 'var(--bg-base)',
                    borderColor: isSelected ? 'var(--border-focus)' : 'var(--border-subtle)',
                  }}
                >
                  <div className="space-y-2.5">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2 border-b text-xs" style={{ borderColor: 'var(--border-subtle)' }}>
                      <span className="font-bold text-sky-400">Concept #{concept.conceptNumber}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {concept.genre.split(' ')[0]}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>
                      {concept.conceptName}
                    </h4>

                    {/* Thumbnail Headline Mockup Card */}
                    <div
                      className="p-2.5 rounded-lg border text-center font-black tracking-wider text-xs shadow-inner uppercase"
                      style={{
                        backgroundColor: concept.headlineStyle === 'solid-pill' ? concept.headlineColor : 'rgba(0,0,0,0.85)',
                        borderColor: concept.headlineColor,
                        color: concept.headlineStyle === 'solid-pill' ? '#000000' : concept.headlineColor,
                      }}
                    >
                      &ldquo;{concept.headlineText}&rdquo;
                    </div>

                    {/* Spec details */}
                    <div className="text-[11px] space-y-1.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      <p>
                        <strong style={{ color: 'var(--text-primary)' }}>Subject: </strong>
                        {concept.focalSubject}
                      </p>
                      <p>
                        <strong style={{ color: 'var(--text-primary)' }}>Lighting: </strong>
                        {concept.lightingAndOptics}
                      </p>
                      <p className="italic text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        <strong>Rationale: </strong>{concept.rationale}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t space-y-2" style={{ borderColor: 'var(--border-subtle)' }}>
                    <button
                      type="button"
                      onClick={() => applyConceptToStudio(concept, idx)}
                      className={`w-full py-2 rounded-xl text-xs font-bold shadow-md flex items-center justify-center space-x-1.5 transition-all transform hover:scale-[1.02] cursor-pointer ${
                        isSelected ? 'bg-emerald-600 text-white' : 'jarvis-gold-btn text-black'
                      }`}
                    >
                      <Zap className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-black'}`} />
                      <span>{isSelected ? 'Active on Canvas' : 'Apply to Canvas'}</span>
                    </button>

                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(concept.imagePromptMidjourney, `concept_prompt_${idx}`)}
                        className="flex-1 py-1 rounded-lg border text-[10px] font-semibold flex items-center justify-center space-x-1 hover:bg-slate-800/20 cursor-pointer"
                        style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                        title="Copy Midjourney Prompt"
                      >
                        {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{isCopied ? 'Copied' : 'Prompt'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRegenerateConcept(concept.conceptNumber)}
                        disabled={isRegen}
                        className="p-1.5 rounded-lg border text-[10px] hover:bg-slate-800/20 cursor-pointer"
                        style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                        title="Regenerate this specific concept"
                      >
                        <RefreshCw className={`w-3 h-3 text-sky-400 ${isRegen ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. AI IMAGE GENERATION PROMPT SPEC SHEET PANEL */}
      {activeConcept && (
        <section
          className="rounded-2xl p-6 border shadow-xl backdrop-blur-md space-y-5"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
            <div>
              <div className="flex items-center space-x-2.5">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Ready to Copy
                </span>
                <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  Production AI Image Generation Prompts (Concept #{activeConcept.conceptNumber}: {activeConcept.conceptName})
                </h3>
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Photorealistic parameters tuned specifically for Midjourney v6.1, Google Imagen 3, and FLUX.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const spec = `=== ${activeConcept.conceptName} ===\nMIDJOURNEY v6.1:\n${activeConcept.imagePromptMidjourney}\n\nGOOGLE IMAGEN 3:\n${activeConcept.imagePromptImagen}\n\nNEGATIVE PROMPT:\n${activeConcept.negativePrompt}`;
                copyToClipboard(spec, 'full_active_spec');
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center space-x-1.5 transition-colors cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            >
              {copiedKey === 'full_active_spec' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'full_active_spec' ? 'Copied Specs!' : 'Copy Active Spec Sheet'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Midjourney Prompt Box */}
            <div className="p-4 rounded-xl border space-y-2.5" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-400">Midjourney v6.1 Prompt (Raw Style)</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(activeConcept.imagePromptMidjourney, 'midjourney_prompt')}
                  className="px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center space-x-1 cursor-pointer"
                  style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                >
                  {copiedKey === 'midjourney_prompt' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copy</span>
                </button>
              </div>
              <p className="text-xs font-mono leading-relaxed select-all" style={{ color: 'var(--text-primary)' }}>
                {activeConcept.imagePromptMidjourney}
              </p>
            </div>

            {/* Google Imagen 3 Prompt Box */}
            <div className="p-4 rounded-xl border space-y-2.5" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400">Google Imagen 3 / Veo Prompt</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(activeConcept.imagePromptImagen, 'imagen_prompt')}
                  className="px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center space-x-1 cursor-pointer"
                  style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                >
                  {copiedKey === 'imagen_prompt' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copy</span>
                </button>
              </div>
              <p className="text-xs font-mono leading-relaxed select-all" style={{ color: 'var(--text-primary)' }}>
                {activeConcept.imagePromptImagen}
              </p>
            </div>
          </div>

          {/* Negative Prompt & Optics breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl border space-y-1.5" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}>
              <span className="font-semibold block text-red-400">Strict Negative Prompt Filters:</span>
              <p className="text-[11px] font-mono leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {activeConcept.negativePrompt}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border space-y-1.5" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}>
              <span className="font-semibold block" style={{ color: 'var(--text-muted)' }}>Camera & Optics:</span>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {activeConcept.lightingAndOptics}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border space-y-1.5" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}>
              <span className="font-semibold block" style={{ color: 'var(--text-muted)' }}>Atmosphere & Depth:</span>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {activeConcept.environmentAndDepth}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
