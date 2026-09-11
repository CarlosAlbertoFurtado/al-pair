import { useState, useEffect } from 'react';
import { FileText, UploadCloud, Trash2, ShieldCheck, Download, Plus } from 'lucide-react';
import { vaultAPI, uploadAPI, BASE_URL } from '../../api';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export default function VaultScreen() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState('PASSPORT');

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    try {
      const res = await vaultAPI.list();
      setDocuments(res.data.data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      // 1. Envia o arquivo para a rota de upload
      const uploadRes = await uploadAPI.upload(formData);
      const fileUrl = uploadRes.data.data.url;

      // 2. Adiciona o documento no cofre
      await vaultAPI.add({
        type: docType,
        label: file.name,
        fileUrl: fileUrl,
        fileSizeKb: Math.round(file.size / 1024),
        mimeType: file.type,
      });

      fetchDocs();
    } catch (err) {
      console.error('Upload failed', err);
      alert('Erro ao enviar documento');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deseja excluir este documento permanentemente?')) return;
    try {
      await vaultAPI.delete(id);
      fetchDocs();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const getDocIcon = (type) => {
    switch (type) {
      case 'PASSPORT': return '🛂';
      case 'VISA': return '🇺🇸';
      case 'DS_2019': return '📄';
      case 'CONTRACT': return '✍️';
      default: return '📁';
    }
  };

  return (
    <div className="p-4 bg-slate-50 min-h-full">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg mb-6 relative overflow-hidden">
        <ShieldCheck size={80} className="absolute -right-4 -bottom-4 opacity-10 text-white" />
        <h2 className="text-xl font-black mb-1 flex items-center gap-2">
          <FileText size={24} /> Cofre Digital
        </h2>
        <p className="text-teal-50 text-sm font-medium">Seus documentos criptografados e sempre à mão.</p>
      </div>

      {/* Upload Area */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-6">
        <h3 className="text-sm font-bold text-slate-800 mb-3">Guardar Novo Documento</h3>
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {['PASSPORT', 'VISA', 'DS_2019', 'CONTRACT', 'OTHER'].map(type => (
            <button
              key={type}
              onClick={() => setDocType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                docType === type ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-slate-50 text-slate-500 border border-slate-200'
              }`}
            >
              {getDocIcon(type)} {type.replace('_', ' ')}
            </button>
          ))}
        </div>
        
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-teal-200 rounded-xl bg-teal-50/30 hover:bg-teal-50 transition-colors cursor-pointer group">
          {uploading ? (
            <LoadingSpinner />
          ) : (
            <>
              <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Plus size={20} />
              </div>
              <span className="text-xs font-bold text-teal-700">Tocar para selecionar arquivo</span>
              <input type="file" className="hidden" onChange={handleUpload} accept="image/*,.pdf" disabled={uploading} />
            </>
          )}
        </label>
      </div>

      {/* Document List */}
      <h3 className="text-sm font-bold text-slate-800 mb-3 px-1">Meus Arquivos</h3>
      {loading ? (
        <div className="flex justify-center p-10"><LoadingSpinner /></div>
      ) : documents.length === 0 ? (
        <div className="text-center p-8 bg-white rounded-2xl border border-slate-100 border-dashed">
          <p className="text-sm text-slate-400">Seu cofre está vazio.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map(doc => (
            <div key={doc.id} className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl">
                {getDocIcon(doc.documentType)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-800 truncate">{doc.title}</h4>
                <p className="text-xs text-slate-400">{new Date(doc.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <a 
                  href={`${BASE_URL}${doc.fileUrl}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-2 text-slate-400 hover:text-teal-500 bg-slate-50 rounded-lg"
                >
                  <Download size={18} />
                </a>
                <button 
                  onClick={() => handleDelete(doc.id)}
                  className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 rounded-lg"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
