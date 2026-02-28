
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Youtube, ExternalLink, Calendar, FileText, Image as ImageIcon } from 'lucide-react';
import { HistoricalEvent } from '../types';
import EditableImage from './EditableImage';
import EditableText from './EditableText';
import EditableMaterials from './EditableMaterials';
import SmartCarousel from './SmartCarousel'; // Import Carousel

interface EventDetailModalProps {
  event: HistoricalEvent | null;
  onClose: () => void;
}

const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, onClose }) => {
  // Lock scroll when modal is open
  useEffect(() => {
    if (event) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'unset';
    }
    return () => {
        document.body.style.overflow = 'unset';
    };
  }, [event]);

  if (!event || typeof document === 'undefined') return null;

  const getYoutubeEmbedUrl = (url?: string) => {
    if (!url) return null;
    try {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
    } catch(e) {
        return null;
    }
  };

  const videoMaterial = event.materials?.find(m => m.type === 'video');
  const embedUrl = getYoutubeEmbedUrl(videoMaterial?.url);

  return createPortal(
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 backdrop-blur-md p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-6xl overflow-hidden animate-pop-in max-h-[95vh] flex flex-col relative border border-gray-200"
        onClick={(e) => e.stopPropagation()} 
      >
        {/* Header */}
        <div className="bg-history-dark text-white p-5 flex justify-between items-center sticky top-0 z-30 shadow-md shrink-0">
          <div className="flex items-center gap-4">
              <div className="bg-history-red text-white p-2.5 rounded-xl shadow-inner border border-red-800">
                  <Calendar size={24} />
              </div>
              <div>
                  <div className="text-xs font-bold text-history-gold uppercase tracking-wider mb-0.5">{event.year}</div>
                  <h3 className="font-bold text-xl md:text-2xl font-serif leading-none truncate max-w-[200px] md:max-w-md">{event.title}</h3>
              </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors active:scale-95 bg-white/10 backdrop-blur-sm border border-white/10">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 bg-[#fdfbf7] custom-scrollbar">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-full">
                
                {/* 1. Main Content (Left - 8/12) */}
                <div className="lg:col-span-8 p-6 md:p-10 space-y-10">
                    
                    {/* Hero Image */}
                    <div className="w-full aspect-video rounded-3xl overflow-hidden shadow-xl border border-gray-200 relative group">
                        <EditableImage imageId={event.id} initialSrc={event.image} alt={event.title} className="w-full h-full" />
                        <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-3xl pointer-events-none"></div>
                        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur text-white text-xs px-3 py-1 rounded-full border border-white/20">
                            Tư liệu lịch sử
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                       <h4 className="flex items-center gap-2 text-xl font-bold text-history-red border-b-2 border-history-red/20 pb-2 mb-4 font-serif">
                           <FileText size={24} /> Diễn biến lịch sử
                       </h4>
                       <div className="text-gray-800 leading-relaxed text-justify text-lg font-serif">
                           <EditableText id={`event-detail-${event.id}`} tag="div" multiline defaultText={event.description} />
                       </div>
                    </div>

                    {/* Video Section */}
                    {embedUrl && (
                        <div>
                            <h4 className="flex items-center gap-2 text-xl font-bold text-gray-700 border-b-2 border-gray-200 pb-2 mb-4 font-serif">
                                <Youtube size={24} className="text-red-600"/> Tư liệu Video
                            </h4>
                            <div className="relative pt-[56.25%] rounded-3xl overflow-hidden shadow-lg bg-black ring-4 ring-gray-100">
                                 <iframe 
                                    className="absolute inset-0 w-full h-full"
                                    src={embedUrl} 
                                    title={event.title}
                                    frameBorder="0" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                    allowFullScreen
                                ></iframe>
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. Sidebar (Right - 4/12) */}
                <div className="lg:col-span-4 bg-gray-50 border-l border-gray-200 flex flex-col p-6 space-y-6">
                    {/* Materials Section */}
                    <div>
                        <h4 className="font-bold text-gray-400 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                            <FileText size={14}/> Tài liệu tham khảo
                        </h4>
                        <EditableMaterials id={event.id} />
                    </div>
                    
                    {/* Smart Carousel Widget (Replaces Static Gallery) */}
                    <div>
                        <h4 className="font-bold text-gray-400 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                            <ImageIcon size={14}/> Có thể bạn quan tâm
                        </h4>
                        
                        {/* Pass eventId so SmartCarousel can fetch/manage its data */}
                        <SmartCarousel eventId={event.id} initialItems={event.promotions} title="Di sản & Điểm đến" />
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>,
    document.body
  );
};

export default EventDetailModal;
