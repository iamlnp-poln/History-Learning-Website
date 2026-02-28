
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Youtube, ExternalLink, Calendar, FileText, ArrowLeft, Share2, Edit2, Link as LinkIcon, Check, Loader2, Plus, Trash2, Image as ImageIcon, X, Save } from 'lucide-react';
import { HistoricalEvent, HistoryStage } from '../types';
import EditableImage from './EditableImage';
import EditableText from './EditableText';
import EditableMaterials from './EditableMaterials';
import { db, auth, doc, onSnapshot, setDoc, getDoc, collection, getDocs, updateDoc } from '../firebaseConfig';
import { ADMIN_UIDS } from '../services/cloudinaryService';
import { useToast } from '../contexts/ToastContext';

interface EventDetailPageProps {
  event: HistoricalEvent | null;
  onBack: () => void;
}

const EventDetailPage: React.FC<EventDetailPageProps> = ({ event, onBack }) => {
  const { showToast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Edit Form State
  const [formData, setFormData] = useState({
      title: '',
      year: '',
      description: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = auth?.onAuthStateChanged((user: any) => {
      setIsAdmin(!!user && ADMIN_UIDS.includes(user.uid));
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  // Update form data when event changes
  useEffect(() => {
      if (event) {
          setFormData({
              title: event.title,
              year: event.year,
              description: event.description
          });
      }
  }, [event]);

  const handleOpenEdit = () => {
      if (event) {
          setFormData({
              title: event.title,
              year: event.year,
              description: event.description
          });
          setIsEditModalOpen(true);
      }
  };

  const handleSaveData = async () => {
      if (!event || !db) return;
      setIsSaving(true);
      try {
          // 1. Find which stage contains this event
          // Note: Since we don't have stageId passed directly, we scan stages. 
          // Optimization: Ideally pass stageId via props, but scanning is acceptable for admin actions on small datasets.
          const stagesSnap = await getDocs(collection(db, 'historyStages'));
          let foundStageId = null;
          let foundType: 'vietnam' | 'world' | null = null;
          let stageEvents: HistoricalEvent[] = [];

          for (const docSnap of stagesSnap.docs) {
              const data = docSnap.data();
              const vnEvents = data.vietnam as HistoricalEvent[];
              const worldEvents = data.world as HistoricalEvent[];

              if (vnEvents.some(e => e.id === event.id)) {
                  foundStageId = docSnap.id;
                  foundType = 'vietnam';
                  stageEvents = vnEvents;
                  break;
              }
              if (worldEvents.some(e => e.id === event.id)) {
                  foundStageId = docSnap.id;
                  foundType = 'world';
                  stageEvents = worldEvents;
                  break;
              }
          }

          if (foundStageId && foundType) {
              // 2. Update the specific event in the array
              const updatedEvents = stageEvents.map(e => {
                  if (e.id === event.id) {
                      return {
                          ...e,
                          title: formData.title,
                          year: formData.year,
                          description: formData.description
                      };
                  }
                  return e;
              });

              // 3. Write back to Firestore
              await updateDoc(doc(db, 'historyStages', foundStageId), {
                  [foundType]: updatedEvents
              });

              showToast("Cập nhật dữ liệu gốc thành công!", "success");
              setIsEditModalOpen(false);
              // Note: The UI will update automatically if the parent component subscribes to Firestore
          } else {
              showToast("Không tìm thấy sự kiện trong cơ sở dữ liệu.", "error");
          }

      } catch (e: any) {
          showToast("Lỗi lưu dữ liệu: " + e.message, "error");
      } finally {
          setIsSaving(false);
      }
  };

  if (!event) return null;

  return (
    <div className="animate-fade-in pb-20 bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200 sticky top-16 z-30 px-4 md:px-8 py-3 shadow-sm flex items-center justify-between">
         <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 text-gray-600 transition-all"><ArrowLeft size={24} /></button>
            <h2 className="text-lg font-bold text-gray-800 truncate max-w-[200px] md:max-w-md font-serif">Chi tiết sự kiện</h2>
         </div>
         <div className="flex gap-2">
             {isAdmin && (
                 <button 
                    onClick={handleOpenEdit}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors"
                 >
                     <Edit2 size={16} /> Sửa dữ liệu gốc
                 </button>
             )}
             <button className="text-gray-400 hover:text-history-red transition-colors p-2"><Share2 size={20} /></button>
         </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
         <div className="mb-8 text-center">
             <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-history-gold/20 text-history-dark font-bold rounded-full text-sm mb-4"><Calendar size={16} /> {event.year}</span>
             <EditableText id={`event-title-${event.id}`} tag="h1" defaultText={event.title} className="text-3xl md:text-5xl font-bold font-serif text-history-dark leading-tight" />
         </div>

         {/* Placeholder Hình ảnh - Đồng bộ với Timeline */}
         <div className="w-full aspect-video md:aspect-[21/9] bg-gray-100 relative rounded-[2rem] overflow-hidden shadow-sm border border-gray-200 mb-10 group">
            <EditableImage imageId={event.id} initialSrc={event.image} alt={event.title} className="w-full h-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-[2rem] shadow-sm border border-gray-200 p-6 md:p-10">
                    <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-3">
                        <div className="bg-red-50 p-2.5 rounded-xl text-history-red"><FileText size={28} /></div>
                        <h3 className="text-2xl font-bold text-gray-800 m-0">Nội dung chi tiết</h3>
                    </div>
                    <div className="text-gray-700 leading-relaxed text-justify text-lg space-y-4">
                        <EditableText id={`event-detail-${event.id}`} tag="div" multiline defaultText={event.description} />
                    </div>
                </div>
            </div>

            <div className="lg:col-span-1 space-y-8">
                <div className="bg-white rounded-[2rem] shadow-sm border border-gray-200 p-6">
                    <h4 className="flex items-center gap-2 text-lg font-bold text-gray-800 border-b border-gray-100 pb-4 mb-6 uppercase tracking-wider">Tài liệu & Phương tiện</h4>
                    <EditableMaterials id={event.id} />
                </div>
                
                <div className="bg-history-paper p-6 rounded-[2rem] border border-history-gold/30">
                    <h4 className="font-bold text-history-dark text-sm uppercase mb-4 flex items-center gap-2"><ImageIcon size={16}/> Hình ảnh liên quan</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="aspect-square bg-white rounded-xl overflow-hidden border border-gray-100"><EditableImage imageId={`event-subimg1-${event.id}`} initialSrc="" alt="Sub 1" className="w-full h-full" /></div>
                        <div className="aspect-square bg-white rounded-xl overflow-hidden border border-gray-200"><EditableImage imageId={`event-subimg2-${event.id}`} initialSrc="" alt="Sub 2" className="w-full h-full" /></div>
                    </div>
                </div>
            </div>
         </div>
      </div>

      {/* Edit Data Modal */}
      {isEditModalOpen && ReactDOM.createPortal(
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in" onClick={() => setIsEditModalOpen(false)}>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-pop-in relative" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setIsEditModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24} /></button>
                  
                  <h3 className="text-xl font-bold font-serif text-history-dark mb-6 flex items-center gap-2">
                      <Edit2 size={24} className="text-blue-600"/> Cập nhật dữ liệu gốc
                  </h3>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-black text-gray-400 uppercase mb-2">Tiêu đề sự kiện</label>
                          <input 
                              value={formData.title} 
                              onChange={(e) => setFormData({...formData, title: e.target.value})} 
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-bold text-gray-800 bg-gray-50"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-black text-gray-400 uppercase mb-2">Thời gian</label>
                          <input 
                              value={formData.year} 
                              onChange={(e) => setFormData({...formData, year: e.target.value})} 
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-mono text-gray-800 bg-gray-50"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-black text-gray-400 uppercase mb-2">Mô tả chi tiết</label>
                          <textarea 
                              value={formData.description} 
                              onChange={(e) => setFormData({...formData, description: e.target.value})} 
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-gray-800 bg-gray-50 h-40 resize-none leading-relaxed"
                          />
                      </div>
                      
                      <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                          <button onClick={() => setIsEditModalOpen(false)} className="px-5 py-2 text-gray-500 font-bold text-sm hover:bg-gray-100 rounded-lg">Hủy</button>
                          <button onClick={handleSaveData} disabled={isSaving} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-md flex items-center gap-2 hover:bg-blue-700 active:scale-95 disabled:opacity-50 transition-all">
                              {isSaving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Lưu thay đổi
                          </button>
                      </div>
                  </div>
              </div>
          </div>,
          document.body
      )}
    </div>
  );
};

export default EventDetailPage;
