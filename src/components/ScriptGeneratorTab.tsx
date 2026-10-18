import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Clapperboard,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  AlertCircle,
  Clock,
  FileText,
  Languages,
  Layers,
  ChevronDown,
  Info,
  Sliders,
  KeyRound,
  ExternalLink,
  Film,
  ArrowRight,
  Search,
  Image as ImageIcon,
  Scissors,
} from 'lucide-react';
import { api, type GeneratedSegment, type ScriptGenerationResponse } from '../services/api.ts';
import { formatAIErrorMessage } from '../services/apiResponseHandler.ts';
import {
  type SourceItem,
  getSavedSources,
  subscribeSources,
} from '../services/sourceRepository.ts';
import { ScriptGenerator } from './ScriptGenerator.tsx';
import { useProject } from '../context/ProjectContext.tsx';
import { quotaManager, type PendingTaskData } from '../services/quotaManager.ts';
import { QuotaRecoveryBanner } from './common/QuotaRecoveryBanner.tsx';

const CONTENT_MODES = [
  { id: 'Professional News', label: 'Professional News', desc: 'Credible, neutral presenter; prioritizes main development, verified details, and context.' },
  { id: 'Breaking News', label: 'Breaking News', desc: 'Fast, urgent lead with confirmed facts; strictly avoids fabricated urgency or rumors.' },
  { id: 'Documentary', label: 'Documentary', desc: 'Cinematic, factual storytelling; provides deep context and historical significance.' },
  { id: 'Educational', label: 'Educational', desc: 'Simplifies complex concepts for broad understanding with clear logic.' },
  { id: 'Explainer', label: 'Explainer', desc: 'Answers what happened, how it works, and why it matters in structured sequence.' },
  { id: 'History', label: 'History', desc: 'Maintains chronological accuracy; separates established events from interpretations.' },
  { id: 'Science & Technology', label: 'Science & Technology', desc: 'Explains technical breakthroughs accurately without oversimplifying core science.' },
  { id: 'Business & Finance', label: 'Business & Finance', desc: 'Focuses on financial implications and markets without speculative investment promises.' },
  { id: 'Biography', label: 'Biography', desc: 'Highlights verified milestones, personal decisions, character, and lasting impact.' },
  { id: 'Storytelling', label: 'Storytelling', desc: 'Engaging narrative arc and transitions without inventing fictitious events as facts.' },
  { id: 'Mystery & Investigation', label: 'Mystery & Investigation', desc: 'Builds curiosity around documented evidence and unresolved questions ethically.' },
  { id: 'Motivational', label: 'Motivational', desc: 'Extracts inspiring lessons rooted firmly in verified source material.' },
];

const DURATIONS = [
  { seconds: 24, label: '24 seconds (3 segments)', segmentsText: '1 Hook • 1 Main Part • 1 Ending' },
  { seconds: 32, label: '32 seconds (4 segments)', segmentsText: '1 Hook • 2 Main Parts • 1 Ending' },
  { seconds: 40, label: '40 seconds (5 segments)', segmentsText: '1 Hook • 3 Main Parts • 1 Ending' },
  { seconds: 48, label: '48 seconds (6 segments)', segmentsText: '1 Hook • 4 Main Parts • 1 Ending' },
  { seconds: 56, label: '56 seconds (7 segments)', segmentsText: '1 Hook • 5 Main Parts • 1 Ending' },
  { seconds: 60, label: '60 seconds (8 segments)', segmentsText: '1 Hook • 6 Main Parts • 1 Ending (4s)' },
];

const LANGUAGES = [
  { id: 'Hindi', label: 'Hindi (हिंदी)', desc: 'Natural spoken Hindi in Devanagari script for short-form voice-over' },
  { id: 'Gujarati', label: 'Gujarati (ગુજરાતી)', desc: 'Fluent Gujarati script tailored for spoken narration' },
  { id: 'English', label: 'English', desc: 'Punchy, conversational English for global short-video audiences' },
  { id: 'Hinglish', label: 'Hinglish (Hindi in Latin script)', desc: 'Popular Indian conversational mixed Hindi-English' },
];

interface ScriptGeneratorTabProps {
  userId: string;
  initialSourceId?: string | null;
  onNavigateToSources?: () => void;
  onNavigateToConfig?: () => void;
  onTransferToVideoPrompts?: (script: ScriptGenerationResponse, sourceTitle?: string) => void;
  onTransferToSEOStudio?: (script: ScriptGenerationResponse, sourceTitle?: string, sourceArticle?: string) => void;
  onTransferToThumbnailStudio?: (script: ScriptGenerationResponse, sourceTitle?: string, sourceArticle?: string) => void;
  onTransferToYTEditor?: (script: ScriptGenerationResponse, sourceTitle?: string) => void;
}

export const ScriptGeneratorTab: React.FC<ScriptGeneratorTabProps> = ({
  userId,
  initialSourceId,
  onNavigateToSources,
  onNavigateToConfig,
  onTransferToVideoPrompts,
  onTransferToSEOStudio,
  onTransferToThumbnailStudio,
  onTransferToYTEditor,
}) => {
  const { activeProject, activeProfile, saveCurrentProject } = useProject();
  const [savedSources, setSavedSources] = useState<SourceItem[]>(() => getSavedSources(userId));
  const [scriptMode, setScriptMode] = useState<'topic' | 'source'>(() => {
    if (initialSourceId) return 'source';
    const existing = getSavedSources(userId);
    return existing.length > 0 ? 'source' : 'topic';
  });
  const [contentMode, setContentMode] = useState<string>('Professional News');
  const [durationSeconds, setDurationSeconds] = useState<number>(32);
  const [language, setLanguage] = useState<string>('Hindi');
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

  // Saved Sources state
  const [selectedSourceId, setSelectedSourceId] = useState<string>(() => {
    if (initialSourceId) return initialSourceId;
    const initialList = getSavedSources(userId);
    return initialList.length > 0 ? initialList[0].id : '';
  });
  const [sourceSearchQuery, setSourceSearchQuery] = useState<string>('');
  const [manualOverrideText, setManualOverrideText] = useState<string>('');
  const [isCustomEditing, setIsCustomEditing] = useState<boolean>(false);

  // Generated Script Output State (hydrated from activeProject if available)
  const [generatedScript, setGeneratedScript] = useState<ScriptGenerationResponse | null>(
    () => activeProject?.scriptData || null
  );
  const [editableSegments, setEditableSegments] = useState<GeneratedSegment[]>(
    () => activeProject?.scriptData?.segments || []
  );
  const [copiedSegmentId, setCopiedSegmentId] = useState<number | null>(null);
  const [copiedFull, setCopiedFull] = useState<boolean>(false);

  // Real-time synchronization of saved sources across all studio tabs
  useEffect(() => {
    const unsubscribe = subscribeSources(userId, (list) => {
      setSavedSources(list);

      if (initialSourceId && list.some((s) => s.id === initialSourceId)) {
        setSelectedSourceId(initialSourceId);
        setScriptMode('source');
      } else {
        setSelectedSourceId((prev) => {
          if (prev && list.some((s) => s.id === prev)) {
            return prev;
          }
          return list.length > 0 ? list[0].id : '';
        });
      }
    });

    return () => unsubscribe();
  }, [userId, initialSourceId]);

  // Selected source object
  const currentSelectedSource = savedSources.find((s) => s.id === selectedSourceId);

  // The actual text used for generation (either selected source or custom edited override)
  const effectiveSourceText = isCustomEditing
    ? manualOverrideText
    : currentSelectedSource?.text || '';

  // Update editable segments when new script arrives
  useEffect(() => {
    if (generatedScript) {
      setEditableSegments(generatedScript.segments);
    }
  }, [generatedScript]);

  // Word count helper for effective source input
  const sourceWordCount = effectiveSourceText.trim()
    ? effectiveSourceText.trim().split(/\s+/).filter(Boolean).length
    : 0;

  // Filtered sources based on search query
  const filteredSources = savedSources.filter((s) => {
    const q = sourceSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.title.toLowerCase().includes(q) ||
      s.text.toLowerCase().includes(q)
    );
  });

  // Handle source switch
  const handleSelectSource = (id: string) => {
    setSelectedSourceId(id);
    setIsCustomEditing(false);
    setManualOverrideText('');
    if (errorMessage) setErrorMessage(null);
  };

  // Generate Script
  const handleGenerateScript = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isGeneratingRef.current) return; // Prevent concurrent requests & rapid double clicks

    const trimmed = effectiveSourceText.trim();
    if (!trimmed) {
      setErrorMessage('Please select a saved source article or add one in the Sources tab.');
      return;
    }

    if (sourceWordCount > 60000) {
      setErrorMessage(
        `Source text is approximately ${sourceWordCount.toLocaleString()} words, which exceeds the supported input guideline. Please provide a shorter input or summary.`
      );
      return;
    }

    isGeneratingRef.current = true;
    setLoading(true);
    setErrorMessage(null);
    setStructuredError(null);
    setRetryStatus(null);
    setApiKeyMissing(false);

    try {
      const result = await api.generateScript({
        userId,
        sourceText: trimmed,
        contentMode,
        durationSeconds,
        language,
        onRetry: (info) => {
          setRetryStatus(
            `Model busy (${info.status || '503'}). Retrying attempt ${info.attempt} of ${info.maxRetries} (waiting ${Math.round(info.delayMs / 1000)}s)...`
          );
        },
      });

      const scriptWithMeta: ScriptGenerationResponse = {
        ...result,
        sourceId: currentSelectedSource?.id,
        sourceTitle: currentSelectedSource?.title || 'Saved Source',
        aspectRatio: activeProfile.aspectRatio,
      };

      setGeneratedScript(scriptWithMeta);
      setEditableSegments(result.segments);
      setRetryStatus(null);
      quotaManager.clearPendingTask();
      quotaManager.resetToNormal();
      // Auto-save generated script into current project context
      saveCurrentProject({ scriptData: scriptWithMeta }).catch((e) => console.warn('Could not sync script to project:', e));
    } catch (err: any) {
      const formatted = formatAIErrorMessage(err);
      setStructuredError(formatted);
      setErrorMessage(formatted.message);
      if (formatted.isAuth) {
        setApiKeyMissing(true);
      }
      quotaManager.handleError(err, {
        type: 'script',
        label: `Script from: ${currentSelectedSource?.title || 'Saved Source'}`,
        payload: {
          sourceText: trimmed,
          contentMode,
          durationSeconds,
          language,
          selectedSourceId,
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
    if (pending.payload?.sourceText) {
      handleGenerateScript();
    }
  };

  // Offline Demo Engine handler for exploring without API key
  const handleGenerateOfflineDemo = async () => {
    const trimmed = effectiveSourceText.trim();
    if (!trimmed) {
      setErrorMessage('Please select a saved source article or paste text.');
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    setStructuredError(null);
    try {
      const result = await api.generateScript({
        userId,
        sourceText: trimmed,
        contentMode,
        durationSeconds,
        language,
        allowOfflineDemo: true,
      });

      const scriptWithMeta: ScriptGenerationResponse = {
        ...result,
        sourceId: currentSelectedSource?.id,
        sourceTitle: currentSelectedSource?.title || 'Saved Source',
        aspectRatio: activeProfile.aspectRatio,
      };

      setGeneratedScript(scriptWithMeta);
      setEditableSegments(result.segments);
      quotaManager.clearPendingTask();
      quotaManager.resetToNormal();
      saveCurrentProject({ scriptData: scriptWithMeta }).catch((e) => console.warn('Could not sync script to project:', e));
    } catch (err: any) {
      setErrorMessage(err?.message || 'Offline demo generation failed.');
    } finally {
      setLoading(false);
    }
  };

  // Update a segment's voiceover manually in the editor
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
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedSegmentId(segmentNumber);
      setTimeout(() => setCopiedSegmentId(null), 2000);
    }
  };

  // Copy full script
  const handleCopyFullScript = async () => {
    if (!editableSegments || editableSegments.length === 0) return;

    const fullScript = editableSegments
      .map((s) => `[${s.timestamp}] ${s.type.toUpperCase()}\n${s.voiceover}\n`)
      .join('\n');

    const sourceTitleStr = currentSelectedSource?.title ? `Source: ${currentSelectedSource.title}\n` : '';
    const header = `=== SHORT VIDEO SCRIPT ===\n${sourceTitleStr}Content Mode: ${contentMode}\nDuration: ${durationSeconds}s\nLanguage: ${language}\nSegments: ${editableSegments.length}\n\n`;
    const completeText = header + fullScript;

    try {
      await navigator.clipboard.writeText(completeText);
      setCopiedFull(true);
      setTimeout(() => setCopiedFull(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = completeText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedFull(true);
      setTimeout(() => setCopiedFull(false), 2000);
    }
  };

  // Transfer script to Video Prompt Builder
  const handleProceedToVideoPrompts = () => {
    if (!generatedScript || editableSegments.length === 0) return;
    const currentScriptData: ScriptGenerationResponse = {
      ...generatedScript,
      segments: editableSegments,
      sourceId: currentSelectedSource?.id || generatedScript.sourceId,
      sourceTitle: currentSelectedSource?.title || generatedScript.sourceTitle,
      aspectRatio: activeProfile.aspectRatio,
    };
    const title = currentSelectedSource?.title || generatedScript.sourceTitle || 'Generated Script Project';
    saveCurrentProject({ scriptData: currentScriptData }).catch(() => {});
    onTransferToVideoPrompts?.(currentScriptData, title);
  };

  // Transfer script to YouTube SEO Studio
  const handleProceedToSEOStudio = () => {
    if (!generatedScript || editableSegments.length === 0) return;
    const currentScriptData: ScriptGenerationResponse = {
      ...generatedScript,
      segments: editableSegments,
      sourceId: currentSelectedSource?.id || generatedScript.sourceId,
      sourceTitle: currentSelectedSource?.title || generatedScript.sourceTitle,
      aspectRatio: activeProfile.aspectRatio,
    };
    const title = currentSelectedSource?.title || generatedScript.sourceTitle || 'Generated Script Project';
    const article = currentSelectedSource?.text || '';
    saveCurrentProject({ scriptData: currentScriptData }).catch(() => {});
    onTransferToSEOStudio?.(currentScriptData, title, article);
  };

  // Transfer script to YouTube Thumbnail Studio
  const handleProceedToThumbnailStudio = () => {
    if (!generatedScript || editableSegments.length === 0) return;
    const currentScriptData: ScriptGenerationResponse = {
      ...generatedScript,
      segments: editableSegments,
      sourceId: currentSelectedSource?.id || generatedScript.sourceId,
      sourceTitle: currentSelectedSource?.title || generatedScript.sourceTitle,
      aspectRatio: activeProfile.aspectRatio,
    };
    const title = currentSelectedSource?.title || generatedScript.sourceTitle || 'Generated Script Project';
    const article = currentSelectedSource?.text || '';
    saveCurrentProject({ scriptData: currentScriptData }).catch(() => {});
    onTransferToThumbnailStudio?.(currentScriptData, title, article);
  };

  // Transfer script to YT Editor Studio
  const handleProceedToYTEditor = () => {
    if (!generatedScript || editableSegments.length === 0) return;
    const currentScriptData: ScriptGenerationResponse = {
      ...generatedScript,
      segments: editableSegments,
      sourceId: currentSelectedSource?.id || generatedScript.sourceId,
      sourceTitle: currentSelectedSource?.title || generatedScript.sourceTitle,
      aspectRatio: activeProfile.aspectRatio,
    };
    const title = currentSelectedSource?.title || generatedScript.sourceTitle || 'Generated Script Project';
    saveCurrentProject({ scriptData: currentScriptData }).catch(() => {});
    onTransferToYTEditor?.(currentScriptData, title);
  };

  const selectedModeObj = CONTENT_MODES.find((m) => m.id === contentMode) || CONTENT_MODES[0];
  const selectedDurObj = DURATIONS.find((d) => d.seconds === durationSeconds) || DURATIONS[1];
  const selectedLangObj = LANGUAGES.find((l) => l.id === language) || LANGUAGES[0];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center space-x-3.5">
          <div
            className="p-3 rounded-xl text-black shadow-md flex-shrink-0"
            style={{
              backgroundColor: 'var(--accent-primary)',
              boxShadow: '0 0 16px -2px var(--accent-glow)',
            }}
          >
            <Clapperboard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                Source-to-Video Script Generator
              </h2>
              <span
                className="text-[11px] font-mono px-2 py-0.5 rounded-full border"
                style={{
                  backgroundColor: 'var(--accent-subtle)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--accent-text)',
                }}
              >
                gemini-3.8-flash
              </span>
              <span
                className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border"
                style={{
                  backgroundColor: 'rgba(212, 175, 55, 0.15)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--accent-primary)',
                }}
              >
                {activeProfile.aspectRatio} · {activeProfile.orientation.toUpperCase()}
              </span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Transform source research or topics into timed narration calibrated for {activeProfile.aspectRatio} {activeProfile.targetPlatform}.
            </p>
          </div>
        </div>

        {onNavigateToSources && (
          <button
            type="button"
            onClick={onNavigateToSources}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center space-x-1.5 transition-colors self-start sm:self-auto cursor-pointer hover:bg-white/5"
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          >
            <FileText className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
            <span>Manage Sources ({savedSources.length})</span>
          </button>
        )}
      </div>

      {/* Quota Recovery & Rate Limit Banner */}
      <QuotaRecoveryBanner
        onRetry={handleResumePendingTask}
        onNavigateToConfig={onNavigateToConfig}
        onUseOfflineDemo={handleGenerateOfflineDemo}
        isGenerating={loading}
      />

      {/* Mode Switcher Tabs */}
      <div className="flex items-center space-x-2 border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
        <button
          type="button"
          onClick={() => setScriptMode('topic')}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
          style={{
            backgroundColor: scriptMode === 'topic' ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
            color: scriptMode === 'topic' ? '#050506' : 'var(--text-secondary)',
            border: '1px solid',
            borderColor: scriptMode === 'topic' ? 'var(--accent-primary)' : 'var(--border-subtle)',
            boxShadow: scriptMode === 'topic' ? '0 0 16px -3px var(--accent-glow)' : 'none',
          }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Topic-Based Script Generator</span>
        </button>
        <button
          type="button"
          onClick={() => setScriptMode('source')}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
          style={{
            backgroundColor: scriptMode === 'source' ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
            color: scriptMode === 'source' ? '#050506' : 'var(--text-secondary)',
            border: '1px solid',
            borderColor: scriptMode === 'source' ? 'var(--accent-primary)' : 'var(--border-subtle)',
            boxShadow: scriptMode === 'source' ? '0 0 16px -3px var(--accent-glow)' : 'none',
          }}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Source Article Library ({savedSources.length})</span>
        </button>
      </div>

      {scriptMode === 'topic' ? (
        <ScriptGenerator
          userId={userId}
          onNavigateToConfig={onNavigateToConfig}
          onNavigateToSources={onNavigateToSources}
          onTransferToVideoPrompts={onTransferToVideoPrompts}
          onTransferToSEOStudio={onTransferToSEOStudio}
          onTransferToThumbnailStudio={onTransferToThumbnailStudio}
          onTransferToYTEditor={onTransferToYTEditor}
        />
      ) : (
        <>
          {/* Input Configuration Grid */}
          <div
        className="rounded-2xl p-6 border shadow-xl backdrop-blur-md space-y-6"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        {/* Row 1: Content Mode, Duration, Language Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Content Mode */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold flex items-center space-x-1.5" style={{ color: 'var(--text-primary)' }}>
              <Sliders className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
              <span>Content Mode</span>
            </label>
            <div className="relative">
              <select
                value={contentMode}
                onChange={(e) => setContentMode(e.target.value)}
                disabled={loading}
                className="w-full appearance-none pl-3.5 pr-9 py-2.5 rounded-xl text-xs font-medium border focus:outline-none focus:ring-2 cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                {CONTENT_MODES.map((mode) => (
                  <option key={mode.id} value={mode.id}>
                    {mode.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="text-[11px] leading-normal line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
              {selectedModeObj.desc}
            </p>
          </div>

          {/* 2. Video Duration */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold flex items-center space-x-1.5" style={{ color: 'var(--text-primary)' }}>
              <Clock className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
              <span>Video Duration</span>
            </label>
            <div className="relative">
              <select
                value={durationSeconds}
                onChange={(e) => setDurationSeconds(parseInt(e.target.value, 10))}
                disabled={loading}
                className="w-full appearance-none pl-3.5 pr-9 py-2.5 rounded-xl text-xs font-medium border focus:outline-none focus:ring-2 cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                {DURATIONS.map((dur) => (
                  <option key={dur.seconds} value={dur.seconds}>
                    {dur.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="text-[11px] leading-normal" style={{ color: 'var(--text-secondary)' }}>
              {selectedDurObj.segmentsText}
            </p>
          </div>

          {/* 3. Output Language */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold flex items-center space-x-1.5" style={{ color: 'var(--text-primary)' }}>
              <Languages className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
              <span>Output Language</span>
            </label>
            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled={loading}
                className="w-full appearance-none pl-3.5 pr-9 py-2.5 rounded-xl text-xs font-medium border focus:outline-none focus:ring-2 cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="text-[11px] leading-normal" style={{ color: 'var(--text-secondary)' }}>
              {selectedLangObj.desc}
            </p>
          </div>
        </div>

        {/* Row 2: Saved Source Selector & Search Panel */}
        <div className="space-y-3 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-semibold flex items-center space-x-1.5" style={{ color: 'var(--text-primary)' }}>
              <FileText className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              <span>Select Saved Source Article</span>
              <span className="text-[11px] font-normal" style={{ color: 'var(--text-muted)' }}>
                (No re-pasting required)
              </span>
            </label>

            {onNavigateToSources && (
              <button
                type="button"
                onClick={onNavigateToSources}
                className="text-xs font-medium hover:underline flex items-center space-x-1"
                style={{ color: 'var(--accent-text)' }}
              >
                <span>Add More in Sources Tab</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>

          {savedSources.length === 0 ? (
            /* Empty State: Prompt user to add sources */
            <div
              className="p-6 rounded-xl border text-center space-y-3"
              style={{
                backgroundColor: 'var(--bg-base)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div
                className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center border"
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-muted)',
                }}
              >
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  No saved sources found
                </h4>
                <p className="text-xs max-w-md mx-auto mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Add articles, news, notes, or research once in the Sources tab, and they will immediately be selectable here for script generation.
                </p>
              </div>
              {onNavigateToSources && (
                <button
                  type="button"
                  onClick={onNavigateToSources}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-black shadow-md inline-flex items-center space-x-1.5 cursor-pointer jarvis-gold-btn"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Open Sources Tab to Add Content</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Dropdown with search filter */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2 relative">
                  <select
                    value={selectedSourceId}
                    onChange={(e) => handleSelectSource(e.target.value)}
                    disabled={loading}
                    className="w-full appearance-none pl-3.5 pr-9 py-2.5 rounded-xl text-xs font-medium border focus:outline-none focus:ring-2 cursor-pointer truncate"
                    style={{
                      backgroundColor: 'var(--bg-base)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {filteredSources.map((s, idx) => (
                      <option key={s.id} value={s.id}>
                        #{savedSources.length - idx}: {s.title} ({s.text.length} chars)
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                </div>

                <div>
                  <input
                    type="text"
                    value={sourceSearchQuery}
                    onChange={(e) => setSourceSearchQuery(e.target.value)}
                    placeholder="Search saved sources..."
                    className="w-full px-3 py-2.5 rounded-xl text-xs font-medium border focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: 'var(--bg-base)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>

              {/* Selected Source Content Preview Card */}
              {currentSelectedSource && (
                <div
                  className="rounded-xl p-4 border space-y-2.5"
                  style={{
                    backgroundColor: 'var(--bg-base)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div className="flex items-center justify-between text-xs pb-1 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                        {currentSelectedSource.title}
                      </span>
                      <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        • {new Date(currentSelectedSource.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!isCustomEditing) {
                            setManualOverrideText(currentSelectedSource.text);
                          }
                          setIsCustomEditing(!isCustomEditing);
                        }}
                        className="text-[11px] font-medium hover:underline cursor-pointer"
                        style={{ color: 'var(--accent-text)' }}
                      >
                        {isCustomEditing ? 'Revert to Original' : 'Tweak for this script'}
                      </button>
                    </div>
                  </div>

                  {/* Textarea or Preview */}
                  {isCustomEditing ? (
                    <div>
                      <textarea
                        value={manualOverrideText}
                        onChange={(e) => setManualOverrideText(e.target.value)}
                        rows={6}
                        className="w-full p-3 rounded-lg text-xs font-sans border focus:outline-none focus:ring-2 resize-y"
                        style={{
                          backgroundColor: 'var(--bg-surface-elevated)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-primary)',
                        }}
                      />
                      <p className="text-[10px] mt-1 text-amber-400">
                        * Custom tweak mode active. This edit will only apply to this generation and does not overwrite your saved source in the Sources tab.
                      </p>
                    </div>
                  ) : (
                    <div
                      className="max-h-44 overflow-y-auto p-3 rounded-lg border text-xs font-sans whitespace-pre-wrap break-words leading-relaxed"
                      style={{
                        backgroundColor: 'var(--bg-surface-elevated)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {currentSelectedSource.text}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] pt-1" style={{ color: 'var(--text-muted)' }}>
                    <span>Preserves original paragraphs and context</span>
                    <span>{sourceWordCount.toLocaleString()} words • {effectiveSourceText.length.toLocaleString()} characters</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Live Retry Status Banner */}
        {loading && retryStatus && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center space-x-3 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-400 flex-shrink-0" />
            <div className="flex-1">
              <span className="font-semibold block">Automatic Retry in Progress</span>
              <p className="text-[11px] text-amber-200/90 leading-relaxed">{retryStatus}</p>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {(structuredError || errorMessage) && !loading && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-semibold text-sm">
                  {structuredError?.title || 'Generation Error'}
                </span>
                {structuredError?.code && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-200 border border-rose-500/30">
                    {structuredError.code}
                  </span>
                )}
              </div>
              <p className="leading-relaxed">{structuredError?.message || errorMessage}</p>
              
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {structuredError?.isRetryable !== false && (
                  <button
                    type="button"
                    onClick={() => handleGenerateScript()}
                    disabled={loading || !effectiveSourceText.trim()}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-black text-xs font-bold shadow transition-all cursor-pointer jarvis-gold-btn disabled:opacity-50"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Now</span>
                  </button>
                )}

                {apiKeyMissing && onNavigateToConfig && (
                  <button
                    type="button"
                    onClick={onNavigateToConfig}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-black text-xs font-bold shadow transition-colors cursor-pointer jarvis-gold-btn"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Go to Gemini API Configuration</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={handleGenerateScript}
            disabled={loading || !effectiveSourceText.trim()}
            className="px-6 py-3 rounded-xl text-black text-xs font-bold shadow-lg flex items-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer jarvis-gold-btn"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-black" />
                <span>
                  {retryStatus ? retryStatus : `Generating Script with gemini-3.8-flash...`}
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-black" />
                <span>Generate Script ({durationSeconds}s)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Script Editor Section */}
      {generatedScript && editableSegments.length > 0 && (
        <div className="space-y-6">
          {/* Header Summary & Bulk Actions */}
          <div
            className="rounded-2xl p-5 shadow-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-md"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                  Script Output
                </span>
                <span
                  className="px-2 py-0.5 rounded-full text-[11px] font-semibold border"
                  style={{
                    backgroundColor: 'var(--accent-subtle)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--accent-text)',
                  }}
                >
                  {contentMode}
                </span>
                <span
                  className="px-2 py-0.5 rounded-full text-[11px] font-semibold border"
                  style={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {durationSeconds}s
                </span>
                <span
                  className="px-2 py-0.5 rounded-full text-[11px] font-semibold border"
                  style={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {language}
                </span>
              </div>
              <div className="text-xs flex items-center space-x-3 pt-1" style={{ color: 'var(--text-muted)' }}>
                <span>Total Segments: <strong style={{ color: 'var(--text-primary)' }}>{editableSegments.length}</strong></span>
                <span>•</span>
                <span>Target Runtime: <strong style={{ color: 'var(--text-primary)' }}>{durationSeconds}s</strong></span>
                <span>•</span>
                <span>Calculated Spoken Est: <strong style={{ color: 'var(--text-primary)' }}>~{(editableSegments.reduce((a, b) => a + b.wordCount, 0) / 2.1).toFixed(1)}s</strong></span>
              </div>
            </div>

            {/* Bulk Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Generate Video Prompts - Primary Prominent Action */}
              <button
                type="button"
                onClick={handleProceedToVideoPrompts}
                className="px-4 py-2.5 rounded-xl text-white text-xs font-bold shadow-lg flex items-center space-x-2 transition-all transform hover:scale-[1.02] cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, var(--accent-primary) 0%, #7c3aed 100%)',
                  boxShadow: '0 4px 14px var(--accent-glow, rgba(99, 102, 241, 0.35))',
                }}
                title="Transfer structured script segments and generate Google Flow prompts"
              >
                <Film className="w-4 h-4 text-white" />
                <span>Generate Video Prompts</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/20 font-mono font-semibold">
                  Flow
                </span>
              </button>

              {/* Generate YouTube SEO - Primary Prominent Action */}
              <button
                type="button"
                onClick={handleProceedToSEOStudio}
                className="px-4 py-2.5 rounded-xl text-white text-xs font-bold shadow-lg flex items-center space-x-2 transition-all transform hover:scale-[1.02] cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
                }}
                title="Transfer structured script segments and source to YouTube SEO Studio"
              >
                <Search className="w-4 h-4 text-white" />
                <span>Generate YouTube SEO</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/20 font-mono font-semibold">
                  SEO
                </span>
              </button>

              {/* Generate Thumbnails - Primary Prominent Action */}
              <button
                type="button"
                onClick={handleProceedToThumbnailStudio}
                className="px-4 py-2.5 rounded-xl text-white text-xs font-bold shadow-lg flex items-center space-x-2 transition-all transform hover:scale-[1.02] cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
                  boxShadow: '0 4px 14px rgba(14, 165, 233, 0.35)',
                }}
                title="Transfer story to YouTube Thumbnail Studio for photorealistic thumbnail generation"
              >
                <ImageIcon className="w-4 h-4 text-white" />
                <span>Generate Thumbnails</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/20 font-mono font-semibold">
                  Studio
                </span>
              </button>

              {/* Open in YT Editor - Primary Studio Action */}
              <button
                type="button"
                onClick={handleProceedToYTEditor}
                className="px-4 py-2.5 rounded-xl text-white text-xs font-bold shadow-lg flex items-center space-x-2 transition-all transform hover:scale-[1.02] cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                  boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35)',
                }}
                title="Convert script segments into multi-track timeline in YT Editor"
              >
                <Scissors className="w-4 h-4 text-white" />
                <span>Open in YT Editor</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/20 font-mono font-semibold">
                  PRO
                </span>
              </button>

              <button
                type="button"
                onClick={handleCopyFullScript}
                className="px-3.5 py-2.5 rounded-xl text-black text-xs font-bold shadow-md flex items-center space-x-1.5 transition-colors cursor-pointer jarvis-gold-btn"
              >
                {copiedFull ? <Check className="w-4 h-4 text-black" /> : <Copy className="w-4 h-4 text-black" />}
                <span>{copiedFull ? 'Full Script Copied!' : 'Copy Full Script'}</span>
              </button>

              <button
                type="button"
                onClick={handleGenerateScript}
                disabled={loading}
                className="px-3.5 py-2.5 rounded-xl text-xs font-medium border flex items-center space-x-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} style={{ color: 'var(--text-muted)' }} />
                <span>Regenerate Script</span>
              </button>
            </div>
          </div>

          {/* Segment Cards List */}
          <div className="space-y-4">
            {editableSegments.map((seg, idx) => {
              const isHook = seg.type.includes('HOOK');
              const isEnding = seg.type.includes('ENDING');
              const isCopied = copiedSegmentId === seg.segmentNumber;

              return (
                <div
                  key={seg.segmentNumber}
                  className="rounded-2xl p-5 shadow-xl border transition-all"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  {/* Segment Card Header */}
                  <div
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b text-xs"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span
                        className="font-mono text-xs font-bold px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: 'var(--bg-surface-elevated)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        #{seg.segmentNumber}
                      </span>
                      <span
                        className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-lg border"
                        style={{
                          backgroundColor: 'var(--bg-base)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {seg.timestamp}
                      </span>
                      <span
                        className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border"
                        style={{
                          backgroundColor: isHook
                            ? 'rgba(168, 85, 247, 0.15)'
                            : isEnding
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(56, 189, 248, 0.15)',
                          borderColor: isHook
                            ? 'rgba(168, 85, 247, 0.4)'
                            : isEnding
                            ? 'rgba(16, 185, 129, 0.4)'
                            : 'rgba(56, 189, 248, 0.4)',
                          color: isHook
                            ? '#c084fc'
                            : isEnding
                            ? '#34d399'
                            : '#38bdf8',
                        }}
                      >
                        {seg.type}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span>{seg.wordCount} words</span>
                      <span>•</span>
                      <span>~{seg.estimatedDurationSeconds}s spoken</span>
                      <button
                        type="button"
                        onClick={() => handleCopySegment(seg.segmentNumber, seg.voiceover)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center space-x-1.5 transition-colors cursor-pointer ml-1"
                        style={{
                          backgroundColor: isCopied ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-surface-elevated)',
                          borderColor: isCopied ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)',
                          color: isCopied ? '#34d399' : 'var(--text-secondary)',
                        }}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                            <span>Copy Segment</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Editable Segment Textarea */}
                  <div className="relative">
                    <textarea
                      value={seg.voiceover}
                      onChange={(e) => handleSegmentVoiceoverChange(idx, e.target.value)}
                      rows={3}
                      className="w-full p-3.5 rounded-xl text-sm font-sans border focus:outline-none focus:ring-2 leading-relaxed"
                      style={{
                        backgroundColor: 'var(--bg-base)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Call to Action: Next Step to Video Prompts */}
          <div
            className="rounded-2xl p-6 border shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6"
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Film className="w-5 h-5 text-indigo-400" />
                <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  Ready to visualize? Generate Google Flow Prompts
                </h4>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Transfer all {editableSegments.length} script segments directly into Video Prompt Builder to generate camera-directed, cinematic prompts.
              </p>
            </div>

            <button
              type="button"
              onClick={handleProceedToVideoPrompts}
              className="px-5 py-3 rounded-xl text-white text-xs font-bold shadow-lg flex items-center justify-center space-x-2 transition-all hover:opacity-95 cursor-pointer flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, #7c3aed 100%)',
              }}
            >
              <Film className="w-4 h-4" />
              <span>Generate Video Prompts</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
