/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  subscribeUserSources,
  saveUserSource,
  deleteUserSource,
  type SourceItem as FirestoreSourceItem,
} from './firestoreService.ts';
import { auth } from './firebase.ts';

export interface SourceItem {
  id: string;
  userId?: string;
  title: string;
  text: string;
  createdAt: number;
  updatedAt?: number;
}

type SourceListener = (sources: SourceItem[]) => void;
const listenersByUserId = new Map<string, Set<SourceListener>>();

function getStorageKeys(userId: string): { primary: string; legacy: string } {
  const safeId = userId || 'local_creator';
  return {
    primary: `ytai_sources_${safeId}`,
    legacy: `workspace_portal_sources_${safeId}`,
  };
}

function notifyListeners(userId: string, sources: SourceItem[]): void {
  const safeId = userId || 'local_creator';
  const listeners = listenersByUserId.get(safeId);
  if (listeners) {
    listeners.forEach((callback) => {
      try {
        callback(sources);
      } catch (e) {
        console.error('Error notifying source subscriber:', e);
      }
    });
  }
}

/**
 * Retrieve saved sources from local storage with legacy key fallback
 */
export function getSavedSources(userId: string): SourceItem[] {
  const { primary, legacy } = getStorageKeys(userId);
  try {
    const raw = localStorage.getItem(primary) || localStorage.getItem(legacy);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item: any, idx: number) => ({
      id: item.id || `src_${Date.now()}_${idx}`,
      userId: item.userId || userId,
      title: item.title || `Source Article #${idx + 1}`,
      text: item.text || '',
      createdAt: typeof item.createdAt === 'number'
        ? item.createdAt
        : (item.createdAt ? new Date(item.createdAt).getTime() : Date.now()),
      updatedAt: typeof item.updatedAt === 'number'
        ? item.updatedAt
        : (item.updatedAt ? new Date(item.updatedAt).getTime() : undefined),
    }));
  } catch (e) {
    console.warn('Failed to parse saved sources from localStorage:', e);
    return [];
  }
}

/**
 * Save sources list to localStorage and broadcast to active tabs
 */
function persistSources(userId: string, sources: SourceItem[]): void {
  const { primary } = getStorageKeys(userId);
  try {
    localStorage.setItem(primary, JSON.stringify(sources));
    notifyListeners(userId, sources);
  } catch (e) {
    console.warn('Failed to persist sources to localStorage:', e);
  }
}

/**
 * Save a new source article
 */
export function saveSource(
  userId: string,
  source: { title: string; text: string },
): SourceItem {
  const existing = getSavedSources(userId);
  const now = Date.now();
  const newSource: SourceItem = {
    id: `src_${now}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    title: source.title.trim() || 'Untitled Source',
    text: source.text,
    createdAt: now,
    updatedAt: now,
  };

  const updated = [newSource, ...existing];
  persistSources(userId, updated);

  // Sync to Firestore if user is authenticated
  if (auth.currentUser && userId && userId !== 'local_creator') {
    saveUserSource(userId, {
      id: newSource.id,
      title: newSource.title,
      text: newSource.text,
      createdAt: newSource.createdAt,
      updatedAt: newSource.updatedAt,
    }).catch((err) => console.warn('Firestore source save fallback:', err));
  }

  return newSource;
}

/**
 * Update an existing source article
 */
export function updateSource(
  userId: string,
  sourceId: string,
  updates: Partial<{ title: string; text: string }>,
): SourceItem {
  const existing = getSavedSources(userId);
  const targetIndex = existing.findIndex((s) => s.id === sourceId);
  const now = Date.now();

  if (targetIndex === -1) {
    throw new Error(`Source with ID "${sourceId}" not found.`);
  }

  const updatedItem: SourceItem = {
    ...existing[targetIndex],
    ...(updates.title !== undefined ? { title: updates.title.trim() } : {}),
    ...(updates.text !== undefined ? { text: updates.text } : {}),
    updatedAt: now,
  };

  existing[targetIndex] = updatedItem;
  persistSources(userId, [...existing]);

  // Sync to Firestore if user is authenticated
  if (auth.currentUser && userId && userId !== 'local_creator') {
    saveUserSource(userId, {
      id: updatedItem.id,
      title: updatedItem.title,
      text: updatedItem.text,
      createdAt: updatedItem.createdAt,
      updatedAt: updatedItem.updatedAt,
    }).catch((err) => console.warn('Firestore source update fallback:', err));
  }

  return updatedItem;
}

/**
 * Delete a source article by ID
 */
export function deleteSource(userId: string, sourceId: string): void {
  const existing = getSavedSources(userId);
  const filtered = existing.filter((s) => s.id !== sourceId);
  persistSources(userId, filtered);

  if (auth.currentUser && userId && userId !== 'local_creator') {
    deleteUserSource(userId, sourceId).catch((err) =>
      console.warn('Firestore source deletion fallback:', err),
    );
  }
}

/**
 * Subscribe to real-time updates for user sources (merges localStorage and Firestore)
 */
export function subscribeSources(
  userId: string,
  callback: (sources: SourceItem[]) => void,
): () => void {
  const safeId = userId || 'local_creator';
  if (!listenersByUserId.has(safeId)) {
    listenersByUserId.set(safeId, new Set());
  }
  const set = listenersByUserId.get(safeId)!;
  set.add(callback);

  // Send initial data immediately
  callback(getSavedSources(userId));

  // Storage listener for cross-tab synchronicity
  const storageHandler = (e: StorageEvent) => {
    const { primary } = getStorageKeys(userId);
    if (e.key === primary && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (Array.isArray(parsed)) {
          callback(parsed);
        }
      } catch {}
    }
  };
  window.addEventListener('storage', storageHandler);

  // Firestore real-time listener if authenticated
  let firestoreUnsubscribe = () => {};
  if (auth.currentUser && userId && userId !== 'local_creator') {
    firestoreUnsubscribe = subscribeUserSources(
      userId,
      (cloudSources: FirestoreSourceItem[]) => {
        if (!cloudSources || cloudSources.length === 0) return;
        const normalized: SourceItem[] = cloudSources.map((cs) => ({
          id: cs.id,
          userId: cs.userId,
          title: cs.title,
          text: cs.text,
          createdAt: typeof cs.createdAt === 'number'
            ? cs.createdAt
            : new Date(cs.createdAt).getTime(),
          updatedAt: cs.updatedAt
            ? (typeof cs.updatedAt === 'number' ? cs.updatedAt : new Date(cs.updatedAt).getTime())
            : undefined,
        }));

        // Merge with local items preserving the newest
        const local = getSavedSources(userId);
        const mergedMap = new Map<string, SourceItem>();
        local.forEach((item) => mergedMap.set(item.id, item));
        normalized.forEach((item) => mergedMap.set(item.id, item));
        const merged = Array.from(mergedMap.values()).sort(
          (a, b) => (b.createdAt || 0) - (a.createdAt || 0),
        );
        persistSources(userId, merged);
      },
      (err) => console.warn('Firestore source subscription notice:', err),
    );
  }

  return () => {
    set.delete(callback);
    if (set.size === 0) {
      listenersByUserId.delete(safeId);
    }
    window.removeEventListener('storage', storageHandler);
    firestoreUnsubscribe();
  };
}
