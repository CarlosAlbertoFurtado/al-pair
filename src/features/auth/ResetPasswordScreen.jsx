import { useMemo, useState } from 'react';
import { ChevronLeft, KeyRound } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../../api';

export default function ResetPasswordScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.resetPassword({ token, password });
      setMessage(res.data.message || 'Senha redefinida com sucesso.');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Não foi possível redefinir sua senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 w-full max-w-sm flex flex-col items-center p-6">
      <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mb-6 text-rose-500">
        <KeyRound size={32} />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2 text-center tracking-tight">Nova senha</h1>
      <p className="text-slate-500 text-center mb-8 text-sm font-medium">Escolha uma senha segura para voltar ao AuPairConnect.</p>

      <form onSubmit={handleSubmit} className="w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold text-center">{error}</div>}
        {message && <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-sm font-bold text-center">{message}</div>}

        {!tokenFromUrl && (
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Token</label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 text-sm"
              required
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Nova senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 text-sm"
            required
            minLength={6}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Confirmar senha</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 text-sm"
            required
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !token}
          className="w-full bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md"
        >
          {loading ? 'Salvando...' : 'Redefinir senha'}
        </button>

        <Link to="/login" className="flex items-center justify-center gap-1 text-sm text-slate-500 hover:text-rose-500 font-semibold">
          <ChevronLeft size={16} /> Voltar para login
        </Link>
      </form>
    </div>
  );
}
