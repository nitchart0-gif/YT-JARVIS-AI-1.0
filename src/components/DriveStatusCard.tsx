import React, { useState, useEffect } from 'react';
import { HardDrive, CheckCircle2, XCircle, RefreshCw, PowerOff, ShieldAlert, Database, AlertCircle } from 'lucide-react';
import { authorizeGoogleDrive, getCachedDriveToken, clearCachedDriveToken } from '../services/firebase.ts';
import { api, type DriveStatusResponse } from '../services/api.ts';

interface DriveStatusCardProps {
  onDriveStatusChange?: (connected: boolean) => void;
}

export const DriveStatusCard: React.FC<DriveStatusCardProps> = ({ onDriveStatusChange }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [driveStatus, setDriveStatus] = useState<DriveStatusResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const checkStatus = async () => {
    const token = getCachedDriveToken();
    if (!token) {
      setDriveStatus({ authorized: false, error: 'No Google Drive token in active memory.' });
      onDriveStatusChange?.(false);
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const status = await api.checkDriveStatus(token);
      setDriveStatus(status);
      onDriveStatusChange?.(status.authorized);
      if (!status.authorized && status.error) {
        setErrorMsg(status.error);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to verify Drive authorization.');
      setDriveStatus({ authorized: false });
      onDriveStatusChange?.(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleConnectDrive = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const token = await authorizeGoogleDrive();
      const status = await api.checkDriveStatus(token);
      setDriveStatus(status);
      onDriveStatusChange?.(status.authorized);
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Authorization popup was closed before consent was granted.');
      } else {
        setErrorMsg(err?.message || 'Drive authorization request was rejected or failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectDrive = async () => {
    const token = getCachedDriveToken();
    setLoading(true);
    setErrorMsg(null);
    try {
      if (token) {
        await api.revokeDriveAccess(token);
      }
    } catch {
      // Even if network revoke fails, clear local memory
    } finally {
      clearCachedDriveToken();
      setDriveStatus({ authorized: false, error: 'Drive authorization disconnected.' });
      onDriveStatusChange?.(false);
      setLoading(false);
    }
  };

  const isAuthorized = driveStatus?.authorized === true;

  // Format bytes helper
  const formatBytes = (bytesStr?: string) => {
    if (!bytesStr) return '0 B';
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes)) return 'Unknown';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div
      className="rounded-2xl p-6 border shadow-xl backdrop-blur-md relative overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center space-x-3.5">
          <div
            className="p-3 rounded-xl border"
            style={{
              backgroundColor: isAuthorized ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-surface-elevated)',
              borderColor: isAuthorized ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)',
              color: isAuthorized ? '#10b981' : 'var(--text-muted)',
            }}
          >
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                Google Drive Authorization
              </h3>
              {isAuthorized ? (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Authorized</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <XCircle className="w-3 h-3" />
                  <span>Not Connected</span>
                </span>
              )}
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Scope: <code className="font-mono text-indigo-400">https://www.googleapis.com/auth/drive.file</code>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {isAuthorized ? (
            <>
              <button
                onClick={checkStatus}
                disabled={loading}
                title="Verify connection status with Google"
                className="px-3 py-2 rounded-xl text-xs font-medium border flex items-center space-x-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Verify</span>
              </button>
              <button
                onClick={handleDisconnectDrive}
                disabled={loading}
                className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium border border-rose-500/30 flex items-center space-x-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <PowerOff className="w-3.5 h-3.5" />
                <span>Disconnect Google Drive</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleConnectDrive}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-black text-xs font-bold shadow-md flex items-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer jarvis-gold-btn"
            >
              <HardDrive className="w-4 h-4 text-black" />
              <span>{loading ? 'Authorizing...' : 'Connect Google Drive'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Authorization Details / Scope Clarity */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Drive Info / Quota */}
        <div
          className="rounded-xl border p-4"
          style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}
        >
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-2.5 flex items-center space-x-1.5" style={{ color: 'var(--text-secondary)' }}>
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span>Connection Telemetry</span>
          </h4>
          {isAuthorized && driveStatus?.driveUser ? (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Drive Account:</span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {driveStatus.driveUser.displayName} ({driveStatus.driveUser.emailAddress})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Quota:</span>
                <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
                  {formatBytes(driveStatus.storageQuota?.limit)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span style={{ color: 'var(--text-muted)' }}>Drive Storage Used:</span>
                <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
                  {formatBytes(driveStatus.storageQuota?.usageInDrive || driveStatus.storageQuota?.usage)}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Google Drive authorization is currently inactive. Click <strong style={{ color: 'var(--text-primary)' }}>Connect Google Drive</strong> above to authorize this application to interact with app-specific files.
            </div>
          )}
        </div>

        {/* Security & Scope Boundary Notice */}
        <div
          className="rounded-xl border p-4"
          style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}
        >
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-2.5 flex items-center space-x-1.5" style={{ color: 'var(--text-secondary)' }}>
            <ShieldAlert className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
            <span>Scope Boundary Specification</span>
          </h4>
          <p className="text-xs leading-relaxed mb-2" style={{ color: 'var(--text-secondary)' }}>
            This application requests the principle-of-least-privilege <code className="px-1 py-0.5 rounded font-mono text-indigo-400" style={{ backgroundColor: 'var(--bg-surface-elevated)' }}>drive.file</code> scope.
          </p>
          <div
            className="text-[11px] p-2.5 rounded-lg border leading-normal"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            <strong style={{ color: 'var(--text-primary)' }}>Important:</strong> Google Drive authorization grants access only to files created or opened by this application. It does <span className="text-rose-400 font-medium">not</span> grant access to your entire Google Cloud project, all Google APIs, or unrelated personal Drive files.
          </div>
        </div>
      </div>
    </div>
  );
};
