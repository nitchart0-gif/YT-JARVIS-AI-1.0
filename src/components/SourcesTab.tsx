import React, { useState, useEffect } from 'react';
import {
  FileText,
  Copy,
  Check,
  Trash2,
  AlertCircle,
  PlusCircle,
  Eraser,
  Database,
  Calendar,
  Edit3,
  ExternalLink,
  Eye,
  X,
  Clapperboard,
  Save,
} from 'lucide-react';

import {
  type SourceItem,
  getSavedSources,
  saveSource,
  updateSource,
  deleteSource,
  subscribeSources,
} from '../services/sourceRepository.ts';

export type { SourceItem };

interface SourcesTabProps {
  userId: string;
  onSelectForScript?: (sourceId: string) => void;
}

export const SourcesTab: React.FC<SourcesTabProps> = ({ userId, onSelectForScript }) => {
  const [sources, setSources] = useState<SourceItem[]>(() => getSavedSources(userId));
  const [inputTitle, setInputTitle] = useState<string>('');
  const [inputText, setInputText] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal states for View and Edit
  const [viewingSource, setViewingSource] = useState<SourceItem | null>(null);
  const [editingSource, setEditingSource] = useState<SourceItem | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editText, setEditText] = useState<string>('');
  const [editError, setEditError] = useState<string | null>(null);

  // Subscribe to real-time updates from sourceRepository
  useEffect(() => {
    const unsubscribe = subscribeSources(userId, (updatedSources) => {
      setSources(updatedSources);
    });
    return () => unsubscribe();
  }, [userId]);

  // Handle Save Source
  const handleSaveSource = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedText = inputText.trim();
    if (!trimmedText) {
      setErrorMessage('Source text cannot be empty or whitespace only.');
      return;
    }

    setErrorMessage(null);
    let finalTitle = inputTitle.trim();
    if (!finalTitle) {
      const firstLine = trimmedText.split('\n')[0].replace(/[#*`_]/g, '').trim();
      finalTitle = firstLine.slice(0, 50) || `Source Article #${sources.length + 1}`;
    }

    try {
      const saved = saveSource(userId, {
        title: finalTitle,
        text: inputText,
      });

      setInputTitle('');
      setInputText('');
      setSuccessMessage(`Source "${saved.title}" saved!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save source');
    }
  };

  // Handle Clear Input
  const handleClear = () => {
    setInputTitle('');
    setInputText('');
    setErrorMessage(null);
  };

  // Open Edit Modal
  const handleStartEdit = (item: SourceItem) => {
    setEditingSource(item);
    setEditTitle(item.title || '');
    setEditText(item.text || '');
    setEditError(null);
  };

  // Save Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSource) return;
    const trimmedText = editText.trim();
    if (!trimmedText) {
      setEditError('Source text cannot be empty or whitespace only.');
      return;
    }

    let finalTitle = editTitle.trim();
    if (!finalTitle) {
      finalTitle = trimmedText.split('\n')[0].slice(0, 50) || editingSource.title;
    }

    try {
      updateSource(userId, editingSource.id, {
        title: finalTitle,
        text: editText,
      });

      setEditingSource(null);
      setSuccessMessage(`Source "${finalTitle}" updated!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update source');
    }
  };

  // Handle Copy Text to Clipboard
  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId((current) => (current === id ? null : current));
      }, 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId((current) => (current === id ? null : current));
      }, 2000);
    }
  };

  // Handle Delete Source with confirmation
  const handleDelete = (id: string, title: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`);
    if (!confirmed) return;

    deleteSource(userId, id);
    if (viewingSource?.id === id) setViewingSource(null);
    if (editingSource?.id === id) setEditingSource(null);
    setSuccessMessage(`Source "${title}" deleted.`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* J.A.R.V.I.S. Research HUD Header */}
      <div className="jarvis-hud-box rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div
            className="p-3 rounded-xl text-black shadow-md flex-shrink-0"
            style={{
              backgroundColor: 'var(--accent-primary)',
              boxShadow: '0 0 16px -2px var(--accent-glow)',
            }}
          >
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-mono tracking-widest text-[#f5d77f] uppercase">
              MODULE 01 // RESEARCH &amp; ARCHIVAL INTELLIGENCE
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white font-mono uppercase tracking-wider">
              Sources &amp; Research Console
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Persistent storage repository for articles, notes, and research text powering AI script generation.
            </p>
          </div>
        </div>
        <div className="text-xs font-mono px-3 py-1.5 rounded-xl border border-amber-500/30 bg-black/60 text-[#f5d77f] self-start sm:self-auto flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{sources.length} {sources.length === 1 ? 'SOURCE' : 'SOURCES'} LOADED</span>
        </div>
      </div>

      {/* Storage Architecture Notice */}
      <div className="p-3.5 rounded-xl border border-amber-500/20 bg-black/50 text-xs flex items-start space-x-3 text-zinc-300">
        <Database className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-400" />
        <div className="leading-relaxed">
          <strong className="text-white font-mono uppercase">PERSISTENCE PROTOCOL:</strong> Sources are persisted across sessions in browser storage with instant cross-tab synchronization. Authenticated users sync in real-time with Google Cloud Firestore.
        </div>
      </div>

      {/* Input Area Card */}
      <div className="jarvis-hud-box rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center space-x-2">
            <PlusCircle className="w-4 h-4 text-[#f5d77f]" />
            <span>INGEST NEW SOURCE MATERIAL</span>
          </h3>
          <span className="text-[10px] font-mono text-zinc-500">RAW TEXT PROTOCOL</span>
        </div>

        <form onSubmit={handleSaveSource} className="space-y-4">
          {/* Title Field */}
          <div>
            <label className="block text-xs font-mono uppercase text-zinc-300 mb-1.5">
              Source Title <span className="text-[10px] font-mono text-zinc-500">(Optional auto-titling fallback)</span>
            </label>
            <input
              type="text"
              value={inputTitle}
              onChange={(e) => setInputTitle(e.target.value)}
              placeholder="e.g. Breaking AI Summit Highlights, Tech Policy Memo, Q3 Earnings..."
              className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono border border-amber-500/30 bg-black/70 text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
            />
          </div>

          {/* Multiline Textarea */}
          <div>
            <label className="block text-xs font-mono uppercase text-zinc-300 mb-1.5">
              Source Article / Text Content <span className="text-rose-400">*</span>
            </label>
            <textarea
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Paste your research, news article, or notes here..."
              rows={8}
              className="w-full p-4 rounded-xl text-xs font-mono border border-amber-500/30 bg-black/70 text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 resize-y leading-relaxed"
            />
            <div className="flex items-center justify-between text-[10px] font-mono mt-1 px-1 text-zinc-400">
              <span>* Preserves original line breaks and indentation</span>
              <span className="text-[#f5d77f] font-bold">
                {inputText.length.toLocaleString()} CHARS · {inputText.trim() ? inputText.trim().split(/\s+/).filter(Boolean).length : 0} WORDS
              </span>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
              <Check className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-5 py-2.5 rounded-xl text-xs font-bold shadow-md flex items-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer jarvis-gold-btn"
            >
              <FileText className="w-4 h-4" />
              <span>Save Source</span>
            </button>

            <button
              type="button"
              onClick={handleClear}
              disabled={!inputText && !inputTitle}
              className="px-4 py-2.5 rounded-xl text-xs font-medium border flex items-center space-x-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
            >
              <Eraser className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <span>Clear</span>
            </button>
          </div>
        </form>
      </div>

      {/* Saved Sources List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-semibold uppercase tracking-wider flex items-center space-x-2" style={{ color: 'var(--text-secondary)' }}>
            <FileText className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            <span>Saved Sources ({sources.length})</span>
          </h3>
        </div>

        {sources.length === 0 ? (
          <div
            className="rounded-2xl p-10 text-center shadow-lg border"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div
              className="inline-flex p-3 rounded-2xl border mb-3"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-muted)',
              }}
            >
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              No sources saved yet
            </h4>
            <p className="text-xs max-w-sm mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Paste an article, notes, or research text in the area above and click <strong>Save Source</strong> to store it here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sources.map((item, index) => {
              const isCopied = copiedId === item.id;
              const formattedDate = new Date(item.createdAt).toLocaleString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={item.id}
                  className="rounded-2xl p-5 shadow-xl transition-all border relative group"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  {/* Item Header */}
                  <div
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b text-xs"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    <div className="flex items-center space-x-2.5 overflow-hidden">
                      <span
                        className="font-semibold px-2 py-0.5 rounded text-[11px] font-mono"
                        style={{
                          backgroundColor: 'var(--bg-surface-elevated)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        #{sources.length - index}
                      </span>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                          {item.title}
                        </h4>
                        <div className="flex items-center space-x-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formattedDate}</span>
                          </span>
                          <span>•</span>
                          <span>{item.text.length.toLocaleString()} chars</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions: Select for Generator, View, Edit, Copy & Delete */}
                    <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                      {onSelectForScript && (
                        <button
                          type="button"
                          onClick={() => onSelectForScript(item.id)}
                          title="Generate script from this source"
                          className="px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer jarvis-gold-btn"
                        >
                          <Clapperboard className="w-3.5 h-3.5" />
                          <span>Generate Script</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setViewingSource(item)}
                        title="View full text"
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center space-x-1 transition-colors cursor-pointer"
                        style={{
                          backgroundColor: 'var(--bg-surface-elevated)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <Eye className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                        <span>View</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStartEdit(item)}
                        title="Edit title and content"
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center space-x-1 transition-colors cursor-pointer"
                        style={{
                          backgroundColor: 'var(--bg-surface-elevated)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <Edit3 className="w-3.5 h-3.5" style={{ color: 'var(--accent-text)' }} />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopy(item.id, item.text)}
                        title="Copy text to clipboard"
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center space-x-1 transition-colors cursor-pointer"
                        style={{
                          backgroundColor: isCopied ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-surface-elevated)',
                          borderColor: isCopied ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)',
                          color: isCopied ? '#34d399' : 'var(--text-secondary)',
                        }}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(item.id, item.title)}
                        title="Delete this source"
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center space-x-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Item Content Preview with formatting preserved */}
                  <div
                    className="rounded-xl p-4 overflow-x-auto max-h-48 overflow-y-auto border"
                    style={{
                      backgroundColor: 'var(--bg-base)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <pre
                      className="text-xs font-sans whitespace-pre-wrap break-words leading-relaxed"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {item.text}
                    </pre>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* VIEW SOURCE MODAL */}
      {viewingSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            {/* Modal Header */}
            <div
              className="p-5 border-b flex items-center justify-between"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div className="min-w-0 pr-4">
                <h3 className="text-base font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                  {viewingSource.title}
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Created on {new Date(viewingSource.createdAt).toLocaleString()} • {viewingSource.text.length.toLocaleString()} characters
                </p>
              </div>
              <button
                onClick={() => setViewingSource(null)}
                className="p-1.5 rounded-lg border text-xs cursor-pointer"
                style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              <pre
                className="text-xs font-sans whitespace-pre-wrap break-words leading-relaxed p-4 rounded-xl border"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                {viewingSource.text}
              </pre>
            </div>

            {/* Modal Footer */}
            <div
              className="p-4 border-t flex items-center justify-between"
              style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}
            >
              <button
                onClick={() => handleCopy(viewingSource.id, viewingSource.text)}
                className="px-4 py-2 rounded-xl text-xs font-medium border flex items-center space-x-1.5 cursor-pointer"
                style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Full Text</span>
              </button>

              <div className="flex items-center space-x-2">
                {onSelectForScript && (
                  <button
                    onClick={() => {
                      onSelectForScript(viewingSource.id);
                      setViewingSource(null);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-black cursor-pointer jarvis-gold-btn"
                  >
                    Use in Script Generator
                  </button>
                )}
                <button
                  onClick={() => setViewingSource(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium border cursor-pointer"
                  style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT SOURCE MODAL */}
      {editingSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <form
            onSubmit={handleSaveEdit}
            className="rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div
              className="p-5 border-b flex items-center justify-between"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div>
                <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  Edit Source
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Update the title or content of this saved source article.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingSource(null)}
                className="p-1.5 rounded-lg border text-xs cursor-pointer"
                style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Source Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'var(--bg-base)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Source Content
                </label>
                <textarea
                  value={editText}
                  onChange={(e) => {
                    setEditText(e.target.value);
                    if (editError) setEditError(null);
                  }}
                  rows={10}
                  className="w-full p-4 rounded-xl text-sm font-sans border focus:outline-none focus:ring-2 resize-y"
                  style={{
                    backgroundColor: 'var(--bg-base)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              {editError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  <span>{editError}</span>
                </div>
              )}
            </div>

            <div
              className="p-4 border-t flex items-center justify-end space-x-3"
              style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}
            >
              <button
                type="button"
                onClick={() => setEditingSource(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium border cursor-pointer"
                style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer jarvis-gold-btn"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
