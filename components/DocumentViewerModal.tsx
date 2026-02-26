
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ExternalLink, Download, FileText, Loader2, Maximize2 } from 'lucide-react';

interface DocumentViewerModalProps {
  doc: {
    title: string;
    url: string;
    category: string;
  } | null;
  onClose: () => void;
}

const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({ doc, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);

  // Lock scroll when modal is open
  useEffect(() => {
    if (doc) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'unset';
    }
    return () => {
        document.body.style.overflow = 'unset';
    };
  }, [doc]);

  if (!doc || typeof document === 'undefined') return null;

  // Xử lý URL để đảm bảo hiển thị tốt trong iframe
  const getViewerUrl = (url: string) => {
    // Nếu là file PDF trên Cloudinary, đảm bảo không bị force download
    if (url.includes('cloudinary.com') && url.endsWith('.pdf')) {
        return url.replace('/upload/', '/upload/fl_inline/'); 
    }
    return url;
  };

  const viewerUrl = getViewerUrl(doc.url);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-pop-in relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-history-dark text-white p-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="bg-white/10 p-2 rounded-lg">
                <FileText size={20} className="text-history-gold" />
            </div>
            <div className="min-w-0">
                <h3 className="font-bold text-base md:text-lg truncate font-serif">{doc.title}</h3>
                <p className="text-xs text-gray-400">{doc.category}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a 
                href={doc.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white"
                title="Mở trong tab mới / Tải xuống"
            >
                <ExternalLink size={20} />
            </a>
            <button 
                onClick={onClose} 
                className="p-2 hover:bg-red-600/80 rounded-full transition-colors text-white"
                title="Đóng"
            >
                <X size={24} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 bg-gray-100 relative w-full h-full">
            {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 z-0">
                    <Loader2 size={40} className="animate-spin mb-2" />
                    <p className="font-medium">Đang tải tài liệu...</p>
                </div>
            )}
            
            <iframe 
                src={viewerUrl}
                className="w-full h-full relative z-10"
                frameBorder="0"
                onLoad={() => setIsLoading(false)}
                title="Document Viewer"
                allowFullScreen
            ></iframe>
        </div>

        {/* Footer Note (Mobile only) */}
        <div className="bg-white border-t border-gray-200 p-2 text-center text-xs text-gray-500 md:hidden">
            Nếu tài liệu không hiển thị, hãy nhấn nút <ExternalLink size={10} className="inline"/> ở góc trên.
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DocumentViewerModal;
