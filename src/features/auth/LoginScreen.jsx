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
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-rose-50 to-indigo-50 flex items-center justify-center p-6">
      
      {/* Fundo Animado (Esferas flutuantes de Transformação) */}
      <motion.div 
        animate={{ y: [0, -30, 0], opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-20 -left-20 w-72 h-72 bg-rose-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
      />
      <motion.div 
        animate={{ y: [0, 40, 0], opacity: [0.2, 0.5, 0.2], x: [0, -20, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-40 -right-20 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
      />
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2], x: [0, 20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute -bottom-20 left-20 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
      />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        
        {/* Animação de Entrada e Voo da Cegonha */}
        <motion.div
          initial={{ y: -100, x: -50, opacity: 0, scale: 0.5, rotate: -15 }}
          animate={{ y: 0, x: 0, opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 1.5, bounce: 0.4 }}
          className="mb-4 relative"
        >
          {/* Movimento contínuo flutuante de voo (Corpo da Cegonha) */}
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-24 h-24 bg-white rounded-3xl shadow-2xl shadow-rose-200 flex items-center justify-center p-1.5 border border-white relative z-20"
          >
            <img src="/icon-192.png" alt="Cegonha AuPairConnect" className="w-full h-full object-cover rounded-2xl" />
          </motion.div>
          {/* Sombra dinâmica embaixo da Cegonha */}
          <motion.div
            animate={{ scale: [1, 0.8, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-2 bg-slate-400 rounded-full blur-sm z-10"
          />
        </motion.div>

        {/* Título animado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-black bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent mb-2 tracking-tight">
            AuPairConnect
          </h1>
          <p className="text-slate-600 text-sm font-medium px-4">
            Sua jornada começa aqui. <br/>Voe alto pelo mundo! ✈️
          </p>
        </motion.div>

        {/* Formulário deslizando para cima */}
        <motion.form 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8, type: "spring" }}
          onSubmit={handleSubmit} 
          className="w-full bg-white/70 backdrop-blur-xl p-6 rounded-[2rem] shadow-xl border border-white space-y-4"
        >
          {error && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-rose-50 text-rose-600 p-3 rounded-xl text-sm font-bold text-center border border-rose-100">
              {error}
            </motion.div>
          )}

          {isRegistering && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 overflow-hidden">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 ml-1 uppercase tracking-wider">Nome Completo</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent text-sm transition-all"
                  placeholder="Maria Silva"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 ml-1 uppercase tracking-wider">Eu Sou</label>
                <div className="grid grid-cols-1 gap-2">
                  {roles.map(r => (
                    <button
                      type="button"
                      key={r.value}
                      onClick={() => setRole(r.value)}
                      className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition-all ${
                        role === r.value
                          ? 'border-rose-400 bg-gradient-to-r from-rose-50 to-purple-50 text-rose-700 shadow-sm'
                          : 'border-slate-200 bg-white/80 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-xl shadow-sm">
                        {r.icon}
                      </span>
                      <span>
                        <span className="block text-sm font-black">{r.label}</span>
                        <span className="block text-[11px] font-semibold opacity-70 leading-tight mt-0.5">{r.desc}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 ml-1 uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent text-sm transition-all"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 ml-1 uppercase tracking-wider">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent text-sm transition-all"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {isRegistering && (
            <label className="flex items-start gap-3 p-3 bg-slate-50/80 rounded-xl text-[11px] text-slate-600">
              <input
                type="checkbox"
                checked={acceptedPolicies}
                onChange={(e) => setAcceptedPolicies(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-rose-500 focus:ring-rose-400"
                required
              />
              <span className="leading-tight">
                Li e aceito os <Link to="/legal/terms" className="font-bold text-rose-600 hover:text-rose-700">Termos</Link>, a <Link to="/legal/privacy" className="font-bold text-rose-600 hover:text-rose-700">Privacidade</Link> e <Link to="/legal/community" className="font-bold text-rose-600 hover:text-rose-700">Regras</Link>.
              </span>
            </label>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading || (isRegistering && !acceptedPolicies)}
            className="w-full bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-500 text-white font-bold py-3.5 rounded-2xl transition-all disabled:opacity-50 shadow-lg shadow-rose-200/50 mt-2 text-sm"
          >
            {loading ? '✨ Preparando voo...' : (isRegistering ? 'Criar Conta' : 'Entrar na Comunidade')}
          </motion.button>

          <button
            type="button"
            onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
            className="w-full text-center text-sm text-slate-600 hover:text-slate-800 transition-colors font-bold mt-2"
          >
            {isRegistering ? 'Já tem conta? Faça login' : 'Primeira vez? Crie sua conta grátis'}
          </button>

          {!isRegistering && (
            <Link
              to="/forgot-password"
              className="block w-full text-center text-xs text-slate-500 hover:text-rose-500 transition-colors font-medium mt-1"
            >
              Esqueci minha senha
            </Link>
          )}
        </motion.form>
      </div>
    </div>
  );
}
