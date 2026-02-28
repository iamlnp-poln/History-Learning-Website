import React, { useState, useEffect } from 'react';
import { HistoricalEvent } from '../types';
import { Bot, ArrowRight, Trash2, Calendar, BookOpen, MapPin, Edit2 } from 'lucide-react';
import EditableImage from './EditableImage';
import EditableText from './EditableText';
import { auth } from '../firebaseConfig';
import { ADMIN_UIDS } from '../services/storageService';

interface EventCardProps {
  event: HistoricalEvent;
  onAskAI: (event: HistoricalEvent) => void;
  onViewDetail?: (event: HistoricalEvent) => void; 
  onViewHeritage?: (event: HistoricalEvent) => void; 
  onViewDiscovery?: (event: HistoricalEvent) => void; 
  onDelete?: (event: HistoricalEvent) => void;
  onEdit?: (event: HistoricalEvent) => void; 
  type: 'vietnam' | 'world';
  index?: number; 
  searchTerm?: string; 
}

const EventCard: React.FC<EventCardProps> = ({ event, onAskAI, onViewDetail, onViewHeritage, onViewDiscovery, onDelete, onEdit, type, index = 0, searchTerm = "" }) => {
  const isVN = type === 'vietnam';
  const animationDelay = `${index * 100}ms`;
  const [isAdmin, setIsAdmin] = useState(false);

  const locationCount = event.relatedLocations?.length || 0;

  useEffect(() => {
    const unsubscribe = auth?.onAuthStateChanged((user: any) => {
      setIsAdmin(!!user && ADMIN_UIDS.includes(user.uid));
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  const handleLocationClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      // Nếu là Admin, luôn ưu tiên mở Discovery (để có thể Thêm địa điểm mới)
      if (isAdmin && onViewDiscovery) {
          onViewDiscovery(event);
          return;
      }
      
      // Với user thường: Nếu có địa điểm thì mở danh sách địa điểm
      if (locationCount > 0 && onViewDiscovery) {
          onViewDiscovery(event);
      } else if (onViewHeritage) {
          // Fallback nếu cần (thường nút này dùng cho Discovery)
          onViewHeritage(event);
      }
  };

  return (
    <div 
      id={`event-${event.id}`} 
      style={{ animationDelay }}
      className={`
      relative p-5 rounded-2xl bg-white shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] 
      transition-all duration-300 group animate-slide-up opacity-0 fill-mode-forwards
      hover:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.15)] hover:-translate-y-1 border border-gray-100
      overflow-hidden
    `}>
      {/* Decorative colored bar */}
      <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${isVN ? 'bg-history-red' : 'bg-blue-600'}`}></div>

      <div className="flex flex-col sm:flex-row gap-5">
        {/* Image Container */}
        <div className="w-full sm:w-44 h-48 sm:h-auto shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 relative group/img self-start aspect-[4/3] sm:aspect-square">
            <EditableImage 
                imageId={event.id}
                initialSrc={event.image} 
                alt={event.title} 
                className="w-full h-full transform transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-xl pointer-events-none"></div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex justify-between items-start gap-2 mb-2">
            <div className={`
              inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-white shadow-md
              ${isVN ? 'bg-history-red shadow-red-200' : 'bg-blue-600 shadow-blue-200'}
              transform group-hover:scale-105 transition-transform duration-300
            `}>
              <Calendar size={12} className="opacity-90" />
              <EditableText 
                id={`event-year-${event.id}`} 
                defaultText={event.year} 
                className="text-white tracking-wide"
                highlightKeyword={searchTerm} 
              />
            </div>
            
            <div className="flex gap-1 shrink-0">
                {isAdmin && (
                    <>
                        {onEdit && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onEdit(event); }}
                                className="text-gray-300 hover:text-blue-600 transition-colors p-1.5 rounded-full hover:bg-blue-50"
                                title="Sửa sự kiện"
                            >
                                <Edit2 size={16} />
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(event); }}
                                className="text-gray-300 hover:text-red-600 transition-colors p-1.5 rounded-full hover:bg-red-50"
                                title="Xóa sự kiện"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </>
                )}
                
                {/* Ask AI Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); onAskAI(event); }}
                    className="flex items-center gap-1.5 text-history-gold hover:text-white hover:bg-history-gold transition-all px-3 py-1.5 rounded-full bg-yellow-50 border border-yellow-100 shadow-sm text-xs font-bold"
                    title="Hỏi AI về sự kiện này"
                >
                    <Bot size={16} /> Hỏi AI
                </button>

                {/* NEW: Heritage/Map/Discovery Button */}
                {/* Logic: Chỉ hiển thị nếu có địa điểm HOẶC user là Admin (để thêm mới) */}
                {(onViewDiscovery) && (locationCount > 0 || isAdmin) && (
                    <button
                        onClick={handleLocationClick}
                        className={`
                            relative flex items-center justify-center p-1.5 rounded-full transition-all border
                            ${locationCount > 0 
                                ? 'bg-red-100 text-red-600 border-red-200 hover:bg-red-600 hover:text-white' 
                                : 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200' 
                            }
                        `}
                        title={locationCount > 0 ? `Khám phá ${locationCount} địa điểm` : "Quản lý địa điểm (Admin)"}
                    >
                        <MapPin size={18} />
                        {locationCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-history-gold text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                                {locationCount}
                            </span>
                        )}
                        {/* Show Plus icon for Admin if empty */}
                        {isAdmin && locationCount === 0 && (
                             <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[8px] font-bold w-3 h-3 rounded-full flex items-center justify-center shadow-sm">
                                +
                            </span>
                        )}
                    </button>
                )}
            </div>
          </div>
          
          <div className="mb-3">
             <EditableText 
                id={`event-title-${event.id}`}
                tag="h4"
                defaultText={event.title}
                highlightKeyword={searchTerm} 
                className={`text-lg md:text-xl font-bold font-serif leading-snug group-hover:underline decoration-2 underline-offset-4 ${isVN ? 'decoration-history-red/30' : 'decoration-blue-600/30'} text-gray-800`}
             />
          </div>
          
          <div className="mb-4 flex-grow">
             <EditableText 
                id={`event-summary-${event.id}`}
                tag="div"
                multiline
                defaultText={event.description}
                highlightKeyword={searchTerm} 
                className="text-gray-600 text-sm leading-relaxed line-clamp-3 text-justify font-sans"
             />
          </div>

          <div className="mt-auto flex justify-end">
              {onViewDetail && (
                  <button
                      onClick={(e) => {
                          e.stopPropagation();
                          onViewDetail(event);
                      }}
                      className={`
                        flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2.5 rounded-lg transition-all shadow-sm
                        ${isVN ? 'text-history-red bg-red-50 hover:bg-history-red hover:text-white border border-red-100' : 'text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-100'}
                      `}
                  >
                      <BookOpen size={14} /> Chi tiết <ArrowRight size={14} />
                  </button>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;