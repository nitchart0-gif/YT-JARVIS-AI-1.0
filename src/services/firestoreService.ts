import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth } from './firebase.ts';
import { handleFirestoreError, OperationType } from './firestoreErrors.ts';

export interface SourceItem {
  id: string;
  userId: string;
  title: string;
  text: string;
  createdAt: string | number;
  updatedAt?: string | number;
}

/**
 * Real-time subscription to User Sources in Firestore
 */
export function subscribeUserSources(
  userId: string,
  onUpdate: (sources: SourceItem[]) => void,
  onError?: (error: Error) => void,
) {
  if (!userId || !auth.currentUser) return () => {};
  const collectionPath = `users/${userId}/sources`;

  return onSnapshot(
    collection(db, collectionPath),
    (snapshot) => {
      const items: SourceItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as SourceItem;
        items.push(data);
      });
      items.sort((a, b) => {
        const tA = typeof a.createdAt === 'number' ? a.createdAt : new Date(a.createdAt).getTime();
        const tB = typeof b.createdAt === 'number' ? b.createdAt : new Date(b.createdAt).getTime();
        return (tB || 0) - (tA || 0);
      });
      onUpdate(items);
    },
    (err) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, collectionPath);
    },
  );
}

/**
 * Save or update a research source item in Firestore
 */
export async function saveUserSource(userId: string, source: Omit<SourceItem, 'userId'> & { userId?: string }): Promise<void> {
  if (!userId) throw new Error('Cannot save source: No userId provided.');
  const docPath = `users/${userId}/sources/${source.id}`;
  const nowIso = new Date().toISOString();

  const payload: SourceItem = {
    id: source.id,
    userId,
    title: source.title.slice(0, 300),
    text: source.text.slice(0, 100000),
    createdAt: typeof source.createdAt === 'string' ? source.createdAt : new Date(source.createdAt || Date.now()).toISOString(),
    updatedAt: nowIso,
  };

  try {
    await setDoc(doc(db, docPath), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, docPath);
  }
}

/**
 * Delete a source item from Firestore
 */
export async function deleteUserSource(userId: string, sourceId: string): Promise<void> {
  if (!userId || !sourceId) return;
  const docPath = `users/${userId}/sources/${sourceId}`;
  try {
    await deleteDoc(doc(db, docPath));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, docPath);
  }
}

/**
 * Real-time subscription to Saved Video Editor Projects in Firestore
 */
export function subscribeEditorProjects(
  userId: string,
  onUpdate: (projects: any[]) => void,
  onError?: (error: Error) => void,
) {
  if (!userId || !auth.currentUser) return () => {};
  const collectionPath = `users/${userId}/editorProjects`;

  return onSnapshot(
    collection(db, collectionPath),
    (snapshot) => {
      const items: any[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data());
      });
      items.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
      onUpdate(items);
    },
    (err) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, collectionPath);
    },
  );
}

/**
 * Save a complete Video Editor Project to Firestore
 */
export async function saveEditorProject(userId: string, project: any): Promise<void> {
  if (!userId || !project?.settings?.id) return;
  const projectId = project.settings.id;
  const docPath = `users/${userId}/editorProjects/${projectId}`;
  const nowIso = new Date().toISOString();

  const payload = {
    id: projectId,
    userId,
    name: (project.settings.name || 'Untitled Video Project').slice(0, 200),
    settings: project.settings,
    tracks: project.tracks || [],
    clips: project.clips || [],
    mediaAssets: project.mediaAssets || [],
    duration: Number(project.duration) || 60,
    createdAt: typeof project.createdAt === 'string' ? project.createdAt : nowIso,
    updatedAt: nowIso,
  };

  try {
    await setDoc(doc(db, docPath), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, docPath);
  }
}

/**
 * Get single Editor Project by ID from Firestore
 */
export async function getEditorProject(userId: string, projectId: string): Promise<any | null> {
  if (!userId || !projectId) return null;
  const docPath = `users/${userId}/editorProjects/${projectId}`;
  try {
    const snap = await getDoc(doc(db, docPath));
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, docPath);
  }
}

/**
 * Delete Editor Project from Firestore
 */
export async function deleteEditorProject(userId: string, projectId: string): Promise<void> {
  if (!userId || !projectId) return;
  const docPath = `users/${userId}/editorProjects/${projectId}`;
  try {
    await deleteDoc(doc(db, docPath));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, docPath);
  }
}

/**
 * Real-time subscription to User Saved SEO Packages in Firestore
 */
export function subscribeSEOPackages(
  userId: string,
  onUpdate: (packages: any[]) => void,
  onError?: (error: Error) => void,
) {
  if (!userId || !auth.currentUser) return () => {};
  const collectionPath = `users/${userId}/seoPackages`;

  return onSnapshot(
    collection(db, collectionPath),
    (snapshot) => {
      const items: any[] = [];
      snapshot.forEach((docSnap) => items.push(docSnap.data()));
      onUpdate(items);
    },
    (err) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, collectionPath);
    },
  );
}

/**
 * Save SEO Package to Firestore
 */
export async function saveSEOPackage(userId: string, seoPkg: any): Promise<void> {
  if (!userId || !seoPkg) return;
  const seoId = seoPkg.id || `seo_${Date.now()}`;
  const docPath = `users/${userId}/seoPackages/${seoId}`;
  const nowIso = new Date().toISOString();

  const payload = {
    id: seoId,
    userId,
    sourceTitle: (seoPkg.sourceTitle || 'Untitled SEO').slice(0, 300),
    videoFormat: seoPkg.videoFormat || 'shorts',
    primaryKeyword: (seoPkg.primaryKeyword || '').slice(0, 128),
    seoTitles: seoPkg.seoTitles || [],
    description: seoPkg.description || {},
    tags: seoPkg.tags || [],
    hashtags: seoPkg.hashtags || [],
    createdAt: typeof seoPkg.createdAt === 'string' ? seoPkg.createdAt : nowIso,
    updatedAt: nowIso,
  };

  try {
    await setDoc(doc(db, docPath), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, docPath);
  }
}
