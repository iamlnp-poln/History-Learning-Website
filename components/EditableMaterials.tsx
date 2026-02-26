
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Youtube, FileText, Image as ImageIcon, File, Plus, Trash2, Edit2, Check, X, Loader2, Link as LinkIcon, ExternalLink, Eye, Settings } from 'lucide-react';
import { db, auth, doc, setDoc, onSnapshot } from '../firebaseConfig';
import { ADMIN_UIDS, uploadToStorage } from '../services/storageService';
import { Material } from '../types';

interface EditableMaterialsProps {
  id: string; 
  className?: string;
}

const MaterialIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'video': return <Youtube size={20} className="text-red-600" />;
        case 'article': return (
            <div className="w-10 h-10 bg-history-red rounded-lg flex items-center justify-center shrink-0 shadow-sm border border-history-gold/30">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 19.5V5C4 3.89543 4.89543 3 6 3H18.5C19.3284 3 20 3.67157 20 4.5V19.5C20 20.3284 19.3284 21 18.5 21H6C4.89543 21 4 20.1046 4 19.5Z" fill="#d4af37"/>
                    <path d="M6 21C4.89543 21 4 20.1046 4 19.5V19C4 17.8954 4.89543 17 6 17H20V19.5C20 20.3284 19.3284 21 18.5 21H6Z" fill="#b5952f"/>
                    <rect x="7" y="7" width="10" height="1.5" rx="0.75" fill="#8a1c1c"/>
                    <rect x="7" y="10" width="10" height="1.5" rx="0.75" fill="#8a1c1c"/>
                    <rect x="7" y="13" width="6" height="1.5" rx="0.75" fill="#8a1c1c"/>
                </svg>
            </div>
        );
        case 'image': return <ImageIcon size={20} className="text-blue-600" />;
        case 'file': return <File size={20} className="text-green-600" />;
        default: return <FileText size={20} />;
    }
};

const EditableMaterials: React.FC<EditableMaterialsProps> = ({ id, className = "" }) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [viewingItem, setViewingItem] = useState<Material | null>(null);

  const [editItem, setEditItem] = useState<Partial<Material>>({ type: 'article' });
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = auth?.onAuthStateChanged((user: any) => {
      setIsAdmin(!!user && ADMIN_UIDS.includes(user.uid));
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  useEffect(() => {
    if (!id || !db) return;
    const unsub = onSnapshot(doc(db, 'contentOverrides', `materials-${id}`), (docSnap: any) => {
        if (docSnap.exists()) {
            setMaterials(docSnap.data().items || []);
        }
    });
    return () => unsub();
  }, [id]);

  const handleSaveFirestore = async (newList: Material[]) => {
      if (!db) return;
      setIsSaving(true);
      try {
          await setDoc(doc(db, 'contentOverrides', `materials-${id}`), {
              items: newList,
              updatedAt: new Date(),
              updatedBy: auth.currentUser?.email
          });
      } catch (e) { 
          alert("Lỗi lưu dữ liệu: " + e); 
      } finally { 
          setIsSaving(false); 
      }
  };

  const openAdd = () => {
      setEditItem({ title: '', source: '', url: '', type: 'article' });
      setEditingIdx(null);
      setIsEditing(true);
  };

  const openEdit = (e: React.MouseEvent, m: Material, idx: number) => {
      e.stopPropagation();
      e.preventDefault();
      setEditItem(m);
      setEditingIdx(idx);
      setIsEditing(true);
  };

  const handleDelete = async (e: React.MouseEvent, idx: number) => {
      e.stopPropagation();
      e.preventDefault();
      if(!confirm("Xóa tài liệu này?")) return;
      const newList = materials.filter((_, i) => i !== idx);
      await handleSaveFirestore(newList);
  };

  const submitForm = async () => {
      if(!editItem.title || !editItem.url) {
          alert("Vui lòng nhập đủ Tiêu đề và Đường dẫn");
          return;
      }
      const newItem = { ...editItem, id: editItem.id || Date.now().toString() } as Material;
      let newList = [...materials];
      if (editingIdx !== null) newList[editingIdx] = newItem;
      else newList.push(newItem);
      
      await handleSaveFirestore(newList);
      setIsEditing(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if(!file) return;
      setIsUploading(true);
      try {
          const url = await uploadToStorage(file, 'materials');
          setEditItem(prev => ({ ...prev, url }));
      } catch(err) { alert("Upload lỗi: " + err); }
      finally { setIsUploading(false); }
  };

  const getYoutubeEmbed = (url: string) => {
      try {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}?autoplay=1` : null;
      } catch(e) { return null; }
  };

  return (
    <div className={`space-y-4 ${className}`}>
        <div className="space-y-2">
            {materials.map((m, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-gray-100 p-2.5 shadow-sm hover:shadow-md transition-all group flex items-center gap-3">
                    {/* Vùng nhấn để xem */}
                    <div className="flex-1 min-w-0 flex items-center gap-3 cursor-pointer" onClick={() => setViewingItem(m)}>
                        <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center shrink-0 border border-gray-100">
                            <MaterialIcon type={m.type} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h5 className="font-bold text-gray-900 text-sm truncate leading-tight">{m.title}</h5>
                            <p className="text-[10px] text-gray-400 font-bold truncate uppercase mt-0.5 tracking-tighter">
                                {m.type === 'video' ? 'Video YouTube' : (m.source || 'Nguồn sưu tầm')}
                            </p>
                        </div>
                        <div className="p-1.5 text-blue-600 bg-blue-50 rounded-lg shrink-0"><Eye size={16} /></div>
                    </div>
                    
                    {/* Vùng điều khiển Admin (Tách biệt hoàn toàn) */}
                    {isAdmin && (
                        <div className="flex items-center gap-1 border-l border-gray-100 pl-2 shrink-0">
                            <button onClick={(e) => openEdit(e, m, idx)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={14}/></button>
                            <button onClick={(e) => handleDelete(e, idx)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14}/></button>
                        </div>
                    )}
                </div>
            ))}

            {isAdmin && (
                <button onClick={openAdd} className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50/50 flex items-center justify-center gap-2 text-xs font-black transition-all">
                    <Plus size={16} /> Thêm tài liệu
                </button>
            )}
        </div>

        {/* Modal Edit - Nền xám trắng, chữ đen cực rõ */}
        {isEditing && typeof document !== 'undefined' && createPortal(
            <div className="fixed inset-0 z-[11000] bg-black/70 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in" onClick={() => setIsEditing(false)}>
                <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 animate-pop-in" onClick={e => e.stopPropagation()}>
                    <h3 className="font-bold text-xl mb-6 font-serif text-gray-900 flex items-center gap-2">
                        <Settings className="text-history-red" size={24}/> Cấu hình tài liệu
                    </h3>
                    <div className="space-y-5">
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase mb-2">Tiêu đề</label>
                            <input value={editItem.title} onChange={(e) => setEditItem({...editItem, title: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-bold text-gray-700 bg-gray-50"/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase mb-2">Loại tài liệu</label>
                                <select value={editItem.type} onChange={(e) => setEditItem({...editItem, type: e.target.value as any})} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-blue-500 bg-gray-50 text-sm font-bold text-gray-700">
                                    <option value="article">Bài viết</option>
                                    <option value="video">Video</option>
                                    <option value="image">Hình ảnh</option>
                                    <option value="file">File (PDF/Doc)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase mb-2">Nguồn</label>
                                <input value={editItem.source} onChange={(e) => setEditItem({...editItem, source: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-blue-500 bg-gray-50 text-sm"/>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase mb-2">Đường dẫn / Upload</label>
                            <div className="flex bg-gray-100 p-1.5 rounded-xl mb-2">
                                <input value={editItem.url} onChange={(e) => setEditItem({...editItem, url: e.target.value})} className="flex-1 bg-transparent border-none outline-none text-xs px-2 text-gray-600" placeholder="https://..."/>
                                <label className="cursor-pointer bg-white px-3 py-1.5 rounded-lg shadow-sm text-xs font-bold text-blue-600 flex items-center gap-1 hover:bg-blue-50 transition-colors">
                                    {isUploading ? <Loader2 size={12} className="animate-spin"/> : <LinkIcon size={12}/>} Upload
                                    <input type="file" className="hidden" onChange={handleUpload}/>
                                </label>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setIsEditing(false)} className="flex-1 py-3 text-gray-500 font-bold rounded-xl hover:bg-gray-100 transition-colors">Hủy bỏ</button>
                            <button onClick={submitForm} disabled={isSaving} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                                {isSaving ? <Loader2 size={18} className="animate-spin"/> : <Check size={18}/>} Lưu lại
                            </button>
                        </div>
                    </div>
                </div>
            </div>,
            document.body
        )}

        {/* Modal Viewer */}
        {viewingItem && typeof document !== 'undefined' && createPortal(
            <div className="fixed inset-0 z-[12000] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-fade-in" onClick={() => setViewingItem(null)}>
                <div className="relative w-full max-w-5xl h-[85vh] bg-black rounded-2xl overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setViewingItem(null)} className="absolute top-4 right-4 z-50 p-2 bg-black/50 text-white rounded-full hover:bg-white/20"><X size={24}/></button>
                    {viewingItem.type === 'video' ? (
                        <div className="w-full h-full flex items-center justify-center">
                            {getYoutubeEmbed(viewingItem.url) ? (
                                <iframe src={getYoutubeEmbed(viewingItem.url)!} className="w-full h-full" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                            ) : (
                                <video src={viewingItem.url} controls className="max-w-full max-h-full" autoPlay />
                            )}
                        </div>
                    ) : viewingItem.type === 'image' ? (
                        <div className="w-full h-full flex items-center justify-center">
                            <img src={viewingItem.url} alt={viewingItem.title} className="max-w-full max-h-full object-contain"/>
                        </div>
                    ) : (
                        <div className="w-full h-full bg-white relative">
                            <div className="absolute top-0 left-0 right-0 h-14 bg-history-dark flex items-center px-4 justify-between text-white">
                                <span className="font-bold truncate">{viewingItem.title}</span>
                                <a href={viewingItem.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm hover:text-history-gold"><ExternalLink size={16}/> Mở tab mới</a>
                            </div>
                            <iframe src={viewingItem.url} className="w-full h-full pt-14" frameBorder="0"></iframe>
                        </div>
                    )}
                </div>
            </div>,
            document.body
        )}
    </div>
  );
};

export default EditableMaterials;
