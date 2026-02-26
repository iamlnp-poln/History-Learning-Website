
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Lock, Check, Star, X, RotateCcw, Award, ChevronRight, Globe, Radio, ShieldAlert, Rocket, Eye } from 'lucide-react';
import { COLD_WAR_DATA } from '../../data/data';

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
        relative flex items-center justify-center w-10 h-10 md:w-14 md:h-14 rounded-full border-2 shadow-[0_0_15px_rgba(0,0,0,0.5)] transform transition-transform group-hover:scale-110
        ${isLocked ? 'bg-slate-700 border-slate-500 opacity-60' : ''}
        ${isActive ? 'bg-red-600 border-red-400 animate-pulse shadow-[0_0_20px_#f44336]' : ''}
        ${isCompleted ? 'bg-blue-600 border-cyan-400 shadow-[0_0_20px_#2196f3]' : ''}
      `}>
        {isLocked && <Lock className="w-4 h-4 text-slate-400" />}
        {isActive && (
          <div className="relative">
             <Radio className="w-6 h-6 text-white animate-spin-slow" />
             <div className="absolute inset-0 border-2 border-red-500 rounded-full opacity-0 animate-ping"></div>
          </div>
        )}
        {isCompleted && <Check className="w-6 h-6 text-white" />}
        <div className="absolute -top-3 -right-3 w-6 h-6 bg-slate-900 border border-slate-500 text-slate-200 text-xs font-mono font-bold flex items-center justify-center rounded-sm">
           {level.id < 10 ? `0${level.id}` : level.id}
        </div>
      </div>
      <div className={`
        mt-3 px-3 py-1 text-center font-mono text-[10px] md:text-xs uppercase tracking-wider
        transform transition-all duration-300 group-hover:-translate-y-1 backdrop-blur-sm
        ${isLocked 
          ? 'bg-slate-800/80 text-slate-500 border border-slate-600' 
          : isActive 
             ? 'bg-red-900/90 text-red-100 border border-red-500 shadow-[0_0_10px_#b71c1c]' 
             : 'bg-blue-900/90 text-blue-100 border border-blue-400 shadow-[0_0_10px_#0d47a1]'}
      `}>
        {level.title}
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
      <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[6000] p-4 font-mono">
        <div className="bg-slate-900 rounded-sm p-8 max-w-md w-full border-2 border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.2)] text-center relative overflow-hidden text-green-500">
           <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 bg-[length:100%_2px,3px_100%] pointer-events-none"></div>
           {isPassed ? (
             <div className="relative z-10 mb-6">
               <div className="mx-auto w-20 h-20 border-4 border-green-500 rounded-full flex items-center justify-center mb-4 animate-pulse">
                  <Award className="w-10 h-10" />
               </div>
               <h2 className="text-2xl font-bold uppercase tracking-widest text-green-400">Mission Accomplished</h2>
               <p className="text-xs mt-2 text-green-600">Mã xác nhận: SUCCESS_007</p>
             </div>
           ) : (
             <div className="relative z-10 mb-6">
               <div className="mx-auto w-20 h-20 border-4 border-red-500 rounded-full flex items-center justify-center mb-4">
                  <ShieldAlert className="w-10 h-10 text-red-500" />
               </div>
               <h2 className="text-2xl font-bold uppercase tracking-widest text-red-500">Mission Failed</h2>
               <p className="text-xs mt-2 text-red-700">Yêu cầu: Đạt 6 điểm để giải mã</p>
             </div>
           )}
           <div className={`relative z-10 text-6xl font-black mb-8 ${isPassed ? 'text-green-500' : 'text-red-500'}`}>
             {score}/10
           </div>
           <div className="relative z-10 flex gap-4 justify-center">
             <button onClick={onClose} className="px-6 py-2 border border-slate-600 text-slate-400 hover:bg-slate-800 transition-colors uppercase text-sm">Thoát</button>
             {isPassed ? (
                <button onClick={() => onComplete(score)} className="px-6 py-2 bg-green-900 border border-green-500 text-green-300 hover:bg-green-800 transition-colors uppercase text-sm animate-pulse">Tiếp nhận nhiệm vụ mới</button>
             ) : (
               <button onClick={() => { setGameFinished(false); setCurrentQIndex(0); setScore(0); setSelectedOption(null); setShowExplanation(false); }} className="px-6 py-2 bg-red-900 border border-red-500 text-red-300 hover:bg-red-800 transition-colors uppercase text-sm">Thử lại</button>
             )}
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[6000] p-2 md:p-4 font-mono">
      <div className="bg-slate-900 w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-700 relative">
        <div className="absolute inset-0 pointer-events-none z-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,6px_100%]"></div>
        <div className="bg-slate-950 p-4 border-b border-slate-700 flex justify-between items-center z-10 shrink-0">
          <div>
            <h3 className="text-cyan-400 font-bold text-lg md:text-xl uppercase flex items-center gap-2 tracking-widest"><Eye className="w-5 h-5 animate-pulse" />TOP SECRET: {level.title}</h3>
            <div className="text-slate-500 text-xs mt-1">TIME CODE: {level.era}</div>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-cyan-500 text-sm">SCORE: <span className="text-white font-bold">{score}</span></div>
             <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
          </div>
        </div>
        <div className="w-full bg-slate-800 h-1 z-10 shrink-0">
          <div className="bg-cyan-500 h-full transition-all duration-300 shadow-[0_0_10px_#06b6d4]" style={{ width: `${((currentQIndex + 1) / level.questions.length) * 100}%` }}></div>
        </div>
        <div className="flex-1 p-6 md:p-10 overflow-y-auto bg-slate-900 flex flex-col items-center relative z-10">
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none"><Globe className="w-96 h-96 text-cyan-500" /></div>
          <div className="w-full max-w-3xl mb-8">
            <span className="inline-block text-cyan-600 text-xs font-bold mb-2 uppercase tracking-widest border border-cyan-800 px-2 py-1">DATA PACKET {currentQIndex + 1}/5</span>
            <h2 className="text-xl md:text-2xl font-bold text-slate-100 leading-relaxed typewriter-text">{currentQ.q}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
            {currentQ.options.map((opt: string, idx: number) => {
              let btnClass = "bg-slate-800 border border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500";
              if (showExplanation) {
                if (idx === currentQ.correct) btnClass = "bg-green-900/50 border-green-500 text-green-400";
                else if (idx === selectedOption) btnClass = "bg-red-900/50 border-red-500 text-red-400 opacity-70";
                else btnClass = "opacity-30 border-slate-800";
              } else if (selectedOption === idx) btnClass = "bg-cyan-900/50 border-cyan-500 text-cyan-300";
              return (
                <button key={idx} onClick={() => handleAnswer(idx)} disabled={showExplanation} className={`p-5 text-left transition-all duration-200 text-sm md:text-base group relative ${btnClass}`}><div className="flex items-start gap-3"><span className="font-bold opacity-50 group-hover:opacity-100">[{String.fromCharCode(65 + idx)}]</span>{opt}</div><div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-current opacity-50"></div></button>
              );
            })}
          </div>
          {showExplanation && (
            <div className="mt-8 w-full max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className={`p-4 border-l-2 ${isCorrect ? 'border-green-500 bg-green-900/20' : 'border-red-500 bg-red-900/20'}`}>
                <div className="font-bold mb-2 flex items-center gap-2 uppercase text-sm tracking-wider">{isCorrect ? <Check className="w-4 h-4 text-green-500"/> : <X className="w-4 h-4 text-red-500"/>}<span className={isCorrect ? "text-green-500" : "text-red-500"}>{isCorrect ? "Intel Verified" : "Intel Corrupted"}</span></div>
                <p className="text-slate-300 text-sm leading-relaxed"><span className="text-slate-500 mr-2">{'>'}</span>{currentQ.explain}</p>
              </div>
              <div className="mt-6 flex justify-end"><button onClick={nextQuestion} className="bg-cyan-700 text-white px-8 py-2 hover:bg-cyan-600 transition-all flex items-center gap-2 uppercase text-sm font-bold tracking-wider">{currentQIndex === 4 ? "Upload Report" : "Next Data"} <ChevronRight className="w-4 h-4"/></button></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const WorldMapSVG = () => (
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 100 100">
        <path d="M10,20 Q20,10 30,25 T40,20 T30,40 T15,50 T5,30 Z" fill="#1e293b" />
        <path d="M20,55 Q30,50 35,65 T30,85 T15,75 Z" fill="#1e293b" />
        <path d="M45,20 Q55,10 65,15 T70,30 T60,45 T50,40 Z" fill="#1e293b" />
        <path d="M45,50 Q55,45 65,55 T60,75 T45,70 Z" fill="#1e293b" />
        <path d="M65,20 Q80,15 90,25 T95,45 T80,50 T70,35 Z" fill="#1e293b" />
        <path d="M80,60 Q90,55 95,65 T85,75 Z" fill="#1e293b" />
        <line x1="0" y1="20" x2="100" y2="20" stroke="#334155" strokeWidth="0.1" />
        <line x1="0" y1="40" x2="100" y2="40" stroke="#334155" strokeWidth="0.1" />
        <line x1="0" y1="60" x2="100" y2="60" stroke="#334155" strokeWidth="0.1" />
        <line x1="0" y1="80" x2="100" y2="80" stroke="#334155" strokeWidth="0.1" />
        <line x1="20" y1="0" x2="20" y2="100" stroke="#334155" strokeWidth="0.1" />
        <line x1="40" y1="0" x2="40" y2="100" stroke="#334155" strokeWidth="0.1" />
        <line x1="60" y1="0" x2="60" y2="100" stroke="#334155" strokeWidth="0.1" />
        <line x1="80" y1="0" x2="80" y2="100" stroke="#334155" strokeWidth="0.1" />
    </svg>
);

export const ColdWarGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [activeLevel, setActiveLevel] = useState<any | null>(null);
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const nodePositions = [
    { x: 120, y: 450 }, { x: 240, y: 270 }, { x: 360, y: 540 }, { x: 480, y: 180 }, { x: 600, y: 720 },
    { x: 720, y: 360 }, { x: 840, y: 180 }, { x: 960, y: 630 }, { x: 1080, y: 360 }, { x: 1140, y: 450 },
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
    <div className="fixed inset-0 z-[5000] bg-slate-950 font-sans text-slate-200 flex flex-col items-center">
      <style>{`
        @keyframes radar-sweep { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes dash { to { stroke-dashoffset: -4; } }
      `}</style>
      <header className="relative z-20 text-center pt-8 pb-6 w-full bg-slate-900 border-b border-slate-700 shadow-xl shrink-0">
        <button onClick={onBack} className="absolute top-1/2 left-4 md:left-8 -translate-y-1/2 p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors text-cyan-400 border border-cyan-500/30" title="Quay lại"><ArrowLeft size={24} /></button>
        <div className="flex items-center justify-center gap-3">
            <Globe className="hidden sm:block w-8 h-8 text-blue-500 animate-pulse" />
            <h1 className="text-2xl md:text-4xl font-black text-slate-100 tracking-widest uppercase font-mono">HỒ SƠ LẠNH GIÁ</h1>
            <Globe className="hidden sm:block w-8 h-8 text-red-500 animate-pulse" />
        </div>
        <p className="text-cyan-500 mt-2 font-mono text-xs md:text-sm tracking-[0.2em] uppercase">Mật Mã: 1947 - 1991</p>
      </header>
      <main ref={mainRef} className="flex-1 w-full overflow-auto bg-slate-950 cursor-grab active:cursor-grabbing flex items-start">
        <div className="relative shrink-0 mx-auto" style={{ width: 1200, height: 900 }}>
             <WorldMapSVG />
             <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none"><div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(0,255,255,0.1)_60deg,transparent_60deg)] animate-[radar-sweep_10s_linear_infinite] rounded-full origin-center"></div></div>
             <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
             <svg className="absolute inset-0 w-full h-full pointer-events-none select-none" viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice">
                <path d="M120,450 L240,270 L360,540 L480,180 L600,720 L720,360 L840,180 L960,630 L1080,360 L1140,450" fill="none" stroke="#334155" strokeWidth="4" />
                <path d="M120,450 L240,270 L360,540 L480,180 L600,720 L720,360 L840,180 L960,630 L1080,360 L1140,450" fill="none" stroke="#0ea5e9" strokeWidth="4" strokeDasharray="20,20" className="opacity-60" style={{ animation: 'dash 4s linear infinite' }}/>
             </svg>
             <div className="absolute inset-0 w-full h-full">
              {COLD_WAR_DATA.map((level: any, index: number) => {
                let status: 'locked' | 'active' | 'completed' = 'locked';
                if (completedLevels.includes(level.id)) status = 'completed';
                else if (level.id === unlockedLevel) status = 'active';
                return <LevelNode key={level.id} level={level} status={status} position={nodePositions[index]} onClick={handleLevelClick} />;
              })}
             </div>
             <div className="absolute bottom-4 left-4 right-4 flex justify-between text-[10px] md:text-xs font-mono text-slate-500 uppercase"><div className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div><span>NATO Surveillance: Active</span></div><div className="flex items-center gap-2"><span>Warsaw Pact Activity: High</span><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div></div></div>
        </div>
      </main>
      <footer className="w-full text-center py-4 bg-slate-900 text-slate-600 text-xs font-mono border-t border-slate-800"><p>© 2025 - History All-In-One</p></footer>
      {activeLevel && <GameScreen level={activeLevel} onClose={() => setActiveLevel(null)} onComplete={handleLevelComplete}/>}
    </div>
  );
};
