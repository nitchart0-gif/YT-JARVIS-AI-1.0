# Google Workspace Connection Portal - Project Status

## 1. Project Overview & Architecture
The **Google Workspace Connection Portal** provides an isolated, enterprise-grade authentication and configuration bridge:
- **Authentication**: Official Google OAuth 2.0 / OpenID Connect powered by Firebase Auth client SDK.
- **Drive Authorization**: Distinct, least-privilege permission management strictly scoped to `https://www.googleapis.com/auth/drive.file`.
- **API Key Security**: Server-side AES-256-GCM encryption with authenticated integrity tags. Plaintext keys are never stored in browser storage (`localStorage` / `sessionStorage`), never sent in browser bundles, and never returned to the client after submission.
- **Mandatory Gemini Model**: Statically configured and strictly locked to `gemini-3.8-flash`. All probes and validations execute against this exact model ID without fallbacks.

## 2. Completed Features (Phase 1)
- [x] **Page A: Login**
  - Application branding: *Google Workspace Connection Portal*.
  - Purpose summary and security pillar cards.
  - Official "Continue with Google" sign-in flow.
  - Comprehensive privacy notice covering memory-only token retention, minimal `drive.file` scope, and AES-256-GCM server-side key encryption.
  - Error and popup cancellation handlers.
- [x] **Page B: Dashboard**
  - Real Google account profile photo, name, email, and UID indicator.
  - Independent Google authentication status badge.
  - Distinct Google Drive authorization status ("Authorized" vs "Not Connected").
  - "Connect Google Drive", "Verify", and "Disconnect Google Drive" (token revocation & in-memory clearing).
  - Telemetry card displaying storage quotas and drive user identity.
  - Official links to Google AI Studio and Google Cloud Console.
  - Clean sign-out action with full session purge.
- [x] **Page C: Gemini API Configuration**
  - Section title: "Gemini API Configuration".
  - Model lock: `gemini-3.8-flash` with direct link to official Google model documentation.
  - Direct links to Google AI Studio API Keys (`https://aistudio.google.com/api-keys`) and Google Cloud Console Credentials (`https://console.cloud.google.com/apis/credentials`).
  - Password-style input field with Show/Hide toggle.
  - Instant server-side validation against `gemini-3.8-flash` with probe latency telemetry.
  - Secure AES-256-GCM storage and masked key display (`AIzaSy...****8K12`).
  - "Run Test Probe" action (tests server-stored encrypted key without re-entering or exposing the key).
  - "Replace API Key" and "Delete Saved API Key" actions.
  - Clear billing and quota responsibilities advisory.

- [x] **Sources Tab**
  - Dedicated "Sources" tab integrated cleanly into dashboard navigation.
  - Large multiline text input area with placeholder: "Paste your article or source text here...".
  - "Save Source" button (disabled on empty or whitespace-only input).
  - "Clear" button to wipe the textarea.
  - Storage transparency notice indicating per-account browser persistence (`localStorage`) and absence of external cloud databases.
  - Saved sources list rendering items with original line breaks and indentation preserved (`whitespace-pre-wrap`).
  - "Copy Text" button per source with temporary "Copied!" visual feedback.
  - "Delete" button per source with confirmation dialog.
  - Multi-item management without overwriting previous sources.

- [x] **Script Generator Tab (New)**
  - Dedicated "Script Generator" tab in dashboard navigation.
  - Source Article / Story input area with word and character counters.
  - Direct integration with saved sources: "Load from Saved Sources" dropdown instantly loads previously saved articles without manual copying.
  - 12 distinct content modes with specific editorial rules: Professional News, Breaking News, Documentary, Educational, Explainer, History, Science & Technology, Business & Finance, Biography, Storytelling, Mystery & Investigation, Motivational.
  - 6 supported durations (24s, 32s, 40s, 48s, 56s, 60s) with deterministic segment calculations (8s per segment, with 60s ending at 4s [56–60s]).
  - 4 languages: Hindi (default), Gujarati, English, Hinglish.
  - Factual integrity & prompt injection shielding (`<source_material>` encapsulation).
  - Clean editor output with segment timing, word counts, editable textareas, "Copy Segment", "Copy Full Script", "Regenerate", and "Clear".
  - Powered exclusively by `gemini-3.8-flash` on the server using encrypted credentials or platform key.

- [x] **Premium AI Workspace Dashboard UI & Navigation (Phase 4)**
  - Centralized navigation registry (`src/navigation.ts`) supporting effortless registration of future modules.
  - Persistent left sidebar with collapse/expand toggle, hover tooltips, smooth animations, and active state highlights.
  - Mobile slide-out navigation drawer with touch backdrop and responsive behavior.
  - Quick theme toggle (Dark / Light) accessible in TopBar and Sidebar with zero page reload.
  - Theme customization engine with 5 curated presets: Midnight Space, Ocean Blue, Violet Nebula, Emerald Focus, and Clean Light.
  - System mode detection with automatic OS theme synchronization.
  - 3D interactive particle space background canvas with subtle mouse parallax, reduced-motion accessibility, and visibility-change CPU pausing.
  - Dedicated "Settings" page with live preset switching, preview cards, and one-click reset to defaults.
  - Account and session controls neatly anchored in the sidebar footer with one-click secure sign-out.

## 3. Configuration & Secrets
- [x] **Unified Sources & Script Generation Workflow (Phase 5)**
  - Single central location in **Sources** tab for adding articles, news, and research text.
  - Added descriptive **Source Title** input with intelligent auto-titling fallback from first sentence.
  - Added **View modal** for full reading and clipboard copying.
  - Added **Edit modal** for inline editing of title and content without losing records.
  - Added **"Generate Script"** one-click shortcut from any saved source directly into the Script Generator tab.
  - Script Generator upgraded to eliminate duplicate pasting: searchable dropdown panel selects existing sources with live character/word preview and non-destructive script tweaking.
  - Preserved backward compatibility: migrates any previously saved source items without titles automatically.

- [x] **4 Complete Production UI Themes (Phase 5)**
  - **Theme 1: Carbon Black (`carbon-black`) [DEFAULT]**: Minimal, clean, ultra-premium true black (`#000000` / `#050505`), dark charcoal elevated surfaces (`#111111`), crisp white neon highlights (`#ffffff`).
  - **Theme 2: Midnight Blue (`midnight-blue`)**: Deep navy background (`#070b14`), layered midnight cards (`#0d1527`), electric cyan glow (`#38bdf8`).
  - **Theme 3: Dark Slate (`dark-slate`)**: Modern slate background (`#0f172a`), balanced graphite cards (`#1e293b`), crisp botanical emerald highlights (`#10b981`).
  - **Theme 4: Light Mode (`light-mode`)**: Crisp daylight background (`#f8fafc` / `#ffffff`), clean elevated white cards (`#ffffff`), subtle borders (`#e2e8f0`), deep slate text (`#0f172a`), royal indigo focus (`#4f46e5`).
  - Settings page enhanced with visual palette cards displaying background, surface, and accent swatches with instant one-click switching and persistence in `localStorage`.

## 3. Configuration & Secrets
- `firebase-applet-config.json`: Provisioned with project `agent-key-509513` and authorized OAuth Client.
- `PORTAL_ENCRYPTION_SECRET`: Optional 32-byte secret for persistent AES-256-GCM encryption across server restarts. In the active session, a cryptographically secure 32-byte ephemeral key is generated and labelled.
- `GEMINI_API_KEY`: User supplies their own Gemini API key through the portal UI; verified with `gemini-3.8-flash`.
- [x] **Connected Video Prompt Builder for Google Flow (Phase 6)**
  - Added **Video Prompt Builder** tab to centralized navigation (`src/navigation.ts`) with custom film icon and badge.
  - Seamless 1-click **"Generate Video Prompts"** button in `ScriptGeneratorTab` bulk actions and bottom call-to-action banner.
  - Passes structured script segment data (segment type, order, exact dialogue, assigned duration) directly into `VideoPromptBuilderTab` without re-pasting.
  - Strict 1:1 segment-to-prompt mapping (Hook + Main Parts + Ending = exact number of prompts).
  - Strict script-to-visual matching: generates cinematographic scenes, camera movement, lighting atmosphere, composition, visual style, and copy-paste-ready Google Flow / Veo prompts.
  - Aspect ratio toggle (`16:9` widescreen, `9:16` vertical Shorts/Reels, `1:1` square).
  - Style presets: Cinematic 35mm, Documentary Archival, Hyper-Realistic 3D, Stylized Animation, Cyberpunk / Sci-Fi, Commercial Clean.
  - Camera & lighting direction controls with instant batch regeneration.
  - Inline prompt editing mode with save functionality.
  - Single segment regeneration modal with optional custom visual direction tweaks.
  - Individual prompt copy button and bulk "Copy All Prompts" storyboard action.
  - Direct Google Drive export saving markdown storyboard documents via authorized `drive.file` scope.
  - Local export to Markdown (`.md`) and JSON (`.json`).
  - LocalStorage persistence (`workspace_video_prompts_${userId}`) preserving prompts and active scripts across tabs and reloads.

## 4. Test Report
- **Tests Passed**:
  - `TypeScript Lint Check` (`tsc --noEmit`): Passed with 0 errors.
  - `Production Build` (`npm run build`): Compiled and bundled successfully.
  - `Health API Status`: Verified `GET /api/health` returning 200 OK with mandatory `gemini-3.8-flash` configuration.
  - `Server Prompt Generator Endpoint` (`POST /api/prompts/generate`): Verified returning 200 OK with full Google Flow structured prompts for all segments.
  - `Server Single Segment Regenerate Endpoint` (`POST /api/prompts/generate-segment`): Verified returning 200 OK with live Gemini 3.8 Flash model generation, customized direction, and vertical 9:16 aspect ratio.
  - `Navigation & Presets`: Tested `video-prompts` in left persistent sidebar, mobile drawer, and top bar breadcrumbs.
  - `Drive Export & Local Download`: Tested Google Drive multipart document upload and markdown storyboard generator.
  - `4 Themes Support`: Verified `carbon-black`, `midnight-blue`, `dark-slate`, and `light-mode` adaptability with CSS variable tokens.
- **Tests Blocked by Missing Configuration**: None.
- **Manual Setup Still Required**: None.

## 5. Next Steps
- Production ready.


