import React, { useState, useEffect } from 'react';
import { type User } from 'firebase/auth';
import {
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Trash2,
  Play,
  RotateCw,
  AlertTriangle,
  Loader2,
  Lock,
  Cpu,
  LogIn,
  Info,
  Check,
  Copy,
  Zap,
} from 'lucide-react';
import { api, type GeminiKeyStatusResponse } from '../services/api.ts';
import { OFFICIAL_AI_STUDIO_KEYS_URL, OFFICIAL_GCP_CREDENTIALS_URL, OFFICIAL_MODEL_DOC_URL, GEMINI_MODEL_ID } from '../../server/constants.js';

interface GeminiConfigCardProps {
  userId: string;
  user?: User | null;
  onSignIn?: () => void;
}

export const GeminiConfigCard: React.FC<GeminiConfigCardProps> = ({ userId, user, onSignIn }) => {
  const [keyStatus, setKeyStatus] = useState<GeminiKeyStatusResponse | null>(null);
  const [inputKey, setInputKey] = useState<string>('');
  const [showInputKey, setShowInputKey] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [probeLoading, setProbeLoading] = useState<boolean>(false);
  const [isReplacing, setIsReplacing] = useState<boolean>(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [showFaq, setShowFaq] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Load existing status for user
  const fetchStatus = async () => {
    try {
      const res = await api.getKeyStatus(userId);
      setKeyStatus(res);
      if (res.configured) {
        setIsReplacing(false);
      }
    } catch {
      // Silently ignore initial fetch error
    }
  };

  useEffect(() => {
    if (userId) {
      fetchStatus();
    }
  }, [userId]);

  // Validation only
  const handleValidateOnly = async () => {
    if (!inputKey.trim()) {
      setFeedback({ type: 'error', message: 'Please enter an API key to validate.' });
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      const res = await api.validateKey(inputKey.trim());
      if (res.valid) {
        setFeedback({
          type: 'success',
          message: `Verification Successful! Model ${res.model} responded in ${res.latencyMs}ms.`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.message || 'Verification failed.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'API key validation failed. Please verify in Google AI Studio.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Save & Validate
  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) {
      setFeedback({ type: 'error', message: 'Please enter a valid Gemini API key.' });
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      const res = await api.saveKey(userId, inputKey.trim());
      setFeedback({
        type: 'success',
        message: res.message || 'API Key successfully verified and encrypted with AES-256-GCM.',
      });
      setInputKey('');
      setShowInputKey(false);
      setIsReplacing(false);
      await fetchStatus();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to save and validate API key.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Run Test Probe on server-saved encrypted key
  const handleTestProbe = async () => {
    setProbeLoading(true);
    setFeedback(null);
    try {
      const res = await api.testKeyProbe(userId);
      if (res.valid) {
        setFeedback({
          type: 'success',
          message: `Stored Key Verified! Server decrypted and queried ${res.model} in ${res.latencyMs}ms without client exposure.`,
        });
        await fetchStatus();
      } else {
        setFeedback({
          type: 'error',
          message: res.message || 'Probe test failed.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Test probe failed.',
      });
    } finally {
      setProbeLoading(false);
    }
  };

  // Delete saved key with safe inline confirmation
  const handleExecuteDeleteKey = async () => {
    setLoading(true);
    setFeedback(null);
    setConfirmDeleteOpen(false);
    try {
      await api.deleteKey(userId);
      setFeedback({
        type: 'info',
        message: 'Saved Gemini API key was securely removed from server storage.',
      });
      setInputKey('');
      setIsReplacing(false);
      await fetchStatus();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to delete key.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAiStudioUrl = () => {
    navigator.clipboard.writeText(OFFICIAL_AI_STUDIO_KEYS_URL).then(() => {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    });
  };

  const isConfigured = keyStatus?.configured === true;

  return (
    <div className="space-y-6">
      {/* 1. ONBOARDING STATUS & IDENTITY BRIDGE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Step A: Google Sign-in Identity */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-slate-400">
                Layer 1: User Identity & Sync
              </span>
              {user ? (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Google Account Linked</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Local Mode (No Sync)</span>
                </span>
              )}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">
                {user ? user.displayName || user.email : 'Local Creator Workspace'}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {user
                  ? `Authenticated via Google OAuth (${user.email}). Project data persists to Firestore.`
                  : 'Operating in local browser storage. Sign in with Google to enable cloud database backup.'}
              </p>
            </div>
          </div>

          <div>
            {!user && onSignIn && (
              <button
                type="button"
                onClick={onSignIn}
                className="w-full flex items-center justify-center space-x-2 py-2 rounded-xl bg-white text-slate-950 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer shadow"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign in with Google</span>
              </button>
            )}
            {user && (
              <div className="text-[11px] font-mono text-slate-400 truncate">
                UID: <span className="text-slate-300">{user.uid}</span>
              </div>
            )}
          </div>
        </div>

        {/* Step B: Gemini Quota Authorization */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-slate-400">
                Layer 2: Google AI Free Quota
              </span>
              {isConfigured ? (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Quota Active</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/10 border border-rose-500/30 text-rose-400">
                  <XCircle className="w-3 h-3" />
                  <span>Setup Needed</span>
                </span>
              )}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white flex items-center space-x-2">
                <span>Free-Tier Engine</span>
                <span className="font-mono text-indigo-300 text-xs px-1.5 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/40">
                  {GEMINI_MODEL_ID}
                </span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {isConfigured
                  ? `Your personal key is verified and stored with AES-256-GCM encryption. Zero manual re-entry required.`
                  : 'Connect your personal Google AI Studio key once to unlock free script, prompt, and SEO generation using your own quota.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-400">
            <span>Free Limits:</span>
            <span className="text-emerald-400 font-bold">15 RPM</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">1,500 RPD</span>
            <span>•</span>
            <span className="text-slate-300">1M TPM</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN CONFIGURATION CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
          <div className="flex items-center space-x-3.5">
            <div
              className={`p-3 rounded-xl border ${
                isConfigured
                  ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
              }`}
            >
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h3 className="text-base font-semibold text-white">Gemini API Configuration</h3>
                {isConfigured ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Configured & Active</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 border border-slate-700 text-slate-400">
                    <XCircle className="w-3 h-3" />
                    <span>Not Configured</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center space-x-2">
                <span>Model:</span>
                <span className="font-mono text-indigo-300 font-semibold bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/40">
                  {GEMINI_MODEL_ID}
                </span>
                <span className="text-[10px] text-slate-400">(Official Google Free Tier)</span>
              </p>
            </div>
          </div>

          {/* Official Direct Links */}
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={OFFICIAL_AI_STUDIO_KEYS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 text-xs font-bold shadow hover:brightness-105 flex items-center space-x-1.5 transition-all"
            >
              <span>Get Free Key (Google AI Studio)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={handleCopyAiStudioUrl}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedUrl ? 'Copied URL!' : 'Copy Key URL'}</span>
            </button>
            <a
              href={OFFICIAL_GCP_CREDENTIALS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center space-x-1.5 transition-colors"
            >
              <span>GCP Console</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`mt-4 p-3.5 rounded-xl text-xs flex items-start space-x-2.5 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                : feedback.type === 'error'
                ? 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
                : 'bg-blue-500/10 border border-blue-500/20 text-blue-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            ) : feedback.type === 'error' ? (
              <XCircle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            )}
            <span className="flex-1 leading-relaxed">{feedback.message}</span>
          </div>
        )}

        {/* Inline Confirmation for Deletion */}
        {confirmDeleteOpen && (
          <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs space-y-3 animate-in fade-in">
            <div className="flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-bold text-sm block mb-1">Confirm Permanent Key Deletion</span>
                <p className="leading-relaxed">
                  Are you sure you want to delete your saved Gemini API key? It will be immediately purged from server encrypted storage. You will need to re-enter a key to make live Gemini requests.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDeleteKey}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
              >
                {loading ? 'Deleting...' : 'Yes, Delete Key'}
              </button>
            </div>
          </div>
        )}

        {/* Main Configuration State */}
        <div className="mt-6">
          {isConfigured && !isReplacing ? (
            /* State 1: Key is currently configured */
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-slate-400 font-medium">Currently Stored API Key:</div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm tracking-wider font-semibold text-emerald-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                      {keyStatus.maskedKey}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                      <Lock className="w-3 h-3 text-emerald-400" />
                      <span>AES-256-GCM Encrypted</span>
                    </span>
                  </div>
                  {keyStatus.lastValidatedAt && (
                    <p className="text-[11px] text-slate-400 pt-1">
                      Last Verified: {new Date(keyStatus.lastValidatedAt).toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Stored Key Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestProbe}
                    disabled={probeLoading || loading}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center space-x-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Play className={`w-3.5 h-3.5 text-indigo-400 ${probeLoading ? 'animate-spin' : ''}`} />
                    <span>{probeLoading ? 'Probing...' : 'Run Test Probe'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsReplacing(true)}
                    disabled={loading}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center space-x-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-blue-400" />
                    <span>Replace API Key</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteOpen(true)}
                    disabled={loading}
                    className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium border border-rose-500/30 flex items-center space-x-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Saved Key</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* State 2: Key entry form (Initial setup or Replace) */
            <form onSubmit={handleSaveKey} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="gemini-key-input" className="text-xs font-semibold text-slate-300">
                    Enter Gemini API Key
                  </label>
                  {isReplacing && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsReplacing(false);
                        setInputKey('');
                        setFeedback(null);
                      }}
                      className="text-xs text-slate-400 hover:text-slate-300 underline cursor-pointer"
                    >
                      Cancel Replace
                    </button>
                  )}
                </div>

                {/* Password Input with Show/Hide toggle */}
                <div className="relative">
                  <input
                    id="gemini-key-input"
                    type={showInputKey ? 'text' : 'password'}
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder="AIzaSy..."
                    autoComplete="off"
                    spellCheck="false"
                    disabled={loading}
                    className="w-full pl-4 pr-11 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowInputKey(!showInputKey)}
                    aria-label={showInputKey ? 'Hide key' : 'Show key'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 rounded-md transition-colors cursor-pointer"
                  >
                    {showInputKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  The key will be tested against <code className="text-indigo-300 font-mono">gemini-3.8-flash</code> and encrypted with server-side AES-256-GCM. Once saved, it will be automatically reused across all studio tabs for this Google account.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={loading || !inputKey.trim()}
                  className="px-5 py-2.5 rounded-xl text-slate-950 text-xs font-bold shadow-md flex items-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer bg-gradient-to-r from-amber-400 to-yellow-300 hover:brightness-105"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : <Lock className="w-4 h-4 text-slate-950" />}
                  <span>{loading ? 'Validating & Saving...' : 'Save & Encrypt Key'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleValidateOnly}
                  disabled={loading || !inputKey.trim()}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center space-x-2 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Cpu className="w-4 h-4 text-blue-400" />
                  <span>Validate Key Only</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* 3. TECHNICAL & SECURITY ARCHITECTURE ACCORDION */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-4">
          <button
            type="button"
            onClick={() => setShowFaq(!showFaq)}
            className="flex items-center justify-between w-full text-left text-xs text-amber-300 hover:text-amber-200 font-medium py-1 cursor-pointer"
          >
            <span className="flex items-center space-x-2">
              <Info className="w-4 h-4" />
              <span>Technical Architecture: Why Google Sign-in cannot automatically mint Gemini API keys</span>
            </span>
            <span className="text-[11px] underline">{showFaq ? 'Hide Details' : 'Show Details'}</span>
          </button>

          {showFaq && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-3 animate-in fade-in">
              <p className="leading-relaxed">
                <strong>Google Cloud Security Model:</strong> Google distinguishes <em>User Identity</em> (OAuth 2.0 openid/email/profile scopes) from <em>Cloud Resource Management</em> (GCP IAM). Standard Google Sign-In gives the applet permission to identify you and sync your Firestore database documents, but Google strictly does not allow consumer OAuth consent screens to create or query Cloud API keys without Cloud Console project management credentials (<code className="font-mono text-amber-300">apikeys.keys.create</code>).
              </p>
              <p className="leading-relaxed">
                <strong>Zero-Developer Fallback & Quota Isolation:</strong> This application deliberately does not embed a shared developer API key. Using a shared key would risk quota exhaustion across users and create security liabilities. By obtaining your free key from Google AI Studio (<a href={OFFICIAL_AI_STUDIO_KEYS_URL} target="_blank" rel="noopener noreferrer" className="text-amber-300 underline">aistudio.google.com/api-keys</a>), you get your dedicated 1,500 requests/day free tier quota that resets automatically every 24 hours.
              </p>
              <p className="leading-relaxed">
                <strong>Single-Setup Persistence:</strong> When you paste your key, our backend validates it and encrypts it with <strong className="text-white">AES-256-GCM</strong> using a server-side encryption key. It is linked to your Google User ID (<code className="font-mono text-indigo-300">{userId}</code>) and automatically supplied on all subsequent AI requests, so you never have to re-enter it.
              </p>
            </div>
          )}

          {/* Security & Billing Advisory Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 text-xs text-slate-400 space-y-1">
              <div className="font-semibold text-slate-300 flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero Client Leakage Architecture</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                API keys are never stored in browser localStorage, cookies, URL parameters, or frontend bundles. All queries are strictly proxied through the authenticated backend with user identity validation.
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 text-xs text-slate-400 space-y-1">
              <div className="font-semibold text-slate-300 flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Model Eligibility & Image Generation</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                All scripts, video prompts, and YouTube SEO run on the 100% free <code className="font-mono text-indigo-300">gemini-3.8-flash</code> tier. Real thumbnail image generation with Imagen 3 requires Google Cloud billing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
