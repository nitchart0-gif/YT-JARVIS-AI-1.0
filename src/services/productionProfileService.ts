/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ProjectAspectRatio = '9:16' | '16:9';

export interface ProductionProfile {
  projectId: string;
  projectName: string;
  aspectRatio: ProjectAspectRatio;
  orientation: 'portrait' | 'landscape';
  frameWidth: number;
  frameHeight: number;
  frameRate: number;
  targetPlatform: string;
  visualStyle?: string;
  stylePreset?: string;
  cameraMotionPreset?: string;
  lightingPreset?: string;
  audioMusic?: string;
  voiceoverTone?: string;
  continuityLock?: string;
  restrictions?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Get dimensional metrics for a given aspect ratio
 */
export function getAspectRatioDimensions(ratio: ProjectAspectRatio): {
  frameWidth: number;
  frameHeight: number;
  orientation: 'portrait' | 'landscape';
  targetPlatform: string;
} {
  if (ratio === '16:9') {
    return {
      frameWidth: 1920,
      frameHeight: 1080,
      orientation: 'landscape',
      targetPlatform: 'youtube_standard',
    };
  }

  // Default to 9:16 vertical shorts
  return {
    frameWidth: 1080,
    frameHeight: 1920,
    orientation: 'portrait',
    targetPlatform: 'youtube_shorts',
  };
}

/**
 * Create a canonical production profile
 */
export function createDefaultProductionProfile(
  projectId?: string,
  ratio: ProjectAspectRatio = '9:16',
  projectName?: string,
): ProductionProfile {
  const now = Date.now();
  const safeId = projectId || `proj_${now}_${Math.random().toString(36).substring(2, 7)}`;
  const safeName = projectName || (ratio === '9:16' ? 'Apex AI Breakthroughs (9:16)' : 'Cinema Widescreen Feature (16:9)');
  const dims = getAspectRatioDimensions(ratio);

  return {
    projectId: safeId,
    projectName: safeName,
    aspectRatio: ratio,
    orientation: dims.orientation,
    frameWidth: dims.frameWidth,
    frameHeight: dims.frameHeight,
    frameRate: 30,
    targetPlatform: dims.targetPlatform,
    visualStyle: 'Cinematic Photorealistic',
    stylePreset: 'Cinematic Photorealistic',
    cameraMotionPreset: 'Smooth Cinematic Dolly',
    lightingPreset: 'Dramatic Natural Lighting',
    audioMusic: 'Ambient cinematic synthesizer score',
    voiceoverTone: 'Professional Documentary Narrator',
    continuityLock: 'Consistent color grading and scene continuity',
    restrictions: 'No distorted limbs, no text glitches, photorealistic physics',
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Update an existing production profile with automatic dimension recalculation
 */
export function updateProductionProfile(
  current: ProductionProfile,
  changes: Partial<ProductionProfile>,
): ProductionProfile {
  const targetRatio = changes.aspectRatio || current.aspectRatio || '9:16';
  const ratioChanged = targetRatio !== current.aspectRatio;
  const dims = ratioChanged ? getAspectRatioDimensions(targetRatio) : null;

  return {
    ...current,
    ...changes,
    aspectRatio: targetRatio,
    orientation: changes.orientation || dims?.orientation || current.orientation,
    frameWidth: changes.frameWidth || dims?.frameWidth || current.frameWidth,
    frameHeight: changes.frameHeight || dims?.frameHeight || current.frameHeight,
    targetPlatform: changes.targetPlatform || dims?.targetPlatform || current.targetPlatform,
    visualStyle: changes.visualStyle !== undefined ? changes.visualStyle : current.visualStyle,
    stylePreset: changes.stylePreset !== undefined ? changes.stylePreset : current.stylePreset,
    cameraMotionPreset: changes.cameraMotionPreset !== undefined ? changes.cameraMotionPreset : current.cameraMotionPreset,
    lightingPreset: changes.lightingPreset !== undefined ? changes.lightingPreset : current.lightingPreset,
    audioMusic: changes.audioMusic !== undefined ? changes.audioMusic : current.audioMusic,
    voiceoverTone: changes.voiceoverTone !== undefined ? changes.voiceoverTone : current.voiceoverTone,
    continuityLock: changes.continuityLock !== undefined ? changes.continuityLock : current.continuityLock,
    restrictions: changes.restrictions !== undefined ? changes.restrictions : current.restrictions,
    frameRate: changes.frameRate || current.frameRate || 30,
    projectName: changes.projectName || current.projectName,
    updatedAt: Date.now(),
  };
}

/**
 * Validate and sanitize production profile structure
 */
export function validateProductionProfile(data: any): ProductionProfile {
  if (!data || typeof data !== 'object') {
    return createDefaultProductionProfile();
  }

  const rawRatio = data.aspectRatio;
  const ratio: ProjectAspectRatio = rawRatio === '16:9' ? '16:9' : '9:16';
  const dims = getAspectRatioDimensions(ratio);
  const now = Date.now();

  return {
    projectId: typeof data.projectId === 'string' && data.projectId.trim() ? data.projectId : `proj_${now}`,
    projectName: typeof data.projectName === 'string' && data.projectName.trim() ? data.projectName : 'Untitled Project',
    aspectRatio: ratio,
    orientation: data.orientation === 'landscape' || data.orientation === 'portrait' ? data.orientation : dims.orientation,
    frameWidth: Number(data.frameWidth) || dims.frameWidth,
    frameHeight: Number(data.frameHeight) || dims.frameHeight,
    frameRate: Number(data.frameRate) || 30,
    targetPlatform: typeof data.targetPlatform === 'string' ? data.targetPlatform : dims.targetPlatform,
    visualStyle: typeof data.visualStyle === 'string' ? data.visualStyle : 'Cinematic Photorealistic',
    stylePreset: typeof data.stylePreset === 'string' ? data.stylePreset : 'Cinematic Photorealistic',
    cameraMotionPreset: typeof data.cameraMotionPreset === 'string' ? data.cameraMotionPreset : 'Smooth Cinematic Dolly',
    lightingPreset: typeof data.lightingPreset === 'string' ? data.lightingPreset : 'Dramatic Natural Lighting',
    audioMusic: typeof data.audioMusic === 'string' ? data.audioMusic : 'Ambient cinematic synthesizer score',
    voiceoverTone: typeof data.voiceoverTone === 'string' ? data.voiceoverTone : 'Professional Documentary Narrator',
    continuityLock: typeof data.continuityLock === 'string' ? data.continuityLock : 'Consistent color grading and scene continuity',
    restrictions: typeof data.restrictions === 'string' ? data.restrictions : 'No distorted limbs, no text glitches, photorealistic physics',
    createdAt: typeof data.createdAt === 'number' ? data.createdAt : now,
    updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : now,
  };
}

/**
 * Migrate legacy project records into modern ProductionProfile
 */
export function migrateLegacyProject(legacyProject: any): ProductionProfile {
  if (!legacyProject) return createDefaultProductionProfile();

  const id = legacyProject.id || legacyProject.settings?.id || `proj_${Date.now()}`;
  const name = legacyProject.name || legacyProject.settings?.name || 'Migrated Video Project';
  const resId = legacyProject.settings?.resolution?.id || legacyProject.aspectRatio;
  const ratio: ProjectAspectRatio = resId === '16:9' ? '16:9' : '9:16';

  const base = createDefaultProductionProfile(id, ratio, name);
  return {
    ...base,
    createdAt: legacyProject.createdAt ? new Date(legacyProject.createdAt).getTime() : base.createdAt,
    updatedAt: legacyProject.updatedAt ? new Date(legacyProject.updatedAt).getTime() : base.updatedAt,
  };
}
