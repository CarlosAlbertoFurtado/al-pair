import { useState } from 'react';
import { X, Image, Send } from 'lucide-react';
import { postsAPI } from '../../api';

export default function CreatePostModal({ onClose, onSuccess }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      await postsAPI.create({ content: content.trim() });
      onSuccess();
    } catch (err) {
      console.error(err);
      alert('Erro ao criar publicação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end justify-center animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-900">Nova Publicação</h2>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="No que você está pensando?"
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 min-h-[120px] outline-none focus:border-rose-300 resize-none"
            autoFocus
          />
          
          <div className="flex items-center justify-between">
            <button type="button" className="flex items-center gap-2 px-4 py-2 text-rose-500 bg-rose-50 rounded-xl hover:bg-rose-100 font-medium">
              <Image size={18} />
              <span>Adicionar Foto</span>
            </button>
            <button 
              type="submit" 
              disabled={loading || !content.trim()}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold rounded-xl disabled:opacity-50 hover:opacity-90"
            >
              <span>{loading ? 'Enviando...' : 'Publicar'}</span>
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
