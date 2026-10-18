import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Smartphone,
  Tv,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Send,
  Zap,
  Layers,
  Film,
  Scissors,
  FileText,
  Search,
  ImageIcon,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext.tsx';
import { type NavigationPageId } from '../../navigation.ts';

interface JarvisAssistantPanelProps {
  onNavigate: (page: NavigationPageId) => void;
}

export const JarvisAssistantPanel: React.FC<JarvisAssistantPanelProps> = ({ onNavigate }) => {
  const {
    isJarvisAssistantOpen,
    setJarvisAssistantOpen,
    activeProject,
    activeProfile,
    switchAspectRatio,
    activeWorkflowStage,
  } = useProject();

  const [inputMessage, setInputMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'jarvis' | 'user'; text: string; action?: { label: string; onClick: () => void } }>>([
    {
      sender: 'jarvis',
      text: `Greetings. I am JARVIS, your YouTube Production Architect. I am currently monitoring project "${activeProject.name}" locked to ${activeProfile.aspectRatio} (${activeProfile.orientation.toUpperCase()}) at ${activeProfile.frameWidth}x${activeProfile.frameHeight}. How may I optimize your pipeline today?`,
    },
  ]);

  if (!isJarvisAssistantOpen) return null;

  const isPortrait = activeProfile.aspectRatio === '9:16';

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    const userText = inputMessage.trim();
    setInputMessage('');

    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);

    // Context-aware response generation
    setTimeout(() => {
      let reply = '';
      let action: { label: string; onClick: () => void } | undefined = undefined;

      const lower = userText.toLowerCase();
      if (lower.includes('ratio') || lower.includes('aspect') || lower.includes('portrait') || lower.includes('landscape') || lower.includes('format')) {
        if (isPortrait) {
          reply = `Current configuration is 9:16 Vertical Portrait (${activeProfile.frameWidth}x${activeProfile.frameHeight}). Prompts are calibrated for YouTube Shorts and TikTok with 18% bottom safe zone clearance. If you wish to produce a standard widescreen YouTube feature, I can convert the profile to 16:9.`;
          action = {
            label: 'Convert to 16:9 Landscape',
            onClick: () => switchAspectRatio('16:9'),
          };
        } else {
          reply = `Current configuration is 16:9 Widescreen Landscape (${activeProfile.frameWidth}x${activeProfile.frameHeight}). Optimized for long-form documentary storytelling and horizontal cinema framing. If you intend to target YouTube Shorts, I can switch the profile to 9:16.`;
          action = {
            label: 'Convert to 9:16 Portrait',
            onClick: () => switchAspectRatio('9:16'),
          };
        }
      } else if (lower.includes('script') || lower.includes('hook') || lower.includes('story')) {
        reply = `For ${activeProfile.aspectRatio} ${activeProfile.targetPlatform}, our 8-second Hook/Main/Ending segmentation maintains maximum retention. Hook segment should open with an intriguing verified premise. Would you like to review the Script Generator?`;
        action = {
          label: 'Open Script Generator',
          onClick: () => {
            onNavigate('scripts');
            setJarvisAssistantOpen(false);
          },
        };
      } else if (lower.includes('prompt') || lower.includes('flow') || lower.includes('veo')) {
        reply = `Video Prompts for this project inherit ${activeProfile.aspectRatio} ${activeProfile.orientation} framing, ${activeProfile.visualStyle}, and ${activeProfile.cameraMotionPreset}. Every prompt includes approved voiceover lines and safe-zone parameters.`;
        action = {
          label: 'Open Video Prompt Builder',
          onClick: () => {
            onNavigate('video-prompts');
            setJarvisAssistantOpen(false);
          },
        };
      } else if (lower.includes('editor') || lower.includes('timeline') || lower.includes('export')) {
        reply = `The YT Editor program monitor and sequence settings are synchronized to ${activeProfile.frameWidth}x${activeProfile.frameHeight}. Non-destructive fit modes (contain/cover) prevent distortion of source assets.`;
        action = {
          label: 'Open YT Editor',
          onClick: () => {
            onNavigate('yt-editor');
            setJarvisAssistantOpen(false);
          },
        };
      } else if (lower.includes('thumb') || lower.includes('cover')) {
        reply = `Thumbnail Studio generates concepts aligned with ${activeProfile.aspectRatio}. Note: You can override thumbnail destination to 16:9 if publishing a standard YouTube video thumbnail while keeping video 9:16.`;
        action = {
          label: 'Open Thumbnail Studio',
          onClick: () => {
            onNavigate('thumbnail-studio');
            setJarvisAssistantOpen(false);
          },
        };
      } else {
        reply = `Acknowledged. I am tracking your active production stages. Active project: "${activeProject.name}" | Aspect Ratio: ${activeProfile.aspectRatio} | Frame: ${activeProfile.frameWidth}x${activeProfile.frameHeight} | Target: ${activeProfile.targetPlatform}. What would you like to execute?`;
      }

      setChatMessages((prev) => [...prev, { sender: 'jarvis', text: reply, action }]);
    }, 400);
  };

  return (
    <aside
      className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 border-l shadow-2xl flex flex-col backdrop-blur-2xl transition-all duration-300 animate-in slide-in-from-right"
      style={{
        backgroundColor: 'var(--bg-surface-elevated)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Header */}
      <div
        className="h-16 px-4 border-b flex items-center justify-between"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center space-x-2.5">
          <div
            className="p-2 rounded-xl border flex items-center justify-center text-black font-black"
            style={{
              backgroundColor: 'var(--accent-primary)',
              borderColor: 'var(--border-focus)',
            }}
          >
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wider flex items-center space-x-1.5" style={{ color: 'var(--text-primary)' }}>
              <span>JARVIS</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded font-bold border" style={{ borderColor: 'var(--border-subtle)', color: 'var(--accent-text)' }}>
                ASSISTANT
              </span>
            </h2>
            <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
              Production Intelligence Core
            </p>
          </div>
        </div>

        <button
          onClick={() => setJarvisAssistantOpen(false)}
          className="p-1.5 rounded-lg border text-xs cursor-pointer hover:bg-white/5"
          style={{
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-secondary)',
          }}
          aria-label="Close JARVIS Assistant"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Context HUD Summary Card */}
      <div className="p-3 border-b" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-base)' }}>
        <div className="text-[10px] font-mono uppercase tracking-wider font-bold mb-1.5" style={{ color: 'var(--text-muted)' }}>
          Active Project HUD
        </div>
        <div className="flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <div className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>
              {activeProject.name}
            </div>
            <div className="text-[11px] font-mono flex items-center space-x-1.5" style={{ color: 'var(--text-secondary)' }}>
              <span>{activeProfile.frameWidth}x{activeProfile.frameHeight}</span>
              <span>·</span>
              <span className="capitalize">{activeProfile.orientation}</span>
            </div>
          </div>

          {/* Ratio Quick Switch Badge */}
          <button
            onClick={() => switchAspectRatio(isPortrait ? '16:9' : '9:16')}
            title="Toggle between 9:16 and 16:9"
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-bold cursor-pointer transition-all hover:scale-105"
            style={{
              backgroundColor: 'var(--accent-subtle)',
              borderColor: 'var(--border-focus)',
              color: 'var(--accent-primary)',
            }}
          >
            {isPortrait ? <Smartphone className="w-3.5 h-3.5" /> : <Tv className="w-3.5 h-3.5" />}
            <span>{activeProfile.aspectRatio}</span>
          </button>
        </div>
      </div>

      {/* Quick Action Matrix */}
      <div className="px-3 py-2 border-b flex items-center space-x-1.5 overflow-x-auto text-[11px] font-mono" style={{ borderColor: 'var(--border-subtle)' }}>
        <button
          onClick={() => switchAspectRatio(isPortrait ? '16:9' : '9:16')}
          className="px-2.5 py-1 rounded border whitespace-nowrap cursor-pointer transition-colors hover:bg-white/5"
          style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
        >
          {isPortrait ? '→ 16:9 Landscape' : '→ 9:16 Portrait'}
        </button>
        <button
          onClick={() => {
            onNavigate('video-prompts');
            setJarvisAssistantOpen(false);
          }}
          className="px-2.5 py-1 rounded border whitespace-nowrap cursor-pointer transition-colors hover:bg-white/5"
          style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
        >
          Prompts
        </button>
        <button
          onClick={() => {
            onNavigate('yt-editor');
            setJarvisAssistantOpen(false);
          }}
          className="px-2.5 py-1 rounded border whitespace-nowrap cursor-pointer transition-colors hover:bg-white/5"
          style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
        >
          Editor
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
        {chatMessages.map((msg, i) => (
          <div
            key={i}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`p-3 rounded-2xl max-w-[88%] leading-relaxed ${
                msg.sender === 'user'
                  ? 'border rounded-tr-none'
                  : 'border rounded-tl-none'
              }`}
              style={{
                backgroundColor: msg.sender === 'user' ? 'var(--accent-subtle)' : 'var(--bg-base)',
                borderColor: msg.sender === 'user' ? 'var(--border-focus)' : 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            >
              {msg.text}

              {msg.action && (
                <div className="mt-2.5 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  <button
                    onClick={msg.action.onClick}
                    className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold jarvis-gold-btn cursor-pointer"
                  >
                    <span>{msg.action.label}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Chat Input */}
      <div
        className="p-3 border-t flex items-center space-x-2"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSendMessage();
          }}
          placeholder="Ask JARVIS about ratio, prompts, or pipeline..."
          className="flex-1 bg-transparent px-3 py-2 rounded-xl border text-xs focus:outline-none placeholder:text-zinc-500"
          style={{
            backgroundColor: 'var(--bg-base)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
        />
        <button
          onClick={handleSendMessage}
          disabled={!inputMessage.trim()}
          className="p-2 rounded-xl jarvis-gold-btn disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
          aria-label="Send message to JARVIS"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
