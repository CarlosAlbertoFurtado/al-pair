import { useState } from 'react';
import { X, Headphones, Globe } from 'lucide-react';
import { roomsAPI } from '../../api';

export default function CreateRoomModal({ onClose, onSuccess }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await roomsAPI.create({ title: title.trim(), description: description.trim() });
      onSuccess();
    } catch (err) {
      console.error(err);
      alert('Erro ao criar sala');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end justify-center animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-gradient-to-b from-indigo-900 to-slate-900 w-full max-w-[430px] rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 text-white">
            <Headphones size={24} className="text-indigo-400" />
            <h2 className="text-xl font-bold">Nova Sala de Áudio</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 rounded-full text-white/50 hover:bg-white/20">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-indigo-200 text-sm font-bold mb-1">Tópico da Conversa</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Como é ser Au Pair em NY?"
              className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-white/30 outline-none focus:border-indigo-400"
              autoFocus
              maxLength={60}
            />
          </div>

          <div>
            <label className="block text-indigo-200 text-sm font-bold mb-1">Descrição (opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Sobre o que vamos falar..."
              className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-white/30 outline-none focus:border-indigo-400 resize-none h-20"
              maxLength={200}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading || !title.trim()}
            className="mt-2 flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl disabled:opacity-50 hover:opacity-90 shadow-lg shadow-indigo-500/30"
          >
            <Globe size={18} />
            <span>{loading ? 'Iniciando...' : 'Entrar Ao Vivo'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
