import React, { useState, useEffect } from 'react';
import { type User } from 'firebase/auth';
import {
  Clapperboard,
  Film,
  Search,
  Image as ImageIcon,
  Scissors,
  FileText,
  KeyRound,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Database,
  CheckCircle2,
  HardDrive,
  LogIn,
  Settings,
  Smartphone,
  Tv,
  Plus,
  Layers,
  Zap,
  Play,
  RotateCcw,
  ShieldCheck,
  Check,
  Cpu,
  Activity,
  Terminal,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext.tsx';
import { DriveStatusCard } from '../DriveStatusCard.tsx';
import { type NavigationPageId } from '../../navigation.ts';
import { type ProjectAspectRatio } from '../../services/productionProfileService.ts';
import { JarvisHologramRing } from './JarvisHologramRing.tsx';
import { getSavedSources, subscribeSources, type SourceItem } from '../../services/sourceRepository.ts';
import { api, type GeminiKeyStatusResponse } from '../../services/api.ts';
import { QuotaRecoveryBanner } from '../common/QuotaRecoveryBanner.tsx';

interface OverviewCommandCenterProps {
  user: User | null;
  onSignIn?: () => void;
  onNavigate: (page: NavigationPageId) => void;
  setDriveConnected: (connected: boolean) => void;
}

export const OverviewCommandCenter: React.FC<OverviewCommandCenterProps> = ({
  user,
  onSignIn,
  onNavigate,
  setDriveConnected,
}) => {
  const {
    activeProject,
    activeProfile,
    projects,
    selectProject,
    switchAspectRatio,
    createProject,
    setCommandPaletteOpen,
    setJarvisAssistantOpen,
  } = useProject();

  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectRatio, setNewProjectRatio] = useState<ProjectAspectRatio>('9:16');

  // Real saved sources count
  const effectiveUserId = user ? user.uid : 'local_creator';
  const [savedSources, setSavedSources] = useState<SourceItem[]>(() => getSavedSources(effectiveUserId));
  const [keyStatus, setKeyStatus] = useState<GeminiKeyStatusResponse | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeSources(effectiveUserId, (items) => {
      setSavedSources(items);
    });

    api.getKeyStatus(effectiveUserId)
      .then(setKeyStatus)
      .catch(() => {});

    return () => unsubscribe();
  }, [effectiveUserId]);

  const isPortrait = activeProfile.aspectRatio === '9:16';
  const scriptSegmentsCount = activeProject?.scriptData?.segments?.length || 0;

  const handleCreateNewProject = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = newProjectName.trim() || (newProjectRatio === '9:16' ? 'New Vertical Short' : 'New Cinema Feature');
    createProject(finalName, newProjectRatio);
    setNewProjectName('');
    setNewProjectModalOpen(false);
    onNavigate('scripts');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Real-time Quota Awareness & Automatic Recovery Banner */}
      <QuotaRecoveryBanner
        onNavigateToConfig={() => onNavigate('api-keys')}
        onRetry={() => onNavigate('scripts')}
      />

      {/* 1. J.A.R.V.I.S. SIGNATURE HOLOGRAPHIC COMMAND CENTER */}
      <section className="relative rounded-3xl border border-amber-500/25 bg-gradient-to-b from-[#0a0a0f] via-[#050508] to-[#08080c] p-6 sm:p-8 shadow-2xl backdrop-blur-2xl overflow-hidden">
        {/* Subtle background tech grid */}
        <div className="absolute inset-0 jarvis-grid-bg opacity-30 pointer-events-none" />

        {/* Ambient Top Glow Beam */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[1.5px] bg-gradient-to-r from-transparent via-[#f5d77f] to-transparent opacity-80" />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[550px] h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header HUD Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-amber-500/20 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg border border-amber-400/50 bg-amber-500/10 flex items-center justify-center text-[#f5d77f] shadow-md shadow-amber-500/20">
              <Cpu className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2 text-[10px] font-mono tracking-widest text-[#f5d77f] uppercase">
                <span>SYS.COMMAND_CENTER</span>
                <span className="text-zinc-500">//</span>
                <span className="text-zinc-400">STATUS: OPTIMAL</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-white font-mono">
                J.A.R.V.I.S. AI CREATOR CORE
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono">
            <div className="px-3 py-1 rounded-lg border border-amber-500/30 bg-black/60 text-amber-300 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
              <span>RATIO: {activeProfile.aspectRatio} ({activeProfile.orientation.toUpperCase()})</span>
            </div>
            <button
              onClick={() => setNewProjectModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold jarvis-gold-btn cursor-pointer shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>NEW PROJECT</span>
            </button>
          </div>
        </div>

        {/* Triple HUD Layout: Left Telemetry | Center Hologram Centerpiece | Right Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center mt-6 relative z-10">
          {/* Left Panel: Active Project Configuration */}
          <div className="lg:col-span-4 space-y-4">
            <div className="jarvis-hud-box rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 border-b border-amber-500/20 pb-2">
                <span>ACTIVE PRODUCTION TARGET</span>
                <span className="text-amber-400 font-bold">PROFILE #01</span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white tracking-wide truncate" title={activeProject.name}>
                  {activeProject.name}
                </h3>
                <div className="flex items-center space-x-2 text-xs font-mono text-amber-300/80 mt-1">
                  <span>{activeProfile.frameWidth}×{activeProfile.frameHeight}</span>
                  <span>·</span>
                  <span>{activeProfile.frameRate} FPS</span>
                  <span>·</span>
                  <span className="capitalize">{activeProfile.targetPlatform.replace('_', ' ')}</span>
                </div>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                Global production profile is strictly bound to <strong className="text-white">{activeProfile.aspectRatio}</strong>. Scene composition, safe guides, and timeline sequence dimensions synchronize automatically.
              </p>

              {/* Segmented Cockpit Ratio Controls */}
              <div className="pt-2">
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1.5">
                  Cockpit Aspect Ratio Selector:
                </label>
                <div className="grid grid-cols-2 gap-2 bg-black/60 p-1.5 rounded-xl border border-amber-500/30">
                  <button
                    onClick={() => switchAspectRatio('9:16')}
                    className={`flex flex-col items-center py-2 px-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      isPortrait
                        ? 'bg-gradient-to-r from-[#f5d77f] to-[#d4af37] text-black shadow-md shadow-amber-500/30'
                        : 'text-zinc-400 hover:text-amber-200'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 mb-1" />
                    <span>9:16 VERTICAL</span>
                    <span className="text-[9px] font-normal opacity-80">1080×1920</span>
                  </button>

                  <button
                    onClick={() => switchAspectRatio('16:9')}
                    className={`flex flex-col items-center py-2 px-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      !isPortrait
                        ? 'bg-gradient-to-r from-[#f5d77f] to-[#d4af37] text-black shadow-md shadow-amber-500/30'
                        : 'text-zinc-400 hover:text-amber-200'
                    }`}
                  >
                    <Tv className="w-4 h-4 mb-1" />
                    <span>16:9 CINEMA</span>
                    <span className="text-[9px] font-normal opacity-80">1920×1080</span>
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => onNavigate('scripts')}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold jarvis-gold-btn cursor-pointer shadow-lg"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>LAUNCH SCRIPT GENERATOR</span>
                </button>
                <button
                  onClick={() => onNavigate('yt-editor')}
                  className="w-full flex items-center justify-center space-x-2 py-2 rounded-xl border border-amber-500/30 bg-black/40 text-amber-300 hover:bg-amber-500/10 text-xs font-mono font-semibold transition-all cursor-pointer"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>OPEN MULTI-TRACK TIMELINE</span>
                </button>
              </div>
            </div>
          </div>

          {/* Centerpiece: The Large J.A.R.V.I.S. Hologram Ring */}
          <div className="lg:col-span-4 flex items-center justify-center py-2">
            <JarvisHologramRing
              aspectRatio={activeProfile.aspectRatio}
              projectName={activeProject.name}
              resolution={`${activeProfile.frameWidth}×${activeProfile.frameHeight}`}
              frameRate={activeProfile.frameRate}
              workflowStage={activeProfile.aspectRatio === '9:16' ? 'Vertical Short' : 'Widescreen'}
              onRatioToggle={() => switchAspectRatio(isPortrait ? '16:9' : '9:16')}
            />
          </div>

          {/* Right Panel: Real Project Activity & Telemetry Rail */}
          <div className="lg:col-span-4 space-y-4">
            <div className="jarvis-hud-box rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 border-b border-amber-500/20 pb-2">
                <span>PIPELINE READINESS TELEMETRY</span>
                <span className="flex items-center space-x-1 text-emerald-400">
                  <Activity className="w-3 h-3 animate-pulse" />
                  <span>REAL-TIME</span>
                </span>
              </div>

              {/* Metric 1: Research Sources */}
              <div className="p-3 rounded-xl border border-amber-500/20 bg-black/50 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Research Library</div>
                    <div className="text-[10px] font-mono text-zinc-400">Persistent Source Repo</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold font-mono text-[#f5d77f]">
                    {savedSources.length}
                  </span>
                  <div className="text-[9px] font-mono text-zinc-500">SAVED</div>
                </div>
              </div>

              {/* Metric 2: Script Status */}
              <div className="p-3 rounded-xl border border-amber-500/20 bg-black/50 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    <Clapperboard className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Current Script</div>
                    <div className="text-[10px] font-mono text-zinc-400">8s Structured Segments</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold font-mono text-[#f5d77f]">
                    {scriptSegmentsCount > 0 ? `${scriptSegmentsCount} SCENES` : 'READY'}
                  </span>
                  <div className="text-[9px] font-mono text-zinc-500">
                    {activeProject?.scriptData ? `${activeProject.scriptData.durationSeconds}s` : 'IDLE'}
                  </div>
                </div>
              </div>

              {/* Metric 3: Sequence Resolution */}
              <div className="p-3 rounded-xl border border-amber-500/20 bg-black/50 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400">
                    <Film className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Video Prompts</div>
                    <div className="text-[10px] font-mono text-zinc-400">Google Flow &amp; Veo</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold font-mono text-purple-300">
                    {activeProfile.aspectRatio} LOCKED
                  </span>
                  <div className="text-[9px] font-mono text-zinc-500">1:1 MAPPING</div>
                </div>
              </div>

              {/* Assistant Shortcut */}
              <button
                onClick={() => setJarvisAssistantOpen(true)}
                className="w-full flex items-center justify-center space-x-2 py-2 rounded-xl text-xs font-mono font-semibold border border-amber-500/30 bg-black/50 text-[#f5d77f] hover:bg-amber-500/10 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>CONSULT JARVIS ADVISOR</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CONNECTED 6-STAGE PRODUCTION PIPELINE MATRIX */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <div className="flex items-center space-x-2 text-[10px] font-mono text-[#f5d77f] tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>WORKFLOW PIPELINE // CONNECTED</span>
            </div>
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white font-mono">
              YOUTUBE PRODUCTION MATRIX
            </h2>
          </div>

          <span className="text-xs font-mono text-amber-400/80 px-2.5 py-1 rounded border border-amber-500/20 bg-black/60">
            6 STAGES ACTIVE
          </span>
        </div>

        {/* 6 High-Fidelity Sci-Fi HUD Module Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Sources */}
          <div
            onClick={() => onNavigate('sources')}
            className="jarvis-hud-box rounded-2xl p-5 cursor-pointer group transition-all hover:scale-[1.01] hover:border-amber-400/60"
          >
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
              <span className="text-[10px] font-mono font-bold text-amber-400 tracking-wider">
                STAGE 01 // RESEARCH
              </span>
              <span className="text-[10px] font-mono text-zinc-500">LIBRARY: {savedSources.length}</span>
            </div>
            <div className="flex items-center space-x-3 my-3">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-[#f5d77f] transition-colors">
                  Sources &amp; Research Hub
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Articles, research, notes with verified local/cloud sync
                </p>
              </div>
            </div>
            <div className="pt-2 flex items-center justify-between text-xs font-mono text-amber-400/90 group-hover:text-[#f5d77f]">
              <span>OPEN RESEARCH REPO</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Script Generator */}
          <div
            onClick={() => onNavigate('scripts')}
            className="jarvis-hud-box rounded-2xl p-5 cursor-pointer group transition-all hover:scale-[1.01] hover:border-amber-400/60"
          >
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
              <span className="text-[10px] font-mono font-bold text-amber-400 tracking-wider">
                STAGE 02 // SCRIPTING
              </span>
              <span className="text-[10px] font-mono text-zinc-500">12 MODES</span>
            </div>
            <div className="flex items-center space-x-3 my-3">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 group-hover:scale-105 transition-transform">
                <Clapperboard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-[#f5d77f] transition-colors">
                  AI Script Generator
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Locked gemini-3.8-flash, exact 8s timing &amp; Hindi/Gujarati/English
                </p>
              </div>
            </div>
            <div className="pt-2 flex items-center justify-between text-xs font-mono text-amber-400/90 group-hover:text-[#f5d77f]">
              <span>GENERATE SCRIPTS</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Video Prompt Builder */}
          <div
            onClick={() => onNavigate('video-prompts')}
            className="jarvis-hud-box rounded-2xl p-5 cursor-pointer group transition-all hover:scale-[1.01] hover:border-amber-400/60"
          >
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
              <span className="text-[10px] font-mono font-bold text-amber-400 tracking-wider">
                STAGE 03 // VISUALS
              </span>
              <span className="text-[10px] font-mono text-zinc-500">GOOGLE FLOW</span>
            </div>
            <div className="flex items-center space-x-3 my-3">
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 group-hover:scale-105 transition-transform">
                <Film className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-[#f5d77f] transition-colors">
                  Video Prompt Builder
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  1:1 prompt mapping for Google Flow &amp; Veo in {activeProfile.aspectRatio}
                </p>
              </div>
            </div>
            <div className="pt-2 flex items-center justify-between text-xs font-mono text-amber-400/90 group-hover:text-[#f5d77f]">
              <span>SYNTHESIZE PROMPTS</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: SEO Studio */}
          <div
            onClick={() => onNavigate('seo-studio')}
            className="jarvis-hud-box rounded-2xl p-5 cursor-pointer group transition-all hover:scale-[1.01] hover:border-amber-400/60"
          >
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
              <span className="text-[10px] font-mono font-bold text-amber-400 tracking-wider">
                STAGE 04 // OPTIMIZATION
              </span>
              <span className="text-[10px] font-mono text-zinc-500">&le;500 CHAR TAGS</span>
            </div>
            <div className="flex items-center space-x-3 my-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 group-hover:scale-105 transition-transform">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-[#f5d77f] transition-colors">
                  YouTube SEO Studio
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  High-CTR titles, optimized descriptions, verified keywords
                </p>
              </div>
            </div>
            <div className="pt-2 flex items-center justify-between text-xs font-mono text-amber-400/90 group-hover:text-[#f5d77f]">
              <span>OPTIMIZE METADATA</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 5: Thumbnail Studio */}
          <div
            onClick={() => onNavigate('thumbnail-studio')}
            className="jarvis-hud-box rounded-2xl p-5 cursor-pointer group transition-all hover:scale-[1.01] hover:border-amber-400/60"
          >
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
              <span className="text-[10px] font-mono font-bold text-amber-400 tracking-wider">
                STAGE 05 // PACKAGING
              </span>
              <span className="text-[10px] font-mono text-zinc-500">4K CONCEPTS</span>
            </div>
            <div className="flex items-center space-x-3 my-3">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 group-hover:scale-105 transition-transform">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-[#f5d77f] transition-colors">
                  Thumbnail Studio
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Cinematic visual designer with 16:9 canvas and prompt synthesis
                </p>
              </div>
            </div>
            <div className="pt-2 flex items-center justify-between text-xs font-mono text-amber-400/90 group-hover:text-[#f5d77f]">
              <span>DESIGN THUMBNAILS</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 6: YT Editor */}
          <div
            onClick={() => onNavigate('yt-editor')}
            className="jarvis-hud-box rounded-2xl p-5 cursor-pointer group transition-all hover:scale-[1.01] hover:border-amber-400/60"
          >
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
              <span className="text-[10px] font-mono font-bold text-amber-400 tracking-wider">
                STAGE 06 // ASSEMBLY
              </span>
              <span className="text-[10px] font-mono text-zinc-500">{activeProfile.frameWidth}×{activeProfile.frameHeight}</span>
            </div>
            <div className="flex items-center space-x-3 my-3">
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 group-hover:scale-105 transition-transform">
                <Scissors className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-[#f5d77f] transition-colors">
                  YT Editor Studio
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Multi-track timeline, audio tracks, preview monitor &amp; export
                </p>
              </div>
            </div>
            <div className="pt-2 flex items-center justify-between text-xs font-mono text-amber-400/90 group-hover:text-[#f5d77f]">
              <span>LAUNCH TIMELINE</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* 3. CLOUD STORAGE & API CONFIGURATION HUD */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gemini API Key Box */}
        <div className="jarvis-hud-box rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-white">
                <KeyRound className="w-4 h-4 text-[#f5d77f]" />
                <span>GEMINI AI ENGINE PROTOCOL</span>
              </div>
              {keyStatus?.configured ? (
                <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>ACTIVE & SECURED</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>SETUP REQUIRED</span>
                </div>
              )}
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Mandatory model <strong className="text-white font-mono">gemini-3.8-flash</strong> secured via AES-256-GCM authenticated server-side encryption. Generates scripts, Google Flow prompts, and YouTube metadata using your personal free-tier quota (15 RPM • 1,500 RPD).
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {keyStatus?.configured && keyStatus.maskedKey ? (
                <div className="px-2.5 py-1 rounded-lg bg-black/50 border border-emerald-500/30 text-[11px] font-mono text-emerald-400 flex items-center space-x-1.5">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>{keyStatus.maskedKey}</span>
                </div>
              ) : null}
              {user ? (
                <div className="px-2.5 py-1 rounded-lg bg-black/50 border border-zinc-800 text-[11px] font-mono text-zinc-400 truncate max-w-[200px]" title={user.email || user.uid}>
                  Identity: <span className="text-zinc-200">{user.email || 'Google User'}</span>
                </div>
              ) : (
                <div className="px-2.5 py-1 rounded-lg bg-black/50 border border-zinc-800 text-[11px] font-mono text-amber-300/80">
                  Mode: Local Workspace
                </div>
              )}
            </div>
          </div>

          <div>
            <button
              onClick={() => onNavigate('api-keys')}
              className={`w-full flex items-center justify-center space-x-2 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                keyStatus?.configured
                  ? 'border border-amber-500/30 bg-black/50 text-[#f5d77f] hover:bg-amber-500/10'
                  : 'bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-bold hover:brightness-105 shadow'
              }`}
            >
              <span>{keyStatus?.configured ? 'MANAGE CREDENTIALS / TEST PROBE' : 'CONNECT FREE GEMINI KEY (1-CLICK)'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Google Drive Export (Optional) */}
        <div className="jarvis-hud-box rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-white">
                <HardDrive className="w-4 h-4 text-blue-400" />
                <span>GOOGLE DRIVE STORYBOARD SYNC</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">OAUTH 2.0</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Synchronize video production packages, scripts, and Google Flow visual prompts directly to your authorized Google Drive repository.
            </p>
          </div>
          <div>
            <DriveStatusCard onDriveStatusChange={setDriveConnected} />
          </div>
        </div>
      </section>

      {/* New Project Modal */}
      {newProjectModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setNewProjectModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border p-6 shadow-2xl space-y-4 jarvis-hud-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl font-bold text-black bg-gradient-to-tr from-amber-400 to-yellow-200 shadow-md shadow-amber-400/30">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase font-mono tracking-wider">
                  Initialize Creator Project
                </h3>
                <p className="text-xs font-mono text-amber-400/80">
                  Authoritative Aspect Ratio &amp; Sequence Setup
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateNewProject} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono uppercase text-zinc-300">
                  Project Title
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. 10 Quantum AI Breakthroughs"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-amber-500/30 bg-black/70 text-xs text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 placeholder:text-zinc-500"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-zinc-300">
                  Sequence Aspect Ratio
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewProjectRatio('9:16')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      newProjectRatio === '9:16'
                        ? 'border-amber-400 bg-amber-500/15 shadow-md shadow-amber-500/20'
                        : 'border-zinc-800 bg-black/50 hover:border-amber-500/30'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 font-bold text-xs mb-1 text-[#f5d77f]">
                      <Smartphone className="w-4 h-4" />
                      <span>9:16 Vertical</span>
                    </div>
                    <div className="text-[11px] font-mono text-zinc-300">1080×1920 HD</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">Shorts, Reels, TikTok</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewProjectRatio('16:9')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      newProjectRatio === '16:9'
                        ? 'border-amber-400 bg-amber-500/15 shadow-md shadow-amber-500/20'
                        : 'border-zinc-800 bg-black/50 hover:border-amber-500/30'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 font-bold text-xs mb-1 text-[#f5d77f]">
                      <Tv className="w-4 h-4" />
                      <span>16:9 Cinema</span>
                    </div>
                    <div className="text-[11px] font-mono text-zinc-300">1920×1080 HD</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">Standard YouTube</div>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewProjectModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-zinc-700 bg-black/40 text-xs text-zinc-300 hover:text-white cursor-pointer font-mono"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold jarvis-gold-btn cursor-pointer shadow-lg"
                >
                  CREATE &amp; LAUNCH
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
