// src/services/uploadService.js
// Serviço de upload de mídia com fallback para endpoint local `/upload`
// Utiliza Cloudinary se as variáveis de ambiente estiverem definidas.

const CLOUDINARY_UPLOAD_URL = import.meta.env.VITE_CLOUDINARY_UPLOAD_URL;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/**
 * Faz upload de um arquivo e retorna a URL pública.
 * @param {File} file - Arquivo a ser enviado.
 * @returns {Promise<string>} URL da imagem hospedada.
 */
export async function uploadMedia(file) {
  // Se as variáveis de Cloudinary estiverem configuradas, usa Cloudinary.
  if (CLOUDINARY_UPLOAD_URL && CLOUDINARY_UPLOAD_PRESET) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Falha no upload para Cloudinary');
    }
    return data.secure_url; // URL da imagem no Cloudinary
  }

  // Fallback: usa endpoint local `/upload` já existente.
  const formData = new FormData();
  formData.append('file', file);

  // `api` vem do módulo api.js que já inclui interceptors.
  const { api } = await import('../api');
  const uploadRes = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return uploadRes.data.data.url;
}
