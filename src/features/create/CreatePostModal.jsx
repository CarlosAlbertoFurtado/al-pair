import { useState, useRef } from 'react';
import { X, Image, Send, AlertTriangle } from 'lucide-react';
import { postsAPI, uploadAPI } from '../../api';

export default function CreatePostModal({ onClose, onSuccess }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  
  // Rematch state
  const [isRematch, setIsRematch] = useState(false);
  const [rematchUrgency, setRematchUrgency] = useState('TRANSFER');
  const [rematchCity, setRematchCity] = useState('');
  const [rematchState, setRematchState] = useState('');

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview local
    setImagePreview(URL.createObjectURL(file));
    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadAPI.upload(formData);
      setImageUrl(res.data.data.url);
    } catch (err) {
      console.error('Image upload failed:', err);
      alert('Erro ao enviar imagem');
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      const payload = { content: content.trim() };
      
      if (imageUrl) {
        payload.imageUrl = imageUrl;
      }

      if (isRematch) {
        payload.type = 'REMATCH';
        payload.rematchUrgency = rematchUrgency;
        if (rematchCity) payload.rematchCity = rematchCity.trim();
        if (rematchState) payload.rematchState = rematchState.trim();
        payload.rematchCountry = 'USA'; // default for MVP
      }

      await postsAPI.create(payload);
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
      <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
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

          {/* Rematch Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsRematch(!isRematch)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold transition-colors ${
                isRematch ? 'bg-orange-100 text-orange-600 border border-orange-200' : 'bg-slate-100 text-slate-500 border border-transparent hover:bg-slate-200'
              }`}
            >
              <AlertTriangle size={16} />
              {isRematch ? 'Modo Rematch Ativo' : 'Sinalizar Rematch'}
            </button>
          </div>

          {/* Rematch Fields */}
          {isRematch && (
            <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 space-y-3">
              <div>
                <label className="block text-xs font-bold text-orange-800 mb-1">Urgência</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRematchUrgency('TRANSFER')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                      rematchUrgency === 'TRANSFER' ? 'bg-orange-500 text-white border-orange-600' : 'bg-white text-orange-600 border-orange-200'
                    }`}
                  >
                    Normal (Transfer)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRematchUrgency('URGENT')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                      rematchUrgency === 'URGENT' ? 'bg-red-500 text-white border-red-600' : 'bg-white text-red-500 border-red-200'
                    }`}
                  >
                    Urgente
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-orange-800 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={rematchCity}
                    onChange={(e) => setRematchCity(e.target.value)}
                    placeholder="Ex: Chicago"
                    className="w-full bg-white border border-orange-200 rounded-lg p-2 text-sm outline-none focus:border-orange-400"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-xs font-bold text-orange-800 mb-1">Estado</label>
                  <input
                    type="text"
                    value={rematchState}
                    onChange={(e) => setRematchState(e.target.value)}
                    placeholder="Ex: IL"
                    maxLength={2}
                    className="w-full bg-white border border-orange-200 rounded-lg p-2 text-sm outline-none focus:border-orange-400 uppercase"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Image Preview */}
          {imagePreview && (
            <div className="relative">
              <img src={imagePreview} alt="preview" className="w-full rounded-xl max-h-40 object-cover" />
              {uploadingImage && (
                <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              {!uploadingImage && (
                <button 
                  type="button" 
                  onClick={() => { setImagePreview(null); setImageUrl(null); }}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/50 text-white rounded-full flex items-center justify-center text-xs hover:bg-black/70"
                >
                  ✕
                </button>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between mt-2">
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()} 
              disabled={uploadingImage}
              className="flex items-center gap-2 px-4 py-2 text-rose-500 bg-rose-50 rounded-xl hover:bg-rose-100 font-medium disabled:opacity-50"
            >
              <Image size={18} />
              <span className="text-sm">{uploadingImage ? 'Enviando...' : 'Foto'}</span>
            </button>
            <input 
              ref={fileInputRef} 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleImageSelect} 
            />
            <button 
              type="submit" 
              disabled={loading || !content.trim() || uploadingImage}
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
