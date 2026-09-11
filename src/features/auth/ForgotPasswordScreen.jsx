import { useState } from 'react';
import { ChevronLeft, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { authAPI } from '../../api';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [devToken, setDevToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setDevToken('');
    setLoading(true);

    try {
      const res = await authAPI.forgotPassword(email);
      setMessage(res.data.message || 'Se o e-mail existir, enviaremos instruções de recuperação.');
      setDevToken(res.data.data?.resetToken || '');
    } catch (err) {
      setError(err.response?.data?.message || 'Não foi possível solicitar a recuperação agora.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 w-full max-w-sm flex flex-col items-center p-6">
      <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mb-6 text-rose-500">
        <Mail size={32} />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2 text-center tracking-tight">Recuperar senha</h1>
      <p className="text-slate-500 text-center mb-8 text-sm font-medium">Enviaremos um link seguro para você criar uma nova senha.</p>

      <form onSubmit={handleSubmit} className="w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold text-center">{error}</div>}
        {message && <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-sm font-bold text-center">{message}</div>}

        {devToken && (
          <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-xs font-semibold break-all">
            Token local: {devToken}
          </div>
        )}

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 text-sm"
            placeholder="anna@example.com"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md"
        >
          {loading ? 'Enviando...' : 'Enviar link'}
        </button>

        <Link to="/login" className="flex items-center justify-center gap-1 text-sm text-slate-500 hover:text-rose-500 font-semibold">
          <ChevronLeft size={16} /> Voltar para login
        </Link>
      </form>
    </div>
  );
}
