
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
    MapPin, Book, Shirt, Dna, ArrowRight, X, Heart, Share2, 
    Compass, Library, Sparkles, Feather, Plus, Trash2, Loader2, 
    Link as LinkIcon, Images, Image as ImageIcon, ChevronLeft, ChevronDown, Check, ChevronRight
} from 'lucide-react';
import EditableImage from './EditableImage';
import EditableText from './EditableText';
import ContentBuilder from './ContentBuilder'; // Import new component
import { useToast } from '../contexts/ToastContext';
import { auth, db, collection, addDoc, onSnapshot, doc, setDoc, getDoc } from '../firebaseConfig';
import { ADMIN_UIDS, uploadToStorage } from '../services/storageService';
import { useLightbox } from '../contexts/LightboxContext'; 

// --- Types ---
type HeritageCategory = 'site' | 'research' | 'literature' | 'attire' | 'creative';

interface HeritageItem {
    id: string;
    category: HeritageCategory;
    title: string;
    subtitle: string;
    description: string;
    image: string;
    gallery?: string[]; 
    author?: string; 
    location?: string; 
    era?: string;
    isCustom?: boolean;
}

// --- Mock Data (Initial Content) ---
const INITIAL_ITEMS: HeritageItem[] = [
    {
        id: 'h-site-1',
        category: 'site',
        title: 'Cố Đô Huế',
        subtitle: 'Dấu ấn vàng son triều Nguyễn',
        description: 'Quần thể di tích Cố đô Huế không chỉ là những cung điện vàng son, mà là chứng nhân của một triều đại với bao thăng trầm lịch sử. Nơi đây lưu giữ hồn cốt của văn hóa cung đình, nhã nhạc và kiến trúc phong kiến đỉnh cao.',
        image: '',
        location: 'Thừa Thiên Huế',
        era: '1802 - 1945'
    },
    {
        id: 'h-attire-1',
        category: 'attire',
        title: 'Áo Ngũ Thân',
        subtitle: 'Quốc phục trang trọng và khiêm cung',
        description: 'Áo ngũ thân tay chẽn (áo lập lĩnh) là tiền thân của áo dài hiện đại. Năm thân áo tượng trưng cho tứ thân phụ mẫu và bản thân người mặc. Chiếc áo thể hiện đạo lý làm người, sự kín đáo và thẩm mỹ tinh tế của người Việt xưa.',
        image: '',
        era: 'Thời Nguyễn'
    },
    {
        id: 'h-book-1',
        category: 'research',
        title: 'Xứ Đàng Trong',
        subtitle: 'Lịch sử kinh tế - xã hội Việt Nam',
        description: 'Tác phẩm nghiên cứu kinh điển của Li Tana về lịch sử vùng đất phía Nam. Cuốn sách mở ra một nhìn mới mẻ, sống động về cách cha ông ta đã khai phá, giao thương và xây dựng một nền văn hóa Đàng Trong rực rỡ.',
        image: '',
        author: 'Li Tana'
    },
    {
        id: 'h-creative-1',
        category: 'creative',
        title: 'Sử Hộ Vương',
        subtitle: 'Huyền sử trong lòng bàn tay',
        description: 'Dự án board game lấy cảm hứng từ các nhân vật lịch sử Việt Nam. Với nét vẽ hiện đại và cơ chế chơi hấp dẫn, Sử Hộ Vương đã đưa các vị anh hùng từ trang sách khô khan trở thành những hình tượng sống động, gần gũi với giới trẻ.',
        image: '',
        era: 'Đương đại'
    },
    {
        id: 'h-lit-1',
        category: 'literature',
        title: 'Tuổi Thơ Dữ Dội',
        subtitle: 'Bản hùng ca của những chiến sĩ nhỏ',
        description: 'Kiệt tác văn học của Phùng Quán về các em thiếu niên trong Đội thiếu niên trinh sát của trung đoàn Trần Cao Vân. Một cuốn sách lấy đi nước mắt của bao thế hệ, gieo vào lòng người đọc tình yêu đất nước trong sáng và mãnh liệt.',
        image: '',
        author: 'Phùng Quán'
    }
];

const CATEGORIES: { id: HeritageCategory; label: string; icon: React.ElementType }[] = [
    { id: 'site', label: 'Di Tích & Địa Danh', icon: MapPin },
    { id: 'research', label: 'Sách Nghiên Cứu', icon: Library },
    { id: 'literature', label: 'Văn Học & Lịch Sử', icon: Feather },
    { id: 'attire', label: 'Y Phục & Di Sản', icon: Shirt },
    { id: 'creative', label: 'Ấn Phẩm Sáng Tạo', icon: Sparkles },
];

// Fallback IDs for default layout
const FALLBACK_BANNERS = ['heritage-hero-1', 'heritage-hero-2', 'heritage-hero-3'];

const HeritagePage: React.FC = () => {
    const { showToast } = useToast();
    const { openLightbox } = useLightbox();
    const [activeCategory, setActiveCategory] = useState<HeritageCategory | 'all'>('all');
    const [selectedItem, setSelectedItem] = useState<HeritageItem | null>(null);
    const [items, setItems] = useState<HeritageItem[]>(INITIAL_ITEMS);
    
    // Animation State for Modal
    const [isClosing, setIsClosing] = useState(false);
    
    // Banner Carousel State
    const [bannerIndex, setBannerIndex] = useState(0);
    // Legacy fixed IDs fallback
    const [bannerImages, setBannerImages] = useState<string[]>([]);

    // Admin State
    const [isAdmin, setIsAdmin] = useState(false);
    const [hiddenItemIds, setHiddenItemIds] = useState<string[]>([]);
    
    // Add/Edit Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newItem, setNewItem] = useState<Partial<HeritageItem>>({ category: 'site', gallery: [] });
    const [isUploading, setIsUploading] = useState(false);
    const [isUploadingGallery, setIsUploadingGallery] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Determine the active set of banners (Custom or Fallback)
    const activeBannerSet = useMemo(() => {
        return bannerImages.length > 0 ? bannerImages : FALLBACK_BANNERS;
    }, [bannerImages]);

    // Banner interval effect
    useEffect(() => {
        if (activeBannerSet.length <= 1) return;
        const timer = setInterval(() => {
            setBannerIndex((prev) => (prev + 1) % activeBannerSet.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [activeBannerSet.length]); // Depend on the EFFECTIVE banner set length

    const handleNextBanner = () => {
        setBannerIndex((prev) => (prev + 1) % activeBannerSet.length);
    };

    const handlePrevBanner = () => {
        setBannerIndex((prev) => (prev - 1 + activeBannerSet.length) % activeBannerSet.length);
    };

    // Check Admin
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
        const unsubscribe = auth?.onAuthStateChanged((user: any) => checkAdmin(user));
        return () => unsubscribe && unsubscribe();
    }, []);

    // Sync Data
    useEffect(() => {
        if (!db) return;
        
        // 1. Sync hidden items
        const unsubHidden = onSnapshot(collection(db, 'hiddenItems'), (snap: any) => {
            setHiddenItemIds(snap.docs.map((d: any) => d.id));
        });

        // 2. Sync custom heritage items
        const unsubCustom = onSnapshot(collection(db, 'customHeritageItems'), (snap: any) => {
            const customItems = snap.docs.map((d: any) => ({ id: d.id, ...d.data(), isCustom: true } as HeritageItem));
            setItems([...INITIAL_ITEMS, ...customItems]);
        });

        // 3. Sync Carousel Settings
        const unsubSettings = onSnapshot(doc(db, 'siteSettings', 'global'), (docSnap: any) => {
            if (docSnap.exists() && docSnap.data().heritageBanners && Array.isArray(docSnap.data().heritageBanners) && docSnap.data().heritageBanners.length > 0) {
                setBannerImages(docSnap.data().heritageBanners);
            } else {
                // Fallback to empty to trigger default placeholder if needed
                setBannerImages([]); 
            }
        });

        return () => { unsubHidden(); unsubCustom(); unsubSettings(); };
    }, []);

    // Filter Logic
    const filteredItems = (activeCategory === 'all' 
        ? items 
        : items.filter(item => item.category === activeCategory)).filter(i => !hiddenItemIds.includes(i.id));

    // UX: Scroll Lock when Modal is Open
    useEffect(() => {
        if (selectedItem) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [selectedItem]);

    const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const url = await uploadToStorage(file, 'heritage');
            setNewItem(prev => ({ ...prev, image: url }));
        } catch(e) { console.error(e); }
        finally { setIsUploading(false); }
    };

    const handleUploadGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setIsUploadingGallery(true);
        try {
            const newUrls: string[] = [];
            for (let i = 0; i < files.length; i++) {
                const url = await uploadToStorage(files[i], 'heritage_gallery');
                newUrls.push(url);
            }
            setNewItem(prev => ({ 
                ...prev, 
                gallery: [...(prev.gallery || []), ...newUrls] 
            }));
        } catch(e) { console.error(e); }
        finally { setIsUploadingGallery(false); }
    };

    const handleRemoveGalleryImage = (index: number) => {
        setNewItem(prev => ({
            ...prev,
            gallery: prev.gallery?.filter((_, i) => i !== index)
        }));
    };

    const handleAddItem = async () => {
        if (!newItem.title || !newItem.image) {
            showToast("Vui lòng nhập tên và ảnh bìa", "error");
            return;
        }
        setIsSaving(true);
        try {
            await addDoc(collection(db, 'customHeritageItems'), {
                ...newItem,
                gallery: newItem.gallery || [],
                createdAt: new Date(),
                createdBy: auth.currentUser?.email
            });
            showToast("Thêm di sản thành công", "success");
            setIsAddModalOpen(false);
            setNewItem({ category: 'site', gallery: [] });
        } catch (e: any) {
            showToast("Lỗi: " + e.message, "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteItem = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("Bạn muốn xóa (ẩn) mục này?")) return;
        try {
            await setDoc(doc(db, 'hiddenItems', id), {
                deletedAt: new Date(),
                deletedBy: auth.currentUser?.email
            });
            showToast("Đã xóa mục", "info");
        } catch (e) { showToast("Lỗi xóa", "error"); }
    };

    const handleScrollToContent = () => {
        const element = document.getElementById('heritage-grid');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleCloseDetail = () => {
        setIsClosing(true);
        setTimeout(() => {
            setSelectedItem(null);
            setIsClosing(false);
        }, 300); // 300ms match duration
    };

    // --- Detail Modal Component (Full Screen Mobile, Magazine Desktop) ---
    const renderDetailModal = () => {
        if (!selectedItem || typeof document === 'undefined') return null;

        // Combine main image with gallery for lightbox
        const allImages = [selectedItem.image, ...(selectedItem.gallery || [])];

        return createPortal(
            <div 
                className={`fixed inset-0 z-[200] bg-[#fdfbf7] overflow-y-auto transition-all duration-300 ease-in-out ${isClosing ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0 animate-fade-in'}`}
            >
                {/* Fixed Header Bar */}
                <div className="fixed top-0 left-0 right-0 bg-[#fdfbf7]/90 backdrop-blur-md border-b border-stone-200/50 p-4 md:px-8 z-50 flex justify-between items-center transition-all">
                    <button 
                        onClick={handleCloseDetail}
                        className="flex items-center gap-2 group text-stone-600 hover:text-history-dark transition-colors"
                    >
                        <div className="bg-stone-100 group-hover:bg-stone-200 p-2 rounded-full transition-colors">
                            <ChevronLeft size={24} />
                        </div>
                        <span className="font-bold hidden md:inline">Quay lại bộ sưu tập</span>
                    </button>
                    
                    <div className="flex gap-2 md:gap-4">
                        <button className="p-2 md:p-3 hover:bg-stone-100 rounded-full text-stone-500 transition-colors" title="Lưu">
                            <Heart size={20} />
                        </button>
                        <button className="p-2 md:p-3 hover:bg-stone-100 rounded-full text-stone-500 transition-colors" title="Chia sẻ">
                            <Share2 size={20} />
                        </button>
                    </div>
                </div>

                {/* Article Content Container */}
                <div className="pt-20 pb-20 w-full max-w-[1400px] mx-auto">
                    
                    {/* Hero Section */}
                    <div className="px-0 md:px-8 mb-8 md:mb-12">
                        <div className="w-full aspect-[4/3] md:aspect-[2.35/1] md:rounded-[3rem] overflow-hidden shadow-none md:shadow-2xl relative group cursor-zoom-in" onClick={() => openLightbox(selectedItem.image, allImages)}>
                            <EditableImage 
                                imageId={`heritage-cover-${selectedItem.id}`} // Unified ID for Sync
                                initialSrc={selectedItem.image}
                                alt={selectedItem.title}
                                className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105"
                                disableEdit={false} // Enable edit inside modal too
                            />
                            {/* Mobile Gradient for text readability if needed, but we put text below on mobile */}
                            <div className="absolute inset-0 bg-black/10 md:bg-transparent pointer-events-none"></div>
                            
                            <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 bg-black/60 backdrop-blur text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 pointer-events-none">
                                <ImageIcon size={14} /> Xem ảnh gốc
                            </div>
                        </div>
                    </div>

                    <div className="px-6 md:px-20 lg:px-40">
                        {/* Title Block */}
                        <div className="text-center mb-10 md:mb-16">
                            <div className="flex justify-center mb-4">
                                <span className="px-4 py-1.5 bg-history-gold/10 text-history-dark border border-history-gold/30 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm">
                                    {CATEGORIES.find(c => c.id === selectedItem.category)?.label}
                                </span>
                            </div>
                            <h1 className="text-3xl md:text-6xl font-black font-serif text-history-dark mb-4 md:mb-6 leading-tight">
                                <EditableText id={`h-title-${selectedItem.id}`} defaultText={selectedItem.title} />
                            </h1>
                            <p className="text-lg md:text-2xl text-stone-500 font-serif italic max-w-3xl mx-auto leading-relaxed">
                                <EditableText id={`h-sub-${selectedItem.id}`} defaultText={selectedItem.subtitle} />
                            </p>
                            
                            <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mt-8 text-xs md:text-sm font-bold text-stone-400 uppercase tracking-widest border-t border-b border-stone-200 py-6 max-w-2xl mx-auto">
                                {selectedItem.era && <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-history-gold"></div> {selectedItem.era}</span>}
                                {selectedItem.location && <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-history-red"></div> {selectedItem.location}</span>}
                                {selectedItem.author && <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> {selectedItem.author}</span>}
                            </div>
                        </div>

                        {/* Content Body - Replaced EditableText with ContentBuilder */}
                        <div className="mx-auto text-justify">
                            {/* 
                                Drop cap effect can be handled by ContentBuilder's first paragraph 
                                or we keep the summary text here if needed. 
                                But ContentBuilder is more flexible.
                            */}
                            
                            <ContentBuilder 
                                articleId={`heritage-article-${selectedItem.id}`} 
                                className="w-full"
                            />
                            
                            {/* Fallback for old data: If ContentBuilder is empty (checked internally), 
                                we could optionally show the old 'description' field, but it's cleaner to migrate manually.
                                For now, I'll render the old description ONLY if admin hasn't added blocks yet? 
                                No, let's keep it simple: Just use ContentBuilder. Admin will copy-paste old text into new blocks.
                            */}
                        </div>

                        {/* Gallery Section */}
                        {selectedItem.gallery && selectedItem.gallery.length > 0 && (
                            <div className="mt-16 md:mt-24 pt-10 border-t border-stone-200">
                                <h3 className="text-xl md:text-3xl font-bold font-serif text-history-dark mb-8 md:mb-12 text-center uppercase tracking-widest flex items-center justify-center gap-3">
                                    <Images className="text-history-gold"/> Tư Liệu Ảnh
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                                    {selectedItem.gallery.map((imgUrl, idx) => (
                                        <div 
                                            key={idx} 
                                            className={`rounded-[2rem] overflow-hidden shadow-md cursor-zoom-in group relative bg-gray-100 hover:shadow-2xl transition-all duration-500 ${idx % 3 === 0 ? 'md:col-span-2 aspect-[16/9]' : 'aspect-[4/3]'}`}
                                            onClick={() => openLightbox(imgUrl, allImages)}
                                        >
                                            <img 
                                                src={imgUrl} 
                                                alt={`Gallery ${idx}`} 
                                                className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-105"
                                                loading="lazy"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* End Mark */}
                        <div className="flex justify-center mt-20 opacity-30">
                            <Dna size={32} />
                        </div>
                    </div>
                </div>
            </div>,
            document.body
        );
    };

    return (
        <div className="min-h-screen bg-[#fdfbf7] animate-fade-in pb-20">
            {/* --- Full Screen Hero Section (min-h-screen) --- */}
            <div id="heritage-hero" className="relative min-h-screen overflow-hidden group flex flex-col w-full">
                {/* Background Banners Carousel (Legacy + New Dynamic) */}
                {bannerImages.length > 0 ? (
                    bannerImages.map((src, index) => (
                        <div 
                            key={index}
                            className={`absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out ${index === bannerIndex ? 'opacity-100' : 'opacity-0'}`}
                        >
                            <img 
                                src={src}
                                alt={`Heritage Banner ${index + 1}`}
                                className="w-full h-full object-cover transition-transform duration-[20s] ease-linear scale-110 origin-center"
                            />
                        </div>
                    ))
                ) : (
                    // Fallback to legacy fixed IDs if no dynamic list found
                    FALLBACK_BANNERS.map((id, index) => (
                        <div 
                            key={id}
                            className={`absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out ${index === bannerIndex ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                        >
                            <EditableImage 
                                imageId={id} 
                                initialSrc=""
                                alt={`Heritage Banner ${index + 1}`}
                                className="w-full h-full object-cover transition-transform duration-[20s] ease-linear scale-110 origin-center"
                                disableEdit={false} 
                                enableLightbox={false}
                            />
                        </div>
                    ))
                )}

                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#2c241b] via-transparent to-transparent z-10 pointer-events-none opacity-90 md:opacity-70"></div>
                <div className="absolute inset-0 bg-black/20 z-10 pointer-events-none"></div>
                
                {/* Navigation Buttons (Left/Right) */}
                <div className="absolute inset-0 z-20 pointer-events-none flex justify-between items-center px-4 md:px-8">
                    <button 
                        onClick={handlePrevBanner}
                        className="p-3 bg-black/20 hover:bg-black/50 text-white/50 hover:text-white rounded-full transition-all pointer-events-auto backdrop-blur-sm group/nav"
                        title="Hình trước"
                    >
                        <ChevronLeft size={32} className="transform group-hover/nav:-translate-x-1 transition-transform"/>
                    </button>
                    <button 
                        onClick={handleNextBanner}
                        className="p-3 bg-black/20 hover:bg-black/50 text-white/50 hover:text-white rounded-full transition-all pointer-events-auto backdrop-blur-sm group/nav"
                        title="Hình tiếp theo"
                    >
                        <ChevronRight size={32} className="transform group-hover/nav:translate-x-1 transition-transform"/>
                    </button>
                </div>

                {/* Text Content - Aligned Bottom using mt-auto in flex container */}
                {/* Raised padding-bottom on mobile (pb-48) to lift text up */}
                <div className="relative z-20 mt-auto pb-48 md:pb-32 pointer-events-none w-full">
                    <div className="w-full max-w-[1600px] mx-auto px-6 md:px-20 animate-slide-up pointer-events-auto">
                        <div className="text-center md:text-left">
                            <span className="text-history-gold font-bold tracking-[0.4em] uppercase text-xs md:text-sm mb-4 block drop-shadow-md">
                                Bộ sưu tập văn hóa
                            </span>
                            
                            <h1 className="text-4xl md:text-8xl font-black font-serif text-white mb-6 leading-tight drop-shadow-2xl">
                                <EditableText id="heritage-hero-title" defaultText="Âm Vang Di Sản" />
                            </h1>
                            
                            <p className="text-gray-300 text-sm md:text-lg max-w-2xl mx-auto md:mx-0 leading-relaxed drop-shadow-md font-medium">
                                <EditableText 
                                    id="heritage-hero-desc" 
                                    defaultText="Khám phá chiều sâu văn hóa Việt qua những trang phục, kiến trúc và những ấn phẩm sáng tạo vượt thời gian." 
                                />
                            </p>

                            {/* Carousel Indicators (Dots) */}
                            {activeBannerSet.length > 1 && (
                                <div className="flex gap-2 mt-8 justify-center md:justify-start">
                                    {activeBannerSet.map((_, idx) => (
                                        <button 
                                            key={idx}
                                            onClick={() => setBannerIndex(idx)}
                                            className={`h-1.5 rounded-full transition-all duration-300 ${idx === bannerIndex ? 'w-8 bg-history-gold' : 'w-2 bg-white/30 hover:bg-white/60'}`}
                                            aria-label={`Go to slide ${idx + 1}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Scroll Down Arrow - Centered using Flexbox absolute container */}
                {/* Raised to bottom-20 and changed animation */}
                <div className="absolute bottom-20 left-0 right-0 z-30 flex justify-center pointer-events-none">
                    <div 
                        onClick={handleScrollToContent}
                        className="animate-float cursor-pointer text-white/60 hover:text-white transition-colors p-2 pointer-events-auto"
                        aria-label="Cuộn xuống"
                    >
                        <ChevronDown size={40} strokeWidth={1.5} />
                    </div>
                </div>
            </div>

            {/* --- Filter Navigation --- */}
            <div id="heritage-grid" className="sticky top-16 z-30 bg-[#fdfbf7]/95 backdrop-blur border-b border-stone-200 shadow-sm py-4">
                <div className="max-w-7xl mx-auto px-4 overflow-x-auto hide-scrollbar flex gap-2 md:justify-center">
                    <button 
                        onClick={() => setActiveCategory('all')}
                        className={`
                            px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap border
                            ${activeCategory === 'all' 
                                ? 'bg-history-dark text-history-gold border-history-dark shadow-md' 
                                : 'bg-white text-stone-500 border-stone-200 hover:border-history-gold hover:text-history-dark'}
                        `}
                    >
                        Tất cả
                    </button>
                    {CATEGORIES.map(cat => (
                        <button 
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`
                                px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap border flex items-center gap-2
                                ${activeCategory === cat.id
                                    ? 'bg-history-dark text-history-gold border-history-dark shadow-md' 
                                    : 'bg-white text-stone-500 border-stone-200 hover:border-history-gold hover:text-history-dark'}
                            `}
                        >
                            <cat.icon size={16} />
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* --- Masonry-like Grid (Updated with Full-Bleed Image & Glass Effect) --- */}
            <div id="heritage-list" className="max-w-[1600px] mx-auto px-4 md:px-8 py-12">
                
                {/* Admin Add Button */}
                {isAdmin && (
                    <div className="flex justify-end mb-8">
                        <button 
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-transform hover:-translate-y-1 flex items-center gap-2"
                        >
                            <Plus size={20} /> Thêm Di Sản Mới
                        </button>
                    </div>
                )}

                <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6 mx-auto">
                    {filteredItems.map((item, index) => {
                        // Pseudo-random aspect ratio applied to the WHOLE card
                        const aspectClasses = ['aspect-[3/4]', 'aspect-[1/1]', 'aspect-[4/3]', 'aspect-[16/9]'];
                        const randomAspect = aspectClasses[index % aspectClasses.length];

                        return (
                            <div 
                                key={item.id}
                                className={`break-inside-avoid group relative rounded-3xl overflow-hidden mb-6 ${randomAspect} shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer bg-gray-200`}
                                onClick={() => setSelectedItem(item)}
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                {/* 1. Full-Bleed Image Background */}
                                <div className="absolute inset-0">
                                    {/* Handle missing image with placeholder pattern */}
                                    <div className="w-full h-full relative bg-stone-300">
                                        <EditableImage 
                                            imageId={`heritage-cover-${item.id}`} // Unified ID
                                            initialSrc={item.image}
                                            alt={item.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 z-0"
                                            disableEdit={false} // Enable Edit in Grid
                                            enableLightbox={false}
                                        />
                                        
                                        {/* Fallback pattern if image is empty/loading - CSS pattern only visible if image is missing */}
                                        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none -z-10"></div>
                                    </div>

                                    {/* Subtle gradient for text protection */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity pointer-events-none z-10"></div>
                                </div>

                                {/* 2. Top Badge */}
                                <div className="absolute top-4 left-4 z-20">
                                    <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-sm">
                                        {CATEGORIES.find(c => c.id === item.category)?.label}
                                    </span>
                                </div>

                                {/* 3. Hover Overlay Icon */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20 pointer-events-none">
                                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 transform scale-50 group-hover:scale-100 transition-transform">
                                        <ArrowRight className="text-white" size={28} />
                                    </div>
                                </div>

                                {/* 4. Bottom Glass Content */}
                                <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                                    <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl transition-all group-hover:bg-white/20">
                                        <h3 className="text-lg font-bold font-serif text-white mb-1 leading-tight group-hover:text-history-gold transition-colors drop-shadow-md">
                                            {item.title}
                                        </h3>
                                        <p className="text-xs text-gray-200 font-bold uppercase tracking-wider line-clamp-1 opacity-90">
                                            {item.subtitle}
                                        </p>
                                        
                                        <div className="mt-3 pt-3 border-t border-white/20 flex justify-between items-center text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                                            <span>{item.era || 'Lịch sử Việt Nam'}</span>
                                            {isAdmin && (
                                                <button 
                                                    onClick={(e) => handleDeleteItem(e, item.id)}
                                                    className="p-1.5 hover:bg-white/10 text-gray-300 hover:text-red-400 rounded-full transition-colors pointer-events-auto"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredItems.length === 0 && (
                    <div className="text-center py-24">
                        <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-300">
                            <Compass size={40} />
                        </div>
                        <p className="text-stone-500 font-serif text-lg">Chưa có di sản nào trong danh mục này.</p>
                        <button onClick={() => setActiveCategory('all')} className="text-history-gold font-bold text-sm mt-2 hover:underline">
                            Xem tất cả
                        </button>
                    </div>
                )}
            </div>

            {/* Add New Modal */}
            {isAddModalOpen && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[300] bg-black/80 grid place-items-center p-4 animate-fade-in backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}>
                    <div className="bg-white w-full max-w-2xl rounded-2xl p-8 animate-pop-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold font-serif text-history-dark">Thêm Di Sản Mới</h3>
                            <button onClick={() => setIsAddModalOpen(false)}><X size={24}/></button>
                        </div>
                        
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên di sản</label>
                                    <input className="w-full border rounded-xl px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-history-gold outline-none" value={newItem.title || ''} onChange={e => setNewItem({...newItem, title: e.target.value})} placeholder="VD: Trống Đồng..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Danh mục</label>
                                    <select className="w-full border rounded-xl px-4 py-3 bg-gray-50 outline-none" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value as any})}>
                                        {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tiêu đề phụ (Subtitle)</label>
                                <input className="w-full border rounded-xl px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-history-gold outline-none" value={newItem.subtitle || ''} onChange={e => setNewItem({...newItem, subtitle: e.target.value})} placeholder="VD: Biểu tượng văn hóa..." />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mô tả chi tiết</label>
                                <textarea className="w-full border rounded-xl px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-history-gold outline-none h-32" value={newItem.description || ''} onChange={e => setNewItem({...newItem, description: e.target.value})} placeholder="Nội dung bài viết..." />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tác giả (Nếu có)</label>
                                    <input className="w-full border rounded-xl px-3 py-2 bg-gray-50 text-sm" value={newItem.author || ''} onChange={e => setNewItem({...newItem, author: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Địa danh</label>
                                    <input className="w-full border rounded-xl px-3 py-2 bg-gray-50 text-sm" value={newItem.location || ''} onChange={e => setNewItem({...newItem, location: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Niên đại / Thời kỳ</label>
                                    <input className="w-full border rounded-xl px-3 py-2 bg-gray-50 text-sm" value={newItem.era || ''} onChange={e => setNewItem({...newItem, era: e.target.value})} />
                                </div>
                            </div>

                            {/* Image Uploads */}
                            <div className="border-t pt-4">
                                <label className="block text-sm font-bold text-gray-800 mb-2">Ảnh bìa (Bắt buộc)</label>
                                <div className="flex items-center gap-3">
                                    <input className="flex-1 border rounded-xl px-3 py-2 text-sm" value={newItem.image || ''} onChange={e => setNewItem({...newItem, image: e.target.value})} placeholder="URL ảnh bìa..." />
                                    <label className="cursor-pointer bg-blue-50 text-blue-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-100 flex items-center gap-2">
                                        {isUploading ? <Loader2 className="animate-spin" size={16}/> : <LinkIcon size={16}/>} Upload
                                        <input type="file" className="hidden" onChange={handleUploadCover} accept="image/*"/>
                                    </label>
                                </div>
                                {newItem.image && <img src={newItem.image} className="h-32 w-auto mt-2 rounded-lg shadow-sm object-cover" alt="Preview"/>}
                            </div>

                            {/* Gallery Upload */}
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2">Bộ sưu tập ảnh (Gallery)</label>
                                <label className="cursor-pointer border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors">
                                    {isUploadingGallery ? <Loader2 className="animate-spin text-blue-500 mb-2" size={24}/> : <Images className="text-gray-400 mb-2" size={24}/>}
                                    <span className="text-xs font-bold text-gray-500">Nhấn để chọn nhiều ảnh</span>
                                    <input type="file" multiple className="hidden" onChange={handleUploadGallery} accept="image/*"/>
                                </label>
                                {newItem.gallery && newItem.gallery.length > 0 && (
                                    <div className="grid grid-cols-4 gap-2 mt-3">
                                        {newItem.gallery.map((url, idx) => (
                                            <div key={idx} className="relative group">
                                                <img src={url} className="h-20 w-full object-cover rounded-lg" alt=""/>
                                                <button onClick={() => handleRemoveGalleryImage(idx)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button onClick={handleAddItem} disabled={isSaving} className="w-full bg-history-dark text-history-gold py-4 rounded-xl font-bold text-lg hover:bg-black transition-all shadow-lg flex justify-center items-center gap-2 mt-6">
                                {isSaving ? <Loader2 className="animate-spin"/> : <Check/>} Hoàn tất
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {renderDetailModal()}
        </div>
    );
};

export default HeritagePage;
