import { REPORT_REASONS, buildReportPayload } from '../components/reportOptions';

describe('report modal helpers', () => {
  test('builds a normalized report payload', () => {
    expect(buildReportPayload({
      targetType: 'POST',
      targetId: 'post-1',
      reason: 'spam',
      description: '  Pedido de pagamento suspeito  ',
    })).toEqual({
      targetType: 'POST',
      targetId: 'post-1',
      reason: 'Spam ou golpe',
      description: 'Pedido de pagamento suspeito',
    });
  });

  test('keeps report reasons aligned with the backend contract', () => {
    expect(REPORT_REASONS).toHaveLength(6);
    expect(REPORT_REASONS.every(reason => reason.label.length >= 3 && reason.label.length <= 100)).toBe(true);
  });
});
