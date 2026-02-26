
import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
    X, Image as ImageIcon, Trash2, Search, Loader2, 
    Folder, FolderPlus, ArrowLeft, Home,
    HardDrive, Lock, File, Upload, RefreshCw, Edit2, Move, FolderInput, Check, Copyright, RotateCcw
} from 'lucide-react';
import { 
    getVirtualAssets, 
    getAllVirtualAssets, 
    getTrashAssets,      
    createVirtualFolder, 
    uploadFile,
    renameVirtualAsset,
    moveVirtualAsset,
    hardDeleteAsset,
    softDeleteAsset,     
    restoreAsset,        
    updateAssetCredit, 
    getAllFolders,
    getOrCreateFolder,
    VirtualAsset
} from '../services/storageService';
import { useToast } from '../contexts/ToastContext';
import ConfirmationModal from './ConfirmationModal';

interface MediaLibraryModalProps {
    onClose: () => void;
    onSelect?: (url: string) => void;
    manageMode?: boolean;
    hideCloseButton?: boolean;
    initialFolder?: string;
    inline?: boolean; 
    lockedPath?: boolean; 
}

type ViewMode = 'explorer' | 'search' | 'trash';

const MediaLibraryModal: React.FC<MediaLibraryModalProps> = ({ 
    onClose, 
    onSelect, 
    manageMode = false, 
    hideCloseButton = false,
    initialFolder = 'root',
    inline = false,
    lockedPath = false
}) => {
    const { showToast } = useToast();
    
    // View State
    const [viewMode, setViewMode] = useState<ViewMode>('explorer');
    const [searchTerm, setSearchTerm] = useState('');

    // Navigation State
    const [currentFolderId, setCurrentFolderId] = useState<string>('root');
    const [folderHistory, setFolderHistory] = useState<{id: string, name: string}[]>([]);
    const [currentFolderName, setCurrentFolderName] = useState('Root');
    const [startFolderId, setStartFolderId] = useState<string>('root'); 
    
    // Data State
    const [items, setItems] = useState<VirtualAsset[]>([]);
    const [loading, setLoading] = useState(false);
    const [allFolders, setAllFolders] = useState<VirtualAsset[]>([]); 

    // Actions UI State
    const [isProcessing, setIsProcessing] = useState(false);
    const [uploadCredit, setUploadCredit] = useState(''); 
    
    // Modals State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<VirtualAsset | null>(null);

    const [showNewFolder, setShowNewFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    const [renamingItem, setRenamingItem] = useState<VirtualAsset | null>(null);
    const [renameValue, setRenameValue] = useState('');

    const [movingItem, setMovingItem] = useState<VirtualAsset | null>(null);
    const [moveDestination, setMoveDestination] = useState('');

    // Credit Edit Modal State
    const [creditEditItem, setCreditEditItem] = useState<VirtualAsset | null>(null);
    const [creditEditValue, setCreditEditValue] = useState('');

    // Resolve initial folder
    useEffect(() => {
        const resolveFolder = async () => {
            if (initialFolder && initialFolder !== 'root') {
                try {
                    const folderId = await getOrCreateFolder(initialFolder);
                    if (folderId) {
                        setCurrentFolderId(folderId);
                        setCurrentFolderName(initialFolder);
                        setStartFolderId(folderId); 
                        
                        if (!lockedPath) {
                            setFolderHistory([{ id: 'root', name: 'Root' }]);
                        } else {
                            setFolderHistory([]);
                        }
                    }
                } catch (e) {
                    console.error("Error resolving initial folder", e);
                }
            } else {
                setStartFolderId('root');
            }
        };
        resolveFolder();
    }, [initialFolder, lockedPath]);

    // Data Fetching Logic
    const loadItems = async () => {
        setLoading(true);
        setItems([]);
        try {
            let list: VirtualAsset[] = [];

            if (viewMode === 'search' && searchTerm.trim()) {
                // Search Mode: Fetch ALL and filter client-side (efficient for < 5000 items)
                const all = await getAllVirtualAssets();
                const lowerTerm = searchTerm.toLowerCase();
                list = all.filter(item => item.name.toLowerCase().includes(lowerTerm));
            } else if (viewMode === 'trash') {
                // Trash Mode
                list = await getTrashAssets();
            } else {
                // Explorer Mode
                list = await getVirtualAssets(currentFolderId);
            }

            // Sort: Folders first, then Newest files
            list.sort((a, b) => {
                if (a.type === b.type) return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
                return a.type === 'folder' ? -1 : 1;
            });
            setItems(list);
        } catch (error) {
            console.error(error);
            showToast("Không thể tải danh sách file", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            if (searchTerm.trim()) {
                if (viewMode !== 'search') setViewMode('search');
                else loadItems();
            } else {
                if (viewMode === 'search') setViewMode('explorer');
                else loadItems();
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, viewMode, currentFolderId]);

    // Force reload when view mode switches manually (e.g. clicking Trash icon)
    useEffect(() => {
        if (!searchTerm.trim() || viewMode === 'trash') {
            loadItems();
        }
    }, [viewMode]);

    // Fetch folders for Move dialog
    useEffect(() => {
        if (movingItem) {
            getAllFolders().then(setAllFolders);
        }
    }, [movingItem]);

    const handleNavigate = (folderId: string, folderName: string) => {
        if (viewMode !== 'explorer') setViewMode('explorer');
        setSearchTerm(''); // Clear search when navigating
        setFolderHistory([...folderHistory, { id: currentFolderId, name: currentFolderName }]);
        setCurrentFolderId(folderId);
        setCurrentFolderName(folderName);
    };

    const handleBack = () => {
        if (lockedPath && currentFolderId === startFolderId) return;

        if (folderHistory.length > 0) {
            const prev = folderHistory[folderHistory.length - 1];
            setFolderHistory(folderHistory.slice(0, -1));
            setCurrentFolderId(prev.id);
            setCurrentFolderName(prev.name);
        } else if (!lockedPath) {
            setCurrentFolderId('root');
            setCurrentFolderName('Root');
        }
    };

    const handleHome = () => {
        if (viewMode !== 'explorer') {
            setViewMode('explorer');
            setSearchTerm('');
        }
        
        if (lockedPath) {
            if (currentFolderId !== startFolderId) {
                setCurrentFolderId(startFolderId);
                setCurrentFolderName(initialFolder || 'Root');
                setFolderHistory([]);
            }
        } else {
            setFolderHistory([]);
            setCurrentFolderId('root');
            setCurrentFolderName('Root');
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        
        // Ensure we are in a valid folder to upload
        if (viewMode !== 'explorer') {
            showToast("Vui lòng về thư mục để tải lên", "info");
            return;
        }

        setIsProcessing(true);
        try {
            for (let i = 0; i < files.length; i++) {
                await uploadFile(files[i], currentFolderId, uploadCredit);
            }
            showToast("Tải lên thành công!", "success");
            setUploadCredit(''); 
            loadItems();
        } catch (e: any) {
            showToast(e.message, "error");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        if (viewMode !== 'explorer') return;

        setIsProcessing(true);
        try {
            await createVirtualFolder(newFolderName.trim(), currentFolderId);
            setShowNewFolder(false);
            setNewFolderName('');
            showToast("Đã tạo thư mục", "success");
            loadItems();
        } catch (e: any) {
            showToast(e.message, "error");
        } finally {
            setIsProcessing(false);
        }
    };

    const confirmDelete = (e: React.MouseEvent, item: VirtualAsset) => {
        e.stopPropagation();
        setItemToDelete(item);
        setDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!itemToDelete) return;
        setIsProcessing(true);
        try {
            if (viewMode === 'trash') {
                // Permanently Delete (Hard Delete)
                await hardDeleteAsset(itemToDelete.id);
                showToast("Đã xóa vĩnh viễn", "success");
            } else {
                // Move to Trash (Soft Delete)
                await softDeleteAsset(itemToDelete.id);
                showToast("Đã chuyển vào thùng rác", "info");
            }
            setDeleteModalOpen(false);
            setItemToDelete(null);
            loadItems();
        } catch (e: any) {
            showToast("Lỗi xóa: " + e.message, "error");
        } finally {
            setIsProcessing(false);
        }
    };

    const executeRestore = async (e: React.MouseEvent, item: VirtualAsset) => {
        e.stopPropagation();
        setIsProcessing(true);
        try {
            await restoreAsset(item.id);
            showToast("Đã khôi phục file", "success");
            loadItems();
        } catch (e: any) {
            showToast("Lỗi khôi phục: " + e.message, "error");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRenameClick = (e: React.MouseEvent, item: VirtualAsset) => {
        e.stopPropagation();
        setRenamingItem(item);
        setRenameValue(item.name);
    };

    const executeRename = async () => {
        if (!renamingItem || !renameValue.trim()) return;
        setIsProcessing(true);
        try {
            await renameVirtualAsset(renamingItem.id, renameValue.trim());
            showToast("Đổi tên thành công", "success");
            setRenamingItem(null);
            setRenameValue('');
            loadItems();
        } catch (e: any) {
            showToast(e.message, "error");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleMoveClick = (e: React.MouseEvent, item: VirtualAsset) => {
        e.stopPropagation();
        setMovingItem(item);
        setMoveDestination(currentFolderId === 'root' ? '' : currentFolderId); 
    };

    const executeMove = async () => {
        if (!movingItem || !moveDestination) return;
        if (moveDestination === movingItem.id) { showToast("Không thể chuyển vào chính nó", "error"); return; }
        setIsProcessing(true);
        try {
            await moveVirtualAsset(movingItem.id, moveDestination);
            showToast("Di chuyển thành công", "success");
            setMovingItem(null);
            setMoveDestination('');
            loadItems();
        } catch (e: any) {
            showToast(e.message, "error");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCreditEditClick = (e: React.MouseEvent, item: VirtualAsset) => {
        e.stopPropagation();
        setCreditEditItem(item);
        setCreditEditValue(item.credit || '');
    };

    const executeCreditUpdate = async () => {
        if (!creditEditItem) return;
        setIsProcessing(true);
        try {
            await updateAssetCredit(creditEditItem.id, creditEditValue);
            showToast("Cập nhật nguồn thành công", "success");
            setCreditEditItem(null);
            setCreditEditValue('');
            loadItems();
        } catch (e: any) {
            showToast(e.message, "error");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleItemClick = (item: VirtualAsset) => {
        if (viewMode === 'trash') return; // Cannot select from trash

        if (item.type === 'folder') {
            handleNavigate(item.id, item.name);
        } else {
            if (onSelect) {
                onSelect(item.url || '');
            } else {
                window.open(item.url, '_blank');
            }
        }
    };

    const isSelecting = !!onSelect;

    const ModalContent = (
        <div 
            className={`bg-white flex flex-col overflow-hidden relative ${inline ? 'h-full w-full rounded-2xl border border-gray-200 shadow-sm' : 'rounded-2xl w-full max-w-5xl h-[85vh] animate-pop-in shadow-2xl'}`}
            onClick={e => e.stopPropagation()}
        >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${viewMode === 'trash' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                        {viewMode === 'trash' ? <Trash2 size={24}/> : <HardDrive size={24}/>}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg font-serif text-gray-800">
                            {viewMode === 'trash' ? 'Thùng rác' : (isSelecting ? 'Chọn tập tin' : 'Thư viện Media')}
                        </h3>
                        <p className="text-xs text-gray-500 font-medium">
                            {viewMode === 'search' ? `Tìm kiếm: "${searchTerm}"` : 
                             viewMode === 'trash' ? 'Thùng rác: Xóa vĩnh viễn tại đây để giải phóng dung lượng Storage.' :
                             lockedPath ? `Thư mục cố định: ${initialFolder}` : 'Quản lý file hệ thống'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Trash Toggle */}
                    <button 
                        onClick={() => {
                            if (viewMode === 'trash') handleHome();
                            else { setViewMode('trash'); setSearchTerm(''); }
                        }}
                        className={`p-2 rounded-full transition-colors ${viewMode === 'trash' ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100 text-gray-500'}`}
                        title={viewMode === 'trash' ? "Quay lại thư viện" : "Mở thùng rác"}
                    >
                        {viewMode === 'trash' ? <RefreshCw size={20} /> : <Trash2 size={20} />}
                    </button>

                    {!hideCloseButton && !inline && (
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                            <X size={24} />
                        </button>
                    )}
                </div>
            </div>

            {/* Toolbar */}
            <div className="p-3 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-2 items-center justify-between shrink-0">
                <div className="flex items-center gap-2 overflow-x-auto max-w-full">
                    {/* Navigation Buttons (Only in Explorer Mode) */}
                    {viewMode === 'explorer' && (
                        <>
                            <button 
                                onClick={handleHome} 
                                className={`p-2 hover:bg-white rounded-lg text-gray-600 transition-colors ${lockedPath && currentFolderId === startFolderId ? 'opacity-50 cursor-default' : ''}`}
                                title={lockedPath ? "Về thư mục gốc" : "Về Root"}
                                disabled={lockedPath && currentFolderId === startFolderId}
                            >
                                <Home size={18}/>
                            </button>
                            
                            {(folderHistory.length > 0) && (
                                <button onClick={handleBack} className="p-2 hover:bg-white rounded-lg text-gray-600 transition-colors" title="Quay lại"><ArrowLeft size={18}/></button>
                            )}
                            
                            <div className="h-6 w-px bg-gray-300 mx-1"></div>
                            <div className="flex items-center gap-1 text-sm font-bold text-gray-700">
                                <Folder size={16} className="text-history-gold fill-current" />
                                <span className="truncate max-w-[150px]">{currentFolderName}</span>
                            </div>
                        </>
                    )}
                    {viewMode === 'search' && (
                        <div className="flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">
                            <Search size={14}/> Kết quả tìm kiếm
                        </div>
                    )}
                    {viewMode === 'trash' && (
                        <div className="flex items-center gap-2 text-sm font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">
                            <Trash2 size={14}/> Thùng rác
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                    {/* Search Input */}
                    <div className="relative max-w-[200px] w-full">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Tìm kiếm file..."
                            className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:border-blue-500 bg-white"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                <X size={12} />
                            </button>
                        )}
                    </div>

                    {/* Actions (Only in Explorer Mode) */}
                    {viewMode === 'explorer' && (
                        <>
                            <div className="hidden sm:flex items-center relative">
                                <input 
                                    type="text" 
                                    value={uploadCredit}
                                    onChange={(e) => setUploadCredit(e.target.value)}
                                    placeholder="Nguồn ảnh (tùy chọn)..."
                                    className="pl-3 pr-3 py-1.5 border border-gray-300 rounded-l-lg text-xs outline-none focus:border-blue-500 w-32"
                                />
                                <div className="bg-gray-100 border-y border-r border-gray-300 px-2 py-1.5 rounded-r-lg text-gray-500">
                                    <Copyright size={14} />
                                </div>
                            </div>

                            <button 
                                onClick={() => setShowNewFolder(true)} 
                                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm shrink-0"
                            >
                                <FolderPlus size={16} /> <span className="hidden md:inline">Tạo thư mục</span>
                            </button>
                            <label className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-sm cursor-pointer shrink-0">
                                {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                <span className="hidden md:inline">Tải lên</span>
                                <input type="file" multiple className="hidden" onChange={handleUpload} accept="image/*" />
                            </label>
                        </>
                    )}
                </div>
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <Loader2 size={40} className="animate-spin mb-2" />
                        <p>Đang tải dữ liệu...</p>
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 border-2 border-dashed border-gray-200 rounded-xl m-4 bg-gray-50">
                        {viewMode === 'search' ? <Search size={48} className="mb-2 opacity-50"/> : (viewMode === 'trash' ? <Trash2 size={48} className="mb-2 opacity-50"/> : <Folder size={48} className="mb-2 opacity-50" />)}
                        <p>{viewMode === 'search' ? 'Không tìm thấy kết quả' : (viewMode === 'trash' ? 'Thùng rác trống' : 'Thư mục trống')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {items.map((item) => (
                            <div 
                                key={item.id} 
                                className={`group relative bg-white rounded-xl border shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer flex flex-col ${viewMode === 'trash' ? 'border-red-200 opacity-80 hover:opacity-100' : 'border-gray-200'}`}
                                onClick={() => handleItemClick(item)}
                            >
                                {/* Preview */}
                                <div className="aspect-square bg-gray-100 relative overflow-hidden flex items-center justify-center">
                                    {item.type === 'folder' ? (
                                        <Folder size={48} className="text-history-gold fill-history-gold/20" />
                                    ) : (
                                        <img src={item.url} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                    )}
                                    {/* Selection Checkmark Overlay */}
                                    {isSelecting && item.type === 'file' && viewMode !== 'trash' && (
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center transition-all">
                                            <div className="bg-blue-600 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all shadow-lg">
                                                <Check size={20} />
                                            </div>
                                        </div>
                                    )}
                                    {viewMode === 'trash' && (
                                        <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center pointer-events-none">
                                            <Trash2 size={32} className="text-red-500 opacity-20"/>
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-2 border-t border-gray-50">
                                    <p className="text-xs font-medium text-gray-700 truncate" title={item.name}>{item.name}</p>
                                    <div className="flex justify-between items-center mt-0.5">
                                        <p className="text-[10px] text-gray-400">{item.type === 'folder' ? 'Thư mục' : 'File ảnh'}</p>
                                        {item.credit && (
                                            <div title={`Nguồn: ${item.credit}`}>
                                                <Copyright size={10} className="text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Quick Actions (Hover) */}
                                <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {viewMode === 'trash' ? (
                                        <>
                                            <button onClick={(e) => executeRestore(e, item)} className="p-1.5 bg-white text-green-600 rounded-md shadow-sm hover:bg-green-50 border border-green-200" title="Khôi phục"><RotateCcw size={14}/></button>
                                            <button onClick={(e) => confirmDelete(e, item)} className="p-1.5 bg-white text-red-600 rounded-md shadow-sm hover:bg-red-50 border border-red-200" title="Xóa vĩnh viễn"><Trash2 size={14}/></button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={(e) => confirmDelete(e, item)} className="p-1.5 bg-white text-red-500 rounded-md shadow-sm hover:bg-red-50 border border-red-100" title="Xóa"><Trash2 size={14}/></button>
                                            <button onClick={(e) => handleRenameClick(e, item)} className="p-1.5 bg-white text-blue-500 rounded-md shadow-sm hover:bg-blue-50 border border-blue-100" title="Đổi tên"><Edit2 size={14}/></button>
                                            {item.type === 'file' && (
                                                <button onClick={(e) => handleCreditEditClick(e, item)} className="p-1.5 bg-white text-yellow-600 rounded-md shadow-sm hover:bg-yellow-50 border border-yellow-200" title="Sửa nguồn/credit"><Copyright size={14}/></button>
                                            )}
                                            <button onClick={(e) => handleMoveClick(e, item)} className="p-1.5 bg-white text-gray-500 rounded-md shadow-sm hover:bg-gray-100 border border-gray-200" title="Di chuyển"><Move size={14}/></button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer Info */}
            <div className="p-2 bg-white border-t border-gray-100 text-center text-[10px] text-gray-400 shrink-0">
                {items.length} mục • {viewMode === 'trash' ? 'Trash' : (viewMode === 'search' ? 'Kết quả tìm kiếm' : (currentFolderId === 'root' ? 'Root' : currentFolderName))}
            </div>

            {/* --- SUB MODALS (Absolute to container) --- */}
            
            {/* 1. New Folder Modal */}
            {showNewFolder && (
                <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowNewFolder(false)}>
                    <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <h4 className="font-bold text-lg mb-4">Tạo thư mục mới</h4>
                        <input 
                            value={newFolderName} 
                            onChange={e => setNewFolderName(e.target.value)} 
                            className="w-full border p-2 rounded-lg mb-4 outline-none focus:border-blue-500" 
                            placeholder="Tên thư mục..." 
                            autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setShowNewFolder(false)} className="px-4 py-2 text-gray-500 font-bold text-sm">Hủy</button>
                            <button onClick={handleCreateFolder} disabled={isProcessing} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm">Tạo</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Rename Modal */}
            {renamingItem && (
                <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setRenamingItem(null)}>
                    <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <h4 className="font-bold text-lg mb-4">Đổi tên: {renamingItem.name}</h4>
                        <input 
                            value={renameValue} 
                            onChange={e => setRenameValue(e.target.value)} 
                            className="w-full border p-2 rounded-lg mb-4 outline-none focus:border-blue-500" 
                            autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setRenamingItem(null)} className="px-4 py-2 text-gray-500 font-bold text-sm">Hủy</button>
                            <button onClick={executeRename} disabled={isProcessing} className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold text-sm">Lưu</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Credit Edit Modal */}
            {creditEditItem && (
                <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setCreditEditItem(null)}>
                    <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <h4 className="font-bold text-lg mb-4 flex items-center gap-2"><Copyright size={20}/> Nguồn / Bản quyền</h4>
                        <input 
                            value={creditEditValue} 
                            onChange={e => setCreditEditValue(e.target.value)} 
                            className="w-full border p-2 rounded-lg mb-4 outline-none focus:border-blue-500" 
                            placeholder="Nhập nguồn ảnh..."
                            autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setCreditEditItem(null)} className="px-4 py-2 text-gray-500 font-bold text-sm">Hủy</button>
                            <button onClick={executeCreditUpdate} disabled={isProcessing} className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-bold text-sm">Cập nhật</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Move Modal */}
            {movingItem && (
                <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setMovingItem(null)}>
                    <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm max-h-[60vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <h4 className="font-bold text-lg mb-4">Di chuyển "{movingItem.name}" đến:</h4>
                        <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-2 mb-4 bg-gray-50 custom-scrollbar">
                            {!lockedPath && (
                                <button 
                                    onClick={() => setMoveDestination('root')}
                                    className={`w-full text-left p-2 rounded-lg flex items-center gap-2 text-sm font-bold ${moveDestination === 'root' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200 text-gray-600'}`}
                                >
                                    <HardDrive size={16}/> Root
                                </button>
                            )}
                            {allFolders.filter(f => f.id !== movingItem.id).map(f => (
                                <button 
                                    key={f.id}
                                    onClick={() => setMoveDestination(f.id)}
                                    className={`w-full text-left p-2 rounded-lg flex items-center gap-2 text-sm font-bold mt-1 ${moveDestination === f.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200 text-gray-600'}`}
                                >
                                    <Folder size={16}/> {f.name}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setMovingItem(null)} className="px-4 py-2 text-gray-500 font-bold text-sm">Hủy</button>
                            <button onClick={executeMove} disabled={isProcessing || !moveDestination} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm disabled:opacity-50">Di chuyển</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. Delete Confirm */}
            <ConfirmationModal 
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={executeDelete}
                title={viewMode === 'trash' ? "Xóa vĩnh viễn?" : "Chuyển vào thùng rác?"}
                message={viewMode === 'trash' 
                    ? `Bạn có chắc muốn xóa vĩnh viễn "${itemToDelete?.name}"? Hành động này không thể hoàn tác.` 
                    : `Bạn có chắc muốn xóa "${itemToDelete?.name}"? Nếu là thư mục, toàn bộ nội dung bên trong cũng sẽ bị xóa.`}
            />
        </div>
    );

    if (inline) {
        return ModalContent;
    }

    // Use higher z-index (20000) to ensure visibility above EditableImage (9999)
    return createPortal(
        <div className="fixed inset-0 z-[20000] grid place-items-center bg-black/80 backdrop-blur-md p-4 animate-fade-in" onClick={onClose}>
            {ModalContent}
        </div>,
        document.body
    );
};

export default MediaLibraryModal;
