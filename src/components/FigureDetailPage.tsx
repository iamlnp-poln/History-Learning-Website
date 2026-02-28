
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ArrowLeft, Share2, Calendar, User, Star, Edit2, X, Save, Loader2 } from 'lucide-react';
import { HistoricalFigure } from '../types';
import EditableImage from './EditableImage';
import EditableText from './EditableText';
import { auth, db, doc, updateDoc } from '../firebaseConfig';
import { ADMIN_UIDS } from '../services/cloudinaryService';
import { useToast } from '../contexts/ToastContext';

interface FigureDetailPageProps {
  figure: HistoricalFigure | null;
  onBack: () => void;
}

const FigureDetailPage: React.FC<FigureDetailPageProps> = ({ figure, onBack }) => {
  const { showToast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
      name: '',
      years: '',
      role: '',
      description: '',
      nationality: 'vietnam'
  });

  useEffect(() => {
    const unsubscribe = auth?.onAuthStateChanged((user: any) => {
      setIsAdmin(!!user && ADMIN_UIDS.includes(user.uid));
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  useEffect(() => {
      if (figure) {
          setFormData({
              name: figure.name,
              years: figure.years,
              role: figure.role,
              description: figure.description,
              nationality: figure.nationality
          });
      }
  }, [figure]);

  const handleSaveData = async () => {
      if (!figure || !db) return;
      setIsSaving(true);
      try {
          await updateDoc(doc(db, 'historicalFigures', figure.id), {
              name: formData.name,
              years: formData.years,
              role: formData.role,
              description: formData.description,
              nationality: formData.nationality
          });
          showToast("Cập nhật thông tin nhân vật thành công!", "success");
          setIsEditModalOpen(false);
      } catch (e: any) {
          showToast("Lỗi lưu dữ liệu: " + e.message, "error");
      } finally {
          setIsSaving(false);
      }
  };

  if (!figure) return null;

  return (
    <div className="animate-fade-in pb-20 bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200 sticky top-16 z-30 pl-28 pr-4 py-3 shadow-sm flex items-center justify-between">
         <div className="flex items-center gap-3">
            <button 
                onClick={onBack}
                className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 text-gray-600 transition-all"
                title="Quay lại"
            >
                <ArrowLeft size={24} />
            </button>
            <h2 className="text-lg font-bold text-gray-800 truncate max-w-[200px] md:max-w-md font-serif">
                Chi tiết nhân vật
            </h2>
         </div>
         <div className="flex gap-2">
             {isAdmin && (
                 <button 
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors"
                 >
                     <Edit2 size={16} /> Sửa
                 </button>
             )}
             <button className="text-gray-400 hover:text-history-red transition-colors" title="Chia sẻ">
                 <Share2 size={20} />
             </button>
         </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
         <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden relative mb-8">
            <div className="h-32 bg-gradient-to-r from-history-dark to-gray-800"></div>
            <div className="px-6 md:px-10 pb-8 flex flex-col md:flex-row items-center md:items-start -mt-16 gap-6">
                {/* Avatar (Editable) */}
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-200 shrink-0 relative z-10">
                    <EditableImage 
                        imageId={figure.id}
                        initialSrc={figure.image} 
                        alt={figure.name}
                        className="w-full h-full"
                    />
                </div>
                
                <div className="flex-1 text-center md:text-left md:mt-32">
                    <h1 className="text-3xl md:text-4xl font-bold font-serif text-gray-800 mb-2">
                        <EditableText id={`fig-detail-name-${figure.id}`} defaultText={figure.name} />
                    </h1>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                            <Calendar size={14} /> <EditableText id={`fig-detail-years-${figure.id}`} defaultText={figure.years} />
                        </span>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold text-white shadow-sm ${figure.nationality === 'vietnam' ? 'bg-history-red' : 'bg-blue-600'}`}>
                            <User size={14} /> {figure.nationality === 'vietnam' ? 'Việt Nam' : 'Thế Giới'}
                        </span>
                    </div>
                    <p className="text-lg text-history-gold font-bold font-serif">
                        <EditableText id={`fig-detail-role-${figure.id}`} defaultText={figure.role} />
                    </p>
                </div>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
                <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200">
                    <h3 className="text-xl font-bold text-history-dark font-serif mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                        <Star className="text-history-red" size={20} /> Tiểu sử & Sự nghiệp
                    </h3>
                    <div className="prose prose-lg text-gray-700 leading-relaxed text-justify">
                        <EditableText 
                            id={`fig-detail-desc-${figure.id}`} 
                            defaultText={figure.description} 
                            multiline 
                            tag="div" 
                        />
                        <p className="mt-4 italic text-sm text-gray-500">
                            * Thông tin chi tiết về cuộc đời và sự nghiệp đang được cập nhật thêm từ kho dữ liệu lịch sử.
                        </p>
                    </div>
                </div>
            </div>

            <div className="md:col-span-1 space-y-6">
                <div className="bg-history-paper p-6 rounded-3xl border border-history-gold/30">
                    <h4 className="font-bold text-history-dark mb-4 uppercase text-sm tracking-wider">Thông tin nhanh</h4>
                    <ul className="space-y-3 text-sm">
                        <li className="flex justify-between border-b border-black/5 pb-2">
                            <span className="text-gray-500">Năm sinh</span>
                            <span className="font-medium text-gray-800">{figure.years.split('-')[0].trim()}</span>
                        </li>
                        <li className="flex justify-between border-b border-black/5 pb-2">
                            <span className="text-gray-500">Vai trò</span>
                            <span className="font-medium text-gray-800 text-right">{figure.role}</span>
                        </li>
                        <li className="flex justify-between border-b border-black/5 pb-2">
                            <span className="text-gray-500">Quốc tịch</span>
                            <span className="font-medium text-gray-800">{figure.nationality === 'vietnam' ? 'Việt Nam' : 'Quốc tế'}</span>
                        </li>
                    </ul>
                </div>
                
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
                    <h4 className="font-bold text-gray-800 mb-3 text-sm">Sự kiện liên quan</h4>
                    <p className="text-xs text-gray-500">Hệ thống đang tổng hợp các sự kiện lịch sử gắn liền với nhân vật này.</p>
                </div>
            </div>
         </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && ReactDOM.createPortal(
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in" onClick={() => setIsEditModalOpen(false)}>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-pop-in relative" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setIsEditModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24} /></button>
                  <h3 className="text-xl font-bold font-serif text-history-dark mb-6 flex items-center gap-2">
                      <Edit2 size={24} className="text-blue-600"/> Sửa thông tin nhân vật
                  </h3>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-black text-gray-400 uppercase mb-2">Tên nhân vật</label>
                          <input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-bold text-gray-800 bg-gray-50"/>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-black text-gray-400 uppercase mb-2">Năm sinh - mất</label>
                              <input value={formData.years} onChange={(e) => setFormData({...formData, years: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-blue-500 bg-gray-50"/>
                          </div>
                          <div>
                              <label className="block text-xs font-black text-gray-400 uppercase mb-2">Quốc tịch</label>
                              <select value={formData.nationality} onChange={(e) => setFormData({...formData, nationality: e.target.value as any})} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-blue-500 bg-gray-50">
                                  <option value="vietnam">Việt Nam</option>
                                  <option value="world">Thế Giới</option>
                              </select>
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-black text-gray-400 uppercase mb-2">Vai trò / Chức danh</label>
                          <input value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-blue-500 bg-gray-50"/>
                      </div>
                      <div>
                          <label className="block text-xs font-black text-gray-400 uppercase mb-2">Tiểu sử tóm tắt</label>
                          <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-gray-800 bg-gray-50 h-32 resize-none"/>
                      </div>
                      <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                          <button onClick={() => setIsEditModalOpen(false)} className="px-5 py-2 text-gray-500 font-bold text-sm hover:bg-gray-100 rounded-lg">Hủy</button>
                          <button onClick={handleSaveData} disabled={isSaving} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-md flex items-center gap-2 hover:bg-blue-700 active:scale-95 disabled:opacity-50 transition-all">
                              {isSaving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Lưu
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

export default FigureDetailPage;
