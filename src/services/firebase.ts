import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App instance once
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

/**
 * Validate Connection to Firestore on boot
 */
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// In-memory token cache ONLY. NEVER store in localStorage or sessionStorage!
let cachedDriveAccessToken: string | null = null;
let isSigningIn = false;

// Standard Google Sign-In Provider (Identity scopes: openid, email, profile)
const standardProvider = new GoogleAuthProvider();

// Google Drive Provider requesting explicitly the minimal drive.file scope
const driveProvider = new GoogleAuthProvider();
driveProvider.addScope('https://www.googleapis.com/auth/drive.file');
// Force consent prompt if user is explicitly reconnecting
driveProvider.setCustomParameters({
  prompt: 'consent',
  access_type: 'offline',
});

/**
 * Listener for Auth State changes
 */
export function initAuthListener(
  onUserChanged: (user: User | null, driveToken: string | null) => void,
) {
  return onAuthStateChanged(auth, (user) => {
    if (!user) {
      cachedDriveAccessToken = null;
    }
    onUserChanged(user, cachedDriveAccessToken);
  });
}

/**
 * Sign in with Google (Identity)
 */
export async function signInWithGoogle(): Promise<{ user: User; driveToken: string | null }> {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, standardProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    // Standard login does not request Drive scope by default
    return {
      user: result.user,
      driveToken: credential?.accessToken || null,
    };
  } catch (error) {
    console.error('Google Sign-In failed:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
}

/**
 * Explicit Google Drive Authorization
 * Requests the narrow 'https://www.googleapis.com/auth/drive.file' scope
 */
export async function authorizeGoogleDrive(): Promise<string> {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, driveProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No access token received for Google Drive authorization.');
    }

    cachedDriveAccessToken = credential.accessToken;
    return cachedDriveAccessToken;
  } catch (error) {
    console.error('Drive authorization failed:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
}

/**
 * Get current in-memory Drive token
 */
export function getCachedDriveToken(): string | null {
  return cachedDriveAccessToken;
}

/**
 * Clear in-memory Drive token (e.g. on disconnect)
 */
export function clearCachedDriveToken(): void {
  cachedDriveAccessToken = null;
}

/**
 * Complete Sign Out
 */
export async function logOut(): Promise<void> {
  cachedDriveAccessToken = null;
  await signOut(auth);
}
