
import React from 'react';
import { HistoricalFigure } from '../types';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import EditableImage from './EditableImage';
import EditableText from './EditableText';

interface HistoricalFiguresSectionProps {
  figures: HistoricalFigure[];
  type: 'vietnam' | 'world';
  onViewDetail?: (figure: HistoricalFigure) => void;
  onBack?: () => void;
}

const HistoricalFiguresSection: React.FC<HistoricalFiguresSectionProps> = ({ figures, type, onViewDetail, onBack }) => {
  const isVN = type === 'vietnam';
  const themeColor = isVN ? 'text-history-red' : 'text-blue-700';
  const badgeColor = isVN ? 'bg-history-red' : 'bg-blue-600';

  if (figures.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-xl">Chưa có dữ liệu nhân vật.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-6 md:py-10">
      
      <div className="relative bg-history-paper rounded-[2rem] md:rounded-[3rem] shadow-xl border-2 border-gray-200 overflow-hidden hover:border-history-gold transition-colors duration-500">
        <div className="absolute top-0 right-0 w-20 h-20 md:w-32 md:h-32 bg-history-gold/5 rounded-bl-[2.5rem] md:rounded-bl-[4rem] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-20 h-20 md:w-32 md:h-32 bg-history-gold/5 rounded-tr-[2.5rem] md:rounded-tr-[4rem] pointer-events-none"></div>

        <div className="p-3 md:p-10 lg:p-14 relative z-10">
          
          <div className="flex items-center justify-center mb-8 md:mb-12 relative">
            {onBack && (
                <button 
                    onClick={onBack}
                    className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-black/5 transition-colors text-gray-500"
                    title="Quay lại"
                >
                    <ArrowLeft size={24} />
                </button>
            )}
            <div className="inline-block relative">
              <div className="absolute inset-0 bg-history-gold blur-lg opacity-20 rounded-full"></div>
              <h2 className={`relative text-xl md:text-3xl font-bold font-serif uppercase tracking-wide border-b-4 ${isVN ? 'border-history-red' : 'border-blue-700'} pb-2 ${themeColor} text-center`}>
                Nhân Vật {isVN ? 'Việt Nam' : 'Thế Giới'}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
            {figures.map((figure, index) => (
              <div 
                key={figure.id} 
                style={{ animationDelay: `${index * 100}ms` }}
                className={`
                  flex flex-col sm:flex-row bg-white rounded-3xl shadow-lg overflow-hidden 
                  transition-all duration-300 group animate-slide-up opacity-0 fill-mode-forwards
                  md:hover:shadow-2xl md:hover:-translate-y-2 border border-transparent md:hover:border-history-gold/30
                `}
              >
                {/* Image Container */}
                <div className="w-full sm:w-56 aspect-[3/4] relative bg-gray-200 shrink-0 overflow-hidden">
                  <EditableImage 
                    imageId={figure.id}
                    initialSrc={figure.image} 
                    alt={figure.name}
                    className="w-full h-full"
                  />
                  
                  {/* Name overlay on mobile */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/50 to-transparent sm:hidden pointer-events-none">
                     <p className="text-white font-bold text-xl font-serif truncate shadow-black drop-shadow-md">{figure.name}</p>
                     <p className="text-gray-200 text-sm truncate">{figure.years}</p>
                  </div>
                </div>

                {/* Content Container */}
                <div className="p-6 md:p-7 flex flex-col flex-1 justify-center">
                  <div className="hidden sm:flex justify-between items-start mb-3">
                     <h3 className="text-2xl font-bold font-serif text-gray-800 group-hover:text-history-gold transition-colors leading-tight">
                        <EditableText id={`fig-name-${figure.id}`} defaultText={figure.name} />
                     </h3>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                     <span className={`text-xs font-bold px-3 py-1 rounded-full text-white ${badgeColor} shadow-sm whitespace-nowrap hidden sm:inline-block`}>
                        <EditableText id={`fig-years-${figure.id}`} defaultText={figure.years} />
                     </span>
                     <span className={`inline-block text-xs font-bold uppercase tracking-wider ${themeColor} bg-opacity-10 bg-gray-100 rounded-md px-2 py-1`}>
                        <EditableText id={`fig-role-${figure.id}`} defaultText={figure.role} />
                     </span>
                  </div>
                  
                  <div className="text-gray-600 text-base leading-relaxed text-justify line-clamp-none sm:line-clamp-4 transition-all duration-300">
                    {/* Changed ID to fig-summary- to decouple from detail page */}
                    <EditableText 
                        id={`fig-summary-${figure.id}`} 
                        defaultText={figure.description} 
                        multiline 
                        tag="div" 
                    />
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                      <button 
                        onClick={() => onViewDetail && onViewDetail(figure)}
                        className={`text-xs font-bold uppercase tracking-wide flex items-center gap-1 py-2 px-4 rounded-lg transition-colors ${isVN ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                      >
                          Xem chi tiết <ArrowRight size={14} />
                      </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default HistoricalFiguresSection;
