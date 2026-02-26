
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Globe, Flag, Layout, BrainCircuit, Gamepad2, Shield, Zap, CheckCircle, ArrowRight, Clock, X, Sparkles, GraduationCap } from 'lucide-react';
import EditableImage from './EditableImage';
import EditableText from './EditableText';
import { HISTORY_STAGES } from '../data';
import { HistoryStage } from '../types';

const OVERVIEW_STAGES = [
  { id: "stage-1940", period: "1940 - 1949", title: "Cách mạng & Kháng chiến kiến quốc", content: "Cách mạng Tháng Tám thành công, Việt Nam giành độc lập trong bối cảnh Thế chiến II kết thúc và trật tự hai cực Mỹ–Liên Xô hình thành.", image: "" },
  { id: "stage-1950", period: "1950 - 1959", title: "Điện Biên Phủ & Chia cắt đất nước", content: "Việt Nam đẩy mạnh kháng chiến chống Pháp, chiến thắng Điện Biên Phủ 1954 chấm dứt ách thực dân, đất nước tạm thời chia cắt trong bối cảnh Chiến tranh Lạnh lan rộng toàn cầu.", image: "" },
  { id: "stage-1960", period: "1960 - 1969", title: "Cao trào kháng chiến chống Mỹ", content: "Việt Nam bước vào cao trào đấu tranh chống Mỹ, chiến thắng vang dội như “Điện Biên Phủ trên không” đặt nền cho thắng lợi sau này, trong khi thế giới căng thẳng bởi Chiến tranh Lạnh và các phong trào giải phóng dân tộc.", image: "" },
  { id: "stage-1970", period: "1970 - 1979", title: "Thống nhất & Bảo vệ biên giới", content: "Việt Nam giành thắng lợi 1975, thống nhất đất nước và bắt đầu khôi phục sau chiến tranh, trong khi thế giới tiếp tục đối đầu Chiến tranh Lạnh và chứng kiến biến động kinh tế – chính trị toàn cầu.", image: "" },
  { id: "stage-1980", period: "1980 - 1989", title: "Vượt khó & Công cuộc Đổi Mới", content: "Việt Nam chống Mỹ ác liệt, nổi bật với “Chiến tranh Việt Nam” và phong trào đấu tranh thống nhất đất nước, trong bối cảnh Chiến tranh Lạnh và phong trào giải phóng dân tộc toàn cầu", image: "" },
  { id: "stage-1990", period: "1990 - 1999", title: "Hội nhập & Phát triển", content: "Việt Nam hội nhập quốc tế, đổi mới kinh tế và bình thường hóa quan hệ với nhiều nước, trong khi thế giới chứng kiến kết thúc Chiến tranh Lạnh, Liên Xô tan rã và toàn cầu hóa tăng tốc.", image: "" },
  { id: "stage-2000", period: "2000 - Nay", title: "Kỷ nguyên Hội nhập toàn diện", content: "Việt Nam đẩy mạnh hội nhập kinh tế – xã hội, gia nhập WTO (2007) và phát triển hạ tầng, trong khi thế giới chứng kiến công nghệ thông tin bùng nổ và toàn cầu hóa mạnh mẽ.", image: "" }
];

const FEATURES = [
  { icon: <Layout className="text-blue-500" size={32} />, title: "Timeline Song Song", desc: "Kết nối Lịch sử Việt Nam & Thế giới trên cùng một trục thời gian để so sánh trực quan." },
  { icon: <BrainCircuit className="text-purple-500" size={32} />, title: "AI Tutor Thông Minh", desc: "Trợ lý ảo Gemini giải đáp thắc mắc, phân tích sâu và tạo đề thi tự động 24/7." },
  { icon: <Gamepad2 className="text-green-500" size={32} />, title: "Học Mà Chơi", desc: "Hệ thống Gamification với các trò chơi nhập vai, trắc nghiệm giúp giảm áp lực học tập." },
  { icon: <Shield className="text-red-500" size={32} />, title: "Dữ Liệu Chính Thống", desc: "Nội dung bám sát Sách Giáo Khoa và các nguồn tài liệu lịch sử uy tín." },
  { icon: <Zap className="text-yellow-500" size={32} />, title: "Tương Tác Đa Chiều", desc: "Trải nghiệm học tập với bản đồ, video, hình ảnh và âm thanh sống động." },
  { icon: <CheckCircle className="text-teal-500" size={32} />, title: "Theo Dõi Tiến Độ", desc: "Lưu trữ kết quả làm bài, thống kê điểm số để tối ưu lộ trình ôn tập." }
];

const HomePage: React.FC = () => {
  const [selectedStage, setSelectedStage] = useState<HistoryStage | null>(null);
  const navigate = useNavigate();

  const handleNav = (path: string) => {
    navigate(path);
  };

  const handleViewDetails = (overviewStage: any) => {
    const historyStageId = `${overviewStage.id}s`; 
    const fullStageData = HISTORY_STAGES.find(s => s.id === historyStageId);

    if (fullStageData) {
        setSelectedStage(fullStageData);
    } else {
        setSelectedStage({
            id: overviewStage.id,
            period: overviewStage.period,
            title: overviewStage.title,
            summaryVideoUrl: '',
            vietnam: [],
            world: [],
            image: '',
        });
    }
  };

  const renderModal = () => {
      if (!selectedStage || typeof document === 'undefined') return null;
      return createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedStage(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative animate-pop-in" onClick={(e) => e.stopPropagation()}>
            <div className="bg-history-dark text-white p-6 flex justify-between items-center sticky top-0 z-10">
               <div>
                  <span className="bg-history-gold text-history-dark px-3 py-1 rounded-full text-xs font-bold mb-2 inline-block">{selectedStage.period}</span>
                  <h3 className="text-2xl font-bold font-serif">{selectedStage.title}</h3>
               </div>
               <button onClick={() => setSelectedStage(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 bg-gray-50">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-red-100">
                      <div className="flex items-center gap-2 mb-4 border-b border-red-100 pb-2">
                          <Flag size={20} className="text-history-red" />
                          <h4 className="font-bold text-history-red text-lg uppercase">Lịch Sử Việt Nam</h4>
                      </div>
                      <div className="text-gray-700 leading-relaxed text-sm min-h-[150px]">
                          <EditableText id={`home-modal-vn-${selectedStage.id}`} multiline defaultText="Tóm tắt các sự kiện nổi bật tại Việt Nam trong giai đoạn này." tag="div" className="w-full h-full" />
                      </div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100">
                      <div className="flex items-center gap-2 mb-4 border-b border-blue-100 pb-2">
                          <Globe size={20} className="text-blue-600" />
                          <h4 className="font-bold text-blue-600 text-lg uppercase">Lịch Sử Thế Giới</h4>
                      </div>
                      <div className="text-gray-700 leading-relaxed text-sm min-h-[150px]">
                          <EditableText id={`home-modal-world-${selectedStage.id}`} multiline defaultText="Tóm tắt các sự kiện nổi bật trên Thế giới trong giai đoạn này." tag="div" className="w-full h-full" />
                      </div>
                  </div>
               </div>
            </div>
            <div className="p-4 border-t border-gray-200 bg-white flex justify-end">
               <button onClick={() => handleNav('/explore')} className="bg-history-red text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-red-800 transition-colors shadow-lg active:scale-95">
                 Khám phá chi tiết <ArrowRight size={18} />
               </button>
            </div>
          </div>
        </div>,
        document.body
      );
  }

  return (
    <div className="animate-fade-in pb-20">
      <div id="home-hero" className="relative bg-history-dark text-white py-20 px-4 text-center overflow-hidden group">
        <div className="absolute inset-0 z-0">
            <EditableImage imageId="home-hero-bg" initialSrc="" alt="Home Banner" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" disableEdit={true} enableLightbox={false} />
        </div>
        <div className="absolute inset-0 bg-black/60 z-0 pointer-events-none"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <EditableText id="home-hero-title" tag="h1" defaultText="Lịch Sử All-In-One" className="text-4xl md:text-6xl font-bold mb-6 font-serif text-history-gold drop-shadow-md" />
          <EditableText id="home-hero-subtitle" tag="p" multiline defaultText={`"Lịch sử là tường thành vững chắc cho tương lai"`} className="text-xl md:text-2xl text-gray-200 mb-8 font-serif italic drop-shadow-sm" />
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button onClick={() => handleNav('/explore')} className="bg-history-gold text-history-dark px-8 py-3 rounded-full font-bold hover:bg-yellow-500 transition-transform transform hover:-translate-y-1 shadow-lg flex items-center justify-center gap-2">
              <BookOpen size={20} /> Bắt Đầu Khám Phá
            </button>
            <button onClick={() => handleNav('/quiz')} className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-full font-bold hover:bg-white/10 transition-transform transform hover:-translate-y-1 flex items-center justify-center gap-2 shadow-lg">
              <GraduationCap size={20} /> Ôn Tập Kiến Thức
            </button>
          </div>
        </div>
      </div>

      <div id="home-intro" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="bg-white p-8 rounded-2xl shadow-xl border-t-4 border-history-red">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <EditableText id="home-intro-title" tag="h2" defaultText="Giới Thiệu Chung" className="text-3xl font-bold text-history-red mb-4 font-serif" />
              <EditableText id="home-intro-p1" tag="p" multiline defaultText="Chào mừng bạn đến với dự án Lịch Sử All-In-One. Đây là dự án ý tưởng khởi nghiệp (Startup Idea) đang được triển khai thử nghiệm (Pilot) trên nền tảng hạ tầng giới hạn, với sứ mệnh cách mạng hóa phương pháp học tập Lịch sử cho học sinh THPT." className="text-gray-700 leading-relaxed mb-4" />
              <EditableText id="home-intro-p2" tag="p" multiline defaultText="Chúng tôi tin rằng Lịch sử không chỉ là quá khứ mà là nền tảng của tương lai. Với việc thử nghiệm ứng dụng công nghệ số và AI, chúng tôi mong muốn tạo ra một hệ sinh thái học tập toàn diện, nơi kiến thức Lịch sử Việt Nam và Thế giới được kết nối chặt chẽ và sống động." className="text-gray-700 leading-relaxed mb-4" />
            </div>
            <div className="relative h-64 md:h-80 rounded-xl overflow-hidden shadow-md">
              <EditableImage imageId="homepage-intro-banner" initialSrc="" alt="History Books" className="w-full h-full" enableLightbox={false} />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pointer-events-none">
                <EditableText id="home-intro-img-caption" tag="p" defaultText="Khơi dậy niềm đam mê Sử học" className="text-white text-sm font-serif italic text-center pointer-events-auto" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NEW SECTION: HERITAGE TEASER (Âm Vang Di Sản) */}
      <div id="home-heritage-teaser" className="max-w-6xl mx-auto px-4 mt-16">
          <div 
            className="relative rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl h-[500px] md:h-[450px] group cursor-pointer border-2 md:border-4 border-white transform transition-all hover:scale-[1.01]" 
            onClick={() => handleNav('/heritage')}
          >
              {/* Background Image - Đã chỉnh lại Z-index và Pointer Events */}
              <div className="absolute inset-0 bg-gray-900">
                  <EditableImage 
                      imageId="home-heritage-teaser-bg" 
                      initialSrc=""
                      alt="Heritage Banner"
                      className="w-full h-full object-cover transition-transform duration-[15s] ease-linear group-hover:scale-110 opacity-90 group-hover:opacity-100"
                      disableEdit={false} 
                      enableLightbox={false}
                  />
                  {/* IMPORTANT: pointer-events-none để không chặn click vào ảnh bên dưới */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#2c241b] via-[#2c241b]/60 to-transparent md:bg-gradient-to-r md:from-[#2c241b] md:via-[#2c241b]/70 md:to-transparent/20 pointer-events-none"></div>
              </div>

              {/* Text Content - Đã thêm pointer-events-auto cho text cần sửa */}
              <div className="absolute inset-0 flex flex-col justify-end md:justify-center p-6 md:p-16 max-w-3xl text-white pointer-events-none pb-12 md:pb-16"> 
                  <div className="flex items-center gap-3 mb-4 md:mb-6 animate-slide-up">
                      <span className="bg-history-gold text-history-dark text-[10px] md:text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-sm">
                          <Sparkles size={12} /> Sắp ra mắt
                      </span>
                      <div className="h-px w-12 md:w-20 bg-history-gold/50"></div>
                  </div>
                  
                  {/* IMPORTANT: pointer-events-auto để click vào sửa text được */}
                  <h2 className="text-3xl md:text-6xl font-black font-serif mb-4 md:mb-6 leading-[1.1] animate-slide-up drop-shadow-xl pointer-events-auto" style={{animationDelay: '100ms'}}>
                      <EditableText id="home-heritage-title" defaultText="Âm Vang Di Sản" />
                  </h2>
                  
                  {/* IMPORTANT: pointer-events-auto để click vào sửa text được */}
                  <p className="text-sm md:text-xl text-stone-200 font-serif italic mb-8 md:mb-10 leading-relaxed opacity-90 animate-slide-up max-w-xl line-clamp-3 md:line-clamp-none pointer-events-auto" style={{animationDelay: '200ms'}}>
                      <EditableText 
                          id="home-heritage-desc" 
                          defaultText="Một không gian triển lãm số - Nơi lắng nghe tiếng vọng ngàn xưa qua trang phục, kiến trúc, sách quý và những ấn phẩm sáng tạo đương đại." 
                      />
                  </p>
                  
                  <button className="w-full md:w-fit flex items-center justify-center md:justify-start gap-3 bg-white text-history-dark px-6 md:px-8 py-3 md:py-4 rounded-full font-bold hover:bg-history-gold transition-all shadow-lg active:scale-95 group-hover:pl-10 animate-slide-up text-xs md:text-base uppercase tracking-wider pointer-events-auto" style={{animationDelay: '300ms'}}>
                      <span>Bước vào không gian văn hóa</span>
                      <ArrowRight size={20} />
                  </button>
              </div>
          </div>
      </div>

      <div id="home-timeline-preview" className="max-w-6xl mx-auto px-4 mt-20">
        <div className="text-center mb-10">
           <EditableText id="home-timeline-title" tag="h2" defaultText="Tổng Quan Chương Trình Lịch Sử 12" className="text-3xl font-bold text-history-dark font-serif inline-block border-b-4 border-history-gold pb-2" />
           <EditableText id="home-timeline-subtitle" tag="p" defaultText="Hệ thống hóa kiến thức theo 7 giai đoạn trọng tâm, bám sát nội dung Sách Giáo Khoa." className="text-gray-500 mt-4 max-w-2xl mx-auto" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {OVERVIEW_STAGES.map((stage, idx) => (
             <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl hover:border-history-gold transition-all duration-300 group flex flex-col h-full relative" >
                <div className="h-40 w-full bg-gray-100 overflow-hidden relative rounded-t-2xl">
                    <EditableImage imageId={`home-stage-thumb-${stage.id}`} initialSrc={stage.image} alt={stage.title} className="w-full h-full" enableLightbox={false} />
                    <div className="absolute top-2 left-2 bg-red-600 text-white px-3 py-1 rounded-md font-bold text-xs shadow-md z-10">{stage.period}</div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-3 font-serif group-hover:text-history-red transition-colors">
                      <EditableText id={`stage-card-title-${idx}`} defaultText={stage.title} />
                    </h3>
                    <div className="text-gray-600 text-sm leading-relaxed text-justify mb-4">
                      <EditableText id={`stage-card-content-${idx}`} multiline defaultText={stage.content} tag="p"/>
                    </div>
                    <button onClick={() => handleViewDetails(stage)} className="mt-auto pt-4 flex justify-between items-center border-t border-gray-100 w-full text-left group/button cursor-pointer">
                       <span className="text-xs font-bold text-gray-400 uppercase group-hover/button:text-history-red transition-colors">Xem chi tiết</span>
                       <div className="bg-history-gold/10 p-2 rounded-full text-history-gold group-hover/button:bg-history-gold group-hover/button:text-white transition-colors">
                          <ArrowRight size={16} />
                       </div>
                    </button>
                </div>
             </div>
           ))}
           <div className="bg-gradient-to-br from-history-red to-red-900 rounded-2xl p-6 shadow-md text-white flex flex-col justify-center items-center text-center h-full min-h-[300px]">
              <div className="bg-white/10 p-4 rounded-full mb-4"><Clock size={32} className="text-history-gold" /></div>
              <h3 className="text-xl font-bold font-serif mb-2">Bạn muốn tìm hiểu chi tiết?</h3>
              <p className="text-red-100 text-sm mb-6">Khám phá timeline sự kiện chi tiết cho từng giai đoạn.</p>
              <button onClick={() => handleNav('/explore')} className="bg-white text-history-red px-6 py-3 rounded-full font-bold text-sm hover:bg-history-gold hover:text-history-dark transition-colors flex items-center gap-2 shadow-lg">
                Xem chi tiết <ArrowRight size={16} />
              </button>
           </div>
        </div>
      </div>

      {/* NEW: Features / Solutions Section */}
      <div id="home-features" className="max-w-6xl mx-auto px-4 mt-24 mb-12">
        <div className="text-center mb-12">
           <h2 className="text-3xl font-bold text-history-dark font-serif inline-block border-b-4 border-history-red pb-2">
             <EditableText id="home-features-title" defaultText="Giải Pháp Đột Phá" />
           </h2>
           <p className="text-gray-500 mt-4 max-w-2xl mx-auto">
             <EditableText id="home-features-subtitle" defaultText="Những tính năng vượt trội giúp việc học Lịch sử trở nên dễ dàng và thú vị hơn." />
           </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
                    <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        {feature.icon}
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2 font-serif">{feature.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p>
                </div>
            ))}
        </div>
      </div>

      {renderModal()}
    </div>
  );
};

export default HomePage;
