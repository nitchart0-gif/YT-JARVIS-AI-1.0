import React, { useState, useEffect } from 'react';
import {
  Film,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Edit3,
  HardDrive,
  Download,
  AlertCircle,
  Clock,
  Layers,
  Sliders,
  ChevronDown,
  ChevronUp,
  Eye,
  CheckCircle2,
  X,
  ExternalLink,
  MessageSquare,
  Camera,
  Sun,
  Palette,
  Maximize2,
  ArrowRight,
  Save,
  RotateCcw,
  Music,
  Mic,
  Lock,
  ShieldAlert,
  FileText,
} from 'lucide-react';
import {
  api,
  type ScriptGenerationResponse,
  type VideoPromptSegment,
  type VideoPromptProject,
  type GeneratedSegment,
  type ProductionContinuityProfile,
} from '../services/api.ts';
import { getCachedDriveToken, authorizeGoogleDrive } from '../services/firebase.ts';
import { useProject } from '../context/ProjectContext.tsx';
import { quotaManager, type PendingTaskData } from '../services/quotaManager.ts';
import { QuotaRecoveryBanner } from './common/QuotaRecoveryBanner.tsx';

const STYLE_PRESETS = [
  { id: 'Cinematic Photorealistic', label: 'Cinematic 35mm', desc: 'Anamorphic lens, natural skin tones, 35mm film grain, cinematic depth of field' },
  { id: 'Documentary Archival', label: 'Documentary', desc: 'Journalistic realism, natural lighting, authentic unposed subject framing' },
  { id: 'Hyper-Realistic 3D', label: 'Hyper-Realistic 3D', desc: 'Unreal Engine 5 style, ray-traced reflections, volumetric atmospheric fog' },
  { id: 'Stylized Animation', label: 'Stylized Animation', desc: 'Vibrant artistic anime aesthetic, painterly textures, dynamic frame pacing' },
  { id: 'Cyberpunk Neon', label: 'Cyberpunk / Sci-Fi', desc: 'High-contrast neon reflections, moody rain-slicked surfaces, volumetric cyan/magenta' },
  { id: 'Minimalist Clean', label: 'Commercial Clean', desc: 'High-key studio softbox, immaculate composition, crisp modern editorial look' },
];

const CAMERA_PRESETS = [
  { id: 'Smooth Cinematic Dolly', label: 'Cinematic Dolly', desc: 'Slow forward push or backward tracking with shallow depth of field' },
  { id: 'Dynamic Drone Aerial', label: 'Drone Sweep', desc: 'Sweeping high-altitude aerial perspective gliding smoothly' },
  { id: 'Low-Angle Dramatic Tracking', label: 'Low-Angle Tracking', desc: 'Ground-level kinetic push conveying power and tension' },
  { id: 'Handheld Organic', label: 'Handheld Drift', desc: 'Subtle documentary camera drift with natural organic breathing' },
  { id: 'Static Tripod Lock', label: 'Static Lock', desc: 'Immobile tripod framing emphasizing deliberate architectural composition' },
];

const LIGHTING_PRESETS = [
  { id: 'Dramatic Natural Lighting', label: 'Dramatic Natural', desc: 'Directional sunlight with strong shadows and ambient fill' },
  { id: 'Golden Hour Warmth', label: 'Golden Hour', desc: 'Soft amber horizontal rim light, warm cinematic glow, gentle flares' },
  { id: 'Moody Low-Key Chiaroscuro', label: 'Low-Key Moody', desc: 'Deep painterly shadows, selective rim highlights, mysterious atmosphere' },
  { id: 'Studio Softbox Diffusion', label: 'Studio Softbox', desc: 'Even, commercial softbox lighting with gentle specular roll-off' },
  { id: 'Neon Volumetric Haze', label: 'Neon Volumetric', desc: 'Electric hues cutting through moody atmospheric haze and rain' },
];

/**
 * Builds the shared Production Continuity Profile for visual, audio, and pacing coherence.
 */
export function createProductionProfile(
  project: VideoPromptProject | null,
  currentAspectRatio: '16:9' | '9:16' | '1:1',
  currentStyle: string,
  currentCamera: string,
  currentLighting: string
): ProductionContinuityProfile {
  const contentMode = project?.contentMode || 'Cinematic Short-Form Video';
  const ratio = (project?.aspectRatio || currentAspectRatio || '9:16') as '16:9' | '9:16' | '1:1';
  const style = project?.stylePreset || currentStyle || 'Cinematic Photorealistic';
  const camera = project?.cameraMotionPreset || currentCamera || 'Smooth Cinematic Dolly';
  const lighting = project?.lightingPreset || currentLighting || 'Dramatic Natural Lighting';
  const totalDuration = project?.durationSeconds || 30;
  const totalSegments = project?.prompts?.length || 1;

  let colorGrading = 'Natural 35mm film emulation with rich tonal contrast, neutral skin tones, and subtle film grain';
  let audioMusic = 'Atmospheric cinematic background score with warm acoustic textures and subtle ambient rhythm, cleanly mixed under spoken voiceover.';
  let voiceoverTone = `Authoritative, natural cadence (130-150 wpm) calibrated for ${totalDuration}s total duration; crisp vocal presence with zero reverberation.`;

  const modeLower = contentMode.toLowerCase();
  if (modeLower.includes('science') || modeLower.includes('tech')) {
    colorGrading = 'Cool deep-space navy & cyan rim accents with anamorphic flare suppression and 35mm cinematic grain';
    audioMusic = 'Atmospheric deep-space sound design with subtle rhythmic synth pulsing and sub-bass undertones, dynamic frequencies calibrated to leave speech completely transparent.';
    voiceoverTone = 'Urgent, articulate, and compelling delivery with documentary gravitas.';
  } else if (modeLower.includes('finance') || modeLower.includes('business') || modeLower.includes('wealth')) {
    colorGrading = 'Clean high-key commercial grade, neutral grays, subtle emerald & gold highlight tones';
    audioMusic = 'Sophisticated modern hybrid score, crisp acoustic guitar arpeggios, confident subtle electronic pulse, forward momentum without competing with dialogue.';
    voiceoverTone = 'Confident, crisp, professional executive pacing with clear articulation.';
  } else if (modeLower.includes('crime') || modeLower.includes('mystery') || modeLower.includes('horror')) {
    colorGrading = 'Moody desaturated shadows, cool teal ambient fill, selective high-contrast amber accents';
    audioMusic = 'Tense cinematic low-frequency drone, subtle bowed cello harmonics, subdued heartbeat bass hit, suspenseful room tone.';
    voiceoverTone = 'Intense, measured, gripping cadence with dramatic narrative pauses.';
  } else if (modeLower.includes('history') || modeLower.includes('culture') || modeLower.includes('art')) {
    colorGrading = 'Warm sepia-tinted Kodachrome film grain with rich earth tones and authentic archival texture';
    audioMusic = 'Emotive orchestral strings and warm piano accents with historical gravitas, spacious acoustic reverb, gentle narrative pacing.';
    voiceoverTone = 'Measured, evocative storyteller tone with deliberate cadence and emotional weight.';
  }

  const continuityLock = `Lock master visual identity: uniform ${colorGrading}, persistent character & architectural environment, fixed ${ratio} vertical framing, and 35mm optical rendering consistency across sequence.`;
  const restrictions = 'blurry, distorted facial features, deformed hands, jittery camera, bad anatomy, text watermarks, morphing artifacts, low resolution, amateur video, jump cuts, visual flicker, ungrounded elements';

  return {
    contentMode,
    aspectRatio: ratio,
    stylePreset: style,
    cameraMotionPreset: camera,
    lightingPreset: lighting,
    durationSeconds: totalDuration,
    totalSegments,
    colorGrading,
    audioMusic,
    voiceoverTone,
    continuityLock,
    restrictions,
  };
}

/**
 * Assembles the entire production prompt for the selected segment as one complete, plain-text document.
 * Strictly includes all 13 available sections in the required order:
 * 1. Segment title and sequence number.
 * 2. Segment duration and aspect ratio.
 * 3. Spoken Voiceover Dialogue (Matched Source Audio).
 * 4. Complete Google Flow / Veo Prompt.
 * 5. Scene description.
 * 6. Shot timing.
 * 7. Camera & Motion.
 * 8. Lighting & Mood.
 * 9. Visual Style.
 * 10. Audio & Music.
 * 11. Voice-over instructions.
 * 12. Production Continuity Lock.
 * 13. Restrictions and relevant safety instructions.
 */
export function buildCompleteVideoPrompt(
  segment: VideoPromptSegment,
  productionProfile: ProductionContinuityProfile
): string {
  const segNumber = segment.segmentNumber;
  const segTitle = segment.segmentType ? `${segment.segmentType}` : `Segment #${segNumber}`;
  const totalSegs = productionProfile.totalSegments || 1;
  const duration = segment.durationSeconds || productionProfile.durationSeconds || 8;
  const aspectRatio = segment.aspectRatio || productionProfile.aspectRatio || '9:16';

  // 3. Spoken Voiceover Dialogue - EXACT dialogue preserved verbatim without summarization or translation
  const exactDialogue = segment.voiceover?.trim() || '';

  // 4. Complete Google Flow / Veo Prompt
  const flowPrompt = segment.googleFlowPrompt?.trim() || '';

  // 5. Scene description
  const sceneDescription = segment.visualScene?.trim() || 'Visual scene matching narration.';

  // 6. Shot timing
  const shotTiming = `${segment.timestamp || `00–0${duration}s`} (Target Duration: ${duration}s, Sequence: ${segNumber} of ${totalSegs})`;

  // 7. Camera & Motion
  const cameraMotion = segment.cameraMovement?.trim() || productionProfile.cameraMotionPreset || 'Smooth Cinematic Dolly';

  // 8. Lighting & Mood
  const lightingMood = segment.lighting?.trim() || productionProfile.lightingPreset || 'Dramatic Natural Lighting';

  // 9. Visual Style
  const visualStyle = segment.visualStyle?.trim() || productionProfile.stylePreset || 'Cinematic Photorealistic';

  // 10. Audio & Music
  const audioMusic = segment.audioMusic?.trim() || productionProfile.audioMusic;

  // 11. Voice-over instructions
  const voInstructions = segment.voiceoverInstructions?.trim() || productionProfile.voiceoverTone;

  // 12. Production Continuity Lock
  const continuityLock = segment.continuityLock?.trim() || productionProfile.continuityLock;

  // 13. Restrictions and relevant safety instructions
  const restrictions = segment.restrictions?.trim() || segment.negativePrompt?.trim() || productionProfile.restrictions;

  return [
    `1. SEGMENT TITLE AND SEQUENCE NUMBER`,
    `Segment #${segNumber}: ${segTitle} (Sequence ${segNumber} of ${totalSegs})`,
    ``,
    `2. SEGMENT DURATION, ASPECT RATIO & ORIENTATION`,
    `Duration: ${duration}s | Aspect Ratio: ${aspectRatio} (${aspectRatio === '9:16' ? 'Portrait Vertical' : 'Landscape Widescreen'}) | Orientation: ${aspectRatio === '9:16' ? 'PORTRAIT' : 'LANDSCAPE'}`,
    `Framing & Composition: ${aspectRatio === '9:16' ? 'Vertical 9:16 portrait composition, high visual depth, center-weighted action safe zone (12% top, 18% bottom UI clearance)' : 'Cinematic 16:9 widescreen composition, horizontal rule-of-thirds framing, 35mm anamorphic field of view, 10% title safe boundary'}`,
    ``,
    `3. SPOKEN VOICEOVER DIALOGUE (MATCHED SOURCE AUDIO)`,
    `"${exactDialogue}"`,
    ``,
    `4. COMPLETE GOOGLE FLOW / VEO PROMPT`,
    flowPrompt,
    ``,
    `5. SCENE DESCRIPTION`,
    sceneDescription,
    ``,
    `6. SHOT TIMING`,
    shotTiming,
    ``,
    `7. CAMERA & MOTION`,
    cameraMotion,
    ``,
    `8. LIGHTING & MOOD`,
    lightingMood,
    ``,
    `9. VISUAL STYLE`,
    visualStyle,
    ``,
    `10. AUDIO & MUSIC`,
    audioMusic,
    ``,
    `11. VOICE-OVER INSTRUCTIONS`,
    voInstructions,
    ``,
    `12. PRODUCTION CONTINUITY LOCK`,
    continuityLock,
    ``,
    `13. RESTRICTIONS AND RELEVANT SAFETY INSTRUCTIONS`,
    restrictions,
  ].join('\n');
}

interface VideoPromptBuilderTabProps {
  userId: string;
  transferredScript?: ScriptGenerationResponse | null;
  transferredSourceTitle?: string;
  onNavigateToScripts?: () => void;
  onNavigateToSources?: () => void;
  onNavigateToOverview?: () => void;
}

export const VideoPromptBuilderTab: React.FC<VideoPromptBuilderTabProps> = ({
  userId,
  transferredScript,
  transferredSourceTitle,
  onNavigateToScripts,
  onNavigateToSources,
  onNavigateToOverview,
}) => {
  // Global Production Profile Hook
  const { activeProfile, switchAspectRatio } = useProject();

  // Active Project State
  const [project, setProject] = useState<VideoPromptProject | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Settings: Synchronized with authoritative Project Production Profile
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>(
    activeProfile.aspectRatio || '9:16'
  );
  const [selectedStyle, setSelectedStyle] = useState<string>(activeProfile.visualStyle || 'Cinematic Photorealistic');
  const [selectedCamera, setSelectedCamera] = useState<string>(activeProfile.cameraMotionPreset || 'Smooth Cinematic Dolly');
  const [selectedLighting, setSelectedLighting] = useState<string>(activeProfile.lightingPreset || 'Dramatic Natural Lighting');

  // Synchronize when project aspect ratio changes globally
  useEffect(() => {
    if (activeProfile.aspectRatio && (activeProfile.aspectRatio === '9:16' || activeProfile.aspectRatio === '16:9')) {
      setAspectRatio(activeProfile.aspectRatio);
    }
  }, [activeProfile.aspectRatio]);

  // Copy states
  const [copiedSegmentNumber, setCopiedSegmentNumber] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);

  // Expanded complete prompt preview state per segment
  const [expandedPreviewSegmentNum, setExpandedPreviewSegmentNum] = useState<number | null>(null);

  // Inline editing modal / dialog state with full production fields
  const [editingSegment, setEditingSegment] = useState<VideoPromptSegment | null>(null);
  const [editedPromptText, setEditedPromptText] = useState<string>('');
  const [editedSceneText, setEditedSceneText] = useState<string>('');
  const [editedCameraText, setEditedCameraText] = useState<string>('');
  const [editedLightingText, setEditedLightingText] = useState<string>('');
  const [editedStyleText, setEditedStyleText] = useState<string>('');
  const [editedAudioText, setEditedAudioText] = useState<string>('');
  const [editedVoInstructionsText, setEditedVoInstructionsText] = useState<string>('');
  const [editedContinuityText, setEditedContinuityText] = useState<string>('');
  const [editedRestrictionsText, setEditedRestrictionsText] = useState<string>('');

  // Single segment regeneration state
  const [regeneratingSegmentNum, setRegeneratingSegmentNum] = useState<number | null>(null);
  const [customTweakModalSeg, setCustomTweakModalSeg] = useState<VideoPromptSegment | null>(null);
  const [customTweakInput, setCustomTweakInput] = useState<string>('');

  // Google Drive export state
  const [exportingDrive, setExportingDrive] = useState<boolean>(false);
  const [driveSuccessLink, setDriveSuccessLink] = useState<{ name: string; url?: string } | null>(null);

  const STORAGE_KEY = `workspace_video_prompts_${userId}`;

  // Helper to get active production profile
  const getActiveProfile = (): ProductionContinuityProfile => {
    return createProductionProfile(project, aspectRatio, selectedStyle, selectedCamera, selectedLighting);
  };

  // 1. Initial Load: Read saved project from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as VideoPromptProject;
        if (parsed && Array.isArray(parsed.prompts) && parsed.prompts.length > 0) {
          setProject(parsed);
          setAspectRatio(parsed.aspectRatio || '9:16');
          setSelectedStyle(parsed.stylePreset || 'Cinematic Photorealistic');
          setSelectedCamera(parsed.cameraMotionPreset || 'Smooth Cinematic Dolly');
          setSelectedLighting(parsed.lightingPreset || 'Dramatic Natural Lighting');
        }
      }
    } catch {
      // Ignore
    }
  }, [STORAGE_KEY]);

  // 2. React to transferred script from Script Generator
  useEffect(() => {
    if (!transferredScript || !transferredScript.segments || transferredScript.segments.length === 0) {
      return;
    }

    const title = transferredSourceTitle || `${transferredScript.contentMode} Video Script`;

    // Check if current project already matches this transferred script to avoid duplicate re-generation
    const isSameScript =
      project &&
      project.prompts.length === transferredScript.segments.length &&
      project.prompts.every((p, idx) => p.voiceover === transferredScript.segments[idx]?.voiceover);

    if (isSameScript) {
      // Just ensure project is visible
      return;
    }

    // Auto-generate video prompts for the newly transferred script
    executeGeneratePrompts({
      segments: transferredScript.segments,
      contentMode: transferredScript.contentMode,
      sourceTitle: title,
      durationSeconds: transferredScript.durationSeconds,
      language: transferredScript.language,
      ratio: aspectRatio,
      style: selectedStyle,
      camera: selectedCamera,
      lighting: selectedLighting,
    });
  }, [transferredScript, transferredSourceTitle]);

  // Core generator function
  const executeGeneratePrompts = async (params: {
    segments: GeneratedSegment[];
    contentMode: string;
    sourceTitle: string;
    durationSeconds: number;
    language: string;
    ratio: '16:9' | '9:16' | '1:1';
    style: string;
    camera: string;
    lighting: string;
  }) => {
    setLoading(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const response = await api.generateVideoPrompts({
        userId,
        segments: params.segments,
        contentMode: params.contentMode,
        sourceTitle: params.sourceTitle,
        aspectRatio: params.ratio,
        stylePreset: params.style,
        cameraMotionPreset: params.camera,
        lightingPreset: params.lighting,
      });

      const newProject: VideoPromptProject = {
        id: `proj_${Date.now()}`,
        sourceTitle: params.sourceTitle,
        contentMode: params.contentMode,
        durationSeconds: params.durationSeconds,
        language: params.language,
        aspectRatio: params.ratio,
        stylePreset: params.style,
        cameraMotionPreset: params.camera,
        lightingPreset: params.lighting,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        prompts: response.prompts,
      };

      setProject(newProject);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newProject));
      } catch {}

      setInfoMessage(`Generated ${response.prompts.length} Google Flow prompts matching all script segments.`);
      setTimeout(() => setInfoMessage(null), 4000);
      quotaManager.clearPendingTask();
      quotaManager.resetToNormal();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to generate video prompts.');
      quotaManager.handleError(err, {
        type: 'video_prompts',
        label: `Video Prompts for: ${params.sourceTitle || 'Script'}`,
        payload: params,
        timestamp: Date.now(),
      });
    } finally {
      setLoading(false);
    }
  };

  // Safe resume from preserved task
  const handleResumePendingTask = (pending: PendingTaskData | null) => {
    if (!pending) {
      handleRegenerateAll();
      return;
    }
    if (pending.payload?.segments) {
      executeGeneratePrompts(pending.payload);
    }
  };

  // Re-run generation for all prompts with updated presets
  const handleRegenerateAll = () => {
    if (!project || project.prompts.length === 0) return;

    // Convert existing prompt segments back into GeneratedSegment structure
    const segments: GeneratedSegment[] = project.prompts.map((p) => ({
      segmentNumber: p.segmentNumber,
      type: p.segmentType,
      timestamp: p.timestamp,
      voiceover: p.voiceover,
      estimatedDurationSeconds: p.durationSeconds,
      wordCount: p.voiceover.split(/\s+/).filter(Boolean).length,
    }));

    executeGeneratePrompts({
      segments,
      contentMode: project.contentMode,
      sourceTitle: project.sourceTitle,
      durationSeconds: project.durationSeconds,
      language: project.language,
      ratio: aspectRatio,
      style: selectedStyle,
      camera: selectedCamera,
      lighting: selectedLighting,
    });
  };

  // Regenerate single segment
  const handleRegenerateSingle = async (seg: VideoPromptSegment, customInstruction?: string) => {
    if (!project) return;
    setRegeneratingSegmentNum(seg.segmentNumber);
    setErrorMessage(null);

    try {
      const segmentData: GeneratedSegment = {
        segmentNumber: seg.segmentNumber,
        type: seg.segmentType,
        timestamp: seg.timestamp,
        voiceover: seg.voiceover,
        estimatedDurationSeconds: seg.durationSeconds,
        wordCount: seg.voiceover.split(/\s+/).filter(Boolean).length,
      };

      const updatedPrompt = await api.generateSinglePrompt({
        userId,
        segment: segmentData,
        contentMode: project.contentMode,
        aspectRatio,
        stylePreset: selectedStyle,
        cameraMotionPreset: selectedCamera,
        lightingPreset: selectedLighting,
        customInstruction,
      });

      const updatedList = project.prompts.map((p) =>
        p.segmentNumber === seg.segmentNumber ? updatedPrompt : p
      );

      const updatedProj: VideoPromptProject = {
        ...project,
        prompts: updatedList,
        updatedAt: Date.now(),
      };

      setProject(updatedProj);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProj));
      } catch {}

      setCustomTweakModalSeg(null);
      setCustomTweakInput('');
    } catch (err: any) {
      setErrorMessage(err?.message || `Failed to regenerate prompt for segment ${seg.segmentNumber}`);
    } finally {
      setRegeneratingSegmentNum(null);
    }
  };

  // Save inline prompt edit
  const handleSaveInlineEdit = () => {
    if (!editingSegment || !project) return;

    const updatedList = project.prompts.map((p) => {
      if (p.segmentNumber === editingSegment.segmentNumber) {
        return {
          ...p,
          googleFlowPrompt: editedPromptText.trim(),
          visualScene: editedSceneText.trim() || p.visualScene,
          cameraMovement: editedCameraText.trim() || p.cameraMovement,
          lighting: editedLightingText.trim() || p.lighting,
          visualStyle: editedStyleText.trim() || p.visualStyle,
          audioMusic: editedAudioText.trim() || p.audioMusic,
          voiceoverInstructions: editedVoInstructionsText.trim() || p.voiceoverInstructions,
          continuityLock: editedContinuityText.trim() || p.continuityLock,
          restrictions: editedRestrictionsText.trim() || p.restrictions,
        };
      }
      return p;
    });

    const updatedProj: VideoPromptProject = {
      ...project,
      prompts: updatedList,
      updatedAt: Date.now(),
    };

    setProject(updatedProj);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProj));
    } catch {}

    setEditingSegment(null);
  };

  // Copy single complete video production prompt to clipboard (all 13 sections)
  const handleCopySinglePrompt = async (seg: VideoPromptSegment) => {
    const currentSeg = project?.prompts.find((p) => p.segmentNumber === seg.segmentNumber) || seg;
    const currentProfile = getActiveProfile();
    const completeDocument = buildCompleteVideoPrompt(currentSeg, currentProfile);

    try {
      await navigator.clipboard.writeText(completeDocument);
      setCopiedSegmentNumber(seg.segmentNumber);
      setTimeout(() => setCopiedSegmentNumber(null), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = completeDocument;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedSegmentNumber(seg.segmentNumber);
      setTimeout(() => setCopiedSegmentNumber(null), 2000);
    }
  };

  // Copy all complete production prompts to clipboard with clear segment headings & separators
  const handleCopyAllPrompts = async () => {
    if (!project || project.prompts.length === 0) return;

    const currentProfile = getActiveProfile();

    const formatted = project.prompts.map((p) => {
      return `============================================================
SEGMENT #${p.segmentNumber} OF ${project.prompts.length}: ${p.segmentType.toUpperCase()}
============================================================
${buildCompleteVideoPrompt(p, currentProfile)}`;
    }).join('\n\n\n');

    const header = `GOOGLE FLOW COMPLETE VIDEO PRODUCTION STORYBOARD
Project: ${project.sourceTitle}
Content Mode: ${project.contentMode}
Target Aspect Ratio: ${project.aspectRatio || aspectRatio}
Total Duration: ${project.durationSeconds}s
Total Prompts: ${project.prompts.length}
Generated: ${new Date(project.updatedAt).toLocaleString()}
Production Continuity Lock: ACTIVE

============================================================\n\n`;

    const fullContent = header + formatted;

    try {
      await navigator.clipboard.writeText(fullContent);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2500);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = fullContent;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2500);
    }
  };

  // Download locally as Markdown or JSON with complete prompt details
  const handleDownloadFile = (type: 'md' | 'json') => {
    if (!project) return;
    const currentProfile = getActiveProfile();

    let content = '';
    let fileName = `${project.sourceTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_GoogleFlowPrompts`;

    if (type === 'json') {
      content = JSON.stringify(project, null, 2);
      fileName += '.json';
    } else {
      const header = `# Google Flow Video Storyboard: ${project.sourceTitle}

- **Content Mode**: ${project.contentMode}
- **Aspect Ratio**: ${project.aspectRatio || aspectRatio}
- **Visual Style**: ${project.stylePreset}
- **Camera Direction**: ${project.cameraMotionPreset}
- **Lighting & Atmosphere**: ${project.lightingPreset}
- **Segments Count**: ${project.prompts.length}
- **Total Duration**: ${project.durationSeconds}s
- **Date**: ${new Date(project.updatedAt).toLocaleString()}

---

`;
      const segmentsMd = project.prompts.map((p) => `## Segment #${p.segmentNumber}: ${p.segmentType} (${p.timestamp})

\`\`\`
${buildCompleteVideoPrompt(p, currentProfile)}
\`\`\`

---
`).join('\n\n');

      content = header + segmentsMd;
      fileName += '.md';
    }

    const blob = new Blob([content], { type: type === 'json' ? 'application/json' : 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export directly to Google Drive with complete prompt specifications
  const handleExportToGoogleDrive = async () => {
    if (!project) return;
    const currentProfile = getActiveProfile();

    setExportingDrive(true);
    setErrorMessage(null);
    setDriveSuccessLink(null);

    let token = getCachedDriveToken();
    if (!token) {
      try {
        token = await authorizeGoogleDrive();
      } catch (err: any) {
        setErrorMessage('Google Drive authorization was cancelled or failed. Please authorize Google Drive in Overview.');
        setExportingDrive(false);
        return;
      }
    }

    try {
      const safeTitle = project.sourceTitle.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim() || 'Flow_Video_Prompts';
      const fileName = `${safeTitle}_Google_Flow_Prompts.md`;

      const markdownContent = `# Google Flow Complete Video Production Storyboard: ${project.sourceTitle}

**Content Mode**: ${project.contentMode}
**Aspect Ratio**: ${project.aspectRatio || aspectRatio}
**Style Preset**: ${project.stylePreset}
**Camera Preset**: ${project.cameraMotionPreset}
**Lighting Preset**: ${project.lightingPreset}
**Total Segments**: ${project.prompts.length} (${project.durationSeconds}s)
**Generated**: ${new Date(project.updatedAt).toLocaleString()}
**Production Continuity Lock**: ACTIVE

============================================================

${project.prompts.map((p) => `### Segment #${p.segmentNumber} • ${p.segmentType} [${p.timestamp} | ${p.durationSeconds}s]

\`\`\`
${buildCompleteVideoPrompt(p, currentProfile)}
\`\`\`

------------------------------------------------------------
`).join('\n\n')}
`;

      const uploadResult = await api.saveFileToGoogleDrive({
        accessToken: token,
        fileName,
        content: markdownContent,
        mimeType: 'text/markdown',
      });

      setDriveSuccessLink({
        name: uploadResult.name,
        url: uploadResult.webViewLink || `https://drive.google.com/file/d/${uploadResult.id}/view`,
      });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to export document to Google Drive.');
    } finally {
      setExportingDrive(false);
    }
  };

  // Load sample script if user has not generated one yet
  const handleLoadSampleProject = () => {
    const sampleSegments: GeneratedSegment[] = [
      {
        segmentNumber: 1,
        type: 'HOOK',
        timestamp: '00–08s',
        voiceover: 'Space scientists have detected an inexplicable high-energy cosmic signal pulsing from deep space.',
        estimatedDurationSeconds: 8,
        wordCount: 14,
      },
      {
        segmentNumber: 2,
        type: 'MAIN PART 1',
        timestamp: '08–16s',
        voiceover: 'Deep-space radio observatories locked onto the coordinates, confirming a non-random rhythmic pattern repeating every 16 minutes.',
        estimatedDurationSeconds: 8,
        wordCount: 16,
      },
      {
        segmentNumber: 3,
        type: 'MAIN PART 2',
        timestamp: '16–24s',
        voiceover: 'Spectrometric analysis revealed the pulse pierced through intergalactic dust clouds with extraordinary magnetic intensity.',
        estimatedDurationSeconds: 8,
        wordCount: 14,
      },
      {
        segmentNumber: 4,
        type: 'ENDING',
        timestamp: '24–32s',
        voiceover: 'Whether it is a hyper-dense magnetar or an unprecedented astronomical phenomenon, researchers are now monitoring the skies worldwide.',
        estimatedDurationSeconds: 8,
        wordCount: 17,
      },
    ];

    executeGeneratePrompts({
      segments: sampleSegments,
      contentMode: 'Science & Technology',
      sourceTitle: 'Deep Space Cosmic Signal Breakthrough',
      durationSeconds: 32,
      language: 'English',
      ratio: aspectRatio,
      style: selectedStyle,
      camera: selectedCamera,
      lighting: selectedLighting,
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center space-x-3.5">
          <div
            className="p-3 rounded-xl text-black shadow-md flex-shrink-0"
            style={{
              backgroundColor: 'var(--accent-primary)',
              boxShadow: '0 0 16px -2px var(--accent-glow)',
            }}
          >
            <Film className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Video Prompt Builder
              </h2>
              <span
                className="px-2 py-0.5 rounded text-[11px] font-semibold font-mono border"
                style={{
                  backgroundColor: 'var(--accent-subtle)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--accent-text)',
                }}
              >
                Google Flow & Veo
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Structured text-to-video prompts mapped strictly to each script segment's exact voiceover and timing.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        {project && project.prompts.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyAllPrompts}
              className="px-3.5 py-2 rounded-xl text-black text-xs font-bold shadow-md flex items-center space-x-1.5 transition-colors cursor-pointer jarvis-gold-btn"
              title="Copy all segment prompts in storyboard format"
            >
              {copiedAll ? <Check className="w-4 h-4 text-black" /> : <Copy className="w-4 h-4 text-black" />}
              <span>{copiedAll ? 'All Prompts Copied!' : 'Copy All Prompts'}</span>
            </button>

            <button
              onClick={handleExportToGoogleDrive}
              disabled={exportingDrive}
              className="px-3 py-2 rounded-xl text-xs font-semibold border flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
              title="Save formatted storyboard directly to Google Drive"
            >
              <HardDrive className={`w-3.5 h-3.5 ${exportingDrive ? 'animate-spin' : 'text-blue-400'}`} />
              <span>{exportingDrive ? 'Exporting...' : 'Save to Drive'}</span>
            </button>

            <button
              onClick={() => handleDownloadFile('md')}
              className="px-3 py-2 rounded-xl text-xs font-medium border flex items-center space-x-1.5 transition-colors cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
              title="Download Markdown storyboard file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>.md</span>
            </button>
          </div>
        )}
      </div>

      {/* Quota Recovery & Rate Limit Banner */}
      <QuotaRecoveryBanner
        onRetry={handleResumePendingTask}
        isGenerating={loading}
      />

      {/* Messages */}
      {errorMessage && (
        <div
          className="p-4 rounded-xl border flex items-start space-x-3 text-xs"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
          }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{errorMessage}</p>
          </div>
          <button onClick={() => setErrorMessage(null)} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {infoMessage && (
        <div
          className="p-4 rounded-xl border flex items-center space-x-3 text-xs"
          style={{
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderColor: 'rgba(34, 197, 94, 0.3)',
            color: '#22c55e',
          }}
        >
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{infoMessage}</span>
        </div>
      )}

      {driveSuccessLink && (
        <div
          className="p-4 rounded-xl border flex items-center justify-between text-xs"
          style={{
            backgroundColor: 'rgba(59, 130, 246, 0.12)',
            borderColor: 'rgba(59, 130, 246, 0.35)',
            color: 'var(--text-primary)',
          }}
        >
          <div className="flex items-center space-x-2">
            <HardDrive className="w-4 h-4 text-blue-400" />
            <span>
              Successfully saved <strong className="font-mono">{driveSuccessLink.name}</strong> to your Google Drive!
            </span>
          </div>
          {driveSuccessLink.url && (
            <a
              href={driveSuccessLink.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 font-semibold text-blue-400 hover:underline ml-3"
            >
              <span>Open in Drive</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      {/* Main Content Area */}
      {!project && !loading && (
        /* Empty State */
        <div
          className="rounded-2xl p-10 border shadow-xl flex flex-col items-center justify-center text-center space-y-5"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div
            className="p-4 rounded-2xl shadow-lg text-black"
            style={{
              backgroundColor: 'var(--accent-primary)',
              boxShadow: '0 0 20px -2px var(--accent-glow)',
            }}
          >
            <Film className="w-10 h-10" />
          </div>

          <div className="max-w-md space-y-2">
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              No Script Connected Yet
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Generate a short-video script in <strong>Script Generator</strong>, then click <strong>"Generate Video Prompts"</strong> to automatically create camera-directed prompts for Google Flow.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {onNavigateToScripts && (
              <button
                type="button"
                onClick={onNavigateToScripts}
                className="px-5 py-2.5 rounded-xl text-black text-xs font-bold shadow-md flex items-center space-x-2 cursor-pointer transition-transform hover:scale-[1.02] jarvis-gold-btn"
              >
                <span>Go to Script Generator</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </button>
            )}

            <button
              type="button"
              onClick={handleLoadSampleProject}
              className="px-4 py-2.5 rounded-xl text-xs font-medium border flex items-center space-x-2 cursor-pointer transition-colors"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Load Sample Project</span>
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div
          className="rounded-2xl p-12 border shadow-xl flex flex-col items-center justify-center space-y-4"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div
            className="p-3.5 rounded-2xl shadow-lg text-black animate-spin"
            style={{
              backgroundColor: 'var(--accent-primary)',
              boxShadow: '0 0 16px -2px var(--accent-glow)',
            }}
          >
            <RefreshCw className="w-8 h-8 text-black" />
          </div>
          <div className="text-center space-y-1">
            <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Crafting Google Flow Video Prompts...
            </h4>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Analyzing script dialogue, camera angles, lighting conditions, and pacing for each segment.
            </p>
          </div>
        </div>
      )}

      {/* Project Content */}
      {project && !loading && (
        <div className="space-y-6">
          {/* Project Control Bar: Settings & Presets */}
          <div
            className="rounded-2xl p-5 border shadow-xl space-y-4"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            {/* Top Row: Project Title & Quick Stats */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Active Script Project
                </span>
                <h3 className="text-base font-bold truncate max-w-xl" style={{ color: 'var(--text-primary)' }}>
                  {project.sourceTitle}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-semibold border"
                  style={{
                    backgroundColor: 'var(--accent-subtle)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--accent-text)',
                  }}
                >
                  {project.contentMode}
                </span>

                <span
                  className="px-2.5 py-1 rounded-full text-xs font-semibold border"
                  style={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {project.durationSeconds}s Total
                </span>

                <span
                  className="px-2.5 py-1 rounded-full text-xs font-semibold border"
                  style={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {project.prompts.length} Prompts
                </span>
              </div>
            </div>

            {/* Controls Grid: Aspect Ratio, Style Preset, Camera Movement, Lighting */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Aspect Ratio Toggle */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold flex items-center space-x-1.5" style={{ color: 'var(--text-primary)' }}>
                  <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Target Aspect Ratio</span>
                </label>
                <div className="flex items-center space-x-1.5">
                  {(['16:9', '9:16', '1:1'] as const).map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => {
                        setAspectRatio(ratio);
                        if (ratio === '9:16' || ratio === '16:9') {
                          switchAspectRatio(ratio);
                        }
                      }}
                      className={`flex-1 py-2 px-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                        aspectRatio === ratio ? 'shadow-md' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{
                        backgroundColor: aspectRatio === ratio ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
                        borderColor: aspectRatio === ratio ? 'var(--border-focus)' : 'var(--border-subtle)',
                        color: aspectRatio === ratio ? '#ffffff' : 'var(--text-primary)',
                      }}
                    >
                      {ratio} {ratio === '16:9' ? '(Landscape)' : ratio === '9:16' ? '(Shorts)' : '(Square)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Visual Style Preset */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold flex items-center space-x-1.5" style={{ color: 'var(--text-primary)' }}>
                  <Palette className="w-3.5 h-3.5 text-purple-400" />
                  <span>Visual Style Preset</span>
                </label>
                <select
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium border focus:outline-none focus:ring-1"
                  style={{
                    backgroundColor: 'var(--bg-base)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {STYLE_PRESETS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Camera Movement Preset */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold flex items-center space-x-1.5" style={{ color: 'var(--text-primary)' }}>
                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Camera Direction</span>
                </label>
                <select
                  value={selectedCamera}
                  onChange={(e) => setSelectedCamera(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium border focus:outline-none focus:ring-1"
                  style={{
                    backgroundColor: 'var(--bg-base)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {CAMERA_PRESETS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Lighting & Mood Preset */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold flex items-center space-x-1.5" style={{ color: 'var(--text-primary)' }}>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Atmosphere & Lighting</span>
                </label>
                <select
                  value={selectedLighting}
                  onChange={(e) => setSelectedLighting(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium border focus:outline-none focus:ring-1"
                  style={{
                    backgroundColor: 'var(--bg-base)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {LIGHTING_PRESETS.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bottom Controls Row: Re-apply to all prompts */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Tip: Changes to presets take effect when clicking <strong>"Regenerate All Prompts"</strong> or regenerating single segments.
              </div>

              <button
                type="button"
                onClick={handleRegenerateAll}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-xs font-semibold border flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} style={{ color: 'var(--accent-primary)' }} />
                <span>Regenerate All with New Presets</span>
              </button>
            </div>
          </div>

          {/* Individual Segment Prompt Cards List */}
          <div className="space-y-5">
            {project.prompts.map((seg, idx) => {
              const isHook = seg.segmentType.toUpperCase().includes('HOOK');
              const isEnding = seg.segmentType.toUpperCase().includes('ENDING');
              const isCopied = copiedSegmentNumber === seg.segmentNumber;
              const isRegenerating = regeneratingSegmentNum === seg.segmentNumber;

              return (
                <div
                  key={seg.segmentNumber}
                  className="rounded-2xl p-5 border shadow-xl transition-all space-y-4"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  {/* Card Header: Segment Role, Timing, Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center space-x-2.5">
                      {/* Segment Number Badge */}
                      <span
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-black shadow-sm flex-shrink-0"
                        style={{
                          backgroundColor: 'var(--accent-primary)',
                          boxShadow: '0 0 10px -2px var(--accent-glow)',
                        }}
                      >
                        {seg.segmentNumber}
                      </span>

                      {/* Type Pill */}
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border"
                        style={{
                          backgroundColor: isHook
                            ? 'rgba(139, 92, 246, 0.15)'
                            : isEnding
                            ? 'rgba(245, 158, 11, 0.15)'
                            : 'rgba(59, 130, 246, 0.15)',
                          borderColor: isHook
                            ? 'rgba(139, 92, 246, 0.3)'
                            : isEnding
                            ? 'rgba(245, 158, 11, 0.3)'
                            : 'rgba(59, 130, 246, 0.3)',
                          color: isHook
                            ? '#a78bfa'
                            : isEnding
                            ? '#fbbf24'
                            : '#60a5fa',
                        }}
                      >
                        {seg.segmentType}
                      </span>

                      {/* Timestamp & Duration */}
                      <div className="flex items-center space-x-1.5 text-xs font-mono font-medium" style={{ color: 'var(--text-secondary)' }}>
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{seg.timestamp}</span>
                        <span>•</span>
                        <span className="font-bold">{seg.durationSeconds}s</span>
                      </div>
                    </div>

                    {/* Action Buttons for this Segment */}
                    <div className="flex items-center space-x-2">
                      {/* Copy Prompt Button */}
                      <button
                        type="button"
                        onClick={() => handleCopySinglePrompt(seg)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                          isCopied ? 'bg-emerald-500 text-white' : 'text-white'
                        }`}
                        style={{
                          backgroundColor: isCopied ? '#10b981' : 'var(--accent-primary)',
                        }}
                        title="Copy full Google Flow prompt"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? 'Copied!' : 'Copy Prompt'}</span>
                      </button>

                      {/* Edit Prompt Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSegment(seg);
                          setEditedPromptText(seg.googleFlowPrompt);
                          setEditedSceneText(seg.visualScene);
                        }}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-medium border flex items-center space-x-1 cursor-pointer transition-colors"
                        style={{
                          backgroundColor: 'var(--bg-surface-elevated)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-primary)',
                        }}
                        title="Edit visual prompt manually"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                        <span>Edit</span>
                      </button>

                      {/* Regenerate Segment Button */}
                      <button
                        type="button"
                        onClick={() => setCustomTweakModalSeg(seg)}
                        disabled={isRegenerating}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-medium border flex items-center space-x-1 cursor-pointer transition-colors disabled:opacity-50"
                        style={{
                          backgroundColor: 'var(--bg-surface-elevated)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-secondary)',
                        }}
                        title="Regenerate this segment's visual prompt"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} style={{ color: 'var(--accent-primary)' }} />
                        <span>Regen</span>
                      </button>
                    </div>
                  </div>

                  {/* Section 1: Exact Dialogue Voiceover */}
                  <div
                    className="p-3.5 rounded-xl border flex flex-col space-y-1"
                    style={{
                      backgroundColor: 'var(--bg-base)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div className="flex items-center justify-between text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                      <span className="flex items-center space-x-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Spoken Voiceover Dialogue (Matched Source Audio)</span>
                      </span>
                      <span>{seg.voiceover.split(/\s+/).filter(Boolean).length} words</span>
                    </div>
                    <p className="text-sm font-medium leading-relaxed italic" style={{ color: 'var(--text-primary)' }}>
                      "{seg.voiceover}"
                    </p>
                  </div>

                  {/* Section 2: Complete Google Flow Prompt (Ready to Paste) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                      <span className="flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Google Flow / Veo Prompt</span>
                      </span>
                      <span className="text-[11px] font-mono font-normal" style={{ color: 'var(--text-muted)' }}>
                        Target: {seg.durationSeconds}s • {aspectRatio}
                      </span>
                    </div>

                    <div
                      className="p-4 rounded-xl border font-mono text-xs leading-relaxed select-all relative group"
                      style={{
                        backgroundColor: 'var(--bg-base)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {seg.googleFlowPrompt}
                    </div>
                  </div>

                  {/* Section 3: Visual Breakdown Chips */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                    <div
                      className="p-2.5 rounded-xl border flex flex-col space-y-0.5"
                      style={{
                        backgroundColor: 'var(--bg-surface-elevated)',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center space-x-1">
                        <Camera className="w-3 h-3 text-emerald-400" />
                        <span>Camera & Motion</span>
                      </span>
                      <span className="truncate text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                        {seg.cameraMovement}
                      </span>
                    </div>

                    <div
                      className="p-2.5 rounded-xl border flex flex-col space-y-0.5"
                      style={{
                        backgroundColor: 'var(--bg-surface-elevated)',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center space-x-1">
                        <Sun className="w-3 h-3 text-amber-400" />
                        <span>Lighting & Mood</span>
                      </span>
                      <span className="truncate text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                        {seg.lighting}
                      </span>
                    </div>

                    <div
                      className="p-2.5 rounded-xl border flex flex-col space-y-0.5"
                      style={{
                        backgroundColor: 'var(--bg-surface-elevated)',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center space-x-1">
                        <Palette className="w-3 h-3 text-purple-400" />
                        <span>Visual Style</span>
                      </span>
                      <span className="truncate text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                        {seg.visualStyle}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: Inline Edit Prompt */}
      {editingSegment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-2xl rounded-2xl border shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  Edit Prompt: Segment #{editingSegment.segmentNumber} ({editingSegment.segmentType})
                </h3>
              </div>
              <button
                onClick={() => setEditingSegment(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Readonly Voiceover for Reference */}
            <div
              className="p-3 rounded-xl border text-xs"
              style={{
                backgroundColor: 'var(--bg-base)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <span className="font-semibold text-slate-400 block mb-1">Voiceover Dialogue:</span>
              <p className="italic font-medium" style={{ color: 'var(--text-primary)' }}>
                "{editingSegment.voiceover}"
              </p>
            </div>

            {/* Editable Google Flow Prompt Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold block" style={{ color: 'var(--text-primary)' }}>
                Google Flow Prompt
              </label>
              <textarea
                value={editedPromptText}
                onChange={(e) => setEditedPromptText(e.target.value)}
                rows={4}
                className="w-full p-3.5 rounded-xl font-mono text-xs border focus:outline-none focus:ring-2 leading-relaxed"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {/* Editable Scene Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold block" style={{ color: 'var(--text-primary)' }}>
                Visual Scene Context
              </label>
              <input
                type="text"
                value={editedSceneText}
                onChange={(e) => setEditedSceneText(e.target.value)}
                className="w-full p-3 rounded-xl text-xs border focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => setEditingSegment(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium border cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-secondary)',
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveInlineEdit}
                className="px-5 py-2 rounded-xl text-black text-xs font-bold shadow-md flex items-center space-x-1.5 cursor-pointer jarvis-gold-btn"
              >
                <Save className="w-4 h-4 text-black" />
                <span>Save Prompt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Regenerate Segment with Custom Tweaks */}
      {customTweakModalSeg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-lg rounded-2xl border shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  Regenerate Segment #{customTweakModalSeg.segmentNumber}
                </h3>
              </div>
              <button
                onClick={() => setCustomTweakModalSeg(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Re-generate the Google Flow prompt matching the dialogue. You can optionally provide directional guidance below.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold block" style={{ color: 'var(--text-primary)' }}>
                Optional Visual Direction (e.g., "Add rainy reflections and neon sign", "Slow macro close-up")
              </label>
              <input
                type="text"
                placeholder="e.g. Extreme close-up on eye with reflection, moody atmospheric dust"
                value={customTweakInput}
                onChange={(e) => setCustomTweakInput(e.target.value)}
                className="w-full p-3 rounded-xl text-xs border focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => setCustomTweakModalSeg(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium border cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-secondary)',
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleRegenerateSingle(customTweakModalSeg, customTweakInput)}
                className="px-5 py-2 rounded-xl text-black text-xs font-bold shadow-md flex items-center space-x-1.5 cursor-pointer jarvis-gold-btn"
              >
                <RefreshCw className="w-4 h-4 text-black" />
                <span>Regenerate Prompt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
