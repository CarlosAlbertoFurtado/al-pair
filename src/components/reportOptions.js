export const REPORT_REASONS = [
  { value: 'harassment', label: 'Assédio ou intimidação' },
  { value: 'unsafe_advice', label: 'Conselho perigoso' },
  { value: 'spam', label: 'Spam ou golpe' },
  { value: 'hate', label: 'Discurso de ódio' },
  { value: 'sexual_content', label: 'Conteúdo sexual' },
  { value: 'other', label: 'Outro motivo' },
];

export function buildReportPayload({ targetType, targetId, reason, description }) {
  const selected = REPORT_REASONS.find(item => item.value === reason);

  return {
    targetType,
    targetId,
    reason: selected?.label || 'Outro motivo',
    description: description?.trim() || undefined,
  };
}
