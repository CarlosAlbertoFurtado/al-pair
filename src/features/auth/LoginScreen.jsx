import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { motion } from 'framer-motion';

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
    <div className="relative w-full min-h-screen overflow-x-hidden overflow-y-auto bg-gradient-to-br from-rose-50 via-white to-purple-50 flex flex-col items-center py-12 px-4">
      
      {/* Círculos de luz suaves no fundo (Ambient Lighting) */}
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="fixed -top-32 -left-32 w-96 h-96 bg-rose-200/50 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="fixed top-1/2 -right-32 w-[30rem] h-[30rem] bg-purple-200/50 rounded-full blur-3xl pointer-events-none -translate-y-1/2"
      />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        
        {/* Logo Original Animada */}
        <motion.div
          initial={{ y: -30, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: "spring", duration: 1, bounce: 0.5 }}
          className="mb-8 relative"
        >
          <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl shadow-rose-200/50 flex items-center justify-center p-2 border border-white relative z-20">
            <img src="/icon-192.png" alt="AuPairConnect Logo" className="w-full h-full object-cover rounded-2xl" />
          </div>
        </motion.div>

        {/* Título */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-center mb-8 w-full"
        >
          <h1 className="text-[2rem] font-black tracking-tight bg-gradient-to-r from-rose-500 to-purple-600 bg-clip-text text-transparent mb-2">
            AuPairConnect
          </h1>
          <p className="text-slate-500 text-[13px] font-semibold px-4">
            A maior comunidade global de Au Pairs.
          </p>
        </motion.div>

        {/* Formulário (Glassmorphism) */}
        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          onSubmit={handleSubmit} 
          className="w-full bg-white/70 backdrop-blur-xl p-7 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/80 space-y-4"
        >
          {error && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-rose-50 text-rose-600 p-3 rounded-xl text-[13px] font-bold text-center border border-rose-100">
              {error}
            </motion.div>
          )}

          {isRegistering && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 overflow-hidden">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Nome Completo</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white/90 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent text-[15px] transition-all font-medium text-slate-800"
                  placeholder="Maria Silva"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Eu Sou</label>
                <div className="grid grid-cols-1 gap-2">
                  {roles.map(r => (
                    <button
                      type="button"
                      key={r.value}
                      onClick={() => setRole(r.value)}
                      className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all ${
                        role === r.value
                          ? 'border-rose-400 bg-gradient-to-r from-rose-50 to-purple-50 text-rose-700 shadow-sm'
                          : 'border-slate-100 bg-white/80 text-slate-600 hover:border-slate-200'
                      }`}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-xl shadow-sm border border-slate-50">
                        {r.icon}
                      </span>
                      <span>
                        <span className="block text-[14px] font-bold text-slate-800">{r.label}</span>
                        <span className="block text-[11px] font-medium text-slate-500 leading-tight mt-0.5">{r.desc}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 bg-white/90 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent text-[15px] transition-all font-medium text-slate-800"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 bg-white/90 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent text-[15px] transition-all font-medium text-slate-800"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {isRegistering && (
            <label className="flex items-start gap-3 p-3 bg-slate-50/80 rounded-2xl text-[11px] text-slate-500 border border-slate-100/50 mt-2">
              <input
                type="checkbox"
                checked={acceptedPolicies}
                onChange={(e) => setAcceptedPolicies(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-200 text-rose-500 focus:ring-rose-400"
                required
              />
              <span className="leading-relaxed">
                Li e aceito os <Link to="/legal/terms" className="font-bold text-slate-700 hover:text-rose-500 transition-colors">Termos</Link>, a <Link to="/legal/privacy" className="font-bold text-slate-700 hover:text-rose-500 transition-colors">Privacidade</Link> e as <Link to="/legal/community" className="font-bold text-slate-700 hover:text-rose-500 transition-colors">Regras</Link>.
              </span>
            </label>
          )}

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading || (isRegistering && !acceptedPolicies)}
            className="w-full bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-50 shadow-lg shadow-rose-200/50 mt-6 text-[15px]"
          >
            {loading ? 'Entrando...' : (isRegistering ? 'Criar Conta' : 'Entrar')}
          </motion.button>

          <button
            type="button"
            onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
            className="w-full text-center text-[13px] text-slate-500 hover:text-slate-800 transition-colors font-bold mt-4"
          >
            {isRegistering ? 'Já tem conta? Faça login' : 'Primeira vez? Crie sua conta grátis'}
          </button>

          {!isRegistering && (
            <Link
              to="/forgot-password"
              className="block w-full text-center text-xs text-slate-400 hover:text-rose-500 transition-colors font-semibold mt-2"
            >
              Esqueci minha senha
            </Link>
          )}
        </motion.form>
      </div>
    </div>
  );
}
