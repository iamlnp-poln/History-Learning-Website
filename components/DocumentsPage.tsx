
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { BookOpen, ExternalLink, Upload, Check, Loader2, Plus, Trash2, Globe, FileText, Link as LinkIcon, Edit2, MapPin, Map, Eye, FolderOpen } from 'lucide-react';
import { uploadToStorage, ADMIN_UIDS } from '../services/storageService';
import { UserProfile } from '../types';
import EditableText from './EditableText';
import EditableImage from './EditableImage';
import ConfirmationModal from './ConfirmationModal';
import DocumentViewerModal from './DocumentViewerModal';
import { db, auth, collection, addDoc, onSnapshot, doc, setDoc, getDoc } from '../firebaseConfig';
import { useToast } from '../contexts/ToastContext';

interface DocumentsPageProps {
  user?: UserProfile | null;
}

interface DocItem {
    id: string;
    title: string;
    category: string;
    publisher?: string;
    url: string;
    mapUrl?: string; // New optional field for Google Maps link
    thumbnail?: string;
    isCustom?: boolean;
}

// Initial Hardcoded Data
const INITIAL_DOCS: DocItem[] = [
    {
      id: "1",
      title: "Sách Giáo Khoa Lịch Sử 12 - Chân Trời Sáng Tạo",
      category: "Sách Giáo Khoa",
      publisher: "NXB Giáo Dục Việt Nam",
      url: "https://taphuan.nxbgd.vn/#/training-course-detail/3883d1f7-4707-331b-bd88-b2510e301131",
      thumbnail: ""
    },
    {
      id: "2",
      title: "Sách Giáo Khoa Lịch Sử 12 - Kết Nối Tri Thức",
      category: "Sách Giáo Khoa",
      publisher: "NXB Giáo Dục Việt Nam",
      url: "https://taphuan.nxbgd.vn/#/training-course-detail/4616af2a-d233-6344-b4fa-625cabb647de",
      thumbnail: ""
    }
];

const CATEGORIES = ["Tất cả", "Sách Giáo Khoa", "Lược đồ", "Sách tham khảo", "Tư liệu ảnh & video", "Địa điểm lịch sử"];

const DocumentsPage: React.FC<DocumentsPageProps> = ({ user }) => {
  const { showToast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [documents, setDocuments] = useState<DocItem[]>(INITIAL_DOCS);
  const [hiddenDocIds, setHiddenDocIds] = useState<string[]>([]);
  const [filter, setFilter] = useState("Tất cả");
  const [isLoading, setIsLoading] = useState(true); // Add Loading State
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<DocItem | null>(null);
  
  // Viewer Modal State
  const [viewingDoc, setViewingDoc] = useState<DocItem | null>(null);

  // Add/Edit Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocCategory, setNewDocCategory] = useState(CATEGORIES[1]);
  const [newDocSource, setNewDocSource] = useState('');
  const [newDocUrl, setNewDocUrl] = useState('');
  const [newDocMapUrl, setNewDocMapUrl] = useState(''); // New state for Map URL
  const [newDocThumb, setNewDocThumb] = useState('');
  const [inputType, setInputType] = useState<'link' | 'upload'>('link'); // Switch for URL input
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingThumb, setIsUploadingThumb] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  useEffect(() => {
    const checkAdmin = async (user: any) => {
        if (!user) {
            setIsAdmin(false);
            return;
        }
        if (ADMIN_UIDS.includes(user.uid)) {
            setIsAdmin(true);
            return;
        }
        if (db) {
            try {
                const docSnap = await getDoc(doc(db, 'admins', user.uid));
                setIsAdmin(docSnap.exists());
            } catch (e) {
                setIsAdmin(false);
            }
        }
    };
    const unsubscribe = auth?.onAuthStateChanged((user: any) => {
      checkAdmin(user);
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  // Sync Data with Artificial Delay for smooth transition
  useEffect(() => {
      if(!db) return;
      setIsLoading(true);

      const unsubHidden = onSnapshot(collection(db, 'hiddenItems'), (snap: any) => {
          setHiddenDocIds(snap.docs.map((d: any) => d.id));
      });
      const unsubCustom = onSnapshot(collection(db, 'customDocuments'), (snap: any) => {
          const customDocs = snap.docs.map((d: any) => ({ id: d.id, ...d.data(), isCustom: true } as DocItem));
          setDocuments([...INITIAL_DOCS, ...customDocs]);
          
          // Add delay to ensure data is ready and show transition
          setTimeout(() => {
              setIsLoading(false);
          }, 800);
      });
      return () => { unsubHidden(); unsubCustom(); };
  }, []);

  const openEditModal = (doc: DocItem) => {
      setEditingId(doc.id);
      setNewDocTitle(doc.title);
      setNewDocCategory(doc.category);
      setNewDocSource(doc.publisher || '');
      setNewDocUrl(doc.url);
      setNewDocMapUrl(doc.mapUrl || ''); // Load existing map URL
      setNewDocThumb(doc.thumbnail || '');
      // Determine input type guess
      setInputType(doc.url.includes('cloudinary') ? 'upload' : 'link');
      setIsAddModalOpen(true);
  };

  const openAddModal = () => {
      setEditingId(null);
      setNewDocTitle('');
      setNewDocCategory(CATEGORIES[1]);
      setNewDocSource('');
      setNewDocUrl('');
      setNewDocMapUrl('');
      setNewDocThumb('');
      setInputType('link');
      setIsAddModalOpen(true);
  };

  const handleSaveDocument = async () => {
      if(!newDocTitle || !newDocUrl) return;
      setIsSaving(true);
      try {
          if(db) {
              const docData = {
                  title: newDocTitle,
                  category: newDocCategory,
                  publisher: newDocSource,
                  url: newDocUrl,
                  mapUrl: newDocMapUrl, // Save Map URL
                  thumbnail: newDocThumb,
                  timestamp: new Date(),
                  updatedBy: auth?.currentUser?.email
              };

              if (editingId && documents.find(d => d.id === editingId)?.isCustom) {
                  // Update existing custom doc
                  await setDoc(doc(db, 'customDocuments', editingId), docData, { merge: true });
              } else {
                  // Add new doc
                  await addDoc(collection(db, 'customDocuments'), docData);
              }
          }
          setIsAddModalOpen(false);
          showToast("Lưu tài liệu thành công!", "success");
      } catch (e: any) {
          showToast("Lỗi lưu tài liệu: " + e.message, "error");
      } finally {
          setIsSaving(false);
      }
  };

  const confirmDelete = (doc: DocItem) => {
      setItemToDelete(doc);
      setIsDeleteModalOpen(true);
  };

  const handleDeleteDocument = async () => {
      if(!itemToDelete || !db) return;
      try {
          await setDoc(doc(db, 'hiddenItems', itemToDelete.id), {
              deletedAt: new Date(),
              deletedBy: auth?.currentUser?.email
          });
          setIsDeleteModalOpen(false);
          setItemToDelete(null);
          showToast("Đã xóa tài liệu.", "info");
      } catch (e: any) {
          showToast("Lỗi xóa tài liệu: " + e.message, "error");
      }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'thumb' | 'file') => {
      const file = e.target.files?.[0];
      if(!file) return;
      
      if(type === 'thumb') setIsUploadingThumb(true);
      else setIsUploadingFile(true);

      try {
          const url = await uploadToStorage(file);
          if(type === 'thumb') setNewDocThumb(url);
          else setNewDocUrl(url);
          showToast("Upload thành công!", "success");
      } catch(e: any) { showToast("Upload lỗi: " + e.message, "error"); }
      finally { 
          if(type === 'thumb') setIsUploadingThumb(false);
          else setIsUploadingFile(false);
      }
  };

  const checkIsViewable = (url: string) => {
      const lower = url.toLowerCase();
      // Supports PDF, Images, and Text files commonly viewable in iframe
      return lower.endsWith('.pdf') || lower.includes('.pdf') || 
             lower.match(/\.(jpeg|jpg|gif|png|webp|bmp)$/) != null || 
             url.includes('cloudinary'); 
  };

  const handleDocClick = (e: React.MouseEvent, doc: DocItem) => {
      // If it's a viewable file (PDF, Image), open in Modal
      if (checkIsViewable(doc.url)) {
          e.preventDefault();
          setViewingDoc(doc);
      }
      // Otherwise allow default behavior (new tab)
  };

  const renderDocCard = (doc: DocItem) => {
        const isBook = doc.category === "Sách Giáo Khoa" || doc.category === "Sách tham khảo";
        const isPlace = doc.category === "Địa điểm lịch sử";
        const SourceIcon = isPlace ? MapPin : Globe;
        const actionLabel = isPlace ? "Tìm hiểu địa điểm" : "Xem tài liệu";
        const isViewable = checkIsViewable(doc.url);

        return (
        <div key={doc.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all group flex h-auto md:h-40 relative">
            {/* Admin Controls */}
            {isAdmin && (
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    {doc.isCustom && (
                        <button 
                            onClick={() => openEditModal(doc)}
                            className="p-1.5 bg-white/90 text-blue-500 rounded-full shadow hover:bg-blue-50"
                        >
                            <Edit2 size={14} />
                        </button>
                    )}
                    <button 
                        onClick={() => confirmDelete(doc)}
                        className="p-1.5 bg-white/90 text-red-500 rounded-full shadow hover:bg-red-50"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            )}

            {/* Thumbnail */}
            <div 
                className={`shrink-0 bg-gray-100 flex items-center justify-center relative overflow-hidden cursor-pointer ${isBook ? 'w-28' : 'w-40 aspect-square'}`}
                onClick={(e) => handleDocClick(e, doc)}
            >
                {doc.thumbnail ? (
                    <img src={doc.thumbnail} alt={doc.title} className="w-full h-full object-cover" />
                ) : (
                    isBook ? (
                        <div className="w-20 h-28 border-2 border-gray-300 bg-white shadow flex items-center justify-center">
                            <BookOpen size={32} className="text-gray-300" />
                        </div>
                    ) : (
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                            <FileText size={32} className="text-gray-300" />
                        </div>
                    )
                )}
                {/* Overlay icon for Viewable items */}
                {isViewable && !isPlace && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-white/90 p-2 rounded-full shadow-lg text-history-dark">
                            <Eye size={20} />
                        </div>
                    </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1 pointer-events-none">
                    <div className="text-white text-[10px] text-center font-bold truncate px-1">
                        {doc.category}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                    <h4 
                        className="font-bold text-gray-800 text-lg mb-1 line-clamp-2 leading-tight cursor-pointer hover:text-blue-600 transition-colors" 
                        title={doc.title}
                        onClick={(e) => handleDocClick(e, doc)}
                    >
                        {doc.title}
                    </h4>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                        <SourceIcon size={12} className={isPlace ? "text-red-500" : ""} /> 
                        {doc.publisher || (isPlace ? "Chưa cập nhật địa chỉ" : "Nguồn sưu tầm")}
                    </p>
                </div>
                
                <div className="mt-2 flex flex-wrap gap-2">
                    <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={(e) => handleDocClick(e, doc)}
                        className={`inline-flex items-center gap-2 text-sm font-bold hover:underline transition-colors ${isPlace ? 'text-blue-600 hover:text-blue-800' : 'text-blue-600 hover:text-blue-800'}`}
                    >
                        {actionLabel} {isViewable && !isPlace ? <Eye size={14} /> : <ExternalLink size={14} />}
                    </a>
                    
                    {isPlace && doc.mapUrl && (
                        <a 
                            href={doc.mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-bold text-green-600 hover:text-green-800 hover:underline transition-colors"
                        >
                            Xem bản đồ <Map size={14} />
                        </a>
                    )}
                </div>
            </div>
        </div>
        )
  };

  const renderGroupedDocs = () => {
        // Group Logic for "All" view
        return CATEGORIES.filter(cat => cat !== "Tất cả").map(cat => {
            const docsInCat = documents.filter(d => d.category === cat && !hiddenDocIds.includes(d.id));
            if (docsInCat.length === 0) return null;

            return (
                <div key={cat} className="mb-10 animate-fade-in">
                    <div className="flex items-center gap-2 mb-4 border-b border-gray-200 pb-2">
                        <FolderOpen className="text-history-gold" size={20} />
                        <h3 className="text-xl font-bold text-history-dark font-serif">{cat}</h3>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">{docsInCat.length}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {docsInCat.map(renderDocCard)}
                    </div>
                </div>
            );
        });
  };

  // Filter Logic
  const filteredDocs = documents.filter(doc => 
      !hiddenDocIds.includes(doc.id) && (filter === "Tất cả" || doc.category === filter)
  );

  return (
    <div className="animate-fade-in pb-20 bg-gray-50 min-h-screen">
      {/* Banner with Editable Background */}
      <div id="documents-hero" className="relative bg-history-red text-white py-12 px-4 text-center overflow-hidden">
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0">
            <EditableImage 
                imageId="docs-header-bg"
                initialSrc=""
                alt="Documents Banner"
                className="w-full h-full object-cover"
                disableEdit={true}
            />
        </div>
        {/* Dark Overlay Layer */}
        <div className="absolute inset-0 bg-black/60 z-0 pointer-events-none"></div>

        <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-bold font-serif text-white">
                <EditableText id="docs-page-title" defaultText="Kho Tài Liệu Lịch Sử" />
            </h1>
            <div className="text-red-100 mt-2">
                <EditableText id="docs-page-subtitle" defaultText="Nguồn tư liệu chính thống hỗ trợ học tập và nghiên cứu." />
            </div>
        </div>
      </div>

      <div id="documents-content" className="max-w-6xl mx-auto px-4 py-10">
        
        {/* Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            {/* Filter */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
                {CATEGORIES.map(cat => (
                    <button 
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${filter === cat ? 'bg-history-dark text-history-gold shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {isAdmin && (
                <button 
                    onClick={openAddModal}
                    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-xl font-bold shadow hover:bg-blue-700 transition-colors"
                >
                    <Plus size={18} /> Thêm tài liệu
                </button>
            )}
        </div>

        {/* Loading Spinner */}
        {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 text-history-gold animate-fade-in">
                <Loader2 size={40} className="animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Đang tải dữ liệu từ kho lưu trữ...</p>
            </div>
        )}

        {/* Documents List */}
        {!isLoading && (
            <>
            {filter === "Tất cả" ? (
                // Grouped View
                renderGroupedDocs()
            ) : (
                // Filtered Grid View
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                    {filteredDocs.length > 0 ? (
                        filteredDocs.map(renderDocCard)
                    ) : (
                        <div className="col-span-full text-center py-20 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200 animate-fade-in">
                            <FileText size={48} className="mx-auto mb-3 opacity-50" />
                            <p>Chưa có tài liệu nào trong mục này.</p>
                        </div>
                    )}
                </div>
            )}
            
            {/* Empty State for All */}
            {filter === "Tất cả" && documents.filter(d => !hiddenDocIds.includes(d.id)).length === 0 && (
                 <div className="text-center py-20 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200 animate-fade-in">
                    <FileText size={48} className="mx-auto mb-3 opacity-50" />
                    <p>Kho tài liệu đang trống.</p>
                </div>
            )}
            </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isAddModalOpen && ReactDOM.createPortal(
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4 animate-fade-in backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-pop-in max-h-[90vh] overflow-y-auto">
                  <h3 className="text-xl font-bold mb-4 font-serif text-blue-800">{editingId ? 'Chỉnh sửa tài liệu' : 'Thêm tài liệu mới'}</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Tiêu đề tài liệu</label>
                          <input type="text" value={newDocTitle} onChange={(e) => setNewDocTitle(e.target.value)} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50" placeholder="Nhập tên tài liệu..." />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Phân loại</label>
                            <select value={newDocCategory} onChange={(e) => setNewDocCategory(e.target.value)} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50">
                                {CATEGORIES.filter(c => c !== "Tất cả").map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">{newDocCategory === "Địa điểm lịch sử" ? "Địa chỉ / Vị trí" : "Nguồn / NXB"}</label>
                            <input type="text" value={newDocSource} onChange={(e) => setNewDocSource(e.target.value)} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50" placeholder={newDocCategory === "Địa điểm lịch sử" ? "VD: Ba Đình, Hà Nội" : "VD: NXB Giáo dục..."} />
                          </div>
                      </div>
                      
                      {/* File Source Switch */}
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">{newDocCategory === "Địa điểm lịch sử" ? "Link bài viết / Thông tin" : "Nội dung tài liệu"}</label>
                          <div className="flex bg-gray-100 p-1 rounded-lg mb-2">
                              <button onClick={() => setInputType('link')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${inputType === 'link' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Liên kết (URL)</button>
                              <button onClick={() => setInputType('upload')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${inputType === 'upload' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Tải file lên</button>
                          </div>
                          
                          {inputType === 'link' ? (
                              <input type="text" value={newDocUrl} onChange={(e) => setNewDocUrl(e.target.value)} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm bg-gray-50" placeholder="https://..." />
                          ) : (
                              <div className="flex items-center gap-2">
                                  <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border border-blue-200">
                                      {isUploadingFile ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Chọn file
                                      <input type="file" className="hidden" onChange={(e) => handleUpload(e, 'file')} />
                                  </label>
                                  {newDocUrl && <span className="text-xs text-green-600 font-bold flex items-center gap-1"><Check size={12}/> Đã tải lên</span>}
                              </div>
                          )}
                      </div>

                      {/* Map URL Input - Only for Historical Places */}
                      {newDocCategory === "Địa điểm lịch sử" && (
                          <div className="animate-fade-in">
                              <label className="block text-sm font-bold text-gray-700 mb-1">Link Google Maps (Vị trí)</label>
                              <div className="relative">
                                  <MapPin size={16} className="absolute left-3 top-3 text-gray-400" />
                                  <input 
                                    type="text" 
                                    value={newDocMapUrl} 
                                    onChange={(e) => setNewDocMapUrl(e.target.value)} 
                                    className="w-full border rounded-lg pl-9 pr-3 py-2 focus:ring-2 focus:ring-green-500 outline-none font-mono text-sm bg-gray-50" 
                                    placeholder="https://maps.app.goo.gl/..." 
                                  />
                              </div>
                          </div>
                      )}

                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Thumbnail (Ảnh bìa)</label>
                          <div className="flex gap-2 items-center">
                              <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-sm font-bold text-gray-600 flex items-center gap-2">
                                  {isUploadingThumb ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Upload
                                  <input type="file" className="hidden" onChange={(e) => handleUpload(e, 'thumb')} accept="image/*" />
                              </label>
                              <span className="text-xs text-gray-400">hoặc dán link ảnh</span>
                          </div>
                          <input type="text" value={newDocThumb} onChange={(e) => setNewDocThumb(e.target.value)} className="w-full border rounded-lg p-2 mt-2 text-xs text-gray-500 bg-gray-50" placeholder="URL ảnh..." />
                          {newDocThumb && <img src={newDocThumb} alt="Preview" className="h-20 mt-2 rounded border shadow-sm object-cover" />}
                      </div>

                      <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                          <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 bg-gray-100 rounded-lg font-bold text-gray-600 hover:bg-gray-200">Hủy</button>
                          <button onClick={handleSaveDocument} disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2">
                              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Lưu tài liệu
                          </button>
                      </div>
                  </div>
              </div>
          </div>,
          document.body
      )}

      {/* Document Viewer Modal */}
      {viewingDoc && (
          <DocumentViewerModal 
              doc={viewingDoc} 
              onClose={() => setViewingDoc(null)} 
          />
      )}

      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteDocument}
        title="Xóa tài liệu?"
        message={`Bạn có chắc muốn xóa tài liệu "${itemToDelete?.title}" không?`}
      />
    </div>
  );
};

export default DocumentsPage;
