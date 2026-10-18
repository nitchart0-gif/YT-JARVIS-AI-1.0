import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Clapperboard,
  Copy,
  Check,
  RefreshCw,
  Clock,
  Layers,
  ChevronDown,
  Info,
  KeyRound,
  ExternalLink,
  Film,
  Search,
  Image as ImageIcon,
  Scissors,
  ArrowRight,
  Download,
  BookmarkPlus,
  Compass,
  Target,
  Flame,
  Radio,
  FileCheck,
  Sliders,
} from 'lucide-react';
import { api, type GeneratedSegment, type ScriptGenerationResponse } from '../services/api.ts';
import { formatAIErrorMessage } from '../services/apiResponseHandler.ts';
import { saveSource } from '../services/sourceRepository.ts';
import { quotaManager, type PendingTaskData } from '../services/quotaManager.ts';
import { QuotaRecoveryBanner } from './common/QuotaRecoveryBanner.tsx';

export const CONTENT_MODES = [
  { id: 'Educational', label: 'Educational', desc: 'Simplifies complex concepts for broad understanding with clear logic and analogies.' },
  { id: 'Science & Technology', label: 'Science & Tech', desc: 'Explains technical breakthroughs accurately without oversimplifying core science.' },
  { id: 'Explainer', label: 'Explainer', desc: 'Answers what happened, how it works, and why it matters in structured sequence.' },
  { id: 'Documentary', label: 'Documentary', desc: 'Cinematic, factual storytelling; provides deep context and historical significance.' },
  { id: 'Professional News', label: 'Professional News', desc: 'Credible, neutral presenter; prioritizes main development, verified details, and context.' },
  { id: 'Breaking News', label: 'Breaking News', desc: 'Fast, urgent lead with confirmed facts; strictly avoids fabricated urgency.' },
  { id: 'History', label: 'History', desc: 'Maintains chronological accuracy; separates established events from interpretations.' },
  { id: 'Business & Finance', label: 'Business & Finance', desc: 'Focuses on financial implications and markets without speculative investment promises.' },
  { id: 'Biography', label: 'Biography', desc: 'Highlights verified milestones, personal decisions, character, and lasting impact.' },
  { id: 'Storytelling', label: 'Storytelling', desc: 'Engaging narrative arc and transitions without inventing fictitious events as facts.' },
  { id: 'Mystery & Investigation', label: 'Mystery & Investigation', desc: 'Builds curiosity around documented evidence and unresolved questions ethically.' },
  { id: 'Motivational', label: 'Motivational', desc: 'Extracts inspiring lessons rooted firmly in verified subject matter.' },
];

export const DURATIONS = [
  { seconds: 24, label: '24s (3 Segments)', desc: '1 Hook • 1 Main Part • 1 Ending' },
  { seconds: 32, label: '32s (4 Segments)', desc: '1 Hook • 2 Main Parts • 1 Ending' },
  { seconds: 40, label: '40s (5 Segments)', desc: '1 Hook • 3 Main Parts • 1 Ending' },
  { seconds: 48, label: '48s (6 Segments)', desc: '1 Hook • 4 Main Parts • 1 Ending' },
  { seconds: 56, label: '56s (7 Segments)', desc: '1 Hook • 5 Main Parts • 1 Ending' },
  { seconds: 60, label: '60s (8 Segments)', desc: '1 Hook • 6 Main Parts • 1 Ending (4s)' },
];

export const LANGUAGES = [
  { id: 'English', label: 'English', desc: 'Punchy, conversational English for global short-video audiences' },
  { id: 'Hindi', label: 'Hindi (हिंदी)', desc: 'Natural spoken Hindi in Devanagari script for short-form voice-over' },
  { id: 'Hinglish', label: 'Hinglish', desc: 'Popular conversational mix of Hindi and English in Latin alphabet' },
  { id: 'Gujarati', label: 'Gujarati (ગુજરાતી)', desc: 'Fluent Gujarati script tailored for spoken narration' },
];

export const HOOK_STYLES = [
  { id: 'Curiosity Gap', label: 'Curiosity Gap', desc: 'Withholds the resolution to make viewers stay to find out' },
  { id: 'Dramatic Question', label: 'Dramatic Question', desc: 'Direct question challenging conventional belief or intuition' },
  { id: 'Shocking Statistic', label: 'Shocking Statistic / Fact', desc: 'Lead with an astonishing verified number or finding' },
  { id: 'Problem & Dilemma', label: 'Problem & Dilemma', desc: 'Immediate relatable problem that demands an urgent solution' },
  { id: 'Story In Media Res', label: 'In Media Res', desc: 'Drops listener straight into the peak moment of action' },
];

export const AUDIENCE_PRESETS = [
  { id: 'General Curious Audience', label: 'General Curious' },
  { id: 'Tech Enthusiasts & Developers', label: 'Tech Enthusiasts' },
  { id: 'Students & Beginners', label: 'Students & Beginners' },
  { id: 'Business & Entrepreneurs', label: 'Business & Finance' },
  { id: 'History & Mystery Buffs', label: 'History Buffs' },
];

export const TOPIC_SUGGESTIONS = [
  { topic: 'How Quantum Computers Actually Break Encryption', mode: 'Science & Technology', angle: 'Shor algorithm vs modern RSA, timeline to Q-Day' },
  { topic: 'The Discovery of Water on Exoplanets', mode: 'Documentary', angle: 'James Webb atmospheric spectrum analysis and biosignatures' },
  { topic: 'Why Modern Airplanes Do Not Fly in Straight Lines', mode: 'Explainer', angle: 'Great circle routes, jet streams, and ETOPS emergency rules' },
  { topic: 'The Mystery of the Wow! Signal Solved?', mode: 'Mystery & Investigation', angle: '1977 Big Ear telescope radio burst vs recent cometary hydrogen hypothesis' },
  { topic: 'How the 1969 Apollo Guidance Computer Worked', mode: 'History', angle: 'Rope core memory, Margaret Hamilton code, 1202 program alarm' },
  { topic: 'Solid-State EV Batteries: Game Changer or Hype?', mode: 'Business & Finance', angle: 'Ceramic electrolytes, dendrites, commercial production timelines' },
];

export interface ScriptGeneratorProps {
  userId?: string;
  initialTopic?: string;
  onScriptGenerated?: (script: ScriptGenerationResponse) => void;
  onTransferToVideoPrompts?: (script: ScriptGenerationResponse, sourceTitle?: string) => void;
  onTransferToSEOStudio?: (script: ScriptGenerationResponse, sourceTitle?: string, sourceArticle?: string) => void;
  onTransferToThumbnailStudio?: (script: ScriptGenerationResponse, sourceTitle?: string, sourceArticle?: string) => void;
  onTransferToYTEditor?: (script: ScriptGenerationResponse, sourceTitle?: string) => void;
  onNavigateToConfig?: () => void;
  onNavigateToSources?: () => void;
}

export const ScriptGenerator: React.FC<ScriptGeneratorProps> = ({
  userId = 'local_creator',
  initialTopic = '',
  onScriptGenerated,
  onTransferToVideoPrompts,
  onTransferToSEOStudio,
  onTransferToThumbnailStudio,
  onTransferToYTEditor,
  onNavigateToConfig,
  onNavigateToSources,
}) => {
  // Input State
  const [topic, setTopic] = useState<string>(initialTopic);
  const [angle, setAngle] = useState<string>('');
  const [targetAudience, setTargetAudience] = useState<string>('General Curious Audience');
  const [contentMode, setContentMode] = useState<string>('Educational');
  const [durationSeconds, setDurationSeconds] = useState<number>(32);
  const [language, setLanguage] = useState<string>('English');
  const [hookStyle, setHookStyle] = useState<string>('Curiosity Gap');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Generation & Status State
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [structuredError, setStructuredError] = useState<{
    title: string;
    message: string;
    isRetryable: boolean;
    isAuth: boolean;
    code?: string;
  } | null>(null);
  const [retryStatus, setRetryStatus] = useState<string | null>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState<boolean>(false);
  const isGeneratingRef = useRef<boolean>(false);

  // Result State
  const [generatedScript, setGeneratedScript] = useState<ScriptGenerationResponse | null>(null);
  const [editableSegments, setEditableSegments] = useState<GeneratedSegment[]>([]);
  const [copiedSegmentId, setCopiedSegmentId] = useState<number | null>(null);
  const [copiedFull, setCopiedFull] = useState<boolean>(false);
  const [savedToSourcesSuccess, setSavedToSourcesSuccess] = useState<boolean>(false);

  // Apply suggestion
  const handleApplySuggestion = (s: typeof TOPIC_SUGGESTIONS[0]) => {
    setTopic(s.topic);
    setContentMode(s.mode);
    setAngle(s.angle);
    setErrorMessage(null);
  };

  // Generate Script from Topic
  const handleGenerateScript = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isGeneratingRef.current) return;

    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      setErrorMessage('Please enter a topic for your YouTube video script.');
      return;
    }

    isGeneratingRef.current = true;
    setLoading(true);
    setErrorMessage(null);
    setStructuredError(null);
    setRetryStatus(null);
    setApiKeyMissing(false);
    setSavedToSourcesSuccess(false);

    try {
      const result = await api.generateScriptFromTopic({
        userId,
        topic: trimmedTopic,
        angle: angle.trim() || undefined,
        targetAudience: targetAudience || undefined,
        contentMode,
        durationSeconds,
        language,
        hookStyle,
        onRetry: (info) => {
          setRetryStatus(
            `Model busy (${info.status || '503'}). Retrying attempt ${info.attempt} of ${info.maxRetries} (waiting ${Math.round(info.delayMs / 1000)}s)...`
          );
        },
      });

      setGeneratedScript(result);
      setEditableSegments(result.segments);
      quotaManager.clearPendingTask();
      quotaManager.resetToNormal();
      if (onScriptGenerated) {
        onScriptGenerated(result);
      }
    } catch (err: any) {
      const formatted = formatAIErrorMessage(err);
      setStructuredError(formatted);
      setErrorMessage(formatted.message);
      if (formatted.isAuth) {
        setApiKeyMissing(true);
      }
      quotaManager.handleError(err, {
        type: 'topic_script',
        label: `Topic: ${trimmedTopic}`,
        payload: {
          topic: trimmedTopic,
          angle,
          targetAudience,
          contentMode,
          durationSeconds,
          language,
          hookStyle,
        },
        timestamp: Date.now(),
      });
    } finally {
      setLoading(false);
      isGeneratingRef.current = false;
      setRetryStatus(null);
    }
  };

  // Safe resume from preserved task
  const handleResumePendingTask = (pending: PendingTaskData | null) => {
    if (!pending) {
      handleGenerateScript();
      return;
    }
    if (pending.payload?.topic) {
      setTopic(pending.payload.topic);
      if (pending.payload.angle) setAngle(pending.payload.angle);
      if (pending.payload.contentMode) setContentMode(pending.payload.contentMode);
      if (pending.payload.durationSeconds) setDurationSeconds(pending.payload.durationSeconds);
      if (pending.payload.language) setLanguage(pending.payload.language);
      handleGenerateScript();
    }
  };

  // Offline demo generator
  const handleGenerateOfflineDemo = async () => {
    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      setErrorMessage('Please enter a video topic.');
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    setStructuredError(null);
    try {
      const result = await api.generateScriptFromTopic({
        userId,
        topic: trimmedTopic,
        angle: angle.trim() || undefined,
        targetAudience: targetAudience || undefined,
        contentMode,
        durationSeconds,
        language,
        hookStyle,
        allowOfflineDemo: true,
      });

      setGeneratedScript(result);
      setEditableSegments(result.segments);
      quotaManager.clearPendingTask();
      quotaManager.resetToNormal();
      if (onScriptGenerated) {
        onScriptGenerated(result);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Offline demo generation failed.');
    } finally {
      setLoading(false);
    }
  };

  // Segment editing
  const handleSegmentVoiceoverChange = (index: number, newVoiceover: string) => {
    setEditableSegments((prev) => {
      const copy = [...prev];
      const words = newVoiceover.trim() ? newVoiceover.trim().split(/\s+/).filter(Boolean).length : 0;
      const estDuration = words > 0 ? parseFloat((words / 2.1).toFixed(1)) : copy[index].estimatedDurationSeconds;
      copy[index] = {
        ...copy[index],
        voiceover: newVoiceover,
        wordCount: words,
        estimatedDurationSeconds: estDuration,
      };
      return copy;
    });
  };

  // Copy single segment
  const handleCopySegment = async (segmentNumber: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSegmentId(segmentNumber);
      setTimeout(() => setCopiedSegmentId(null), 2000);
    } catch {
      // Ignore
    }
  };

  // Copy complete voiceover
  const handleCopyAll = async () => {
    if (!editableSegments.length) return;
    const fullText = editableSegments
      .map((s) => `[${s.timestamp} | ${s.type}]\n${s.voiceover}`)
      .join('\n\n');
    try {
      await navigator.clipboard.writeText(fullText);
      setCopiedFull(true);
      setTimeout(() => setCopiedFull(false), 2200);
    } catch {
      // Ignore
    }
  };

  // Download script
  const handleDownload = () => {
    if (!editableSegments.length) return;
    const title = generatedScript?.suggestedTitle || topic || 'YouTube-Script';
    const content = `# ${title}\n\n` +
      `**Topic:** ${topic}\n` +
      `**Mode:** ${contentMode} | **Duration:** ${durationSeconds}s | **Language:** ${language}\n` +
      `**Model:** gemini-3.8-flash\n\n` +
      `---\n\n` +
      editableSegments
        .map((s) => `### Segment ${s.segmentNumber}: ${s.type} (${s.timestamp})\n*${s.estimatedDurationSeconds}s • ${s.wordCount} words*\n\n${s.voiceover}`)
        .join('\n\n');

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}_script.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Save to Sources library
  const handleSaveToSources = async () => {
    if (!editableSegments.length) return;
    const scriptBody = editableSegments
      .map((s) => `[${s.timestamp} | ${s.type}]\n${s.voiceover}`)
      .join('\n\n');
    const sourceTitle = generatedScript?.suggestedTitle || `${topic} (Generated Script)`;

    try {
      saveSource(userId, {
        title: sourceTitle,
        text: `TOPIC: ${topic}\n${angle ? `ANGLE: ${angle}\n` : ''}MODE: ${contentMode}\n\n${scriptBody}`,
      });

      setSavedToSourcesSuccess(true);
      setTimeout(() => setSavedToSourcesSuccess(false), 3000);
    } catch (e) {
      console.error('Failed saving to sources:', e);
    }
  };

  // Pacing evaluator
  const getPacingStatus = (words: number, targetSec: number) => {
    if (words === 0) return { label: 'Empty', color: 'text-amber-400' };
    const wps = words / targetSec;
    if (wps < 1.7) return { label: 'Slow pace (~' + wps.toFixed(1) + ' wps)', color: 'text-blue-400' };
    if (wps > 2.5) return { label: 'Fast pace (~' + wps.toFixed(1) + ' wps)', color: 'text-amber-400' };
    return { label: 'Optimal pace (~' + wps.toFixed(1) + ' wps)', color: 'text-emerald-400' };
  };

  const effectiveScript = generatedScript
    ? { ...generatedScript, segments: editableSegments }
    : null;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div
        className="p-6 rounded-2xl border shadow-sm relative overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2.5">
              <div
                className="p-2.5 rounded-xl shadow-md text-black flex items-center justify-center"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  boxShadow: '0 0 16px -2px var(--accent-glow)',
                }}
              >
                <Clapperboard className="w-5 h-5 text-black" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  Script Generator
                </h1>
                <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Topic-driven YouTube script engine powered by <span className="font-mono text-emerald-400">gemini-3.8-flash</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className="px-3 py-1.5 rounded-xl border text-[11px] font-mono flex items-center space-x-1.5"
              style={{
                backgroundColor: 'var(--bg-base)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Model: gemini-3.8-flash</span>
            </span>
          </div>
        </div>
      </div>

      {/* Quota Recovery & Rate Limit Banner */}
      <QuotaRecoveryBanner
        onRetry={handleResumePendingTask}
        onNavigateToConfig={onNavigateToConfig}
        onUseOfflineDemo={handleGenerateOfflineDemo}
        isGenerating={loading}
      />

      {/* Main Grid: Form Left, Results Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Topic Controls Form */}
        <div className="lg:col-span-5 space-y-5">
          <form
            onSubmit={handleGenerateScript}
            className="p-5 rounded-2xl border space-y-4"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center space-x-2 text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                <Target className="w-4 h-4 text-red-500" />
                <span>Video Topic & Angle</span>
              </div>
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Direct Prompt Mode
              </span>
            </div>

            {/* Topic Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold flex items-center justify-between" style={{ color: 'var(--text-primary)' }}>
                <span>Topic / Video Subject <span className="text-red-500">*</span></span>
                <span className="text-[10px] font-normal" style={{ color: 'var(--text-muted)' }}>
                  {topic.length}/300
                </span>
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                maxLength={300}
                rows={2}
                placeholder="e.g. How Solid-State Batteries Will Disrupt Electric Cars in 2026..."
                className="w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none transition-all resize-none"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {/* Quick Inspiration Chips */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                <span className="flex items-center space-x-1">
                  <Flame className="w-3 h-3 text-amber-400" />
                  <span>Topic Inspiration:</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {TOPIC_SUGGESTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplySuggestion(item)}
                    className="text-[10px] px-2.5 py-1 rounded-lg border hover:border-red-500/50 hover:text-red-400 text-left transition-all cursor-pointer"
                    style={{
                      backgroundColor: 'var(--bg-base)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {item.topic}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Mode Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold flex items-center justify-between" style={{ color: 'var(--text-primary)' }}>
                <span>Content Mode ({CONTENT_MODES.length} Styles)</span>
                <span className="text-[10px] font-mono text-emerald-400">
                  {contentMode}
                </span>
              </label>
              <select
                value={contentMode}
                onChange={(e) => setContentMode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition-all cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                {CONTENT_MODES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label} — {m.desc.slice(0, 50)}...
                  </option>
                ))}
              </select>
            </div>

            {/* Duration Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold flex items-center justify-between" style={{ color: 'var(--text-primary)' }}>
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Duration (Shorts/Reels Pacing)</span>
                </span>
                <span className="text-[10px] font-mono text-blue-400">
                  {durationSeconds}s
                </span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {DURATIONS.map((d) => (
                  <button
                    key={d.seconds}
                    type="button"
                    onClick={() => setDurationSeconds(d.seconds)}
                    className="p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center"
                    style={{
                      backgroundColor: durationSeconds === d.seconds ? 'var(--accent-primary)' : 'var(--bg-base)',
                      borderColor: durationSeconds === d.seconds ? 'var(--accent-primary)' : 'var(--border-subtle)',
                      color: durationSeconds === d.seconds ? '#ffffff' : 'var(--text-primary)',
                    }}
                  >
                    <span className="text-xs font-bold">{d.seconds}s</span>
                    <span className="text-[9px] opacity-80">{d.seconds / 8 | 0} segs</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Language Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                Target Narration Language
              </label>
              <div className="grid grid-cols-2 gap-2">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLanguage(l.id)}
                    className="p-2 rounded-xl border text-left transition-all cursor-pointer"
                    style={{
                      backgroundColor: language === l.id ? 'var(--accent-primary)' : 'var(--bg-base)',
                      borderColor: language === l.id ? 'var(--accent-primary)' : 'var(--border-subtle)',
                      color: language === l.id ? '#050506' : 'var(--text-primary)',
                      boxShadow: language === l.id ? '0 0 12px -2px var(--accent-glow)' : 'none',
                    }}
                  >
                    <div className="text-xs font-bold">{l.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle Advanced Angles & Audience */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between py-2 text-xs font-medium cursor-pointer transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                <span className="flex items-center space-x-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Audience, Angle & Hook Strategy</span>
                </span>
                <span className="text-[10px] font-mono">{showAdvanced ? '− Hide' : '+ Expand'}</span>
              </button>

              {showAdvanced && (
                <div className="pt-2 space-y-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  {/* Hook Style */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Hook Style (First 2 Seconds)
                    </label>
                    <select
                      value={hookStyle}
                      onChange={(e) => setHookStyle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border text-xs focus:outline-none"
                      style={{
                        backgroundColor: 'var(--bg-base)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {HOOK_STYLES.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.label} — {h.desc}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Target Audience */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Target Audience
                    </label>
                    <select
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border text-xs focus:outline-none"
                      style={{
                        backgroundColor: 'var(--bg-base)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {AUDIENCE_PRESETS.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Specific Angle / Key Points */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold flex items-center justify-between" style={{ color: 'var(--text-primary)' }}>
                      <span>Focus Points / Narrative Angle (Optional)</span>
                    </label>
                    <textarea
                      value={angle}
                      onChange={(e) => setAngle(e.target.value)}
                      rows={2}
                      placeholder="e.g. Emphasize why silicon anodes fail and how lithium metal changes the equation..."
                      className="w-full px-3 py-2 rounded-xl border text-xs focus:outline-none resize-none"
                      style={{
                        backgroundColor: 'var(--bg-base)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Error Display */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs space-y-1">
                <div className="font-semibold">{structuredError?.title || 'Generation Error'}</div>
                <div>{errorMessage}</div>
                {apiKeyMissing && onNavigateToConfig && (
                  <button
                    type="button"
                    onClick={onNavigateToConfig}
                    className="mt-2 inline-flex items-center space-x-1.5 text-xs text-amber-400 hover:underline font-semibold"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Configure Gemini API Key in Settings &rarr;</span>
                  </button>
                )}
              </div>
            )}

            {/* Retry Status Indicator */}
            {retryStatus && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center space-x-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{retryStatus}</span>
              </div>
            )}

            {/* Generate Button */}
            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs text-black shadow-lg flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed jarvis-gold-btn"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  <span>Synthesizing YouTube Script with Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-black" />
                  <span>Generate YouTube Script</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Output / Script Results */}
        <div className="lg:col-span-7 space-y-5">
          {!generatedScript && !loading && (
            <div
              className="p-12 rounded-2xl border text-center flex flex-col items-center justify-center space-y-4"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div
                className="p-4 rounded-2xl border shadow-md"
                style={{
                  backgroundColor: 'var(--accent-subtle)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--accent-primary)',
                }}
              >
                <Clapperboard className="w-8 h-8" />
              </div>
              <div className="max-w-md space-y-1">
                <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  Enter a Topic to Generate Script
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  YT-AI engineers exact segment timestamps, word limits, and high-retention hooks strictly calibrated for YouTube Shorts, Reels, and TikTok.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center pt-2">
                <span className="text-[11px] px-2.5 py-1 rounded-full border" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
                  Exact 8s pacing
                </span>
                <span className="text-[11px] px-2.5 py-1 rounded-full border" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
                  Word-count calibrated
                </span>
                <span className="text-[11px] px-2.5 py-1 rounded-full border" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
                  1-Click Video Pipeline
                </span>
              </div>
            </div>
          )}

          {loading && (
            <div
              className="p-12 rounded-2xl border text-center flex flex-col items-center justify-center space-y-4 animate-pulse"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="p-4 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20">
                <Sparkles className="w-8 h-8 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  Generating YouTube Script with Gemini 3.8 Flash...
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Synthesizing hook, structuring narrative beats, and balancing word timings for {durationSeconds}s.
                </p>
              </div>
            </div>
          )}

          {generatedScript && !loading && (
            <div className="space-y-4">
              {/* Script Title & Metadata Toolbar */}
              <div
                className="p-4 rounded-2xl border space-y-3"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-red-400">
                      Suggested Video Title
                    </span>
                    <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                      {generatedScript.suggestedTitle || topic}
                    </h2>
                  </div>
                  <div className="flex items-center space-x-2 text-xs font-mono">
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {editableSegments.length} Segments
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      ~{generatedScript.estimatedTotalSeconds}s Total
                    </span>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleCopyAll}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all hover:bg-slate-800/30 cursor-pointer"
                    style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                  >
                    {copiedFull ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedFull ? 'Copied Full Script!' : 'Copy Script'}</span>
                  </button>

                  <button
                    onClick={handleDownload}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all hover:bg-slate-800/30 cursor-pointer"
                    style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download (.md)</span>
                  </button>

                  <button
                    onClick={handleSaveToSources}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all hover:bg-slate-800/30 cursor-pointer"
                    style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                  >
                    {savedToSourcesSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
                    <span>{savedToSourcesSuccess ? 'Saved to Sources!' : 'Save to Library'}</span>
                  </button>

                  <button
                    onClick={() => handleGenerateScript()}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all hover:bg-slate-800/30 cursor-pointer ml-auto"
                    style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Regenerate</span>
                  </button>
                </div>
              </div>

              {/* Segment Cards List */}
              <div className="space-y-3">
                {editableSegments.map((segment, idx) => {
                  const pacing = getPacingStatus(segment.wordCount, segment.estimatedDurationSeconds);
                  const isHook = segment.type.toUpperCase().includes('HOOK');
                  const isEnding = segment.type.toUpperCase().includes('ENDING');

                  return (
                    <div
                      key={segment.segmentNumber}
                      className="p-4 rounded-2xl border transition-all space-y-2.5"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: isHook ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-subtle)',
                      }}
                    >
                      {/* Segment Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              isHook
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : isEnding
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            }`}
                          >
                            {segment.type}
                          </span>
                          <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                            {segment.timestamp}
                          </span>
                        </div>

                        <div className="flex items-center space-x-3 text-xs">
                          <span className={`text-[11px] font-mono ${pacing.color}`}>
                            {pacing.label}
                          </span>
                          <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                            {segment.wordCount} words
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopySegment(segment.segmentNumber, segment.voiceover)}
                            className="p-1 rounded hover:bg-slate-800/40 text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="Copy segment voiceover"
                          >
                            {copiedSegmentId === segment.segmentNumber ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Editable Voiceover Textarea */}
                      <textarea
                        value={segment.voiceover}
                        onChange={(e) => handleSegmentVoiceoverChange(idx, e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition-all resize-y"
                        style={{
                          backgroundColor: 'var(--bg-base)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-primary)',
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* 1-Click Pipeline Transfer Hub */}
              <div
                className="p-5 rounded-2xl border space-y-3"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="flex items-center space-x-2 text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                  <ArrowRight className="w-4 h-4 text-red-500" />
                  <span>Send Script Directly to Production Pipeline:</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {onTransferToVideoPrompts && effectiveScript && (
                    <button
                      onClick={() => onTransferToVideoPrompts(effectiveScript, generatedScript.suggestedTitle || topic)}
                      className="p-2.5 rounded-xl border hover:border-red-500/40 text-left transition-all cursor-pointer flex flex-col justify-between space-y-1"
                      style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}
                    >
                      <Film className="w-4 h-4 text-purple-400" />
                      <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                        Video Prompts
                      </div>
                      <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        Google Flow & Veo
                      </div>
                    </button>
                  )}

                  {onTransferToSEOStudio && effectiveScript && (
                    <button
                      onClick={() => onTransferToSEOStudio(effectiveScript, generatedScript.suggestedTitle || topic, topic)}
                      className="p-2.5 rounded-xl border hover:border-red-500/40 text-left transition-all cursor-pointer flex flex-col justify-between space-y-1"
                      style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}
                    >
                      <Search className="w-4 h-4 text-emerald-400" />
                      <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                        SEO Studio
                      </div>
                      <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        Titles, Tags, Desc
                      </div>
                    </button>
                  )}

                  {onTransferToThumbnailStudio && effectiveScript && (
                    <button
                      onClick={() => onTransferToThumbnailStudio(effectiveScript, generatedScript.suggestedTitle || topic, topic)}
                      className="p-2.5 rounded-xl border hover:border-red-500/40 text-left transition-all cursor-pointer flex flex-col justify-between space-y-1"
                      style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}
                    >
                      <ImageIcon className="w-4 h-4 text-amber-400" />
                      <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                        Thumbnail Studio
                      </div>
                      <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        16:9 Concepts
                      </div>
                    </button>
                  )}

                  {onTransferToYTEditor && effectiveScript && (
                    <button
                      onClick={() => onTransferToYTEditor(effectiveScript, generatedScript.suggestedTitle || topic)}
                      className="p-2.5 rounded-xl border hover:border-red-500/40 text-left transition-all cursor-pointer flex flex-col justify-between space-y-1"
                      style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}
                    >
                      <Scissors className="w-4 h-4 text-pink-400" />
                      <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                        YT Editor
                      </div>
                      <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        Timeline Multi-track
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScriptGenerator;
