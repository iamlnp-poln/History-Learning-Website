
import React, { useState, useEffect } from 'react';
import { 
    Plus, Type, Image as ImageIcon, Quote, ArrowUp, ArrowDown, 
    Trash2, Save, Loader2, MoreVertical, X, Heading, Columns, LayoutTemplate, Bold, Italic,
    Grid2X2
} from 'lucide-react';
import { db, auth, doc, onSnapshot, setDoc } from '../firebaseConfig';
import { uploadToStorage, ADMIN_UIDS } from '../services/storageService';
import { useToast } from '../contexts/ToastContext';
import EditableImage from './EditableImage'; // Import EditableImage
import MediaLibraryModal from './MediaLibraryModal';
import ConfirmationModal from './ConfirmationModal';

// --- Types ---
export type BlockType = 'paragraph' | 'image' | 'heading' | 'quote' | 'two-columns' | 'three-quarter-columns' | 'card-grid';

export interface Card {
    id: string;
    image?: string;
    title?: string;
    description?: string;
}

export interface ContentBlock {
    id: string;
    type: BlockType;
    content?: string; // For text, heading, quote
    subtitle?: string; // For heading subtitle
    url?: string;     // For image
    caption?: string; // For image caption
    isBold?: boolean; // For text
    isItalic?: boolean; // For text
    // For columns
    col1Content?: string;
    col1Subtitle?: string;
    col2Content?: string;
    col2Subtitle?: string;
    col1Image?: string;
    col2Image?: string;
    swapColumns?: boolean;
    // For card-grid
    cards?: Card[];
}

interface ContentBuilderProps {
    articleId: string; // Unique ID for this article (e.g., 'heritage-article-123')
    className?: string;
}

const ContentBuilder: React.FC<ContentBuilderProps> = ({ articleId, className = "" }) => {
    const { showToast } = useToast();
    const [blocks, setBlocks] = useState<ContentBlock[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [uploadingBlockId, setUploadingBlockId] = useState<string | null>(null);
    const [showMediaLibrary, setShowMediaLibrary] = useState(false);
    const [activeImageBlockId, setActiveImageBlockId] = useState<string | null>(null);
    const [activeImageColumn, setActiveImageColumn] = useState<'col1' | 'col2' | string | null>(null); // Extended to support card IDs
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [blockToDelete, setBlockToDelete] = useState<number | null>(null);

    // Check Admin
    useEffect(() => {
        const checkAdmin = async (user: any) => {
            if (!user) { setIsAdmin(false); return; }
            // Check hardcoded admin or firestore admin
            // Simplified check for now relying on existing pattern
            setIsAdmin(!!user); 
        };
        const unsubscribe = auth?.onAuthStateChanged((user: any) => {
             setIsAdmin(!!user && ADMIN_UIDS.includes(user.uid));
        });
        return () => unsubscribe && unsubscribe();
    }, []);

    // Sync Data
    useEffect(() => {
        if (!articleId || !db) return;
        const unsub = onSnapshot(doc(db, 'articleContent', articleId), (docSnap: any) => {
            if (docSnap.exists()) {
                setBlocks(docSnap.data().blocks || []);
            } else {
                setBlocks([]); // Default empty
            }
            setIsLoading(false);
        });
        return () => unsub();
    }, [articleId]);

    // --- Actions ---

    const addBlock = (type: BlockType) => {
        const newBlock: ContentBlock = {
            id: Date.now().toString(),
            type,
            content: '',
            url: '',
            caption: '',
            cards: type === 'card-grid' ? [{ id: 'card-1', title: '', description: '', image: '' }] : undefined
        };
        setBlocks([...blocks, newBlock]);
    };

    const updateBlock = (id: string, updates: Partial<ContentBlock>) => {
        setBlocks(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
    };

    const removeBlock = (index: number) => {
        setBlockToDelete(index);
        setDeleteModalOpen(true);
    };

    const confirmRemoveBlock = () => {
        if (blockToDelete === null) return;
        const newBlocks = [...blocks];
        newBlocks.splice(blockToDelete, 1);
        setBlocks(newBlocks);
        setBlockToDelete(null);
    };

    const moveBlock = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === blocks.length - 1) return;
        
        const newBlocks = [...blocks];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        [newBlocks[index], newBlocks[swapIndex]] = [newBlocks[swapIndex], newBlocks[index]];
        setBlocks(newBlocks);
    };

    const handleImageSelect = (url: string) => {
        if (activeImageBlockId) {
            if (activeImageColumn === 'col1') {
                updateBlock(activeImageBlockId, { col1Image: url });
            } else if (activeImageColumn === 'col2') {
                updateBlock(activeImageBlockId, { col2Image: url });
            } else if (activeImageColumn && activeImageColumn.startsWith('card-')) {
                const block = blocks.find(b => b.id === activeImageBlockId);
                if (block && block.cards) {
                    const newCards = block.cards.map(c => c.id === activeImageColumn ? { ...c, image: url } : c);
                    updateBlock(activeImageBlockId, { cards: newCards });
                }
            } else {
                updateBlock(activeImageBlockId, { url });
            }
        }
        setShowMediaLibrary(false);
        setActiveImageBlockId(null);
        setActiveImageColumn(null);
    };

    const openMediaLibrary = (blockId: string, column?: 'col1' | 'col2' | string) => {
        setActiveImageBlockId(blockId);
        setActiveImageColumn(column || null);
        setShowMediaLibrary(true);
    };

    const handleSave = async () => {
        if (!db) return;
        setIsSaving(true);
        try {
            await setDoc(doc(db, 'articleContent', articleId), {
                blocks,
                updatedAt: new Date(),
                updatedBy: auth.currentUser?.email
            });
            setIsEditing(false);
            showToast("Lưu bài viết thành công!", "success");
        } catch (error: any) {
            showToast("Lỗi lưu: " + error.message, "error");
        } finally {
            setIsSaving(false);
        }
    };

    // --- Renderers ---

    const renderBlockView = (block: ContentBlock) => {
        const textStyle = `${block.isBold ? 'font-bold' : ''} ${block.isItalic ? 'italic' : ''}`;
        
        switch (block.type) {
            case 'heading':
                return (
                    <div className="mt-12 mb-6 text-center">
                        <h3 className="text-2xl font-bold heritage-heading text-history-dark">{block.content}</h3>
                        {block.subtitle && <p className="text-stone-500 font-serif italic mt-2">{block.subtitle}</p>}
                    </div>
                );
            case 'paragraph':
                return (
                    <div className={`text-gray-800 text-lg leading-loose mb-6 text-justify font-serif whitespace-pre-wrap heritage-dropcap ${textStyle}`}>
                        {block.content}
                    </div>
                );
            case 'quote':
                return (
                    <blockquote className={`heritage-quote p-8 my-10 rounded-2xl text-lg font-serif text-center relative max-w-3xl mx-auto ${textStyle}`}>
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-5xl text-history-gold opacity-50">"</span>
                        {block.content}
                    </blockquote>
                );
            case 'image':
                const uniqueImageId = `${articleId}-img-${block.id}`;
                return (
                    <figure className="my-12 w-full max-w-4xl mx-auto">
                        <div className="heritage-image overflow-hidden bg-gray-100">
                            <EditableImage 
                                imageId={uniqueImageId}
                                initialSrc={block.url}
                                alt={block.caption || "Article image"}
                                className="w-full h-auto"
                                disableEdit={false}
                            />
                        </div>
                        {block.caption && (
                            <figcaption className="text-center text-sm text-gray-500 italic mt-4 font-serif">
                                {block.caption}
                            </figcaption>
                        )}
                    </figure>
                );
            case 'two-columns':
                return (
                    <div className={`flex flex-col md:flex-row gap-8 my-10 ${block.swapColumns ? 'md:flex-row-reverse' : ''}`}>
                        <div className="flex-1">
                            {block.col1Image && (
                                <div className="heritage-image overflow-hidden bg-gray-100 mb-4">
                                    <EditableImage imageId={`${articleId}-img1-${block.id}`} initialSrc={block.col1Image} alt="Col 1" className="w-full h-auto" disableEdit={false} />
                                </div>
                            )}
                            {block.col1Subtitle && <h4 className="font-bold font-serif text-history-dark text-xl mb-2">{block.col1Subtitle}</h4>}
                            <div className="text-gray-800 text-lg leading-loose text-justify font-serif whitespace-pre-wrap">{block.col1Content}</div>
                        </div>
                        <div className="flex-1">
                            {block.col2Image && (
                                <div className="heritage-image overflow-hidden bg-gray-100 mb-4">
                                    <EditableImage imageId={`${articleId}-img2-${block.id}`} initialSrc={block.col2Image} alt="Col 2" className="w-full h-auto" disableEdit={false} />
                                </div>
                            )}
                            {block.col2Subtitle && <h4 className="font-bold font-serif text-history-dark text-xl mb-2">{block.col2Subtitle}</h4>}
                            <div className="text-gray-800 text-lg leading-loose text-justify font-serif whitespace-pre-wrap">{block.col2Content}</div>
                        </div>
                    </div>
                );
            case 'three-quarter-columns':
                return (
                    <div className={`flex flex-col md:flex-row gap-8 my-10 items-center ${block.swapColumns ? 'md:flex-row-reverse' : ''}`}>
                        <div className="w-full md:w-1/3">
                            {block.col1Image && (
                                <div className="heritage-image overflow-hidden bg-gray-100">
                                    <EditableImage imageId={`${articleId}-img1-${block.id}`} initialSrc={block.col1Image} alt="Col 1" className="w-full h-auto" disableEdit={false} />
                                </div>
                            )}
                        </div>
                        <div className="w-full md:w-2/3">
                            {block.col2Subtitle && <h4 className="font-bold font-serif text-history-dark text-xl mb-2">{block.col2Subtitle}</h4>}
                            <div className="text-gray-800 text-lg leading-loose text-justify font-serif whitespace-pre-wrap">{block.col2Content}</div>
                        </div>
                    </div>
                );
            case 'card-grid':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 my-12">
                        {block.cards?.map((card, idx) => (
                            <div key={card.id} className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col border border-stone-100 heritage-bg">
                                <div className="aspect-[4/3] overflow-hidden bg-stone-100">
                                    {card.image ? (
                                        <img src={card.image} alt={card.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-stone-300">
                                            <ImageIcon size={48} />
                                        </div>
                                    )}
                                </div>
                                <div className="p-6 text-center flex-1 flex flex-col justify-center">
                                    <h4 className="font-serif font-bold text-xl text-history-dark mb-3 leading-tight">{card.title}</h4>
                                    <p className="text-stone-600 font-serif text-sm leading-relaxed line-clamp-4">{card.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            default:
                return null;
        }
    };

    const renderBlockEdit = (block: ContentBlock, index: number) => {
        return (
            <div key={block.id} className="group relative border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl p-4 mb-4 bg-white transition-all">
                {/* Controls */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-sm rounded-lg p-1 border border-gray-200 z-10">
                    <button onClick={() => moveBlock(index, 'up')} className="p-1 hover:bg-gray-100 rounded text-gray-600" title="Lên"><ArrowUp size={16}/></button>
                    <button onClick={() => moveBlock(index, 'down')} className="p-1 hover:bg-gray-100 rounded text-gray-600" title="Xuống"><ArrowDown size={16}/></button>
                    <div className="w-px bg-gray-200 mx-1"></div>
                    <button onClick={() => removeBlock(index)} className="p-1 hover:bg-red-50 text-red-500 rounded" title="Xóa"><Trash2 size={16}/></button>
                </div>

                {/* Badge */}
                <div className="absolute -top-3 left-4 bg-gray-100 text-gray-500 text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-gray-200">
                    {block.type === 'paragraph' && 'Đoạn văn'}
                    {block.type === 'heading' && 'Tiêu đề'}
                    {block.type === 'image' && 'Hình ảnh'}
                    {block.type === 'quote' && 'Trích dẫn'}
                    {block.type === 'two-columns' && '2 Cột'}
                    {block.type === 'three-quarter-columns' && 'Cột 1/3 - 2/3'}
                    {block.type === 'card-grid' && 'Lưới thẻ'}
                </div>

                {/* Edit Inputs */}
                <div className="mt-2">
                    {block.type === 'heading' && (
                        <div className="space-y-2">
                            <input 
                                value={block.content}
                                onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                                className="w-full font-bold text-xl border-b border-gray-200 focus:border-blue-500 outline-none py-2 bg-transparent"
                                placeholder="Nhập tiêu đề chính..."
                            />
                            <input 
                                value={block.subtitle || ''}
                                onChange={(e) => updateBlock(block.id, { subtitle: e.target.value })}
                                className="w-full text-sm border-b border-gray-200 focus:border-blue-500 outline-none py-1 bg-transparent italic text-gray-600"
                                placeholder="Nhập phụ đề (tùy chọn)..."
                            />
                        </div>
                    )}
                    
                    {(block.type === 'paragraph' || block.type === 'quote') && (
                        <div className="space-y-2">
                            <div className="flex gap-2 mb-2">
                                <button 
                                    onClick={() => updateBlock(block.id, { isBold: !block.isBold })}
                                    className={`p-1.5 rounded ${block.isBold ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    title="In đậm"
                                ><Bold size={16}/></button>
                                <button 
                                    onClick={() => updateBlock(block.id, { isItalic: !block.isItalic })}
                                    className={`p-1.5 rounded ${block.isItalic ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    title="In nghiêng"
                                ><Italic size={16}/></button>
                            </div>
                            <textarea 
                                value={block.content}
                                onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                                className={`w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50 min-h-[100px] ${block.isBold ? 'font-bold' : ''} ${block.isItalic ? 'italic' : ''}`}
                                placeholder={block.type === 'quote' ? "Nhập câu trích dẫn..." : "Nhập nội dung đoạn văn..."}
                            />
                        </div>
                    )}

                    {block.type === 'image' && (
                        <div className="flex gap-4">
                            <div className="w-1/3 aspect-[4/3] bg-gray-100 rounded-lg border border-gray-200 overflow-hidden relative flex items-center justify-center">
                                {block.url ? (
                                    <img src={block.url} className="w-full h-full object-cover" />
                                ) : (
                                    <ImageIcon className="text-gray-300" size={32} />
                                )}
                            </div>
                            <div className="flex-1 flex flex-col gap-2">
                                <button 
                                    onClick={() => openMediaLibrary(block.id)}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors w-fit font-bold text-sm"
                                >
                                    <ImageIcon size={16} /> Chọn ảnh từ thư viện
                                </button>
                                <input 
                                    value={block.url}
                                    onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                                    className="w-full text-xs border border-gray-200 rounded p-2 text-gray-500"
                                    placeholder="Hoặc dán URL ảnh..."
                                />
                                <input 
                                    value={block.caption}
                                    onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                                    className="w-full text-sm border-b border-gray-200 focus:border-blue-500 outline-none py-1 bg-transparent italic"
                                    placeholder="Chú thích ảnh..."
                                />
                            </div>
                        </div>
                    )}

                    {block.type === 'two-columns' && (
                        <div className="space-y-4">
                            <div className="flex justify-end">
                                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                    <input type="checkbox" checked={block.swapColumns || false} onChange={(e) => updateBlock(block.id, { swapColumns: e.target.checked })} />
                                    Đảo vị trí 2 cột
                                </label>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1 space-y-2 border border-gray-200 p-3 rounded-lg bg-gray-50">
                                    <h5 className="font-bold text-sm text-gray-500">Cột 1</h5>
                                    <button onClick={() => openMediaLibrary(block.id, 'col1')} className="w-full py-2 bg-white border border-gray-200 rounded text-sm flex items-center justify-center gap-2 hover:bg-gray-100">
                                        <ImageIcon size={14}/> {block.col1Image ? 'Đổi ảnh' : 'Thêm ảnh'}
                                    </button>
                                    {block.col1Image && <img src={block.col1Image} className="w-full h-24 object-cover rounded" />}
                                    <input value={block.col1Subtitle || ''} onChange={(e) => updateBlock(block.id, { col1Subtitle: e.target.value })} className="w-full text-sm border-b border-gray-300 py-1 bg-transparent" placeholder="Tiêu đề phụ..." />
                                    <textarea value={block.col1Content || ''} onChange={(e) => updateBlock(block.id, { col1Content: e.target.value })} className="w-full p-2 border border-gray-300 rounded text-sm min-h-[100px]" placeholder="Nội dung..." />
                                </div>
                                <div className="flex-1 space-y-2 border border-gray-200 p-3 rounded-lg bg-gray-50">
                                    <h5 className="font-bold text-sm text-gray-500">Cột 2</h5>
                                    <button onClick={() => openMediaLibrary(block.id, 'col2')} className="w-full py-2 bg-white border border-gray-200 rounded text-sm flex items-center justify-center gap-2 hover:bg-gray-100">
                                        <ImageIcon size={14}/> {block.col2Image ? 'Đổi ảnh' : 'Thêm ảnh'}
                                    </button>
                                    {block.col2Image && <img src={block.col2Image} className="w-full h-24 object-cover rounded" />}
                                    <input value={block.col2Subtitle || ''} onChange={(e) => updateBlock(block.id, { col2Subtitle: e.target.value })} className="w-full text-sm border-b border-gray-300 py-1 bg-transparent" placeholder="Tiêu đề phụ..." />
                                    <textarea value={block.col2Content || ''} onChange={(e) => updateBlock(block.id, { col2Content: e.target.value })} className="w-full p-2 border border-gray-300 rounded text-sm min-h-[100px]" placeholder="Nội dung..." />
                                </div>
                            </div>
                        </div>
                    )}

                    {block.type === 'three-quarter-columns' && (
                        <div className="space-y-4">
                            <div className="flex justify-end">
                                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                    <input type="checkbox" checked={block.swapColumns || false} onChange={(e) => updateBlock(block.id, { swapColumns: e.target.checked })} />
                                    Đảo vị trí (Ảnh sang phải)
                                </label>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-1/3 space-y-2 border border-gray-200 p-3 rounded-lg bg-gray-50">
                                    <h5 className="font-bold text-sm text-gray-500">Cột Ảnh (1/3)</h5>
                                    <button onClick={() => openMediaLibrary(block.id, 'col1')} className="w-full py-2 bg-white border border-gray-200 rounded text-sm flex items-center justify-center gap-2 hover:bg-gray-100">
                                        <ImageIcon size={14}/> {block.col1Image ? 'Đổi ảnh' : 'Thêm ảnh'}
                                    </button>
                                    {block.col1Image && <img src={block.col1Image} className="w-full h-32 object-cover rounded" />}
                                </div>
                                <div className="w-2/3 space-y-2 border border-gray-200 p-3 rounded-lg bg-gray-50">
                                    <h5 className="font-bold text-sm text-gray-500">Cột Nội dung (2/3)</h5>
                                    <input value={block.col2Subtitle || ''} onChange={(e) => updateBlock(block.id, { col2Subtitle: e.target.value })} className="w-full text-sm border-b border-gray-300 py-1 bg-transparent font-bold" placeholder="Tiêu đề phụ..." />
                                    <textarea value={block.col2Content || ''} onChange={(e) => updateBlock(block.id, { col2Content: e.target.value })} className="w-full p-2 border border-gray-300 rounded text-sm min-h-[150px]" placeholder="Nội dung..." />
                                </div>
                            </div>
                        </div>
                    )}

                    {block.type === 'card-grid' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h5 className="font-bold text-sm text-gray-500">Danh sách thẻ ({block.cards?.length || 0}/4)</h5>
                                {(block.cards?.length || 0) < 4 && (
                                    <button 
                                        onClick={() => {
                                            const newCards = [...(block.cards || []), { id: `card-${Date.now()}`, title: '', description: '', image: '' }];
                                            updateBlock(block.id, { cards: newCards });
                                        }}
                                        className="text-xs flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100"
                                    >
                                        <Plus size={14}/> Thêm thẻ
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {block.cards?.map((card, cIdx) => (
                                    <div key={card.id} className="border border-gray-200 p-4 rounded-xl bg-gray-50 relative group/card">
                                        <button 
                                            onClick={() => {
                                                if ((block.cards?.length || 0) <= 1) return;
                                                const newCards = block.cards?.filter(c => c.id !== card.id);
                                                updateBlock(block.id, { cards: newCards });
                                            }}
                                            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover/card:opacity-100 transition-opacity"
                                            title="Xóa thẻ"
                                        >
                                            <X size={14}/>
                                        </button>
                                        <div className="space-y-3">
                                            <div className="flex gap-3">
                                                <div className="w-24 h-24 bg-white rounded-lg border border-gray-200 overflow-hidden flex-shrink-0 relative">
                                                    {card.image ? (
                                                        <img src={card.image} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                            <ImageIcon size={20} />
                                                        </div>
                                                    )}
                                                    <button 
                                                        onClick={() => openMediaLibrary(block.id, card.id)}
                                                        className="absolute inset-0 bg-black/40 text-white opacity-0 hover:opacity-100 flex items-center justify-center text-[10px] font-bold transition-opacity"
                                                    >
                                                        Chọn ảnh
                                                    </button>
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <input 
                                                        value={card.title} 
                                                        onChange={(e) => {
                                                            const newCards = block.cards?.map(c => c.id === card.id ? { ...c, title: e.target.value } : c);
                                                            updateBlock(block.id, { cards: newCards });
                                                        }}
                                                        className="w-full text-sm font-bold border-b border-gray-300 py-1 bg-transparent" 
                                                        placeholder="Tiêu đề thẻ..." 
                                                    />
                                                    <textarea 
                                                        value={card.description} 
                                                        onChange={(e) => {
                                                            const newCards = block.cards?.map(c => c.id === card.id ? { ...c, description: e.target.value } : c);
                                                            updateBlock(block.id, { cards: newCards });
                                                        }}
                                                        className="w-full text-xs p-2 border border-gray-300 rounded bg-white min-h-[60px]" 
                                                        placeholder="Mô tả ngắn..." 
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // --- Main Render ---

    if (isLoading) return <div className="py-10 text-center text-gray-400"><Loader2 className="animate-spin inline mr-2"/> Đang tải nội dung...</div>;

    return (
        <div className={`relative ${className}`}>
            {/* Admin Toggle */}
            {isAdmin && !isEditing && (
                <button 
                    onClick={() => setIsEditing(true)}
                    className="mb-6 flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-full hover:bg-blue-100 transition-all border border-blue-200 mx-auto"
                >
                    <MoreVertical size={16} /> Chỉnh sửa bài viết
                </button>
            )}

            {/* Content Display (View Mode) */}
            {!isEditing && (
                <div className="article-content">
                    {blocks.length > 0 ? (
                        blocks.map(block => <div key={block.id} className="animate-fade-in">{renderBlockView(block)}</div>)
                    ) : (
                        <p className="text-gray-400 italic text-center py-8">Nội dung chi tiết đang được cập nhật.</p>
                    )}
                </div>
            )}

            {/* Editor Mode */}
            {isEditing && (
                <div className="bg-[#fdfbf7] p-6 md:p-10 rounded-3xl border-2 border-[#e7b457] shadow-xl my-8">
                    <div className="flex justify-between items-center mb-8 border-b border-[#e7b457]/30 pb-4">
                        <h3 className="font-bold text-xl font-serif text-[#3a2713] uppercase tracking-wider">Trình Soạn Thảo Di Sản</h3>
                        <div className="flex gap-2">
                            <button onClick={() => setIsEditing(false)} className="p-2 text-gray-500 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"><X size={24}/></button>
                        </div>
                    </div>

                    <div className="space-y-6 mb-12">
                        {blocks.map((block, idx) => renderBlockEdit(block, idx))}
                        
                        {blocks.length === 0 && (
                            <div className="text-center py-12 text-[#8a6d3b] border-2 border-dashed border-[#d4bc8d] rounded-2xl bg-white/50 font-serif italic">
                                Chưa có nội dung. Hãy sử dụng thanh công cụ bên dưới để thêm khối mới.
                            </div>
                        )}
                    </div>

                    {/* Toolbar - Hardware Style */}
                    <div className="sticky bottom-6 bg-[#151619] p-4 rounded-2xl shadow-2xl border border-gray-700 flex flex-wrap gap-4 items-center justify-between z-50">
                        <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
                            <button onClick={() => addBlock('paragraph')} className="flex flex-col items-center justify-center w-16 h-16 bg-[#2a2b30] hover:bg-[#3a3b40] rounded-xl text-xs font-mono text-gray-300 transition-colors border border-gray-600 hover:border-[#e7b457] group">
                                <Type size={20} className="mb-1 text-gray-400 group-hover:text-[#e7b457]"/> Văn bản
                            </button>
                            <button onClick={() => addBlock('image')} className="flex flex-col items-center justify-center w-16 h-16 bg-[#2a2b30] hover:bg-[#3a3b40] rounded-xl text-xs font-mono text-gray-300 transition-colors border border-gray-600 hover:border-[#e7b457] group">
                                <ImageIcon size={20} className="mb-1 text-gray-400 group-hover:text-[#e7b457]"/> Hình ảnh
                            </button>
                            <button onClick={() => addBlock('heading')} className="flex flex-col items-center justify-center w-16 h-16 bg-[#2a2b30] hover:bg-[#3a3b40] rounded-xl text-xs font-mono text-gray-300 transition-colors border border-gray-600 hover:border-[#e7b457] group">
                                <Heading size={20} className="mb-1 text-gray-400 group-hover:text-[#e7b457]"/> Tiêu đề
                            </button>
                            <button onClick={() => addBlock('quote')} className="flex flex-col items-center justify-center w-16 h-16 bg-[#2a2b30] hover:bg-[#3a3b40] rounded-xl text-xs font-mono text-gray-300 transition-colors border border-gray-600 hover:border-[#e7b457] group">
                                <Quote size={20} className="mb-1 text-gray-400 group-hover:text-[#e7b457]"/> Trích dẫn
                            </button>
                            <button onClick={() => addBlock('two-columns')} className="flex flex-col items-center justify-center w-16 h-16 bg-[#2a2b30] hover:bg-[#3a3b40] rounded-xl text-xs font-mono text-gray-300 transition-colors border border-gray-600 hover:border-[#e7b457] group">
                                <Columns size={20} className="mb-1 text-gray-400 group-hover:text-[#e7b457]"/> 2 Cột
                            </button>
                            <button onClick={() => addBlock('three-quarter-columns')} className="flex flex-col items-center justify-center w-16 h-16 bg-[#2a2b30] hover:bg-[#3a3b40] rounded-xl text-xs font-mono text-gray-300 transition-colors border border-gray-600 hover:border-[#e7b457] group">
                                <LayoutTemplate size={20} className="mb-1 text-gray-400 group-hover:text-[#e7b457]"/> Cột 1/3
                            </button>
                            <button onClick={() => addBlock('card-grid')} className="flex flex-col items-center justify-center w-16 h-16 bg-[#2a2b30] hover:bg-[#3a3b40] rounded-xl text-xs font-mono text-gray-300 transition-colors border border-gray-600 hover:border-[#e7b457] group">
                                <Grid2X2 size={20} className="mb-1 text-gray-400 group-hover:text-[#e7b457]"/> Lưới thẻ
                            </button>
                        </div>
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-8 py-4 bg-[#e7b457] text-[#151619] rounded-xl font-bold shadow-[0_0_15px_rgba(231,180,87,0.4)] hover:shadow-[0_0_25px_rgba(231,180,87,0.6)] hover:bg-[#f1c40f] transition-all disabled:opacity-50 uppercase tracking-wider text-sm"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} Lưu Bài Viết
                        </button>
                    </div>
                </div>
            )}
            {showMediaLibrary && (
                <MediaLibraryModal 
                    onClose={() => {
                        setShowMediaLibrary(false);
                        setActiveImageBlockId(null);
                        setActiveImageColumn(null);
                    }} 
                    onSelect={handleImageSelect} 
                />
            )}
            <ConfirmationModal 
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmRemoveBlock}
                title="Xóa khối nội dung?"
                message="Bạn có chắc chắn muốn xóa khối nội dung này không? Hành động này không thể hoàn tác."
            />
        </div>
    );
};

export default ContentBuilder;
