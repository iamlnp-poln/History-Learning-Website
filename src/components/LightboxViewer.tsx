
import React, { useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { X, ChevronLeft, ChevronRight, Copyright } from 'lucide-react';
import { useLightbox } from '../contexts/LightboxContext';
import { useGlobalData } from '../contexts/GlobalDataContext';
import { getResizedUrl } from '../services/storageService';

const LightboxViewer: React.FC = () => {
  const { isOpen, currentImage, images, closeLightbox, nextImage, prevImage } = useLightbox();
  const { imageOverrides, imageCredits, urlCredits } = useGlobalData();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, nextImage, prevImage, closeLightbox]);

  const creditText = useMemo(() => {
      if (!currentImage) return null;
      
      // 1. Try Global URL Credit (Best source)
      if (urlCredits[currentImage]) return urlCredits[currentImage];

      // 2. Try Legacy ID-based lookup (Fallback)
      if (imageOverrides) {
          const foundId = Object.keys(imageOverrides).find(key => {
              return getResizedUrl(imageOverrides[key]) === currentImage;
          });

          if (foundId && imageCredits[foundId]) {
              return imageCredits[foundId];
          }
      }
      return null;
  }, [currentImage, imageOverrides, imageCredits, urlCredits]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center animate-fade-in backdrop-blur-sm">
      <button 
        onClick={closeLightbox}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all z-50"
      >
        <X size={32} />
      </button>

      {images.length > 1 && (
        <button 
          onClick={(e) => { e.stopPropagation(); prevImage(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all z-50"
        >
          <ChevronLeft size={40} />
        </button>
      )}

      <div className="relative max-w-[95vw] max-h-[95vh] flex flex-col items-center justify-center p-2">
        <img 
          src={currentImage} 
          alt="Lightbox" 
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-pop-in select-none"
          onClick={(e) => e.stopPropagation()}
        />
        
        <div className="mt-4 flex flex-col items-center gap-2">
            {images.length > 1 && (
                <div className="text-white/50 text-sm font-medium">
                    {images.indexOf(currentImage) + 1} / {images.length}
                </div>
            )}

            {creditText && (
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-white/90 text-sm font-medium border border-white/10 shadow-lg animate-slide-up">
                    <Copyright size={14} className="text-history-gold" />
                    <span>{creditText}</span>
                </div>
            )}
        </div>
      </div>

      {images.length > 1 && (
        <button 
          onClick={(e) => { e.stopPropagation(); nextImage(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all z-50"
        >
          <ChevronRight size={40} />
        </button>
      )}
    </div>,
    document.body
  );
};

export default LightboxViewer;
