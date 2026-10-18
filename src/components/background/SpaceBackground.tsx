import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../theme/ThemeContext.tsx';

interface Star {
  x: number;
  y: number;
  z: number;
  radius: number;
  baseAlpha: number;
  alpha: number;
  twinkleSpeed: number;
  color: string;
}

export const SpaceBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { resolvedMode, preset, currentPresetDef } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let isTabVisible = true;
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    // Check reduced motion preference
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Responsive star count
    const isMobile = window.innerWidth < 768;
    const starCount = isMobile ? 65 : 180;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      // Gentle parallax target (-1 to 1)
      targetMouseX = (e.clientX / width - 0.5) * 2;
      targetMouseY = (e.clientY / height - 0.5) * 2;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Handle tab visibility to save CPU
    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible && !prefersReducedMotion) {
        lastTime = performance.now();
        render();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Color palette based on theme and mode
    const getStarColors = () => {
      if (resolvedMode === 'light') {
        // Soft subtle slate/charcoal in light mode
        return ['#94a3b8', '#64748b', '#475569'];
      }
      if (preset === 'jarvis-gold') {
        // Metallic gold, warm champagne, and crystalline amber stars
        return ['#ffffff', '#fef9c3', '#fef08a', '#D4AF37', '#f5d77f'];
      }
      if (preset === 'carbon-black') {
        // Pure crisp white stars and silver highlights on true black
        return ['#ffffff', '#f4f4f5', '#e4e4e7', '#d4d4d8'];
      }
      if (preset === 'midnight-blue') {
        // Deep electric blue and cyan stars
        return ['#ffffff', '#e0f2fe', '#bae6fd', '#38bdf8'];
      }
      if (preset === 'dark-slate') {
        // Modern graphite and vibrant emerald highlights
        return ['#ffffff', '#d1fae5', '#a7f3d0', '#10b981'];
      }
      // default light-mode / fallthrough
      return ['#ffffff', '#e0e7ff', '#c7d2fe', '#6366f1'];
    };

    const colors = getStarColors();

    // Initialize stars with depth
    const stars: Star[] = [];
    for (let i = 0; i < starCount; i++) {
      const z = Math.random(); // 0 (far) to 1 (near)
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z,
        radius: 0.6 + z * 1.4,
        baseAlpha: resolvedMode === 'light' ? 0.2 + z * 0.35 : 0.3 + z * 0.65,
        alpha: 0.5,
        twinkleSpeed: 0.005 + Math.random() * 0.015,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let lastTime = performance.now();
    let driftOffset = 0;

    // Get concrete theme-defined RGBA color strings (HTML5 Canvas addColorStop cannot parse CSS var() expressions)
    const nebulaColor1 =
      currentPresetDef?.vars?.[resolvedMode]?.['--nebula-color-1'] ||
      (resolvedMode === 'light' ? 'rgba(79, 70, 229, 0.04)' : 'rgba(99, 102, 241, 0.12)');
    const nebulaColor2 =
      currentPresetDef?.vars?.[resolvedMode]?.['--nebula-color-2'] ||
      (resolvedMode === 'light' ? 'rgba(59, 130, 246, 0.03)' : 'rgba(59, 130, 246, 0.08)');

    const render = () => {
      if (!isTabVisible) return;

      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Smooth mouse damping
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // Nebula 1 (top-right)
      const grad1 = ctx.createRadialGradient(
        width * 0.85 + mouseX * 40,
        height * 0.15 + mouseY * 40,
        10,
        width * 0.85,
        height * 0.15,
        width * 0.45
      );
      grad1.addColorStop(0, nebulaColor1);
      grad1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      // Nebula 2 (bottom-left)
      const grad2 = ctx.createRadialGradient(
        width * 0.15 - mouseX * 30,
        height * 0.85 - mouseY * 30,
        10,
        width * 0.15,
        height * 0.85,
        width * 0.4
      );
      grad2.addColorStop(0, nebulaColor2);
      grad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      // Draw and update stars
      driftOffset += delta * 4;

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        // Move star subtly based on depth z and drift
        let currentY = star.y - driftOffset * (star.z * 1.5 + 0.2);
        if (currentY < 0) {
          currentY = height + (currentY % height);
        }

        // Apply gentle parallax
        const px = star.x + mouseX * 25 * star.z;
        const py = currentY + mouseY * 25 * star.z;

        // Twinkle effect
        const timeFactor = now * star.twinkleSpeed;
        const twinkle = Math.sin(timeFactor + i) * 0.25;
        const alpha = Math.max(0.1, Math.min(1, star.baseAlpha + twinkle));

        ctx.beginPath();
        ctx.arc(px, py, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = alpha;
        ctx.fill();

        // Subtle soft glow on closer stars
        if (star.z > 0.8 && resolvedMode === 'dark') {
          ctx.beginPath();
          ctx.arc(px, py, star.radius * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = star.color;
          ctx.globalAlpha = alpha * 0.18;
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;

      // If user has reduced motion preference, render static single frame
      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    // First render
    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [resolvedMode, preset, currentPresetDef]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-1000"
      style={{
        opacity: resolvedMode === 'light' ? 0.45 : 0.95,
      }}
      aria-hidden="true"
    />
  );
};
