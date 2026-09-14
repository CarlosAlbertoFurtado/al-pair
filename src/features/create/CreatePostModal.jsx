import { useState, useRef } from 'react';
import { X, Image, Send, AlertTriangle, Camera, ImageIcon } from 'lucide-react';
import { postsAPI, uploadAPI } from '../../api';
import { validatePhotoFile } from '../../utils/imageValidation';
import { ImageAdjustModal } from '../../components/ImageAdjustModal';

export default function CreatePostModal({ onClose, onSuccess }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showImageSourceSelector, setShowImageSourceSelector] = useState(false);
  
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  
  // Rematch state
  const [isRematch, setIsRematch] = useState(false);
  const [rematchUrgency, setRematchUrgency] = useState('TRANSFER');
  const [rematchCity, setRematchCity] = useState('');
  const [rematchState, setRematchState] = useState('');

  const handleImageSelect = async (e) => {
    setShowImageSourceSelector(false); // Close selector if it was open
    const file = e.target.files[0];
    if (!file) return;

    const validationError = validatePhotoFile(file, { maxSizeMb: 8 });
    if (validationError) {
      setUploadError(validationError);
      e.target.value = '';
      return;
    }

    setUploadError('');
    setSelectedImageFile(file);
    e.target.value = '';
  };

  const uploadAdjustedImage = async (file) => {
    setSelectedImageFile(null);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadAPI.postImage(formData);
      setImageUrl(res.data.data.url);
    } catch (err) {
      console.error('Image upload failed:', err);
      setUploadError(err.response?.data?.message || 'Erro ao enviar imagem.');
      setImagePreview(null);
      setImageUrl(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setImageUrl(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !imageUrl) {
      setUploadError('Escreva algo ou adicione uma foto para publicar.');
      return;
    }
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
      setUploadError(err.response?.data?.message || 'Erro ao criar publicação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-end justify-center animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-900">Nova Publicação</h2>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 active:scale-90 transition-transform">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="No que você está pensando?"
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 min-h-[120px] outline-none focus:border-rose-300 focus:bg-white resize-none transition-colors"
            autoFocus
          />

          {/* Rematch Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsRematch(!isRematch)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                isRematch ? 'bg-orange-100 text-orange-600 border border-orange-200' : 'bg-slate-100 text-slate-500 border border-transparent hover:bg-slate-200'
              }`}
            >
              <AlertTriangle size={16} />
              {isRematch ? 'Modo Rematch Ativo' : 'Sinalizar Rematch'}
            </button>
          </div>

          {/* Rematch Fields */}
          {isRematch && (
            <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 space-y-3 animate-in fade-in slide-in-from-top-2">
              <div>
                <label className="block text-xs font-bold text-orange-800 mb-1">Urgência</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRematchUrgency('TRANSFER')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors active:scale-95 ${
                      rematchUrgency === 'TRANSFER' ? 'bg-orange-500 text-white border-orange-600 shadow-inner' : 'bg-white text-orange-600 border-orange-200'
                    }`}
                  >
                    Normal (Transfer)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRematchUrgency('URGENT')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors active:scale-95 ${
                      rematchUrgency === 'URGENT' ? 'bg-red-500 text-white border-red-600 shadow-inner' : 'bg-white text-red-500 border-red-200'
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
            <div className="relative animate-in fade-in zoom-in-95">
              <img src={imagePreview} alt="preview" className="w-full rounded-xl max-h-40 object-cover shadow-sm" />
              {uploadingImage && (
                <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              {!uploadingImage && (
                <button 
                  type="button" 
                  onClick={clearImage}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center text-xs hover:bg-black/80 backdrop-blur-md active:scale-90 transition-transform"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          )}

          {uploadError && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 animate-in fade-in">
              {uploadError}
            </p>
          )}
          
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
            <button 
              type="button" 
              onClick={() => setShowImageSourceSelector(true)} 
              disabled={uploadingImage}
              className="flex items-center gap-2 px-4 py-2 text-rose-500 bg-rose-50 rounded-xl hover:bg-rose-100 font-bold disabled:opacity-50 active:scale-95 transition-transform"
            >
              <Image size={18} />
              <span className="text-sm">{uploadingImage ? 'Enviando...' : 'Adicionar Foto'}</span>
            </button>
            
            {/* Hidden Inputs */}
            <input 
              ref={galleryInputRef} 
              type="file" 
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              className="hidden" 
              onChange={handleImageSelect} 
            />
            <input 
              ref={cameraInputRef} 
              type="file" 
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              capture="environment"
              className="hidden" 
              onChange={handleImageSelect} 
            />

            <button 
              type="submit" 
              disabled={loading || (!content.trim() && !imageUrl) || uploadingImage}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold rounded-xl disabled:opacity-50 hover:opacity-90 active:scale-95 transition-all shadow-md shadow-rose-200"
            >
              <span>{loading ? 'Enviando...' : 'Publicar'}</span>
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>

      {/* Selector Modal Camera/Gallery */}
      {showImageSourceSelector && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowImageSourceSelector(false)}>
          <div className="bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowImageSourceSelector(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white active:scale-90 transition-transform">
              <X size={20} />
            </button>
            <h3 className="text-white text-lg font-bold text-center mb-6">Selecione sua imagem:</h3>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-purple-500 to-slate-800 p-4 rounded-full text-white font-bold tracking-wide shadow-lg active:scale-95 transition-transform"
              >
                <Camera size={22} />
                CÂMERA
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-yellow-400 to-yellow-500 p-4 rounded-full text-slate-900 font-bold tracking-wide shadow-lg active:scale-95 transition-transform"
              >
                <ImageIcon size={22} />
                GALERIA
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedImageFile && (
        <ImageAdjustModal
          file={selectedImageFile}
          title="Ajustar foto do post"
          aspectRatio={16 / 9}
          onCancel={() => setSelectedImageFile(null)}
          onConfirm={uploadAdjustedImage}
        />
      )}
    </div>
  );
}
