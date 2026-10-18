import React, { useEffect, useState } from 'react';
import {
  Clock,
  AlertTriangle,
  RefreshCw,
  KeyRound,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { quotaManager, type QuotaStatusSnapshot, type PendingTaskData } from '../../services/quotaManager.ts';

interface QuotaRecoveryBannerProps {
  onRetry?: (pendingTask: PendingTaskData | null) => void;
  onNavigateToConfig?: () => void;
  onUseOfflineDemo?: () => void;
  isGenerating?: boolean;
}

export const QuotaRecoveryBanner: React.FC<QuotaRecoveryBannerProps> = ({
  onRetry,
  onNavigateToConfig,
  onUseOfflineDemo,
  isGenerating = false,
}) => {
  const [snapshot, setSnapshot] = useState<QuotaStatusSnapshot>(() => quotaManager.getSnapshot());

  useEffect(() => {
    const unsubscribe = quotaManager.subscribe((newSnap) => {
      setSnapshot(newSnap);
    });
    return () => unsubscribe();
  }, []);

  if (snapshot.state === 'normal' && !snapshot.pendingTask) {
    return null;
  }

  const { state, remainingCooldownSeconds, totalCooldownSeconds, resetTimeFormatted, message, suggestedAction, pendingTask } = snapshot;

  const percentProgress =
    totalCooldownSeconds > 0
      ? Math.max(0, Math.min(100, Math.round(((totalCooldownSeconds - remainingCooldownSeconds) / totalCooldownSeconds) * 100)))
      : 100;

  return (
    <div className="rounded-2xl border p-4 sm:p-5 shadow-2xl backdrop-blur-md relative overflow-hidden transition-all bg-slate-950/90 border-amber-500/30 text-amber-100">
      {/* Ambient Top Glow */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500/20 via-amber-400 to-amber-500/20" />

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex-shrink-0 mt-0.5">
            {state === 'rpm_cooldown' ? (
              <Clock className="w-5 h-5 animate-pulse" />
            ) : state === 'auth_error' ? (
              <KeyRound className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2 flex-wrap">
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-amber-300">
                {state === 'rpm_cooldown'
                  ? 'Per-Minute Rate Limit Cooldown (RPM)'
                  : state === 'daily_exhausted'
                  ? 'Daily Free Quota Limit Reached (1,500 RPD)'
                  : state === 'high_demand_503'
                  ? 'Gemini Model High Demand (503)'
                  : state === 'auth_error'
                  ? 'User Gemini API Setup Required'
                  : 'Pending Task Safely Stored'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-black/50 border border-amber-500/30 text-amber-200">
                gemini-3.8-flash (Free Tier)
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed max-w-2xl">{message}</p>
          </div>
        </div>

        {/* Free Tier Badges */}
        <div className="flex items-center space-x-2 text-[11px] font-mono text-zinc-400 self-start sm:self-auto bg-black/40 px-3 py-1.5 rounded-xl border border-zinc-800">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>User Quota: 15 RPM • 1.5K RPD</span>
        </div>
      </div>

      {/* RPM Cooldown Progress Bar */}
      {state === 'rpm_cooldown' && remainingCooldownSeconds > 0 && (
        <div className="mt-4 pt-3 border-t border-amber-500/20 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Safe Rate Limit Reset Cooldown:</span>
            </span>
            <span className="font-bold text-amber-300">
              {remainingCooldownSeconds}s remaining ({percentProgress}%)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${percentProgress}%` }}
            />
          </div>
          <p className="text-[11px] text-zinc-400">
            Google free-tier allows 15 requests per minute. Automatically preventing duplicate calls to protect your quota.
          </p>
        </div>
      )}

      {/* Daily Quota Notice */}
      {state === 'daily_exhausted' && (
        <div className="mt-4 pt-3 border-t border-amber-500/20 space-y-2 text-xs text-zinc-300">
          <p className="leading-relaxed">
            Google AI Studio resets daily free quotas at <strong className="text-white">00:00 UTC</strong>
            {resetTimeFormatted ? ` (approx. ${resetTimeFormatted} local time)` : ''}.
            To continue generating immediately without waiting, you can connect a new free API key from a secondary Google Cloud project, or switch to the Offline Demo Engine.
          </p>
        </div>
      )}

      {/* Pending Task Indicator */}
      {pendingTask && (
        <div className="mt-3.5 p-2.5 rounded-xl bg-black/50 border border-amber-500/20 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 truncate">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span className="text-zinc-400">Preserved Work:</span>
            <span className="font-medium text-amber-200 truncate">{pendingTask.label}</span>
          </div>
          <span className="text-[10px] font-mono text-zinc-400 flex-shrink-0">
            {new Date(pendingTask.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-4 pt-3 border-t border-amber-500/20 flex flex-wrap items-center justify-between gap-2">
        <div className="text-[11px] text-zinc-400">{suggestedAction}</div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Resume / Retry Button */}
          {onRetry && (
            <button
              type="button"
              onClick={() => onRetry(pendingTask)}
              disabled={isGenerating || (state === 'rpm_cooldown' && remainingCooldownSeconds > 0)}
              className="px-4 py-2 rounded-xl text-black text-xs font-bold shadow-md flex items-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-40 cursor-pointer jarvis-gold-btn"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>
                {isGenerating
                  ? 'Generating...'
                  : state === 'rpm_cooldown' && remainingCooldownSeconds > 0
                  ? `Resume in ${remainingCooldownSeconds}s`
                  : 'Resume Generation'}
              </span>
            </button>
          )}

          {/* Configure Key in Overview */}
          {onNavigateToConfig && (
            <button
              type="button"
              onClick={onNavigateToConfig}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-medium border border-amber-500/30 flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Configure Gemini Key</span>
            </button>
          )}

          {/* Offline Demo Engine Option */}
          {onUseOfflineDemo && (
            <button
              type="button"
              onClick={onUseOfflineDemo}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-zinc-300 text-xs font-medium border border-zinc-800 flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <span>Use Offline Demo Engine</span>
            </button>
          )}

          {/* AI Studio Link */}
          <a
            href="https://aistudio.google.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-zinc-400 hover:text-zinc-200 text-xs font-medium border border-zinc-800 flex items-center space-x-1.5 transition-colors"
          >
            <span>Google AI Studio</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
