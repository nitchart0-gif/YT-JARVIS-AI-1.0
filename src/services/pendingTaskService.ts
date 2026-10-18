/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Pending Task Service for J.A.R.V.I.S.
 * Preserves in-flight and interrupted generation tasks during rate limits, quota exhaustion,
 * or transient network failures so creators never lose their work.
 */

export interface PendingAITask {
  id: string;
  type: 'script' | 'topic-script' | 'prompts' | 'seo' | 'thumbnail-package' | 'thumbnail-image';
  title: string;
  createdAt: number;
  inputData: any;
  errorStatus?: number;
  errorCode?: string;
  errorMessage?: string;
  retryAfterSeconds?: number | null;
  retryAvailableAt?: number | null;
  isDailyQuota?: boolean;
}

type TaskListener = (task: PendingAITask | null) => void;
const listeners = new Set<TaskListener>();

function getStorageKey(userId?: string): string {
  const safeId = userId || 'local_creator';
  return `jarvis_pending_task_${safeId}`;
}

export function getPendingTask(userId?: string): PendingAITask | null {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed reading pending task:', e);
    return null;
  }
}

export function savePendingTask(userId: string | undefined, task: Omit<PendingAITask, 'id' | 'createdAt'>): PendingAITask {
  const now = Date.now();
  const retryAvailableAt = task.retryAfterSeconds ? now + task.retryAfterSeconds * 1000 : null;

  const fullTask: PendingAITask = {
    ...task,
    id: `pending_${now}_${Math.random().toString(36).substring(2, 6)}`,
    createdAt: now,
    retryAvailableAt,
  };

  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(fullTask));
    notify(fullTask);
  } catch (e) {
    console.warn('Failed saving pending task to storage:', e);
  }

  return fullTask;
}

export function clearPendingTask(userId?: string): void {
  try {
    localStorage.removeItem(getStorageKey(userId));
    notify(null);
  } catch (e) {
    console.warn('Failed clearing pending task:', e);
  }
}

function notify(task: PendingAITask | null) {
  listeners.forEach((cb) => {
    try {
      cb(task);
    } catch (err) {
      console.error('Error notifying pending task listener:', err);
    }
  });
}

export function subscribePendingTask(userId: string | undefined, callback: TaskListener): () => void {
  listeners.add(callback);
  callback(getPendingTask(userId));

  const storageHandler = (e: StorageEvent) => {
    if (e.key === getStorageKey(userId)) {
      callback(getPendingTask(userId));
    }
  };
  window.addEventListener('storage', storageHandler);

  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', storageHandler);
  };
}
