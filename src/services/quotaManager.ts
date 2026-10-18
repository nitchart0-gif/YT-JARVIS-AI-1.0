// src/services/quotaManager.ts
// Quota-aware rate limit and daily quota state management for user-owned Gemini access

export type QuotaState = 'normal' | 'rpm_cooldown' | 'daily_exhausted' | 'auth_error' | 'high_demand_503';

export interface PendingTaskData {
  type: 'script' | 'topic_script' | 'video_prompts' | 'seo' | 'thumbnails';
  label: string;
  payload: any;
  timestamp: number;
}

export interface QuotaStatusSnapshot {
  state: QuotaState;
  remainingCooldownSeconds: number;
  totalCooldownSeconds: number;
  resetTimestamp: number | null;
  resetTimeFormatted: string | null;
  message: string;
  suggestedAction: string;
  pendingTask: PendingTaskData | null;
  freeTierLimits: {
    model: string;
    rpm: number; // 15 requests per minute
    tpm: number; // 1,000,000 tokens per minute
    rpd: number; // 1,500 requests per day
  };
}

const LOCAL_STORAGE_PENDING_TASK_KEY = 'jarvis_pending_ai_task';
const LOCAL_STORAGE_COOLDOWN_UNTIL_KEY = 'jarvis_cooldown_until';

type QuotaListener = (status: QuotaStatusSnapshot) => void;

class QuotaManager {
  private state: QuotaState = 'normal';
  private cooldownTimer: any = null;
  private cooldownTargetTime: number | null = null;
  private totalCooldownSeconds: number = 0;
  private resetTimestamp: number | null = null;
  private currentMessage: string = '';
  private currentSuggestedAction: string = '';
  private pendingTask: PendingTaskData | null = null;
  private listeners: Set<QuotaListener> = new Set();

  constructor() {
    this.hydrateFromStorage();
  }

  private hydrateFromStorage() {
    try {
      const storedTask = localStorage.getItem(LOCAL_STORAGE_PENDING_TASK_KEY);
      if (storedTask) {
        this.pendingTask = JSON.parse(storedTask);
      }

      const storedCooldown = localStorage.getItem(LOCAL_STORAGE_COOLDOWN_UNTIL_KEY);
      if (storedCooldown) {
        const target = parseInt(storedCooldown, 10);
        const now = Date.now();
        if (target > now) {
          const remaining = Math.ceil((target - now) / 1000);
          this.setRpmCooldown(remaining, remaining, 'Resuming active cooldown from previous session.');
        } else {
          localStorage.removeItem(LOCAL_STORAGE_COOLDOWN_UNTIL_KEY);
        }
      }
    } catch {
      // Storage access gracefully handled
    }
  }

  public getSnapshot(): QuotaStatusSnapshot {
    const remaining = this.cooldownTargetTime
      ? Math.max(0, Math.ceil((this.cooldownTargetTime - Date.now()) / 1000))
      : 0;

    let resetFormatted: string | null = null;
    if (this.resetTimestamp) {
      resetFormatted = new Date(this.resetTimestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    }

    return {
      state: this.state,
      remainingCooldownSeconds: remaining,
      totalCooldownSeconds: this.totalCooldownSeconds,
      resetTimestamp: this.resetTimestamp,
      resetTimeFormatted: resetFormatted,
      message: this.currentMessage,
      suggestedAction: this.currentSuggestedAction,
      pendingTask: this.pendingTask,
      freeTierLimits: {
        model: 'gemini-3.8-flash',
        rpm: 15,
        tpm: 1000000,
        rpd: 1500,
      },
    };
  }

  public subscribe(listener: QuotaListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const snap = this.getSnapshot();
    for (const listener of this.listeners) {
      listener(snap);
    }
  }

  /**
   * Records a pending task so work is NEVER lost when rate limits or errors occur.
   */
  public savePendingTask(task: PendingTaskData) {
    this.pendingTask = task;
    try {
      localStorage.setItem(LOCAL_STORAGE_PENDING_TASK_KEY, JSON.stringify(task));
    } catch {}
    this.notify();
  }

  public clearPendingTask() {
    this.pendingTask = null;
    try {
      localStorage.removeItem(LOCAL_STORAGE_PENDING_TASK_KEY);
    } catch {}
    this.notify();
  }

  /**
   * Activates Per-Minute Rate Limit (RPM) Cooldown with active countdown.
   */
  public setRpmCooldown(seconds: number, totalSeconds: number = seconds, customMessage?: string) {
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
    }

    const duration = Math.max(seconds, 5);
    this.totalCooldownSeconds = totalSeconds || duration;
    this.cooldownTargetTime = Date.now() + duration * 1000;
    this.state = 'rpm_cooldown';
    this.currentMessage =
      customMessage ||
      `Per-minute rate limit reached (15 requests/min for gemini-3.8-flash). Safe cooldown active.`;
    this.currentSuggestedAction = `Automatic cooldown in progress. Generation will be ready in ${duration} seconds without duplicate requests.`;

    try {
      localStorage.setItem(LOCAL_STORAGE_COOLDOWN_UNTIL_KEY, String(this.cooldownTargetTime));
    } catch {}

    this.cooldownTimer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((this.cooldownTargetTime! - Date.now()) / 1000));
      if (remaining <= 0) {
        clearInterval(this.cooldownTimer);
        this.cooldownTimer = null;
        this.cooldownTargetTime = null;
        this.state = 'normal';
        this.currentMessage = 'Cooldown finished. You can now safely resume generation.';
        this.currentSuggestedAction = 'Click "Resume Generation" to proceed.';
        try {
          localStorage.removeItem(LOCAL_STORAGE_COOLDOWN_UNTIL_KEY);
        } catch {}
      }
      this.notify();
    }, 1000);

    this.notify();
  }

  /**
   * Activates Daily Quota Exhaustion state (1,500 RPD).
   */
  public setDailyQuotaExhausted(customMessage?: string) {
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
      this.cooldownTimer = null;
    }
    this.cooldownTargetTime = null;
    this.state = 'daily_exhausted';

    // Calculate approximate next midnight UTC (when Google AI Studio resets daily quotas)
    const now = new Date();
    const nextMidnightUtc = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0, 0, 0, 0
    ));
    this.resetTimestamp = nextMidnightUtc.getTime();

    this.currentMessage =
      customMessage ||
      'Your daily free request quota for Gemini (1,500 requests/day for gemini-3.8-flash) has been reached. Free quotas reset daily at 00:00 UTC. Your drafted work has been safely preserved.';
    this.currentSuggestedAction =
      'Wait for your daily quota reset in Google AI Studio, connect another free project key, or explore using Offline Demo Mode.';

    this.notify();
  }

  /**
   * Activates High-Demand 503 state with short backoff.
   */
  public setHighDemand503(customMessage?: string) {
    this.state = 'high_demand_503';
    this.currentMessage =
      customMessage ||
      'The Gemini model is currently experiencing temporary high demand (503). Automatic server retries completed. Please allow a brief 10-second rest before retrying.';
    this.currentSuggestedAction = 'Click "Retry Generation" to resume.';
    this.notify();
  }

  /**
   * Activates Auth Error state (API key missing or invalid).
   */
  public setAuthError(customMessage?: string) {
    this.state = 'auth_error';
    this.currentMessage =
      customMessage ||
      'Gemini AI setup is required. Please connect your free Google Gemini API key to use your own authorized quota.';
    this.currentSuggestedAction = 'Connect your free key in Overview & Connections.';
    this.notify();
  }

  /**
   * Resets quota state back to normal.
   */
  public resetToNormal() {
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
      this.cooldownTimer = null;
    }
    this.cooldownTargetTime = null;
    this.state = 'normal';
    this.currentMessage = '';
    this.currentSuggestedAction = '';
    this.resetTimestamp = null;
    try {
      localStorage.removeItem(LOCAL_STORAGE_COOLDOWN_UNTIL_KEY);
    } catch {}
    this.notify();
  }

  /**
   * Inspects an error object and automatically updates QuotaManager state.
   */
  public handleError(error: any, taskData?: PendingTaskData) {
    if (taskData) {
      this.savePendingTask(taskData);
    }

    const msg = (error?.message || '').toLowerCase();
    const code = (error?.code || '').toLowerCase();
    const isRateLimit = error?.isRateLimit || error?.status === 429 || msg.includes('429') || msg.includes('quota');
    const isDaily = error?.isDailyQuota || msg.includes('daily') || msg.includes('per day');
    const isRpm = error?.isRpmLimit || (!isDaily && isRateLimit);
    const retryDelay = error?.retryDelaySeconds || (isRpm ? 20 : null);

    if (isDaily) {
      this.setDailyQuotaExhausted(error?.message);
    } else if (isRpm && retryDelay) {
      this.setRpmCooldown(retryDelay, retryDelay, error?.message);
    } else if (isRateLimit) {
      // General quota limit: assign a safe 25s cooldown
      this.setRpmCooldown(25, 25, error?.message);
    } else if (error?.is503 || error?.status === 503 || msg.includes('503')) {
      this.setHighDemand503(error?.message);
    } else if (error?.isAuthError || error?.status === 401 || error?.status === 403 || code === 'ai_setup_required' || code === 'api_key_invalid') {
      this.setAuthError(error?.message);
    }
  }
}

export const quotaManager = new QuotaManager();
