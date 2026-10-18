import { safeFetchAIJson } from './apiResponseHandler.ts';

export interface HealthStatus {
  status: string;
  mandatoryModel: string;
  encryptionMode: string;
  isEphemeralEncryptionKey: boolean;
  documentation: {
    modelDoc: string;
    aiStudioKeys: string;
    gcpCredentials: string;
  };
  timestamp: string;
}

export interface DriveStatusResponse {
  authorized: boolean;
  scope?: string;
  driveUser?: {
    displayName: string;
    emailAddress: string;
    permissionId: string;
  };
  storageQuota?: {
    limit?: string;
    usage?: string;
    usageInDrive?: string;
  } | null;
  error?: string;
}

export interface GeminiValidationResponse {
  valid: boolean;
  model: string;
  maskedKey: string;
  latencyMs: number;
  message: string;
}

export interface GeneratedSegment {
  segmentNumber: number;
  type: string;
  timestamp: string;
  voiceover: string;
  estimatedDurationSeconds: number;
  wordCount: number;
}

export interface ScriptGenerationResponse {
  contentMode: string;
  durationSeconds: number;
  language: string;
  totalSegments: number;
  estimatedTotalSeconds: number;
  segments: GeneratedSegment[];
  model: string;
  topic?: string;
  angle?: string;
  targetAudience?: string;
  hookStyle?: string;
  suggestedTitle?: string;
  sourceId?: string;
  sourceTitle?: string;
  aspectRatio?: string;
}

export interface GeminiKeyStatusResponse {
  configured: boolean;
  maskedKey: string | null;
  configuredAt?: number;
  lastValidatedAt?: number;
  model: string;
  encryptionMode?: string;
  isEphemeralKey?: boolean;
}

export const api = {
  async getHealth(): Promise<HealthStatus> {
    return safeFetchAIJson<HealthStatus>('/api/health');
  },

  async checkDriveStatus(token: string | null): Promise<DriveStatusResponse> {
    if (!token) {
      return { authorized: false, error: 'No active Google Drive session.' };
    }
    return safeFetchAIJson<DriveStatusResponse>('/api/drive/status', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  async revokeDriveAccess(token: string): Promise<{ revoked: boolean; message: string }> {
    return safeFetchAIJson<{ revoked: boolean; message: string }>('/api/drive/revoke', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  async validateKey(apiKey: string): Promise<GeminiValidationResponse> {
    return safeFetchAIJson<GeminiValidationResponse>('/api/gemini/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey }),
    });
  },

  async saveKey(userId: string, apiKey: string): Promise<{ success: boolean; maskedKey: string; message: string; model: string }> {
    return safeFetchAIJson<{ success: boolean; maskedKey: string; message: string; model: string }>('/api/gemini/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({ apiKey }),
    });
  },

  async getKeyStatus(userId: string): Promise<GeminiKeyStatusResponse> {
    return safeFetchAIJson<GeminiKeyStatusResponse>('/api/gemini/status', {
      headers: {
        'x-user-id': userId,
      },
    });
  },

  async testKeyProbe(userId: string): Promise<GeminiValidationResponse> {
    return safeFetchAIJson<GeminiValidationResponse>('/api/gemini/test-probe', {
      method: 'POST',
      headers: {
        'x-user-id': userId,
      },
    });
  },

  async deleteKey(userId: string): Promise<{ success: boolean; message: string }> {
    return safeFetchAIJson<{ success: boolean; message: string }>('/api/gemini/key', {
      method: 'DELETE',
      headers: {
        'x-user-id': userId,
      },
    });
  },

  async generateScript(params: {
    userId: string;
    sourceText: string;
    contentMode: string;
    durationSeconds: number;
    language: string;
    onRetry?: (info: { attempt: number; maxRetries: number; delayMs: number; reason: string; status?: number }) => void;
  }): Promise<ScriptGenerationResponse> {
    return safeFetchAIJson<ScriptGenerationResponse>(
      '/api/script/generate',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': params.userId,
        },
        body: JSON.stringify({
          sourceText: params.sourceText,
          contentMode: params.contentMode,
          durationSeconds: params.durationSeconds,
          language: params.language,
        }),
      },
      {
        maxRetries: 3,
        initialDelayMs: 1500,
        backoffFactor: 1.8,
        onRetry: params.onRetry,
      }
    );
  },

  async generateScriptFromTopic(params: {
    userId: string;
    topic: string;
    angle?: string;
    targetAudience?: string;
    contentMode: string;
    durationSeconds: number;
    language: string;
    hookStyle?: string;
    onRetry?: (info: { attempt: number; maxRetries: number; delayMs: number; reason: string; status?: number }) => void;
  }): Promise<ScriptGenerationResponse> {
    return safeFetchAIJson<ScriptGenerationResponse>(
      '/api/script/generate-topic',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': params.userId,
        },
        body: JSON.stringify({
          topic: params.topic,
          angle: params.angle,
          targetAudience: params.targetAudience,
          contentMode: params.contentMode,
          durationSeconds: params.durationSeconds,
          language: params.language,
          hookStyle: params.hookStyle,
        }),
      },
      {
        maxRetries: 3,
        initialDelayMs: 1500,
        backoffFactor: 1.8,
        onRetry: params.onRetry,
      }
    );
  },

  async generateVideoPrompts(params: {
    userId: string;
    segments: GeneratedSegment[];
    contentMode: string;
    sourceTitle?: string;
    aspectRatio?: '16:9' | '9:16' | '1:1';
    stylePreset?: string;
    cameraMotionPreset?: string;
    lightingPreset?: string;
  }): Promise<GeneratePromptsResponse> {
    return safeFetchAIJson<GeneratePromptsResponse>('/api/prompts/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': params.userId,
      },
      body: JSON.stringify({
        segments: params.segments,
        contentMode: params.contentMode,
        sourceTitle: params.sourceTitle,
        aspectRatio: params.aspectRatio,
        stylePreset: params.stylePreset,
        cameraMotionPreset: params.cameraMotionPreset,
        lightingPreset: params.lightingPreset,
      }),
    });
  },

  async generateSinglePrompt(params: {
    userId: string;
    segment: GeneratedSegment;
    contentMode: string;
    aspectRatio?: '16:9' | '9:16' | '1:1';
    stylePreset?: string;
    cameraMotionPreset?: string;
    lightingPreset?: string;
    customInstruction?: string;
  }): Promise<VideoPromptSegment> {
    const data = await safeFetchAIJson<{ prompt: VideoPromptSegment }>('/api/prompts/generate-segment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': params.userId,
      },
      body: JSON.stringify({
        segment: params.segment,
        contentMode: params.contentMode,
        aspectRatio: params.aspectRatio,
        stylePreset: params.stylePreset,
        cameraMotionPreset: params.cameraMotionPreset,
        lightingPreset: params.lightingPreset,
        customInstruction: params.customInstruction,
      }),
    });
    return data.prompt;
  },

  async saveFileToGoogleDrive(params: {
    accessToken: string;
    fileName: string;
    content: string;
    mimeType?: string;
  }): Promise<{ id: string; name: string; webViewLink?: string }> {
    const boundary = '-------GoogleDriveUploadBoundary' + Math.random().toString(36).substring(2);
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: params.fileName,
      mimeType: params.mimeType || 'text/markdown',
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${params.mimeType || 'text/markdown'}; charset=UTF-8\r\n\r\n` +
      params.content +
      closeDelimiter;

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || 'Failed to upload document to Google Drive.');
    }
    return data;
  },

  async generateYouTubeSEO(params: {
    userId: string;
    scriptText?: string;
    scriptSegments?: GeneratedSegment[];
    sourceText?: string;
    sourceTitle?: string;
    contentMode?: string;
    videoFormat?: 'shorts' | 'long-form';
    language?: string;
    customInstruction?: string;
  }): Promise<YouTubeSEOPackage> {
    return safeFetchAIJson<YouTubeSEOPackage>('/api/seo/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': params.userId,
      },
      body: JSON.stringify({
        scriptText: params.scriptText,
        scriptSegments: params.scriptSegments,
        sourceText: params.sourceText,
        sourceTitle: params.sourceTitle,
        contentMode: params.contentMode,
        videoFormat: params.videoFormat || 'shorts',
        language: params.language || 'auto',
        customInstruction: params.customInstruction,
      }),
    });
  },

  async regenerateSEOSection(params: {
    userId: string;
    section: 'titles' | 'description' | 'keywords' | 'tags' | 'hashtags' | 'thumbnails' | 'pinnedComment';
    sourceText?: string;
    scriptText?: string;
    sourceTitle?: string;
    videoFormat?: 'shorts' | 'long-form';
    language?: string;
    currentSeoPackage?: Partial<YouTubeSEOPackage>;
    customInstruction?: string;
  }): Promise<{ section: string; data: any }> {
    return safeFetchAIJson<{ section: string; data: any }>('/api/seo/regenerate-section', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': params.userId,
      },
      body: JSON.stringify(params),
    });
  },

  async generateThumbnailPackage(params: {
    userId: string;
    sourceTitle?: string;
    sourceText?: string;
    scriptText?: string;
    contentMode?: string;
    language?: string;
    customInstruction?: string;
  }): Promise<ThumbnailStudioPackage> {
    return safeFetchAIJson<ThumbnailStudioPackage>('/api/thumbnails/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': params.userId,
      },
      body: JSON.stringify(params),
    });
  },

  async regenerateThumbnailConcept(params: {
    userId: string;
    conceptNumber: number;
    genre: string;
    sourceTitle?: string;
    scriptText?: string;
    currentHeadline?: string;
    customNotes?: string;
  }): Promise<{ concept: ThumbnailProductionConcept }> {
    return safeFetchAIJson<{ concept: ThumbnailProductionConcept }>('/api/thumbnails/regenerate-concept', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': params.userId,
      },
      body: JSON.stringify(params),
    });
  },
};

export interface VideoPromptSegment {
  segmentNumber: number;
  segmentType: string;
  timestamp: string;
  durationSeconds: number;
  voiceover: string;
  visualScene: string;
  cameraMovement: string;
  lighting: string;
  visualStyle: string;
  composition: string;
  googleFlowPrompt: string;
  negativePrompt: string;
  aspectRatio?: '16:9' | '9:16' | '1:1';
  audioMusic?: string;
  voiceoverInstructions?: string;
  continuityLock?: string;
  restrictions?: string;
}

export interface ProductionContinuityProfile {
  contentMode: string;
  aspectRatio: '16:9' | '9:16' | '1:1';
  stylePreset: string;
  cameraMotionPreset: string;
  lightingPreset: string;
  durationSeconds: number;
  totalSegments: number;
  colorGrading: string;
  audioMusic: string;
  voiceoverTone: string;
  continuityLock: string;
  restrictions: string;
}

export interface VideoPromptProject {
  id: string;
  sourceTitle: string;
  contentMode: string;
  durationSeconds: number;
  language: string;
  aspectRatio: '16:9' | '9:16' | '1:1';
  stylePreset: string;
  cameraMotionPreset: string;
  lightingPreset: string;
  createdAt: number;
  updatedAt: number;
  prompts: VideoPromptSegment[];
}

export interface GeneratePromptsResponse {
  prompts: VideoPromptSegment[];
  model: string;
  aspectRatio: string;
  stylePreset: string;
}

// -------------------------------------------------------------
// YouTube SEO Studio Interfaces
// -------------------------------------------------------------

export interface YouTubeTitleOption {
  type: 'Search-focused' | 'Curiosity-driven' | 'Question-based' | 'News/Explainer' | 'Best Balanced';
  title: string;
  charCount: number;
  explanation: string;
}

export interface KeywordItem {
  phrase: string;
  relevance: string;
  category: 'primary' | 'secondary' | 'long-tail' | 'question' | 'hindi' | 'hinglish' | 'english' | 'entity';
}

export interface ThumbnailConcept {
  conceptNumber: number;
  title: string;
  mainVisualSubject: string;
  composition: string;
  backgroundColorDirection: string;
  emotionCuriosityAngle: string;
  thumbnailText: string;
  targetAudienceRationale: string;
}

export interface StoryAnalysis {
  mainTopic: string;
  centralClaim: string;
  primarySubjects: string[];
  organizations: string[];
  locations: string[];
  peopleMentioned: string[];
  targetAudience: string;
  searchIntent: string;
  detectedLanguage: string;
  contentFormat: string;
  keySpecificKeywords: string[];
  factualClaimsToVerify: string[];
  uncertaintyFlags: string[];
}

export interface YouTubeSEOPackage {
  id: string;
  createdAt: number;
  sourceTitle: string;
  videoFormat: 'shorts' | 'long-form';
  selectedLanguage: string;
  contentMode?: string;
  storyAnalysis: StoryAnalysis;
  titles: {
    recommendedIndex: number;
    recommendationReason: string;
    options: YouTubeTitleOption[];
  };
  description: {
    text: string;
    openingHook: string;
    conciseSummary: string;
    callToAction: string;
    chaptersOrTimestamps?: string;
    aiDisclosure: string;
    hashtags: string[];
  };
  keywords: {
    primary: KeywordItem[];
    secondary: KeywordItem[];
    longTail: KeywordItem[];
    questions: KeywordItem[];
    hindi: KeywordItem[];
    hinglish: KeywordItem[];
    english: KeywordItem[];
    entities: KeywordItem[];
  };
  tags: {
    tagList: string[];
    rawCommaSeparated: string;
    characterCount: number;
    isValidLimit: boolean; // must be <= 500 characters
    disclaimer: string;
  };
  hashtags: {
    recommended: string[];
    formattedString: string;
  };
  thumbnailConcepts: ThumbnailConcept[];
  searchIntentAndAudience: {
    viewersGoal: string;
    targetAudience: string;
    intentMatchingKeywords: string[];
    platformSuitability: 'Shorts Discovery' | 'YouTube Search' | 'Both Shorts & Search';
    keyTermsToIncludeInVideo: string[];
  };
  pinnedComment: {
    text: string;
    discussionPrompt: string;
  };
  checklist: {
    titleRelevance: boolean;
    descriptionAccuracy: boolean;
    primaryKeywordIncluded: boolean;
    tagsUnder500: boolean;
    relevantHashtags: boolean;
    thumbnailClarity: boolean;
    correctLanguageAudience: boolean;
    factualVerificationDone: boolean;
    syntheticMediaDisclosure: boolean;
  };
  model: string;
}

// -------------------------------------------------------------
// YouTube Thumbnail Studio Interfaces
// -------------------------------------------------------------

export type ThumbnailGenre =
  | 'Investigative Documentary'
  | 'Tech Hardware Breakdown'
  | 'Human Consequence & Power'
  | 'Dramatic Split Comparison'
  | 'Minimalist High-Impact Metaphor';

export interface ThumbnailProductionConcept {
  id: string;
  conceptNumber: number;
  genre: ThumbnailGenre;
  conceptName: string;
  rationale: string;
  headlineText: string;
  subHeadlineText?: string;
  headlineColor: string; // e.g. '#FACC15', '#EF4444', '#FFFFFF', '#22D3EE'
  headlinePosition: 'top-left' | 'center-left' | 'bottom-left' | 'top-right' | 'bottom-right';
  headlineStyle: 'solid-pill' | 'dark-box' | 'heavy-shadow' | 'gradient-glow' | 'minimal-outline';
  focalSubject: string;
  environmentAndDepth: string;
  lightingAndOptics: string;
  colorGrade: string;
  recommendedAssetKey: 'cleanroom' | 'datacenter' | 'microchip' | 'warroom';
  imagePromptMidjourney: string;
  imagePromptImagen: string;
  negativePrompt: string;
}

export interface ThumbnailStudioPackage {
  id: string;
  createdAt: number;
  sourceTitle: string;
  contentMode?: string;
  storyAnalysis: {
    coreTopic: string;
    centralConflict: string;
    keyEntity: string;
    emotionalAngle: string;
    targetAudience: string;
  };
  concepts: ThumbnailProductionConcept[];
  colorGradePresets: Array<{
    id: string;
    name: string;
    cssFilter: string;
    description: string;
  }>;
  model: string;
}


