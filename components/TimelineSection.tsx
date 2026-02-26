
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HistoryStage, HistoricalEvent } from '../types';
import EventCard from './EventCard';
import { ArrowLeft, Plus, Info, Calendar, Edit2, Settings, ArrowUp, X, Check, Loader2, FileText, Video, ChevronUp, ChevronDown } from 'lucide-react';
import EditableText from './EditableText';
import EditableImage from './EditableImage';
import EditableMaterials from './EditableMaterials';
import ConfirmationModal from './ConfirmationModal';
import { db, auth, collection, addDoc, onSnapshot, doc, updateDoc, setDoc, arrayUnion, getDoc } from '../firebaseConfig';
import { ADMIN_UIDS } from '../services/cloudinaryService';
import { useToast } from '../contexts/ToastContext';

interface TimelineSectionProps {
  stages: HistoryStage[];
  onAskAI: (event: HistoricalEvent) => void;
  onViewDetail?: (event: HistoricalEvent) => void;
  onViewHeritage?: (event: HistoricalEvent) => void;
  onViewDiscovery?: (event: HistoricalEvent) => void; 
  displayMode: 'both' | 'vietnam' | 'world';
  onBack?: () => void;
  viewType?: 'default' | 'topic'; 
  topicId?: string; 
  defaultNote?: string; 
  searchTerm?: string;
}

const Portal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
};

const TimelineSection: React.FC<TimelineSectionProps> = ({ 
    stages: initialStages, 
    onAskAI, 
    onViewDetail, 
    onViewHeritage, 
    onViewDiscovery, 
    displayMode, 
    onBack, 
    viewType = 'default', 
    topicId, 
    defaultNote, 
    searchTerm = "" 
}) => {
  const { showToast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [stages, setStages] = useState<HistoryStage[]>(initialStages);
  const [hiddenItemIds, setHiddenItemIds] = useState<string[]>([]);
  
  // Event Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<HistoricalEvent | null>(null);
  
  // Stage Modal States
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [stageForm, setStageForm] = useState({ title: '', period: '', id: '' });

  // Edit/Add Event Context
  const [activeStageId, setActiveStageId] = useState<string>(''); 
  const [activeType, setActiveType] = useState<'vietnam' | 'world'>('vietnam');
  const [editingEvent, setEditingEvent] = useState<HistoricalEvent | null>(null);

  // Event Form States
  const [formTitle, setFormTitle] = useState('');
  const [formYear, setFormYear] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // UX States
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [expandedSummaries, setExpandedSummaries] = useState<Record<string, boolean>>({});
  const [isGlobalOverviewExpanded, setIsGlobalOverviewExpanded] = useState(false); 

  useEffect(() => {
    const unsubscribe = auth?.onAuthStateChanged((user: any) => {
      setIsAdmin(!!user && ADMIN_UIDS.includes(user.uid));
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  useEffect(() => {
      if(!db) return;
      const unsub = onSnapshot(collection(db, 'hiddenItems'), (snap: any) => { setHiddenItemIds(snap.docs.map((d: any) => d.id)); });
      return () => unsub();
  }, []);

  useEffect(() => { setStages(initialStages); }, [initialStages]);

  useEffect(() => {
      const handleScroll = () => {
          if (window.scrollY > 300) setShowScrollTop(true);
          else setShowScrollTop(false);
      };
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const toggleSummary = (stageId: string) => {
      setExpandedSummaries(prev => ({ ...prev, [stageId]: !prev[stageId] }));
  };

  // --- EVENT MANAGEMENT ---

  const openAddModal = (stageId: string, type: 'vietnam' | 'world') => {
      setActiveStageId(stageId);
      setActiveType(type);
      setEditingEvent(null);
      setFormTitle('');
      setFormYear('');
      setFormDesc('');
      setIsModalOpen(true);
  };

  const openEditModal = (event: HistoricalEvent, stageId: string, type: 'vietnam' | 'world') => {
      setActiveStageId(stageId);
      setActiveType(type);
      setEditingEvent(event);
      setFormTitle(event.title);
      setFormYear(event.year);
      setFormDesc(event.description);
      setIsModalOpen(true);
  };

  const handleSaveEvent = async () => {
      if(!formTitle || !formYear) {
          showToast("Vui lòng nhập tên sự kiện và thời gian", "error");
          return;
      }
      setIsSaving(true);
      try {
          if(db) {
              const stageRef = doc(db, 'historyStages', activeStageId);
              const fieldToUpdate = activeType === 'world' ? 'world' : 'vietnam';

              if (editingEvent) {
                  // Edit Existing Event
                  const docSnap = await getDoc(stageRef);
                  if (docSnap.exists()) {
                      const data = docSnap.data();
                      const currentArray = data[fieldToUpdate] as HistoricalEvent[];
                      const updatedArray = currentArray.map(item => {
                          if (item.id === editingEvent.id) {
                              return { ...item, title: formTitle, year: formYear, description: formDesc };
                          }
                          return item;
                      });
                      await updateDoc(stageRef, { [fieldToUpdate]: updatedArray });
                      showToast("Cập nhật sự kiện thành công!", "success");
                  }
              } else {
                  // Add New Event
                  const newEvent = {
                      id: Date.now().toString(),
                      title: formTitle,
                      year: formYear,
                      description: formDesc,
                      image: "",
                  };
                  await updateDoc(stageRef, { [fieldToUpdate]: arrayUnion(newEvent) });
                  showToast("Thêm sự kiện thành công!", "success");
              }
          }
          setIsModalOpen(false);
          setFormTitle(''); setFormYear(''); setFormDesc('');
      } catch (e: any) { 
          showToast("Lỗi: " + e.message, "error"); 
      } finally { 
          setIsSaving(false); 
      }
  };

  const confirmDelete = (event: HistoricalEvent) => {
      setItemToDelete(event);
      setIsDeleteModalOpen(true);
  };

  const handleDeleteEvent = async () => {
      if(!itemToDelete || !db) return;
      try {
          await setDoc(doc(db, 'hiddenItems', itemToDelete.id), { deletedAt: new Date(), deletedBy: auth?.currentUser?.email });
          setIsDeleteModalOpen(false);
          setItemToDelete(null);
          showToast("Đã xóa sự kiện.", "info");
      } catch (e: any) { showToast("Lỗi xóa: " + e.message, "error"); }
  };

  // --- STAGE MANAGEMENT ---

  const openAddStageModal = () => {
      setEditingStageId(null);
      setStageForm({ title: '', period: '', id: `stage-${Date.now()}` });
      setIsStageModalOpen(true);
  };

  const openEditStageModal = (stage: HistoryStage) => {
      setEditingStageId(stage.id);
      setStageForm({ title: stage.title, period: stage.period, id: stage.id });
      setIsStageModalOpen(true);
  };

  const handleSaveStage = async () => {
      if (!stageForm.title || !stageForm.period) {
          showToast("Vui lòng nhập tên giai đoạn và thời gian", "error");
          return;
      }
      setIsSaving(true);
      try {
          if (db) {
              if (editingStageId) {
                  await updateDoc(doc(db, 'historyStages', editingStageId), {
                      title: stageForm.title,
                      period: stageForm.period
                  });
                  showToast("Cập nhật thông tin giai đoạn thành công!", "success");
              } else {
                  await setDoc(doc(db, 'historyStages', stageForm.id), {
                      title: stageForm.title,
                      period: stageForm.period,
                      vietnam: [],
                      world: [],
                      createdAt: new Date()
                  });
                  showToast("Thêm giai đoạn mới thành công!", "success");
              }
          }
          setIsStageModalOpen(false);
      } catch (e: any) {
          showToast("Lỗi: " + e.message, "error");
      } finally {
          setIsSaving(false);
      }
  };

  // Render logic
  const isComparisonMode = displayMode === 'both';
  const showLogo = topicId === 'un' || topicId === 'vn-asean';

  const renderStagesContent = () => (
      <div className="space-y-16 min-h-[500px]">
          {stages.map((stage) => {
              const hasVNEvents = stage.vietnam.length > 0;
              const hasWorldEvents = stage.world.length > 0;
              
              if (displayMode === 'vietnam' && !hasVNEvents && !isAdmin) return null;
              if (displayMode === 'world' && !hasWorldEvents && !isAdmin) return null;
              if (displayMode === 'both' && !hasVNEvents && !hasWorldEvents && !isAdmin) return null;

              const visibleVN = stage.vietnam.filter(e => !hiddenItemIds.includes(e.id));
              const visibleWorld = stage.world.filter(e => !hiddenItemIds.includes(e.id));
              const overviewId = `stage-desc-${stage.id}-${displayMode}`;
              const isSummaryExpanded = expandedSummaries[stage.id];

              return (
                  <div key={stage.id} className="group relative animate-slide-up">
                      {/* Stage Header */}
                      <div className="sticky top-[64px] z-40 bg-history-paper/95 backdrop-blur-md flex items-center justify-between mb-8 py-3 px-4 border border-history-gold/30 shadow-md transition-all rounded-2xl mx-1 md:mx-0">
                          <div className="flex items-center gap-3">
                              {onBack && (
                                  <button onClick={onBack} className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:text-history-red hover:bg-red-50 transition-colors ml-1 border border-gray-100 bg-white/50" title="Quay lại">
                                      <ArrowLeft size={20} />
                                  </button>
                              )}
                              <div className="bg-history-red text-white p-2 rounded-xl shadow-md shrink-0 flex items-center justify-center"><Calendar size={20} /></div>
                              <div>
                                  <span className="text-history-red font-black text-xl md:text-2xl font-serif tracking-tight block leading-none">
                                      {stage.period}
                                  </span>
                                  <div className="block mt-0.5">
                                      <h2 className="text-sm md:text-base font-medium text-gray-500 font-serif leading-tight line-clamp-1">{stage.title}</h2>
                                  </div>
                              </div>
                          </div>
                          
                          {/* Edit Stage Button */}
                          {isAdmin && (
                              <button 
                                onClick={() => openEditStageModal(stage)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                title="Chỉnh sửa thông tin giai đoạn"
                              >
                                  <Edit2 size={18} />
                              </button>
                          )}
                      </div>

                      <div className={`grid grid-cols-1 ${!isComparisonMode && viewType !== 'topic' ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-8`}>
                          <div className={`${!isComparisonMode && viewType !== 'topic' ? 'lg:col-span-2' : ''} order-2 lg:order-1`}>
                              {!isComparisonMode ? (
                                  <div className="relative pl-4 md:pl-8 border-l-2 border-dashed border-gray-300 space-y-8">
                                      {isAdmin && (
                                          <div className="pl-4">
                                              <button onClick={() => openAddModal(stage.id, displayMode === 'vietnam' ? 'vietnam' : 'world')} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center gap-2 text-gray-500 hover:text-history-gold font-bold mb-8 transition-colors"><Plus size={20} /> Thêm sự kiện</button>
                                          </div>
                                      )}
                                      {(displayMode === 'vietnam' ? visibleVN : visibleWorld).map((event, idx) => (
                                          <div key={event.id} className="relative group/item">
                                              <div className={`absolute -left-[23px] md:-left-[39px] top-6 w-5 h-5 rounded-full border-4 border-history-paper shadow-md z-10 transition-transform duration-300 group-hover/item:scale-125 ${displayMode === 'vietnam' ? 'bg-history-red' : 'bg-blue-600'}`}></div>
                                              <EventCard 
                                                event={event} 
                                                type={displayMode === 'vietnam' ? 'vietnam' : 'world'} 
                                                onAskAI={onAskAI} 
                                                onViewDetail={onViewDetail} 
                                                onViewHeritage={onViewHeritage}
                                                onViewDiscovery={onViewDiscovery} 
                                                onDelete={confirmDelete} 
                                                onEdit={(ev) => openEditModal(ev, stage.id, displayMode === 'vietnam' ? 'vietnam' : 'world')}
                                                index={idx}
                                                searchTerm={searchTerm} 
                                              />
                                          </div>
                                      ))}
                                  </div>
                              ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                                      <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-history-gold/20 -translate-x-1/2 rounded-full"></div>
                                      
                                      <div className="space-y-6">
                                          <div className="sticky top-[145px] z-30 py-2">
                                              <h3 className="bg-white/95 backdrop-blur-sm text-sm font-bold text-history-red uppercase tracking-wide border border-red-100 shadow-sm rounded-2xl px-4 py-2 flex items-center gap-2 w-fit">
                                                  <span className="w-2 h-2 rounded-full bg-history-red animate-pulse"></span> Việt Nam
                                              </h3>
                                          </div>
                                          
                                          <div className="relative pl-4 md:pl-0 md:pr-4 space-y-6 border-l-2 md:border-l-0 border-gray-200">
                                              {visibleVN.map((event, idx) => (
                                                  <div key={event.id} className="relative">
                                                      <EventCard 
                                                        event={event} 
                                                        type="vietnam" 
                                                        onAskAI={onAskAI} 
                                                        onViewDetail={onViewDetail} 
                                                        onViewHeritage={onViewHeritage}
                                                        onViewDiscovery={onViewDiscovery} 
                                                        onDelete={confirmDelete} 
                                                        onEdit={(ev) => openEditModal(ev, stage.id, 'vietnam')}
                                                        index={idx}
                                                        searchTerm={searchTerm}
                                                      />
                                                  </div>
                                              ))}
                                          </div>
                                      </div>
                                      <div className="space-y-6">
                                          <div className="sticky top-[145px] z-30 py-2 md:flex md:justify-end">
                                              <h3 className="bg-white/95 backdrop-blur-sm text-sm font-bold text-blue-700 uppercase tracking-wide border border-blue-100 shadow-sm rounded-2xl px-4 py-2 flex items-center gap-2 w-fit">
                                                  <span className="w-2 h-2 rounded-full bg-blue-700 animate-pulse"></span> Thế Giới
                                              </h3>
                                          </div>

                                          <div className="relative pl-4 md:pl-4 space-y-6 border-l-2 border-gray-200 md:border-l-0">
                                              {visibleWorld.map((event, idx) => (
                                                  <div key={event.id} className="relative">
                                                      <EventCard 
                                                        event={event} 
                                                        type="world" 
                                                        onAskAI={onAskAI} 
                                                        onViewDetail={onViewDetail} 
                                                        onViewHeritage={onViewHeritage}
                                                        onViewDiscovery={onViewDiscovery} 
                                                        onDelete={confirmDelete}
                                                        onEdit={(ev) => openEditModal(ev, stage.id, 'world')}
                                                        index={idx}
                                                        searchTerm={searchTerm}
                                                      />
                                                  </div>
                                              ))}
                                          </div>
                                      </div>
                                  </div>
                              )}
                          </div>

                          {!isComparisonMode && viewType !== 'topic' && (
                              <div className="lg:col-span-1 space-y-6 order-1 lg:order-2">
                                  <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-5 lg:p-6 lg:sticky lg:top-[160px] z-30 transition-all">
                                      <div 
                                        className="flex justify-between items-center cursor-pointer lg:cursor-default"
                                        onClick={() => toggleSummary(stage.id)}
                                      >
                                          <h3 className="text-lg font-bold font-serif text-history-dark flex items-center gap-2">
                                              <Info size={18} className="text-history-gold" /> 
                                              Tổng quan ({displayMode === 'vietnam' ? 'Việt Nam' : 'Thế Giới'})
                                          </h3>
                                          <div className="lg:hidden text-gray-400">
                                              {isSummaryExpanded ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                                          </div>
                                      </div>

                                      <div className={`mt-4 ${isSummaryExpanded ? 'block' : 'hidden lg:block'} animate-fade-in`}>
                                          <div className="text-gray-700 text-sm leading-relaxed mb-6 text-justify border-t border-gray-100 pt-3 lg:border-t-0 lg:pt-0">
                                              <EditableText id={overviewId} tag="div" multiline defaultText={`Nội dung tóm tắt giai đoạn đang được cập nhật...`} />
                                          </div>
                                          <div className="border-t pt-4">
                                              <h4 className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Tài liệu tham khảo</h4>
                                              <EditableMaterials id={`${stage.id}-${displayMode}`} />
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
              );
          })}
          
          {/* Add New Stage Button (Admin Only) */}
          {isAdmin && viewType === 'default' && (
              <div className="flex justify-center pt-8 pb-12">
                  <button 
                    onClick={openAddStageModal}
                    className="group relative px-8 py-4 bg-white border-2 border-dashed border-gray-300 rounded-2xl hover:border-history-gold hover:shadow-lg transition-all flex flex-col items-center gap-2 text-gray-400 hover:text-history-dark"
                  >
                      <Plus size={32} className="text-gray-300 group-hover:text-history-gold transition-colors" />
                      <span className="font-bold uppercase tracking-wider text-xs">Thêm giai đoạn mới</span>
                  </button>
              </div>
          )}
      </div>
  );

  return (
    <div id="timeline" className="max-w-[1400px] mx-auto px-2 sm:px-6 lg:px-8 pb-10 relative">
      {viewType === 'topic' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start relative animate-fade-in pt-4">
              <div className="lg:col-span-2 order-2 lg:order-1">{renderStagesContent()}</div>
              {/* ... Topic Sidebar ... */}
              <div className="lg:col-span-1 order-1 lg:order-2 h-full mb-6 lg:mb-0">
                  <div className="sticky top-[100px] transition-all z-30">
                      <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden flex flex-col lg:max-h-[calc(100vh-120px)]">
                          <div 
                            className="bg-gradient-to-r from-history-dark to-gray-800 p-4 py-5 flex items-center justify-between gap-2 cursor-pointer lg:cursor-default shrink-0"
                            onClick={() => setIsGlobalOverviewExpanded(!isGlobalOverviewExpanded)}
                          >
                              <div className="flex items-center gap-2">
                                  <FileText size={20} className="text-history-gold" />
                                  <h3 className="font-bold text-white font-serif text-sm uppercase tracking-wide">
                                      <EditableText id="global-note-title" defaultText="Thông tin chuyên đề" />
                                  </h3>
                              </div>
                              <div className="lg:hidden text-gray-400">
                                  {isGlobalOverviewExpanded ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                              </div>
                          </div>
                          
                          <div className={`bg-white transition-all duration-300 overflow-y-auto custom-scrollbar ${isGlobalOverviewExpanded ? 'block max-h-[50vh]' : 'hidden lg:block'}`}>
                              <div className="p-5">
                                  {showLogo && (
                                      <div className="mb-6 w-40 h-40 md:w-60 md:h-60 rounded-[2.5rem] overflow-hidden border-2 border-gray-100 shadow-2xl mx-auto bg-white flex items-center justify-center transform hover:scale-105 transition-transform">
                                          <EditableImage imageId={`org-logo-${topicId}`} initialSrc="" alt="Logo" className="w-full h-full" />
                                      </div>
                                  )}
                                  
                                  <div className="mb-8">
                                      <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-widest flex items-center gap-2">
                                        <Info size={14} /> Tổng quan
                                      </h4>
                                      <EditableText id={`global-timeline-note-${topicId || displayMode}`} tag="div" multiline defaultText={defaultNote || "Nhập nội dung tổng quan..."} className="text-gray-800 text-sm md:text-base leading-relaxed text-justify whitespace-pre-line min-h-[100px]" />
                                  </div>

                                  <div className="border-t border-gray-100 pt-6">
                                      <div className="flex items-center gap-2 mb-4">
                                          <Video size={18} className="text-red-600" />
                                          <h3 className="font-bold text-gray-700 text-[10px] uppercase font-black tracking-widest">Tư liệu chuyên đề</h3>
                                      </div>
                                      <EditableMaterials id={`global-materials-${topicId || displayMode}`} />
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      ) : (
          <div className="animate-fade-in pt-4">{renderStagesContent()}</div>
      )}
      
      <Portal>
        <button 
            onClick={scrollToTop}
            className={`fixed bottom-24 right-6 md:bottom-24 md:right-10 w-12 h-12 bg-history-gold text-history-dark rounded-full shadow-2xl border-2 border-white flex items-center justify-center transition-all duration-500 z-[999] hover:scale-110 hover:bg-yellow-400 ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
            title="Lên đầu trang"
            aria-label="Scroll to top"
        >
            <ArrowUp size={24} strokeWidth={3} />
        </button>
      </Portal>

      <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteEvent} title="Xóa sự kiện?" message={`Bạn có chắc muốn xóa "${itemToDelete?.title}" không?`} />

      {/* EVENT Modal */}
      {isModalOpen && (
          <Portal>
              <div className="fixed inset-0 z-[12000] bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={() => setIsModalOpen(false)}>
                  <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 animate-pop-in relative" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-all"><X size={20}/></button>
                      
                      <h3 className="text-xl font-bold font-serif text-gray-800 mb-6 flex items-center gap-2">
                          {editingEvent ? <Edit2 className="text-blue-600" size={24}/> : <Plus className="text-history-red" size={24}/>} 
                          {editingEvent ? 'Chỉnh sửa sự kiện' : 'Thêm sự kiện mới'}
                      </h3>
                      
                      <div className="space-y-4">
                          <div>
                              <label className="block text-xs font-black text-gray-400 uppercase mb-2">Tiêu đề sự kiện</label>
                              <input 
                                  value={formTitle} 
                                  onChange={(e) => setFormTitle(e.target.value)} 
                                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-history-gold focus:ring-1 focus:ring-history-gold bg-gray-50"
                                  placeholder="VD: Chiến thắng Điện Biên Phủ"
                                  autoFocus 
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-black text-gray-400 uppercase mb-2">Thời gian (Ngày/Tháng/Năm)</label>
                              <input 
                                  value={formYear} 
                                  onChange={(e) => setFormYear(e.target.value)} 
                                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-history-gold focus:ring-1 focus:ring-history-gold bg-gray-50 font-mono"
                                  placeholder="VD: 07/05/1954"
                              />
                              <p className="text-[10px] text-gray-400 mt-1 italic">* Hệ thống sẽ tự động sắp xếp theo thời gian nhập vào.</p>
                          </div>
                          <div>
                              <label className="block text-xs font-black text-gray-400 uppercase mb-2">Mô tả ngắn</label>
                              <textarea 
                                  value={formDesc} 
                                  onChange={(e) => setFormDesc(e.target.value)} 
                                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-history-gold focus:ring-1 focus:ring-history-gold bg-gray-50 resize-none h-32"
                                  placeholder="Tóm tắt nội dung chính..."
                              />
                          </div>
                          <div className="flex gap-3 justify-end pt-4">
                              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-gray-500 font-bold text-sm">Hủy</button>
                              <button onClick={handleSaveEvent} disabled={isSaving} className={`px-8 py-3 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 hover:bg-black active:scale-95 disabled:opacity-50 transition-all ${editingEvent ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-history-dark text-history-gold'}`}>
                                  {isSaving ? <Loader2 size={16} className="animate-spin"/> : <Check size={16}/>} {editingEvent ? 'Cập nhật' : 'Lưu sự kiện'}
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          </Portal>
      )}

      {/* STAGE Modal */}
      {isStageModalOpen && (
          <Portal>
              <div className="fixed inset-0 z-[12000] bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={() => setIsStageModalOpen(false)}>
                  <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 animate-pop-in relative" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setIsStageModalOpen(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-all"><X size={20}/></button>
                      
                      <h3 className="text-xl font-bold font-serif text-gray-800 mb-6 flex items-center gap-2">
                          <Settings className="text-history-red" size={24}/>
                          {editingStageId ? 'Cấu hình Giai đoạn' : 'Thêm Giai đoạn mới'}
                      </h3>
                      
                      <div className="space-y-4">
                          <div>
                              <label className="block text-xs font-black text-gray-400 uppercase mb-2">Khoảng thời gian (Period)</label>
                              <input 
                                  value={stageForm.period} 
                                  onChange={(e) => setStageForm({...stageForm, period: e.target.value})} 
                                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-history-gold focus:ring-1 focus:ring-history-gold bg-gray-50 font-bold text-history-red"
                                  placeholder="VD: 1945 - 1954"
                                  autoFocus
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-black text-gray-400 uppercase mb-2">Tên giai đoạn (Title)</label>
                              <textarea 
                                  value={stageForm.title} 
                                  onChange={(e) => setStageForm({...stageForm, title: e.target.value})} 
                                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-history-gold focus:ring-1 focus:ring-history-gold bg-gray-50 h-24 font-serif"
                                  placeholder="VD: Kháng chiến chống Pháp..."
                              />
                          </div>
                          {!editingStageId && (
                              <div>
                                  <label className="block text-xs font-black text-gray-400 uppercase mb-2">ID (Mã định danh)</label>
                                  <input 
                                      value={stageForm.id} 
                                      onChange={(e) => setStageForm({...stageForm, id: e.target.value})} 
                                      className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-blue-500 bg-gray-100 font-mono text-sm text-gray-500"
                                      placeholder="stage-xxxx"
                                  />
                                  <p className="text-[10px] text-gray-400 mt-1">* Dùng để sắp xếp (VD: stage-1940, stage-1950).</p>
                              </div>
                          )}
                          <div className="flex gap-3 justify-end pt-4">
                              <button onClick={() => setIsStageModalOpen(false)} className="px-5 py-2 text-gray-500 font-bold text-sm">Hủy</button>
                              <button onClick={handleSaveStage} disabled={isSaving} className="px-8 py-3 bg-history-dark text-history-gold rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 hover:bg-black active:scale-95 disabled:opacity-50 transition-all">
                                  {isSaving ? <Loader2 size={16} className="animate-spin"/> : <Check size={16}/>} Lưu thông tin
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          </Portal>
      )}
    </div>
  );
};

export default TimelineSection;
