
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, ShoppingBag, ExternalLink, Settings, Edit2, Check, Plus, Trash2, Loader2, Save, Map, Globe } from 'lucide-react';
import { HistoricalEvent } from '../types';
import EditableImage from './EditableImage';
import EditableText from './EditableText';
import { auth, db, doc, onSnapshot, setDoc } from '../firebaseConfig';
import { ADMIN_UIDS, uploadToStorage } from '../services/storageService';
import { useToast } from '../contexts/ToastContext';

interface HeritageModalProps {
  event: HistoricalEvent | null;
  onClose: () => void;
}

interface Souvenir {
    id: string;
    name: string;
    price: string;
    image: string;
    link: string;
}

export const HeritageModal: React.FC<HeritageModalProps> = ({ event, onClose }) => {
  const { showToast } = useToast();
  
  // Hooks must be called unconditionally
  const [isAdmin, setIsAdmin] = useState(false);
  const [links, setLinks] = useState({ mapUrl: '', websiteUrl: '' });
  const [souvenirs, setSouvenirs] = useState<Souvenir[]>([]);
  
  // Edit States
  const [isEditingLinks, setIsEditingLinks] = useState(false);
  const [tempLinks, setTempLinks] = useState({ mapUrl: '', websiteUrl: '' });
  
  const [isManagingSouvenirs, setIsManagingSouvenirs] = useState(false);
  const [newSouvenir, setNewSouvenir] = useState<Partial<Souvenir>>({});
  const [isUploading, setIsUploading] = useState(false);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (event) {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }
  }, [event]);

  // Check Admin
  useEffect(() => {
    const unsubscribe = auth?.onAuthStateChanged((user: any) => {
      setIsAdmin(!!user && ADMIN_UIDS.includes(user.uid));
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  // Sync Data
  useEffect(() => {
      if (!event || !event.id || !db) return;
      const unsub = onSnapshot(doc(db, 'eventExtensions', event.id), (docSnap: any) => {
          if (docSnap.exists()) {
              const data = docSnap.data();
              if (data.heritageLinks) {
                  setLinks(data.heritageLinks);
                  setTempLinks(data.heritageLinks);
              }
              if (data.souvenirs) setSouvenirs(data.souvenirs);
          }
      });
      return () => unsub();
  }, [event]);

  if (!event || typeof document === 'undefined') return null;

  const handleSaveLinks = async () => {
      if (!db) return;
      try {
          await setDoc(doc(db, 'eventExtensions', event.id), {
              heritageLinks: tempLinks,
              updatedAt: new Date()
          }, { merge: true });
          setIsEditingLinks(false);
          showToast("Lưu liên kết thành công", "success");
      } catch (e) { showToast("Lỗi lưu", "error"); }
  };

  const handleSaveSouvenirs = async (newList: Souvenir[]) => {
      if (!db) return;
      try {
          await setDoc(doc(db, 'eventExtensions', event.id), {
              souvenirs: newList,
              updatedAt: new Date()
          }, { merge: true });
          setSouvenirs(newList);
      } catch (e) { showToast("Lỗi lưu", "error"); }
  };

  const handleAddSouvenir = async () => {
      if (!newSouvenir.name) return;
      const item: Souvenir = {
          id: Date.now().toString(),
          name: newSouvenir.name,
          price: newSouvenir.price || '',
          image: newSouvenir.image || '',
          link: newSouvenir.link || ''
      };
      await handleSaveSouvenirs([...souvenirs, item]);
      setNewSouvenir({});
  };

  const handleDeleteSouvenir = async (id: string) => {
      if(!confirm("Xóa quà lưu niệm này?")) return;
      const newList = souvenirs.filter(s => s.id !== id);
      await handleSaveSouvenirs(newList);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsUploading(true);
      try {
          const url = await uploadToStorage(file, 'souvenirs');
          setNewSouvenir(prev => ({ ...prev, image: url }));
      } catch(e: any) {
          console.error(e);
      } finally { setIsUploading(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] grid place-items-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-[#fdfbf7] rounded-[2rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-pop-in relative border border-[#d4af37]/30 flex flex-col md:flex-row max-h-[85dvh]"
        onClick={(e) => e.stopPropagation()} 
      >
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 z-20 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors text-gray-700"
        >
            <X size={24} />
        </button>

        {/* Left Side: Visuals */}
        <div className="w-full md:w-2/5 relative bg-gray-200">
            <div className="h-48 md:h-full w-full relative">
                <EditableImage 
                    imageId={`heritage-hero-${event.id}`} 
                    initialSrc="" 
                    alt="Di tích" 
                    className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#fdfbf7] via-transparent to-transparent md:bg-gradient-to-r"></div>
            </div>
        </div>

        {/* Right Side: Info */}
        <div className="w-full md:w-3/5 p-6 md:p-8 overflow-y-auto custom-scrollbar flex flex-col">
            
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                    <span className="bg-history-gold text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Di sản văn hóa</span>
                </div>
                <h2 className="text-3xl font-bold font-serif text-history-dark">
                    <EditableText id={`heritage-title-${event.id}`} defaultText="Tên di tích / Bảo tàng" />
                </h2>
            </div>

            <div className="space-y-8 flex-1">
                {/* Description */}
                <div className="text-gray-600 text-sm leading-relaxed text-justify font-serif">
                    <EditableText id={`heritage-desc-${event.id}`} multiline defaultText="Mô tả ngắn về giá trị lịch sử và văn hóa của địa danh này..." tag="div" />
                </div>

                {/* Links Section */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider flex items-center gap-2">
                            <Map size={14} /> Liên kết & Chỉ đường
                        </h4>
                        {isAdmin && (
                            <button onClick={() => setIsEditingLinks(!isEditingLinks)} className="text-gray-400 hover:text-blue-600">
                                <Edit2 size={14} />
                            </button>
                        )}
                    </div>

                    {isEditingLinks ? (
                        <div className="space-y-2">
                            <input 
                                className="w-full border rounded p-2 text-xs" 
                                placeholder="Link Google Maps..." 
                                value={tempLinks.mapUrl} 
                                onChange={e => setTempLinks({...tempLinks, mapUrl: e.target.value})}
                            />
                            <input 
                                className="w-full border rounded p-2 text-xs" 
                                placeholder="Link Website..." 
                                value={tempLinks.websiteUrl} 
                                onChange={e => setTempLinks({...tempLinks, websiteUrl: e.target.value})}
                            />
                            <button onClick={handleSaveLinks} className="w-full bg-blue-600 text-white py-1.5 rounded text-xs font-bold">Lưu liên kết</button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <a 
                                href={links.mapUrl || '#'} 
                                target="_blank" 
                                rel="noreferrer"
                                className={`flex-1 py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${links.mapUrl ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                            >
                                <MapPin size={16} /> Xem bản đồ
                            </a>
                            <a 
                                href={links.websiteUrl || '#'} 
                                target="_blank" 
                                rel="noreferrer"
                                className={`flex-1 py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${links.websiteUrl ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                            >
                                <Globe size={16} /> Website
                            </a>
                        </div>
                    )}
                </div>

                {/* Souvenirs Section */}
                <div>
                    <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
                        <h4 className="font-bold text-history-red text-sm uppercase tracking-wider flex items-center gap-2">
                            <ShoppingBag size={16} /> Quà lưu niệm
                        </h4>
                        {isAdmin && (
                            <button onClick={() => setIsManagingSouvenirs(!isManagingSouvenirs)} className="text-gray-400 hover:text-history-gold">
                                <Settings size={16} />
                            </button>
                        )}
                    </div>

                    {isManagingSouvenirs && (
                        <div className="bg-gray-50 p-3 rounded-lg mb-4 border border-gray-200 animate-slide-up">
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <input className="border p-1.5 rounded text-xs" placeholder="Tên món..." value={newSouvenir.name || ''} onChange={e => setNewSouvenir({...newSouvenir, name: e.target.value})} />
                                <input className="border p-1.5 rounded text-xs" placeholder="Giá..." value={newSouvenir.price || ''} onChange={e => setNewSouvenir({...newSouvenir, price: e.target.value})} />
                            </div>
                            <div className="flex gap-2 mb-2">
                                <input className="flex-1 border p-1.5 rounded text-xs" placeholder="Link ảnh..." value={newSouvenir.image || ''} onChange={e => setNewSouvenir({...newSouvenir, image: e.target.value})} />
                                <label className="cursor-pointer bg-white border p-1.5 rounded hover:bg-gray-100">
                                    {isUploading ? <Loader2 className="animate-spin" size={14}/> : <Plus size={14}/>}
                                    <input type="file" className="hidden" onChange={handleUpload} />
                                </label>
                            </div>
                            <input className="w-full border p-1.5 rounded text-xs mb-2" placeholder="Link mua hàng..." value={newSouvenir.link || ''} onChange={e => setNewSouvenir({...newSouvenir, link: e.target.value})} />
                            <button onClick={handleAddSouvenir} className="w-full bg-history-gold text-white py-1.5 rounded text-xs font-bold">Thêm món</button>
                        </div>
                    )}

                    {souvenirs.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4">
                            {souvenirs.map(item => (
                                <div key={item.id} className="group relative bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
                                    <div className="aspect-square bg-gray-100 relative">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        {item.price && (
                                            <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm">
                                                {item.price}
                                            </span>
                                        )}
                                    </div>
                                    <div className="p-2">
                                        <h5 className="font-bold text-gray-800 text-xs truncate">{item.name}</h5>
                                        <a href={item.link} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 mt-1">
                                            Đặt mua <ExternalLink size={8}/>
                                        </a>
                                    </div>
                                    {isManagingSouvenirs && (
                                        <button onClick={() => handleDeleteSouvenir(item.id)} className="absolute top-1 right-1 p-1 bg-white/80 text-red-500 rounded-full shadow-sm">
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-400 text-xs italic border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                            Chưa có sản phẩm lưu niệm nào.
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default HeritageModal;
