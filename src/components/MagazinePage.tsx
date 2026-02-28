
import React, { useState, useEffect } from 'react';
import { BookOpen, User, Star, ArrowRight, Sparkles, Flower, Scroll, ChevronDown, X } from 'lucide-react';
import EditableImage from './EditableImage';
import EditableText from './EditableText';
import ContentBuilder from './ContentBuilder';

// --- Types ---
interface Article {
    id: string;
    title: string;
    author: string;
    summary: string;
    coverImage: string;
}

interface IssueChapter {
    id: string; // 'hoi-1', 'hoi-2'
    title: string; // "Hồi I", "Hồi II"
    subtitle: string; // "Nghệ thuật thưởng thức", "Nghệ thuật chiêm ngưỡng"
    description: string;
    articles: Article[];
}

// --- Mock Data (Based on your Instagram content) ---
const MOCK_CHAPTERS: IssueChapter[] = [
    {
        id: "hoi-1",
        title: "Hồi I",
        subtitle: "Nghệ thuật thưởng thức",
        description: "Lắng nghe những thanh âm vọng về từ quá khứ, nếm trải dư vị của lịch sử qua văn chương và âm nhạc.",
        articles: [
            { id: "art-ca-nuong", title: "Ca nương Kiều Anh - Mảnh ghép văn hóa Bắc Bộ", author: "Minh Hoàng", summary: "Hành trình đưa ca trù đến gần hơn với giới trẻ.", coverImage: "" },
            { id: "art-tinh-hoa-nhac", title: "Nhã nhạc cung đình - Tiếng vọng ngàn năm", author: "Thanh Trúc", summary: "Âm hưởng vàng son một thuở của triều Nguyễn.", coverImage: "" }
        ]
    },
    {
        id: "hoi-2",
        title: "Hồi II",
        subtitle: "Nghệ thuật chiêm ngưỡng",
        description: "Ngắm nhìn vẻ đẹp trường tồn của kiến trúc, trang phục và những tuyệt tác thủ công.",
        articles: [
            { id: "art-chua-linh-phuoc", title: "Chùa Linh Phước", author: "Bảo Ngọc", summary: "Kiến trúc khảm sành độc đáo - Nơi mảnh vỡ kể chuyện.", coverImage: "" },
            { id: "art-gach-bong", title: "Gạch bông - Dấu ấn kiến trúc Pháp", author: "Nhất Phong", summary: "Vẻ đẹp du nhập từ phương Tây trở thành bản sắc Việt.", coverImage: "" },
            { id: "art-ao-dai", title: "Cổ phục Việt - Hồn cốt dân tộc", author: "Cát Tường", summary: "Sự hồi sinh rực rỡ của Việt phục trong lòng người trẻ.", coverImage: "" }
        ]
    }
];

const MagazinePage: React.FC = () => {
    const [chapters, setChapters] = useState(MOCK_CHAPTERS);
    const [readingArticleId, setReadingArticleId] = useState<string | null>(null);
    const [activeChapterId, setActiveChapterId] = useState<string>('intro');

    // Scroll Spy to update active chapter
    useEffect(() => {
        const handleScroll = () => {
            const sections = ['intro', 'hoi-1', 'hoi-2', 'masthead'];
            for (const section of sections) {
                const element = document.getElementById(section);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    if (rect.top >= 0 && rect.top <= window.innerHeight / 2) {
                        setActiveChapterId(section);
                        break;
                    }
                }
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleReadArticle = (id: string) => {
        setReadingArticleId(id);
        setTimeout(() => {
            const readerElement = document.getElementById('magazine-reader');
            if (readerElement) {
                // Scroll to reader but leave a bit of space for header
                const y = readerElement.getBoundingClientRect().top + window.scrollY - 100;
                window.scrollTo({top: y, behavior: 'smooth'});
            }
        }, 100);
    };

    const activeArticle = chapters.flatMap(c => c.articles).find(a => a.id === readingArticleId);

    // --- Components ---

    const PatternBorder = ({ side }: { side: 'left' | 'right' }) => (
        <div className={`hidden xl:block absolute top-0 bottom-0 w-24 z-20 ${side === 'left' ? 'left-0 border-r' : 'right-0 border-l'} border-[#d4af37]/30 bg-[#fdfbf7]`}>
            <div className="sticky top-0 h-screen w-full overflow-hidden opacity-30">
                {/* User can upload the "Gạch bông" image here */}
                <EditableImage 
                    imageId={`mag-pattern-${side}`} 
                    initialSrc="" 
                    alt="Pattern" 
                    className="w-full h-full object-cover"
                    disableEdit={false} 
                />
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f9f5eb] text-[#3e2723] font-serif relative overflow-x-hidden selection:bg-[#8a1c1c] selection:text-white">
            
            {/* Pattern Borders (Left & Right for Desktop) */}
            <PatternBorder side="left" />
            <PatternBorder side="right" />

            {/* --- 1. COVER / HERO SECTION --- */}
            <div id="intro" className="relative min-h-[90vh] flex flex-col items-center justify-center p-6 xl:px-32 border-b-8 border-[#8a1c1c]">
                {/* Background Paper Texture */}
                <div className="absolute inset-0 z-0 opacity-40 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]"></div>
                
                {/* Hero Content */}
                <div className="relative z-10 text-center max-w-4xl mx-auto border-4 border-[#3e2723] p-8 md:p-16 bg-white/50 backdrop-blur-sm shadow-2xl">
                    <div className="absolute top-4 left-4 text-[#8a1c1c] opacity-50"><Sparkles size={32}/></div>
                    <div className="absolute bottom-4 right-4 text-[#8a1c1c] opacity-50"><Sparkles size={32}/></div>

                    <p className="text-[#8a1c1c] font-bold tracking-[0.3em] uppercase text-sm md:text-base mb-6">
                        <EditableText id="mag-issue-num" defaultText="Ấn phẩm số 01 - Tháng 12/2024" />
                    </p>

                    <h1 className="text-6xl md:text-9xl font-black text-[#8a1c1c] mb-2 leading-none font-serif tracking-tighter drop-shadow-sm">
                        <EditableText id="mag-title-main" defaultText="TINH HOA" />
                    </h1>
                    
                    <div className="flex items-center justify-center gap-4 my-6">
                        <div className="h-[2px] w-12 md:w-24 bg-[#3e2723]"></div>
                        <Star className="text-[#d4af37] fill-current w-8 h-8 animate-spin-slow" />
                        <div className="h-[2px] w-12 md:w-24 bg-[#3e2723]"></div>
                    </div>

                    <p className="text-lg md:text-2xl italic text-[#5d4037] max-w-2xl mx-auto leading-relaxed mb-8">
                        <EditableText id="mag-slogan" defaultText='"Vì sao chúng tôi chọn cái tên này? Tinh túy, quý giá và rực rỡ nhất."' />
                    </p>

                    <div className="inline-block border-2 border-[#8a1c1c] rounded-full p-1">
                        <div className="bg-[#8a1c1c] text-[#fdfbf7] px-8 py-3 rounded-full font-bold uppercase tracking-wider text-sm md:text-base cursor-default">
                            The Black Swans
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-10 animate-bounce text-[#3e2723]/50">
                    <ChevronDown size={40} />
                </div>
            </div>

            {/* --- 2. INTRO & MISSION --- */}
            <div className="max-w-4xl mx-auto px-6 py-20 xl:px-0 text-center relative">
                <Flower className="absolute top-0 left-10 text-[#d4af37]/20 w-32 h-32" />
                <h2 className="text-3xl md:text-4xl font-bold text-[#3e2723] mb-8 relative z-10">
                    <EditableText id="mag-mission-title" defaultText="Sứ mệnh của chúng tôi" />
                </h2>
                <div className="text-lg md:text-xl leading-loose text-[#5d4037] relative z-10">
                    <EditableText 
                        id="mag-mission-body" 
                        tag="div" 
                        multiline 
                        defaultText="Tinh Hoa được sinh ra với một tôn chỉ rõ ràng: Cầu nối giữa quá khứ và tương lai. Chúng tôi không chỉ đơn thuần nhìn về quá khứ, mà còn muốn chứng minh rằng văn hóa truyền thống đang được thổi một làn gió mới đầy sáng tạo và nhiệt huyết từ chính thế hệ trẻ."
                    />
                </div>
            </div>

            {/* --- 3. MAIN CONTENT (CHAPTERS) --- */}
            <div className="xl:px-32 pb-20">
                {chapters.map((chapter, idx) => (
                    <div key={chapter.id} id={chapter.id} className="mb-24 scroll-mt-24">
                        {/* Chapter Divider */}
                        <div className="flex items-center gap-6 mb-12">
                            <div className="text-6xl md:text-8xl font-black text-[#d4af37]/30 select-none">0{idx + 1}</div>
                            <div className="flex-1 border-t-2 border-[#3e2723]/10"></div>
                            <div className="text-right">
                                <h2 className="text-4xl md:text-5xl font-bold text-[#8a1c1c] mb-1">
                                    <EditableText id={`mag-chap-title-${chapter.id}`} defaultText={chapter.title} />
                                </h2>
                                <p className="text-xl md:text-2xl text-[#3e2723] italic">
                                    <EditableText id={`mag-chap-sub-${chapter.id}`} defaultText={chapter.subtitle} />
                                </p>
                            </div>
                        </div>

                        {/* Chapter Intro */}
                        <div className="max-w-3xl ml-auto mb-16 text-right text-gray-600 italic text-lg border-r-4 border-[#d4af37] pr-6">
                            <EditableText id={`mag-chap-desc-${chapter.id}`} defaultText={chapter.description} />
                        </div>

                        {/* Articles Grid (Scrapbook Style) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 px-4">
                            {chapter.articles.map((article, artIdx) => (
                                <div 
                                    key={article.id}
                                    onClick={() => handleReadArticle(article.id)}
                                    className={`
                                        group cursor-pointer relative bg-white p-3 shadow-xl transition-all duration-500 hover:z-10 hover:scale-105
                                        ${artIdx % 2 === 0 ? 'rotate-1' : '-rotate-1'}
                                        hover:rotate-0
                                    `}
                                >
                                    {/* Tape effect */}
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-8 bg-[#f0e6d2]/80 rotate-1 shadow-sm z-20"></div>

                                    {/* Image Area */}
                                    <div className="aspect-[3/4] overflow-hidden mb-4 relative bg-gray-200 border border-gray-100">
                                        <EditableImage 
                                            imageId={`mag-art-thumb-${article.id}`} 
                                            initialSrc={article.coverImage} 
                                            alt={article.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 filter sepia-[0.2] group-hover:sepia-0"
                                            disableEdit={true}
                                        />
                                        <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.1)] pointer-events-none"></div>
                                    </div>

                                    {/* Text Area */}
                                    <div className="text-center px-2 pb-4">
                                        <h3 className="text-xl font-bold text-[#3e2723] mb-2 font-serif leading-tight group-hover:text-[#8a1c1c] transition-colors">
                                            {article.title}
                                        </h3>
                                        <p className="text-xs font-bold uppercase tracking-widest text-[#d4af37] mb-3">
                                            {article.author}
                                        </p>
                                        <p className="text-sm text-gray-600 line-clamp-3 italic">
                                            {article.summary}
                                        </p>
                                    </div>

                                    {/* Read More Button */}
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#8a1c1c] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* --- 4. ARTICLE READER (Overlay) --- */}
            {activeArticle && (
                <div id="magazine-reader" className="relative z-30 max-w-5xl mx-auto px-4 md:px-0 mb-20 scroll-mt-24 animate-slide-up">
                    <div className="bg-white p-8 md:p-16 shadow-2xl relative border-y-4 border-[#8a1c1c]">
                        <button 
                            onClick={() => setReadingArticleId(null)}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-[#8a1c1c] hover:bg-red-50 rounded-full transition-colors"
                        >
                            <X size={32} />
                        </button>

                        <div className="text-center mb-12">
                            <span className="bg-[#fdfbf7] text-[#3e2723] px-4 py-1 rounded-full text-xs font-bold uppercase tracking-[0.2em] border border-[#3e2723]/20 mb-6 inline-block">
                                Bài viết chi tiết
                            </span>
                            <h1 className="text-4xl md:text-6xl font-black font-serif text-[#8a1c1c] mb-6 leading-tight">
                                <EditableText id={`mag-art-title-${activeArticle.id}`} defaultText={activeArticle.title} />
                            </h1>
                            <div className="flex items-center justify-center gap-3 text-gray-500 font-medium">
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 border border-gray-300">
                                    <User size={20} />
                                </div>
                                <div className="text-left">
                                    <div className="text-xs uppercase tracking-wider">Tác giả</div>
                                    <div className="text-[#3e2723] font-bold">
                                        <EditableText id={`mag-art-auth-${activeArticle.id}`} defaultText={activeArticle.author} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="prose prose-lg prose-stone max-w-none font-serif text-justify">
                            {/* ContentBuilder renders the body text and inline images */}
                            <ContentBuilder articleId={`mag-content-${activeArticle.id}`} />
                        </div>

                        <div className="mt-16 pt-10 border-t border-gray-200 text-center">
                            <button onClick={() => setReadingArticleId(null)} className="inline-flex items-center gap-2 text-[#8a1c1c] font-bold uppercase tracking-widest hover:underline">
                                <BookOpen size={20}/> Đọc bài khác
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- 5. MASTHEAD (Tòa Soạn) --- */}
            <div id="masthead" className="bg-[#3e2723] text-[#fdfbf7] py-20 px-6 xl:px-32 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>
                <div className="max-w-4xl mx-auto relative z-10 text-center">
                    <div className="mb-10">
                        <div className="w-20 h-20 mx-auto border-4 border-[#d4af37] rounded-full flex items-center justify-center mb-6">
                            <Star className="w-10 h-10 text-[#d4af37] fill-current" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold font-serif mb-2">Tòa Soạn TINH HOA</h2>
                        <p className="text-[#d4af37] tracking-widest uppercase text-sm">The Black Swans</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left max-w-2xl mx-auto">
                        <div className="space-y-4">
                            <div className="border-b border-[#fdfbf7]/20 pb-2 mb-4">
                                <h3 className="font-bold text-[#d4af37] uppercase text-sm tracking-wider">Chịu trách nhiệm nội dung</h3>
                            </div>
                            <div>
                                <p className="font-bold text-lg">TS. Nguyễn Văn A</p>
                                <p className="text-sm opacity-70">Cố vấn chuyên môn</p>
                            </div>
                            <div>
                                <p className="font-bold text-lg">Nguyễn Thị B</p>
                                <p className="text-sm opacity-70">Tổng biên tập</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="border-b border-[#fdfbf7]/20 pb-2 mb-4">
                                <h3 className="font-bold text-[#d4af37] uppercase text-sm tracking-wider">Đội ngũ thực hiện</h3>
                            </div>
                            <div>
                                <p className="font-bold text-lg">The Black Swans</p>
                                <p className="text-sm opacity-70">Biên tập & Thiết kế</p>
                            </div>
                            <div>
                                <p className="font-bold text-lg">CLB Nhiếp ảnh USSH</p>
                                <p className="text-sm opacity-70">Hình ảnh</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-16 pt-8 border-t border-[#fdfbf7]/10 text-xs opacity-50">
                        <p>© 2024 Dự án Trạm Lịch Sử 4.0 & Tạp chí Tinh Hoa.</p>
                        <p>Bản quyền nội dung thuộc về nhóm tác giả. Vui lòng không sao chép dưới mọi hình thức.</p>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default MagazinePage;
