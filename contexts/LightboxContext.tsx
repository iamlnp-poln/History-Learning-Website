
import React, { createContext, useContext, useState } from 'react';

interface LightboxContextType {
  isOpen: boolean;
  currentImage: string;
  images: string[];
  openLightbox: (src: string, allImages?: string[]) => void;
  closeLightbox: () => void;
  nextImage: () => void;
  prevImage: () => void;
}

const LightboxContext = createContext<LightboxContextType | undefined>(undefined);

export const useLightbox = () => {
  const context = useContext(LightboxContext);
  if (!context) {
    throw new Error('useLightbox must be used within a LightboxProvider');
  }
  return context;
};

export const LightboxProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const openLightbox = (src: string, allImages: string[] = []) => {
    if (!src) return;
    setCurrentImage(src);
    setImages(allImages.length > 0 ? allImages : [src]);
    setIsOpen(true);
  };

  const closeLightbox = () => {
    setIsOpen(false);
    setCurrentImage('');
    setImages([]);
  };

  const nextImage = () => {
    if (images.length <= 1) return;
    const currentIndex = images.indexOf(currentImage);
    const nextIndex = (currentIndex + 1) % images.length;
    setCurrentImage(images[nextIndex]);
  };

  const prevImage = () => {
    if (images.length <= 1) return;
    const currentIndex = images.indexOf(currentImage);
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    setCurrentImage(images[prevIndex]);
  };

  return (
    <LightboxContext.Provider value={{ isOpen, currentImage, images, openLightbox, closeLightbox, nextImage, prevImage }}>
      {children}
    </LightboxContext.Provider>
  );
};
