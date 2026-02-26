
import React, { useState, useEffect } from 'react';
import { 
    Plus, Type, Image as ImageIcon, Quote, ArrowUp, ArrowDown, 
    Trash2, Save, Loader2, MoreVertical, X, Heading 
} from 'lucide-react';
import { db, auth, doc, onSnapshot, setDoc } from '../firebaseConfig';
import { uploadToStorage, ADMIN_UIDS } from '../services/storageService';
import { useToast } from '../contexts/ToastContext';
import EditableImage from './EditableImage'; // Import EditableImage

// --- Types ---
export type BlockType = 'paragraph' | 'image' | 'heading' | 'quote';

export interface ContentBlock {
    id: string;
    type: BlockType;
    content?: string; // For text, heading, quote
    url?: string;     // For image
    caption?: string; // For image caption
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
            caption: ''
        };
        setBlocks([...blocks, newBlock]);
    };

    const updateBlock = (id: string, updates: Partial<ContentBlock>) => {
        setBlocks(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
    };

    const removeBlock = (index: number) => {
        if (!confirm("Xóa khối nội dung này?")) return;
        const newBlocks = [...blocks];
        newBlocks.splice(index, 1);
        setBlocks(newBlocks);
    };

    const moveBlock = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === blocks.length - 1) return;
        
        const newBlocks = [...blocks];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        [newBlocks[index], newBlocks[swapIndex]] = [newBlocks[swapIndex], newBlocks[index]];
        setBlocks(newBlocks);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, blockId: string) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setUploadingBlockId(blockId);
        try {
            const url = await uploadToStorage(file, 'article_content');
            updateBlock(blockId, { url });
        } catch (error: any) {
            showToast("Lỗi upload: " + error.message, "error");
        } finally {
            setUploadingBlockId(null);
        }
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
        switch (block.type) {
            case 'heading':
                return <h3 className="text-2xl font-bold font-serif text-history-dark mt-8 mb-4 border-l-4 border-history-gold pl-3">{block.content}</h3>;
            case 'paragraph':
                return (
                    <div className="text-gray-800 text-lg leading-loose mb-6 text-justify font-serif whitespace-pre-wrap">
                        {block.content}
                    </div>
                );
            case 'quote':
                return (
                    <blockquote className="border-l-4 border-history-red bg-gray-50 p-6 my-8 rounded-r-xl italic text-gray-700 font-serif text-lg">
                        "{block.content}"
                    </blockquote>
                );
            case 'image':
                // Construct a unique ID for the image so EditableImage can store credits separately
                const uniqueImageId = `${articleId}-img-${block.id}`;
                return (
                    <figure className="my-8 w-full">
                        <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200 bg-gray-100">
                            {/* Use EditableImage to support Credits/Source Attribution */}
                            <EditableImage 
                                imageId={uniqueImageId}
                                initialSrc={block.url}
                                alt={block.caption || "Article image"}
                                className="w-full h-auto"
                                disableEdit={false} // Allow admins to edit credit/source anytime
                            />
                        </div>
                        {block.caption && (
                            <figcaption className="text-center text-sm text-gray-500 italic mt-3 font-serif">
                                {block.caption}
                            </figcaption>
                        )}
                    </figure>
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
                    {block.type === 'heading' && 'Tiêu đề phụ'}
                    {block.type === 'image' && 'Hình ảnh'}
                    {block.type === 'quote' && 'Trích dẫn'}
                </div>

                {/* Edit Inputs */}
                <div className="mt-2">
                    {block.type === 'heading' && (
                        <input 
                            value={block.content}
                            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                            className="w-full font-bold text-xl border-b border-gray-200 focus:border-blue-500 outline-none py-2 bg-transparent"
                            placeholder="Nhập tiêu đề phụ..."
                        />
                    )}
                    
                    {(block.type === 'paragraph' || block.type === 'quote') && (
                        <textarea 
                            value={block.content}
                            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50 min-h-[100px]"
                            placeholder={block.type === 'quote' ? "Nhập câu trích dẫn..." : "Nhập nội dung đoạn văn..."}
                        />
                    )}

                    {block.type === 'image' && (
                        <div className="flex gap-4">
                            <div className="w-1/3 aspect-[4/3] bg-gray-100 rounded-lg border border-gray-200 overflow-hidden relative flex items-center justify-center">
                                {block.url ? (
                                    <img src={block.url} className="w-full h-full object-cover" />
                                ) : (
                                    <ImageIcon className="text-gray-300" size={32} />
                                )}
                                {uploadingBlockId === block.id && (
                                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                        <Loader2 className="animate-spin text-blue-500" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 flex flex-col gap-2">
                                <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors w-fit font-bold text-sm">
                                    <ImageIcon size={16} /> Chọn ảnh
                                    <input type="file" className="hidden" onChange={(e) => handleImageUpload(e, block.id)} accept="image/*" />
                                </label>
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
                                <p className="text-[10px] text-gray-400 italic">*Thông tin nguồn/bản quyền ảnh có thể chỉnh sửa trực tiếp trên ảnh ở chế độ xem.</p>
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
                <div className="bg-gray-50 p-6 rounded-3xl border border-blue-200 shadow-inner">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-blue-800">Trình soạn thảo bài viết</h3>
                        <div className="flex gap-2">
                            <button onClick={() => setIsEditing(false)} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full"><X size={20}/></button>
                        </div>
                    </div>

                    <div className="space-y-4 mb-8">
                        {blocks.map((block, idx) => renderBlockEdit(block, idx))}
                        
                        {blocks.length === 0 && (
                            <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-300 rounded-xl">
                                Chưa có nội dung. Hãy thêm khối mới.
                            </div>
                        )}
                    </div>

                    {/* Toolbar */}
                    <div className="sticky bottom-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-gray-200 flex flex-wrap gap-3 items-center justify-between z-50">
                        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
                            <button onClick={() => addBlock('paragraph')} className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-bold text-gray-700 whitespace-nowrap"><Type size={16}/> Văn bản</button>
                            <button onClick={() => addBlock('image')} className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-bold text-gray-700 whitespace-nowrap"><ImageIcon size={16}/> Hình ảnh</button>
                            <button onClick={() => addBlock('heading')} className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-bold text-gray-700 whitespace-nowrap"><Heading size={16}/> Tiêu đề</button>
                            <button onClick={() => addBlock('quote')} className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-bold text-gray-700 whitespace-nowrap"><Quote size={16}/> Trích dẫn</button>
                        </div>
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-6 py-2 bg-history-dark text-history-gold rounded-xl font-bold shadow-md hover:bg-black transition-all disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Lưu bài
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContentBuilder;
