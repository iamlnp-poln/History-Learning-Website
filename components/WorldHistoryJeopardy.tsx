
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Trophy, X, RotateCcw, BookOpen, Star, Circle, CheckCircle2, XCircle, Globe2, ArrowLeft } from 'lucide-react';
import { JEOPARDY_DATA } from '../data/gameData';
import ConfirmationModal from './ConfirmationModal';

// Helper to shuffle array
const shuffleArray = (array: any[]) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export default function WorldHistoryJeopardy({ onBack }: { onBack: () => void }) {
  const mainRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [completedQuestions, setCompletedQuestions] = useState<Set<string>>(new Set());
  const [currentQuestion, setCurrentQuestion] = useState<{catIndex: number, qIndex: number} | null>(null);
  const [gameFinished, setGameFinished] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  
  // New states for multiple choice
  const [options, setOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  // Group answers by Field to make distractors harder (Smart Grouping)
  // Pool 0: Leaders/Commanders/Politicians (Indices 0, 1, 5) -> "Chính trị & Quân sự"
  // Pool 1: Thinkers/Scientists/Artists (Indices 2, 3, 4) -> "Văn hóa & Tri thức"
  const answerPools = useMemo(() => {
    const pools: string[][] = [[], []]; // Just 2 main pools
    JEOPARDY_DATA.forEach((cat, index) => {
      let poolIndex = 0;
      if ([0, 1, 5].includes(index)) {
        poolIndex = 0; // Leaders Group
      } else {
        poolIndex = 1; // Intellects Group
      }
      cat.questions.forEach(q => pools[poolIndex].push(q.answer));
    });
    return pools;
  }, []);

  // Check if game is finished
  useEffect(() => {
    const totalQuestions = JEOPARDY_DATA.reduce((acc, cat) => acc + cat.questions.length, 0);
    if (completedQuestions.size === totalQuestions && totalQuestions > 0) {
      setGameFinished(true);
    }
  }, [completedQuestions]);

  // Auto scroll to top when game starts, finishes, or resets
  useEffect(() => {
    if (mainRef.current) {
        mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [gameFinished]);

  const handleCardClick = (catIndex: number, qIndex: number) => {
    const id = `${catIndex}-${qIndex}`;
    if (!completedQuestions.has(id)) {
      // Prepare Multiple Choice Options
      const correctAnswer = JEOPARDY_DATA[catIndex].questions[qIndex].answer;
      
      // Determine which pool to pick distractors from based on current Category
      let poolIndex = 0;
      if ([0, 1, 5].includes(catIndex)) {
        poolIndex = 0; // Pick from Leaders pool
      } else {
        poolIndex = 1; // Pick from Intellects pool
      }

      // Get distractors from the SAME FIELD POOL
      const relevantPool = answerPools[poolIndex];
      // Filter out the correct answer so it doesn't appear twice
      const potentialDistractors = relevantPool.filter(a => a !== correctAnswer);
      
      const shuffledDistractors = shuffleArray(potentialDistractors);
      const selectedDistractors = shuffledDistractors.slice(0, 3);
      
      // Combine and shuffle final options
      const finalOptions = shuffleArray([correctAnswer, ...selectedDistractors]);
      
      setOptions(finalOptions);
      setSelectedAnswer(null);
      setCurrentQuestion({ catIndex, qIndex });
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (selectedAnswer || !currentQuestion) return; 

    setSelectedAnswer(answer);
    const { catIndex, qIndex } = currentQuestion;
    const currentQData = JEOPARDY_DATA[catIndex].questions[qIndex];
    const isCorrect = answer === currentQData.answer;

    if (isCorrect) {
      setScore(prev => prev + currentQData.points);
    }

    const id = `${catIndex}-${qIndex}`;
    setCompletedQuestions(prev => new Set(prev).add(id));
  };

  const closeModal = () => {
    setCurrentQuestion(null);
    setSelectedAnswer(null);
  };

  const resetGame = () => {
    setScore(0);
    setCompletedQuestions(new Set());
    setGameFinished(false);
    setCurrentQuestion(null);
    setSelectedAnswer(null);
  };

  return (
    <div className="fixed inset-0 z-[5000] bg-slate-900 text-slate-100 font-sans selection:bg-cyan-500 selection:text-white flex flex-col">
      {/* Header */}
      <header className="bg-blue-900/90 backdrop-blur border-b-4 border-cyan-500 p-3 md:p-4 shadow-2xl shrink-0 relative z-20">
        <div className="max-w-7xl mx-auto flex flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <button 
                onClick={() => setShowExitConfirm(true)}
                className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors text-cyan-400 border border-cyan-500/30 flex-shrink-0"
                title="Thoát game"
            >
                <ArrowLeft size={20} />
            </button>
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-blue-600 border-2 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)] flex items-center justify-center shrink-0 relative overflow-hidden group hover:scale-105 transition-transform duration-300 hidden sm:flex">
              {/* Ocean Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-800"></div>
              {/* CSS Continents */}
              <div className="absolute top-2 left-2 w-4 h-6 bg-green-500 rounded-full opacity-80 blur-[1px]"></div>
              <div className="absolute bottom-2 right-3 w-6 h-5 bg-green-600 rounded-full opacity-80 blur-[1px]"></div>
              <div className="absolute top-1 right-1 w-3 h-3 bg-white/20 rounded-full blur-sm"></div> {/* Cloud/Atmosphere */}
              
              {/* Globe Icon Overlay for Detail */}
              <Globe2 className="w-6 h-6 md:w-9 md:h-9 text-cyan-200 relative z-10 drop-shadow-md opacity-90" strokeWidth={1.5} />
            </div>
            
            <h1 className="text-lg md:text-3xl font-bold uppercase tracking-wider text-cyan-400 drop-shadow-md whitespace-nowrap">
              Danh Nhân Thế Giới
            </h1>
          </div>
          
          <div className="flex items-center gap-3 md:gap-6">
            <div className="bg-slate-800 px-4 py-1.5 md:px-6 md:py-2 rounded-2xl border-2 border-cyan-600 shadow-inner flex items-center gap-2">
              <span className="text-slate-400 text-xs md:text-sm font-semibold uppercase hidden sm:inline">Điểm</span>
              <span className="text-xl md:text-2xl font-bold text-cyan-400 min-w-[3ch] text-right">{score}</span>
            </div>
            <button 
              onClick={resetGame}
              className="p-2 hover:bg-blue-800 rounded-full transition-colors text-cyan-200 hidden md:block"
              title="Chơi lại"
            >
              <RotateCcw className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Game Board */}
      <main ref={mainRef} className="flex-1 overflow-y-auto bg-slate-900/50 relative [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-950/50 [&::-webkit-scrollbar-thumb]:bg-slate-700/80 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-600">
        
        {gameFinished ? (
          <div className="flex flex-col items-center justify-center py-10 md:py-20 animate-fade-in bg-slate-800/50 rounded-3xl border border-cyan-500/30 p-6 md:p-10 mx-auto max-w-2xl mt-10 m-4">
            <Trophy className="w-24 h-24 md:w-32 md:h-32 text-cyan-400 mb-6 drop-shadow-[0_0_25px_rgba(34,211,238,0.6)] animate-pulse" />
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 text-center">Xuất Sắc!</h2>
            <p className="text-lg md:text-xl text-slate-300 mb-10 text-center">Bạn đã chinh phục kho tàng tri thức nhân loại.</p>
            <div className="flex flex-col items-center gap-2 mb-10">
               <span className="text-slate-400 text-base md:text-lg uppercase tracking-widest">Tổng điểm đạt được</span>
               <div className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-500 to-indigo-500 drop-shadow-sm">{score}</div>
            </div>
             <div className="flex gap-4">
                <button onClick={resetGame} className="px-6 py-3 md:px-10 md:py-4 bg-gradient-to-r from-blue-700 to-indigo-900 hover:from-blue-600 hover:to-indigo-800 text-white text-base md:text-lg font-bold rounded-2xl shadow-xl border-2 border-cyan-500/50 flex items-center gap-3">
                    <RotateCcw className="w-5 h-5" /> Chơi Lại
                </button>
                <button onClick={() => setShowExitConfirm(true)} className="px-6 py-3 md:px-10 md:py-4 bg-slate-700 hover:bg-slate-600 text-white text-base md:text-lg font-bold rounded-2xl shadow-xl border-2 border-slate-500/50">
                    Thoát
                </button>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center">
            {/* MOBILE & TABLET LAYOUT (Vertical List) */}
            <div className="lg:hidden w-full px-4 py-6 space-y-6 pb-20">
                {JEOPARDY_DATA.map((cat, catIndex) => (
                    <div key={catIndex} className="bg-slate-800/50 rounded-2xl border border-indigo-700/30 overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-3 border-b border-indigo-800 flex items-center gap-2">
                            <BookOpen size={18} className="text-cyan-400" />
                            <h3 className="font-bold text-cyan-100 uppercase text-sm tracking-wide">{cat.category}</h3>
                        </div>
                        <div className="p-3 grid grid-cols-5 gap-2">
                            {cat.questions.map((q, qIndex) => {
                                const id = `${catIndex}-${qIndex}`;
                                const isCompleted = completedQuestions.has(id);
                                return (
                                    <button
                                        key={qIndex}
                                        disabled={isCompleted}
                                        onClick={() => handleCardClick(catIndex, qIndex)}
                                        className={`
                                            aspect-square rounded-xl flex items-center justify-center text-sm font-bold shadow-sm transition-all
                                            ${isCompleted 
                                                ? 'bg-slate-900/50 text-slate-600 border border-slate-800' 
                                                : 'bg-indigo-800 text-cyan-400 border border-indigo-600 hover:bg-indigo-700 active:scale-95'}
                                        `}
                                    >
                                        {isCompleted ? <CheckCircle2 size={16} /> : q.points}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* DESKTOP LAYOUT (Grid Table) */}
            <div className="hidden lg:block p-8" style={{ minWidth: '1024px' }}>
                <div className="grid grid-cols-6 gap-3 mb-4">
                {JEOPARDY_DATA.map((cat, idx) => (
                    <div key={idx} className="bg-gradient-to-b from-indigo-900 to-slate-900 border-2 border-indigo-500/50 p-3 flex items-center justify-center text-center h-28 rounded-2xl shadow-lg relative overflow-hidden group">
                    <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <h3 className="font-bold text-sm md:text-base text-cyan-100 uppercase leading-tight z-10 drop-shadow-md">
                        {cat.category}
                    </h3>
                    </div>
                ))}
                </div>

                <div className="grid grid-cols-6 gap-3">
                {[0, 1, 2, 3, 4].map((qIndex) => (
                    <React.Fragment key={qIndex}>
                    {JEOPARDY_DATA.map((cat, catIndex) => {
                        const id = `${catIndex}-${qIndex}`;
                        const isCompleted = completedQuestions.has(id);
                        return (
                        <button
                            key={`${catIndex}-${qIndex}`}
                            disabled={isCompleted}
                            onClick={() => handleCardClick(catIndex, qIndex)}
                            className={`
                            h-24 md:h-28 rounded-2xl border-2 flex items-center justify-center text-3xl font-black shadow-md transition-all duration-300 transform
                            ${isCompleted 
                                ? 'bg-slate-800/80 border-slate-700 text-slate-600/50 cursor-default scale-95' 
                                : 'bg-indigo-800 border-indigo-600/50 text-cyan-400 hover:bg-indigo-700 hover:border-cyan-400 hover:-translate-y-1 hover:shadow-cyan-400/20 hover:shadow-xl hover:z-10 cursor-pointer'}
                            `}
                        >
                            {isCompleted ? <CheckCircle2 className="w-8 h-8 opacity-50" /> : cat.questions[qIndex].points}
                        </button>
                        );
                    })}
                    </React.Fragment>
                ))}
                </div>
            </div>
          </div>
        )}
      </main>

      {/* Question Modal */}
      {currentQuestion && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[5050] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 w-full max-w-4xl rounded-3xl border-2 border-cyan-600/50 shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-indigo-950/80 p-5 border-b border-white/10 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-cyan-500/20 p-2 rounded-full">
                  <Star className="w-5 h-5 text-cyan-400 fill-cyan-400" />
                </div>
                <span className="font-bold text-cyan-100 uppercase tracking-widest text-sm md:text-base">
                  {JEOPARDY_DATA[currentQuestion.catIndex].category} &bull; {JEOPARDY_DATA[currentQuestion.catIndex].questions[currentQuestion.qIndex].points} Điểm
                </span>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 md:p-10 flex flex-col items-center justify-center grow overflow-y-auto">
              <div className="mb-10 text-center max-w-2xl">
                <h3 className="text-slate-400 text-xs md:text-sm uppercase font-bold mb-4 tracking-[0.2em]">Sự kiện / Dữ kiện</h3>
                <p className="text-2xl md:text-4xl font-serif leading-snug text-white font-medium drop-shadow-md">
                  "{JEOPARDY_DATA[currentQuestion.catIndex].questions[currentQuestion.qIndex].clue}"
                </p>
              </div>

              {/* Multiple Choice Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {options.map((option, idx) => {
                  const correctAnswer = JEOPARDY_DATA[currentQuestion.catIndex].questions[currentQuestion.qIndex].answer;
                  
                  // Determine button state
                  let buttonStyle = "bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-200"; // Default
                  let icon = <Circle className="w-5 h-5 opacity-50" />;
                  
                  if (selectedAnswer) {
                    if (option === correctAnswer) {
                      buttonStyle = "bg-green-900/80 border-green-500 text-green-100 shadow-[0_0_15px_rgba(34,197,94,0.3)]"; // Correct Answer
                      icon = <CheckCircle2 className="w-6 h-6 text-green-400" />;
                    } else if (option === selectedAnswer) {
                      buttonStyle = "bg-red-900/80 border-red-500 text-red-100"; // Wrong selected
                      icon = <XCircle className="w-6 h-6 text-red-400" />;
                    } else {
                      buttonStyle = "bg-slate-800/50 border-slate-700/50 text-slate-500 opacity-50"; // Others dimmed
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={!!selectedAnswer}
                      onClick={() => handleAnswerSelect(option)}
                      className={`
                        relative p-4 md:p-6 rounded-2xl border-2 text-left transition-all duration-300 flex items-center gap-4 group
                        ${buttonStyle}
                        ${!selectedAnswer && 'hover:scale-[1.02] hover:border-cyan-400/50 hover:shadow-lg active:scale-95'}
                      `}
                    >
                      <div className="shrink-0">{icon}</div>
                      <span className="text-lg md:text-xl font-semibold">{option}</span>
                    </button>
                  );
                })}
              </div>
              
              {/* Continue Button */}
              {selectedAnswer && (
                 <div className="mt-8 animate-in slide-in-from-bottom-2 fade-in duration-300">
                   <button 
                     onClick={closeModal}
                     className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-cyan-500/50 transition-all transform hover:-translate-y-1 flex items-center gap-2"
                   >
                     Tiếp Tục <RotateCcw className="w-4 h-4" />
                   </button>
                 </div>
              )}
            </div>
            
            {/* Decoration */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none"></div>
          </div>
        </div>
      )}
      
      <ConfirmationModal 
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        onConfirm={onBack}
        title={gameFinished ? "Kết thúc trò chơi?" : "Thoát trò chơi?"}
        message={gameFinished ? "Bạn đã hoàn thành trò chơi. Bạn có muốn thoát về menu chính?" : "Điểm số hiện tại sẽ bị mất nếu bạn thoát ngay bây giờ."}
        confirmLabel="Thoát"
        cancelLabel="Ở lại"
      />
    </div>
  );
}
