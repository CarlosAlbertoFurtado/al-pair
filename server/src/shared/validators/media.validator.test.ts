import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedMediaUrl, mediaUrlSchema } from './media.validator.js';

describe('media validators', () => {
  it('accepts local uploads and Cloudinary media URLs', () => {
    assert.equal(isAllowedMediaUrl('/uploads/aupairconnect/posts/photo.jpg'), true);
    assert.equal(isAllowedMediaUrl('https://res.cloudinary.com/demo/image/upload/avatar.jpg'), true);
  });

  it('rejects arbitrary remote media URLs', () => {
    const result = mediaUrlSchema.safeParse('https://example.com/untrusted-image.jpg');
    assert.equal(result.success, false);
  });
});
