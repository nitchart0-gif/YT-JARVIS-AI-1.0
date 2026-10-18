// src/components/yt-editor/EditorExportModal.tsx
import React, { useState } from 'react';
import {
  X,
  Download,
  Film,
  FileText,
  Copy,
  Check,
  Play,
  Sparkles,
  Loader2,
  HardDrive,
  FileCode,
} from 'lucide-react';
import { EditorProject } from '../../types/editor';
import {
  exportProjectToVideo,
  ExportProgress,
  generateYouTubeChaptersText,
  generateSrtSubtitles,
} from '../../services/editorEngine';

interface EditorExportModalProps {
  project: EditorProject;
  isOpen: boolean;
  onClose: () => void;
}

type ExportTab = 'video' | 'chapters' | 'subtitles' | 'project';

export const EditorExportModal: React.FC<EditorExportModalProps> = ({
  project,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<ExportTab>('video');

  // Video Export States
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  const [exportedMime, setExportedMime] = useState<string>('video/webm');
  const [exportError, setExportError] = useState<string | null>(null);

  // Settings
  const [exportResolution, setExportResolution] = useState<'match' | '1080p' | '720p'>('match');
  const [exportFps, setExportFps] = useState<number>(project.settings.frameRate || 30);
  const [exportBitrate, setExportBitrate] = useState<number>(6_000_000); // 6 Mbps

  // Chapters & Subtitles state
  const [copiedChapters, setCopiedChapters] = useState(false);
  const [copiedSrt, setCopiedSrt] = useState(false);

  const chaptersText = generateYouTubeChaptersText(project);
  const srtText = generateSrtSubtitles(project);

  const handleStartRender = async () => {
    setIsExporting(true);
    setExportError(null);
    setExportedVideoUrl(null);

    let targetWidth = project.settings.resolution.width;
    let targetHeight = project.settings.resolution.height;

    if (exportResolution === '720p') {
      const ratio = targetWidth / targetHeight;
      targetHeight = 720;
      targetWidth = Math.round(720 * ratio);
    } else if (exportResolution === '1080p') {
      const ratio = targetWidth / targetHeight;
      targetHeight = 1080;
      targetWidth = Math.round(1080 * ratio);
    }

    try {
      const result = await exportProjectToVideo(
        project,
        {
          resolutionWidth: targetWidth,
          resolutionHeight: targetHeight,
          fps: exportFps,
          bitrateBps: exportBitrate,
        },
        (p) => setProgress(p)
      );

      const url = URL.createObjectURL(result.blob);
      setExportedVideoUrl(url);
      setExportedMime(result.mimeType);
      setIsExporting(false);
    } catch (err: any) {
      console.error('Export error:', err);
      setExportError(err?.message || 'Video export failed.');
      setIsExporting(false);
    }
  };

  const handleDownloadVideo = () => {
    if (!exportedVideoUrl) return;
    const a = document.createElement('a');
    a.href = exportedVideoUrl;
    const ext = exportedMime.includes('mp4') ? 'mp4' : 'webm';
    a.download = `${project.settings.name.replace(/\s+/g, '_')}_master.${ext}`;
    a.click();
  };

  const handleCopyChapters = () => {
    navigator.clipboard.writeText(chaptersText);
    setCopiedChapters(true);
    setTimeout(() => setCopiedChapters(false), 2000);
  };

  const handleCopySrt = () => {
    navigator.clipboard.writeText(srtText);
    setCopiedSrt(true);
    setTimeout(() => setCopiedSrt(false), 2000);
  };

  const handleDownloadSrt = () => {
    const blob = new Blob([srtText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.settings.name.replace(/\s+/g, '_')}.srt`;
    a.click();
  };

  const handleDownloadProjectJson = () => {
    const dataStr = JSON.stringify(project, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.settings.name.replace(/\s+/g, '_')}.ytproj`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div
        className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{
          backgroundColor: 'var(--bg-surface-elevated)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        {/* Modal Top Header */}
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--bg-base)',
              }}
            >
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                Export Studio Production
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                {project.settings.name} • {project.settings.resolution.label}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center border-b border-[var(--border-subtle)] px-4 bg-[var(--bg-surface)] text-xs">
          <button
            onClick={() => setActiveTab('video')}
            className={`py-3 px-3 font-semibold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'video'
                ? 'border-[var(--accent-primary)] text-[var(--text-primary)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Master Video</span>
          </button>
          <button
            onClick={() => setActiveTab('chapters')}
            className={`py-3 px-3 font-semibold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'chapters'
                ? 'border-[var(--accent-primary)] text-[var(--text-primary)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>YouTube Chapters</span>
          </button>
          <button
            onClick={() => setActiveTab('subtitles')}
            className={`py-3 px-3 font-semibold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'subtitles'
                ? 'border-[var(--accent-primary)] text-[var(--text-primary)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>SRT Subtitles</span>
          </button>
          <button
            onClick={() => setActiveTab('project')}
            className={`py-3 px-3 font-semibold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'project'
                ? 'border-[var(--accent-primary)] text-[var(--text-primary)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Project File</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar text-xs">
          {/* TAB 1: MASTER VIDEO RENDER */}
          {activeTab === 'video' && (
            <div className="space-y-4">
              {!isExporting && !exportedVideoUrl && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                        Resolution
                      </label>
                      <select
                        value={exportResolution}
                        onChange={(e) => setExportResolution(e.target.value as any)}
                        className="w-full p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs"
                      >
                        <option value="match">Match Sequence ({project.settings.resolution.width}x{project.settings.resolution.height})</option>
                        <option value="1080p">1080p Full HD</option>
                        <option value="720p">720p HD</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                        Framerate
                      </label>
                      <select
                        value={exportFps}
                        onChange={(e) => setExportFps(Number(e.target.value))}
                        className="w-full p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs"
                      >
                        <option value={24}>24 fps (Cinematic)</option>
                        <option value={30}>30 fps (Standard)</option>
                        <option value={60}>60 fps (Smooth)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                        Bitrate Quality
                      </label>
                      <select
                        value={exportBitrate}
                        onChange={(e) => setExportBitrate(Number(e.target.value))}
                        className="w-full p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs"
                      >
                        <option value={8_000_000}>High (8 Mbps)</option>
                        <option value={5_000_000}>Standard (5 Mbps)</option>
                        <option value={2_500_000}>Fast Web (2.5 Mbps)</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-2">
                    <p className="font-semibold text-[var(--text-primary)]">
                      Rendering Pipeline Information
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      YT EDITOR will frame-render the multi-track timeline, composite video, color grade looks, and audio waveforms directly in your browser using high-performance HTML5 Canvas and MediaRecorder hardware encoding.
                    </p>
                  </div>

                  {exportError && (
                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
                      {exportError}
                    </div>
                  )}

                  <button
                    onClick={handleStartRender}
                    className="w-full py-3 rounded-xl font-bold flex items-center justify-center space-x-2 shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99]"
                    style={{
                      backgroundColor: 'var(--accent-primary)',
                      color: 'var(--bg-base)',
                    }}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Start Browser Video Render</span>
                  </button>
                </div>
              )}

              {/* Rendering in progress */}
              {isExporting && progress && (
                <div className="py-8 space-y-4 text-center">
                  <div className="w-12 h-12 rounded-full border-4 border-t-[var(--accent-primary)] border-neutral-700 animate-spin mx-auto" />
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-[var(--text-primary)]">
                      Encoding Sequence... {progress.percentage}%
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      {progress.statusText}
                    </p>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full bg-[var(--accent-primary)] transition-all duration-200"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Render Complete */}
              {exportedVideoUrl && (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center space-x-2">
                    <Check className="w-5 h-5 shrink-0" />
                    <div>
                      <p className="font-bold">Render Complete!</p>
                      <p className="text-[11px]">
                        Video encoded successfully into high-fidelity format.
                      </p>
                    </div>
                  </div>

                  {/* Video player preview */}
                  <div className="rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-black max-h-64 flex items-center justify-center">
                    <video
                      src={exportedVideoUrl}
                      controls
                      autoPlay
                      className="max-h-64 max-w-full"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleDownloadVideo}
                      className="flex-1 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 shadow-lg"
                      style={{
                        backgroundColor: 'var(--accent-primary)',
                        color: 'var(--bg-base)',
                      }}
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Video File</span>
                    </button>

                    <button
                      onClick={() => {
                        setExportedVideoUrl(null);
                        setProgress(null);
                      }}
                      className="px-4 py-3 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] font-medium"
                    >
                      Render Again
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: YOUTUBE CHAPTERS */}
          {activeTab === 'chapters' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-muted)]">
                  Formatted for YouTube description box with timestamps
                </span>
                <button
                  onClick={handleCopyChapters}
                  className="px-2.5 py-1 rounded bg-[var(--accent-primary)] text-[var(--bg-base)] text-xs font-semibold flex items-center space-x-1"
                >
                  {copiedChapters ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedChapters ? 'Copied!' : 'Copy Chapters'}</span>
                </button>
              </div>

              <textarea
                readOnly
                value={chaptersText}
                rows={8}
                className="w-full p-3 font-mono text-xs rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] outline-none"
              />
            </div>
          )}

          {/* TAB 3: SRT SUBTITLES */}
          {activeTab === 'subtitles' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-muted)]">
                  Standard SubRip (.SRT) subtitle file
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopySrt}
                    className="px-2.5 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-semibold flex items-center space-x-1"
                  >
                    {copiedSrt ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSrt ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={handleDownloadSrt}
                    className="px-2.5 py-1 rounded bg-[var(--accent-primary)] text-[var(--bg-base)] text-xs font-semibold flex items-center space-x-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .SRT</span>
                  </button>
                </div>
              </div>

              <textarea
                readOnly
                value={srtText || 'No text/dialogue clips found in project.'}
                rows={8}
                className="w-full p-3 font-mono text-xs rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] outline-none"
              />
            </div>
          )}

          {/* TAB 4: PROJECT FILE */}
          {activeTab === 'project' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-2">
                <h4 className="font-semibold text-[var(--text-primary)]">
                  Save & Archive Project JSON
                </h4>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Export your complete timeline, tracks, transforms, color grades, and text styling to a standalone <code className="text-[var(--accent-primary)] font-mono">.ytproj</code> JSON file for backup or sharing.
                </p>
                <button
                  onClick={handleDownloadProjectJson}
                  className="px-3 py-2 rounded-lg bg-[var(--accent-primary)] text-[var(--bg-base)] text-xs font-bold inline-flex items-center space-x-1.5 shadow"
                >
                  <HardDrive className="w-4 h-4" />
                  <span>Download Project File (.ytproj)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
