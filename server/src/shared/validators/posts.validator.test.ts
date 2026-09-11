import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createPostSchema } from './posts.validator.js';

describe('post validators', () => {
  it('accepts image-only posts', () => {
    const result = createPostSchema.safeParse({
      imageUrl: '/uploads/aupairconnect/posts/photo.jpg',
    });

    assert.equal(result.success, true);
  });

  it('rejects empty posts without images', () => {
    const result = createPostSchema.safeParse({ content: '   ' });

    assert.equal(result.success, false);
  });
});
