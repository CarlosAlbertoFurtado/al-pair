import { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

/**
 * PhotoViewerModal - Fullscreen photo viewer with pinch-to-zoom (Instagram style)
 * @param {{ src: string, alt?: string, onClose: () => void }} props
 */
export function PhotoViewerModal({ src, alt = '', onClose }) {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastPinchDist, setLastPinchDist] = useState(0);
  const containerRef = useRef(null);

  // Reset on open
  useEffect(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, [src]);

  // Pinch-to-zoom (touch)
  const getTouchDist = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      setLastPinchDist(getTouchDist(e.touches));
    } else if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - translate.x, y: e.touches[0].clientY - translate.y });
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = getTouchDist(e.touches);
      if (lastPinchDist > 0) {
        const delta = dist / lastPinchDist;
        setScale(prev => Math.min(Math.max(prev * delta, 1), 5));
      }
      setLastPinchDist(dist);
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      const x = e.touches[0].clientX - dragStart.x;
      const y = e.touches[0].clientY - dragStart.y;
      setTranslate({ x, y });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setLastPinchDist(0);
    if (scale <= 1.05) {
      setScale(1);
      setTranslate({ x: 0, y: 0 });
    }
  };

  // Double tap to zoom
  const lastTap = useRef(0);
  const handleTap = (e) => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      // Double tap
      if (scale > 1) {
        setScale(1);
        setTranslate({ x: 0, y: 0 });
      } else {
        setScale(2.5);
      }
    }
    lastTap.current = now;
  };

  // Button zoom controls
  const zoomIn = () => setScale(prev => Math.min(prev + 0.5, 5));
  const zoomOut = () => {
    const next = Math.max(scale - 0.5, 1);
    setScale(next);
    if (next <= 1) setTranslate({ x: 0, y: 0 });
  };

  return (
    <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center animate-in fade-in duration-200">
      {/* Close button */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 z-[110] w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition-transform"
      >
        <X size={22} />
      </button>

      {/* Zoom Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[110] flex gap-3">
        <button onClick={zoomOut} className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition-transform">
          <ZoomOut size={18} />
        </button>
        <div className="bg-white/10 backdrop-blur-md rounded-full px-4 flex items-center text-white text-sm font-bold">
          {Math.round(scale * 100)}%
        </div>
        <button onClick={zoomIn} className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition-transform">
          <ZoomIn size={18} />
        </button>
      </div>

      {/* Image Container */}
      <div 
        ref={containerRef}
        className="w-full h-full flex items-center justify-center overflow-hidden select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleTap}
        style={{ touchAction: 'none' }}
      >
        <img 
          src={src} 
          alt={alt}
          className="max-w-full max-h-full object-contain transition-transform duration-100"
          style={{ 
            transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`,
          }}
          draggable="false"
        />
      </div>
    </div>
  );
}
