import React, { useState } from 'react';
import { Clapperboard, AlertCircle, Loader2, ExternalLink, X, Database, CheckCircle2 } from 'lucide-react';
import { signInWithGoogle } from '../services/firebase.ts';
import firebaseConfig from '../../firebase-applet-config.json';

interface LoginPageProps {
  onSuccess: () => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, onClose, isModal = false }) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const projectId = (firebaseConfig as any)?.projectId || 'gen-lang-client-0328238353';
  const consoleAuthUrl = `https://console.firebase.google.com/project/${projectId}/authentication/settings`;

  const handleSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);
    setUnauthorizedDomain(null);
    try {
      await signInWithGoogle();
      onSuccess();
    } catch (err: any) {
      console.error('Google Sign-In caught error:', err);
      const code = err?.code || '';
      if (code === 'auth/unauthorized-domain') {
        setUnauthorizedDomain(currentHostname);
        setErrorMessage(
          `Domain authorization required: "${currentHostname}" has not yet been added to Authorized Domains in the Firebase Console.`,
        );
      } else if (code === 'auth/popup-closed-by-user') {
        setErrorMessage('Sign-in window was closed before completion. Please try again.');
      } else if (code === 'auth/cancelled-popup-request') {
        setErrorMessage('Authentication request was cancelled.');
      } else {
        setErrorMessage(err?.message || 'Authentication failed. Please verify your Google account.');
      }
    } finally {
      setLoading(false);
    }
  };

  const cardContent = (
    <div
      className="w-full max-w-md rounded-2xl p-6 sm:p-8 shadow-2xl border backdrop-blur-2xl relative overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Top metallic gold accent bar with glow */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{
          backgroundColor: 'var(--accent-primary)',
          boxShadow: '0 0 16px var(--accent-glow)',
        }}
      />

      {/* Close button if modal */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg border text-xs cursor-pointer hover:bg-white/5"
          style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Header / Brand */}
      <div className="text-center mb-6">
        <div
          className="inline-flex p-3 rounded-2xl border mb-3 shadow-md text-black"
          style={{
            backgroundColor: 'var(--accent-primary)',
            boxShadow: '0 0 16px -2px var(--accent-glow)',
          }}
        >
          <Clapperboard className="w-8 h-8" />
        </div>
        <div className="text-[11px] font-mono tracking-widest uppercase mb-1" style={{ color: 'var(--accent-primary)' }}>
          Command Center Access
        </div>
        <h2 className="text-xl font-bold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
          Sign in to JARVIS · YT-AI
        </h2>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Sync your scripts, video prompts, SEO metadata, thumbnails, and editor projects to Google Cloud Firestore across devices.
        </p>
      </div>

      {/* Cloud Sync Feature Highlights */}
      <div className="space-y-2 mb-6 text-xs">
        <div
          className="p-3 rounded-xl border flex items-center space-x-2.5"
          style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span style={{ color: 'var(--text-secondary)' }}>
            Real-time cloud database backup for all research and scripts
          </span>
        </div>
        <div
          className="p-3 rounded-xl border flex items-center space-x-2.5"
          style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}
        >
          <Database className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>
            User-isolated Firestore subcollections with zero-trust security rules
          </span>
        </div>
      </div>

      {/* Domain Authorization Diagnostic Notice (if auth/unauthorized-domain occurs) */}
      {unauthorizedDomain && (
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2.5">
          <div className="flex items-start space-x-2 font-semibold text-amber-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
            <span>Firebase Console Setup Required</span>
          </div>
          <p className="leading-relaxed">
            Firebase Google Auth rejected this origin because this preview hostname is not yet in the project&apos;s authorized domain list:
          </p>
          <div className="p-2 rounded font-mono text-[11px] bg-black/40 border border-amber-500/30 break-all select-all text-amber-100">
            {unauthorizedDomain}
          </div>
          <div className="pt-1">
            <a
              href={consoleAuthUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-colors"
            >
              <span>Open Firebase Authorized Domains</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <p className="text-[11px] text-amber-300/80">
            Steps: Click link &rarr; Settings tab &rarr; Authorized domains &rarr; Add domain &rarr; Paste <code className="font-mono">{unauthorizedDomain}</code>.
          </p>
        </div>
      )}

      {/* Standard Error Message (if not domain auth) */}
      {!unauthorizedDomain && errorMessage && (
        <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
          <div className="flex-1">
            <span className="font-semibold block mb-0.5">Authentication Notice</span>
            {errorMessage}
          </div>
        </div>
      )}

      {/* Google Sign In Button */}
      <div className="space-y-3">
        <button
          onClick={handleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center space-x-3 px-5 py-3 rounded-xl bg-white text-slate-900 font-semibold text-sm hover:bg-slate-100 active:scale-[0.99] transition-all shadow-md hover:shadow-lg disabled:opacity-60 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
              <span>Connecting to Google...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {/* Continue in Local/Offline Mode Button */}
        <button
          onClick={onClose || onSuccess}
          className="w-full py-2.5 rounded-xl border text-xs font-medium transition-colors hover:bg-slate-800/20 cursor-pointer"
          style={{
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-secondary)',
          }}
        >
          Continue in Local Mode (Browser Storage)
        </button>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
        <div className="z-10">{cardContent}</div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden transition-colors"
      style={{
        backgroundColor: 'var(--bg-base)',
        color: 'var(--text-primary)',
      }}
    >
      {cardContent}
    </div>
  );
};
