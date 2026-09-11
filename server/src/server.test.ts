import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from './server.js';

describe('server app', () => {
  it('returns the API 404 contract for unknown routes', async () => {
    const response = await request(app).get('/api/not-found-smoke');

    assert.equal(response.status, 404);
    assert.equal(response.body.success, false);
    assert.equal(response.body.message, 'Endpoint não encontrado.');
  });
});
