
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Lock, Check, Star, X, RotateCcw, Award, ChevronRight, Flag, Target, MapPin, Zap } from 'lucide-react';
import { RESISTANCE_WAR_DATA } from '../data/gameData';

const LevelNode = ({ level, status, onClick, position }: any) => {
  const isLocked = status === 'locked';
  const isActive = status === 'active';
  const isCompleted = status === 'completed';

  return (
    <div 
      className="absolute flex flex-col items-center cursor-pointer transition-all duration-300 z-10 group"
      style={{ left: position.x, top: position.y, transform: 'translate(-50%, -50%)' }}
      onClick={() => !isLocked && onClick(level)}
    >
      <div className={`
        relative flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full border-4 shadow-xl transform transition-transform group-hover:scale-110
        ${isLocked ? 'bg-stone-500 border-stone-700 opacity-90' : ''}
        ${isActive ? 'bg-[#b71c1c] border-[#ffeb3b] animate-pulse shadow-[#ef5350]/50' : ''}
        ${isCompleted ? 'bg-[#1b5e20] border-[#a5d6a7]' : ''}
      `}>
        {isLocked && <Lock className="w-6 h-6 text-stone-300" />}
        {isActive && (
          <div className="relative">
             <Star className="w-8 h-8 text-[#ffeb3b] fill-current animate-spin-slow" />
             <div className="absolute inset-0 bg-[#ffeb3b] rounded-full opacity-30 animate-ping"></div>
          </div>
        )}
        {isCompleted && <Flag className="w-8 h-8 text-[#a5d6a7] fill-current" />}
        <div className={`
          absolute -top-3 -right-3 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs border-2 shadow-sm
          ${isActive ? 'bg-[#ffeb3b] text-[#b71c1c] border-[#b71c1c] scale-110' : 'bg-white text-stone-600 border-stone-400'}
        `}>
          {level.id}
        </div>
      </div>
      <div className={`
        mt-3 px-3 py-1.5 text-center font-bold text-[10px] md:text-xs shadow-lg min-w-[120px] max-w-[160px]
        transform transition-all duration-300 group-hover:-translate-y-1
        ${isLocked 
          ? 'bg-stone-300 text-stone-600 rounded' 
          : 'bg-[#e8f5e9] border-2 border-[#1b5e20] text-[#1b5e20] rounded-sm relative after:content-[""] after:absolute after:top-0 after:left-0 after:w-full after:h-full after:border after:border-[#1b5e20] after:translate-x-0.5 after:translate-y-0.5'}
      `}>
        {level.title}
        {isCompleted && (
           <div className="flex justify-center mt-0.5 gap-0.5">
             {[...Array(3)].map((_, i) => (
               <Star key={i} className="w-2.5 h-2.5 text-[#fbc02d] fill-current" />
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
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[6000] p-4 animate-in fade-in zoom-in duration-300">
        <div className="bg-[#2e7d32] rounded-xl p-8 max-w-md w-full border-4 border-[#fbc02d] shadow-[0_0_30px_rgba(251,192,45,0.3)] text-center relative overflow-hidden text-white">
           <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-black to-transparent"></div>
           {isPassed ? (
             <div className="relative z-10 mb-6">
               <div className="mx-auto w-24 h-24 bg-[#b71c1c] rounded-full flex items-center justify-center mb-4 border-4 border-[#ffeb3b] animate-bounce">
                  <Flag className="w-14 h-14 text-[#ffeb3b] fill-current" />
               </div>
               <h2 className="text-3xl font-black text-[#ffeb3b] mb-2 uppercase drop-shadow-md">Chiến thắng!</h2>
               <p className="text-green-50 font-medium">Nhiệm vụ hoàn thành xuất sắc, đồng chí!</p>
             </div>
           ) : (
             <div className="relative z-10 mb-6">
               <div className="mx-auto w-24 h-24 bg-stone-600 rounded-full flex items-center justify-center mb-4 border-4 border-stone-400">
                  <RotateCcw className="w-12 h-12 text-white" />
               </div>
               <h2 className="text-3xl font-bold text-stone-300 mb-2 uppercase">Thất bại!</h2>
               <p className="text-stone-300">Cần củng cố lực lượng và thử lại (Cần 6 điểm).</p>
             </div>
           )}
           <div className="relative z-10 text-6xl font-black text-white mb-8 font-mono tracking-tighter drop-shadow-md">
             {score}/10
           </div>
           <div className="relative z-10 flex gap-4 justify-center">
             <button onClick={onClose} className="px-6 py-3 rounded bg-stone-700 text-white font-bold hover:bg-stone-600 transition-colors border-b-4 border-stone-900 active:border-b-0 active:translate-y-1 shadow-lg">Về Căn Cứ</button>
             {isPassed ? (
                <button onClick={() => onComplete(score)} className="px-6 py-3 rounded bg-[#d32f2f] text-[#ffeb3b] font-bold hover:bg-[#c62828] transition-colors shadow-lg animate-pulse border-b-4 border-[#8e0000] active:border-b-0 active:translate-y-1">Tiến Quân</button>
             ) : (
               <button onClick={() => { setGameFinished(false); setCurrentQIndex(0); setScore(0); setSelectedOption(null); setShowExplanation(false); }} className="px-6 py-3 rounded bg-[#f9a825] text-white font-bold hover:bg-[#f57f17] transition-colors shadow-lg border-b-4 border-[#e65100] active:border-b-0 active:translate-y-1">Tái Chiến</button>
             )}
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-stone-900/95 flex items-center justify-center z-[6000] p-2 md:p-4 font-sans">
      <div className="bg-[#f1f8e9] rounded-lg w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden shadow-2xl border-4 border-[#33691e]">
        <div className="bg-[#33691e] p-4 flex justify-between items-center shadow-md relative overflow-hidden shrink-0">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          <div className="relative z-10">
            <h3 className="text-[#ffeb3b] font-black text-lg md:text-2xl uppercase flex items-center gap-2 tracking-wide drop-shadow-sm"><MapPin className="w-6 h-6" />{level.title}</h3>
            <div className="text-green-200 text-xs md:text-sm font-mono flex items-center gap-1 mt-1"><Zap className="w-3 h-3" /> THỜI GIAN: {level.era}</div>
          </div>
          <div className="relative z-10 flex items-center gap-4">
             <div className="bg-black/40 px-4 py-1.5 rounded font-bold text-[#ffeb3b] border border-[#ffeb3b]/50 font-mono text-lg shadow-inner">ĐIỂM: {score}</div>
             <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6 text-white" /></button>
          </div>
        </div>
        <div className="w-full bg-stone-300 h-3 border-b border-stone-400 shrink-0">
          <div className="bg-[#d32f2f] h-full transition-all duration-500 relative" style={{ width: `${((currentQIndex + 1) / level.questions.length) * 100}%` }}><div className="absolute right-0 top-0 h-full w-1 bg-[#b71c1c]"></div></div>
        </div>
        <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-[#e8f5e9] flex flex-col items-center relative">
           <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/concrete-wall.png')]"></div>
           <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none"><Star className="w-96 h-96 text-green-900" /></div>
          <div className="w-full max-w-3xl mb-6 z-10">
            <span className="inline-block bg-[#2e7d32] text-white px-3 py-1 rounded text-xs font-bold mb-3 uppercase tracking-wider shadow-sm">Mục tiêu {currentQIndex + 1}/5</span>
            <h2 className="text-xl md:text-2xl font-bold text-[#1b5e20] leading-relaxed drop-shadow-sm font-serif">{currentQ.q}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl z-10">
            {currentQ.options.map((opt: string, idx: number) => {
              let btnClass = "bg-white hover:bg-green-50 border-2 border-[#a5d6a7] text-[#33691e] shadow-sm";
              if (showExplanation) {
                if (idx === currentQ.correct) btnClass = "bg-[#c8e6c9] border-[#2e7d32] text-[#1b5e20] font-bold shadow-md transform scale-105 ring-2 ring-[#4caf50]";
                else if (idx === selectedOption) btnClass = "bg-[#ffcdd2] border-[#e57373] text-[#b71c1c] opacity-80";
                else btnClass = "opacity-40 bg-gray-100 border-gray-200";
              } else if (selectedOption === idx) btnClass = "bg-[#fff9c4] border-[#fbc02d] text-[#f57f17] font-semibold ring-2 ring-[#ffeb3b]";
              return (
                <button key={idx} onClick={() => handleAnswer(idx)} disabled={showExplanation} className={`p-5 rounded-lg text-left transition-all duration-200 relative overflow-hidden ${btnClass}`}><span className="font-bold mr-2 text-lg inline-block w-6">{String.fromCharCode(65 + idx)}.</span> {opt}</button>
              );
            })}
          </div>
          {showExplanation && (
            <div className="mt-6 w-full max-w-3xl animate-in slide-in-from-bottom-4 duration-300 z-10">
              <div className={`p-5 rounded-lg border-l-8 shadow-md ${isCorrect ? 'bg-[#dcedc8] border-[#558b2f]' : 'bg-[#ffcdd2] border-[#c62828]'}`}>
                <div className="font-bold mb-2 flex items-center gap-2 text-lg">{isCorrect ? <Check className="w-6 h-6 text-[#33691e]"/> : <X className="w-6 h-6 text-[#b71c1c]"/>}<span className={isCorrect ? "text-[#33691e]" : "text-[#b71c1c]"}>{isCorrect ? "Chính xác! Tiếp tục tiến công!" : "Chưa chính xác!"}</span></div>
                <p className="text-stone-800 leading-relaxed italic font-medium">"{currentQ.explain}"</p>
              </div>
              <div className="mt-6 flex justify-end"><button onClick={nextQuestion} className="bg-[#b71c1c] text-white px-8 py-3 rounded font-bold shadow-lg hover:bg-[#8e0000] transition-all flex items-center gap-2 border-b-4 border-[#5a0000] active:border-b-0 active:translate-y-1">{currentQIndex === 4 ? "Tổng kết chiến dịch" : "Nhiệm vụ tiếp theo"} <ChevronRight className="w-5 h-5"/></button></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PalmTree = ({ x, y, scale = 1 }: {x: number, y: number, scale?: number}) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <path d="M0,0 Q5,-20 0,-40" stroke="#5d4037" strokeWidth="3" fill="none" />
    <path d="M0,-40 Q-10,-50 -20,-35" stroke="#2e7d32" strokeWidth="2" fill="none" />
    <path d="M0,-40 Q-10,-45 -15,-45" stroke="#2e7d32" strokeWidth="2" fill="none" />
    <path d="M0,-40 Q10,-50 20,-35" stroke="#2e7d32" strokeWidth="2" fill="none" />
    <path d="M0,-40 Q10,-45 15,-45" stroke="#2e7d32" strokeWidth="2" fill="none" />
    <path d="M0,-40 Q0,-55 0,-50" stroke="#2e7d32" strokeWidth="2" fill="none" />
  </g>
);

const TankIcon = ({ x, y, scale = 1 }: {x: number, y: number, scale?: number}) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <rect x="-15" y="-5" width="30" height="10" rx="2" fill="#3e2723" />
    <path d="M-10,-5 L-5,-15 L5,-15 L10,-5 Z" fill="#2e7d32" />
    <rect x="-12" y="5" width="24" height="4" fill="#1b1b1b" />
    <circle cx="-10" cy="7" r="2" fill="#555" />
    <circle cx="-3" cy="7" r="2" fill="#555" />
    <circle cx="4" cy="7" r="2" fill="#555" />
    <circle cx="11" cy="7" r="2" fill="#555" />
    <line x1="5" y1="-10" x2="20" y2="-10" stroke="#2e7d32" strokeWidth="3" />
  </g>
);

const HelicopterIcon = ({ x, y, scale = 1 }: {x: number, y: number, scale?: number}) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <ellipse cx="0" cy="0" rx="15" ry="8" fill="#455a64" />
    <path d="M-15,0 L-25,0" stroke="#455a64" strokeWidth="2" />
    <path d="M0,0 L15,-5" stroke="#455a64" strokeWidth="2" />
    <line x1="-15" y1="-10" x2="15" y2="-10" stroke="#263238" strokeWidth="1" />
    <line x1="0" y1="-10" x2="0" y2="-8" stroke="#263238" strokeWidth="2" />
    <path d="M-5,8 L-5,12 L5,12 L5,8" fill="none" stroke="#263238" strokeWidth="1" />
  </g>
);

const MountainRange = ({ x, y, scale = 1 }: {x: number, y: number, scale?: number}) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
     <path d="M0,0 L10,-15 L20,0 Z" fill="#795548" opacity="0.8"/>
     <path d="M15,0 L25,-20 L35,0 Z" fill="#5d4037" opacity="0.9"/>
     <path d="M-5,0 L5,-10 L15,0 Z" fill="#8d6e63" opacity="0.7"/>
  </g>
);

import ConfirmationModal from './ConfirmationModal';

export const AmericanResistanceWarGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [activeLevel, setActiveLevel] = useState<any | null>(null);
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const nodePositions = [
    { x: 240, y: 765 }, { x: 420, y: 675 }, { x: 660, y: 585 }, { x: 420, y: 450 }, { x: 660, y: 360 },
    { x: 900, y: 135 }, { x: 600, y: 225 }, { x: 300, y: 315 }, { x: 180, y: 495 }, { x: 600, y: 810 },
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
    <div className="fixed inset-0 z-[5000] bg-[#3e2723] font-sans text-stone-800 flex flex-col items-center">
      <style>{`
        @keyframes dash { to { stroke-dashoffset: -4; } }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
      <header className="relative z-20 text-center pt-8 pb-6 w-full bg-[#1b5e20] shadow-2xl border-b-4 border-[#fbc02d] shrink-0">
        <button onClick={() => setShowExitConfirm(true)} className="absolute top-1/2 left-4 md:left-8 -translate-y-1/2 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors text-white z-50" title="Quay lại"><ArrowLeft size={24} /></button>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-30"></div>
        <h1 className="relative text-2xl md:text-4xl font-black text-[#ffeb3b] tracking-widest uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] font-serif">Hành Trình Thống Nhất</h1>
        <div className="flex items-center justify-center gap-4 mt-2">
           <Star className="w-5 h-5 text-[#ffeb3b] fill-current" />
           <p className="relative text-[#c8e6c9] text-sm md:text-base uppercase tracking-widest font-bold">1954 - 1975</p>
           <Star className="w-5 h-5 text-[#ffeb3b] fill-current" />
        </div>
      </header>
      <main ref={mainRef} className="flex-1 w-full overflow-auto bg-[#3e2723] cursor-grab active:cursor-grabbing flex items-start">
         <div className="relative shrink-0 mx-auto" style={{ width: 1200, height: 900 }}>
             <div className="absolute inset-0 bg-[#a1887f]"></div>
             <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]"></div>
             <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#3e2723 1px, transparent 1px), linear-gradient(90deg, #3e2723 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
             <div className="absolute top-0 left-0 w-full h-full pointer-events-none mix-blend-multiply opacity-50">
                 <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#33691e] rounded-full filter blur-[60px]"></div>
                 <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#1b5e20] rounded-full filter blur-[50px]"></div>
                 <div className="absolute top-10 right-10 w-64 h-64 bg-[#558b2f] rounded-full filter blur-[40px]"></div>
             </div>
             <svg className="absolute inset-0 w-full h-full pointer-events-none select-none" viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice">
                <line x1="0" y1="360" x2="1200" y2="360" stroke="#5d4037" strokeWidth="3" strokeDasharray="10,10" opacity="0.6" />
                <text x="20" y="350" fill="#3e2723" fontSize="24" fontStyle="italic" fontWeight="bold" opacity="0.7">Vĩ tuyến 17</text>
                <path d="M240,765 L420,675 L660,585 L420,450 L660,360 L900,135 L600,225 L300,315 L180,495 L600,810" fill="none" stroke="#d84315" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm"/>
                <path d="M240,765 L420,675 L660,585 L420,450 L660,360 L900,135 L600,225 L300,315 L180,495 L600,810" fill="none" stroke="#ffcc80" strokeWidth="5" strokeDasharray="10,10" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'dash 2s linear infinite' }}/>
                 <MountainRange x={120} y={300} scale={2} /> <MountainRange x={180} y={360} scale={2.5} /> <MountainRange x={60} y={420} scale={1.8} />
                 <PalmTree x={1020} y={810} scale={1.5} /> <PalmTree x={1080} y={780} scale={1.75} /> <PalmTree x={120} y={720} scale={1.5} />
                 <TankIcon x={720} y={780} scale={1.8} /> <HelicopterIcon x={960} y={300} scale={1.8} />
             </svg>
             <div className="absolute inset-0 w-full h-full">
              {RESISTANCE_WAR_DATA.map((level, index) => {
                let status: 'locked' | 'active' | 'completed' = 'locked';
                if (completedLevels.includes(level.id)) status = 'completed';
                else if (level.id === unlockedLevel) status = 'active';
                return <LevelNode key={level.id} level={level} status={status} position={nodePositions[index]} onClick={handleLevelClick} />;
              })}
             </div>
         </div>
      </main>
      <footer className="w-full text-center py-4 bg-[#2e2e2e] text-[#9e9e9e] text-sm shrink-0 border-t border-[#424242]"><p>© 2025 Lịch Sử All-In-One</p></footer>
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
