import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ShieldAlert, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { moderationAPI } from '../../api';
import { LoadingSpinner } from '../../components/LoadingSpinner';

const statusLabels = {
  OPEN: 'Aberta',
  REVIEWING: 'Em análise',
  ACTIONED: 'Ação tomada',
  DISMISSED: 'Descartada',
};

const targetLabels = {
  USER: 'Usuário',
  POST: 'Post',
  MESSAGE: 'Mensagem',
};

function getTargetSummary(report) {
  if (!report.target) return 'Conteúdo não encontrado ou já removido.';
  if (report.targetType === 'USER') return report.target.displayName || report.target.email || report.targetId;
  if (report.targetType === 'POST') return report.target.content || report.target.imageUrl || report.targetId;
  return report.target.content || report.targetId;
}

export default function AdminModerationScreen() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [status, setStatus] = useState('OPEN');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState('');

  const openCount = useMemo(() => reports.filter(report => report.status === 'OPEN').length, [reports]);

  useEffect(() => {
    fetchReports(status);
  }, [status]);

  const fetchReports = async (nextStatus) => {
    setLoading(true);
    setError('');
    try {
      const res = await moderationAPI.listReports({ status: nextStatus, limit: 50 });
      setReports(res.data.data.reports || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Não foi possível carregar a moderação.');
    } finally {
      setLoading(false);
    }
  };

  const changeStatus = async (reportId, nextStatus) => {
    setSavingId(reportId);
    setError('');
    try {
      await moderationAPI.updateReportStatus(reportId, nextStatus);
      await fetchReports(status);
    } catch (err) {
      setError(err.response?.data?.message || 'Não foi possível atualizar a denúncia.');
    } finally {
      setSavingId('');
    }
  };

  return (
    <div className="bg-slate-50 min-h-full pb-10">
      <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-100">
            <ChevronLeft size={24} />
          </button>
          <div className="flex items-center gap-2 text-slate-800 min-w-0">
            <ShieldAlert size={20} />
            <h2 className="text-lg font-bold truncate">Moderação</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          {['OPEN', 'REVIEWING', 'ACTIONED', 'DISMISSED'].map(item => (
            <button
              key={item}
              onClick={() => setStatus(item)}
              className={`px-3 py-2 rounded-lg text-xs font-bold border ${
                status === item
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              {statusLabels[item]}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-slate-700">{reports.length} denúncias</p>
          {status === 'OPEN' && <p className="text-xs font-bold text-rose-500">{openCount} abertas</p>}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-100 text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center p-10"><LoadingSpinner /></div>
        ) : (
          <div className="space-y-3">
            {reports.map(report => (
              <article key={report.id} className="bg-white border border-slate-100 rounded-lg p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase text-slate-400">
                      {targetLabels[report.targetType]} denunciado
                    </p>
                    <h3 className="mt-1 text-sm font-bold text-slate-900 line-clamp-2">{getTargetSummary(report)}</h3>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">
                    {statusLabels[report.status] || report.status}
                  </span>
                </div>

                <div className="mt-3 text-sm text-slate-600 space-y-1">
                  <p><span className="font-bold text-slate-800">Motivo:</span> {report.reason}</p>
                  {report.description && <p><span className="font-bold text-slate-800">Descrição:</span> {report.description}</p>}
                  <p><span className="font-bold text-slate-800">Reporter:</span> {report.reporter?.displayName || report.reporter?.email}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(report.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4">
                  <button
                    onClick={() => changeStatus(report.id, 'REVIEWING')}
                    disabled={savingId === report.id}
                    className="flex items-center justify-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-2 text-[11px] font-bold text-amber-700 disabled:opacity-60"
                  >
                    <Clock size={14} /> Analisar
                  </button>
                  <button
                    onClick={() => changeStatus(report.id, 'ACTIONED')}
                    disabled={savingId === report.id}
                    className="flex items-center justify-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-2 text-[11px] font-bold text-emerald-700 disabled:opacity-60"
                  >
                    <CheckCircle2 size={14} /> Ação
                  </button>
                  <button
                    onClick={() => changeStatus(report.id, 'DISMISSED')}
                    disabled={savingId === report.id}
                    className="flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-[11px] font-bold text-slate-600 disabled:opacity-60"
                  >
                    <XCircle size={14} /> Descartar
                  </button>
                </div>
              </article>
            ))}

            {reports.length === 0 && (
              <div className="flex flex-col items-center justify-center p-10 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-4">
                  <ShieldAlert size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-1">Fila vazia</h3>
                <p className="text-sm text-slate-400">Não há denúncias com esse status.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
