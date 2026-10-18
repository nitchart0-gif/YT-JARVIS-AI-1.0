/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * J.A.R.V.I.S. Concentric Hologram Centerpiece
 * High-precision, lightweight SVG technical HUD interface matching the reference design.
 * Features concentric gold rings, segmented circular arcs, degree ticks, and pulsing luminous core.
 */

import React from 'react';
import { Sparkles, Shield, Film, Smartphone, Tv } from 'lucide-react';

interface JarvisHologramRingProps {
  aspectRatio: '9:16' | '16:9';
  projectName: string;
  resolution: string;
  frameRate: number;
  workflowStage: string;
  onRatioToggle?: () => void;
}

export const JarvisHologramRing: React.FC<JarvisHologramRingProps> = ({
  aspectRatio,
  projectName,
  resolution,
  frameRate,
  workflowStage,
  onRatioToggle,
}) => {
  const isPortrait = aspectRatio === '9:16';

  return (
    <div className="relative w-full max-w-[540px] aspect-square mx-auto flex items-center justify-center select-none">
      {/* Background radial gold glow bloom */}
      <div
        className="absolute inset-4 rounded-full pointer-events-none opacity-40 blur-3xl animate-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(245, 215, 127, 0.35) 0%, rgba(212, 175, 55, 0.15) 45%, transparent 70%)',
        }}
      />

      {/* Main SVG Holographic HUD Graphics */}
      <svg
        viewBox="0 0 600 600"
        className="w-full h-full relative z-10"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="goldBeam" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffea9f" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#d4af37" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#7a5c10" stopOpacity="0.2" />
          </linearGradient>

          <linearGradient id="coreGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fff2be" />
            <stop offset="50%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#4a3707" />
          </linearGradient>

          <radialGradient id="hologramCore" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255, 234, 159, 0.45)" />
            <stop offset="50%" stopColor="rgba(212, 175, 55, 0.12)" />
            <stop offset="100%" stopColor="rgba(8, 8, 12, 0.95)" />
          </radialGradient>

          {/* Glow filter */}
          <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="coreGlowIntense" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. OUTLINE DEGREES & CALIBRATION RING (Outer Radius: 285) */}
        <circle
          cx="300"
          cy="300"
          r="285"
          fill="none"
          stroke="rgba(212, 175, 55, 0.2)"
          strokeWidth="1"
          strokeDasharray="2 6"
        />

        {/* Compass Crosshair Lines */}
        <line x1="300" y1="10" x2="300" y2="35" stroke="#f5d77f" strokeWidth="2" filter="url(#goldGlow)" />
        <line x1="300" y1="565" x2="300" y2="590" stroke="#f5d77f" strokeWidth="2" filter="url(#goldGlow)" />
        <line x1="10" y1="300" x2="35" y2="300" stroke="#f5d77f" strokeWidth="2" filter="url(#goldGlow)" />
        <line x1="565" y1="300" x2="590" y2="300" stroke="#f5d77f" strokeWidth="2" filter="url(#goldGlow)" />

        {/* Diagonal Tech Markers */}
        <line x1="95" y1="95" x2="115" y2="115" stroke="rgba(212, 175, 55, 0.4)" strokeWidth="1.5" />
        <line x1="505" y1="95" x2="485" y2="115" stroke="rgba(212, 175, 55, 0.4)" strokeWidth="1.5" />
        <line x1="95" y1="505" x2="115" y2="485" stroke="rgba(212, 175, 55, 0.4)" strokeWidth="1.5" />
        <line x1="505" y1="505" x2="485" y2="485" stroke="rgba(212, 175, 55, 0.4)" strokeWidth="1.5" />

        {/* Outer Coordinate Labels */}
        <text x="300" y="48" fill="#f5d77f" fontSize="10" fontFamily="monospace" textAnchor="middle" letterSpacing="2">
          000° // NORTH
        </text>
        <text x="555" y="304" fill="rgba(212, 175, 55, 0.65)" fontSize="9" fontFamily="monospace" textAnchor="end" letterSpacing="1">
          090° [E]
        </text>
        <text x="300" y="555" fill="rgba(212, 175, 55, 0.65)" fontSize="9" fontFamily="monospace" textAnchor="middle" letterSpacing="1">
          180° [S]
        </text>
        <text x="45" y="304" fill="rgba(212, 175, 55, 0.65)" fontSize="9" fontFamily="monospace" textAnchor="start" letterSpacing="1">
          270° [W]
        </text>

        {/* 2. LAYER 2: SLOW ROTATING SEGMENTED RING (Radius: 260) */}
        <g className="animate-jarvis-spin-slow origin-center">
          <circle
            cx="300"
            cy="300"
            r="260"
            fill="none"
            stroke="rgba(212, 175, 55, 0.35)"
            strokeWidth="1.5"
            strokeDasharray="40 18 10 18 6 18"
          />
          {/* Segment brackets */}
          <path
            d="M 300 40 A 260 260 0 0 1 525 170"
            fill="none"
            stroke="#f5d77f"
            strokeWidth="3.5"
            filter="url(#goldGlow)"
            strokeLinecap="round"
          />
          <path
            d="M 300 560 A 260 260 0 0 1 75 430"
            fill="none"
            stroke="#f5d77f"
            strokeWidth="3.5"
            filter="url(#goldGlow)"
            strokeLinecap="round"
          />
        </g>

        {/* 3. LAYER 3: COUNTER-ROTATING TECHNICAL RING (Radius: 225) */}
        <g className="animate-jarvis-spin-reverse origin-center">
          <circle
            cx="300"
            cy="300"
            r="225"
            fill="none"
            stroke="rgba(245, 215, 127, 0.45)"
            strokeWidth="2"
            strokeDasharray="4 8"
          />
          <circle
            cx="300"
            cy="300"
            r="215"
            fill="none"
            stroke="rgba(212, 175, 55, 0.2)"
            strokeWidth="1"
          />
          {/* Precision notch markers */}
          <path
            d="M 300 75 L 300 85 M 300 515 L 300 525 M 85 300 L 75 300 M 515 300 L 525 300"
            stroke="#f5d77f"
            strokeWidth="2.5"
          />
        </g>

        {/* 4. LAYER 4: MID RADIUS GEOMETRIC RING (Radius: 180) */}
        <g className="animate-jarvis-spin-mid origin-center">
          <circle
            cx="300"
            cy="300"
            r="180"
            fill="none"
            stroke="url(#goldBeam)"
            strokeWidth="2"
            strokeDasharray="120 40 80 40"
          />
          {/* Orbiting Tech Node Dots */}
          <circle cx="480" cy="300" r="4.5" fill="#fff2be" filter="url(#goldGlow)" />
          <circle cx="120" cy="300" r="4.5" fill="#fff2be" filter="url(#goldGlow)" />
          <circle cx="300" cy="120" r="3.5" fill="#f5d77f" />
          <circle cx="300" cy="480" r="3.5" fill="#f5d77f" />
        </g>

        {/* 5. LAYER 5: INNER LUMINOUS GOLD RING (Radius: 135) */}
        <circle
          cx="300"
          cy="300"
          r="135"
          fill="none"
          stroke="rgba(212, 175, 55, 0.28)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        <circle
          cx="300"
          cy="300"
          r="125"
          fill="none"
          stroke="#f5d77f"
          strokeWidth="3"
          filter="url(#goldGlow)"
          strokeDasharray="160 30 160 30"
          className="animate-pulse"
        />

        {/* 6. CENTRAL CORE APERTURE (Radius: 105) */}
        <circle
          cx="300"
          cy="300"
          r="105"
          fill="url(#hologramCore)"
          stroke="#d4af37"
          strokeWidth="2"
          filter="url(#coreGlowIntense)"
        />

        {/* Inner concentric ring */}
        <circle
          cx="300"
          cy="300"
          r="82"
          fill="none"
          stroke="rgba(245, 215, 127, 0.4)"
          strokeWidth="1.5"
          strokeDasharray="8 6"
        />

        {/* Concentric Center Reactor Core */}
        <circle
          cx="300"
          cy="300"
          r="55"
          fill="rgba(8, 8, 12, 0.95)"
          stroke="#f5d77f"
          strokeWidth="2.5"
          filter="url(#goldGlow)"
        />
      </svg>

      {/* Central Interactive Content / Telemetry Display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto z-20 text-center px-4">
        {/* Subtle Kicker */}
        <div className="flex items-center space-x-1.5 text-[9px] font-mono tracking-widest text-amber-300 uppercase mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
          <span>J.A.R.V.I.S. CORE</span>
        </div>

        {/* Canonical Ratio Badge (Interactive click toggles 9:16 / 16:9) */}
        <button
          onClick={onRatioToggle}
          title="Click to toggle production aspect ratio"
          className="group flex items-center space-x-1.5 px-3 py-1 rounded-full border border-amber-400/50 bg-black/60 backdrop-blur-md text-amber-200 hover:border-amber-300 hover:scale-105 transition-all cursor-pointer shadow-lg shadow-amber-500/20 my-1"
        >
          {isPortrait ? (
            <Smartphone className="w-3.5 h-3.5 text-amber-400 group-hover:animate-bounce" />
          ) : (
            <Tv className="w-3.5 h-3.5 text-amber-400 group-hover:animate-bounce" />
          )}
          <span className="text-xs font-mono font-black tracking-wider text-white">
            {aspectRatio}
          </span>
          <span className="text-[9px] font-mono text-amber-400 uppercase">
            {isPortrait ? 'PORTRAIT' : 'CINEMA'}
          </span>
        </button>

        {/* Project Name & Stats Readout */}
        <div className="mt-1 max-w-[190px]">
          <h3 className="text-xs font-bold text-white tracking-wide truncate" title={projectName}>
            {projectName}
          </h3>
          <p className="text-[10px] font-mono text-zinc-400 mt-0.5">
            {resolution} · {frameRate}FPS
          </p>
        </div>

        {/* Pipeline Readiness Pulse */}
        <div className="mt-2 text-[9px] font-mono px-2 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-300 tracking-wider">
          STAGE: {workflowStage.toUpperCase()}
        </div>
      </div>
    </div>
  );
};
