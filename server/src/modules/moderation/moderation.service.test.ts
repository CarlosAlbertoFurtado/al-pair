import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildReportData, reportSchema, visiblePostWhere, visibleUserWhere } from './moderation.service.js';

describe('moderation service', () => {
  it('builds normalized report data for persistence', () => {
    const data = buildReportData('viewer-1', {
      targetType: 'POST',
      targetId: 'post-1',
      reason: '  Spam ou golpe  ',
      description: '  Perfil pedindo pagamento fora da plataforma  ',
    });

    assert.deepEqual(data, {
      reporterId: 'viewer-1',
      targetType: 'POST',
      targetId: 'post-1',
      reason: 'Spam ou golpe',
      description: 'Perfil pedindo pagamento fora da plataforma',
    });
  });

  it('omits empty report descriptions', () => {
    const data = buildReportData('viewer-1', {
      targetType: 'USER',
      targetId: 'user-2',
      reason: 'Assédio ou intimidação',
      description: '   ',
    });

    assert.equal(data.description, undefined);
  });

  it('validates report target, reason, and description limits', () => {
    const valid = reportSchema.safeParse({
      targetType: 'MESSAGE',
      targetId: 'message-1',
      reason: 'Discurso de ódio',
      description: 'Relato curto.',
    });

    const invalid = reportSchema.safeParse({
      targetType: 'ROOM',
      targetId: '',
      reason: 'ok',
      description: 'x'.repeat(501),
    });

    assert.equal(valid.success, true);
    assert.equal(invalid.success, false);
  });

  it('returns reciprocal block filters for visible users and posts', () => {
    assert.deepEqual(visibleUserWhere('viewer-1'), {
      AND: [
        { blocksReceived: { none: { blockerId: 'viewer-1' } } },
        { blocksInitiated: { none: { blockedId: 'viewer-1' } } },
      ],
    });

    assert.deepEqual(visiblePostWhere('viewer-1'), {
      author: visibleUserWhere('viewer-1'),
    });
  });
});
