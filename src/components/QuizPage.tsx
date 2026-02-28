
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Bot, Clock, AlertTriangle, Send, X, CheckCircle, AlertCircle, BookOpen, MessageCircle, Map, BrainCircuit, GraduationCap, ArrowRight, LogOut, FileCheck, Loader2, Brain, Database, FileText, CheckSquare, Flag, Menu, ChevronDown, ChevronUp, User, Save, PlayCircle, Globe2 } from 'lucide-react';
import { generateQuizQuestions, checkQuizReport, explainQuizDeeply, askHistoryTutor, generateTHPTExam } from '../services/geminiService';
import { QuizState, ChatMessage, QuizMode, UserProfile } from '../types';
import { addDoc, collection, serverTimestamp, setDoc, doc, getDoc, deleteDoc } from '../firebaseConfig';
import { db } from '../firebaseConfig';
import SimpleMarkdown from './SimpleMarkdown';
import EditableImage from './EditableImage';
import { useToast } from '../contexts/ToastContext'; // Import Hook

// Default initial state helper to easily reset
const initialQuizState: QuizState = {
    screen: 'config',
    topic: '',
    count: 10,
    mode: 'mix',
    questions: [],
    currentIdx: 0,
    userAnswers: [],
    score: 0,
    timer: 0,
    isActive: false,
    isExamMode: false,
    examStatus: 'idle',
    markedQuestions: []
};

// Portal Component
const Portal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
};

// 3-Second Countdown Overlay
const CountDownOverlay: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [count, setCount] = useState(3);
    
    useEffect(() => {
        if (count > 0) {
            const timer = setTimeout(() => setCount(count - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            onComplete();
        }
    }, [count, onComplete]);

    if (count === 0) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center">
                <div className="text-white text-9xl font-black animate-[ping_1s_ease-in-out_infinite] font-mono">
                    {count}
                </div>
                <div className="absolute bottom-20 text-white text-xl font-medium">
                    Chuẩn bị bắt đầu...
                </div>
            </div>
        </Portal>
    );
};

// Exam Loading Modal
const ExamLoadingModal: React.FC = () => {
    const [step, setStep] = useState(0);
    const steps = [
        { text: "Đang kết nối đến AI API...", icon: <Brain size={32} className="text-blue-500" /> },
        { text: "Phân tích ma trận đề thi THPT...", icon: <FileText size={32} className="text-purple-500" /> },
        { text: "Truy xuất dữ liệu lịch sử...", icon: <Database size={32} className="text-yellow-500" /> },
        { text: "Biên soạn câu hỏi và đáp án...", icon: <CheckSquare size={32} className="text-green-500" /> },
        { text: "Hoàn tất kiểm tra...", icon: <CheckCircle size={32} className="text-red-500" /> }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
        }, 2000); 
        return () => clearInterval(interval);
    }, []);

    const currentStep = steps[step];

    return (
        <Portal>
            <div className="fixed inset-0 z-[120] bg-white/90 backdrop-blur-md flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full border border-gray-100 text-center animate-pop-in relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gray-100">
                        <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 animate-[loading_2s_ease-in-out_infinite]"></div>
                    </div>
                    <div className="mb-6 relative h-20 w-20 mx-auto flex items-center justify-center">
                        <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-history-red border-t-transparent rounded-full animate-spin"></div>
                        <div className="animate-pulse">{currentStep.icon}</div>
                    </div>
                    <h3 className="text-2xl font-bold text-history-dark mb-2 font-serif">Đang tạo đề thi</h3>
                    <p className="text-gray-500 min-h-[1.5rem] transition-all duration-500 animate-fade-in">
                        {currentStep.text}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                        (Vì AI tạo số lượng lớn câu hỏi nên vui lòng kiên nhẫn chờ đợi)
                    </p>
                    <div className="mt-8 flex justify-center gap-1">
                        {steps.map((_, idx) => (
                            <div key={idx} className={`h-1.5 rounded-full transition-all duration-500 ${idx <= step ? 'w-8 bg-history-gold' : 'w-2 bg-gray-200'}`} ></div>
                        ))}
                    </div>
                </div>
            </div>
        </Portal>
    );
};

interface QuizPageProps {
  quizState: QuizState;
  setQuizState: React.Dispatch<React.SetStateAction<QuizState>>;
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  user?: UserProfile | null;
}

// Removed Game ViewModes
type QuizViewMode = 'menu' | 'ai-quiz'; 

const QuizPage: React.FC<QuizPageProps> = ({ quizState, setQuizState, chatHistory, setChatHistory, user }) => {
  const { showToast } = useToast();
  const [viewMode, setViewMode] = useState<QuizViewMode>('menu');

  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingExam, setIsGeneratingExam] = useState(false); 
  const [errorMsg, setErrorMsg] = useState('');
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [tempMcqSel, setTempMcqSel] = useState<number | null>(null);
  const [tempTfSel, setTempTfSel] = useState<(boolean | null)[]>([]);

  const [showDeepExplain, setShowDeepExplain] = useState(false);
  const [deepExplainContent, setDeepExplainContent] = useState('');
  const [isDeepLoading, setIsDeepLoading] = useState(false);
  
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportText, setReportText] = useState('');
  const [reportResult, setReportResult] = useState('');
  const [isReportLoading, setIsReportLoading] = useState(false);

  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showStartExamConfirm, setShowStartExamConfirm] = useState(false);
  const [hasSavedSession, setHasSavedSession] = useState(false);

  // --- QUESTION COUNTING LOGIC ---
  const totalScorableItems = useMemo(() => {
    if (!quizState.questions || quizState.questions.length === 0) return 0;
    return quizState.questions.reduce((acc, q) => {
        return acc + (q.type === 'mcq' ? 1 : (q.subQuestions?.length || 4));
    }, 0);
  }, [quizState.questions]);

  const currentScorableItemStartNumber = useMemo(() => {
    if (!quizState.questions || quizState.questions.length === 0) return 1;
    return quizState.questions.slice(0, quizState.currentIdx).reduce((acc, q) => {
        return acc + (q.type === 'mcq' ? 1 : (q.subQuestions?.length || 4));
    }, 1);
  }, [quizState.questions, quizState.currentIdx]);

  const questionNumberDisplay = useMemo(() => {
    const currentQuestion = quizState.questions[quizState.currentIdx];
    if (!currentQuestion) return `Câu 1`;

    if (currentQuestion.type === 'mcq') {
        const mcqIndex = quizState.questions.slice(0, quizState.currentIdx).filter(q => q.type === 'mcq').length + 1;
        const totalMcq = quizState.questions.filter(q => q.type === 'mcq').length;
        return `Phần I: Câu ${mcqIndex}/${totalMcq}`;
    } else if (currentQuestion.type === 'tf_group') {
        const tfIndex = quizState.questions.slice(0, quizState.currentIdx).filter(q => q.type === 'tf_group').length + 1;
        const totalTf = quizState.questions.filter(q => q.type === 'tf_group').length;
        return `Phần II: Câu ${tfIndex}/${totalTf}`;
    }
    return `Câu ${quizState.currentIdx + 1}/${quizState.questions.length}`;
  }, [quizState.currentIdx, quizState.questions]);

  useEffect(() => {
      const checkSaved = async () => {
          if (user && db) {
              try {
                  const docSnap = await getDoc(doc(db, 'quizState', user.uid));
                  if (docSnap.exists()) {
                      setHasSavedSession(true);
                  }
              } catch (e) {
                  console.error("Error checking saved session", e);
              }
          }
      };
      checkSaved();
  }, [user]);

  useEffect(() => {
    setTempMcqSel(null);
    setTempTfSel([]);
    setShowDeepExplain(false);
    setDeepExplainContent('');
  }, [quizState.currentIdx]);

  useEffect(() => {
    if (showChat && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, showChat]);

  // Countdown Timer Logic
  useEffect(() => {
      let interval: NodeJS.Timeout;
      if (quizState.isActive && quizState.isExamMode) {
          interval = setInterval(() => {
              setQuizState(prev => {
                  if (prev.timer <= 0) {
                      clearInterval(interval);
                      return prev;
                  }
                  return { ...prev, timer: prev.timer - 1 };
              });
          }, 1000);
      }
      return () => {
          if (interval) clearInterval(interval);
      };
  }, [quizState.isActive, quizState.isExamMode]);

  useEffect(() => {
      if (quizState.isExamMode && quizState.isActive && quizState.timer === 0) {
          handleSubmitExam();
          showToast("Hết giờ làm bài! Hệ thống đã tự động nộp bài.", "info");
      }
  }, [quizState.timer, quizState.isExamMode, quizState.isActive]);

  const handleSaveAndExit = async () => {
      if (!user || !db) {
          showToast("Vui lòng đăng nhập để lưu tiến độ.", "error");
          return;
      }
      setIsLoading(true);
      try {
          await setDoc(doc(db, 'quizState', user.uid), {
              ...quizState,
              lastSaved: serverTimestamp()
          });
          setHasSavedSession(true);
          setQuizState(initialQuizState);
          setViewMode('menu');
          showToast("Đã lưu bài làm thành công!", "success");
      } catch (e: any) {
          showToast("Lỗi khi lưu bài: " + e.message, "error");
      } finally {
          setIsLoading(false);
      }
  };

  const handleResumeQuiz = async () => {
      if (!user || !db) return;
      setIsLoading(true);
      try {
          const docSnap = await getDoc(doc(db, 'quizState', user.uid));
          if (docSnap.exists()) {
              const savedData = docSnap.data() as QuizState;
              if (savedData.screen === 'result') {
                  showToast("Bài làm đã kết thúc. Vui lòng bắt đầu bài mới.", "info");
                  await deleteDoc(doc(db, 'quizState', user.uid));
                  setHasSavedSession(false);
              } else {
                  setQuizState(savedData);
                  setViewMode('ai-quiz');
              }
          } else {
              showToast("Không tìm thấy bài làm đã lưu.", "error");
              setHasSavedSession(false);
          }
      } catch (e: any) {
          showToast("Lỗi tải bài làm: " + e.message, "error");
      } finally {
          setIsLoading(false);
      }
  };

  const handleGenerateQuiz = async () => {
    if (!quizState.topic.trim()) {
      setErrorMsg('Vui lòng nhập chủ đề!');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);
    try {
      const data = await generateQuizQuestions(quizState.topic, quizState.count, quizState.mode);
      if (data && data.length > 0) {
        setQuizState(prev => ({
          ...prev,
          questions: data,
          userAnswers: new Array(data.length).fill(null),
          score: 0,
          timer: 0,
          currentIdx: 0,
          screen: 'playing',
          isActive: true,
          isExamMode: false,
          examStatus: 'idle',
          markedQuestions: []
        }));
      } else {
        setErrorMsg('Không thể tạo câu hỏi. Vui lòng thử lại.');
      }
    } catch (e) {
      setErrorMsg('Lỗi kết nối AI. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateTHPTExam = async () => {
      setErrorMsg('');
      setIsGeneratingExam(true); 
      try {
          const matrix = {
            "meta_info": { "subject": "Lịch sử", "exam_type": "Tốt nghiệp THPT" },
            "matrix_data": [
                { "grade": 11, "topic": "Chủ nghĩa xã hội từ năm 1917 đến nay", "part_1": { "know": 1, "comprehend": 1, "apply": 1 }, "part_2": { "know": 0, "comprehend": 0, "apply": 0 }, "total_questions": 3 },
                { "grade": 11, "topic": "Chiến tranh bảo vệ Tổ quốc và chiến tranh giải phóng dân tộc trong lịch sử Việt Nam (trước 1945)", "part_1": { "know": 1, "comprehend": 1, "apply": 1 }, "part_2": { "know": 0, "comprehend": 0, "apply": 0 }, "total_questions": 3 },
                { "grade": 12, "topic": "Thế giới trong và sau Chiến tranh lạnh", "part_1": { "know": 1, "comprehend": 1, "apply": 0 }, "part_2": { "know": 1, "comprehend": 1, "apply": 2 }, "total_questions": 3 },
                { "grade": 12, "topic": "ASEAN: Những chặng đường lịch sử", "part_1": { "know": 2, "comprehend": 1, "apply": 0 }, "part_2": { "know": 0, "comprehend": 0, "apply": 0 }, "total_questions": 3 },
                { "grade": 12, "topic": "Cách mạng tháng Tám 1945, và các cuộc chiến tranh (từ 1945 đến nay)", "part_1": { "know": 3, "comprehend": 1, "apply": 0 }, "part_2": { "know": 1, "comprehend": 1, "apply": 2 }, "total_questions": 5 },
                { "grade": 12, "topic": "Công cuộc Đổi mới ở Việt Nam từ năm 1986 đến nay", "part_1": { "know": 1, "comprehend": 1, "apply": 1 }, "part_2": { "know": 1, "comprehend": 1, "apply": 2 }, "total_questions": 4 },
                { "grade": 12, "topic": "Lịch sử đối ngoại Việt Nam thời cận - hiện đại", "part_1": { "know": 2, "comprehend": 1, "apply": 0 }, "part_2": { "know": 0, "comprehend": 0, "apply": 0 }, "total_questions": 3 },
                { "grade": 12, "topic": "Hồ Chí Minh trong Lịch sử Việt Nam", "part_1": { "know": 1, "comprehend": 1, "apply": 1 }, "part_2": { "know": 0, "comprehend": 0, "apply": 0 }, "total_questions": 3 },
                { "grade": 12, "topic": "Chuyên đề học tập", "part_1": { "know": 0, "comprehend": 0, "apply": 0 }, "part_2": { "know": 1, "comprehend": 1, "apply": 2 }, "total_questions": 1 }
            ],
            "summary": { "total_questions_overall": 28 }
          };
          
          const data = await generateTHPTExam(matrix);
          if (data && data.length > 0) {
              setQuizState(prev => ({
                  ...prev,
                  topic: 'Thi Thử THPT Quốc Gia (Mô phỏng)',
                  questions: data,
                  userAnswers: new Array(data.length).fill(null),
                  score: 0,
                  timer: 45 * 60, // 45 minutes
                  currentIdx: 0,
                  screen: 'playing',
                  isActive: false, // Wait for countdown
                  isExamMode: true,
                  examStatus: 'countdown',
                  mode: 'mix',
                  markedQuestions: []
              }));
              setViewMode('ai-quiz'); 
          } else {
              setErrorMsg('Không thể tạo đề thi. Vui lòng thử lại.');
          }
      } catch (e) {
          setErrorMsg('Lỗi kết nối AI khi tạo đề thi.');
      } finally {
          setIsGeneratingExam(false); 
      }
  };

  const startExamAfterCountdown = () => {
      setQuizState(prev => ({
          ...prev,
          isActive: true,
          examStatus: 'in_progress'
      }));
  };

  const handleConfirmExit = (save: boolean) => {
      setShowExitConfirm(false);
      if (save) {
          handleSaveAndExit();
      } else {
          setQuizState({ ...initialQuizState });
          setViewMode('menu');
      }
  };

  const handleMarkQuestion = () => {
      const current = quizState.currentIdx;
      setQuizState(prev => {
          const isMarked = prev.markedQuestions?.includes(current);
          const newMarked = isMarked 
             ? prev.markedQuestions.filter(i => i !== current)
             : [...(prev.markedQuestions || []), current];
          return { ...prev, markedQuestions: newMarked };
      });
  };

  const formatTime = (seconds: number) => {
    if (seconds < 0) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const updateQuizState = (updates: Partial<QuizState>) => {
    setQuizState(prev => ({ ...prev, ...updates }));
  };

  // --- SELECTION HANDLERS ---

  const handleSelectMCQ = (idx: number) => {
    if (quizState.examStatus === 'submitted') return; // BLOCK EDITING IF SUBMITTED
    if (!quizState.isExamMode && quizState.userAnswers[quizState.currentIdx]) return;
    
    setTempMcqSel(idx);

    if (quizState.isExamMode) {
        const newAnswers = [...quizState.userAnswers];
        newAnswers[quizState.currentIdx] = { 
            selection: idx, 
            isCorrect: false 
        };
        setQuizState(prev => ({ ...prev, userAnswers: newAnswers }));
    }
  };

  const handleSelectTF = (subIdx: number, val: boolean) => {
    if (quizState.examStatus === 'submitted') return; // BLOCK EDITING IF SUBMITTED
    if (!quizState.isExamMode && quizState.userAnswers[quizState.currentIdx]) return;
    
    const q = quizState.questions[quizState.currentIdx];
    let currentSel = tempTfSel;
    if (quizState.isExamMode && quizState.userAnswers[quizState.currentIdx]) {
        currentSel = (quizState.userAnswers[quizState.currentIdx]?.selection as boolean[]) || [];
    }

    const newSel = currentSel.length ? [...currentSel] : new Array(q.subQuestions?.length || 4).fill(null);
    newSel[subIdx] = val;
    setTempTfSel(newSel);

    if (quizState.isExamMode) {
        const newAnswers = [...quizState.userAnswers];
        newAnswers[quizState.currentIdx] = { 
            selection: newSel, 
            isCorrect: false 
        };
        setQuizState(prev => ({ ...prev, userAnswers: newAnswers }));
    }
  };

  // --- SUBMISSION HANDLERS ---

  const calculateTotalScore = (questions: any[], answers: any[], isExamMode: boolean) => {
      let totalScore = 0;
      questions.forEach((q, idx) => {
          const ans = answers[idx];
          if (!ans || ans.selection === null) return;

          if (isExamMode) {
              // Exam Mode Logic (Standard 10 Point Scale Mapping for THPT)
              
              if (q.type === 'mcq') {
                  if (ans.selection === q.correctIndex) totalScore += 0.25; // Standard 0.25 per question usually
              } else if (q.type === 'tf_group') {
                  let correctCount = 0;
                  const userSelections = ans.selection as boolean[];
                  q.subQuestions?.forEach((sub: any, sIdx: number) => {
                      if (userSelections[sIdx] === sub.answer) correctCount++;
                  });
                  // THPT scoring rule for TF: 1 correct=0.1, 2=0.25, 3=0.5, 4=1.0
                  if (correctCount === 1) totalScore += 0.1;
                  else if (correctCount === 2) totalScore += 0.25;
                  else if (correctCount === 3) totalScore += 0.5;
                  else if (correctCount === 4) totalScore += 1.0;
              }
          } else {
              // Practice Mode Logic: Each scorable item is 1 point
              if (q.type === 'mcq') {
                  if (ans.selection === q.correctIndex) totalScore += 1;
              } else if (q.type === 'tf_group') {
                  let correctCount = 0;
                  const userSelections = ans.selection as boolean[];
                  q.subQuestions?.forEach((sub: any, sIdx: number) => {
                      if (userSelections[sIdx] === sub.answer) correctCount++;
                  });
                  totalScore += correctCount; // Each correct sub-question is 1 point
              }
          }
      });
      return parseFloat(totalScore.toFixed(2));
  };

  const handleSubmitPracticeAnswer = () => {
    const q = quizState.questions[quizState.currentIdx];
    let isCorrect = false;
    let selection: any = null;
    let earnedPoint = 0;

    if (q.type === 'mcq') {
      selection = tempMcqSel;
      isCorrect = (selection === q.correctIndex);
      if (isCorrect) earnedPoint = 1;
    } else {
      selection = tempTfSel;
      let correctCount = 0;
      if (q.subQuestions) {
         q.subQuestions.forEach((sub, i) => { if (selection[i] === sub.answer) correctCount++; });
         earnedPoint = correctCount; // Each correct sub-question is 1 point
         isCorrect = (correctCount === q.subQuestions.length);
      }
    }

    const newAnswers = [...quizState.userAnswers];
    newAnswers[quizState.currentIdx] = { selection, isCorrect };
    
    setQuizState(prev => ({
      ...prev,
      userAnswers: newAnswers,
      score: prev.score + earnedPoint // Accumulate float score
    }));
  };

  const handleSubmitExam = async (currentState: QuizState = quizState) => {
      const finalScore = calculateTotalScore(currentState.questions, currentState.userAnswers, true);
      
      const reviewedAnswers = currentState.userAnswers.map((ans, idx) => {
          if (!ans) return null;
          const q = currentState.questions[idx];
          let isCorrect = false;
          if (q.type === 'mcq') isCorrect = ans.selection === q.correctIndex;
          else {
             let correctCount = 0;
             q.subQuestions?.forEach((sub, i) => { if ((ans.selection as boolean[])[i] === sub.answer) correctCount++ });
             isCorrect = correctCount === q.subQuestions?.length;
          }
          return { ...ans, isCorrect };
      });

      setQuizState(prev => ({
          ...prev,
          userAnswers: reviewedAnswers,
          score: finalScore,
          screen: 'result', 
          isActive: false, // STOP TIMER
          examStatus: 'submitted'
      }));
      setShowSubmitConfirm(false);
      
      // Clean up saved state if exists
      if (user && db) {
          try {
              await deleteDoc(doc(db, 'quizState', user.uid));
              setHasSavedSession(false);
          } catch(e) { console.error(e); }
      }
  };

  const saveQuizResult = async (customScore?: number) => {
     if (user && db) {
        try {
           const finalScore = customScore !== undefined ? customScore : quizState.score;
           const type = quizState.isExamMode ? 'exam' : 'practice';
           // If exam mode, time spent is 45 mins minus remaining timer. If practice, it's just the timer count up.
           const timeSpent = quizState.isExamMode ? (45 * 60 - quizState.timer) : quizState.timer;
           
           await addDoc(collection(db, 'quizResults'), {
              uid: user.uid,
              topic: quizState.topic,
              score: finalScore,
              total: totalScorableItems, // Use total scorable items
              time: Math.max(0, timeSpent), // Ensure no negative time
              type: type,
              timestamp: serverTimestamp()
           });
           showToast("Lưu kết quả thành công!", "success");
        } catch (e) {
           console.error("Error saving quiz", e);
        }
     }
  };

  // Save result when screen changes to result
  useEffect(() => {
     if (quizState.screen === 'result' && !quizState.isActive) {
         saveQuizResult();
     }
  }, [quizState.screen, quizState.isActive]);


  const handleNext = () => {
    setShowDeepExplain(false);
    setDeepExplainContent('');
    
    if (quizState.currentIdx < quizState.questions.length - 1) {
      setQuizState(prev => ({ ...prev, currentIdx: prev.currentIdx + 1 }));
    } else if (!quizState.isExamMode) {
      setQuizState(prev => ({ ...prev, screen: 'result', isActive: false }));
    }
  };

  const handlePrev = () => {
      if (quizState.currentIdx > 0) {
          setQuizState(prev => ({ ...prev, currentIdx: prev.currentIdx - 1 }));
      }
  };
  
  const handleDeepExplain = async () => {
    const q = quizState.questions[quizState.currentIdx];
    let contentToExplain = '';

    if (q.type === 'mcq') {
        contentToExplain = `Câu hỏi: ${q.question}\nĐáp án đúng: ${q.options?.[q.correctIndex || 0]}\nGiải thích ngắn: ${q.explanation}`;
    } else if (q.type === 'tf_group') {
        let tfContent = `Ngữ cảnh: ${q.context}\n\nCác mệnh đề và đáp án đúng:\n`;
        q.subQuestions?.forEach((sub, i) => {
            tfContent += `- Mệnh đề ${i+1}: "${sub.text}" -> ${sub.answer ? 'Đúng' : 'Sai'}\n`;
        });
        tfContent += `\nGiải thích ngắn chung: ${q.explanation}`;
        contentToExplain = tfContent;
    }

    setShowDeepExplain(true);
    setIsDeepLoading(true);
    
    try {
        const result = await explainQuizDeeply(contentToExplain);
        setDeepExplainContent(result);
    } catch (e) {
        setDeepExplainContent("Lỗi kết nối AI. Vui lòng thử lại.");
    } finally {
        setIsDeepLoading(false);
    }
  };

  const handleChatSend = async () => {
      if (!chatInput.trim()) return;
      
      const userMsg = chatInput;
      setChatInput('');
      setIsChatLoading(true);

      const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', text: userMsg }];
      setChatHistory(newHistory);

      let context = "";
      if (quizState.questions.length > 0) {
          const q = quizState.questions[quizState.currentIdx];
          context = q.type === 'mcq' 
            ? `Đang làm câu hỏi: ${q.question}` 
            : `Đang làm câu hỏi ngữ cảnh: ${q.context}`;
      }

      try {
          const response = await askHistoryTutor(userMsg, context);
          setChatHistory(prev => [...prev, { role: 'model', text: response }]);
      } catch (e) {
          setChatHistory(prev => [...prev, { role: 'model', text: "Lỗi kết nối. Vui lòng thử lại." }]);
      } finally {
          setIsChatLoading(false);
      }
  };

  const handleSubmitReport = async () => {
      if (!reportText.trim()) return;
      setIsReportLoading(true);
      
      const q = quizState.questions[quizState.currentIdx];
      const qData = JSON.stringify(q);

      try {
          const result = await checkQuizReport(qData, reportText);
          setReportResult(result);
      } catch (e) {
          setReportResult("Không thể gửi báo cáo lúc này.");
      } finally {
          setIsReportLoading(false);
      }
  };

  // --- RENDER HELPERS ---
  
  const renderMenuSelection = () => (
    <div id="quiz-menu-container" className="max-w-6xl mx-auto py-6 md:py-10 animate-slide-up">
       <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-center text-history-dark font-serif">Ngân Hàng Trắc Nghiệm</h2>
            <p className="text-gray-500 mt-2">Luyện tập kiến thức và thử sức với các đề thi chuẩn THPT Quốc Gia.</p>
       </div>
       
       {/* Resume Button */}
       {hasSavedSession && (
           <div 
             onClick={handleResumeQuiz}
             className="max-w-md mx-auto mb-10 bg-gradient-to-r from-orange-100 to-amber-50 border-2 border-orange-200 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:shadow-md transition-all animate-pop-in"
           >
                <div className="flex items-center gap-3">
                    <div className="bg-orange-500 text-white p-2 rounded-full">
                        <PlayCircle size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-orange-800">Tiếp tục bài thi đang dở</h4>
                        <p className="text-xs text-orange-600">Bạn có một bài làm chưa hoàn thành.</p>
                    </div>
                </div>
                <ArrowRight className="text-orange-500" />
           </div>
       )}

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div 
             onClick={() => {
                 setQuizState({ ...initialQuizState, screen: 'config' });
                 setViewMode('ai-quiz');
             }}
             className="bg-white rounded-3xl p-8 shadow-lg border-2 border-transparent hover:border-blue-500 cursor-pointer transition-all transform hover:-translate-y-2 group flex flex-col h-full active:scale-95 duration-200 text-center"
          >
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors mx-auto">
                  <Bot size={36} />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors">Ôn Tập AI</h3>
              <p className="text-gray-500 text-base mb-6 flex-1">Tự tạo bộ câu hỏi trắc nghiệm theo chủ đề bất kỳ. AI sẽ chấm điểm và giải thích chi tiết từng câu.</p>
              <span className="text-blue-600 font-bold flex items-center justify-center gap-2 text-base mt-auto bg-blue-50 py-3 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">Bắt đầu ngay <ArrowRight size={20} /></span>
          </div>

          <div 
             onClick={() => setShowStartExamConfirm(true)}
             className="bg-white rounded-3xl p-8 shadow-lg border-2 border-transparent hover:border-history-red cursor-pointer transition-all transform hover:-translate-y-2 group flex flex-col h-full active:scale-95 duration-200 text-center"
          >
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 text-history-red group-hover:bg-history-red group-hover:text-white transition-colors mx-auto">
                  <GraduationCap size={36} />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-history-red transition-colors">Thi Thử THPT</h3>
              <p className="text-gray-500 text-base mb-6 flex-1">Mô phỏng đề thi tốt nghiệp THPT Quốc gia (28 câu / 45 phút). Cấu trúc chuẩn ma trận của Bộ GD&ĐT.</p>
              <span className="text-history-red font-bold flex items-center justify-center gap-2 text-base mt-auto bg-red-50 py-3 rounded-xl group-hover:bg-history-red group-hover:text-white transition-all">Làm bài thi <ArrowRight size={20} /></span>
          </div>
       </div>
    </div>
  );

  const renderConfigScreen = () => (
    <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-xl p-6 md:p-10 border border-gray-100 animate-slide-up w-full mt-8 md:mt-16">
      <div className="text-center mb-10 relative">
        <button 
            onClick={() => setViewMode('menu')}
            className="absolute left-0 top-0 p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
            title="Quay lại menu"
        >
            <X size={24} />
        </button>
        <h2 className="text-2xl md:text-3xl font-bold font-serif text-history-dark mb-3 mt-2 md:mt-0">Ôn Tập & Hỏi Đáp AI</h2>
        <p className="text-gray-500 text-sm md:text-base leading-relaxed">Nhập chủ đề bất kỳ để AI khởi tạo đề ôn tập chuyên sâu.</p>
      </div>

      <div className="space-y-8">
        <div>
          <label className="block font-bold text-gray-800 text-lg mb-3">Chủ đề cần ôn tập</label>
          <input 
            type="text" 
            value={quizState.topic}
            onChange={(e) => updateQuizState({ topic: e.target.value })}
            placeholder="VD: Chiến thắng Điện Biên Phủ, Nhà Trần..." 
            className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-200 focus:border-history-red focus:ring-4 focus:ring-red-50 outline-none transition font-medium text-lg placeholder:text-gray-400"
          />
        </div>

        <div className="space-y-6">
          <div>
            <label className="block font-bold text-gray-700 mb-3">Số lượng câu hỏi</label>
            <div className="flex gap-3">
              {[5, 10, 20].map(n => (
                <button 
                  key={n}
                  onClick={() => updateQuizState({ count: n })}
                  className={`flex-1 py-3 md:py-4 rounded-xl font-bold text-sm md:text-base transition-all active:scale-95 border-2 ${quizState.count === n ? 'bg-history-red text-white border-history-red shadow-lg shadow-red-200' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                >
                  {n} câu
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-3">Hình thức kiểm tra</label>
            <div className="grid grid-cols-3 gap-3">
                <button 
                    onClick={() => updateQuizState({ mode: 'mcq' })}
                    className={`py-4 rounded-xl font-bold text-xs md:text-sm border-2 transition-all active:scale-95 flex flex-col items-center gap-2 ${quizState.mode === 'mcq' ? 'bg-blue-50 text-blue-700 border-blue-500 ring-1 ring-blue-500' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                >
                    <CheckSquare size={20} className={quizState.mode === 'mcq' ? 'text-blue-600' : 'text-gray-400'} />
                    <span>Trắc nghiệm</span>
                </button>
                <button 
                    onClick={() => updateQuizState({ mode: 'tf_group' })}
                    className={`py-4 rounded-xl font-bold text-xs md:text-sm border-2 transition-all active:scale-95 flex flex-col items-center gap-2 ${quizState.mode === 'tf_group' ? 'bg-purple-50 text-purple-700 border-purple-500 ring-1 ring-purple-500' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                >
                    <CheckCircle size={20} className={quizState.mode === 'tf_group' ? 'text-purple-600' : 'text-gray-400'} />
                    <span>Đúng/Sai</span>
                </button>
                <button 
                    onClick={() => updateQuizState({ mode: 'mix' })}
                    className={`py-4 rounded-xl font-bold text-xs md:text-sm border-2 transition-all active:scale-95 flex flex-col items-center gap-2 ${quizState.mode === 'mix' ? 'bg-history-red text-white border-history-red shadow-lg shadow-red-200' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                >
                    <BrainCircuit size={20} className={quizState.mode === 'mix' ? 'text-white' : 'text-gray-400'} />
                    <span>Hỗn hợp</span>
                </button>
            </div>
          </div>
        </div>

        {errorMsg && <p className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-xl border border-red-100 flex items-center justify-center gap-2"><AlertTriangle size={16}/> {errorMsg}</p>}

        <div className="pt-2">
            <button 
            onClick={handleGenerateQuiz}
            disabled={isLoading}
            className="w-full py-4 bg-history-dark text-history-gold rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:bg-black transition-all active:scale-95 flex justify-center items-center gap-3"
            >
            {isLoading ? (
                <>
                <Loader2 size={24} className="animate-spin" />
                Đang soạn đề...
                </>
            ) : (
                <>
                <Bot size={24} /> Bắt Đầu Ôn Tập
                </>
            )}
            </button>
        </div>
      </div>
    </div>
  );

  // New Grid System for Progress to ensure squares and centering
  const renderProgressGrid = () => {
      const mcqQuestions = quizState.questions.map((q, i) => ({ q, i })).filter(item => item.q.type === 'mcq' || !item.q.type);
      const tfQuestions = quizState.questions.map((q, i) => ({ q, i })).filter(item => item.q.type === 'tf_group');

      const renderButton = (i: number) => {
            let cls = "w-full aspect-square flex items-center justify-center font-bold text-sm rounded-xl border transition-all cursor-pointer transform ";
            if (i === quizState.currentIdx) cls += "ring-2 ring-history-gold ring-offset-2 scale-105 ";
            
            const a = quizState.userAnswers[i];
            const isMarked = quizState.markedQuestions?.includes(i);

            if (a && a.selection !== null) {
                if (quizState.isExamMode && quizState.examStatus !== 'submitted') {
                    // Exam in progress: Blue for answered, Yellow border for Marked
                    cls += "bg-blue-100 text-blue-600 border-blue-200 ";
                    if (isMarked) cls += "ring-2 ring-yellow-400 border-yellow-400 bg-yellow-50 text-yellow-700";
                } else {
                    // Practice or Submitted Exam: Green/Red
                    cls += a.isCorrect ? "bg-green-500 text-white border-green-600" : "bg-red-500 text-white border-red-600";
                }
            } else {
                if (isMarked) cls += "bg-yellow-100 text-yellow-600 border-yellow-300";
                else cls += "bg-gray-100 text-gray-400 border-gray-200";
            }
            return (
                <button key={i} onClick={() => updateQuizState({ currentIdx: i })} className={cls}>{i + 1}</button>
            );
      };

      if (tfQuestions.length > 0) {
          return (
              <div className="w-full flex flex-col gap-4">
                  <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Phần I: Trắc nghiệm</h4>
                      <div className="grid grid-cols-5 gap-2 w-full place-items-center">
                          {mcqQuestions.map(item => renderButton(item.i))}
                      </div>
                  </div>
                  <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Phần II: Đúng/Sai</h4>
                      <div className="grid grid-cols-5 gap-2 w-full place-items-center">
                          {tfQuestions.map(item => renderButton(item.i))}
                      </div>
                  </div>
              </div>
          );
      }

      return (
          <div className="grid grid-cols-5 gap-2 w-full place-items-center">
              {quizState.questions.map((_, i) => renderButton(i))}
          </div>
      );
  };

  const renderPlayingScreen = () => {
    const q = quizState.questions[quizState.currentIdx];
    const ans = quizState.userAnswers[quizState.currentIdx];
    
    // In Exam Mode, "isAnswered" for UI purposes is only true AFTER submission or if checked in practice
    const isExam = quizState.isExamMode;
    const isSubmitted = quizState.examStatus === 'submitted';
    const isAnsweredUI = isExam ? isSubmitted : !!ans; 
    const isMarked = quizState.markedQuestions?.includes(quizState.currentIdx);

    return (
      <div className="flex flex-col lg:flex-row gap-6 items-start animate-slide-up mt-6 md:mt-10">
        {/* Mobile Header (Dropdown Menu) - New Optimized Layout */}
        <div className="w-full lg:hidden bg-white rounded-3xl shadow-sm border border-gray-200 mb-4 sticky top-[64px] z-40 overflow-hidden">
            <div 
                className="flex justify-between items-center p-3 cursor-pointer bg-gray-50/50 backdrop-blur-md"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
                <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-700 flex items-center gap-2 text-sm">
                        <FileText size={16} /> {questionNumberDisplay}
                    </span>
                    <div className={`flex items-center gap-2 font-mono font-bold px-2 py-0.5 rounded-lg text-xs ${isExam && quizState.timer < 300 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-700'}`}>
                        <Clock size={12} /> {formatTime(quizState.timer)}
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                     <button onClick={(e) => { e.stopPropagation(); setShowExitConfirm(true); }} className="p-1.5 text-gray-400 hover:bg-gray-200 rounded-lg">
                        <LogOut size={18} />
                     </button>
                    {isMobileMenuOpen ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                </div>
            </div>

            {/* Collapsible Content */}
            {isMobileMenuOpen && (
                <div className="p-4 border-t border-gray-100 animate-slide-up bg-white">
                     <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Danh sách câu hỏi</h3>
                     <div className="max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                         {renderProgressGrid()}
                     </div>
                     
                     {isExam && !isSubmitted && (
                        <div className="grid grid-cols-2 gap-2 mt-4">
                            <button 
                                onClick={handleSaveAndExit}
                                className="w-full py-3 bg-orange-100 text-orange-700 rounded-xl font-bold hover:bg-orange-200 transition-all flex justify-center items-center gap-2 text-sm"
                            >
                                <Save size={16} /> Lưu & Thoát
                            </button>
                            <button 
                                onClick={() => { setShowSubmitConfirm(true); setIsMobileMenuOpen(false); }}
                                className="w-full py-3 bg-history-red text-white rounded-xl font-bold shadow hover:bg-red-800 transition-all flex justify-center items-center gap-2 text-sm"
                            >
                                <FileCheck size={16} /> Nộp bài
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Main Content Card */}
        <div className="flex-1 w-full" key={quizState.currentIdx}>
           <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-5 md:p-8 flex flex-col relative h-full animate-slide-in-right">
              
              {/* Desktop Header inside Card */}
              <div className="hidden lg:flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                 <div className="flex items-center gap-3">
                   <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${q.type === 'mcq' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                      {q.type === 'mcq' ? 'Trắc nghiệm' : 'Đúng/Sai'}
                   </span>
                   <span className="text-gray-400 font-medium">{questionNumberDisplay}</span>
                 </div>
                 <div className="flex items-center gap-4">
                    <button onClick={() => setShowExitConfirm(true)} className="text-gray-400 hover:text-red-500 transition-colors" title="Thoát">
                        <LogOut size={20} />
                    </button>
                 </div>
              </div>

              <div className="flex-grow mb-8">
                 {q.type === 'mcq' ? (
                   <>
                     {q.context && q.context.trim() !== "" && (
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-gray-700 italic mb-6 leading-relaxed text-sm md:text-base">
                            <SimpleMarkdown text={q.context} />
                        </div>
                     )}
                     <h3 className="text-base md:text-xl font-medium text-gray-800 mb-6 leading-relaxed">
                       <SimpleMarkdown text={q.question || ""} />
                     </h3>
                     <div className="space-y-3">
                        {q.options?.map((opt, i) => {
                           // Clean option text (remove existing "A.", "B." prefixes if AI generated them)
                           const cleanOpt = opt.replace(/^[A-D][\.:]\s*/, ''); 
                           
                           let btnClass = "w-full text-left p-4 rounded-2xl border flex items-start gap-3 transition-all duration-200 transform ";
                           
                           const isSelected = isExam 
                                ? (ans?.selection === i || tempMcqSel === i)
                                : (isAnsweredUI ? ans?.selection === i : tempMcqSel === i);

                           if (isAnsweredUI) {
                              if (i === q.correctIndex) btnClass += "bg-green-100 border-green-500 text-green-900 scale-[1.01] shadow-sm";
                              else if (isSelected && i !== q.correctIndex) btnClass += "bg-red-100 border-red-500 text-red-900 opacity-60";
                              else btnClass += "bg-gray-50 border-gray-200 text-gray-500";
                           } else {
                              if (isSelected) btnClass += "bg-blue-50 border-blue-500 text-blue-900 shadow-md ring-1 ring-blue-500 scale-[1.02]";
                              else btnClass += "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:scale-[1.01] hover:shadow-sm active:scale-95";
                           }
                           
                           return (
                             <button 
                               key={i} 
                               onClick={() => handleSelectMCQ(i)}
                               disabled={isAnsweredUI && !isExam} // Allow viewing in review mode but not changing if submitted logic handled in func
                               className={btnClass + ((isSubmitted) ? ' cursor-default' : '')}
                             >
                               <span className="font-bold shrink-0 w-6">{String.fromCharCode(65+i)}.</span>
                               <span className="leading-snug text-sm md:text-base">{cleanOpt}</span>
                             </button>
                           )
                        })}
                     </div>
                   </>
                 ) : (
                   <>
                     {q.context && q.context.trim() !== "" && (
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-gray-700 italic mb-6 leading-relaxed text-sm md:text-base">
                            <SimpleMarkdown text={q.context} />
                        </div>
                     )}
                     
                     {(!q.subQuestions || q.subQuestions.length === 0) ? (
                         <div className="text-red-500 bg-red-50 p-4 rounded-xl border border-red-200 italic mb-4">
                             <AlertCircle size={16} className="inline mr-2"/>
                             Lỗi dữ liệu: Câu hỏi này không có nội dung. Vui lòng báo cáo hoặc bỏ qua.
                         </div>
                     ) : (
                         <>
                             <h3 className="font-bold text-gray-800 mb-4 text-sm md:text-base">Xác định các mệnh đề sau Đúng hay Sai:</h3>
                             <div className="space-y-3">
                                {q.subQuestions?.map((sub, i) => {
                                   let userChoice: boolean | null = null;
                                   if (isExam) {
                                       if (ans?.selection) userChoice = (ans.selection as boolean[])[i];
                                       else if (tempTfSel.length) userChoice = tempTfSel[i];
                                   } else {
                                       userChoice = isAnsweredUI 
                                        ? (ans?.selection && Array.isArray(ans.selection) ? (ans.selection as boolean[])[i] : null) 
                                        : tempTfSel[i];
                                   }

                                   return (
                                     <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-2xl bg-white gap-3 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex-1 text-gray-700 font-medium text-sm md:text-base">{sub.text}</div>
                                        <div className="flex gap-2 shrink-0 justify-end">
                                           <button 
                                              onClick={() => handleSelectTF(i, true)}
                                              disabled={isSubmitted}
                                              className={`w-10 h-10 md:w-12 md:h-12 rounded-xl border-2 font-bold transition-all transform active:scale-90 hover:scale-105 ${
                                                isAnsweredUI 
                                                  ? (sub.answer === true ? 'bg-green-500 text-white border-green-500' : (userChoice === true ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-300 border-gray-200'))
                                                  : (userChoice === true ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50')
                                              }`}
                                           >Đ</button>
                                           <button 
                                              onClick={() => handleSelectTF(i, false)}
                                              disabled={isSubmitted}
                                              className={`w-10 h-10 md:w-12 md:h-12 rounded-xl border-2 font-bold transition-all transform active:scale-90 hover:scale-105 ${
                                                isAnsweredUI 
                                                  ? (sub.answer === false ? 'bg-green-500 text-white border-green-500' : (userChoice === false ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-300 border-gray-200'))
                                                  : (userChoice === false ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50')
                                              }`}
                                           >S</button>
                                        </div>
                                     </div>
                                   )
                                })}
                             </div>
                         </>
                     )}
                   </>
                 )}
              </div>

              {/* Footer Actions */}
              <div className="border-t border-gray-100 pt-6 flex flex-wrap justify-between items-center gap-4">
                 
                 {/* Navigation Buttons */}
                 <div className="flex gap-2 order-2 sm:order-1 w-full sm:w-auto justify-between sm:justify-start">
                     <button onClick={handlePrev} disabled={quizState.currentIdx === 0} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 font-medium active:scale-95">Câu trước</button>
                     <button onClick={handleNext} disabled={quizState.currentIdx === quizState.questions.length - 1} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 font-medium active:scale-95">Câu sau</button>
                 </div>

                 {/* Explanation & Chatbot */}
                 <div className="w-full sm:w-auto order-3 sm:order-2">
                    {isAnsweredUI && (!isExam || isSubmitted) ? (
                        <div className="text-sm animate-fade-in">
                           <SimpleMarkdown text={q.explanation || "Không có giải thích chi tiết."} className="text-gray-600 italic" />
                           <button onClick={handleDeepExplain} className="mt-2 text-xs font-bold text-history-red hover:underline flex items-center gap-1">
                                ✨ Yêu cầu AI phân tích sâu hơn
                           </button>
                           {isExam && isSubmitted && !ans?.isCorrect && (
                               <p className="text-red-600 italic font-bold mt-1">Đáp án sai.</p>
                           )}
                        </div>
                    ) : (
                       !isExam && <span className="text-sm text-gray-400 italic hidden sm:inline">Chọn đáp án để kiểm tra</span>
                    )}
                 </div>

                 {/* Action Buttons: Check/Mark/Report */}
                 <div className="flex w-full sm:w-auto gap-3 order-1 sm:order-3 justify-end">
                    {/* Mark Button (Exam Mode only) */}
                    {isExam && !isSubmitted && (
                        <button 
                            onClick={handleMarkQuestion}
                            className={`p-3 rounded-xl border transition-all ${isMarked ? 'bg-yellow-100 text-yellow-600 border-yellow-300' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'}`}
                            title="Đánh dấu câu hỏi này"
                        >
                            <Flag size={20} fill={isMarked ? "currentColor" : "none"} />
                        </button>
                    )}

                    {/* Report Button (Always visible) */}
                    <button 
                        onClick={() => { setReportResult(''); setReportText(''); setShowReportModal(true); }} 
                        className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-red-500 bg-gray-50 rounded-full transition-colors active:scale-95" 
                        title="Báo lỗi"
                    >
                        <AlertTriangle size={20} />
                    </button>

                    {/* Practice Mode Check Button */}
                    {!isExam && (
                        !isAnsweredUI ? (
                        <button 
                            onClick={handleSubmitPracticeAnswer}
                            disabled={q.type === 'mcq' ? tempMcqSel === null : tempTfSel.filter(x => x !== null).length !== (q.subQuestions?.length || 4)}
                            className="flex-1 sm:flex-none px-6 py-3 bg-history-dark text-white rounded-2xl font-bold shadow-md hover:bg-black disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 whitespace-nowrap"
                        >
                            Kiểm Tra
                        </button>
                        ) : (
                        <button 
                            onClick={handleNext}
                            className="flex-1 sm:flex-none px-6 py-3 bg-history-red text-white rounded-2xl font-bold shadow-md hover:bg-red-800 transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap"
                        >
                            {quizState.currentIdx < quizState.questions.length - 1 ? 'Câu kế tiếp' : 'Hoàn thành'} <CheckCircle size={18} />
                        </button>
                        )
                    )}
                 </div>
              </div>

              {/* Deep Explain */}
              {showDeepExplain && (
                  <div className="mt-4 bg-orange-50 rounded-2xl p-4 border border-orange-100 animate-pop-in">
                      <div className="flex items-center gap-2 mb-2 text-orange-800 font-bold text-sm">
                          <Bot size={16} /> Phân tích chuyên sâu
                      </div>
                      {isDeepLoading ? (
                          <div className="flex items-center gap-2 text-gray-500 text-sm italic">
                              <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></span> AI đang suy nghĩ...
                          </div>
                      ) : (
                          <SimpleMarkdown text={deepExplainContent} className="text-sm text-gray-800 leading-relaxed" />
                      )}
                  </div>
              )}
           </div>
        </div>

        {/* Desktop Sticky Sidebar */}
        <div className="hidden lg:block w-80 space-y-4 sticky top-24 h-fit">
           {/* Score Box */}
           <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 text-center">
              {isExam && !isSubmitted ? (
                  <>
                    <p className="text-xs font-bold uppercase text-gray-400 mb-1">Thời gian còn lại</p>
                    <div className={`text-4xl font-black font-mono mb-2 ${quizState.timer < 300 ? 'text-red-600 animate-pulse' : 'text-gray-800'}`}>
                        {formatTime(quizState.timer)}
                    </div>
                    <p className="text-xs font-bold uppercase text-gray-400 mb-1">Số câu đã làm</p>
                    <div className="text-2xl font-black text-blue-600">
                        {quizState.userAnswers.filter(a => a && a.selection !== null).length}/{quizState.questions.length}
                    </div>
                  </>
              ) : (
                  <>
                    <p className="text-xs font-bold uppercase text-gray-400 mb-1">Điểm số hiện tại</p>
                    <div className="text-5xl font-black text-history-red">
                        {quizState.score.toFixed(2)}
                        {/* Show raw score for practice as requested */}
                        <span className="text-lg text-gray-400 font-medium">/{quizState.isExamMode ? 10 : totalScorableItems}</span>
                    </div>
                  </>
              )}
           </div>
           
           {/* Question Grid */}
           <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-700 mb-4 text-sm uppercase">Tiến trình</h3>
              {renderProgressGrid()}
              
              {isExam && !isSubmitted && (
                  <div className="flex flex-col gap-2 mt-4">
                      <button 
                        onClick={handleSaveAndExit}
                        className="w-full py-2 bg-orange-100 text-orange-700 rounded-xl font-bold hover:bg-orange-200 transition-all flex justify-center items-center gap-2 text-sm"
                      >
                          <Save size={16} /> Lưu & Thoát
                      </button>
                      <button 
                        onClick={() => setShowSubmitConfirm(true)}
                        className="w-full py-3 bg-history-red text-white rounded-xl font-bold shadow hover:bg-red-800 transition-all flex justify-center items-center gap-2"
                      >
                          <FileCheck size={20} /> Nộp bài
                      </button>
                  </div>
              )}
           </div>
        </div>
      </div>
    );
  };

  const renderResultScreen = () => {
    const maxScore = quizState.isExamMode ? 10 : totalScorableItems;
    // Normalize to 10 for grading label
    const normalizedScore = (quizState.score / maxScore) * 10;
    
    let gradeLabel = "";
    let gradeColor = "";
    if (normalizedScore < 5) { gradeLabel = "Chưa đạt"; gradeColor = "text-red-600"; }
    else if (normalizedScore < 8) { gradeLabel = "Khá"; gradeColor = "text-yellow-600"; }
    else if (normalizedScore < 9) { gradeLabel = "Giỏi"; gradeColor = "text-blue-600"; }
    else { gradeLabel = "Xuất sắc"; gradeColor = "text-green-600"; }

    return (
        <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-xl p-6 md:p-10 border border-gray-100 text-center animate-slide-up mt-8 md:mt-16">
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100 animate-[bounce_1s_infinite]">
                <span className="text-5xl">🏆</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-history-dark mb-2 font-serif">Hoàn thành bài thi!</h2>
            <p className="text-gray-500 mb-8 text-sm md:text-base">Chủ đề: <strong className="text-history-red">{quizState.topic}</strong></p>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Điểm số</p>
                    <p className="text-2xl md:text-3xl font-black text-history-red">
                        {quizState.score.toFixed(2)}<span className="text-lg text-gray-400">/{maxScore}</span>
                    </p>
                    <p className={`text-sm font-bold mt-1 ${gradeColor}`}>{gradeLabel}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Thời gian</p>
                    <p className="text-2xl md:text-3xl font-black text-gray-800">{formatTime(quizState.isExamMode ? (45*60 - quizState.timer) : quizState.timer)}</p>
                </div>
            </div>
            
            {user && (
                <div className="mb-6 text-sm text-green-600 bg-green-50 p-2 rounded-xl border border-green-100 flex items-center justify-center gap-2">
                    <CheckCircle size={16} /> Kết quả đã được lưu vào hồ sơ của bạn
                </div>
            )}

            <div className="flex gap-3 flex-col sm:flex-row">
                <button onClick={() => updateQuizState({ screen: 'playing' })} className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-md">
                    Xem lại bài làm
                </button>
                <button onClick={() => updateQuizState({ screen: 'config', isActive: false, isExamMode: false })} className="flex-1 py-3 bg-history-dark text-white rounded-2xl font-bold hover:bg-black transition-all active:scale-95 shadow-md">
                    Ôn tập tiếp
                </button>
                <button onClick={() => {
                    setQuizState({ ...initialQuizState });
                    setViewMode('menu');
                }} className="px-4 py-3 bg-gray-200 text-gray-700 rounded-2xl font-bold hover:bg-gray-300 transition-all active:scale-95">
                    Menu
                </button>
            </div>
        </div>
    );
  };

  return (
    <div className="animate-fade-in pb-20 bg-history-paper min-h-screen relative">
      {/* Page Title Banner - Only show in menu mode */}
      {viewMode === 'menu' && (
        <div id="quiz-hero" className="relative bg-history-red text-white py-12 px-4 text-center overflow-hidden mb-8 shadow-md">
            <div className="absolute inset-0 z-0">
                <EditableImage 
                    imageId="quiz-header-bg"
                    initialSrc=""
                    alt="Quiz Banner"
                    className="w-full h-full object-cover"
                    disableEdit={true}
                />
            </div>
            <div className="relative z-10">
                <h1 className="text-2xl md:text-3xl font-bold font-serif text-white flex items-center justify-center gap-3">
                <BookOpen className="text-history-gold" /> Trắc Nghiệm & Luyện Thi
                </h1>
            </div>
        </div>
      )}

      <div className="px-4">
        {viewMode === 'menu' && (
            <div key="menu" className="animate-slide-up">
                {renderMenuSelection()}
            </div>
        )}
        
        {viewMode === 'ai-quiz' && (
            <div key="ai-quiz" className="animate-fade-in">
                {quizState.screen === 'config' && renderConfigScreen()}
                {quizState.screen === 'playing' && renderPlayingScreen()}
                {quizState.screen === 'result' && renderResultScreen()}
            </div>
        )}
      </div>

      {/* Floating Chat Button */}
      {viewMode === 'ai-quiz' && (!quizState.isExamMode || quizState.examStatus === 'submitted') && (
        <Portal>
            <button 
                onClick={() => setShowChat(!showChat)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-history-dark text-white rounded-full shadow-2xl flex items-center justify-center z-[100] hover:scale-110 active:scale-90 transition-all duration-300 border-2 border-history-gold"
            >
                {showChat ? <X /> : <MessageCircle />}
            </button>

            {/* Chat Window */}
            {showChat && (
            <div className={`fixed bottom-24 right-4 md:right-6 w-[90vw] md:w-96 h-[500px] max-h-[70vh] bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden z-[100] animate-pop-in origin-bottom-right`}>
                <div className="bg-history-dark text-white p-4 flex items-center gap-3 shrink-0">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">🤖</div>
                    <div>
                        <h3 className="font-bold text-sm">Trợ lý Lịch Sử AI</h3>
                        <p className="text--[10px] text-green-400">● Đang hoạt động</p>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {chatHistory.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                            <div className={`max-w-[85%] p-3 rounded-3xl text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-700 rounded-tl-none shadow-sm'}`}>
                                <SimpleMarkdown text={msg.text} />
                            </div>
                        </div>
                    ))}
                    {isChatLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-gray-200 p-3 rounded-3xl rounded-tl-none shadow-sm flex items-center gap-2 text-xs text-gray-500">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef}></div>
                </div>
                <div className="p-3 bg-white border-t border-gray-100 shrink-0">
                    <div className="flex gap-2 relative">
                        <input 
                            type="text" 
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                            placeholder="Hỏi thêm về lịch sử..." 
                            className="flex-1 bg-gray-100 rounded-full pl-4 pr-10 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-history-gold"
                        />
                        <button onClick={handleChatSend} className="absolute right-1 top-1 w-8 h-8 bg-history-dark text-white rounded-full flex items-center justify-center hover:bg-black transition">
                            <Send size={14} />
                        </button>
                    </div>
                </div>
            </div>
            )}
        </Portal>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <Portal>
            <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-pop-in">
                    <div className="p-6">
                        <h3 className="font-bold text-lg text-red-800 mb-2 flex items-center gap-2">
                            <AlertCircle size={20} /> Báo cáo sai sót
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">AI sẽ kiểm tra lại dữ liệu dựa trên báo cáo của bạn.</p>
                        
                        {!reportResult ? (
                            <>
                                <textarea 
                                    value={reportText}
                                    onChange={(e) => setReportText(e.target.value)}
                                    className="w-full border border-gray-200 rounded-2xl p-3 text-sm bg-gray-50 focus:ring-2 focus:ring-red-100 outline-none resize-none h-32 mb-4" 
                                    placeholder="Ví dụ: Đáp án A sai vì năm chính xác là 1945..."
                                ></textarea>
                                <div className="flex justify-end gap-3">
                                    <button onClick={() => setShowReportModal(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-xl text-sm transition-colors active:scale-95">Hủy bỏ</button>
                                    <button 
                                        onClick={handleSubmitReport} 
                                        disabled={isReportLoading || !reportText.trim()}
                                        className="px-4 py-2 bg-history-red text-white font-bold rounded-xl hover:bg-red-900 transition-all shadow text-sm flex items-center gap-2 active:scale-95"
                                    >
                                        {isReportLoading && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                                        Gửi & Kiểm tra
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="animate-fade-in-up">
                                <div className="bg-gray-50 p-4 rounded-2xl text-sm text-gray-800 mb-4 border border-gray-200 max-h-60 overflow-y-auto">
                                    <SimpleMarkdown text={reportResult} />
                                </div>
                                <button onClick={() => setShowReportModal(false)} className="w-full py-2 bg-gray-800 text-white rounded-xl font-bold text-sm transition-all active:scale-95">Đã hiểu</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Portal>
      )}

      {/* Confirm Submit Modal */}
      {showSubmitConfirm && (
          <Portal>
              <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                  <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden animate-pop-in text-center p-6">
                      <AlertTriangle size={48} className="text-yellow-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-800 mb-2">Nộp bài thi?</h3>
                      <p className="text-gray-500 mb-6">Bạn đã hoàn thành bài làm và muốn nộp bài ngay?</p>
                      <div className="flex gap-3">
                          <button onClick={() => setShowSubmitConfirm(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200">Kiểm tra lại</button>
                          <button onClick={() => handleSubmitExam()} className="flex-1 py-3 bg-history-red text-white rounded-xl font-bold hover:bg-red-800">Nộp bài</button>
                      </div>
                  </div>
              </div>
          </Portal>
      )}
      
      {/* Confirm Exit Modal */}
      {showExitConfirm && (
          <Portal>
              <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                  <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden animate-pop-in text-center p-6">
                      <LogOut size={48} className="text-gray-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-800 mb-2">Thoát bài làm?</h3>
                      <p className="text-gray-500 mb-6">Bạn muốn làm gì tiếp theo?</p>
                      <div className="flex flex-col gap-3">
                          {quizState.isExamMode && user && <button onClick={() => handleConfirmExit(true)} className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600">Lưu & Thoát</button>}
                          <button onClick={() => handleConfirmExit(false)} className="w-full py-3 bg-history-red text-white rounded-xl font-bold hover:bg-red-800">Thoát không lưu</button>
                          <button onClick={() => setShowExitConfirm(false)} className="w-full py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200">Hủy</button>
                      </div>
                  </div>
              </div>
          </Portal>
      )}

      {/* Confirm Start Exam Modal */}
      {showStartExamConfirm && (
          <Portal>
              <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                  <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden animate-pop-in text-center p-6">
                      <GraduationCap size={48} className="text-history-red mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-800 mb-2">Bắt đầu Thi thử THPT?</h3>
                      <p className="text-gray-500 mb-6">Đề thi gồm 28 câu với 40 lệnh hỏi trong 45 phút. Quá trình tạo đề bằng AI có thể mất 1-2 phút. Bạn đã sẵn sàng?</p>
                      <div className="flex gap-3">
                          <button onClick={() => setShowStartExamConfirm(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200">Để sau</button>
                          <button onClick={() => { setShowStartExamConfirm(false); handleGenerateTHPTExam(); }} className="flex-1 py-3 bg-history-red text-white rounded-xl font-bold hover:bg-red-800">Bắt đầu</button>
                      </div>
                  </div>
              </div>
          </Portal>
      )}

      {/* Countdown Overlay */}
      {quizState.isExamMode && quizState.examStatus === 'countdown' && (
          <CountDownOverlay onComplete={startExamAfterCountdown} />
      )}

      {/* Exam Loading Modal */}
      {isGeneratingExam && <ExamLoadingModal />}
    </div>
  );
};

export default QuizPage;
