import React, { useState } from 'react';
import {
  Smartphone,
  Tv,
  Sparkles,
  ChevronDown,
  Plus,
  Layers,
  Check,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext.tsx';
import { type ProjectAspectRatio } from '../../services/productionProfileService.ts';

export const ProductionContextBar: React.FC = () => {
  const {
    activeProject,
    activeProfile,
    projects,
    selectProject,
    switchAspectRatio,
    createProject,
    setCommandPaletteOpen,
    setJarvisAssistantOpen,
    isJarvisAssistantOpen,
  } = useProject();

  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [ratioConfirmOpen, setRatioConfirmOpen] = useState(false);
  const [pendingRatio, setPendingRatio] = useState<ProjectAspectRatio | null>(null);

  const isPortrait = activeProfile.aspectRatio === '9:16';

  const handleRatioClick = (targetRatio: ProjectAspectRatio) => {
    if (targetRatio === activeProfile.aspectRatio) return;
    setPendingRatio(targetRatio);
    setRatioConfirmOpen(true);
  };

  const confirmRatioSwitch = () => {
    if (pendingRatio) {
      switchAspectRatio(pendingRatio);
    }
    setRatioConfirmOpen(false);
    setPendingRatio(null);
  };

  return (
    <>
      <div
        className="h-12 border-b px-3 sm:px-8 flex items-center justify-between text-xs font-mono select-none z-10 backdrop-blur-xl relative"
        style={{
          backgroundColor: 'rgba(9, 9, 13, 0.95)',
          borderColor: 'rgba(212, 175, 55, 0.2)',
        }}
      >
        {/* Subtle background tech grid line */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5 pointer-events-none" />

        {/* Left: Active Project Selector & Canonical Ratio HUD */}
        <div className="flex items-center space-x-2 sm:space-x-3 overflow-x-auto min-w-0 relative z-10">
          {/* Project Dropdown Trigger with Chamfer styling */}
          <div className="relative">
            <button
              onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold cursor-pointer transition-all bg-black/60 hover:border-amber-400 hover:bg-amber-500/10 text-white"
              style={{ borderColor: 'rgba(212, 175, 55, 0.35)' }}
            >
              <Layers className="w-3.5 h-3.5 text-[#f5d77f]" />
              <span className="truncate max-w-[120px] sm:max-w-[200px] tracking-wide">
                {activeProject.name}
              </span>
              <ChevronDown className="w-3 h-3 text-amber-400/70" />
            </button>

            {/* Dropdown Menu */}
            {projectDropdownOpen && (
              <div
                className="absolute left-0 mt-1 w-72 rounded-xl border shadow-2xl z-50 p-2 space-y-1.5 animate-in fade-in duration-100 backdrop-blur-2xl"
                style={{
                  backgroundColor: 'rgba(10, 10, 15, 0.96)',
                  borderColor: 'rgba(212, 175, 55, 0.4)',
                  boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.9), 0 0 15px rgba(212, 175, 55, 0.2)',
                }}
              >
                <div className="px-2 py-1 text-[10px] font-mono uppercase text-[#f5d77f] font-bold tracking-wider border-b border-amber-500/20">
                  // ACTIVE PRODUCTION PROJECTS
                </div>
                <div className="max-h-56 overflow-y-auto space-y-1 py-1">
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        selectProject(p.id);
                        setProjectDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs cursor-pointer transition-all ${
                        p.id === activeProject.id
                          ? 'border border-amber-400/60 bg-amber-500/15 text-white font-bold'
                          : 'border border-transparent hover:border-amber-500/20 hover:bg-amber-500/5 text-zinc-300'
                      }`}
                    >
                      <div className="truncate min-w-0 pr-2">
                        <div className="truncate font-sans font-medium">{p.name}</div>
                        <div className="text-[10px] font-mono text-amber-400/60">
                          {p.productionProfile?.aspectRatio || '9:16'} · {p.productionProfile?.frameWidth || 1080}×{p.productionProfile?.frameHeight || 1920}
                        </div>
                      </div>
                      {p.id === activeProject.id && <Check className="w-3.5 h-3.5 text-[#f5d77f] flex-shrink-0" />}
                    </button>
                  ))}
                </div>

                <div className="pt-1.5 border-t border-amber-500/20 space-y-1">
                  <button
                    onClick={() => {
                      createProject(`Project #${projects.length + 1}`, '9:16');
                      setProjectDropdownOpen(false);
                    }}
                    className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-amber-500/10 text-[#f5d77f] font-mono tracking-wider"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ NEW 9:16 VERTICAL SHORT</span>
                  </button>
                  <button
                    onClick={() => {
                      createProject(`Project #${projects.length + 1}`, '16:9');
                      setProjectDropdownOpen(false);
                    }}
                    className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-amber-500/10 text-[#f5d77f] font-mono tracking-wider"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ NEW 16:9 CINEMA FEATURE</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* FUTURISTIC COCKPIT 9:16 vs 16:9 RATIO SWITCH */}
          <div
            className="flex items-center p-0.5 rounded-lg border flex-shrink-0 bg-black/60"
            style={{ borderColor: 'rgba(212, 175, 55, 0.3)' }}
          >
            <button
              onClick={() => handleRatioClick('9:16')}
              title="Switch to 9:16 Portrait (1080x1920) for Shorts/Reels"
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                isPortrait
                  ? 'bg-gradient-to-r from-[#f5d77f] to-[#d4af37] text-black shadow-md shadow-amber-500/30'
                  : 'text-zinc-400 hover:text-amber-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>9:16</span>
              {isPortrait && <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />}
            </button>

            <button
              onClick={() => handleRatioClick('16:9')}
              title="Switch to 16:9 Cinema (1920x1080) for Standard YouTube"
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                !isPortrait
                  ? 'bg-gradient-to-r from-[#f5d77f] to-[#d4af37] text-black shadow-md shadow-amber-500/30'
                  : 'text-zinc-400 hover:text-amber-200'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>16:9</span>
              {!isPortrait && <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />}
            </button>
          </div>

          {/* Sequence Geometry & Telemetry Badge */}
          <div
            className="hidden md:flex items-center space-x-2 px-2.5 py-1 rounded-md text-[11px] font-mono border bg-black/40"
            style={{ borderColor: 'rgba(212, 175, 55, 0.25)', color: '#c4baa9' }}
          >
            <span className="text-[#f5d77f] font-bold">
              {activeProfile.frameWidth}×{activeProfile.frameHeight}
            </span>
            <span className="text-amber-500/40">::</span>
            <span>{activeProfile.frameRate}FPS</span>
            <span className="text-amber-500/40">::</span>
            <span className="uppercase text-zinc-400">{activeProfile.orientation}</span>
          </div>
        </div>

        {/* Right: Telemetry Status & JARVIS Advisor */}
        <div className="flex items-center space-x-2 sm:space-x-3 relative z-10">
          <div className="hidden lg:flex items-center space-x-2 text-[10px] font-mono text-zinc-400">
            <span>SEQUENCE // LOCKED</span>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-sm shadow-amber-400" />
          </div>

          {/* JARVIS Assistant Button */}
          <button
            onClick={() => setJarvisAssistantOpen(!isJarvisAssistantOpen)}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg border text-xs font-mono font-bold cursor-pointer transition-all ${
              isJarvisAssistantOpen
                ? 'jarvis-gold-btn'
                : 'border-amber-500/30 bg-black/50 text-[#f5d77f] hover:border-amber-300 hover:bg-amber-500/10'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-400" />
            <span className="hidden sm:inline">JARVIS ADVISOR</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Aspect Ratio Changes */}
      {ratioConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setRatioConfirmOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border p-6 shadow-2xl space-y-4 jarvis-hud-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl text-black bg-gradient-to-tr from-amber-500 to-yellow-300 shadow-md shadow-amber-400/30">
                {pendingRatio === '9:16' ? <Smartphone className="w-5 h-5" /> : <Tv className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase font-mono tracking-wider">
                  Confirm Ratio Transformation
                </h3>
                <p className="text-xs font-mono text-amber-400/80">
                  Switching to {pendingRatio} ({pendingRatio === '9:16' ? '1080×1920 Vertical' : '1920×1080 Cinema'})
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-amber-500/20 bg-black/60 text-xs leading-relaxed space-y-2 text-zinc-300">
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Non-destructive:</strong> Your approved script segments, research sources, and timeline clips remain fully intact.
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Automatic Propagation:</strong> Sequence framing recalculates to{' '}
                  <strong className="text-[#f5d77f]">
                    {pendingRatio === '9:16' ? '1080×1920 (9:16)' : '1920×1080 (16:9)'}
                  </strong>{' '}
                  across Prompts, Monitor Guides, and Export settings.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setRatioConfirmOpen(false)}
                className="px-3 py-1.5 rounded-xl border border-zinc-700 bg-black/40 text-xs text-zinc-300 hover:text-white hover:bg-white/5 cursor-pointer font-mono"
              >
                CANCEL
              </button>
              <button
                onClick={confirmRatioSwitch}
                className="px-4 py-1.5 rounded-xl text-xs font-bold jarvis-gold-btn cursor-pointer shadow-lg"
              >
                CONFIRM {pendingRatio}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
