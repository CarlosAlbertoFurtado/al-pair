import { useState } from 'react';
import { ArrowLeft, Trash2, Key, Mail, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../api';
import { useAuthStore } from '../../store/useAuthStore';

export default function AccountSettings() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDeleteAccount = async () => {
    if (!password) {
      setError('A senha é obrigatória para excluir a conta.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await authAPI.deleteAccount(password);
      logout(); // This will clear the local storage and redirect to home
    } catch (err) {
      setError(err.customMessage || 'Ocorreu um erro ao excluir a conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Header */}
      <div className="bg-white px-4 py-4 sticky top-0 z-20 flex items-center shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-black text-slate-800 ml-2">Conta</h1>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <h2 className="text-sm font-black text-slate-800 mb-4">Informações de Login</h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                <Mail size={18} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-400 font-bold uppercase">E-mail</p>
                <p className="text-sm font-medium text-slate-800">{user?.email}</p>
              </div>
            </div>

            <button 
              className="flex items-center gap-3 w-full text-left opacity-50 cursor-not-allowed"
              title="Em breve"
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                <Key size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800">Alterar senha</p>
                <p className="text-xs text-slate-500">Mude sua senha de acesso</p>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <h2 className="text-sm font-black text-rose-600 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} /> Zona de Perigo
          </h2>
          
          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            Ao excluir sua conta, todos os seus dados, posts, fotos e conversas serão apagados permanentemente. Esta ação não pode ser desfeita.
          </p>
          
          <button 
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center justify-center gap-2 w-full py-3 bg-rose-50 text-rose-600 rounded-xl font-bold text-sm hover:bg-rose-100 transition-colors"
          >
            <Trash2 size={16} /> Excluir Minha Conta
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-4 mx-auto">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-black text-slate-800 text-center mb-2">Tem certeza absoluta?</h3>
              <p className="text-sm text-slate-600 text-center mb-6 leading-relaxed">
                Para confirmar a exclusão permanente de sua conta e todos os dados associados, digite sua senha abaixo.
              </p>
              
              <input
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 mb-2"
              />
              
              {error && <p className="text-xs font-bold text-rose-500 mb-4 text-center">{error}</p>}
            </div>
            
            <div className="flex border-t border-slate-100 bg-slate-50">
              <button 
                onClick={() => {
                  setShowDeleteModal(false);
                  setPassword('');
                  setError('');
                }}
                disabled={loading}
                className="flex-1 py-4 text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <div className="w-[1px] bg-slate-200"></div>
              <button 
                onClick={handleDeleteAccount}
                disabled={loading || !password}
                className="flex-1 py-4 text-sm font-black text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
              >
                {loading ? 'Excluindo...' : 'Excluir Conta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
