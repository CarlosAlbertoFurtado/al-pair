import { useState } from 'react';
import { Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export default function LoginScreen() {
  const { login } = useAuthStore();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('CANDIDATE');
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        if (!acceptedPolicies) {
          setError('Você precisa aceitar os termos para criar a conta.');
          return;
        }
        const { authAPI } = await import('../../api');
        await authAPI.register({ email, password, displayName, role });
      }
      await login({ email, password });
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error?.message || 'Ocorreu um erro interno no servidor. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { value: 'CANDIDATE', icon: '🌍', label: 'Quero ser Au Pair', desc: 'Estou começando minha jornada' },
    { value: 'ALUMNI', icon: '🎓', label: 'Au Pair / Ex Au Pair', desc: 'Já sou ou já fui au pair' },
  ];

  return (
    <div className="relative z-10 w-full max-w-sm flex flex-col items-center p-6">
      <div className="w-16 h-16 bg-gradient-to-tr from-rose-500 to-purple-600 rounded-2xl shadow-lg flex items-center justify-center mb-6">
        <Globe className="text-white" size={32} />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2 text-center tracking-tight">AuPairConnect</h1>
      <p className="text-slate-500 text-center mb-8 text-sm font-medium">A comunidade definitiva para intercâmbio e suporte global.</p>

      <form onSubmit={handleSubmit} className="w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold text-center">
            {error}
          </div>
        )}

        {isRegistering && (
          <>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 text-sm"
                placeholder="Maria Silva"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Eu sou...</label>
              <div className="grid grid-cols-1 gap-2">
                {roles.map(r => (
                  <button
                    type="button"
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                      role === r.value
                        ? 'border-rose-400 bg-rose-50 text-rose-700 font-bold shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl shadow-sm">
                      {r.icon}
                    </span>
                    <span>
                      <span className="block text-sm font-black">{r.label}</span>
                      <span className="block text-xs font-semibold opacity-70">{r.desc}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </>
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

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 text-sm"
            placeholder="••••••••"
            required
            minLength={6}
          />
        </div>

        {isRegistering && (
          <label className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
            <input
              type="checkbox"
              checked={acceptedPolicies}
              onChange={(e) => setAcceptedPolicies(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-rose-500 focus:ring-rose-300"
              required
            />
            <span>
              Li e aceito os{' '}
              <Link to="/legal/terms" className="font-bold text-rose-600 hover:text-rose-700">Termos</Link>, a{' '}
              <Link to="/legal/privacy" className="font-bold text-rose-600 hover:text-rose-700">Privacidade</Link> e as{' '}
              <Link to="/legal/community" className="font-bold text-rose-600 hover:text-rose-700">Regras da comunidade</Link>.
            </span>
          </label>
        )}

        <button
          type="submit"
          disabled={loading || (isRegistering && !acceptedPolicies)}
          className="w-full bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md"
        >
          {loading ? '⏳ Processando...' : (isRegistering ? 'Criar Conta' : 'Entrar')}
        </button>

        <button
          type="button"
          onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
          className="w-full text-center text-sm text-slate-500 hover:text-rose-500 transition-colors font-semibold"
        >
          {isRegistering ? 'Já tem conta? Faça login' : 'Não tem conta? Registre-se'}
        </button>

        {!isRegistering && (
          <Link
            to="/forgot-password"
            className="block w-full text-center text-sm text-rose-500 hover:text-rose-600 transition-colors font-bold"
          >
            Esqueci minha senha
          </Link>
        )}
      </form>
      <div className="mt-4 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-500">
        <Link to="/legal/terms" className="hover:text-rose-500">Termos</Link>
        <Link to="/legal/privacy" className="hover:text-rose-500">Privacidade</Link>
        <Link to="/legal/community" className="hover:text-rose-500">Regras</Link>
      </div>
    </div>
  );
}
