import assert from 'node:assert';
import {
  createDefaultProductionProfile,
  updateProductionProfile,
  validateProductionProfile,
  migrateLegacyProject,
  getAspectRatioDimensions,
} from './productionProfileService.ts';

console.log('--- Testing ProductionProfileService ---');

// 1. Default creation
const defaultShort = createDefaultProductionProfile('test-1', '9:16', 'My Short');
assert.strictEqual(defaultShort.projectId, 'test-1');
assert.strictEqual(defaultShort.aspectRatio, '9:16');
assert.strictEqual(defaultShort.orientation, 'portrait');
assert.strictEqual(defaultShort.frameWidth, 1080);
assert.strictEqual(defaultShort.frameHeight, 1920);
assert.strictEqual(defaultShort.targetPlatform, 'youtube_shorts');
console.log('✓ createDefaultProductionProfile (9:16) passed');

const defaultCinema = createDefaultProductionProfile('test-2', '16:9', 'My Cinema Video');
assert.strictEqual(defaultCinema.aspectRatio, '16:9');
assert.strictEqual(defaultCinema.orientation, 'landscape');
assert.strictEqual(defaultCinema.frameWidth, 1920);
assert.strictEqual(defaultCinema.frameHeight, 1080);
assert.strictEqual(defaultCinema.targetPlatform, 'youtube_standard');
console.log('✓ createDefaultProductionProfile (16:9) passed');

// 2. Switching aspect ratio recalculates dimensions
const switched = updateProductionProfile(defaultShort, { aspectRatio: '16:9' });
assert.strictEqual(switched.aspectRatio, '16:9');
assert.strictEqual(switched.orientation, 'landscape');
assert.strictEqual(switched.frameWidth, 1920);
assert.strictEqual(switched.frameHeight, 1080);
assert.strictEqual(switched.targetPlatform, 'youtube_standard');
console.log('✓ updateProductionProfile aspect ratio switch passed');

// 3. Validation handles malformed or legacy structures safely
const validated = validateProductionProfile({
  projectId: 'p-valid',
  aspectRatio: '16:9',
  frameWidth: '1920',
  frameHeight: '1080',
});
assert.strictEqual(validated.projectId, 'p-valid');
assert.strictEqual(validated.frameWidth, 1920);
assert.strictEqual(validated.frameHeight, 1080);
console.log('✓ validateProductionProfile passed');

// 4. Migration from legacy structures
const migrated = migrateLegacyProject({
  id: 'legacy-1',
  name: 'Legacy Short',
  settings: {
    resolution: { id: '9:16' },
  },
});
assert.strictEqual(migrated.projectId, 'legacy-1');
assert.strictEqual(migrated.aspectRatio, '9:16');
assert.strictEqual(migrated.frameWidth, 1080);
assert.strictEqual(migrated.frameHeight, 1920);
console.log('✓ migrateLegacyProject passed');

console.log('All ProductionProfileService tests passed successfully!');
