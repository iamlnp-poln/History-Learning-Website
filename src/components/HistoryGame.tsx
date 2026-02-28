
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Lock, Check, Star, Play, X, RotateCcw, Award, ChevronRight, Flag, Tent, Mountain, Trees, Zap, Shield, Scroll } from 'lucide-react';
import { HISTORY_GAME_DATA } from '../data/gameData';

const LevelNode = ({ level, status, onClick, position }: any) => {
  const isLocked = status === 'locked';
  const isActive = status === 'active';
  const isCompleted = status === 'completed';

  const getCompletedIcon = (type: string) => {
    switch (type) {
      case 'zap': return Zap;
      case 'shield': return Shield;
      case 'scroll': return Scroll;
      case 'star': return Star;
      case 'flag': 
      default: return Flag;
    }
  };

  const CompletedIcon = getCompletedIcon(level.iconType);

  return (
    <div 
      className="absolute flex flex-col items-center cursor-pointer transition-all duration-300 z-10 group"
      style={{ left: position.x, top: position.y, transform: 'translate(-50%, -50%)' }}
      onClick={() => !isLocked && onClick(level)}
    >
      <div className={`
        relative flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full border-4 shadow-xl transform transition-transform group-hover:scale-110
        ${isLocked ? 'bg-gray-300 border-gray-500 opacity-80' : ''}
        ${isActive ? 'bg-red-600 border-yellow-400 animate-pulse shadow-red-400' : ''}
        ${isCompleted ? 'bg-teal-600 border-white' : ''}
      `}>
        {isLocked && <Lock className="w-5 h-5 text-gray-500" />}
        {isActive && (
          <div className="relative">
             <Star className="w-6 h-6 text-yellow-300 fill-current animate-spin-slow" />
             <div className="absolute inset-0 bg-yellow-400 rounded-full opacity-30 animate-ping"></div>
          </div>
        )}
        {isCompleted && <CompletedIcon className="w-6 h-6 text-white fill-current" />}
        <div className={`
          absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs border-2 shadow-sm
          ${isActive ? 'bg-yellow-400 text-red-800 border-red-600 scale-110' : 'bg-white text-gray-600 border-gray-300'}
        `}>
          {level.id}
        </div>
      </div>
      <div className={`
        mt-2 px-2 py-1 text-center font-bold text-[10px] md:text-xs shadow-md min-w-[100px] max-w-[140px]
        transform transition-all duration-300 group-hover:-translate-y-1
        ${isLocked 
          ? 'bg-gray-200/90 text-gray-500 rounded-lg' 
          : 'bg-[#f8f1d8] border-2 border-[#8b5a2b] text-[#5d4037] rounded-sm relative after:content-[""] after:absolute after:top-0 after:left-0 after:w-full after:h-full after:border after:border-[#8b5a2b] after:translate-x-0.5 after:translate-y-0.5'}
      `}>
        {level.title}
        {isCompleted && (
           <div className="flex justify-center mt-0.5 gap-0.5">
             {[...Array(3)].map((_, i) => (
               <Star key={i} className="w-2 text-yellow-600 fill-current" />
             ))}
           </div>
        )}
      </div>
    </div>
  );
};

const GameScreen = ({ level, onClose, onComplete }: any) => {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [gameFinished, setGameFinished] = useState(false);

  const currentQ = level.questions[currentQIndex];

  const handleAnswer = (index: number) => {
    if (showExplanation) return;
    setSelectedOption(index);
    const correct = index === currentQ.correct;
    setIsCorrect(correct);
    setShowExplanation(true);
    if (correct) {
      setScore(s => s + 2);
    }
  };

  const nextQuestion = () => {
    if (currentQIndex < level.questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
      setIsCorrect(null);
    } else {
      setGameFinished(true);
    }
  };

  const isPassed = score >= 6;

  if (gameFinished) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[6000] p-4 animate-in fade-in zoom-in duration-300">
        <div className="bg-[#fdfbf7] rounded-3xl p-8 max-w-md w-full border-4 border-[#8b5a2b] shadow-2xl text-center relative overflow-hidden">
           <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#8b5a2b]"></div>
           <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#8b5a2b]"></div>
           <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#8b5a2b]"></div>
           <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#8b5a2b]"></div>
           {isPassed ? (
             <div className="mb-6">
               <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
                  <Award className="w-16 h-16 text-red-600" />
               </div>
               <h2 className="text-3xl font-bold text-[#8b5a2b] mb-2 uppercase">Chiến thắng!</h2>
               <p className="text-[#5d4037]">Đồng chí đã hoàn thành nhiệm vụ xuất sắc.</p>
             </div>
           ) : (
             <div className="mb-6">
               <div className="mx-auto w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                  <RotateCcw className="w-12 h-12 text-gray-500" />
               </div>
               <h2 className="text-3xl font-bold text-gray-700 mb-2 uppercase">Thất bại!</h2>
               <p className="text-gray-600">Cần đạt ít nhất 6 điểm để tiến quân.</p>
             </div>
           )}
           <div className="text-5xl font-black text-red-700 mb-8 font-mono tracking-tighter">
             {score}/10
           </div>
           <div className="flex gap-4 justify-center">
             <button onClick={onClose} className="px-6 py-3 rounded-xl bg-[#e0d4b8] text-[#5d4037] font-bold hover:bg-[#d4c3a3] transition-colors border border-[#a1887f]">Về bản đồ</button>
             {isPassed ? (
                <button onClick={() => onComplete(score)} className="px-6 py-3 rounded-xl bg-red-700 text-white font-bold hover:bg-red-800 transition-colors shadow-lg animate-pulse border border-red-900">Tiến quân</button>
             ) : (
               <button onClick={() => { setGameFinished(false); setCurrentQIndex(0); setScore(0); setSelectedOption(null); setShowExplanation(false); }} className="px-6 py-3 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 transition-colors shadow-lg">Thử lại</button>
             )}
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[6000] p-2 md:p-4">
      <div className="bg-[#fdfbf7] rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden shadow-2xl border-4 border-[#8b5a2b]">
        <div className="bg-[#e8dec6] p-4 border-b-2 border-[#c2b290] flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-[#5d4037] font-bold text-lg md:text-xl uppercase flex items-center gap-2"><Tent className="w-5 h-5 text-red-700" />{level.title}</h3>
            <div className="text-[#7d5e4f] text-xs md:text-sm italic">{level.era}</div>
          </div>
          <div className="flex items-center gap-4">
             <div className="bg-white px-4 py-2 rounded font-bold text-red-700 border border-red-200 shadow-sm font-mono">ĐIỂM: {score}</div>
             <button onClick={onClose} className="p-2 hover:bg-[#d4c3a3] rounded-full transition-colors"><X className="w-6 h-6 text-[#5d4037]" /></button>
          </div>
        </div>
        <div className="w-full bg-[#d4c3a3] h-3 border-b border-[#a1887f] shrink-0">
          <div className="bg-red-600 h-full transition-all duration-500 relative" style={{ width: `${((currentQIndex + 1) / level.questions.length) * 100}%` }}><div className="absolute right-0 top-0 h-full w-1 bg-red-800"></div></div>
        </div>
        <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] bg-amber-50/30 flex flex-col items-center relative">
          <div className="w-full max-w-3xl mb-6 md:mb-10 z-10">
            <span className="inline-block bg-[#5d4037] text-white px-3 py-1 rounded-lg text-xs font-bold mb-3 uppercase tracking-wider">Nhiệm vụ {currentQIndex + 1}/5</span>
            <h2 className="text-xl md:text-2xl font-bold text-[#3e2723] leading-relaxed"> {currentQ.q} </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl z-10">
            {currentQ.options.map((opt: string, idx: number) => {
              let btnClass = "bg-white hover:bg-[#fff8e1] border-2 border-[#d7ccc8] text-[#5d4037]";
              if (showExplanation) {
                if (idx === currentQ.correct) btnClass = "bg-green-100 border-green-600 text-green-900 font-bold";
                else if (idx === selectedOption) btnClass = "bg-red-50 border-red-400 text-red-900 opacity-60";
                else btnClass = "opacity-40 bg-gray-50 border-gray-200";
              } else if (selectedOption === idx) btnClass = "bg-[#ffecb3] border-[#ffa000] text-[#5d4037] font-semibold";
              return (
                <button key={idx} onClick={() => handleAnswer(idx)} disabled={showExplanation} className={`p-6 rounded-xl text-left transition-all duration-200 shadow-sm relative overflow-hidden text-base md:text-lg ${btnClass}`}><span className="font-bold mr-2 text-lg">{String.fromCharCode(65 + idx)}.</span> {opt}</button>
              );
            })}
          </div>
          {showExplanation && (
            <div className="mt-6 w-full max-w-3xl animate-in slide-in-from-bottom-4 duration-300 z-10">
              <div className={`p-4 rounded border-l-4 shadow-md ${isCorrect ? 'bg-green-50 border-green-600' : 'bg-red-50 border-red-600'}`}>
                <div className="font-bold mb-1 flex items-center gap-2">{isCorrect ? <Check className="w-5 h-5 text-green-700"/> : <X className="w-5 h-5 text-red-700"/>}<span className={isCorrect ? "text-green-800" : "text-red-800"}>{isCorrect ? "Chính xác! (+2 điểm)" : "Chưa chính xác!"}</span></div>
                <p className="text-[#4e342e] italic text-sm md:text-base">"{currentQ.explain}"</p>
              </div>
              <div className="mt-6 flex justify-end"><button onClick={nextQuestion} className="bg-[#8b5a2b] text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-[#6d4c41] transition-all flex items-center gap-2 border border-[#4e342e]">{currentQIndex === 4 ? "Báo cáo kết quả" : "Tiếp tục hành quân"} <ChevronRight className="w-5 h-5"/></button></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Compass = ({ className }: {className: string}) => (
  <svg viewBox="0 0 100 100" className={className}>
    <circle cx="50" cy="50" r="45" fill="none" stroke="#8b5a2b" strokeWidth="2" strokeDasharray="5,2" />
    <path d="M50,10 L60,40 L90,50 L60,60 L50,90 L40,60 L10,50 L40,40 Z" fill="#d7ccc8" stroke="#5d4037" strokeWidth="1" />
    <path d="M50,10 L50,50 L90,50 L50,10 Z" fill="#5d4037" />
    <path d="M50,90 L50,50 L10,50 L50,90 Z" fill="#5d4037" />
    <circle cx="50" cy="50" r="5" fill="#3e2723" />
    <text x="50" y="8" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#3e2723">B</text>
    <text x="50" y="98" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#3e2723">N</text>
    <text x="96" y="53" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#3e2723">Đ</text>
    <text x="4" y="53" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#3e2723">T</text>
  </svg>
);

const TreeIcon = ({ x, y, scale = 1 }: {x: number, y: number, scale?: number}) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <path d="M10,30 L10,40" stroke="#558b2f" strokeWidth="2" />
    <path d="M10,5 L0,25 L5,25 L2,35 L18,35 L15,25 L20,25 Z" fill="#33691e" stroke="#1b5e20" strokeWidth="1" />
  </g>
);

const MountainIcon = ({ x, y, scale = 1 }: {x: number, y: number, scale?: number}) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <path d="M0,40 L20,10 L40,40 Z" fill="#a1887f" stroke="#5d4037" strokeWidth="1" />
    <path d="M25,40 L45,15 L65,40 Z" fill="#bcaaa4" stroke="#5d4037" strokeWidth="1" />
    <path d="M20,10 L25,18 L30,12 Z" fill="white" opacity="0.7" />
  </g>
);

import ConfirmationModal from './ConfirmationModal';

export const HistoryGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [activeLevel, setActiveLevel] = useState<any | null>(null);
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const nodePositions = [
    { x: 120, y: 765 }, { x: 420, y: 720 }, { x: 240, y: 585 }, { x: 600, y: 540 }, { x: 900, y: 495 },
    { x: 720, y: 360 }, { x: 360, y: 315 }, { x: 180, y: 180 }, { x: 540, y: 135 }, { x: 960, y: 90 },
  ];

  const handleLevelClick = (level: any) => { setActiveLevel(level); };
  const handleLevelComplete = (score: number) => {
    if (score >= 6) {
      if (!completedLevels.includes(activeLevel.id)) setCompletedLevels([...completedLevels, activeLevel.id]);
      if (activeLevel.id === unlockedLevel && unlockedLevel < 10) setUnlockedLevel(prev => prev + 1);
    }
    setActiveLevel(null);
  };

  return (
    <div className="fixed inset-0 z-[5000] bg-[#e3dcd2] font-sans text-gray-800 flex flex-col items-center">
      <style>{`
        @keyframes dash { to { stroke-dashoffset: -4; } }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
      <header className="relative z-20 text-center pt-8 pb-4 w-full bg-[#3e2723] shadow-lg border-b-4 border-[#ffb300] shrink-0">
         <button onClick={() => setShowExitConfirm(true)} className="absolute top-1/2 left-4 md:left-8 -translate-y-1/2 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors text-white z-50" title="Quay lại"><ArrowLeft size={24} /></button>
        <h1 className="text-2xl md:text-4xl font-black text-[#ffecb3] tracking-widest uppercase drop-shadow-md font-serif">
          Chiến Dịch Lịch Sử<br className="md:hidden" /> 1945 - 1954
        </h1>
        <p className="text-[#d7ccc8] mt-2 font-medium italic">Khám phá chặng đường Kháng chiến chống Pháp hào hùng</p>
      </header>
      <main ref={mainRef} className="flex-1 w-full overflow-auto bg-[#e3dcd2] cursor-grab active:cursor-grabbing flex items-start">
         <div className="relative shrink-0 mx-auto" style={{ width: 1200, height: 900 }}>
             <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#8d6e63 1px, transparent 1px), linear-gradient(90deg, #8d6e63 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
             <div className="absolute top-20 right-40 w-64 h-64 bg-[#d7ccc8] rounded-full mix-blend-multiply filter blur-3xl opacity-40"></div>
             <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#cfbfa0] rounded-full mix-blend-multiply filter blur-3xl opacity-40"></div>
             <svg className="absolute inset-0 w-full h-full pointer-events-none select-none" viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice">
                <path d="M-50,720 C180,675 300,810 480,630 S720,540 960,450 S1200,180 1440,90" fill="none" stroke="#81d4fa" strokeWidth="20" opacity="0.5" strokeLinecap="round"/>
                <path d="M120,765 L420,720 L240,585 L600,540 L900,495 L720,360 L360,315 L180,180 L540,135 L960,90" fill="none" stroke="#b71c1c" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"/>
                <path d="M120,765 L420,720 L240,585 L600,540 L900,495 L720,360 L360,315 L180,180 L540,135 L960,90" fill="none" stroke="#ff5252" strokeWidth="4" strokeDasharray="10,10" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'dash 2s linear infinite' }} className="drop-shadow-sm"/>
                <MountainIcon x={540} y={150} scale={2} /> <MountainIcon x={900} y={550} scale={2.5} /> <MountainIcon x={180} y={200} scale={2} /> <MountainIcon x={720} y={400} scale={2.2} />
                <TreeIcon x={120} y={720} scale={1.5} /> <TreeIcon x={240} y={540} scale={1.25} /> <TreeIcon x={600} y={450} scale={1.5} /> <TreeIcon x={960} y={180} scale={1.75} />
             </svg>
             <div className="absolute bottom-4 right-4 w-24 h-24 md:w-32 md:h-32 opacity-80 pointer-events-none"><Compass className="w-full h-full drop-shadow-lg" /></div>
             <div className="absolute inset-0 w-full h-full">
              {HISTORY_GAME_DATA.map((level, index) => {
                let status: 'locked' | 'active' | 'completed' = 'locked';
                if (completedLevels.includes(level.id)) status = 'completed';
                else if (level.id === unlockedLevel) status = 'active';
                return <LevelNode key={level.id} level={level} status={status} position={nodePositions[index]} onClick={handleLevelClick} />;
              })}
             </div>
         </div>
      </main>
      <footer className="w-full text-center py-4 bg-[#3e2723] text-[#d7ccc8] text-sm shrink-0 border-t border-[#ffb300]/30"><p>© 2025 - Trạm Lịch Sử 4.0</p></footer>
      {activeLevel && <GameScreen level={activeLevel} onClose={() => setActiveLevel(null)} onComplete={handleLevelComplete}/>}
      
      <ConfirmationModal 
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        onConfirm={onBack}
        title="Rời khỏi chiến dịch?"
        message="Tiến trình chơi hiện tại sẽ bị mất nếu bạn thoát ngay bây giờ."
        confirmLabel="Rút quân"
        cancelLabel="Ở lại"
      />
    </div>
  );
};
