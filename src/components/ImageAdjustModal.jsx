import { useEffect, useMemo, useState, useCallback } from 'react';
import { Check, X } from 'lucide-react';
import Cropper from 'react-easy-crop';

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

function getRadianAngle(degreeValue) {
  return (degreeValue * Math.PI) / 180;
}

export async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg', 0.9);
  });
}

export function ImageAdjustModal({
  file,
  title = 'Ajustar foto',
  aspectRatio = 1,
  roundedPreview = false,
  onCancel,
  onConfirm,
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [processing, setProcessing] = useState(false);

  const previewUrl = useMemo(() => URL.createObjectURL(file), [file]);

  useEffect(() => () => URL.revokeObjectURL(previewUrl), [previewUrl]);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    setProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(previewUrl, croppedAreaPixels);
      if (!croppedBlob) {
        onConfirm(file);
        return;
      }

      const adjustedFile = new File([croppedBlob], file.name.replace(/\.[^.]+$/, '.jpg'), {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });
      onConfirm(adjustedFile);
    } catch (e) {
      console.error(e);
      onConfirm(file); // Fallback to original
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200" onClick={onCancel}>
      <div className="w-full max-w-[430px] rounded-t-3xl bg-slate-900 p-5 shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col" style={{ height: '85vh' }} onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between gap-3 shrink-0">
          <h2 className="text-lg font-black text-white">{title}</h2>
          <button type="button" onClick={onCancel} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-400 active:scale-90">
            <X size={19} />
          </button>
        </div>
        
        <p className="text-slate-400 text-xs text-center mb-4 shrink-0">Arraste para mover e use os dois dedos para aproximar</p>

        <div className="relative flex-1 w-full bg-black rounded-2xl overflow-hidden shadow-inner">
          <div className="absolute inset-0">
            <Cropper
              image={previewUrl}
              crop={crop}
              zoom={zoom}
              aspect={aspectRatio}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
              cropShape={roundedPreview ? 'round' : 'rect'}
              showGrid={false}
              classes={{
                containerClassName: 'bg-black',
              }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={processing}
          className="mt-6 shrink-0 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-tr from-rose-500 to-purple-600 text-sm font-bold text-white disabled:opacity-60 active:scale-95 transition-transform"
        >
          {processing ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Check size={20} />
          )}
          {processing ? 'Preparando foto...' : 'Concluir'}
        </button>
      </div>
    </div>
  );
}
