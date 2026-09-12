import { useEffect, useMemo, useState } from 'react';
import { Check, Minus, Plus, X } from 'lucide-react';

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getOutputSize(aspectRatio) {
  if (aspectRatio >= 1.5) return { width: 1280, height: Math.round(1280 / aspectRatio) };
  if (aspectRatio <= 0.8) return { width: 900, height: Math.round(900 / aspectRatio) };
  return { width: 1080, height: Math.round(1080 / aspectRatio) };
}

async function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
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
  const [zoom, setZoom] = useState(1.15);
  const [positionX, setPositionX] = useState(50);
  const [positionY, setPositionY] = useState(50);
  const [processing, setProcessing] = useState(false);

  const previewUrl = useMemo(() => URL.createObjectURL(file), [file]);

  useEffect(() => () => URL.revokeObjectURL(previewUrl), [previewUrl]);

  const objectPosition = `${positionX}% ${positionY}%`;

  const handleConfirm = async () => {
    setProcessing(true);
    try {
      const image = await loadImage(previewUrl);
      const { width: outputWidth, height: outputHeight } = getOutputSize(aspectRatio);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = outputWidth;
      canvas.height = outputHeight;

      const baseScale = Math.max(outputWidth / image.naturalWidth, outputHeight / image.naturalHeight);
      const scale = baseScale * zoom;
      const drawnWidth = image.naturalWidth * scale;
      const drawnHeight = image.naturalHeight * scale;
      const overflowX = Math.max(0, drawnWidth - outputWidth);
      const overflowY = Math.max(0, drawnHeight - outputHeight);
      const dx = -overflowX * (positionX / 100);
      const dy = -overflowY * (positionY / 100);

      ctx.drawImage(image, dx, dy, drawnWidth, drawnHeight);

      canvas.toBlob((blob) => {
        if (!blob) {
          onConfirm(file);
          return;
        }

        const adjustedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        onConfirm(adjustedFile);
      }, 'image/jpeg', 0.9);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/70 backdrop-blur-sm" onClick={onCancel}>
      <div className="w-full max-w-[430px] rounded-t-3xl bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-black text-slate-900">{title}</h2>
          <button type="button" onClick={onCancel} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
            <X size={19} />
          </button>
        </div>

        <div
          className={`mx-auto w-full overflow-hidden bg-slate-100 ${roundedPreview ? 'max-w-72 rounded-full' : 'rounded-2xl'}`}
          style={{ aspectRatio }}
        >
          <img
            src={previewUrl}
            alt=""
            className="h-full w-full object-cover"
            style={{ transform: `scale(${zoom})`, transformOrigin: objectPosition, objectPosition }}
          />
        </div>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500">
              Zoom
              <span>{Math.round(zoom * 100)}%</span>
            </span>
            <div className="flex items-center gap-3">
              <Minus size={16} className="text-slate-400" />
              <input
                type="range"
                min="1"
                max="2.5"
                step="0.01"
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="w-full accent-rose-500"
              />
              <Plus size={16} className="text-slate-400" />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-bold text-slate-500">Mover para os lados</span>
            <input
              type="range"
              min="0"
              max="100"
              value={positionX}
              onChange={(event) => setPositionX(clamp(Number(event.target.value), 0, 100))}
              className="w-full accent-rose-500"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-bold text-slate-500">Mover para cima/baixo</span>
            <input
              type="range"
              min="0"
              max="100"
              value={positionY}
              onChange={(event) => setPositionY(clamp(Number(event.target.value), 0, 100))}
              className="w-full accent-rose-500"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={processing}
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-bold text-white disabled:opacity-60"
        >
          <Check size={18} />
          {processing ? 'Preparando foto...' : 'Usar esta foto'}
        </button>
      </div>
    </div>
  );
}
