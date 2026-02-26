
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, MapPin, ShoppingBag, Settings, Plus, Trash2, Save, X, Loader2 } from 'lucide-react';
import { PromotionItem } from '../types';
import EditableImage from './EditableImage';
import { auth, db, doc, onSnapshot, setDoc } from '../firebaseConfig';
import { ADMIN_UIDS, uploadToStorage } from '../services/storageService';
import { useToast } from '../contexts/ToastContext';

interface SmartCarouselProps {
  eventId: string; // Required for data persistence
  initialItems?: PromotionItem[];
  title?: string;
}

const SmartCarousel: React.FC<SmartCarouselProps> = ({ eventId, initialItems = [], title = "Khám phá thêm" }) => {
  const { showToast } = useToast();
  const [items, setItems] = useState<PromotionItem[]>(initialItems);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Management State
  const [isManaging, setIsManaging] = useState(false);
  const [newItem, setNewItem] = useState<Partial<PromotionItem>>({ type: 'location' });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Check Admin
  useEffect(() => {
    const unsubscribe = auth?.onAuthStateChanged((user: any) => {
      setIsAdmin(!!user && ADMIN_UIDS.includes(user.uid));
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  // Sync Data
  useEffect(() => {
      if (!eventId || !db) return;
      const unsub = onSnapshot(doc(db, 'eventExtensions', eventId), (docSnap: any) => {
          if (docSnap.exists() && docSnap.data().promotions) {
              setItems(docSnap.data().promotions);
          }
      });
      return () => unsub();
  }, [eventId]);

  useEffect(() => {
    if (isPaused || items.length <= 1 || isManaging) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000); 
    return () => clearInterval(interval);
  }, [items.length, isPaused, isManaging]);

  // Lock scroll when manager is open
  useEffect(() => {
      if (isManaging) {
          document.body.style.overflow = 'hidden';
      } else {
          document.body.style.overflow = 'unset';
      }
      return () => { document.body.style.overflow = 'unset'; };
  }, [isManaging]);

  const handleSaveItems = async (newItems: PromotionItem[]) => {
      if (!db) return;
      setIsSaving(true);
      try {
          await setDoc(doc(db, 'eventExtensions', eventId), {
              promotions: newItems,
              updatedAt: new Date()
          }, { merge: true });
          setItems(newItems);
          showToast("Đã lưu thay đổi!", "success");
      } catch (e: any) {
          showToast("Lỗi lưu: " + e.message, "error");
      } finally {
          setIsSaving(false);
      }
  };

  const handleAddItem = async () => {
      if (!newItem.title || !newItem.image) {
          showToast("Vui lòng nhập tiêu đề và ảnh", "error");
          return;
      }
      const item: PromotionItem = {
          id: Date.now().toString(),
          type: newItem.type as any,
          title: newItem.title!,
          image: newItem.image!,
          subtitle: newItem.subtitle || "",
          price: newItem.price || "",
          link: newItem.link || ""
      };
      
      const updatedList = [...items, item];
      await handleSaveItems(updatedList);
      setNewItem({ type: 'location' }); // Reset form
  };

  const handleDeleteItem = async (id: string) => {
      if (!confirm("Xóa mục này?")) return;
      const updatedList = items.filter(i => i.id !== id);
      await handleSaveItems(updatedList);
      if (currentIndex >= updatedList.length) setCurrentIndex(0);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsUploading(true);
      try {
          const url = await uploadToStorage(file, 'carousel');
          setNewItem(prev => ({ ...prev, image: url }));
      } catch(e) { console.error(e); }
      finally { setIsUploading(false); }
  };

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % items.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);

  // --- RENDER PLACEHOLDER FOR ADMIN ---
  if (items.length === 0) {
      if (!isAdmin) return null;
      return (
          <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center bg-gray-50 flex flex-col items-center justify-center gap-3">
              <p className="text-gray-500 font-bold text-sm">Chưa có nội dung quảng bá</p>
              <button 
                onClick={() => setIsManaging(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 flex items-center gap-2"
              >
                  <Plus size={16}/> Tạo Carousel Mới
              </button>
              {isManaging && renderManager()}
          </div>
      );
  }

  const currentItem = items[currentIndex];

  function renderManager() {
      if (typeof document === 'undefined') return null;
      return createPortal(
        <div className="fixed inset-0 z-[10000] grid place-items-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in" onClick={() => setIsManaging(false)}>
            <div className="bg-white rounded-2xl w-full max-w-lg p-6 animate-pop-in max-h-[85dvh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl font-serif text-gray-800">Quản lý Slide</h3>
                    <button onClick={() => setIsManaging(false)}><X size={24}/></button>
                </div>

                {/* Add New Form */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
                    <h4 className="text-xs font-bold uppercase text-gray-500 mb-3">Thêm mục mới</h4>
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <select 
                                className="border rounded-lg px-2 text-sm"
                                value={newItem.type}
                                onChange={e => setNewItem({...newItem, type: e.target.value as any})}
                            >
                                <option value="location">Địa điểm</option>
                                <option value="product">Sản phẩm</option>
                            </select>
                            <input 
                                className="flex-1 border rounded-lg px-3 py-2 text-sm"
                                placeholder="Tiêu đề (VD: Bảo tàng...)"
                                value={newItem.title || ''}
                                onChange={e => setNewItem({...newItem, title: e.target.value})}
                            />
                        </div>
                        <input 
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                            placeholder="Mô tả ngắn / Địa chỉ"
                            value={newItem.subtitle || ''}
                            onChange={e => setNewItem({...newItem, subtitle: e.target.value})}
                        />
                        <div className="flex gap-2">
                            <input 
                                className="flex-1 border rounded-lg px-3 py-2 text-sm"
                                placeholder="Giá (nếu có)"
                                value={newItem.price || ''}
                                onChange={e => setNewItem({...newItem, price: e.target.value})}
                            />
                            <div className="relative flex-1">
                                <input 
                                    className="w-full border rounded-lg px-3 py-2 text-sm pr-8"
                                    placeholder="Link ảnh..."
                                    value={newItem.image || ''}
                                    onChange={e => setNewItem({...newItem, image: e.target.value})}
                                />
                                <label className="absolute right-2 top-2 cursor-pointer text-gray-400 hover:text-blue-600">
                                    {isUploading ? <Loader2 size={16} className="animate-spin"/> : <Plus size={16}/>}
                                    <input type="file" className="hidden" onChange={handleUpload} />
                                </label>
                            </div>
                        </div>
                        <button 
                            onClick={handleAddItem}
                            disabled={isSaving}
                            className="w-full py-2 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700"
                        >
                            Thêm vào danh sách
                        </button>
                    </div>
                </div>

                {/* List Items */}
                <div className="space-y-2">
                    {items.map((item, idx) => (
                        <div key={item.id} className="flex items-center gap-3 p-2 border rounded-lg bg-white">
                            <img src={item.image} className="w-10 h-10 rounded object-cover bg-gray-200" alt="" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate">{item.title}</p>
                                <p className="text-xs text-gray-500 truncate">{item.type}</p>
                            </div>
                            <button onClick={() => handleDeleteItem(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>,
        document.body
      )
  }

  return (
    <div 
        className="relative bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
    >
      {/* Admin Gear */}
      {isAdmin && (
          <button 
            onClick={() => setIsManaging(true)}
            className="absolute top-2 right-2 z-30 p-2 bg-white/90 text-gray-700 rounded-full shadow hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
          >
              <Settings size={16} />
          </button>
      )}

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/60 to-transparent">
          <h4 className="text-white text-xs font-bold uppercase tracking-widest opacity-90 shadow-sm">{title}</h4>
      </div>

      {/* Image Layer */}
      <div className="aspect-[4/3] w-full relative bg-gray-100">
          <EditableImage 
            imageId={`carousel-${currentItem.id}`}
            initialSrc={currentItem.image}
            alt={currentItem.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            disableEdit={true}
          />
          {/* Overlay Gradient for Text */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
      </div>

      {/* Content Layer */}
      <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
          <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1 ${currentItem.type === 'location' ? 'bg-blue-600' : 'bg-orange-500'}`}>
                      {currentItem.type === 'location' ? <MapPin size={10} /> : <ShoppingBag size={10} />}
                      {currentItem.type === 'location' ? 'Di tích' : 'Sản phẩm'}
                  </div>
                  <h3 className="font-bold text-lg font-serif leading-tight">{currentItem.title}</h3>
              </div>
              {currentItem.type === 'product' && currentItem.price && (
                  <div className="bg-white text-history-dark font-bold text-xs px-2 py-1 rounded shadow-sm">
                      {currentItem.price}
                  </div>
              )}
          </div>
          
          <p className="text-xs text-gray-300 line-clamp-1 mb-3">{currentItem.subtitle}</p>
          
          <a 
            href={currentItem.link || "#"}
            target="_blank"
            rel="noopener noreferrer" 
            className="block w-full py-2 bg-white/20 hover:bg-white text-white hover:text-history-dark backdrop-blur-sm rounded-lg text-xs font-bold transition-all border border-white/30 text-center"
          >
              {currentItem.type === 'location' ? 'Xem bản đồ & Chỉ đường' : 'Xem chi tiết & Đặt mua'}
          </a>
      </div>

      {/* Navigation & Dots */}
      {items.length > 1 && (
          <>
            <div className="absolute top-1/2 -translate-y-1/2 left-2 right-2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <button onClick={handlePrev} className="pointer-events-auto p-1.5 bg-black/30 hover:bg-black/60 rounded-full text-white backdrop-blur-sm transition-colors"><ChevronLeft size={20}/></button>
                <button onClick={handleNext} className="pointer-events-auto p-1.5 bg-black/30 hover:bg-black/60 rounded-full text-white backdrop-blur-sm transition-colors"><ChevronRight size={20}/></button>
            </div>

            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                {items.map((_, idx) => (
                    <div 
                        key={idx} 
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-white w-4' : 'bg-white/40'}`}
                    />
                ))}
            </div>
          </>
      )}
      
      {isManaging && renderManager()}
    </div>
  );
};

export default SmartCarousel;
