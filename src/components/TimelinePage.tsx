
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import TimelineSection from './TimelineSection';
import HistoricalFiguresSection from './HistoricalFiguresSection';
import EventDetailPage from './EventDetailPage';
import FigureDetailPage from './FigureDetailPage';
import { HeritageModal } from './HeritageModal';
import DiscoveryModal from './DiscoveryModal';
// REMOVED hardcoded imports for Stages and Figures
// import { HISTORY_STAGES, VIETNAM_FIGURES, WORLD_FIGURES } from '../data';
import { HistoricalEvent, HistoryStage, HistoricalFigure } from '../types';
import { BookOpen, Globe, Users, ArrowLeft, Star, FolderOpen, Target, Flag, Search, X, Loader2, Anchor, ChevronDown, ChevronUp, ArrowUp, Zap, Layout, Columns, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { synthesizeHistoryTopic } from '../services/geminiService';
import SimpleMarkdown from './SimpleMarkdown';
import EditableImage from './EditableImage';
import EditableText from './EditableText';
import EditableMaterials from './EditableMaterials';
// Added getDocs, query, orderBy
import { db, collection, onSnapshot, getDocs, query, orderBy } from '../firebaseConfig';

const UN_TOPIC_CONTENT = `<b>Bối cảnh hình thành</b>
• Giai đoạn cuối Chiến tranh thế giới thứ hai, phe Đồng minh chiếm ưu thế.
• Nhu cầu cấp bách phải thiết lập một tổ chức quốc tế để duy trì hòa bình và an ninh thế giới sau chiến tranh.

<b>Mục tiêu hoạt động (Theo Điều 1 Hiến chương)</b>
• Duy trì hòa bình và an ninh quốc tế (đây là mục tiêu trọng tâm).
• Phát triển quan hệ hữu nghị giữa các dân tộc trên cơ sở bình đẳng và quyền tự quyết.
• Thúc đẩy hợp tác quốc tế giải quyết các vấn đề kinh tế, xã hội, văn hóa, nhân đạo và quyền con người.
• Trở thành trung tâm phối hợp hành động của các dân tộc vì các mục tiêu chung.

<b>Nguyên tắc hoạt động (Theo Điều 2 Hiến chương)</b>
• Bình đẳng chủ quyền của mọi quốc gia thành viên.
• Tôn trọng toàn vẹn lãnh thổ và độc lập chính trị quốc gia.
• Cấm đe dọa sử dụng vũ lực hoặc sử dụng vũ lực trong quan hệ quốc tế.
• Không can thiệp vào công việc nội bộ các nước.
• Tôn trọng các nghĩa vụ quốc tế và luật pháp quốc tế.
• Giải quyết các tranh chấp quốc tế bằng biện pháp hòa bình.

<b>Cơ cấu tổ chức (Thông tin nổi bật)</b>
• Hội đồng Bảo an: Cơ quan giữ vai trò trọng yếu trong duy trì hòa bình và an ninh thế giới.
• Gồm 15 thành viên: 5 Ủy viên thường trực (Nhóm P5: Mỹ, Anh, Pháp, Nga, Trung Quốc) có quyền phủ quyết; và 10 thành viên không thường trực (Nhóm E10).
• Trụ sở chính: Đặt tại New York (Mỹ).
• Biểu tượng: Bản đồ thế giới bao quanh bởi hai nhánh ô liu (biểu tượng hòa bình) trên nền xanh.

<b>Vai trò của Liên hợp quốc</b>
a. Duy trì hòa bình, an ninh quốc tế:
• Giải quyết xung đột và tranh chấp ở nhiều khu vực (ví dụ: Khủng hoảng tên lửa Cuba 1962, Trung Đông 1973...).
• Triển khai hoạt động gìn giữ hòa bình, hỗ trợ tái thiết.
• Thúc đẩy quá trình phi thực dân hóa, xóa bỏ chủ nghĩa thực dân và chế độ phân biệt chủng tộc.
• Xây dựng hệ thống công ước, hiệp ước quốc tế về giải trừ quân bị và ngăn chặn vũ khí hủy diệt hàng loạt.
b. Thúc đẩy phát triển:
• Tạo môi trường kinh tế quốc tế bình đẳng, hỗ trợ các nước kém phát triển về vốn, tri thức.
• Đề ra các chiến lược phát triển, tiêu biểu là Chương trình nghị sự 2030 với 17 mục tiêu phát triển bền vững (SDGs) nhằm chấm dứt đói nghèo, bảo vệ hành tinh.
c. Bảo đảm quyền con người, phát triển văn hóa, xã hội:
• Thông qua Tuyên ngôn Nhân quyền (1948) và hơn 80 công ước quốc tế để bảo vệ quyền con người.
• Các tổ chức chuyên môn (UNESCO, WHO, ILO...) và các quỹ (UNICEF, UNFPA...) thúc đẩy hợp tác giáo dục, y tế, giải quyết việc làm, bảo vệ trẻ em và giải quyết các thách thức toàn cầu.

<b>Vai trò của Việt Nam trong Hội đồng Bảo an Liên hợp quốc</b>
• Vị trí đảm nhiệm: Việt Nam tham gia với tư cách là Uỷ viên không thường trực của Hội đồng Bảo an.
• Các nhiệm kì hoạt động: Việt Nam đã được bầu và đảm nhiệm vai trò này trong hai nhiệm kì:
• Nhiệm kì 2008 – 2009.
• Nhiệm kì 2020 – 2021.
• Sự kiện bầu cử: Ngày 06/06/2019, tại cuộc họp của Hội đồng Bảo an Liên hợp quốc, Việt Nam đã được bầu làm Uỷ viên không thường trực cho nhiệm kì 2020 – 2021.
• Ý nghĩa: Việc trúng cử vào vị trí này cho thấy cộng đồng quốc tế đã dành sự tín nhiệm cao đối với Việt Nam.`;

const ASEAN_TOPIC_CONTENT = `<b>Tổng quan về ASEAN</b>
• <b>Thành lập:</b> Ngày 08/08/1967 tại Bangkok (Thái Lan).
• <b>Thành viên ban đầu (5 nước):</b> Indonesia, Malaysia, Philippines, Singapore, Thái Lan.
• <b>Mục tiêu:</b> Thúc đẩy tăng trưởng kinh tế, tiến bộ xã hội, phát triển văn hóa, duy trì hòa bình và ổn định khu vực.

<b>Quá trình mở rộng thành viên (ASEAN 10 + 1)</b>
• 1984: Brunei Darussalam (Thành viên thứ 6).
• 1995: Việt Nam (Thành viên thứ 7).
• 1997: Lào và Myanmar (Thành viên thứ 8, 9).
• 1999: Campuchia (Thành viên thứ 10).
• 2022-2025: Đông Timor (Timor-Leste) (Thành viên thứ 11).

<b>Các mốc phát triển chính</b>
• 1976: Hiệp ước Bali (TAC) - Nguyên tắc quan hệ cơ bản.
• 2007: Hiến chương ASEAN - Cơ sở pháp lý.
• 2015: Cộng đồng ASEAN (AC) - 3 trụ cột: Chính trị-An ninh, Kinh tế, Văn hóa-Xã hội.
• Việt Nam đã có nhiều đóng góp tích cực, giữ vai trò Chủ tịch ASEAN (2010, 2020) và thúc đẩy hội nhập khu vực.`;

// --- HELPER: Date Parser & Sorter ---
const calculateDateValue = (dateStr: string): number => {
    if (!dateStr) return 0;
    
    // 1. Clean string: remove everything after a hyphen (ranges) to get start date
    // Example: "1945 - 1954" -> "1945"
    let cleanStr = dateStr.split('-')[0].trim();
    // Remove text like "Khoảng", "Đầu năm", etc. to extract numbers
    // This simple regex finds the first date-like pattern
    
    // Pattern 1: DD/MM/YYYY (e.g., 02/09/1945 or 2/9/1945)
    const dmyMatch = cleanStr.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/);
    if (dmyMatch) {
        // YYYYMMDD
        return parseInt(dmyMatch[3]) * 10000 + parseInt(dmyMatch[2]) * 100 + parseInt(dmyMatch[1]);
    }

    // Pattern 2: MM/YYYY (e.g., 08/1945 or 8/1945)
    const myMatch = cleanStr.match(/^(\d{1,2})[\/.-](\d{4})/);
    if (myMatch) {
        // YYYYMM00 (Day 00 puts it before specific days in that month)
        return parseInt(myMatch[2]) * 10000 + parseInt(myMatch[1]) * 100;
    }

    // Pattern 3: YYYY (e.g., 1945) - Find the first 4-digit number
    const yMatch = cleanStr.match(/(\d{4})/);
    if (yMatch) {
        // YYYY0000 (Month 00, Day 00 puts it before specific months/days)
        return parseInt(yMatch[1]) * 10000;
    }

    return 0; // Fallback
};

interface TimelinePageProps {
  searchTerm: string;
  onAskAI: (event: HistoricalEvent) => void;
  resetKey?: number; 
}

type ViewMode = 'menu' | 'vn-events' | 'world-events' | 'vn-figures' | 'world-figures' | 'topics' | 'topic-detail' | 'event-detail' | 'figure-detail';
type TopicId = 'vn-asean' | 'world' | 'phap' | 'my' | 'un' | 'ianta' | 'coldwar' | null;

const TimelinePage: React.FC<TimelinePageProps> = ({ searchTerm, onAskAI, resetKey = 0 }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Local state derived from URL params for easier access
  const [currentView, setCurrentView] = useState<ViewMode>('menu');
  const [selectedTopic, setSelectedTopic] = useState<TopicId>(null);
  const [timelineMode, setTimelineMode] = useState<'both' | 'vietnam' | 'world' | null>(null);
  
  const [viewingEvent, setViewingEvent] = useState<HistoricalEvent | null>(null);
  const [viewingFigure, setViewingFigure] = useState<HistoricalFigure | null>(null);
  const [viewingHeritageEvent, setViewingHeritageEvent] = useState<HistoricalEvent | null>(null);
  const [discoveryEvent, setDiscoveryEvent] = useState<HistoricalEvent | null>(null);

  // DATA STATE - Fetched from Firestore
  const [historyStages, setHistoryStages] = useState<HistoryStage[]>([]);
  const [allFigures, setAllFigures] = useState<HistoricalFigure[]>([]);
  
  // Filtered states
  const [filteredStages, setFilteredStages] = useState<HistoryStage[]>([]);
  const [filteredVNFigures, setFilteredVNFigures] = useState<HistoricalFigure[]>([]);
  const [filteredWorldFigures, setFilteredWorldFigures] = useState<HistoricalFigure[]>([]);

  const [suggestions, setSuggestions] = useState<HistoricalEvent[]>([]);
  const [customTopic, setCustomTopic] = useState('');
  const [topicResult, setTopicResult] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [customEvents, setCustomEvents] = useState<HistoricalEvent[]>([]);
  
  const [isLoadingData, setIsLoadingData] = useState(true);

  // FETCH DATA FROM FIRESTORE
  useEffect(() => {
      if (!db) return;
      setIsLoadingData(true);

      // 1. Fetch Stages (Real-time listener to support immediate updates)
      const unsubStages = onSnapshot(collection(db, 'historyStages'), (snap: any) => {
          const stagesData = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as HistoryStage));
          // Sort stages by ID string logic (e.g. stage-1940s before stage-1950s)
          stagesData.sort((a: any, b: any) => a.id.localeCompare(b.id));
          setHistoryStages(stagesData);
      }, (error: any) => {
          console.error("Error fetching stages:", error);
      });

      // 2. Fetch Figures (One-time fetch usually enough for figures)
      getDocs(collection(db, 'historicalFigures')).then((snap: any) => {
          const figuresData = snap.docs.map((doc: any) => doc.data() as HistoricalFigure);
          setAllFigures(figuresData);
      });

      // 3. Fetch Custom Events (Legacy support & Real-time)
      const unsubCustom = onSnapshot(collection(db, 'customEvents'), (snap: any) => {
          const events = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as HistoricalEvent));
          setCustomEvents(events);
      });
      
      setIsLoadingData(false);
      return () => {
          unsubStages();
          unsubCustom();
      };
  }, []);

  // MERGE STAGES: Combine main stages with custom events AND SORT THEM
  const mergedStages = useMemo(() => {
      // Deep copy to avoid mutating state
      const stages = historyStages.map(s => ({
          ...s,
          vietnam: [...s.vietnam],
          world: [...s.world]
      }));

      // Merge custom events
      customEvents.forEach(ev => {
          const evAny = ev as any;
          if (evAny.stageId) {
              const targetStage = stages.find(s => s.id === evAny.stageId);
              if (targetStage) {
                  if (evAny.type === 'world') {
                      targetStage.world.push(ev);
                  } else {
                      targetStage.vietnam.push(ev);
                  }
              }
          }
      });

      // --- AUTO SORTING LOGIC ---
      stages.forEach(stage => {
          stage.vietnam.sort((a, b) => calculateDateValue(a.year) - calculateDateValue(b.year));
          stage.world.sort((a, b) => calculateDateValue(a.year) - calculateDateValue(b.year));
      });

      return stages;
  }, [historyStages, customEvents]);

  const findEventById = (id: string): HistoricalEvent | null => {
      // Search in merged stages
      for (const stage of mergedStages) {
          const found = [...stage.vietnam, ...stage.world].find(e => e.id === id);
          if (found) return found;
      }
      return null;
  };

  const findFigureById = (id: string): HistoricalFigure | null => {
      return allFigures.find(f => f.id === id) || null;
  };

  // Sync state with URL params
  useEffect(() => {
      const view = searchParams.get('view') as ViewMode;
      const id = searchParams.get('id');
      const mode = searchParams.get('mode') as 'both' | 'vietnam' | 'world' | null;

      if (view) {
          setCurrentView(view);
          if (view === 'event-detail' && id) {
              const ev = findEventById(id);
              if (ev) setViewingEvent(ev);
          } else if (view === 'figure-detail' && id) {
              const fig = findFigureById(id);
              if (fig) setViewingFigure(fig);
          } else if (view === 'topic-detail' && id) {
              setSelectedTopic(id as TopicId);
          } else if (view === 'vn-events' || view === 'world-events') {
              setTimelineMode(mode || (view === 'vn-events' ? 'vietnam' : 'world'));
          }
      } else {
          setCurrentView('menu');
          setTimelineMode(null);
          setViewingEvent(null);
          setViewingFigure(null);
          setSelectedTopic(null);
      }
      
      const stageId = searchParams.get('stageId');
      if (!stageId) {
          window.scrollTo(0, 0);
      }
  }, [searchParams, mergedStages, allFigures]); // Depend on mergedStages

  // Effect for scrolling to stageId if present
  useEffect(() => {
      const stageId = searchParams.get('stageId');
      if (stageId && !isLoadingData && mergedStages.length > 0) {
          // Small delay to ensure DOM is rendered
          const timer = setTimeout(() => {
              const element = document.getElementById(stageId);
              if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  // Add a highlight effect
                  element.classList.add('ring-2', 'ring-history-gold', 'ring-offset-4', 'rounded-xl');
                  setTimeout(() => {
                      element.classList.remove('ring-2', 'ring-history-gold', 'ring-offset-4');
                  }, 3000);
              }
          }, 500);
          return () => clearTimeout(timer);
      }
  }, [searchParams, isLoadingData, mergedStages]);

  const navigateTo = (view: ViewMode, extraParams: Record<string, string> = {}) => {
      setSearchParams({ view, ...extraParams });
  };

  const handleTopicClick = (topicId: TopicId) => {
    navigateTo('topic-detail', { id: topicId || '' });
  };

  const handleViewEventDetail = (event: HistoricalEvent) => {
      navigateTo('event-detail', { id: event.id });
  };

  const handleViewFigureDetail = (figure: HistoricalFigure) => {
      navigateTo('figure-detail', { id: figure.id });
  };

  const handleBack = () => {
      switch (currentView) {
          case 'vn-events':
          case 'world-events':
          case 'vn-figures':
          case 'world-figures':
          case 'topics':
              setSearchParams({}); // Go to menu
              break;
          case 'topic-detail':
              navigateTo('topics');
              break;
          case 'event-detail':
              if (selectedTopic) {
                  navigateTo('topic-detail', { id: selectedTopic });
              } else if (timelineMode) {
                  navigateTo(timelineMode === 'vietnam' ? 'vn-events' : 'world-events', { mode: timelineMode });
              } else {
                  setSearchParams({}); 
              }
              break;
          case 'figure-detail':
              if (viewingFigure) {
                  if (viewingFigure.nationality === 'vietnam') navigateTo('vn-figures');
                  else navigateTo('world-figures');
              } else {
                  setSearchParams({}); 
              }
              break;
          default:
              if (currentView !== 'menu') setSearchParams({});
      }
  };

  const updateTimelineMode = (mode: 'both' | 'vietnam' | 'world') => {
      setTimelineMode(mode);
      // Also update URL to reflect mode change
      setSearchParams({ view: currentView, mode });
  };

  useEffect(() => {
      if (resetKey > 0 && currentView !== 'menu') {
          setSearchParams({});
      }
  }, [resetKey]);

  useEffect(() => {
    if (isLoadingData) return;

    const term = searchTerm.toLowerCase();
    
    // Filter suggestions based on merged data
    if (term.trim().length > 1) {
        const allEvents = mergedStages.flatMap(stage => [...stage.vietnam, ...stage.world]);
        const matched = allEvents.filter(e => e.title.toLowerCase().includes(term));
        setSuggestions(matched.slice(0, 5));
    } else {
        setSuggestions([]);
    }

    // Filter stages based on merged data
    // Note: mergedStages is already sorted, so filtering preserves the order
    const newStages = mergedStages.map(stage => ({
      ...stage,
      vietnam: stage.vietnam.filter(e => 
        e.title.toLowerCase().includes(term) || 
        e.description.toLowerCase().includes(term) ||
        e.year.includes(term)
      ),
      world: stage.world.filter(e => 
        e.title.toLowerCase().includes(term) || 
        e.description.toLowerCase().includes(term) ||
        e.year.includes(term)
      )
    })).filter(stage => stage.vietnam.length > 0 || stage.world.length > 0);
    setFilteredStages(newStages);

    setFilteredVNFigures(allFigures.filter(f => 
      f.nationality === 'vietnam' && (f.name.toLowerCase().includes(term) || f.description.toLowerCase().includes(term))
    ));
    setFilteredWorldFigures(allFigures.filter(f => 
      f.nationality === 'world' && (f.name.toLowerCase().includes(term) || f.description.toLowerCase().includes(term))
    ));
  }, [searchTerm, mergedStages, allFigures, isLoadingData]); // Changed dependency from historyStages to mergedStages

  const scrollToEvent = (eventId: string) => {
      const el = document.getElementById(`event-${eventId}`);
      if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-4', 'ring-yellow-400');
          setTimeout(() => el.classList.remove('ring-4', 'ring-yellow-400'), 2000);
      }
  };

  const handleCustomTopicSubmit = async () => {
      if (!customTopic.trim()) return;
      setIsSynthesizing(true);
      setTopicResult('');
      const result = await synthesizeHistoryTopic(customTopic);
      setTopicResult(result);
      setIsSynthesizing(false);
  };

  const getFilteredStagesForTopic = () => {
    // Use mergedStages instead of historyStages, they are already sorted
    switch (selectedTopic) {
      case 'vn-asean':
        return mergedStages.map(stage => {
           const vnEvents = stage.vietnam.filter(e => e.title.includes('ASEAN') || e.description.includes('ASEAN'));
           const worldEvents = stage.world.filter(e => e.title.includes('ASEAN') || e.description.includes('ASEAN'));
           return {
             ...stage,
             vietnam: [...vnEvents, ...worldEvents].sort((a,b) => calculateDateValue(a.year) - calculateDateValue(b.year)), 
             world: [] 
           };
        }).filter(stage => stage.vietnam.length > 0);

      case 'un':
         return mergedStages.map(stage => {
            const keyword = ['Liên Hợp Quốc', 'United Nations', 'LHQ'];
            const vnEvents = stage.vietnam.filter(e => keyword.some(k => e.title.includes(k) || e.description.includes(k)));
            const worldEvents = stage.world.filter(e => keyword.some(k => e.title.includes(k) || e.description.includes(k)));
            return {
              ...stage,
              vietnam: [],
              world: [...worldEvents, ...vnEvents].sort((a,b) => calculateDateValue(a.year) - calculateDateValue(b.year))
            };
         }).filter(stage => stage.world.length > 0);

      case 'ianta':
          return mergedStages.map(stage => {
            const keywords = ['I-an-ta', 'Yalta', 'Trật tự hai cực', 'Trật tự 2 cực', 'Marshall', 'SEV', 'NATO', 'Warszawa', 'Vác-sa-va', 'Xô - Mỹ', 'Malta', 'Liên Xô tan rã', 'Bức tường Berlin'];
            const worldEvents = stage.world.filter(e => keywords.some(k => e.title.includes(k) || e.description.includes(k)));
            return { ...stage, vietnam: [], world: worldEvents };
          }).filter(stage => stage.world.length > 0);

      case 'coldwar':
          return mergedStages.map(stage => {
            const keyword = ['Chiến tranh Lạnh', 'Truman', 'NATO', 'Warsaw', 'Xô viết', 'Mỹ', 'hòa hoãn', 'Bức màn sắt', 'Triều Tiên', 'Cuba'];
            const worldEvents = stage.world.filter(e => keyword.some(k => e.title.includes(k) || e.description.includes(k)) || e.title.includes('Liên Xô'));
            return { ...stage, vietnam: [], world: worldEvents };
          }).filter(stage => stage.world.length > 0);

      case 'phap':
         return mergedStages.filter(stage => {
            return stage.period.includes('1946') || stage.period.includes('1945 - 1954') || stage.period.includes('1940 - 1949') || stage.period.includes('1950 - 1959');
         }).map(stage => ({
            ...stage,
            vietnam: stage.vietnam.filter(e => {
                const y = calculateDateValue(e.year);
                return y >= 19450000 && y <= 19541231;
            }),
            world: []
         })).filter(s => s.vietnam.length > 0);

      case 'my':
          return mergedStages.filter(stage => {
              return stage.period.includes('1950 - 1959') || stage.period.includes('1960 - 1969') || stage.period.includes('1970 - 1979');
          }).map(stage => ({
              ...stage,
              vietnam: stage.vietnam.filter(e => {
                  const y = calculateDateValue(e.year);
                  return y >= 19540000 && y <= 19751231;
              }),
              world: []
          })).filter(s => s.vietnam.length > 0);
      
      default:
        return [];
    }
  };

  const renderHeader = (title: string, showModeToggle = false, showBackButton = false) => (
      <div className="relative bg-[#2a1b18] text-white shadow-md overflow-hidden mb-4 group">
          <div className="absolute inset-0 z-0 opacity-20 mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          <div className="absolute inset-0 z-0 opacity-40 group-hover:opacity-50 transition-opacity">
              <EditableImage 
                  imageId="timeline-header-bg"
                  initialSrc="" 
                  alt="Header Background"
                  className="w-full h-full object-cover"
                  disableEdit={true}
              />
          </div>
          <div className="absolute inset-0 z-0 bg-black/60 pointer-events-none"></div>

          {showBackButton && (
              <button 
                  onClick={handleBack}
                  className="absolute top-6 left-4 md:left-8 z-20 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-sm shadow-md border border-white/20"
                  title="Quay lại"
              >
                  <ArrowLeft size={24} />
              </button>
          )}

          <div className="relative z-10 py-8 md:py-12 px-4 text-center">
              <h1 className="text-3xl md:text-5xl font-bold font-serif text-history-gold mb-4 drop-shadow-lg px-12 tracking-tight">
                  {title}
              </h1>
              {currentView === 'menu' && (
                  <p className="text-gray-200 mt-2 max-w-2xl mx-auto text-sm md:text-base drop-shadow-sm font-medium">
                      Khám phá kho tàng kiến thức lịch sử qua các sự kiện và nhân vật tiêu biểu.
                  </p>
              )}
              
              {showModeToggle && (
                  <div className="mt-6 flex justify-center">
                      <div className="inline-flex p-1 bg-black/40 backdrop-blur-md rounded-xl border border-white/30 shadow-2xl relative">
                          <button 
                              onClick={() => updateTimelineMode('vietnam')}
                              className={`relative z-10 px-6 py-2 rounded-lg text-xs font-black transition-colors uppercase tracking-widest ${timelineMode === 'vietnam' ? 'text-white' : 'text-white/70 hover:text-white'}`}
                          >
                              {timelineMode === 'vietnam' && (
                                  <motion.div 
                                      layoutId="active-pill"
                                      className="absolute inset-0 bg-history-red rounded-lg shadow-lg -z-10"
                                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                  />
                              )}
                              Việt Nam
                          </button>
                          <button 
                              onClick={() => updateTimelineMode('world')}
                              className={`relative z-10 px-6 py-2 rounded-lg text-xs font-black transition-colors uppercase tracking-widest ${timelineMode === 'world' ? 'text-white' : 'text-white/70 hover:text-white'}`}
                          >
                              {timelineMode === 'world' && (
                                  <motion.div 
                                      layoutId="active-pill"
                                      className="absolute inset-0 bg-blue-600 rounded-lg shadow-lg -z-10"
                                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                  />
                              )}
                              Thế Giới
                          </button>
                          <button 
                              onClick={() => updateTimelineMode('both')}
                              className={`relative z-10 px-6 py-2 rounded-lg text-xs font-black transition-colors uppercase tracking-widest flex items-center gap-2 ${timelineMode === 'both' ? 'text-history-dark' : 'text-white/70 hover:text-white'}`}
                          >
                              {timelineMode === 'both' && (
                                  <motion.div 
                                      layoutId="active-pill"
                                      className="absolute inset-0 bg-history-gold rounded-lg shadow-lg -z-10"
                                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                  />
                              )}
                              <Columns size={14}/> Song song
                          </button>
                      </div>
                  </div>
              )}
          </div>
      </div>
  );

  const getTimelineTitle = (defaultTitle: string) => {
      if (timelineMode === 'both') return 'Song Song: VN & TG';
      if (timelineMode === 'vietnam') return 'Lịch Sử Việt Nam';
      if (timelineMode === 'world') return 'Lịch Sử Thế Giới';
      return defaultTitle;
  };

  const renderSuggestions = () => {
      if (suggestions.length === 0 || currentView === 'menu') return null;
      return (
          <div className="max-w-[1400px] mx-auto px-4 mb-4 animate-slide-up">
              <div className="bg-white p-4 rounded-2xl border border-history-gold/30 shadow-md">
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                      <Zap size={14} className="text-history-gold"/> Gợi ý nhanh
                  </h4>
                  <div className="flex flex-wrap gap-2">
                      {suggestions.map(ev => (
                          <button 
                            key={ev.id}
                            onClick={() => scrollToEvent(ev.id)}
                            className="text-sm bg-gray-50 hover:bg-yellow-50 text-gray-700 hover:text-history-dark border border-gray-200 hover:border-yellow-200 rounded-lg px-3 py-1.5 transition-all truncate max-w-[200px]"
                          >
                              {ev.title}
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      );
  };

  if (isLoadingData) {
      return <div className="min-h-screen flex items-center justify-center bg-history-paper text-history-gold animate-fade-in">
          <Loader2 size={48} className="animate-spin mb-4" />
      </div>;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'menu':
        return (
          <>
            {renderHeader('Khám Phá Lịch Sử')}
            <div className="max-w-6xl mx-auto px-4 py-6 md:py-10 animate-fade-in">
                <h2 className="text-xl md:text-2xl font-bold text-history-dark mb-8 font-serif">Danh mục khám phá</h2>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                    {/* Sự Kiện Việt Nam */}
                    <div 
                        onClick={() => navigateTo('vn-events', { mode: 'vietnam' })} 
                        className="group relative bg-[#f4978e] rounded-[2.5rem] p-6 md:p-8 cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-2 h-48 md:h-64 overflow-hidden flex flex-col justify-between shadow-lg shadow-rose-200/50"
                    >
                        <div className="w-10 h-10 md:w-14 md:h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white">
                            <BookOpen size={28} className="md:w-8 md:h-8" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-lg md:text-2xl font-black text-white leading-tight">Sự Kiện<br/>Việt Nam</h3>
                            <p className="text-white/80 text-[10px] md:text-xs font-bold uppercase tracking-wider mt-1">Lịch sử nước nhà</p>
                        </div>
                        <div className="absolute -bottom-6 -right-6 opacity-10 text-white transform rotate-12 group-hover:scale-110 transition-transform duration-700">
                            <BookOpen size={160} />
                        </div>
                    </div>

                    {/* Sự Kiện Thế Giới */}
                    <div 
                        onClick={() => navigateTo('world-events', { mode: 'world' })} 
                        className="group relative bg-[#84a59d] rounded-[2.5rem] p-6 md:p-8 cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-2 h-48 md:h-64 overflow-hidden flex flex-col justify-between shadow-lg shadow-teal-200/50"
                    >
                        <div className="w-10 h-10 md:w-14 md:h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white">
                            <Globe size={28} className="md:w-8 md:h-8" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-lg md:text-2xl font-black text-white leading-tight">Sự Kiện<br/>Thế Giới</h3>
                            <p className="text-white/80 text-[10px] md:text-xs font-bold uppercase tracking-wider mt-1">Toàn cảnh nhân loại</p>
                        </div>
                        <div className="absolute -bottom-6 -right-6 opacity-10 text-white transform -rotate-12 group-hover:scale-110 transition-transform duration-700">
                            <Globe size={160} />
                        </div>
                    </div>

                    {/* Nhân Vật Việt Nam */}
                    <div 
                        onClick={() => navigateTo('vn-figures')} 
                        className="group relative bg-[#fbc4ab] rounded-[2.5rem] p-6 md:p-8 cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-2 h-48 md:h-64 overflow-hidden flex flex-col justify-between shadow-lg shadow-orange-200/50"
                    >
                        <div className="w-10 h-10 md:w-14 md:h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white">
                            <Users size={28} className="md:w-8 md:h-8" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-lg md:text-2xl font-black text-white leading-tight">Nhân Vật<br/>Việt Nam</h3>
                            <p className="text-white/80 text-[10px] md:text-xs font-bold uppercase tracking-wider mt-1">Anh hùng hào kiệt</p>
                        </div>
                        <div className="absolute -bottom-6 -right-6 opacity-10 text-white transform rotate-45 group-hover:scale-110 transition-transform duration-700">
                            <Star size={160} className="fill-current" />
                        </div>
                    </div>

                    {/* Nhân Vật Thế Giới */}
                    <div 
                        onClick={() => navigateTo('world-figures')} 
                        className="group relative bg-[#f2cc8f] rounded-[2.5rem] p-6 md:p-8 cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-2 h-48 md:h-64 overflow-hidden flex flex-col justify-between shadow-lg shadow-yellow-200/50"
                    >
                        <div className="w-10 h-10 md:w-14 md:h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white">
                            <GraduationCap size={28} className="md:w-8 md:h-8" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-lg md:text-2xl font-black text-white leading-tight">Nhân Vật<br/>Thế Giới</h3>
                            <p className="text-white/80 text-[10px] md:text-xs font-bold uppercase tracking-wider mt-1">Vĩ nhân thời đại</p>
                        </div>
                        <div className="absolute -bottom-6 -right-6 opacity-10 text-white transform -rotate-12 group-hover:scale-110 transition-transform duration-700">
                            <GraduationCap size={160} />
                        </div>
                    </div>
                </div>
                
                {/* Chuyên đề Section */}
                <div 
                    onClick={() => navigateTo('topics')} 
                    className="group relative bg-[#ece4db] rounded-[2.5rem] p-6 md:p-8 cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-1 overflow-hidden flex items-center gap-6 shadow-lg shadow-stone-200/50"
                >
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-white/30 backdrop-blur-md rounded-2xl flex items-center justify-center text-stone-700 shrink-0">
                        <FolderOpen size={32} className="md:w-10 md:h-10" />
                    </div>
                    <div className="flex-1 relative z-10">
                        <h3 className="text-lg md:text-3xl font-black text-stone-800 leading-tight">Các Chuyên Đề Lịch Sử 12</h3>
                        <p className="text-stone-600/80 text-xs md:text-base font-bold mt-1">ASEAN, Kháng chiến, Chiến tranh lạnh, Liên Hợp Quốc...</p>
                    </div>
                    <div className="absolute -right-10 -bottom-10 opacity-5 text-stone-900 transform -rotate-12 group-hover:scale-110 transition-transform duration-700">
                        <FolderOpen size={240} />
                    </div>
                    <div className="text-stone-700 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 hidden md:block relative z-10">
                        <ArrowLeft className="rotate-180" size={32} />
                    </div>
                </div>
            </div>
          </>
        );
      
      case 'vn-events':
        return (
            <>
                {renderHeader(getTimelineTitle('Lịch Sử Việt Nam'), true, true)}
                {renderSuggestions()}
                <TimelineSection 
                    key="vn-events" 
                    stages={filteredStages} // Uses merged stages now
                    onAskAI={onAskAI} 
                    onViewDetail={handleViewEventDetail}
                    onViewHeritage={(ev) => setViewingHeritageEvent(ev)} 
                    onViewDiscovery={(ev) => setDiscoveryEvent(ev)} 
                    displayMode={timelineMode || 'vietnam'} 
                    viewType="default" 
                    onBack={handleBack}
                    searchTerm={searchTerm}
                />
            </>
        );
      
      case 'world-events':
        return (
            <>
                {renderHeader(getTimelineTitle('Lịch Sử Thế Giới'), true, true)}
                {renderSuggestions()}
                <TimelineSection 
                    key="world-events" 
                    stages={filteredStages} // Uses merged stages now
                    onAskAI={onAskAI} 
                    onViewDetail={handleViewEventDetail} 
                    onViewHeritage={(ev) => setViewingHeritageEvent(ev)}
                    onViewDiscovery={(ev) => setDiscoveryEvent(ev)} 
                    displayMode={timelineMode || 'world'} 
                    viewType="default" 
                    onBack={handleBack}
                    searchTerm={searchTerm}
                />
            </>
        );
      
      case 'vn-figures':
        return (
            <>
                {renderHeader('Nhân Vật Việt Nam', false, true)}
                <HistoricalFiguresSection key="vn-figures" figures={filteredVNFigures} type="vietnam" onViewDetail={handleViewFigureDetail} onBack={handleBack} />
            </>
        );

      case 'world-figures':
        return (
            <>
                {renderHeader('Nhân Vật Thế Giới', false, true)}
                <HistoricalFiguresSection key="world-figures" figures={filteredWorldFigures} type="world" onViewDetail={handleViewFigureDetail} onBack={handleBack} />
            </>
        );

      case 'topics':
        return (
          <div className="animate-fade-in">
             {renderHeader('Chuyên Đề Lịch Sử 12', false, true)}
             <div className="max-w-6xl mx-auto px-4 py-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* Cột Chuyên đề Việt Nam */}
                    <div className="space-y-4">
                        <h3 className="text-lg md:text-xl font-bold text-[#f4978e] border-b-2 border-[#f4978e] pb-2 mb-4 flex items-center gap-2"><Flag size={20} /> Chuyên đề Việt Nam</h3>
                        <div onClick={() => handleTopicClick('vn-asean')} className="bg-[#fbc4ab]/20 p-4 md:p-5 rounded-2xl shadow-sm border border-[#fbc4ab]/30 hover:shadow-md hover:bg-[#fbc4ab]/40 cursor-pointer transition-all flex items-center gap-4">
                            <div className="bg-[#fbc4ab] p-2 md:p-3 rounded-xl text-white shrink-0 shadow-sm"><Globe size={20} className="md:w-6 md:h-6" /></div>
                            <div><h4 className="font-bold text-gray-800 text-sm md:text-base">Việt Nam - ASEAN</h4><p className="text-xs text-gray-600">Quá trình gia nhập và đóng góp của VN</p></div>
                        </div>
                        <div onClick={() => handleTopicClick('phap')} className="bg-[#f4978e]/20 p-4 md:p-5 rounded-2xl shadow-sm border border-[#f4978e]/30 hover:shadow-md hover:bg-[#f4978e]/40 cursor-pointer transition-all flex items-center gap-4">
                            <div className="bg-[#f4978e] p-2 md:p-3 rounded-xl text-white shrink-0 shadow-sm"><Target size={20} className="md:w-6 md:h-6" /></div>
                            <div><h4 className="font-bold text-gray-800 text-sm md:text-base">Kháng Chiến Chống Pháp</h4><p className="text-xs text-gray-600">Giai đoạn 1945 - 1954</p></div>
                        </div>
                        <div onClick={() => handleTopicClick('my')} className="bg-[#f4978e]/20 p-4 md:p-5 rounded-2xl shadow-sm border border-[#f4978e]/30 hover:shadow-md hover:bg-[#f4978e]/40 cursor-pointer transition-all flex items-center gap-4">
                            <div className="bg-[#f4978e] p-2 md:p-3 rounded-xl text-white shrink-0 shadow-sm"><Target size={20} className="md:w-6 md:h-6" /></div>
                            <div><h4 className="font-bold text-gray-800 text-sm md:text-base">Kháng Chiến Chống Mỹ</h4><p className="text-xs text-gray-600">Giai đoạn 1954 - 1975</p></div>
                        </div>
                    </div>

                    {/* Cột Chuyên đề Thế giới */}
                    <div className="space-y-4">
                        <h3 className="text-lg md:text-xl font-bold text-[#84a59d] border-b-2 border-[#84a59d] pb-2 mb-4 flex items-center gap-2"><Globe size={20} /> Chuyên đề Thế giới</h3>
                        <div onClick={() => handleTopicClick('ianta')} className="bg-[#f2cc8f]/20 p-4 md:p-5 rounded-2xl shadow-sm border border-[#f2cc8f]/30 hover:shadow-md hover:bg-[#f2cc8f]/40 cursor-pointer transition-all flex items-center gap-4">
                            <div className="bg-[#f2cc8f] p-2 md:p-3 rounded-xl text-white shrink-0 shadow-sm"><Anchor size={20} className="md:w-6 md:h-6" /></div>
                            <div><h4 className="font-bold text-gray-800 text-sm md:text-base">Trật tự 2 cực I-an-ta</h4><p className="text-xs text-gray-600">Sự hình thành trật tự thế giới mới sau CTTG 2</p></div>
                        </div>
                        <div onClick={() => handleTopicClick('coldwar')} className="bg-[#84a59d]/20 p-4 md:p-5 rounded-2xl shadow-sm border border-[#84a59d]/30 hover:shadow-md hover:bg-[#84a59d]/40 cursor-pointer transition-all flex items-center gap-4">
                            <div className="bg-[#84a59d] p-2 md:p-3 rounded-xl text-white shrink-0 shadow-sm"><Layout size={20} className="md:w-6 md:h-6" /></div>
                            <div><h4 className="font-bold text-gray-800 text-sm md:text-base">Chiến Tranh Lạnh</h4><p className="text-xs text-gray-600">Cuộc đối đầu Xô - Mỹ (1947 - 1989)</p></div>
                        </div>
                        <div onClick={() => handleTopicClick('un')} className="bg-[#84a59d]/20 p-4 md:p-5 rounded-2xl shadow-sm border border-[#84a59d]/30 hover:shadow-md hover:bg-[#84a59d]/40 cursor-pointer transition-all flex items-center gap-4">
                            <div className="bg-[#84a59d] p-2 md:p-3 rounded-xl text-white shrink-0 shadow-sm"><Globe size={20} className="md:w-6 md:h-6" /></div>
                            <div><h4 className="font-bold text-gray-800 text-sm md:text-base">Liên Hợp Quốc</h4><p className="text-xs text-gray-600">Tổ chức quốc tế lớn nhất hành tinh</p></div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 bg-[#ece4db]/30 p-6 md:p-8 rounded-3xl border border-[#ece4db]">
                    <h3 className="text-xl font-bold font-serif text-stone-800 mb-4 flex items-center gap-2"><Search size={24} /> Tra cứu nhanh chủ đề khác</h3>
                    <div className="flex flex-col md:flex-row gap-4">
                        <input 
                            type="text" 
                            value={customTopic}
                            onChange={(e) => setCustomTopic(e.target.value)}
                            placeholder="Nhập chủ đề muốn tìm hiểu (VD: Phong trào Cần Vương)..."
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:border-history-gold outline-none bg-white text-gray-800"
                            onKeyDown={(e) => e.key === 'Enter' && handleCustomTopicSubmit()}
                        />
                        <button onClick={handleCustomTopicSubmit} disabled={isSynthesizing || !customTopic.trim()} className="px-6 py-3 bg-history-dark text-history-gold font-bold rounded-xl hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                            {isSynthesizing ? <Loader2 className="animate-spin" /> : 'Tổng hợp kiến thức'}
                        </button>
                    </div>
                    {topicResult && (
                        <div className="mt-6 bg-white p-6 rounded-2xl border border-gray-200 animate-slide-up">
                            <div className="flex justify-between items-start mb-4">
                                <h4 className="font-bold text-lg text-history-red uppercase">{customTopic}</h4>
                                <button onClick={() => setTopicResult('')}><X size={20} className="text-gray-400 hover:text-red-500" /></button>
                            </div>
                            <div className="text-gray-700 leading-relaxed text-sm md:text-base space-y-2">
                                <SimpleMarkdown text={topicResult} />
                            </div>
                        </div>
                    )}
                </div>
             </div>
          </div>
        );

      case 'topic-detail':
        const stagesForTopic = getFilteredStagesForTopic();
        let topicDefaultNote = "";
        if (selectedTopic === 'un') topicDefaultNote = UN_TOPIC_CONTENT;
        else if (selectedTopic === 'vn-asean') topicDefaultNote = ASEAN_TOPIC_CONTENT;

        return (
            <>
                {renderHeader(`Chuyên Đề: ${selectedTopic === 'vn-asean' ? 'Việt Nam & ASEAN' : (selectedTopic === 'un' ? 'Liên Hợp Quốc' : (selectedTopic === 'ianta' ? 'Trật tự I-an-ta' : (selectedTopic === 'coldwar' ? 'Chiến Tranh Lạnh' : (selectedTopic === 'phap' ? 'Kháng Chiến Chống Pháp' : 'Kháng Chiến Chống Mỹ'))))}`, false, true)}
                {renderSuggestions()}
                <TimelineSection 
                    key={`topic-${selectedTopic}`} 
                    stages={stagesForTopic} 
                    onAskAI={onAskAI} 
                    displayMode={selectedTopic === 'un' || selectedTopic === 'ianta' || selectedTopic === 'coldwar' ? 'world' : 'vietnam'} 
                    onViewDetail={handleViewEventDetail}
                    onViewHeritage={(ev) => setViewingHeritageEvent(ev)}
                    onViewDiscovery={(ev) => setDiscoveryEvent(ev)} 
                    onBack={handleBack}
                    viewType="topic"
                    topicId={selectedTopic || undefined}
                    defaultNote={topicDefaultNote}
                    searchTerm={searchTerm}
                />
            </>
        );

      case 'event-detail':
        return (
            <EventDetailPage event={viewingEvent} onBack={handleBack} />
        );

      case 'figure-detail':
        return (
            <FigureDetailPage figure={viewingFigure} onBack={handleBack} />
        );

      default:
        return <div>Trang không tồn tại</div>;
    }
  };

  return (
    <div className="min-h-screen bg-history-paper">
      {renderContent()}
      
      {viewingHeritageEvent && <HeritageModal event={viewingHeritageEvent} onClose={() => setViewingHeritageEvent(null)} />}
      {discoveryEvent && <DiscoveryModal locations={discoveryEvent.relatedLocations || []} onClose={() => setDiscoveryEvent(null)} eventId={discoveryEvent.id} />}
    </div>
  );
};

export default TimelinePage;
