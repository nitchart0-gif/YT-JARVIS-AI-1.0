import React, { useState } from 'react';
import { type User } from 'firebase/auth';
import {
  Clapperboard,
  Film,
  Search,
  Image as ImageIcon,
  Scissors,
  FileText,
  KeyRound,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Database,
  CheckCircle2,
  HardDrive,
  LogIn,
  Settings,
  Smartphone,
  Tv,
  Plus,
  Layers,
  Zap,
  Play,
  RotateCcw,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext.tsx';
import { OverviewCommandCenter } from './jarvis/OverviewCommandCenter.tsx';
import { logOut } from '../services/firebase.ts';
import { DriveStatusCard } from './DriveStatusCard.tsx';
import { GeminiConfigCard } from './GeminiConfigCard.tsx';
import { SourcesTab } from './SourcesTab.tsx';
import { ScriptGeneratorTab } from './ScriptGeneratorTab.tsx';
import { VideoPromptBuilderTab } from './VideoPromptBuilderTab.tsx';
import { SEOStudioTab } from './SEOStudioTab.tsx';
import { ThumbnailStudioTab } from './ThumbnailStudioTab.tsx';
import { YTEditorTab } from './YTEditorTab.tsx';
import { SettingsPage } from './SettingsPage.tsx';
import { AppLayout } from './layout/AppLayout.tsx';
import { type NavigationPageId } from '../navigation.ts';
import { type ScriptGenerationResponse } from '../services/api.ts';

interface DashboardPageProps {
  user: User | null;
  onSignOut: () => void;
  onSignIn?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ user, onSignOut, onSignIn }) => {
  const [activePage, setActivePage] = useState<NavigationPageId>('overview');
  const [driveConnected, setDriveConnected] = useState<boolean>(false);
  const [signingOut, setSigningOut] = useState<boolean>(false);

  const effectiveUserId = user ? user.uid : 'local_creator';

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await logOut();
      onSignOut();
    } catch (err) {
      console.error('Sign out failed:', err);
    } finally {
      setSigningOut(false);
    }
  };

  const [selectedScriptSourceId, setSelectedScriptSourceId] = useState<string | null>(null);

  const handleSelectSourceForScript = (sourceId: string) => {
    setSelectedScriptSourceId(sourceId);
    setActivePage('scripts');
  };

  const [transferredScript, setTransferredScript] = useState<ScriptGenerationResponse | null>(null);
  const [transferredSourceTitle, setTransferredSourceTitle] = useState<string>('');

  const handleTransferToVideoPrompts = (scriptData: ScriptGenerationResponse, sourceTitle?: string) => {
    setTransferredScript(scriptData);
    setTransferredSourceTitle(sourceTitle || `${scriptData.contentMode} Video Script`);
    setActivePage('video-prompts');
  };

  const [transferredSEOScript, setTransferredSEOScript] = useState<ScriptGenerationResponse | null>(null);
  const [transferredSEOSourceTitle, setTransferredSEOSourceTitle] = useState<string>('');
  const [transferredSEOSourceArticle, setTransferredSEOSourceArticle] = useState<string>('');

  const handleTransferToSEOStudio = (
    scriptData: ScriptGenerationResponse,
    sourceTitle?: string,
    sourceArticle?: string,
  ) => {
    setTransferredSEOScript(scriptData);
    setTransferredSEOSourceTitle(sourceTitle || `${scriptData.contentMode} Video Script`);
    setTransferredSEOSourceArticle(sourceArticle || '');
    setActivePage('seo-studio');
  };

  const [transferredThumbScript, setTransferredThumbScript] = useState<ScriptGenerationResponse | null>(null);
  const [transferredThumbSourceTitle, setTransferredThumbSourceTitle] = useState<string>('');
  const [transferredThumbSourceArticle, setTransferredThumbSourceArticle] = useState<string>('');
  const [transferredThumbConcept, setTransferredThumbConcept] = useState<any>(null);

  const [transferredEditorScript, setTransferredEditorScript] = useState<ScriptGenerationResponse | null>(null);
  const [transferredEditorSourceTitle, setTransferredEditorSourceTitle] = useState<string>('');

  const handleTransferToYTEditor = (script?: ScriptGenerationResponse | null, sourceTitle?: string) => {
    if (script) setTransferredEditorScript(script);
    if (sourceTitle) setTransferredEditorSourceTitle(sourceTitle);
    setActivePage('yt-editor');
  };

  const handleTransferToThumbnailStudio = (params: {
    script?: ScriptGenerationResponse | null;
    sourceTitle?: string;
    sourceArticle?: string;
    concept?: any;
  }) => {
    if (params.script) setTransferredThumbScript(params.script);
    if (params.sourceTitle) setTransferredThumbSourceTitle(params.sourceTitle);
    if (params.sourceArticle) setTransferredThumbSourceArticle(params.sourceArticle);
    if (params.concept) setTransferredThumbConcept(params.concept);
    setActivePage('thumbnail-studio');
  };

  return (
    <AppLayout
      user={user}
      activePage={activePage}
      onSelectPage={setActivePage}
      onSignOut={handleSignOut}
      onSignIn={onSignIn}
      signingOut={signingOut}
    >
      {/* 1. OVERVIEW PAGE — Authentic JARVIS Command Center Dashboard */}
      {activePage === 'overview' && (
        <OverviewCommandCenter
          user={user}
          onSignIn={onSignIn}
          onNavigate={(page) => setActivePage(page)}
          setDriveConnected={setDriveConnected}
        />
      )}

      {/* 2. SOURCES PAGE */}
      {activePage === 'sources' && (
        <SourcesTab
          userId={effectiveUserId}
          onSelectForScript={handleSelectSourceForScript}
        />
      )}

      {/* 3. SCRIPT GENERATOR PAGE */}
      {activePage === 'scripts' && (
        <ScriptGeneratorTab
          userId={effectiveUserId}
          initialSourceId={selectedScriptSourceId}
          onNavigateToSources={() => setActivePage('sources')}
          onNavigateToConfig={() => setActivePage('api-keys')}
          onTransferToVideoPrompts={handleTransferToVideoPrompts}
          onTransferToSEOStudio={handleTransferToSEOStudio}
          onTransferToThumbnailStudio={(script, title, article) =>
            handleTransferToThumbnailStudio({ script, sourceTitle: title, sourceArticle: article })
          }
          onTransferToYTEditor={(script, title) =>
            handleTransferToYTEditor(script, title)
          }
        />
      )}

      {/* 4. VIDEO PROMPT BUILDER PAGE */}
      {activePage === 'video-prompts' && (
        <VideoPromptBuilderTab
          userId={effectiveUserId}
          transferredScript={transferredScript}
          transferredSourceTitle={transferredSourceTitle}
          onNavigateToScripts={() => setActivePage('scripts')}
          onNavigateToSources={() => setActivePage('sources')}
          onNavigateToOverview={() => setActivePage('overview')}
        />
      )}

      {/* 5. SEO STUDIO PAGE */}
      {activePage === 'seo-studio' && (
        <SEOStudioTab
          userId={effectiveUserId}
          transferredScript={transferredSEOScript}
          transferredSourceTitle={transferredSEOSourceTitle}
          transferredSourceArticle={transferredSEOSourceArticle}
          onNavigateToScripts={() => setActivePage('scripts')}
          onNavigateToSources={() => setActivePage('sources')}
          onTransferToThumbnailStudio={(params) =>
            handleTransferToThumbnailStudio(params)
          }
        />
      )}

      {/* 6. THUMBNAIL STUDIO PAGE */}
      {activePage === 'thumbnail-studio' && (
        <ThumbnailStudioTab
          userId={effectiveUserId}
          transferredScript={transferredThumbScript}
          transferredSourceTitle={transferredThumbSourceTitle}
          transferredSourceArticle={transferredThumbSourceArticle}
          transferredConcept={transferredThumbConcept}
          onNavigateToScripts={() => setActivePage('scripts')}
          onNavigateToSources={() => setActivePage('sources')}
        />
      )}

      {/* 7. YT EDITOR PAGE */}
      {activePage === 'yt-editor' && (
        <YTEditorTab
          userId={effectiveUserId}
          transferredScript={transferredEditorScript}
          transferredSourceTitle={transferredEditorSourceTitle}
          onNavigateToScripts={() => setActivePage('scripts')}
          onNavigateToSources={() => setActivePage('sources')}
        />
      )}

      {/* 8. API CONFIGURATION PAGE */}
      {activePage === 'api-keys' && (
        <div className="space-y-6">
          <GeminiConfigCard userId={effectiveUserId} user={user} onSignIn={onSignIn} />
        </div>
      )}

      {/* 9. SETTINGS PAGE */}
      {activePage === 'settings' && (
        <SettingsPage />
      )}
    </AppLayout>
  );
};
