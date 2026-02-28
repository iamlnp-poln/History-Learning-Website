
import React, { useState, useEffect } from 'react';
import { Gamepad2, User, Globe2, ArrowRight, BookOpen, UserCircle, Trophy, Map, Shield, Flag } from 'lucide-react';
import { UserProfile } from '../types';
import { HistoryGame } from './HistoryGame';
import FigureQuizGame from './FigureQuizGame';
import WorldHistoryJeopardy from './WorldHistoryJeopardy';
import EditableImage from './EditableImage';
import EditableText from './EditableText';
import { AmericanResistanceWarGame } from './AmericanResistanceWarGame';
import { ColdWarGame } from './ColdWarGame';

interface GamesPageProps {
  user?: UserProfile | null;
}

type GameViewMode = 'menu' | 'history-game-1945' | 'history-game-1954' | 'cold-war-game' | 'figure-game' | 'world-jeopardy';

const GamesPage: React.FC<GamesPageProps> = ({ user }) => {
  const [viewMode, setViewMode] = useState<GameViewMode>('menu');

  useEffect(() => {
    // Scroll to top when view mode changes to a game
    if (viewMode !== 'menu') {
      window.scrollTo(0, 0);
    }
  }, [viewMode]);

  // Render Menu Selection
  const renderMenu = () => (
    <div id="games-menu" className="max-w-6xl mx-auto py-10 px-4 animate-slide-up">
       <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-history-dark mb-4 font-serif">
                <EditableText id="games-menu-title" defaultText="Trung Tâm Giải Trí Lịch Sử" />
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
                <EditableText id="games-menu-desc" defaultText="Vừa học vừa chơi với các thử thách trí tuệ. Tích lũy kiến thức qua các trò chơi tương tác thú vị." />
            </p>
       </div>

       {/* Section 1: Campaign Games */}
       <div id="games-campaign" className="mb-16">
            <h3 className="text-2xl font-bold font-serif text-history-dark mb-6 border-l-4 border-history-red pl-4 flex items-center gap-2">
                <Map size={24} />
                <EditableText id="games-campaign-title" defaultText="Game Chiến Dịch (Bản Đồ)" />
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Game 1: Kháng chiến chống Pháp */}
                <div 
                    onClick={() => setViewMode('history-game-1945')}
                    className="bg-white rounded-3xl p-4 md:p-6 shadow-lg border-2 border-transparent hover:border-history-gold cursor-pointer transition-all transform hover:-translate-y-2 group flex flex-col h-full active:scale-95 duration-200"
                >
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-4 text-history-gold group-hover:bg-history-gold group-hover:text-history-dark transition-colors mx-auto shadow-sm">
                        <Trophy size={32} />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2 group-hover:text-history-gold transition-colors text-center">Chiến Dịch Lịch Sử</h3>
                    <p className="text-gray-500 text-xs md:text-sm mb-4 flex-1 text-center">Vượt qua các mốc son trong cuộc kháng chiến chống Pháp hào hùng (1945-1954).</p>
                    <span className="text-history-gold font-bold flex items-center justify-center gap-2 text-xs md:text-sm mt-auto bg-yellow-50 py-2.5 md:py-3 rounded-xl group-hover:bg-history-gold group-hover:text-history-dark transition-all">
                        Chơi ngay <ArrowRight size={16} />
                    </span>
                </div>
                {/* Game 2: Kháng chiến chống Mỹ */}
                <div 
                    onClick={() => setViewMode('history-game-1954')}
                    className="bg-white rounded-3xl p-4 md:p-6 shadow-lg border-2 border-transparent hover:border-red-600 cursor-pointer transition-all transform hover:-translate-y-2 group flex flex-col h-full active:scale-95 duration-200"
                >
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors mx-auto shadow-sm">
                        <Flag size={32} />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2 group-hover:text-red-600 transition-colors text-center">Hành Trình Thống Nhất</h3>
                    <p className="text-gray-500 text-xs md:text-sm mb-4 flex-1 text-center">Theo chân quân giải phóng qua các chiến dịch lớn trong kháng chiến chống Mỹ (1954-1975).</p>
                    <span className="text-red-600 font-bold flex items-center justify-center gap-2 text-xs md:text-sm mt-auto bg-red-50 py-2.5 md:py-3 rounded-xl group-hover:bg-red-600 group-hover:text-white transition-all">
                        Chơi ngay <ArrowRight size={16} />
                    </span>
                </div>
                {/* Game 3: Chiến tranh Lạnh */}
                <div 
                    onClick={() => setViewMode('cold-war-game')}
                    className="bg-white rounded-3xl p-4 md:p-6 shadow-lg border-2 border-transparent hover:border-blue-500 cursor-pointer transition-all transform hover:-translate-y-2 group flex flex-col h-full active:scale-95 duration-200"
                >
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors mx-auto shadow-sm">
                        <Shield size={32} />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-500 transition-colors text-center">Hồ Sơ Lạnh Giá</h3>
                    <p className="text-gray-500 text-xs md:text-sm mb-4 flex-1 text-center">Khám phá các sự kiện toàn cầu thời kì Chiến tranh lạnh, từ Bức tường Berlin đến khủng hoảng Cuba (1947-1991).</p>
                    <span className="text-blue-500 font-bold flex items-center justify-center gap-2 text-xs md:text-sm mt-auto bg-blue-50 py-2.5 md:py-3 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-all">
                        Chơi ngay <ArrowRight size={16} />
                    </span>
                </div>
            </div>
       </div>

       {/* Section 2: Knowledge Games */}
       <div id="games-knowledge">
            <h3 className="text-2xl font-bold font-serif text-history-dark mb-6 border-l-4 border-green-600 pl-4 flex items-center gap-2">
                <Gamepad2 size={24} />
                <EditableText id="games-quiz-title" defaultText="Game Kiến Thức (Quiz)" />
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {/* Game 4: Hào Khí Việt Nam */}
                <div 
                    onClick={() => setViewMode('figure-game')}
                    className="bg-white rounded-3xl p-4 md:p-6 shadow-lg border-2 border-transparent hover:border-green-600 cursor-pointer transition-all transform hover:-translate-y-2 group flex flex-col h-full active:scale-95 duration-200"
                >
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors mx-auto shadow-sm">
                        <User size={32} />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2 group-hover:text-green-600 transition-colors text-center">Hào Khí Việt Nam</h3>
                    <p className="text-gray-500 text-xs md:text-sm mb-4 flex-1 text-center">Trò chơi đoán tên nhân vật lịch sử Việt Nam qua các dữ kiện. Tôn vinh các anh hùng dân tộc.</p>
                    <span className="text-green-600 font-bold flex items-center justify-center gap-2 text-xs md:text-sm mt-auto bg-green-50 py-2.5 md:py-3 rounded-xl group-hover:bg-green-600 group-hover:text-white transition-all">
                        Chơi ngay <ArrowRight size={16} />
                    </span>
                </div>
                
                {/* Game 5: Danh Nhân Thế Giới */}
                <div 
                    onClick={() => setViewMode('world-jeopardy')}
                    className="bg-white rounded-3xl p-4 md:p-6 shadow-lg border-2 border-transparent hover:border-cyan-500 cursor-pointer transition-all transform hover:-translate-y-2 group flex flex-col h-full active:scale-95 duration-200"
                >
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-cyan-100 rounded-full flex items-center justify-center mb-4 text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white transition-colors mx-auto shadow-sm">
                        <Globe2 size={32} />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2 group-hover:text-cyan-600 transition-colors text-center">Danh Nhân Thế Giới</h3>
                    <p className="text-gray-500 text-xs md:text-sm mb-4 flex-1 text-center">Thử thách kiến thức về các vĩ nhân thế giới qua trò chơi trí tuệ theo phong cách Jeopardy.</p>
                    <span className="text-cyan-600 font-bold flex items-center justify-center gap-2 text-xs md:text-sm mt-auto bg-cyan-50 py-2.5 md:py-3 rounded-xl group-hover:bg-cyan-600 group-hover:text-white transition-all">
                        Chơi ngay <ArrowRight size={16} />
                    </span>
                </div>
            </div>
       </div>
    </div>
  );

  return (
    <div className="animate-fade-in pb-20 bg-history-paper min-h-screen">
      {/* Page Title Banner - Only show in menu mode */}
      {viewMode === 'menu' && (
        <div id="games-hero" className="relative bg-history-dark text-white py-12 px-4 text-center overflow-hidden">
            {/* Background Image Layer */}
            <div className="absolute inset-0 z-0 opacity-40">
                <EditableImage 
                    imageId="games-header-bg"
                    initialSrc=""
                    alt="Games Banner"
                    className="w-full h-full object-cover"
                    disableEdit={true}
                />
            </div>
            <div className="relative z-10">
                <h1 className="text-2xl md:text-3xl font-bold font-serif text-white flex items-center justify-center gap-3">
                <Gamepad2 className="text-history-gold" size={32} /> Giải Trí & Lịch Sử
                </h1>
            </div>
        </div>
      )}

      <div className="px-0">
        {viewMode === 'menu' && renderMenu()}
        
        {viewMode === 'history-game-1945' && (
            <div className="animate-fade-in">
                <HistoryGame onBack={() => setViewMode('menu')} />
            </div>
        )}

        {viewMode === 'history-game-1954' && (
            <div className="animate-fade-in">
                <AmericanResistanceWarGame onBack={() => setViewMode('menu')} />
            </div>
        )}

        {viewMode === 'cold-war-game' && (
            <div className="animate-fade-in">
                <ColdWarGame onBack={() => setViewMode('menu')} />
            </div>
        )}

        {viewMode === 'world-jeopardy' && (
            <div className="animate-fade-in">
                <WorldHistoryJeopardy onBack={() => setViewMode('menu')} />
            </div>
        )}

        {viewMode === 'figure-game' && (
            <div className="animate-fade-in">
                <FigureQuizGame onBack={() => setViewMode('menu')} user={user ?? null} />
            </div>
        )}
      </div>
    </div>
  );
};

export default GamesPage;
