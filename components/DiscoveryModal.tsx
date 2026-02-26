
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, ArrowRight, Plus, Settings, Trash2, Globe, Link as LinkIcon, Loader2, Save } from 'lucide-react';
import { HeritageLocation } from '../types';
import EditableImage from './EditableImage';
import { auth, db, doc, setDoc, onSnapshot } from '../firebaseConfig';
import { ADMIN_UIDS, uploadToStorage } from '../services/storageService';
import { useToast } from '../contexts/ToastContext';

interface DiscoveryModalProps {
  locations: HeritageLocation[];
  onClose: () => void;
  onSelectLocation?: (location: HeritageLocation) => void;
  eventId?: string; // Optional: needed for admin features
}

const DiscoveryModal: React.FC<DiscoveryModalProps> = ({ locations: initialLocations, onClose, onSelectLocation, eventId }) => {
  const { showToast } = useToast();
  const [locations, setLocations] = useState<HeritageLocation[]>(initialLocations || []);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isManaging, setIsManaging] = useState(false);
  
  // Admin Form State
  const [newLoc, setNewLoc] = useState<Partial<HeritageLocation>>({ type: 'Di tích' });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Prevent background scrolling
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Check Admin
  useEffect(() => {
    const unsubscribe = auth?.onAuthStateChanged((user: any) => {
      setIsAdmin(!!user && ADMIN_UIDS.includes(user.uid));
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  // Sync Data if eventId provided
  useEffect(() => {
      if (!eventId || !db) return;
      const unsub = onSnapshot(doc(db, 'eventExtensions', eventId), (docSnap: any) => {
          if (docSnap.exists() && docSnap.data().relatedLocations) {
              setLocations(docSnap.data().relatedLocations);
          }
      });
      return () => unsub();
  }, [eventId]);

  const handleSaveLocations = async (newLocations: HeritageLocation[]) => {
      if (!eventId || !db) return;
      setIsSaving(true);
      try {
          await setDoc(doc(db, 'eventExtensions', eventId), {
              relatedLocations: newLocations,
              updatedAt: new Date()
          }, { merge: true });
          showToast("Đã cập nhật địa điểm!", "success");
      } catch (e: any) {
          showToast("Lỗi: " + e.message, "error");
      } finally {
          setIsSaving(false);
      }
  };

  const handleAddLocation = async () => {
      if (!newLoc.name || !newLoc.image) {
          showToast("Thiếu tên hoặc ảnh", "error");
          return;
      }
      const item: HeritageLocation = {
          id: Date.now().toString(),
          name: newLoc.name!,
          image: newLoc.image!,
          type: newLoc.type || "Di tích",
          description: newLoc.description || "",
          address: newLoc.address || "",
          mapUrl: newLoc.mapUrl || "",
          websiteUrl: newLoc.websiteUrl || ""
      };
      
      const updatedList = [...locations, item];
      await handleSaveLocations(updatedList);
      setNewLoc({ type: 'Di tích' }); // Reset
  };

  const handleDeleteLocation = async (id: string) => {
      if (!confirm("Xóa địa điểm này?")) return;
      const updatedList = locations.filter(l => l.id !== id);
      await handleSaveLocations(updatedList);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsUploading(true);
      try {
          const url = await uploadToStorage(file, 'discovery');
          setNewLoc(prev => ({ ...prev, image: url }));
      } catch(e) { console.error(e); }
      finally { setIsUploading(false); }
  };

  const renderManager = () => (
      <div className="absolute inset-0 z-50 bg-white p-6 flex flex-col animate-fade-in rounded-3xl overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl text-gray-800">Quản lý Địa điểm</h3>
              <button onClick={() => setIsManaging(false)} className="p-2 hover:bg-gray-100 rounded-full"><X/></button>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 space-y-3">
              <h4 className="text-xs font-bold text-gray-500 uppercase">Thêm địa điểm mới</h4>
              <div className="grid grid-cols-2 gap-3">
                  <input className="border p-2 rounded text-sm" placeholder="Tên địa điểm..." value={newLoc.name || ''} onChange={e => setNewLoc({...newLoc, name: e.target.value})} />
                  <select className="border p-2 rounded text-sm" value={newLoc.type} onChange={e => setNewLoc({...newLoc, type: e.target.value})}>
                      <option value="Di tích">Di tích</option>
                      <option value="Bảo tàng">Bảo tàng</option>
                      <option value="Danh lam">Danh lam</option>
                  </select>
              </div>
              <textarea className="w-full border p-2 rounded text-sm" placeholder="Mô tả ngắn..." value={newLoc.description || ''} onChange={e => setNewLoc({...newLoc, description: e.target.value})} rows={2} />
              <input className="w-full border p-2 rounded text-sm" placeholder="Địa chỉ..." value={newLoc.address || ''} onChange={e => setNewLoc({...newLoc, address: e.target.value})} />
              
              <div className="grid grid-cols-2 gap-3">
                  <input className="border p-2 rounded text-sm" placeholder="Link Google Maps..." value={newLoc.mapUrl || ''} onChange={e => setNewLoc({...newLoc, mapUrl: e.target.value})} />
                  <input className="border p-2 rounded text-sm" placeholder="Link Website..." value={newLoc.websiteUrl || ''} onChange={e => setNewLoc({...newLoc, websiteUrl: e.target.value})} />
              </div>

              <div className="flex gap-2 items-center">
                  <input className="flex-1 border p-2 rounded text-sm" placeholder="URL Ảnh..." value={newLoc.image || ''} onChange={e => setNewLoc({...newLoc, image: e.target.value})} />
                  <label className="cursor-pointer bg-gray-200 p-2 rounded text-gray-600 hover:bg-gray-300">
                      {isUploading ? <Loader2 className="animate-spin" size={20}/> : <Plus size={20}/>}
                      <input type="file" className="hidden" onChange={handleUpload} />
                  </label>
              </div>

              <button onClick={handleAddLocation} disabled={isSaving} className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-blue-700">Thêm vào danh sách</button>
          </div>

          <div className="space-y-2">
              {locations.map(loc => (
                  <div key={loc.id} className="flex gap-3 p-2 border rounded bg-white items-center">
                      <img src={loc.image} className="w-12 h-12 rounded object-cover bg-gray-100" />
                      <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{loc.name}</p>
                          <p className="text-xs text-gray-500 truncate">{loc.address}</p>
                      </div>
                      <button onClick={() => handleDeleteLocation(loc.id)} className="text-red-500 p-2 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                  </div>
              ))}
          </div>
      </div>
  );

  if (typeof document === 'undefined') return null;

  return createPortal(
    // Sử dụng grid place-items-center để căn giữa hoàn hảo
    <div className="fixed inset-0 z-[120] grid place-items-center bg-black/80 backdrop-blur-md p-4 animate-fade-in" onClick={onClose}>
      <div 
        // Sử dụng max-h-[85dvh] để đảm bảo modal không bị che khuất trên mobile
        className="w-full max-w-5xl relative flex flex-col gap-4 max-h-[85dvh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center text-white shrink-0">
            <div className="flex items-center gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold font-serif text-history-gold">Khám Phá Địa Danh</h2>
                    <p className="text-gray-300 text-sm">Có {locations.length} địa điểm liên quan</p>
                </div>
                {isAdmin && eventId && (
                    <button 
                        onClick={() => setIsManaging(true)} 
                        className="bg-white/20 p-2 rounded-full hover:bg-white/30 text-white transition-colors"
                        title="Quản lý địa điểm"
                    >
                        <Settings size={20} />
                    </button>
                )}
            </div>
            <button 
                onClick={onClose}
                className="bg-white/10 hover:bg-white/20 p-3 rounded-full text-white transition-all border border-white/20"
            >
                <X size={24} />
            </button>
        </div>

        {/* Scrollable Container for Cards */}
        <div className="overflow-x-auto pb-4 pt-2 custom-scrollbar snap-x snap-mandatory flex-1 relative">
            
            {locations.length === 0 && (
                <div className="flex items-center justify-center h-64 w-full text-white/50 border-2 border-dashed border-white/20 rounded-3xl">
                    <p>Chưa có địa điểm nào được cập nhật.</p>
                </div>
            )}

            <div className="flex gap-6 min-w-max px-2"> {/* min-w-max để đảm bảo các thẻ không bị co lại */}
                {locations.map((loc) => (
                    <div 
                        key={loc.id} 
                        className="flex-shrink-0 w-80 md:w-96 bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-600 snap-center group relative flex flex-col h-full"
                        onClick={() => onSelectLocation && onSelectLocation(loc)}
                    >
                        <div className="h-48 relative bg-gray-200 shrink-0">
                            <EditableImage 
                                imageId={`discovery-loc-${loc.id}`} 
                                initialSrc={loc.image} 
                                alt={loc.name} 
                                className="w-full h-full object-cover" 
                                disableEdit={true}
                            />
                            <div className="absolute top-3 left-3 bg-history-red text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                                {loc.type}
                            </div>
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                            <h3 className="text-xl font-bold text-history-dark font-serif mb-2 line-clamp-2">{loc.name}</h3>
                            <p className="text-sm text-gray-500 flex items-start gap-1 mb-4 h-10 overflow-hidden">
                                <MapPin size={16} className="shrink-0 mt-0.5 text-history-gold" /> 
                                <span className="line-clamp-2">{loc.address || "Đang cập nhật địa chỉ..."}</span>
                            </p>
                            <p className="text-gray-600 text-sm line-clamp-3 mb-4 leading-relaxed flex-1">
                                {loc.description || "Thông tin chi tiết về địa điểm này đang được cập nhật."}
                            </p>
                            
                            <div className="flex gap-2 mt-auto">
                                <a 
                                    href={loc.mapUrl || '#'} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className={`flex-1 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 border ${loc.mapUrl ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' : 'bg-gray-100 text-gray-400 border-gray-200 pointer-events-none'}`}
                                >
                                    <MapPin size={14}/> Bản đồ
                                </a>
                                <a 
                                    href={loc.websiteUrl || '#'} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className={`flex-1 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 border ${loc.websiteUrl ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100' : 'bg-gray-100 text-gray-400 border-gray-200 pointer-events-none'}`}
                                >
                                    <Globe size={14}/> Website
                                </a>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {isManaging && renderManager()}
        </div>
        
        {locations.length > 0 && (
            <div className="text-center text-white/50 text-xs uppercase tracking-widest animate-pulse shrink-0">
                Kéo ngang để xem thêm
            </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default DiscoveryModal;
