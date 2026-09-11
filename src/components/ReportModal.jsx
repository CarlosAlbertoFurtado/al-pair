import { AlertTriangle, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { REPORT_REASONS, buildReportPayload } from './reportOptions';

export function ReportModal({ targetType, targetId, targetName, onClose, onSubmit }) {
  const [reason, setReason] = useState(REPORT_REASONS[0].value);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const title = useMemo(() => {
    if (targetType === 'USER') return `Denunciar ${targetName || 'perfil'}`;
    if (targetType === 'MESSAGE') return 'Denunciar mensagem';
    return 'Denunciar publicação';
  }, [targetName, targetType]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await onSubmit(buildReportPayload({ targetType, targetId, reason, description }));
      onClose();
    } catch (err) {
      console.error('Report submit failed:', err);
      setError('Não foi possível enviar a denúncia agora.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/40 px-3 py-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-start gap-3 p-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-black text-slate-900">{title}</h2>
            <p className="text-xs text-slate-500 leading-relaxed mt-1">
              A moderação recebe o motivo e revisa o conteúdo denunciado.
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 -mt-2 -mr-2 rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Motivo</label>
            <div className="grid gap-2">
              {REPORT_REASONS.map(item => (
                <label key={item.value} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 text-sm text-slate-700 has-[:checked]:border-rose-400 has-[:checked]:bg-rose-50">
                  <input
                    type="radio"
                    name="reason"
                    value={item.value}
                    checked={reason === item.value}
                    onChange={(event) => setReason(event.target.value)}
                    className="accent-rose-500"
                  />
                  <span className="font-semibold">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="report-description" className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Detalhes opcionais
            </label>
            <textarea
              id="report-description"
              value={description}
              onChange={(event) => setDescription(event.target.value.slice(0, 500))}
              rows={4}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 resize-none"
              placeholder="Conte rapidamente o que aconteceu."
            />
            <p className="mt-1 text-[11px] text-slate-400 text-right">{description.length}/500</p>
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{error}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50">
          <button type="button" onClick={onClose} disabled={submitting} className="h-11 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 disabled:opacity-60">
            Cancelar
          </button>
          <button type="submit" disabled={submitting} className="h-11 rounded-xl bg-slate-900 text-sm font-bold text-white disabled:opacity-60">
            {submitting ? 'Enviando...' : 'Enviar denúncia'}
          </button>
        </div>
      </form>
    </div>
  );
}
