import assert from 'node:assert';
import {
  createDefaultProductionProfile,
  updateProductionProfile,
} from './productionProfileService.ts';
import {
  createInitialEditorProject,
} from './editorDefaults.ts';

console.log('--- Testing Workflow Verification ---');

// 1. Verify Profile <-> Video Editor synchronization
const profile = createDefaultProductionProfile('wf-proj-1', '9:16', 'Breakthrough Silicon');
assert.strictEqual(profile.frameWidth, 1080);
assert.strictEqual(profile.frameHeight, 1920);

const editorProject = createInitialEditorProject();
assert.ok(editorProject.settings.id);
assert.ok(editorProject.tracks.length >= 3);
console.log('✓ Editor project structure initialized');

// 2. Switch to 16:9
const widescreenProfile = updateProductionProfile(profile, { aspectRatio: '16:9' });
assert.strictEqual(widescreenProfile.frameWidth, 1920);
assert.strictEqual(widescreenProfile.frameHeight, 1080);
assert.strictEqual(widescreenProfile.targetPlatform, 'youtube_standard');
console.log('✓ Widescreen transition verified');

console.log('All workflow verification tests passed successfully!');
