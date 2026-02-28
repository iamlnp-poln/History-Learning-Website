
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Edit2, Loader2, Upload, Check, X, Link as LinkIcon, Image as ImageIcon, Grid, Info, Copyright, FolderInput } from 'lucide-react';
import { doc, setDoc, db, auth } from '../firebaseConfig';
import { uploadFile, getResizedUrl as optimizeStorageUrl, getAllFolders, VirtualAsset, setGlobalCredit } from '../services/storageService';
import MediaLibraryModal from './MediaLibraryModal';
import { useGlobalData } from '../contexts/GlobalDataContext';
import { useToast } from '../contexts/ToastContext';
import { useLightbox } from '../contexts/LightboxContext'; 

interface EditableImageProps {
  initialSrc?: string;
  alt: string;
  className?: string;
  imageId: string; 
  aspectRatio?: string; 
  disableEdit?: boolean;
  enableLightbox?: boolean; 
  editButtonPosition?: 'left' | 'right';
}

const EditableImage: React.FC<EditableImageProps> = ({ 
    initialSrc = "", 
    alt, 
    className = "", 
    imageId, 
    disableEdit = false,
    enableLightbox = true,
    editButtonPosition = 'right'
}) => {
  const { showToast } = useToast();
  const { openLightbox } = useLightbox(); 
  const { imageOverrides, imageCredits, urlCredits } = useGlobalData();
  
  const dbSrc = imageOverrides[imageId];
  
  // Resolve Credit: 1. Global URL Credit -> 2. Legacy ID Credit -> 3. Empty
  const [currentSrc, setCurrentSrc] = useState(optimizeStorageUrl(dbSrc || initialSrc));
  const effectiveCredit = (currentSrc && urlCredits[currentSrc]) || imageCredits[imageId] || '';

  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false); 
  
  const [inputType, setInputType] = useState<'upload' | 'link' | 'library'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [creditInput, setCreditInput] = useState('');
  
  const [showLibrary, setShowLibrary] = useState(false);
  
  const [uploadFolderId, setUploadFolderId] = useState('root');
  const [folders, setFolders] = useState<VirtualAsset[]>([]);

  useEffect(() => {
      if (dbSrc) {
          setCurrentSrc(optimizeStorageUrl(dbSrc));
      }
  }, [dbSrc]);

  useEffect(() => {
    const checkAdmin = async (user: any) => {
        if (!user) { setIsAdmin(false); return; }
        setIsAdmin(true); 
    };
    const unsubscribe = auth?.onAuthStateChanged((user: any) => checkAdmin(user));
    return () => unsubscribe && unsubscribe();
  }, []);

  useEffect(() => {
      if (isEditing && inputType === 'upload') {
          const fetchFolders = async () => {
              const res = await getAllFolders();
              setFolders(res);
          };
          fetchFolders();
      }
  }, [isEditing, inputType]);

  const saveImageToFirestore = async (newUrl: string, newCredit: string) => {
      if (!db) {
          showToast("Lỗi: Không kết nối được cơ sở dữ liệu.", "error");
          return;
      }
      
      try {
          // 1. Save Image Mapping (Which image goes to this ID)
          await setDoc(doc(db, 'imageOverrides', imageId), {
              url: newUrl,
              credit: newCredit, // Legacy support
              updatedAt: new Date(),
              updatedBy: auth?.currentUser?.email || 'admin'
          }, { merge: true });

          // 2. Sync Credit Globally for this URL
          await setGlobalCredit(newUrl, newCredit);

          setCurrentSrc(optimizeStorageUrl(newUrl));
          setIsEditing(false);
          setUrlInput('');
          showToast("Cập nhật hình ảnh & bản quyền thành công!", "success");
      } catch (dbError: any) {
          console.error("Firebase Save Error:", dbError);
          showToast("Lỗi lưu dữ liệu: " + dbError.message, "error");
      }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSaving(true);
    try {
      // Use uploadFile with folder ID AND creditInput to register in Virtual File System
      const newUrl = await uploadFile(file, uploadFolderId, creditInput);
      await saveImageToFirestore(newUrl, creditInput);
    } catch (error: any) {
      console.error("Upload/Save Error:", error);
      showToast("Lỗi: " + (error.message || error), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveUrlInput = async () => {
      const urlToSave = urlInput.trim() || currentSrc;
      if (!urlToSave) {
          showToast("Vui lòng nhập đường dẫn hình ảnh.", "error");
          return;
      }
      setIsSaving(true);
      await saveImageToFirestore(urlToSave, creditInput);
      setIsSaving(false);
  };

  const handleLibrarySelect = async (url: string) => {
      setShowLibrary(false);
      
      // Auto-populate credit from global store if available
      const existingCredit = urlCredits[url] || '';
      setCreditInput(existingCredit);
      setUrlInput(url);
      
      // If we want to auto-save immediately on selection:
      // setIsSaving(true);
      // await saveImageToFirestore(url, existingCredit || creditInput);
      // setIsSaving(false);
      
      // Better UX: Let user confirm or edit credit in modal before saving
      setInputType('link'); // Switch to link view to show url
  };

  const showEditButton = isAdmin && !disableEdit;

  const handleImageClick = (e: React.MouseEvent) => {
      if (enableLightbox && currentSrc && !isEditing) {
          openLightbox(currentSrc);
      }
  };

  if (!currentSrc && !showEditButton) {
      return null;
  }

  return (
    <div className={`relative group/image ${className} flex items-center justify-center overflow-hidden ${!currentSrc ? 'bg-gray-100' : ''}`}>
      {currentSrc ? (
        <img 
            src={currentSrc} 
            alt={alt} 
            className={`w-full h-full object-cover transition-opacity duration-300 ${enableLightbox ? 'cursor-pointer hover:opacity-90' : 'pointer-events-none'}`}
            loading="lazy"
            onClick={handleImageClick}
            onError={(e) => {
                e.currentTarget.style.display = 'none';
                setCurrentSrc('');
            }}
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-gray-300 w-full h-full">
            <ImageIcon size={32} />
            <span className="text-[10px] mt-1 font-medium uppercase tracking-wide">Chưa có ảnh</span>
        </div>
      )}

      {effectiveCredit && (
          <div className="absolute bottom-2 left-2 z-20 pointer-events-none group-hover/image:pointer-events-auto">
              <div 
                className="flex items-center bg-black/50 backdrop-blur-md text-white rounded-full h-7 transition-all duration-500 ease-out overflow-hidden max-w-[28px] hover:max-w-[300px] cursor-help shadow-sm border border-white/10 group/credit"
                title={effectiveCredit}
              >
                  <div className="w-7 h-7 flex items-center justify-center shrink-0">
                    <Copyright size={14} className="text-white/80 group-hover/credit:text-white" />
                  </div>
                  <span className="text-[10px] font-medium whitespace-nowrap pr-3 opacity-0 group-hover/credit:opacity-100 transition-opacity duration-300 delay-75">
                    {effectiveCredit}
                  </span>
              </div>
          </div>
      )}
      
      {showEditButton && (
        <>
            <button 
                onClick={(e) => { 
                    e.stopPropagation(); 
                    setIsEditing(true); 
                    setUrlInput(currentSrc); 
                    // Init credit input with global credit first, then local override
                    setCreditInput(effectiveCredit); 
                }}
                className={`absolute top-2 ${editButtonPosition === 'left' ? 'left-2' : 'right-2'} p-2 bg-white/90 text-gray-700 rounded-full shadow-md opacity-0 group-hover/image:opacity-100 transition-opacity z-10 hover:text-blue-600 pointer-events-auto`}
                title="Sửa hình ảnh"
            >
                <Edit2 size={16} />
            </button>

            {isEditing && typeof document !== 'undefined' && createPortal(
                <div 
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in" 
                    onClick={(e) => { e.stopPropagation(); setIsEditing(false); }}
                >
                    <div 
                        className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-100 transform transition-all scale-100 relative" 
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button onClick={() => setIsEditing(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-1"><X size={20} /></button>
                        <h4 className="text-lg font-bold text-gray-800 mb-4 font-serif text-center">Thay đổi hình ảnh</h4>
                        
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Nguồn / Ghi chú bản quyền</label>
                            <div className="relative">
                                <Info size={16} className="absolute left-3 top-2.5 text-gray-400" />
                                <input 
                                    type="text" 
                                    value={creditInput} 
                                    onChange={(e) => setCreditInput(e.target.value)} 
                                    placeholder="VD: Bảo tàng Lịch sử QG, Sưu tầm..." 
                                    className="w-full pl-9 pr-3 py-2 border rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" 
                                />
                            </div>
                            <p className="text-[10px] text-blue-500 mt-1 italic">* Thông tin này sẽ được đồng bộ cho ảnh này ở mọi nơi.</p>
                        </div>

                        <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
                            <button onClick={() => setInputType('upload')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${inputType === 'upload' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:bg-gray-200'}`}><Upload size={14} /> Tải lên</button>
                            <button onClick={() => { setInputType('library'); setShowLibrary(true); }} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${inputType === 'library' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:bg-gray-200'}`}><Grid size={14} /> Thư viện</button>
                            <button onClick={() => setInputType('link')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${inputType === 'link' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:bg-gray-200'}`}><LinkIcon size={14} /> Link</button>
                        </div>

                        {isSaving ? (
                            <div className="flex flex-col items-center justify-center py-6 space-y-3"><div className="relative"><div className="w-10 h-10 border-4 border-gray-200 rounded-full"></div><div className="absolute top-0 left-0 w-10 h-10 border-4 border-t-blue-600 rounded-full animate-spin"></div></div><span className="text-sm font-bold text-gray-500">Đang lưu...</span></div>
                        ) : (
                            <>
                                {inputType === 'upload' && (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Lưu vào thư mục</label>
                                            <div className="relative">
                                                <FolderInput size={14} className="absolute left-3 top-3 text-gray-400" />
                                                <select 
                                                    value={uploadFolderId} 
                                                    onChange={(e) => setUploadFolderId(e.target.value)}
                                                    className="w-full border rounded-lg pl-8 pr-3 py-2 text-xs bg-gray-50 text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                                                >
                                                    <option value="root">📁 Thư mục gốc (Root)</option>
                                                    {folders.map(f => (
                                                        <option key={f.id} value={f.id}>📁 {f.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <label className="cursor-pointer flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors">
                                            <Upload className="w-6 h-6 text-gray-400 mb-1" />
                                            <span className="text-xs text-gray-500 font-medium">Chọn ảnh từ thiết bị</span>
                                            <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                                        </label>
                                        <button onClick={handleSaveUrlInput} className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg font-bold text-xs hover:bg-gray-200 transition-colors">Chỉ lưu thông tin nguồn (Không đổi ảnh)</button>
                                    </div>
                                )}
                                {inputType === 'link' && (
                                    <div className="space-y-3">
                                        <input type="text" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://example.com/image.jpg" className="w-full border rounded-lg p-2 text-sm bg-gray-50 outline-none focus:border-blue-500" />
                                        <button onClick={handleSaveUrlInput} className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50">Lưu thay đổi</button>
                                    </div>
                                )}
                                {inputType === 'library' && (
                                    <div className="text-center py-4">
                                        <button onClick={() => setShowLibrary(true)} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-bold text-sm hover:bg-blue-200 transition-colors flex items-center gap-2 mx-auto"><Grid size={16}/> Mở thư viện</button>
                                        <p className="text-xs text-gray-400 mt-2">Chọn từ kho ảnh đã tải lên trước đó</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>,
                document.body
            )}
            
            {showLibrary && (
                <MediaLibraryModal onClose={() => setShowLibrary(false)} onSelect={handleLibrarySelect} />
            )}
        </>
      )}
    </div>
  );
};

export default EditableImage;
