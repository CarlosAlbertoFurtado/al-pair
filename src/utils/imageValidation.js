const PHOTO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export function validatePhotoFile(file, { maxSizeMb }) {
  if (!file) return 'Selecione uma foto.';
  if (!PHOTO_MIME_TYPES.includes(file.type)) return 'Use uma foto JPEG, PNG, WEBP ou HEIC.';
  if (file.size > maxSizeMb * 1024 * 1024) return `A foto deve ter no máximo ${maxSizeMb}MB.`;
  return '';
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Imagem inválida.'));
    };
    image.src = url;
  });
}

export async function hasVisibleFace(file) {
  if (!('FaceDetector' in window)) return null;

  try {
    const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 3 });
    const image = await loadImage(file);
    const faces = await detector.detect(image);
    return faces.length > 0;
  } catch {
    return null;
  }
}
