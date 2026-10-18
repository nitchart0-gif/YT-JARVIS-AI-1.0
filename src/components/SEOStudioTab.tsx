import React, { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Edit3,
  Download,
  AlertCircle,
  FileText,
  Clock,
  ChevronDown,
  Layers,
  CheckCircle2,
  X,
  Sliders,
  ExternalLink,
  ShieldCheck,
  HelpCircle,
  Eye,
  MessageSquare,
  Image as ImageIcon,
  Tag,
  Hash,
  ListChecks,
  AlertTriangle,
  Compass,
  ArrowRight,
  Maximize2,
  Trash2,
  Info,
} from 'lucide-react';
import {
  api,
  type YouTubeSEOPackage,
  type YouTubeTitleOption,
  type KeywordItem,
  type ThumbnailConcept,
  type ScriptGenerationResponse,
} from '../services/api.ts';
import {
  type SourceItem,
  getSavedSources,
  subscribeSources,
} from '../services/sourceRepository.ts';
import { useProject } from '../context/ProjectContext.tsx';

interface SEOStudioTabProps {
  userId: string;
  transferredScript?: ScriptGenerationResponse | null;
  transferredSourceTitle?: string;
  transferredSourceArticle?: string;
  onNavigateToScripts?: () => void;
  onNavigateToSources?: () => void;
  onTransferToThumbnailStudio?: (params: { sourceTitle: string; sourceArticle: string; script?: ScriptGenerationResponse | null; concept?: any }) => void;
}

export const SEOStudioTab: React.FC<SEOStudioTabProps> = ({
  userId,
  transferredScript,
  transferredSourceTitle,
  transferredSourceArticle,
  onNavigateToScripts,
  onNavigateToSources,
  onTransferToThumbnailStudio,
}) => {
  // Input and Context State
  const [savedSources, setSavedSources] = useState<SourceItem[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string>('transferred');
  const [customTitle, setCustomTitle] = useState<string>(transferredSourceTitle || '');
  const [customText, setCustomText] = useState<string>(
    transferredScript?.segments?.map((s) => s.voiceover).join('\n') || transferredSourceArticle || ''
  );

  // Global Production Profile Hook
  const { activeProfile, switchAspectRatio } = useProject();

  // Settings State: Calibrated based on project aspect ratio (9:16 Shorts vs 16:9 Long-Form)
  const [videoFormat, setVideoFormat] = useState<'shorts' | 'long-form'>(
    activeProfile?.aspectRatio === '16:9' ? 'long-form' : 'shorts'
  );
  const [selectedLanguage, setSelectedLanguage] = useState<string>('auto');

  useEffect(() => {
    if (activeProfile?.aspectRatio) {
      setVideoFormat(activeProfile.aspectRatio === '16:9' ? 'long-form' : 'shorts');
    }
  }, [activeProfile?.aspectRatio]);

  // Generation & Status State
  const [loading, setLoading] = useState<boolean>(false);
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // The active SEO Package
  const [seoPackage, setSeoPackage] = useState<YouTubeSEOPackage | null>(null);

  // Copy Feedback States
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);

  // Title Selection & Edit State
  const [activeTitleIndex, setActiveTitleIndex] = useState<number>(4); // default best balanced
  const [editingTitleIndex, setEditingTitleIndex] = useState<number | null>(null);
  const [tempTitleText, setTempTitleText] = useState<string>('');

  // Description Edit State
  const [isEditingDescription, setIsEditingDescription] = useState<boolean>(false);
  const [editedDescriptionText, setEditedDescriptionText] = useState<string>('');

  // Tags Edit State
  const [isEditingTags, setIsEditingTags] = useState<boolean>(false);
  const [editedTagsText, setEditedTagsText] = useState<string>('');

  // Pinned Comment Edit State
  const [isEditingComment, setIsEditingComment] = useState<boolean>(false);
  const [editedCommentText, setEditedCommentText] = useState<string>('');

  // Thumbnail Edit State
  const [editingThumbnailIndex, setEditingThumbnailIndex] = useState<number | null>(null);
  const [editedThumbTitle, setEditedThumbTitle] = useState<string>('');
  const [editedThumbSubject, setEditedThumbSubject] = useState<string>('');
  const [editedThumbText, setEditedThumbText] = useState<string>('');

  // Keyword Category Filter
  const [activeKeywordTab, setActiveKeywordTab] = useState<'all' | 'primary' | 'secondary' | 'longTail' | 'questions' | 'hindi' | 'hinglish' | 'entities'>('all');

  // Interactive Checklist State
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({
    titleRelevance: true,
    descriptionAccuracy: true,
    primaryKeywordIncluded: true,
    tagsUnder500: true,
    relevantHashtags: true,
    thumbnailClarity: true,
    correctLanguageAudience: true,
    factualVerificationDone: true,
    syntheticMediaDisclosure: true,
  });

  const storageKey = `workspace_portal_seo_${userId}`;

  // Load saved sources from shared source repository
  useEffect(() => {
    const unsubscribe = subscribeSources(userId, (sources) => {
      setSavedSources(sources);
    });
    return () => unsubscribe();
  }, [userId]);

  // Load cached SEO package or respond to transferred script
  useEffect(() => {
    try {
      const cached = localStorage.getItem(storageKey);
      if (cached && !transferredScript) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.titles) {
          setSeoPackage(parsed);
          setActiveTitleIndex(parsed.titles.recommendedIndex ?? 4);
          if (parsed.checklist) setChecklistState(parsed.checklist);
        }
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  // When transferred script arrives, auto-generate if no package or if new transfer
  useEffect(() => {
    if (transferredScript) {
      const combinedVoiceover = transferredScript.segments?.map((s) => s.voiceover).join('\n') || '';
      const title = transferredSourceTitle || `${transferredScript.contentMode} Video`;
      setCustomTitle(title);
      setCustomText(combinedVoiceover);
      setSelectedSourceId('transferred');

      // Auto-generate fresh SEO package for transferred script
      handleGenerateFullPackage({
        sourceTitle: title,
        scriptText: combinedVoiceover,
        scriptSegments: transferredScript.segments,
        sourceText: transferredSourceArticle || '',
        contentMode: transferredScript.contentMode,
        language: transferredScript.language,
      });
    }
  }, [transferredScript]);

  // Persist SEO package to localStorage
  useEffect(() => {
    if (seoPackage) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(seoPackage));
      } catch {
        // ignore
      }
    }
  }, [seoPackage, storageKey]);

  // Copy helper
  const copyToClipboard = async (text: string, sectionId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(sectionId);
      setTimeout(() => setCopiedSection(null), 2200);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedSection(sectionId);
      setTimeout(() => setCopiedSection(null), 2200);
    }
  };

  // Switch Source Handler
  const handleSelectSource = (sourceId: string) => {
    setSelectedSourceId(sourceId);
    if (sourceId === 'transferred' && transferredScript) {
      const combined = transferredScript.segments?.map((s) => s.voiceover).join('\n') || '';
      setCustomTitle(transferredSourceTitle || 'Transferred Script');
      setCustomText(combined);
    } else {
      const found = savedSources.find((s) => s.id === sourceId);
      if (found) {
        setCustomTitle(found.title);
        setCustomText(found.text);
      }
    }
  };

  // Generate Full Package
  const handleGenerateFullPackage = async (overrideParams?: {
    sourceTitle?: string;
    scriptText?: string;
    scriptSegments?: any[];
    sourceText?: string;
    contentMode?: string;
    language?: string;
  }) => {
    const titleToUse = overrideParams?.sourceTitle || customTitle || 'Untitled Video';
    const textToUse = overrideParams?.scriptText || customText || '';

    if (!textToUse.trim()) {
      setErrorMessage('Please provide script dialogue or select a source article to generate YouTube SEO.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await api.generateYouTubeSEO({
        userId,
        sourceTitle: titleToUse,
        scriptText: textToUse,
        scriptSegments: overrideParams?.scriptSegments,
        sourceText: overrideParams?.sourceText || (selectedSourceId !== 'transferred' ? customText : transferredSourceArticle),
        contentMode: overrideParams?.contentMode || transferredScript?.contentMode || 'Professional News',
        videoFormat,
        language: overrideParams?.language || selectedLanguage,
      });

      setSeoPackage(result);
      setActiveTitleIndex(result.titles.recommendedIndex ?? 4);
      if (result.checklist) setChecklistState(result.checklist);
      setSuccessMessage('Complete YouTube SEO package generated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to generate YouTube SEO package.');
    } finally {
      setLoading(false);
    }
  };

  // Regenerate an Individual Section while strictly preserving user edits in all other sections
  const handleRegenerateSection = async (
    sectionKey: 'titles' | 'description' | 'keywords' | 'tags' | 'hashtags' | 'thumbnails' | 'pinnedComment'
  ) => {
    if (!seoPackage) return;
    setRegeneratingSection(sectionKey);
    setErrorMessage(null);

    try {
      const res = await api.regenerateSEOSection({
        userId,
        section: sectionKey,
        sourceTitle: seoPackage.sourceTitle || customTitle,
        scriptText: customText,
        sourceText: transferredSourceArticle || customText,
        videoFormat,
        language: selectedLanguage,
        currentSeoPackage: seoPackage,
      });

      setSeoPackage((prev) => {
        if (!prev) return null;
        if (sectionKey === 'titles') {
          return { ...prev, titles: res.data };
        } else if (sectionKey === 'description') {
          return { ...prev, description: res.data };
        } else if (sectionKey === 'keywords') {
          return { ...prev, keywords: res.data };
        } else if (sectionKey === 'tags') {
          return { ...prev, tags: res.data };
        } else if (sectionKey === 'hashtags') {
          return { ...prev, hashtags: res.data };
        } else if (sectionKey === 'thumbnails') {
          return { ...prev, thumbnailConcepts: res.data };
        } else if (sectionKey === 'pinnedComment') {
          return { ...prev, pinnedComment: res.data };
        }
        return prev;
      });

      setSuccessMessage(`Regenerated ${sectionKey} section! Other sections preserved.`);
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (err: any) {
      setErrorMessage(`Failed to regenerate ${sectionKey}: ${err?.message || 'Unknown error'}`);
    } finally {
      setRegeneratingSection(null);
    }
  };

  // Save Title Edit
  const handleSaveTitleEdit = (index: number) => {
    if (!seoPackage || !tempTitleText.trim()) return;
    const updatedOptions = [...seoPackage.titles.options];
    updatedOptions[index] = {
      ...updatedOptions[index],
      title: tempTitleText.trim(),
      charCount: tempTitleText.trim().length,
    };
    setSeoPackage({
      ...seoPackage,
      titles: {
        ...seoPackage.titles,
        options: updatedOptions,
      },
    });
    setEditingTitleIndex(null);
  };

  // Save Description Edit
  const handleSaveDescriptionEdit = () => {
    if (!seoPackage) return;
    setSeoPackage({
      ...seoPackage,
      description: {
        ...seoPackage.description,
        text: editedDescriptionText,
      },
    });
    setIsEditingDescription(false);
  };

  // Save Tags Edit with strict <= 500 characters calculation
  const handleSaveTagsEdit = () => {
    if (!seoPackage) return;
    const cleanList = editedTagsText
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const raw = cleanList.join(', ');
    const charCount = raw.length;
    const isValid = charCount <= 500;

    setSeoPackage({
      ...seoPackage,
      tags: {
        ...seoPackage.tags,
        tagList: cleanList,
        rawCommaSeparated: raw,
        characterCount: charCount,
        isValidLimit: isValid,
      },
    });
    setIsEditingTags(false);
  };

  // Auto-Trim Tags to 500 characters
  const handleTrimTagsTo500 = () => {
    if (!seoPackage) return;
    const tagsArr = seoPackage.tags.tagList;
    const validTags: string[] = [];
    let currentString = '';

    for (const tag of tagsArr) {
      const test = currentString ? `${currentString}, ${tag}` : tag;
      if (test.length <= 500) {
        validTags.push(tag);
        currentString = test;
      } else {
        break;
      }
    }

    setSeoPackage({
      ...seoPackage,
      tags: {
        ...seoPackage.tags,
        tagList: validTags,
        rawCommaSeparated: currentString,
        characterCount: currentString.length,
        isValidLimit: true,
      },
    });
    setEditedTagsText(currentString);
  };

  // Save Pinned Comment Edit
  const handleSaveCommentEdit = () => {
    if (!seoPackage) return;
    setSeoPackage({
      ...seoPackage,
      pinnedComment: {
        ...seoPackage.pinnedComment,
        text: editedCommentText,
      },
    });
    setIsEditingComment(false);
  };

  // Toggle interactive checklist item
  const handleToggleChecklistItem = (key: string) => {
    setChecklistState((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      if (seoPackage) {
        setSeoPackage({
          ...seoPackage,
          checklist: updated as any,
        });
      }
      return updated;
    });
  };

  // Generate Master "Copy All SEO" text
  const buildCopyAllPackage = (): string => {
    if (!seoPackage) return '';
    const selectedTitle = seoPackage.titles.options[activeTitleIndex]?.title || seoPackage.titles.options[0]?.title || '';
    const altTitles = seoPackage.titles.options
      .map((opt, i) => `  ${i + 1}. [${opt.type}] (${opt.charCount} chars)\n     ${opt.title}\n     Rationale: ${opt.explanation}`)
      .join('\n\n');

    const primaryKw = seoPackage.keywords.primary.map((k) => `  • ${k.phrase} — ${k.relevance}`).join('\n');
    const longTailKw = seoPackage.keywords.longTail.map((k) => `  • ${k.phrase} — ${k.relevance}`).join('\n');
    const questionKw = seoPackage.keywords.questions.map((k) => `  • ${k.phrase} — ${k.relevance}`).join('\n');
    const hindiKw = seoPackage.keywords.hindi.length > 0
      ? `\n\nHINDI SEARCH PHRASES (Devanagari):\n${seoPackage.keywords.hindi.map((k) => `  • ${k.phrase} — ${k.relevance}`).join('\n')}`
      : '';
    const hinglishKw = seoPackage.keywords.hinglish.length > 0
      ? `\n\nHINGLISH SEARCH PHRASES (Roman script):\n${seoPackage.keywords.hinglish.map((k) => `  • ${k.phrase} — ${k.relevance}`).join('\n')}`
      : '';

    const thumbnails = seoPackage.thumbnailConcepts
      .map((t, idx) => `CONCEPT #${idx + 1}: ${t.title}
Subject: ${t.mainVisualSubject}
Composition: ${t.composition}
Colors/Atmosphere: ${t.backgroundColorDirection}
Emotion Angle: ${t.emotionCuriosityAngle}
Overlay Text: "${t.thumbnailText}"
Target Audience Fit: ${t.targetAudienceRationale}`)
      .join('\n\n');

    return `================================================================================
COMPLETE YOUTUBE PRODUCTION & SEO PACKAGE
Project: ${seoPackage.sourceTitle}
Format: ${seoPackage.videoFormat === 'shorts' ? 'YouTube Shorts (9:16 Vertical)' : 'Long-Form Video'}
Language: ${seoPackage.selectedLanguage}
Engine: ${seoPackage.model}
Date: ${new Date(seoPackage.createdAt).toLocaleString()}
================================================================================

1. RECOMMENDED YOUTUBE TITLE
--------------------------------------------------------------------------------
"${selectedTitle}" (${selectedTitle.length} characters)
Strategic Reason: ${seoPackage.titles.recommendationReason}

ALTERNATIVE TITLE OPTIONS:
${altTitles}

2. PUBLISH-READY DESCRIPTION
--------------------------------------------------------------------------------
${seoPackage.description.text}

3. YOUTUBE STUDIO TAGS (Comma-Separated, Limit <= 500 characters)
--------------------------------------------------------------------------------
Character Count: ${seoPackage.tags.characterCount} / 500 (${seoPackage.tags.isValidLimit ? 'VALID' : 'EXCEEDS LIMIT'})
Note: ${seoPackage.tags.disclaimer}

${seoPackage.tags.rawCommaSeparated}

4. RECOMMENDED HASHTAGS
--------------------------------------------------------------------------------
${seoPackage.hashtags.formattedString}

5. CATEGORIZED KEYWORDS (Topic Relevance & Natural Search Intent)
--------------------------------------------------------------------------------
PRIMARY TARGET KEYWORDS:
${primaryKw}

LONG-TAIL SEARCH QUERIES:
${longTailKw}

QUESTION-BASED SEARCH QUERIES:
${questionKw}${hindiKw}${hinglishKw}

6. THUMBNAIL STRATEGY CONCEPTS
--------------------------------------------------------------------------------
${thumbnails}

7. SEARCH INTENT & AUDIENCE INSIGHTS
--------------------------------------------------------------------------------
Viewer Intent Goal: ${seoPackage.searchIntentAndAudience.viewersGoal}
Target Audience: ${seoPackage.searchIntentAndAudience.targetAudience}
Platform Suitability: ${seoPackage.searchIntentAndAudience.platformSuitability}
Spoken Terms To Include: ${seoPackage.searchIntentAndAudience.keyTermsToIncludeInVideo.join(', ')}

8. PINNED COMMUNITY COMMENT
--------------------------------------------------------------------------------
${seoPackage.pinnedComment.text}
Goal: ${seoPackage.pinnedComment.discussionPrompt}

9. PUBLISHING VERIFICATION CHECKLIST
--------------------------------------------------------------------------------
[${checklistState.titleRelevance ? 'X' : ' '}] Title relevance & mobile readability (<65 chars)
[${checklistState.descriptionAccuracy ? 'X' : ' '}] Description accuracy & complete summary
[${checklistState.primaryKeywordIncluded ? 'X' : ' '}] Primary keyword included naturally
[${checklistState.tagsUnder500 ? 'X' : ' '}] Tags strictly under 500 characters (${seoPackage.tags.characterCount}/500)
[${checklistState.relevantHashtags ? 'X' : ' '}] Specific topic hashtags included
[${checklistState.thumbnailClarity ? 'X' : ' '}] Thumbnail visual focal point and mobile text verified
[${checklistState.correctLanguageAudience ? 'X' : ' '}] Correct narration language & audience tone
[${checklistState.factualVerificationDone ? 'X' : ' '}] Factual verification check passed
[${checklistState.syntheticMediaDisclosure ? 'X' : ' '}] Altered/synthetic media disclosure included

================================================================================
Generated via YouTube SEO Studio`;
  };

  // Copy All SEO Handler
  const handleCopyAllSEO = async () => {
    const text = buildCopyAllPackage();
    if (!text) return;
    await copyToClipboard(text, 'all_seo');
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  // Download Markdown file
  const handleDownloadMarkdown = () => {
    const text = buildCopyAllPackage();
    if (!text) return;
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeTitle = (customTitle || 'youtube_seo').toLowerCase().replace(/[^\w]/g, '_').slice(0, 30);
    a.href = url;
    a.download = `${safeTitle}_youtube_seo.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
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
            <Search className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                YouTube SEO Studio
              </h2>
              <span
                className="px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider border uppercase"
                style={{
                  backgroundColor: 'rgba(212, 175, 55, 0.15)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--accent-primary)',
                }}
              >
                {activeProfile?.aspectRatio === '16:9' ? '16:9 Long-Form' : '9:16 Shorts'}
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Complete YouTube metadata, fact-grounded titles, publish descriptions, tags (≤500 chars), and thumbnail strategies
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center space-x-2">
          {seoPackage && (
            <>
              <button
                type="button"
                onClick={handleCopyAllSEO}
                className="px-4 py-2.5 rounded-xl text-black text-xs font-bold shadow-md flex items-center space-x-2 transition-all transform hover:scale-[1.02] cursor-pointer jarvis-gold-btn"
              >
                {copiedAll ? <Check className="w-4 h-4 text-black" /> : <Copy className="w-4 h-4 text-black" />}
                <span>{copiedAll ? 'All SEO Copied!' : 'Copy All SEO'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadMarkdown}
                title="Download complete SEO package as Markdown file"
                className="p-2.5 rounded-xl border text-xs transition-colors hover:bg-slate-800/10 cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-secondary)',
                }}
              >
                <Download className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => handleGenerateFullPackage()}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold border flex items-center space-x-2 transition-colors disabled:opacity-50 cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} style={{ color: '#ef4444' }} />
            <span>{seoPackage ? 'Regenerate All' : 'Generate Full Package'}</span>
          </button>
        </div>
      </div>

      {/* 2. Error / Success Alerts */}
      {errorMessage && (
        <div className="p-4 rounded-xl border flex items-center space-x-3 bg-red-500/10 border-red-500/30 text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl border flex items-center space-x-3 bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-xs">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Source & Configuration Toolbar */}
      <section
        className="rounded-2xl p-5 border shadow-xl backdrop-blur-md space-y-4"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Source Selection Dropdown */}
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold flex items-center space-x-1.5" style={{ color: 'var(--text-primary)' }}>
                <FileText className="w-3.5 h-3.5 text-red-400" />
                <span>Story & Script Source</span>
              </label>
              {onNavigateToSources && (
                <button
                  type="button"
                  onClick={onNavigateToSources}
                  className="text-[11px] font-medium flex items-center space-x-1 hover:underline cursor-pointer"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  <span>Manage Sources</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={selectedSourceId}
                onChange={(e) => handleSelectSource(e.target.value)}
                className="w-full text-xs rounded-xl px-3.5 py-2.5 border outline-none font-medium cursor-pointer transition-colors"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                {transferredScript && (
                  <option value="transferred">
                    ⚡ Transferred Script ({transferredSourceTitle || `${transferredScript.contentMode} Video`})
                  </option>
                )}
                {savedSources.map((s) => (
                  <option key={s.id} value={s.id}>
                    📁 {s.title} ({s.text.slice(0, 40)}...)
                  </option>
                ))}
                <option value="custom">✍️ Custom Paste / Direct Input</option>
              </select>
            </div>
          </div>

          {/* Video Format Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold block" style={{ color: 'var(--text-primary)' }}>
              Video Format
            </label>
            <div
              className="inline-flex rounded-xl p-1 border"
              style={{
                backgroundColor: 'var(--bg-base)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <button
                type="button"
                onClick={() => setVideoFormat('shorts')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  videoFormat === 'shorts' ? 'shadow-sm text-white' : 'hover:opacity-80'
                }`}
                style={{
                  backgroundColor: videoFormat === 'shorts' ? '#ef4444' : 'transparent',
                  color: videoFormat === 'shorts' ? '#ffffff' : 'var(--text-secondary)',
                }}
              >
                📱 YouTube Shorts
              </button>
              <button
                type="button"
                onClick={() => setVideoFormat('long-form')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  videoFormat === 'long-form' ? 'shadow-sm text-white' : 'hover:opacity-80'
                }`}
                style={{
                  backgroundColor: videoFormat === 'long-form' ? '#ef4444' : 'transparent',
                  color: videoFormat === 'long-form' ? '#ffffff' : 'var(--text-secondary)',
                }}
              >
                🎬 Long-Form Video
              </button>
            </div>
          </div>

          {/* Language Selector */}
          <div className="space-y-1.5 min-w-[160px]">
            <label className="text-xs font-semibold block" style={{ color: 'var(--text-primary)' }}>
              Language Target
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full text-xs rounded-xl px-3 py-2 border outline-none font-medium cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-base)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="auto">🌐 Auto-detect from source</option>
              <option value="Hindi">🇮🇳 Hindi (हिंदी)</option>
              <option value="Hinglish">🇮🇳 Hinglish (Latin script)</option>
              <option value="Gujarati">🇮🇳 Gujarati (ગુજરાતી)</option>
              <option value="English">🌐 English</option>
            </select>
          </div>
        </div>

        {/* Custom Input Details if editing or expanding */}
        <div
          className="p-3.5 rounded-xl border space-y-2.5 text-xs"
          style={{
            backgroundColor: 'var(--bg-base)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Current Story Title: <strong style={{ color: 'var(--text-primary)' }}>{customTitle || 'Untitled'}</strong>
            </span>
            <div className="flex items-center space-x-3 text-[11px]" style={{ color: 'var(--text-muted)' }}>
              <span>Characters: {customText.length}</span>
              <span>•</span>
              <span>Words: ~{customText.trim().split(/\s+/).filter(Boolean).length}</span>
              {transferredScript && (
                <>
                  <span>•</span>
                  <span>Segments: {transferredScript.segments?.length || 0}</span>
                </>
              )}
            </div>
          </div>

          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            rows={2}
            placeholder="Paste your video narration or story source here..."
            className="w-full text-xs rounded-lg p-2.5 border outline-none font-mono resize-y transition-colors"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
      </section>

      {/* Loading Indicator */}
      {loading && (
        <div
          className="rounded-2xl p-12 border text-center space-y-3 animate-pulse shadow-xl"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-red-500" />
          <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            Analyzing Story & Generating YouTube SEO Package...
          </h3>
          <p className="text-xs max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Extracting entities, formulating high-CTR mobile titles, generating publish-ready description, and verifying tags limit (≤ 500 chars).
          </p>
        </div>
      )}

      {/* Main SEO Dashboard Grid (when generated) */}
      {!loading && seoPackage && (
        <div className="space-y-8">
          {/* 4. Story Analysis & Fact-Check Card */}
          <section
            className="rounded-2xl p-5 border shadow-xl backdrop-blur-md space-y-4"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  Story Analysis & Factual Grounding
                </h3>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-medium border"
                  style={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Detected: {seoPackage.storyAnalysis.detectedLanguage} · {seoPackage.storyAnalysis.contentFormat}
                </span>
              </div>
              <div className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                Zero Fabricated Volume Policy Enforced
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl border space-y-1.5" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}>
                <span className="font-semibold block" style={{ color: 'var(--text-muted)' }}>Main Topic & Core Claim</span>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{seoPackage.storyAnalysis.mainTopic}</p>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{seoPackage.storyAnalysis.centralClaim}</p>
              </div>

              <div className="p-3.5 rounded-xl border space-y-1.5" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}>
                <span className="font-semibold block" style={{ color: 'var(--text-muted)' }}>Entities & Key Subjects</span>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {seoPackage.storyAnalysis.primarySubjects.map((sub, i) => (
                    <span key={i} className="px-2 py-0.5 rounded text-[11px] font-medium border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}>
                      {sub}
                    </span>
                  ))}
                  {seoPackage.storyAnalysis.organizations.map((org, i) => (
                    <span key={i} className="px-2 py-0.5 rounded text-[11px] font-medium border text-indigo-400" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
                      {org}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border space-y-1.5" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}>
                <span className="font-semibold block" style={{ color: 'var(--text-muted)' }}>Target Audience & Intent</span>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{seoPackage.storyAnalysis.targetAudience}</p>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{seoPackage.storyAnalysis.searchIntent}</p>
              </div>
            </div>

            {/* Factual Claims to Verify */}
            {seoPackage.storyAnalysis.factualClaimsToVerify.length > 0 && (
              <div className="p-3.5 rounded-xl border text-xs space-y-1.5" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center space-x-2 text-amber-400 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Important Factual Verification Points:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                  {seoPackage.storyAnalysis.factualClaimsToVerify.map((claim, idx) => (
                    <li key={idx}>{claim}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* 5. SECTION A: YouTube Title (5 Distinct Options) */}
          <section
            className="rounded-2xl p-6 border shadow-xl backdrop-blur-md space-y-5"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <div className="flex items-center space-x-2.5">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                    A
                  </span>
                  <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                    YouTube Title Options
                  </h3>
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  5 high-converting angles matched strictly to story facts. Mobile viewport optimized (&lt;65 characters).
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleRegenerateSection('titles')}
                  disabled={regeneratingSection === 'titles'}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center space-x-1.5 transition-colors cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${regeneratingSection === 'titles' ? 'animate-spin' : ''}`} style={{ color: '#ef4444' }} />
                  <span>Regenerate Titles</span>
                </button>
              </div>
            </div>

            {/* Strategic Rationale Banner */}
            <div
              className="p-3.5 rounded-xl border flex items-start space-x-3 text-xs"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.06)',
                borderColor: 'rgba(239, 68, 68, 0.25)',
              }}
            >
              <Compass className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-red-400">Recommendation Rationale: </span>
                <span style={{ color: 'var(--text-primary)' }}>{seoPackage.titles.recommendationReason}</span>
              </div>
            </div>

            {/* Title Options List */}
            <div className="space-y-3">
              {seoPackage.titles.options.map((opt, idx) => {
                const isSelected = activeTitleIndex === idx;
                const isEditing = editingTitleIndex === idx;
                const isCopied = copiedSection === `title_${idx}`;

                return (
                  <div
                    key={idx}
                    className={`rounded-xl p-4 border transition-all ${
                      isSelected ? 'ring-2' : ''
                    }`}
                    style={{
                      backgroundColor: 'var(--bg-base)',
                      borderColor: isSelected ? '#ef4444' : 'var(--border-subtle)',
                      boxShadow: isSelected ? '0 4px 14px rgba(239, 68, 68, 0.15)' : 'none',
                    }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 mb-2 border-b text-xs" style={{ borderColor: 'var(--border-subtle)' }}>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setActiveTitleIndex(idx)}
                          className="flex items-center space-x-1.5 cursor-pointer"
                        >
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected ? 'bg-red-500 border-red-500' : 'border-slate-500'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                          <span className="font-bold" style={{ color: isSelected ? '#ef4444' : 'var(--text-primary)' }}>
                            Option {idx + 1}: {opt.type}
                          </span>
                        </button>
                        {idx === 4 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            ★ Recommended
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <span
                          className={`font-mono text-[11px] px-2 py-0.5 rounded border ${
                            opt.charCount <= 65
                              ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                              : 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                          }`}
                        >
                          {opt.charCount} / 100 chars {opt.charCount <= 65 ? '(Mobile Safe)' : ''}
                        </span>

                        <button
                          type="button"
                          onClick={() => copyToClipboard(opt.title, `title_${idx}`)}
                          className="p-1.5 rounded-lg border text-xs transition-colors hover:bg-slate-800/20 cursor-pointer"
                          style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                          title="Copy this title"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (isEditing) {
                              handleSaveTitleEdit(idx);
                            } else {
                              setEditingTitleIndex(idx);
                              setTempTitleText(opt.title);
                            }
                          }}
                          className="p-1.5 rounded-lg border text-xs transition-colors hover:bg-slate-800/20 cursor-pointer"
                          style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                          title={isEditing ? 'Save title' : 'Edit title'}
                        >
                          {isEditing ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Edit3 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="space-y-2 pt-1">
                        <input
                          type="text"
                          value={tempTitleText}
                          onChange={(e) => setTempTitleText(e.target.value)}
                          className="w-full text-sm rounded-lg px-3 py-2 border outline-none font-semibold"
                          style={{
                            backgroundColor: 'var(--bg-surface)',
                            borderColor: 'var(--border-focus)',
                            color: 'var(--text-primary)',
                          }}
                        />
                        <div className="flex justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => setEditingTitleIndex(null)}
                            className="px-2.5 py-1 rounded text-xs border"
                            style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveTitleEdit(idx)}
                            className="px-3 py-1 rounded text-xs bg-red-600 text-white font-medium"
                          >
                            Save Title
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                          {opt.title}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          <span className="font-medium" style={{ color: 'var(--text-muted)' }}>Why it fits: </span>
                          {opt.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* 6. SECTION B: Publish-Ready YouTube Description */}
          <section
            className="rounded-2xl p-6 border shadow-xl backdrop-blur-md space-y-4"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <div className="flex items-center space-x-2.5">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                    B
                  </span>
                  <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                    YouTube Description (Publish-Ready)
                  </h3>
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Opening hook, concise video summary, call to action, chapters, AI synthetic disclosure, and hashtags
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="font-mono text-[11px] px-2.5 py-1 rounded border" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
                  {seoPackage.description.text.length} / 5,000 chars
                </span>

                <button
                  type="button"
                  onClick={() => copyToClipboard(seoPackage.description.text, 'description')}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center space-x-1.5 transition-colors cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {copiedSection === 'description' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'description' ? 'Copied!' : 'Copy Description'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (isEditingDescription) {
                      handleSaveDescriptionEdit();
                    } else {
                      setIsEditingDescription(true);
                      setEditedDescriptionText(seoPackage.description.text);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center space-x-1.5 transition-colors cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditingDescription ? 'Save' : 'Edit'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRegenerateSection('description')}
                  disabled={regeneratingSection === 'description'}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center space-x-1.5 transition-colors cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${regeneratingSection === 'description' ? 'animate-spin' : ''}`} style={{ color: '#ef4444' }} />
                  <span>Regenerate</span>
                </button>
              </div>
            </div>

            {isEditingDescription ? (
              <div className="space-y-3">
                <textarea
                  value={editedDescriptionText}
                  onChange={(e) => setEditedDescriptionText(e.target.value)}
                  rows={12}
                  className="w-full text-xs rounded-xl p-4 border outline-none font-mono leading-relaxed"
                  style={{
                    backgroundColor: 'var(--bg-base)',
                    borderColor: 'var(--border-focus)',
                    color: 'var(--text-primary)',
                  }}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingDescription(false)}
                    className="px-3 py-1.5 rounded-xl text-xs border"
                    style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDescriptionEdit}
                    className="px-4 py-1.5 rounded-xl text-xs bg-red-600 text-white font-semibold"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="p-4 rounded-xl border text-xs font-mono leading-relaxed whitespace-pre-wrap select-text"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                {seoPackage.description.text}
              </div>
            )}
          </section>

          {/* 7. SECTION C: Primary & Secondary Keywords */}
          <section
            className="rounded-2xl p-6 border shadow-xl backdrop-blur-md space-y-4"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <div className="flex items-center space-x-2.5">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                    C
                  </span>
                  <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                    Categorized Keywords & Intent Mapping
                  </h3>
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  AI-recommended keywords based on topic relevance & natural search intent. Specific rationale provided for every phrase.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    const allKw = [
                      ...seoPackage.keywords.primary,
                      ...seoPackage.keywords.secondary,
                      ...seoPackage.keywords.longTail,
                      ...seoPackage.keywords.questions,
                      ...seoPackage.keywords.hindi,
                      ...seoPackage.keywords.hinglish,
                      ...seoPackage.keywords.entities,
                    ].map((k) => `• ${k.phrase} (${k.relevance})`).join('\n');
                    copyToClipboard(allKw, 'keywords');
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center space-x-1.5 transition-colors cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {copiedSection === 'keywords' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'keywords' ? 'Copied!' : 'Copy Keywords'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRegenerateSection('keywords')}
                  disabled={regeneratingSection === 'keywords'}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center space-x-1.5 transition-colors cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${regeneratingSection === 'keywords' ? 'animate-spin' : ''}`} style={{ color: '#ef4444' }} />
                  <span>Regenerate</span>
                </button>
              </div>
            </div>

            {/* Keyword Category Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 pb-2">
              {[
                { id: 'all', label: 'All Keywords' },
                { id: 'primary', label: `Primary (${seoPackage.keywords.primary.length})` },
                { id: 'secondary', label: `Secondary (${seoPackage.keywords.secondary.length})` },
                { id: 'longTail', label: `Long-Tail (${seoPackage.keywords.longTail.length})` },
                { id: 'questions', label: `Questions (${seoPackage.keywords.questions.length})` },
                { id: 'hindi', label: `Hindi (${seoPackage.keywords.hindi.length})` },
                { id: 'hinglish', label: `Hinglish (${seoPackage.keywords.hinglish.length})` },
                { id: 'entities', label: `Entities (${seoPackage.keywords.entities.length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveKeywordTab(tab.id as any)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    activeKeywordTab === tab.id ? 'border' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: activeKeywordTab === tab.id ? 'var(--bg-base)' : 'transparent',
                    borderColor: activeKeywordTab === tab.id ? 'var(--border-focus)' : 'transparent',
                    color: activeKeywordTab === tab.id ? '#ef4444' : 'var(--text-secondary)',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Keyword Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(
                activeKeywordTab === 'all'
                  ? [
                      ...seoPackage.keywords.primary,
                      ...seoPackage.keywords.secondary,
                      ...seoPackage.keywords.longTail,
                      ...seoPackage.keywords.questions,
                      ...seoPackage.keywords.hindi,
                      ...seoPackage.keywords.hinglish,
                      ...seoPackage.keywords.entities,
                    ]
                  : (seoPackage.keywords as any)[activeKeywordTab] || []
              ).map((kw: KeywordItem, i: number) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl border space-y-1.5 flex flex-col justify-between"
                  style={{
                    backgroundColor: 'var(--bg-base)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>
                        {kw.phrase}
                      </span>
                      <button
                        onClick={() => copyToClipboard(kw.phrase, `kw_${i}`)}
                        className="text-[10px] opacity-70 hover:opacity-100 cursor-pointer"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {copiedSection === `kw_${i}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <p className="text-[11px] mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {kw.relevance}
                    </p>
                  </div>
                  <div className="pt-2 text-[10px] uppercase font-mono tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Category: {kw.category}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 8. SECTION D: YouTube Studio Tags (Strict <= 500 characters limit) */}
          <section
            className="rounded-2xl p-6 border shadow-xl backdrop-blur-md space-y-4"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <div className="flex items-center space-x-2.5">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                    D
                  </span>
                  <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                    YouTube Studio Tags
                  </h3>
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Clean, comma-separated tag list strictly bound to YouTube's 500-character limit
                </p>
              </div>

              <div className="flex items-center space-x-2">
                {/* Visible Character Counter */}
                <div
                  className={`font-mono text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center space-x-1.5 ${
                    seoPackage.tags.characterCount <= 500
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>{seoPackage.tags.characterCount} / 500 characters</span>
                </div>

                {!seoPackage.tags.isValidLimit && (
                  <button
                    type="button"
                    onClick={handleTrimTagsTo500}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 text-black cursor-pointer shadow"
                    title="Auto-trim tags list to fit under 500 characters"
                  >
                    Auto-Trim to 500
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (seoPackage.tags.characterCount > 500) {
                      setErrorMessage('Tags exceed 500 characters limit. Please trim or edit before pasting into YouTube.');
                      return;
                    }
                    copyToClipboard(seoPackage.tags.rawCommaSeparated, 'tags');
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold border flex items-center space-x-1.5 transition-colors cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {copiedSection === 'tags' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'tags' ? 'Tags Copied!' : 'Copy Tags'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (isEditingTags) {
                      handleSaveTagsEdit();
                    } else {
                      setIsEditingTags(true);
                      setEditedTagsText(seoPackage.tags.rawCommaSeparated);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center space-x-1.5 transition-colors cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditingTags ? 'Save' : 'Edit'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRegenerateSection('tags')}
                  disabled={regeneratingSection === 'tags'}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center space-x-1.5 transition-colors cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${regeneratingSection === 'tags' ? 'animate-spin' : ''}`} style={{ color: '#ef4444' }} />
                  <span>Regenerate</span>
                </button>
              </div>
            </div>

            {/* YouTube Documentation Notice */}
            <div
              className="p-3 rounded-xl border flex items-center space-x-2.5 text-xs"
              style={{
                backgroundColor: 'var(--bg-base)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
            >
              <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span>
                <strong>Official YouTube Guidelines:</strong> {seoPackage.tags.disclaimer} Titles and descriptions play a significantly larger role in video discovery.
              </span>
            </div>

            {isEditingTags ? (
              <div className="space-y-3">
                <textarea
                  value={editedTagsText}
                  onChange={(e) => setEditedTagsText(e.target.value)}
                  rows={4}
                  className="w-full text-xs rounded-xl p-3.5 border outline-none font-mono"
                  style={{
                    backgroundColor: 'var(--bg-base)',
                    borderColor: 'var(--border-focus)',
                    color: 'var(--text-primary)',
                  }}
                />
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-mono ${editedTagsText.length <= 500 ? 'text-emerald-400' : 'text-red-400'}`}>
                    Current length: {editedTagsText.length} / 500 characters
                  </span>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingTags(false)}
                      className="px-3 py-1 rounded-xl text-xs border"
                      style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveTagsEdit}
                      className="px-3.5 py-1 rounded-xl text-xs bg-red-600 text-white font-semibold"
                    >
                      Save Tags
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="p-4 rounded-xl border text-xs font-mono select-all leading-relaxed"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                {seoPackage.tags.rawCommaSeparated}
              </div>
            )}
          </section>

          {/* 9. SECTION E & SECTION H: Hashtags and Pinned Comment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Section E: Hashtags */}
            <section
              className="rounded-2xl p-5 border shadow-xl backdrop-blur-md space-y-4"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center space-x-2.5">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                    E
                  </span>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    Hashtags
                  </h3>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(seoPackage.hashtags.formattedString, 'hashtags')}
                    className="p-1.5 rounded-lg border text-xs transition-colors hover:bg-slate-800/20 cursor-pointer"
                    style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                    title="Copy hashtags"
                  >
                    {copiedSection === 'hashtags' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRegenerateSection('hashtags')}
                    disabled={regeneratingSection === 'hashtags'}
                    className="p-1.5 rounded-lg border text-xs transition-colors hover:bg-slate-800/20 cursor-pointer"
                    style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                    title="Regenerate hashtags"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${regeneratingSection === 'hashtags' ? 'animate-spin' : ''}`} style={{ color: '#ef4444' }} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {seoPackage.hashtags.recommended.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl text-xs font-mono font-semibold border flex items-center space-x-1.5"
                    style={{
                      backgroundColor: 'var(--bg-base)',
                      borderColor: 'var(--border-subtle)',
                      color: '#ef4444',
                    }}
                  >
                    <span>{tag}</span>
                  </span>
                ))}
              </div>
            </section>

            {/* Section H: Pinned Comment */}
            <section
              className="rounded-2xl p-5 border shadow-xl backdrop-blur-md space-y-4"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center space-x-2.5">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                    H
                  </span>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    Pinned Community Comment
                  </h3>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(seoPackage.pinnedComment.text, 'pinned_comment')}
                    className="p-1.5 rounded-lg border text-xs transition-colors hover:bg-slate-800/20 cursor-pointer"
                    style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                    title="Copy pinned comment"
                  >
                    {copiedSection === 'pinned_comment' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRegenerateSection('pinnedComment')}
                    disabled={regeneratingSection === 'pinnedComment'}
                    className="p-1.5 rounded-lg border text-xs transition-colors hover:bg-slate-800/20 cursor-pointer"
                    style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                    title="Regenerate comment"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${regeneratingSection === 'pinnedComment' ? 'animate-spin' : ''}`} style={{ color: '#ef4444' }} />
                  </button>
                </div>
              </div>

              {isEditingComment ? (
                <div className="space-y-2">
                  <textarea
                    value={editedCommentText}
                    onChange={(e) => setEditedCommentText(e.target.value)}
                    rows={3}
                    className="w-full text-xs rounded-xl p-3 border outline-none font-sans"
                    style={{
                      backgroundColor: 'var(--bg-base)',
                      borderColor: 'var(--border-focus)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingComment(false)}
                      className="px-2.5 py-1 rounded text-xs border"
                      style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveCommentEdit}
                      className="px-3 py-1 rounded text-xs bg-red-600 text-white font-medium"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="p-3.5 rounded-xl border text-xs leading-relaxed"
                  style={{
                    backgroundColor: 'var(--bg-base)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <p className="font-medium">{seoPackage.pinnedComment.text}</p>
                  <p className="text-[11px] mt-2 italic" style={{ color: 'var(--text-muted)' }}>
                    Strategy: {seoPackage.pinnedComment.discussionPrompt}
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* 10. SECTION F: Thumbnail Strategy Concepts */}
          <section
            className="rounded-2xl p-6 border shadow-xl backdrop-blur-md space-y-4"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <div className="flex items-center space-x-2.5">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                    F
                  </span>
                  <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                    Thumbnail Strategy (3 High-Impact Concepts)
                  </h3>
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Grounded compositions with clear visual subjects, contrasting lighting, and punchy on-screen text
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    const text = seoPackage.thumbnailConcepts
                      .map((t, i) => `Concept ${i + 1}: ${t.title}\nSubject: ${t.mainVisualSubject}\nText: "${t.thumbnailText}"\nComposition: ${t.composition}`)
                      .join('\n\n');
                    copyToClipboard(text, 'thumbnails');
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center space-x-1.5 transition-colors cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {copiedSection === 'thumbnails' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'thumbnails' ? 'Copied All!' : 'Copy Concepts'}</span>
                </button>

                {onTransferToThumbnailStudio && (
                  <button
                    type="button"
                    onClick={() => {
                      onTransferToThumbnailStudio({
                        sourceTitle: customTitle || seoPackage.sourceTitle,
                        sourceArticle: customText,
                        script: transferredScript,
                        concept: seoPackage.thumbnailConcepts[0],
                      });
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center space-x-1.5 transition-all transform hover:scale-[1.02] cursor-pointer"
                    style={{
                      background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
                      boxShadow: '0 2px 10px rgba(14, 165, 233, 0.3)',
                    }}
                    title="Launch Thumbnail Studio with these concepts"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-white" />
                    <span>Open in Thumbnail Studio</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleRegenerateSection('thumbnails')}
                  disabled={regeneratingSection === 'thumbnails'}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center space-x-1.5 transition-colors cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${regeneratingSection === 'thumbnails' ? 'animate-spin' : ''}`} style={{ color: '#ef4444' }} />
                  <span>Regenerate</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {seoPackage.thumbnailConcepts.map((thumb, idx) => {
                const isCopied = copiedSection === `thumb_${idx}`;

                return (
                  <div
                    key={idx}
                    className="rounded-xl p-4 border flex flex-col justify-between space-y-3"
                    style={{
                      backgroundColor: 'var(--bg-base)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b text-xs" style={{ borderColor: 'var(--border-subtle)' }}>
                        <span className="font-bold text-red-400">Concept #{thumb.conceptNumber}</span>
                        <button
                          onClick={() => {
                            const text = `Concept #${thumb.conceptNumber}: ${thumb.title}\nSubject: ${thumb.mainVisualSubject}\nOverlay Text: "${thumb.thumbnailText}"\nComposition: ${thumb.composition}\nRationale: ${thumb.targetAudienceRationale}`;
                            copyToClipboard(text, `thumb_${idx}`);
                          }}
                          className="p-1 rounded hover:bg-slate-800/20 cursor-pointer"
                          style={{ color: 'var(--text-secondary)' }}
                          title="Copy this concept"
                        >
                          {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>

                      <h4 className="font-bold text-xs mt-2" style={{ color: 'var(--text-primary)' }}>
                        {thumb.title}
                      </h4>

                      {/* Mockup Preview Badge */}
                      <div
                        className="my-3 p-3 rounded-lg border text-center font-black tracking-wider uppercase text-sm shadow-inner"
                        style={{
                          backgroundColor: 'var(--bg-surface-elevated)',
                          borderColor: 'var(--border-focus)',
                          color: '#ef4444',
                        }}
                      >
                        "{thumb.thumbnailText || 'TITLE TEXT'}"
                      </div>

                      <div className="space-y-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <div>
                          <strong style={{ color: 'var(--text-primary)' }}>Visual Subject: </strong>
                          {thumb.mainVisualSubject}
                        </div>
                        <div>
                          <strong style={{ color: 'var(--text-primary)' }}>Composition: </strong>
                          {thumb.composition}
                        </div>
                        <div>
                          <strong style={{ color: 'var(--text-primary)' }}>Colors: </strong>
                          {thumb.backgroundColorDirection}
                        </div>
                        <div>
                          <strong style={{ color: 'var(--text-primary)' }}>Emotion Angle: </strong>
                          {thumb.emotionCuriosityAngle}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t text-[11px] flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
                      <span><strong>Fit: </strong>{thumb.targetAudienceRationale}</span>
                      {onTransferToThumbnailStudio && (
                        <button
                          type="button"
                          onClick={() => {
                            onTransferToThumbnailStudio({
                              sourceTitle: customTitle || seoPackage.sourceTitle,
                              sourceArticle: customText,
                              script: transferredScript,
                              concept: thumb,
                            });
                          }}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold text-sky-400 hover:text-sky-300 hover:underline cursor-pointer flex items-center space-x-1"
                        >
                          <span>Design</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 11. SECTION G & I: Search Intent and Final Publishing Checklist */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Section G: Search Intent & Audience */}
            <section
              className="rounded-2xl p-5 border shadow-xl backdrop-blur-md space-y-4"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center space-x-2.5">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                    G
                  </span>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    Search Intent & Audience Context
                  </h3>
                </div>
                <button
                  onClick={() => {
                    const text = `Viewer Goal: ${seoPackage.searchIntentAndAudience.viewersGoal}\nTarget Audience: ${seoPackage.searchIntentAndAudience.targetAudience}\nPlatform: ${seoPackage.searchIntentAndAudience.platformSuitability}`;
                    copyToClipboard(text, 'intent');
                  }}
                  className="p-1.5 rounded-lg border text-xs cursor-pointer"
                  style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                >
                  {copiedSection === 'intent' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}>
                  <span className="font-semibold block" style={{ color: 'var(--text-muted)' }}>What Viewers Are Trying To Learn</span>
                  <p className="mt-1 font-medium" style={{ color: 'var(--text-primary)' }}>{seoPackage.searchIntentAndAudience.viewersGoal}</p>
                </div>

                <div className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}>
                  <span className="font-semibold block" style={{ color: 'var(--text-muted)' }}>Target Audience Fit</span>
                  <p className="mt-1 font-medium" style={{ color: 'var(--text-primary)' }}>{seoPackage.searchIntentAndAudience.targetAudience}</p>
                </div>

                <div className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}>
                  <span className="font-semibold block" style={{ color: 'var(--text-muted)' }}>Platform Discovery Suitability</span>
                  <p className="mt-1 font-bold text-red-400">{seoPackage.searchIntentAndAudience.platformSuitability}</p>
                </div>
              </div>
            </section>

            {/* Section I: Final Publishing Checklist */}
            <section
              className="rounded-2xl p-5 border shadow-xl backdrop-blur-md space-y-4"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center space-x-2.5">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                    I
                  </span>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    Final Publishing Checklist
                  </h3>
                </div>
                <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                  Pre-Upload Verification
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { key: 'titleRelevance', label: 'Title matches actual story facts and is readable on mobile (<65 chars)' },
                  { key: 'descriptionAccuracy', label: 'Description accurately summarizes video without deceptive clickbait' },
                  { key: 'primaryKeywordIncluded', label: 'Primary target keyword included naturally in title and description opening' },
                  { key: 'tagsUnder500', label: `YouTube Studio tags are strictly within the 500-character limit (${seoPackage.tags.characterCount}/500)` },
                  { key: 'relevantHashtags', label: 'Specific, topic-relevant hashtags added (no spam hashtags)' },
                  { key: 'thumbnailClarity', label: 'Thumbnail visual subject is sharp and on-image text is concise' },
                  { key: 'correctLanguageAudience', label: `Narration language confirmed: ${seoPackage.selectedLanguage}` },
                  { key: 'factualVerificationDone', label: 'Factual verification points checked against primary source documents' },
                  { key: 'syntheticMediaDisclosure', label: 'Altered or synthetic media disclosure included if AI illustrations are used' },
                ].map((item) => {
                  const checked = checklistState[item.key] ?? false;

                  return (
                    <label
                      key={item.key}
                      onClick={() => handleToggleChecklistItem(item.key)}
                      className="flex items-start space-x-2.5 p-2 rounded-lg transition-colors hover:bg-slate-800/10 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {}} // handled by label onClick
                        className="mt-0.5 rounded border-slate-700 text-red-600 focus:ring-0 cursor-pointer"
                      />
                      <span
                        className={`text-xs ${
                          checked ? 'line-through opacity-70' : 'font-medium'
                        }`}
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {item.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* Empty State when no package is loaded */}
      {!loading && !seoPackage && (
        <div
          className="rounded-2xl p-12 border text-center space-y-4 shadow-xl"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
            }}
          >
            <Search className="w-8 h-8" />
          </div>

          <div className="space-y-1.5 max-w-lg mx-auto">
            <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              No YouTube SEO Package Generated Yet
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Select a saved source, paste your video script dialogue, or transfer directly from the Script Generator tab to generate a complete YouTube SEO package.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleGenerateFullPackage()}
              disabled={loading || !customText.trim()}
              className="px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-lg flex items-center space-x-2 transition-all transform hover:scale-[1.02] cursor-pointer disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
              }}
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>Generate Full SEO Package Now</span>
            </button>

            {onNavigateToScripts && (
              <button
                type="button"
                onClick={onNavigateToScripts}
                className="px-4 py-2.5 rounded-xl text-xs font-medium border flex items-center space-x-2 transition-colors cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                <span>Go to Script Generator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
