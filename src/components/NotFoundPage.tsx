
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Compass, Gamepad2, Search } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  const handleNav = (path: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate(path);
  };

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center text-center px-4 bg-[#fdfbf7] relative overflow-hidden animate-fade-in">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]"></div>
      
      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="text-[10rem] md:text-[12rem] font-black text-history-red/10 font-serif leading-none select-none">
          404
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold text-history-dark -mt-8 md:-mt-12 mb-4 font-serif relative z-10">
          Lạc Trôi Trong Dòng Lịch Sử?
        </h1>
        
        <p className="text-gray-600 text-lg mb-8 leading-relaxed">
          Trang bạn đang tìm kiếm dường như đã bị thất lạc trong biên niên sử hoặc chưa từng tồn tại. 
          Hãy quay lại dòng thời gian chính để tiếp tục hành trình khám phá.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button 
            onClick={() => handleNav('/')}
            className="flex items-center gap-2 px-6 py-3 bg-history-dark text-history-gold rounded-xl font-bold hover:bg-black transition-all shadow-md active:scale-95 w-full sm:w-auto justify-center"
          >
            <Home size={20} /> Về Trang Chủ
          </button>
          
          <button 
            onClick={() => handleNav('/explore')}
            className="flex items-center gap-2 px-6 py-3 bg-white text-history-red border-2 border-history-red rounded-xl font-bold hover:bg-red-50 transition-all shadow-sm active:scale-95 w-full sm:w-auto justify-center"
          >
            <Compass size={20} /> Khám Phá Sự Kiện
          </button>

          <button 
            onClick={() => handleNav('/quiz')}
            className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-sm active:scale-95 w-full sm:w-auto justify-center"
          >
            <Gamepad2 size={20} /> Chơi Game Lịch Sử
          </button>
        </div>
      </div>

      <div className="mt-12 text-gray-400 text-sm flex items-center gap-2">
        <Search size={16} />
        <span>Mẹo: Sử dụng thanh tìm kiếm để tra cứu sự kiện cụ thể.</span>
      </div>
    </div>
  );
};

export default NotFoundPage;
