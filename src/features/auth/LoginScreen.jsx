import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { motion } from 'framer-motion';

const Cloud = ({ delay, duration, y, scale, opacity }) => (
  <motion.div
    initial={{ x: '110vw' }}
    animate={{ x: '-50vw' }}
    transition={{ repeat: Infinity, duration, delay, ease: 'linear' }}
    className="absolute pointer-events-none"
    style={{ top: y, scale, opacity, zIndex: opacity > 0.5 ? 10 : 0 }}
  >
    <svg width="250" height="150" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.5 19c2.485 0 4.5-2.015 4.5-4.5 0-2.435-1.93-4.417-4.346-4.496-.46-3.23-3.226-5.754-6.654-5.754-3.613 0-6.55 2.85-6.65 6.423C2.102 11.233 0 13.045 0 15.5 0 17.985 2.015 20 4.5 20h13z" />
    </svg>
  </motion.div>
);

const Plane = ({ delay, duration, y, scale }) => (
  <motion.div
    initial={{ x: '110vw' }}
    animate={{ x: '-50vw' }}
    transition={{ repeat: Infinity, duration, delay, ease: 'linear' }}
    className="absolute pointer-events-none text-white/40"
    style={{ top: y, scale, zIndex: 1 }}
  >
    <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'rotate(-90deg)' }}>
      <path d="M21,16V14L13,9V3.5A1.5,1.5 0 0,0 11.5,2A1.5,1.5 0 0,0 10,3.5V9L2,14V16L10,13.5V19L8,20.5V22L11.5,21L15,22V20.5L13,19V13.5L21,16Z" />
    </svg>
  </motion.div>
);

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
    <div className="relative w-full min-h-screen overflow-x-hidden overflow-y-auto bg-gradient-to-b from-sky-400 via-sky-200 to-rose-100 flex flex-col items-center py-10 px-4">
      
      {/* Cenário Animado do Céu */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Nuvens Fundo (Lentas e pequenas) */}
        <Cloud delay={0} duration={60} y="5%" scale={0.5} opacity={0.4} />
        <Cloud delay={20} duration={55} y="25%" scale={0.4} opacity={0.3} />
        <Cloud delay={40} duration={70} y="45%" scale={0.6} opacity={0.5} />
        
        {/* Aviões */}
        <Plane delay={15} duration={25} y="15%" scale={0.8} />
        <Plane delay={45} duration={35} y="60%" scale={0.5} />
        <Plane delay={5} duration={15} y="80%" scale={1.2} />

        {/* Nuvens Frente (Rápidas e grandes, passando na frente do conteúdo) */}
        <Cloud delay={10} duration={30} y="70%" scale={1.2} opacity={0.8} />
        <Cloud delay={35} duration={40} y="85%" scale={1.5} opacity={0.9} />
      </div>

      <div className="relative z-20 w-full max-w-sm flex flex-col items-center pb-12">
        
        {/* Imagem Épica da Cegonha Flutuando */}
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", duration: 1.5, bounce: 0.4 }}
          className="mb-4 relative w-full"
        >
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-full aspect-[4/3] rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden border-4 border-white/60 bg-white/30 backdrop-blur-sm"
          >
            <img src="/stork_discovery_flight.jpg" alt="Alegria e Descoberta" className="w-full h-full object-cover" />
          </motion.div>
        </motion.div>

        {/* Título animado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-center mb-6 w-full"
        >
          <h1 className="text-[2.2rem] font-black text-slate-800 tracking-tight leading-none mb-2 drop-shadow-md">
            AuPairConnect
          </h1>
          <p className="text-slate-700 text-sm font-bold bg-white/40 inline-block px-4 py-1.5 rounded-full backdrop-blur-sm shadow-sm border border-white/50">
            Descubra o mundo. Viva o sonho. ✈️
          </p>
        </motion.div>

        {/* Formulário deslizando para cima */}
        <motion.form 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8, type: "spring" }}
          onSubmit={handleSubmit} 
          className="w-full bg-white/80 backdrop-blur-2xl p-6 rounded-[2rem] shadow-2xl border border-white space-y-4 relative z-30"
        >
          {error && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-rose-50 text-rose-600 p-3 rounded-xl text-sm font-bold text-center border border-rose-100">
              {error}
            </motion.div>
          )}

          {isRegistering && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 overflow-hidden">
              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1 ml-1 uppercase tracking-wider">Como podemos te chamar?</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white/90 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent text-sm transition-all shadow-sm font-semibold"
                  placeholder="Seu nome ou apelido"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-2 ml-1 uppercase tracking-wider">Qual é o seu momento atual?</label>
                <div className="grid grid-cols-1 gap-2">
                  {roles.map(r => (
                    <button
                      type="button"
                      key={r.value}
                      onClick={() => setRole(r.value)}
                      className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all ${
                        role === r.value
                          ? 'border-sky-400 bg-gradient-to-r from-sky-50 to-blue-50 text-sky-700 shadow-md transform scale-[1.02]'
                          : 'border-slate-200 bg-white/90 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-xl shadow-sm border border-slate-100">
                        {r.icon}
                      </span>
                      <span>
                        <span className="block text-sm font-black text-slate-800">{r.label}</span>
                        <span className="block text-xs font-semibold text-slate-500 leading-tight mt-0.5">{r.desc}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          <div>
            <label className="block text-[11px] font-black text-slate-700 mb-1 ml-1 uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 bg-white/90 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent text-sm transition-all shadow-sm font-semibold"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-700 mb-1 ml-1 uppercase tracking-wider">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 bg-white/90 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent text-sm transition-all shadow-sm font-semibold"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {isRegistering && (
            <label className="flex items-start gap-3 p-3.5 bg-sky-50/50 rounded-2xl text-[11px] text-slate-600 border border-sky-100/50">
              <input
                type="checkbox"
                checked={acceptedPolicies}
                onChange={(e) => setAcceptedPolicies(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-500 focus:ring-sky-400"
                required
              />
              <span className="leading-relaxed font-medium">
                Li e aceito os <Link to="/legal/terms" className="font-bold text-sky-600 hover:text-sky-700 underline">Termos</Link>, a <Link to="/legal/privacy" className="font-bold text-sky-600 hover:text-sky-700 underline">Privacidade</Link> e as <Link to="/legal/community" className="font-bold text-sky-600 hover:text-sky-700 underline">Regras da Comunidade</Link>.
              </span>
            </label>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading || (isRegistering && !acceptedPolicies)}
            className="w-full bg-gradient-to-r from-sky-400 to-blue-500 text-white font-black py-4 rounded-2xl transition-all disabled:opacity-50 shadow-xl shadow-sky-200 mt-4 text-[15px]"
          >
            {loading ? '✨ Preparando Voo...' : (isRegistering ? 'Embarcar Agora!' : 'Acessar Comunidade')}
          </motion.button>

          <button
            type="button"
            onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
            className="w-full text-center text-[13px] text-slate-600 hover:text-slate-900 transition-colors font-bold mt-4"
          >
            {isRegistering ? 'Já tem sua passagem? Faça login' : 'Primeira viagem? Crie sua conta grátis'}
          </button>

          {!isRegistering && (
            <Link
              to="/forgot-password"
              className="block w-full text-center text-xs text-slate-400 hover:text-sky-500 transition-colors font-semibold mt-2"
            >
              Esqueci minha senha
            </Link>
          )}
        </motion.form>
      </div>
    </div>
  );
}
