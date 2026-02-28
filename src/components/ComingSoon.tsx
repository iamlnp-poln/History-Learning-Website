import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, Construction, Clock } from 'lucide-react';

interface ComingSoonProps {
  title?: string;
  description?: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({ 
  title = "Tính Năng Mới", 
  description = "Đội ngũ biên tập The Black Swans đang nỗ lực hoàn thiện nội dung này. Hãy quay lại sớm nhé!" 
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 animate-fade-in bg-history-paper relative overflow-hidden pt-20">
      {/* Decorative Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-history-gold/5 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-history-red/5 rounded-full blur-3xl -z-10"></div>

      <div className="max-w-xl mx-auto p-8 rounded-3xl border-2 border-dashed border-history-gold/30 bg-white/50 backdrop-blur-sm shadow-sm">
        <div className="w-20 h-20 bg-history-gold/10 rounded-full flex items-center justify-center mx-auto mb-6 text-history-gold animate-pulse">
          <Sparkles size={40} />
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold text-history-dark mb-2 font-serif">
          Sắp Ra Mắt: <span className="text-history-red">{title}</span>
        </h1>
        
        <div className="flex items-center justify-center gap-2 text-gray-500 text-sm font-bold uppercase tracking-widest mb-6">
            <Construction size={14} />
            <span>Đang xây dựng</span>
            <span className="mx-2">•</span>
            <Clock size={14} />
            <span>Ra mắt sớm</span>
        </div>

        <p className="text-gray-600 text-lg mb-8 leading-relaxed font-serif italic">
          "{description}"
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-history-dark text-history-gold rounded-full font-bold hover:bg-black transition-all shadow-lg active:scale-95"
          >
            <ArrowLeft size={18} /> Về Trang Chủ
          </button>
          <button 
            onClick={() => navigate('/explore')}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-white text-gray-700 border border-gray-200 rounded-full font-bold hover:bg-gray-50 transition-all shadow-sm active:scale-95"
          >
            Khám phá Timeline
          </button>
        </div>
      </div>
      
      <div className="mt-8 text-xs text-gray-400 font-mono">
        Project: Trạm Lịch Sử 4.0 &copy; 2025
      </div>
    </div>
  );
};

export default ComingSoon;