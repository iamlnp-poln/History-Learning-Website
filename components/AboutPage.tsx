
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Cpu, X, Phone, Mail, GraduationCap, Quote, Briefcase, ChevronRight, Plus, Trash2, Facebook, Link as LinkIcon, Loader2, Save, MapPin, Users, Star } from 'lucide-react';
import EditableText from './EditableText';
import EditableVideo from './EditableVideo';
import EditableImage from './EditableImage';
import ConfirmationModal from './ConfirmationModal';
import { db, auth, collection, addDoc, onSnapshot, doc, setDoc, getDoc } from '../firebaseConfig';
import { ADMIN_UIDS, getFolderIdByName, getVirtualAssets } from '../services/storageService'; // Added imports
import { useToast } from '../contexts/ToastContext';

interface TeamMember {
    id: string;
    img: string;
    defaultName: string;
    defaultRole: string;
    defaultClass?: string;
    defaultEmail?: string;
    defaultPhone?: string;
    defaultQuote?: string;
    isCustom?: boolean;
}

interface Advisor {
    id: string;
    img: string;
    defaultName: string;
    defaultRole: string;
}

const AboutPage: React.FC = () => {
  const { showToast } = useToast();
  const [isLetterOpen, setIsLetterOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null);
  
  // Animation States
  const [isAdvisorClosing, setIsAdvisorClosing] = useState(false);
  const [isMemberClosing, setIsMemberClosing] = useState(false);
  
  // Admin & Data State
  const [isAdmin, setIsAdmin] = useState(false);
  const [customMembers, setCustomMembers] = useState<TeamMember[]>([]);
  const [hiddenMemberIds, setHiddenMemberIds] = useState<string[]>([]);
  
  // Tech Logos State
  const [techLogos, setTechLogos] = useState<{name: string, url: string}[]>([]);

  // Facebook Link State
  const [fbLink, setFbLink] = useState('');
  const [isEditingFb, setIsEditingFb] = useState(false);
  const [tempFbLink, setTempFbLink] = useState('');

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);

  // Danh sách cố vấn (Static List)
  const advisors: Advisor[] = [
      { 
          id: "adv-phuong", 
          img: "",
          defaultName: "Cô Đoàn Thụy Kim Phượng",
          defaultRole: "Giáo viên phụ trách"
      },
      { 
          id: "adv-huong", 
          img: "",
          defaultName: "Cô Nguyễn Thị Hương",
          defaultRole: "Giáo viên Tin Học"
      },
      { 
          id: "adv-hoa", 
          img: "",
          defaultName: "Thầy Phạm Văn Hòa",
          defaultRole: "Giáo viên Tin Học"
      },
      { 
          id: "adv-ngan", 
          img: "",
          defaultName: "Cô Nguyễn Thị Kim Ngân",
          defaultRole: "Giáo viên Lịch Sử"
      },
      { 
          id: "adv-duong", 
          img: "",
          defaultName: "Anh Huỳnh Thái Dương",
          defaultRole: "Cựu Học Sinh"
      }
  ];

  // Static Team Data (Original 5 members)
  const staticTeam: TeamMember[] = [
      { 
          id: "tm-cat-tuong", 
          img: "", 
          defaultName: "Nguyễn Ngọc Cát Tường", 
          defaultRole: "Co-Founder",
          defaultClass: "Lớp 12E18",
          defaultEmail: "ctuong0306@gmail.com",
          defaultPhone: "0931 204 977",
          defaultQuote: "I haven't lost my virginity because I never lose."
      },
      { 
          id: "tm-cong-thanh", 
          img: "", 
          defaultName: "Đặng Công Thành", 
          defaultRole: "Co-Founder",
          defaultClass: "Lớp 12E18",
          defaultEmail: "dcthanh0803@gmail.com",
          defaultPhone: "0936 677 083",
          defaultQuote: "nóng tính đấy, nhưng luôn cháy hết mình"
      },
      { 
          id: "tm-thanh-truc", 
          img: "", 
          defaultName: "Nguyễn Đoàn Thanh Trúc", 
          defaultRole: "Core Member",
          defaultClass: "Lớp 12D15",
          defaultEmail: "thanhtruc101108@gmail.com",
          defaultPhone: "0383 338 262",
          defaultQuote: "Kẻ chiến thắng không bao giờ bỏ cuộc, kẻ bỏ cuộc không bao giờ chiến thắng."
      },
      { 
          id: "tm-bao-ngoc", 
          img: "", 
          defaultName: "Bùi Bảo Ngọc", 
          defaultRole: "Core Member",
          defaultClass: "Lớp 11A2",
          defaultEmail: "ngoc.3phai@gmail.com",
          defaultPhone: "0931 810 825",
          defaultQuote: "Sáng tạo không giới hạn, bản lĩnh không lùi bước."
      },
      { 
          id: "tm-nhat-phong", 
          img: "", 
          defaultName: "Lại Nhất Phong", 
          defaultRole: "Core Member",
          defaultClass: "Lớp 12A8",
          defaultEmail: "waytothefuture07@gmail.com",
          defaultPhone: "0772 998 715",
          defaultQuote: "Đơn vị nhỏ nhất của nỗ lực là một hơi thở. Hãy luôn bắt đầu từ những thứ nhỏ nhất."
      }
  ];

  // Default Technologies (Fallback)
  const DEFAULT_TECHNOLOGIES = [
      { name: "Google Gemini", url: "https://res.cloudinary.com/dszm8jtmk/image/upload/v1765877191/Google_Gemini_logo_2025.svg_hkejyb.png" },
      { name: "Google AI Studio", url: "https://res.cloudinary.com/dszm8jtmk/image/upload/v1765877191/google-ai-studio-logo-hd_bs3uig.png" },
      { name: "Google Cloud", url: "https://res.cloudinary.com/dszm8jtmk/image/upload/v1766159334/wq1og3ivq4zxkyq40ykn.svg" },
      { name: "Chatbase", url: "https://res.cloudinary.com/dszm8jtmk/image/upload/v1765877190/chatbase-logo_remdv3.webp" },
      { name: "YouTube", url: "https://res.cloudinary.com/dszm8jtmk/image/upload/v1765877190/YouTube_Logo_2017_tjyznl.png" },
      { name: "Firebase", url: "https://res.cloudinary.com/dszm8jtmk/image/upload/v1765877191/New_Firebase_logo_vttsg3.png" },
      { name: "React", url: "https://res.cloudinary.com/dszm8jtmk/image/upload/v1765877192/react-javascript-logo-hd_jjmsfe.png" },
      { name: "Cloudinary", url: "https://res.cloudinary.com/dszm8jtmk/image/upload/v1765877191/Cloudinary_logo_blue_0720_2x_yeikfo.png" },
      { name: "Vite", url: "https://res.cloudinary.com/dszm8jtmk/image/upload/v1765877192/Vite_Logo_ewa5dq.png" },
      { name: "Tailwind CSS", url: "https://res.cloudinary.com/dszm8jtmk/image/upload/v1765877191/Tailwind_CSS_logo_with_dark_text_hnomyg.png" },
  ];

  // Check Admin
  useEffect(() => {
    const checkAdmin = async (user: any) => {
        if (!user) { setIsAdmin(false); return; }
        if (ADMIN_UIDS.includes(user.uid)) { setIsAdmin(true); return; }
        if (db) {
            try {
                const docSnap = await getDoc(doc(db, 'admins', user.uid));
                setIsAdmin(docSnap.exists());
            } catch (e) { setIsAdmin(false); }
        }
    };
    const unsubscribe = auth?.onAuthStateChanged((user: any) => checkAdmin(user));
    return () => unsubscribe && unsubscribe();
  }, []);

  // Sync Custom Members & Hidden Items
  useEffect(() => {
      if(!db) return;
      
      const unsubHidden = onSnapshot(collection(db, 'hiddenItems'), (snap: any) => {
          setHiddenMemberIds(snap.docs.map((d: any) => d.id));
      });

      const unsubCustom = onSnapshot(collection(db, 'customTeamMembers'), (snap: any) => {
          const members = snap.docs.map((d: any) => ({ id: d.id, ...d.data(), isCustom: true } as TeamMember));
          setCustomMembers(members);
      });

      return () => { unsubHidden(); unsubCustom(); };
  }, []);

  // Fetch Platform Logos
  useEffect(() => {
      const fetchLogos = async () => {
          try {
              // 1. Find folder ID by name "Platform Logo"
              const folderId = await getFolderIdByName("Platform Logo");
              
              if (folderId) {
                  // 2. Get assets in that folder
                  const assets = await getVirtualAssets(folderId);
                  
                  // 3. Filter files only and map to format
                  const mappedLogos = assets
                      .filter(item => item.type === 'file' && item.url)
                      .map(item => ({
                          name: item.name.replace(/\.[^/.]+$/, ""), // Remove extension
                          url: item.url!
                      }));
                  
                  if (mappedLogos.length > 0) {
                      setTechLogos(mappedLogos);
                  }
              }
          } catch (e) {
              console.error("Error fetching platform logos:", e);
          }
      };
      fetchLogos();
  }, []);

  // Load Facebook Link when modal opens
  useEffect(() => {
      if (!selectedMember || !db) return;
      setFbLink(''); // Reset
      const linkId = `team-fb-${selectedMember.id}`;
      
      const unsub = onSnapshot(doc(db, 'linkOverrides', linkId), (docSnap: any) => {
          if(docSnap.exists() && docSnap.data().url) {
              setFbLink(docSnap.data().url);
          } else {
              setFbLink('');
          }
      });
      return () => unsub();
  }, [selectedMember]);

  const handleAddMember = async () => {
      if(!db) return;
      const newName = prompt("Nhập tên thành viên mới:");
      if(!newName) return;

      try {
          await addDoc(collection(db, 'customTeamMembers'), {
              defaultName: newName,
              defaultRole: "Thành viên",
              defaultClass: "Lớp...",
              img: "",
              createdAt: new Date()
          });
          showToast("Thêm thành viên thành công!", "success");
      } catch(e: any) { showToast("Lỗi thêm thành viên: " + e.message, "error"); }
  };

  const confirmDelete = (e: React.MouseEvent, member: TeamMember) => {
      e.stopPropagation();
      setMemberToDelete(member);
      setIsDeleteModalOpen(true);
  };

  const handleDeleteMember = async () => {
      if(!memberToDelete || !db) return;
      try {
          // If custom, delete from collection. If static, hide it.
          if (memberToDelete.isCustom) {
              await setDoc(doc(db, 'hiddenItems', memberToDelete.id), {
                  deletedAt: new Date(),
                  deleter: auth.currentUser?.email
              });
          } else {
              await setDoc(doc(db, 'hiddenItems', memberToDelete.id), {
                  deletedAt: new Date(),
                  deleter: auth.currentUser?.email
              });
          }
          setIsDeleteModalOpen(false);
          setMemberToDelete(null);
          setSelectedMember(null); // Close modal if open
          showToast("Đã xóa thành viên.", "info");
      } catch(e: any) { showToast("Lỗi xóa: " + e.message, "error"); }
  };

  const handleSaveFbLink = async () => {
      if(!selectedMember || !db) return;
      try {
          const linkId = `team-fb-${selectedMember.id}`;
          await setDoc(doc(db, 'linkOverrides', linkId), {
              url: tempFbLink,
              updatedAt: new Date()
          }, { merge: true });
          setIsEditingFb(false);
          showToast("Lưu link thành công!", "success");
      } catch(e: any) { showToast("Lỗi lưu link: " + e.message, "error"); }
  };

  const handleCloseAdvisor = () => {
      setIsAdvisorClosing(true);
      setTimeout(() => {
          setSelectedAdvisor(null);
          setIsAdvisorClosing(false);
      }, 300);
  };

  const handleCloseMember = () => {
      setIsMemberClosing(true);
      setTimeout(() => {
          setSelectedMember(null);
          setIsMemberClosing(false);
      }, 300);
  };

  // Function to get unique color style for each member
  const getMemberStyle = (index: number) => {
      const styles = [
          { border: 'border-red-600', text: 'text-red-700', bg: 'bg-red-50', badge: 'bg-red-100 text-red-800' }, 
          { border: 'border-orange-500', text: 'text-orange-700', bg: 'bg-orange-50', badge: 'bg-orange-100 text-orange-800' },
          { border: 'border-blue-600', text: 'text-blue-700', bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-800' },
          { border: 'border-green-600', text: 'text-green-700', bg: 'bg-green-50', badge: 'bg-green-100 text-green-800' },
          { border: 'border-purple-600', text: 'text-purple-700', bg: 'bg-purple-50', badge: 'bg-purple-100 text-purple-800' },
      ];
      return styles[index % styles.length];
  };

  // Combine and Filter Team
  const visibleTeam = [...staticTeam, ...customMembers].filter(m => !hiddenMemberIds.includes(m.id));

  // Determine logos to display: Fetched or Default
  const displayLogos = techLogos.length > 0 ? techLogos : DEFAULT_TECHNOLOGIES;

  return (
    <div className="animate-fade-in pb-20 bg-gray-50 min-h-screen">
       {/* Banner with Editable Background */}
      <div id="about-hero" className="relative bg-history-dark text-white py-12 px-4 text-center overflow-hidden">
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0">
            <EditableImage 
                imageId="about-header-bg"
                initialSrc=""
                alt="About Banner"
                className="w-full h-full object-cover"
                disableEdit={true}
            />
        </div>
        {/* Dark Overlay Layer */}
        <div className="absolute inset-0 bg-black/60 z-0 pointer-events-none"></div>

        <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-bold font-serif text-history-gold">
            <EditableText id="about-hero-title" defaultText="Về Chúng Tôi" tag="span" />
            </h1>
            <div className="text-gray-300 mt-2 max-w-2xl mx-auto">
            <EditableText id="about-hero-desc" defaultText="Câu chuyện về đội ngũ xây dựng dự án Lịch Sử All-In-One." tag="p" />
            </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-12">
        {/* Intro & Video */}
        <div id="about-mission" className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <BookOpen className="text-history-red" size={28} />
                        <h2 className="text-2xl font-bold font-serif text-history-dark">Tầm Nhìn & Sứ Mệnh</h2>
                    </div>
                    <EditableText 
                        id="about-mission-p1"
                        tag="p"
                        multiline
                        defaultText={`"Lịch Sử All-In-One" là dự án ý tưởng khởi nghiệp (Startup Idea) đang trong quá trình chạy thử nghiệm (Pilot Run), được sáng lập bởi nhóm Tường Thành Vững Chắc (THPT Nguyễn Công Trứ).`}
                        className="text-gray-700 leading-relaxed text-lg mb-4"
                    />
                    <EditableText 
                        id="about-mission-p2"
                        tag="p"
                        multiline
                        defaultText={`Chúng tôi khao khát ứng dụng sức mạnh của Công nghệ và AI để giải quyết các thách thức trong việc học tập. Hiện tại, sản phẩm đang được vận hành thử nghiệm trên các hạ tầng công nghệ miễn phí để kiểm chứng tính khả thi và hiệu quả giáo dục.`}
                        className="text-gray-700 leading-relaxed text-lg mb-4"
                    />
                    <EditableText 
                        id="about-mission-p3"
                        tag="p"
                        multiline
                        defaultText={`Với tinh thần "Dám nghĩ - Dám làm", chúng tôi cam kết mang đến những ý tưởng đột phá và nỗ lực hoàn thiện sản phẩm từng ngày.`}
                        className="text-gray-700 leading-relaxed text-sm italic"
                    />
                </div>
                {/* Video Placeholder (Fixed & Editable) */}
                <div className="flex flex-col gap-2">
                    <div className="relative w-full rounded-2xl overflow-hidden shadow-lg bg-gray-900 group border-4 border-history-paper">
                        {/* Wrapper EditableVideo inside */}
                        <EditableVideo 
                            id="about-intro-video"
                            defaultUrl="https://youtu.be/bk8S63tM1dA?si=7SsApp7D8li3K07a"
                            className="w-full"
                            title="Video Giới Thiệu"
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* Advisors Section */}
        <div id="about-advisors">
            <div className="flex justify-between items-center mb-6 border-l-4 border-history-gold pl-4">
                <h2 className="text-2xl font-bold font-serif text-history-dark">
                    <EditableText id="about-advisor-title" defaultText="Ban Cố Vấn Dự Án" />
                </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {advisors.map((adv, idx) => (
                    <div 
                        key={adv.id} 
                        onClick={() => setSelectedAdvisor(adv)}
                        className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-blue-600 hover:shadow-md transition-shadow text-center group relative cursor-pointer"
                    >
                        <div className="w-[80%] aspect-[3/4] mx-auto mb-4 rounded-xl overflow-hidden border border-gray-200 bg-gray-100 relative shadow-inner">
                            {/* Uses ID instead of Index for persistence */}
                            <EditableImage 
                                imageId={`advisor-img-${adv.id}`}
                                initialSrc={adv.img}
                                alt="Cố vấn"
                                className="w-full h-full"
                                disableEdit={true}
                                enableLightbox={false} // Disable Grid Lightbox
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                <span className="text-white text-xs font-bold bg-black/50 px-3 py-1 rounded-full">Xem chi tiết</span>
                            </div>
                        </div>
                        <h3 className="font-bold text-lg text-gray-800">
                            <EditableText id={`advisor-name-${adv.id}`} defaultText={adv.defaultName} />
                        </h3>
                        <div className="text-gray-500 text-sm font-medium">
                            <EditableText id={`advisor-role-${adv.id}`} defaultText={adv.defaultRole} />
                        </div>
                        <div className="mt-2 text-xs text-blue-600 font-bold uppercase tracking-wide bg-blue-50 py-1 px-2 rounded-full inline-block">
                            <EditableText id={`advisor-sub-${adv.id}`} defaultText="Cố vấn chuyên môn" />
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Advisor Detail Modal (Simple) */}
        {selectedAdvisor && typeof document !== 'undefined' && createPortal(
            <div 
                className={`fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-all duration-300 ease-in-out ${isAdvisorClosing ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0 animate-fade-in'}`} 
                onClick={handleCloseAdvisor}
            >
                <div 
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-pop-in relative flex flex-col md:flex-row max-h-[90vh] md:h-auto my-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button 
                        onClick={handleCloseAdvisor}
                        className="absolute top-4 right-4 z-20 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors text-gray-700"
                    >
                        <X size={24} />
                    </button>

                    {/* Left: Image Side */}
                    <div className="w-full md:w-2/5 bg-gray-100 relative">
                        <div className="h-64 md:h-full w-full">
                            <EditableImage 
                                imageId={`advisor-img-${selectedAdvisor.id}`}
                                initialSrc={selectedAdvisor.img}
                                alt="Advisor Detail"
                                className="w-full h-full object-cover"
                                disableEdit={false} // Enable edit inside modal
                            />
                        </div>
                    </div>

                    {/* Right: Info Side */}
                    <div className="w-full md:w-3/5 p-6 md:p-10 flex flex-col justify-center">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold font-serif text-history-dark mb-2">
                                <EditableText id={`advisor-name-${selectedAdvisor.id}`} defaultText={selectedAdvisor.defaultName} />
                            </h2>
                            <div className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                                Cố vấn dự án
                            </div>
                        </div>

                        <div className="space-y-2 mb-6">
                            <p className="text-gray-500 font-medium">
                                <EditableText id={`advisor-role-${selectedAdvisor.id}`} defaultText={selectedAdvisor.defaultRole} />
                            </p>
                        </div>

                        <div className="bg-history-paper p-6 rounded-2xl border border-history-gold/30 relative">
                            <Quote size={32} className="absolute -top-3 -left-1 text-history-gold/20 fill-current" />
                            <div className="text-gray-700 italic text-sm leading-relaxed text-justify relative z-10 font-serif">
                                <EditableText 
                                    id={`advisor-quote-${selectedAdvisor.id}`} 
                                    multiline 
                                    defaultText="Lời khuyên hoặc châm ngôn sống của cố vấn..." 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>,
            document.body
        )}

        {/* Team Members Section */}
        <div id="about-team">
            <h2 className="text-2xl font-bold font-serif text-history-dark mb-6 border-l-4 border-history-red pl-4">
                <EditableText id="about-team-title" defaultText="Đội Ngũ Xây Dựng" />
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {visibleTeam.map((mem, idx) => {
                    const isCoFounder = idx < 2;
                    const style = getMemberStyle(idx);

                    return (
                        <div 
                            key={mem.id} 
                            onClick={() => setSelectedMember(mem)}
                            className={`bg-white p-6 rounded-xl shadow-sm border-t-4 ${style.border} hover:shadow-lg transition-all text-center group cursor-pointer h-full flex flex-col relative`}
                        >
                            {/* Delete Button (Admin Only) */}
                            {isAdmin && (
                                <button 
                                    onClick={(e) => confirmDelete(e, mem)}
                                    className="absolute top-2 right-2 p-1.5 bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 rounded-full transition-colors z-20"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}

                            <div className={`w-[80%] aspect-[3/4] mx-auto mb-4 rounded-xl overflow-hidden border border-gray-200 ${style.bg} relative shadow-inner group-hover:scale-105 transition-transform duration-300`}>
                                {/* Uses ID instead of Index */}
                                <EditableImage 
                                    imageId={`team-img-${mem.id}`}
                                    initialSrc={mem.img}
                                    alt="Thành viên"
                                    className="w-full h-full"
                                    disableEdit={true} 
                                    enableLightbox={false} // Disable Grid Lightbox
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                    <span className="text-white text-xs font-bold bg-black/50 px-3 py-1 rounded-full">Xem chi tiết</span>
                                </div>
                            </div>
                            <h3 className={`font-bold text-lg ${style.text} whitespace-normal leading-tight mb-1`}>
                                <EditableText id={`team-name-${mem.id}`} defaultText={mem.defaultName} />
                            </h3>
                            <div className="text-gray-500 text-xs font-medium mb-3">
                                <EditableText id={`team-role-title-${mem.id}`} defaultText={isCoFounder ? "Sáng lập viên" : "Thành viên nòng cốt"} />
                            </div>
                            <div className="mt-auto">
                                <div className={`inline-block text-xs font-bold uppercase tracking-wide ${style.badge} py-1 px-2 rounded-full`}>
                                    <EditableText id={`team-role-${mem.id}`} defaultText={mem.defaultRole} />
                                </div>
                            </div>
                        </div>
                    )
                })}

                {/* Add Member Button (Admin Only) */}
                {isAdmin && (
                    <button 
                        onClick={handleAddMember}
                        className="bg-gray-50 border-2 border-dashed border-gray-300 p-6 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-all min-h-[300px]"
                    >
                        <Plus size={40} />
                        <span className="font-bold mt-2">Thêm thành viên</span>
                    </button>
                )}
            </div>
        </div>

        {/* Team Member Detail Modal */}
        {selectedMember && typeof document !== 'undefined' && createPortal(
            <div 
                className={`fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-all duration-300 ease-in-out ${isMemberClosing ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0 animate-fade-in'}`}
                onClick={handleCloseMember}
            >
                <div 
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-pop-in relative flex flex-col md:flex-row max-h-[90vh] md:h-auto my-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button 
                        onClick={handleCloseMember}
                        className="absolute top-4 right-4 z-20 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors text-gray-700"
                    >
                        <X size={24} />
                    </button>

                    {/* Left: Image Side (Editable Here) */}
                    <div className="w-full md:w-2/5 bg-gray-100 relative">
                        <div className="h-64 md:h-full w-full">
                            <EditableImage 
                                imageId={`team-img-${selectedMember.id}`}
                                initialSrc={selectedMember.img}
                                alt="Member Detail"
                                className="w-full h-full object-cover"
                                disableEdit={false} // Enable edit here in modal
                            />
                        </div>
                        {/* Mobile Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:hidden pointer-events-none"></div>
                    </div>

                    {/* Right: Info Side */}
                    <div className="w-full md:w-3/5 p-6 md:p-10 overflow-y-auto custom-scrollbar">
                        <div className="mb-6">
                            <h2 className="text-3xl font-bold font-serif text-history-dark mb-2">
                                <EditableText id={`team-name-${selectedMember.id}`} defaultText={selectedMember.defaultName} />
                            </h2>
                            <div className="flex flex-wrap gap-2 items-center">
                                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                                    <EditableText id={`team-role-${selectedMember.id}`} defaultText={selectedMember.defaultRole} />
                                </span>
                                <span className="flex items-center gap-1 text-gray-500 text-sm font-medium bg-gray-100 px-3 py-1 rounded-full">
                                    <GraduationCap size={14} /> 
                                    <EditableText id={`team-class-${selectedMember.id}`} defaultText={selectedMember.defaultClass || "Lớp..."} />
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="flex items-center gap-3 text-gray-700">
                                <Briefcase size={20} className="text-blue-600 shrink-0" />
                                <div>
                                    <span className="text-xs text-gray-400 block font-bold uppercase">Vị trí / Chức danh</span>
                                    <span className="font-medium"><EditableText id={`team-position-${selectedMember.id}`} defaultText="Quản lý dự án" /></span>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3 text-gray-700">
                                <Phone size={20} className="text-green-600 shrink-0" />
                                <div>
                                    <span className="text-xs text-gray-400 block font-bold uppercase">Số điện thoại</span>
                                    <span className="font-medium"><EditableText id={`team-phone-${selectedMember.id}`} defaultText={selectedMember.defaultPhone || "09xx xxx xxx"} /></span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 text-gray-700">
                                <Mail size={20} className="text-red-600 shrink-0" />
                                <div>
                                    <span className="text-xs text-gray-400 block font-bold uppercase">Email</span>
                                    <span className="font-medium break-all"><EditableText id={`team-email-${selectedMember.id}`} defaultText={selectedMember.defaultEmail || "email@example.com"} /></span>
                                </div>
                            </div>

                            {/* Facebook / Social Link Section */}
                            <div className="flex items-center gap-3 text-gray-700">
                                <Facebook size={20} className="text-blue-700 shrink-0" />
                                <div className="flex-1">
                                    <span className="text-xs text-gray-400 block font-bold uppercase">Mạng xã hội</span>
                                    {isEditingFb ? (
                                        <div className="flex gap-2 mt-1">
                                            <input 
                                                type="text" 
                                                value={tempFbLink} 
                                                onChange={(e) => setTempFbLink(e.target.value)}
                                                className="border rounded px-2 py-1 text-xs w-full outline-none focus:border-blue-500 bg-gray-50"
                                                placeholder="https://facebook.com/..."
                                            />
                                            <button onClick={handleSaveFbLink} className="p-1 bg-green-500 text-white rounded hover:bg-green-600"><Save size={14}/></button>
                                            <button onClick={() => setIsEditingFb(false)} className="p-1 bg-red-500 text-white rounded hover:bg-red-600"><X size={14}/></button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            {fbLink ? (
                                                <a href={fbLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium text-sm truncate max-w-[200px]">
                                                    {fbLink}
                                                </a>
                                            ) : (
                                                <span className="text-gray-400 italic text-sm">Chưa cập nhật</span>
                                            )}
                                            {isAdmin && (
                                                <button onClick={() => { setTempFbLink(fbLink); setIsEditingFb(true); }} className="text-gray-400 hover:text-blue-600">
                                                    <LinkIcon size={14} />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bg-history-paper p-6 rounded-2xl border border-history-gold/30 relative">
                            <Quote size={40} className="absolute -top-4 -left-2 text-history-gold/20 fill-current" />
                            <div className="text-gray-700 italic text-sm leading-relaxed text-justify relative z-10 font-serif">
                                <EditableText 
                                    id={`team-quote-${selectedMember.id}`} 
                                    multiline 
                                    defaultText={selectedMember.defaultQuote || "Hãy nhập câu châm ngôn hoặc lời giới thiệu bản thân tại đây."} 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>,
            document.body
        )}

        {/* Confirmation Modal */}
        <ConfirmationModal 
            isOpen={isDeleteModalOpen} 
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleDeleteMember}
            title="Xóa thành viên?"
            message={`Bạn có chắc muốn xóa "${memberToDelete?.defaultName}" khỏi danh sách không?`}
        />

        {/* Technology Stack Section - Marquee Loop */}
        <div id="about-tech" className="mb-4 overflow-hidden">
            <h2 className="text-2xl font-bold font-serif text-history-dark mb-6 border-l-4 border-gray-500 pl-4 flex items-center gap-2">
                <Cpu size={24} />
                <EditableText id="about-tech-title" defaultText="Nền Tảng Công Nghệ" />
            </h2>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                 
                 <div className="relative flex overflow-x-hidden group">
                    <div className="animate-marquee whitespace-nowrap flex gap-2 py-3">
                        {displayLogos.map((tech, index) => (
                            <div key={index} className="flex flex-col items-center gap-2 min-w-[200px]" title={tech.name}>
                                <img 
                                    src={tech.url} 
                                    alt={tech.name} 
                                    className="h-auto md:h-20 w-100 object-contain transform hover:scale-110 transition-transform duration-300"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.parentElement!.innerText = tech.name;
                                    }}
                                />
                            </div>
                        ))}
                        {/* Duplicate for loop */}
                        {displayLogos.map((tech, index) => (
                            <div key={`dup-${index}`} className="flex flex-col items-center gap-2 min-w-[200px]" title={tech.name}>
                                <img 
                                    src={tech.url} 
                                    alt={tech.name} 
                                    className="h-auto md:h-20 w-100 object-contain transform hover:scale-110 transition-transform duration-300"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.parentElement!.innerText = tech.name;
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                 </div>
            </div>
        </div>

        {/* Liên hệ Section */}
        <div id="about-contact" className="mt-16">
            <h2 className="text-2xl font-bold font-serif text-history-dark mb-6 border-l-4 border-history-red pl-4 flex items-center gap-2">
                <Phone size={24} />
                <EditableText id="contact-title" defaultText="Liên Hệ Với Chúng Tôi" />
            </h2>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: School + Team */}
                    <div className="flex flex-col h-full">
                        {/* School Info */}
                        <div className="space-y-6 mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 shrink-0 border border-gray-100 rounded-full overflow-hidden p-1 bg-white shadow-sm">
                                    <EditableImage 
                                        imageId="school-logo"
                                        initialSrc=""
                                        alt="Logo THPT Nguyễn Công Trứ" 
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-history-red uppercase font-serif">
                                        <EditableText id="school-name" defaultText="Trường THPT Nguyễn Công Trứ" />
                                    </h3>
                                    <p className="text-gray-600 font-medium">TP. Hồ Chí Minh</p>
                                </div>
                            </div>

                            {/* School Image 5:3 ratio */}
                            <div className="w-full aspect-[5/3] rounded-xl overflow-hidden shadow-md border border-gray-100 relative">
                                <EditableImage 
                                    imageId="school-contact-img"
                                    initialSrc="" 
                                    alt="Trường THPT Nguyễn Công Trứ"
                                    className="w-full h-full"
                                />
                            </div>

                            <div className="space-y-3 text-gray-700">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                                        <Phone size={16} />
                                    </div>
                                    <span className="font-medium"><EditableText id="contact-phone" defaultText="028 3894 3632" /></span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center text-red-600 shrink-0">
                                        <Mail size={16} />
                                    </div>
                                    <span className="font-medium"><EditableText id="contact-email" defaultText="c3nguyencongtru.tphcm@moet.edu.vn" /></span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center text-green-600 shrink-0">
                                        <MapPin size={16} />
                                    </div>
                                    <span className="font-medium"><EditableText id="contact-addr" defaultText="97 Quang Trung, Phường 8, Gò Vấp, TP.HCM" /></span>
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t-2 border-dashed border-gray-100 my-2"></div>

                        {/* Team Info (New) */}
                        <div className="pt-6 space-y-6">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Thông tin nhóm phát triển</h3>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 shrink-0 bg-history-dark rounded-xl flex items-center justify-center text-history-gold shadow-md border-2 border-history-gold/20 overflow-hidden relative">
                                    {/* Editable Avatar */}
                                    <EditableImage 
                                        imageId="team-main-avatar"
                                        initialSrc=""
                                        alt="Team Avatar"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-history-dark font-serif">
                                        <EditableText id="team-name-contact" defaultText="Team Tường Thành Vững Chắc" />
                                    </h3>
                                    <p className="text-history-red font-medium text-sm italic">
                                        <EditableText id="team-slogan-contact" defaultText='"Lịch sử là tường thành vững chắc cho tương lai"' />
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-3 text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-red-600 shrink-0 shadow-sm border border-gray-100">
                                        <Mail size={14} />
                                    </div>
                                    <span className="font-medium text-sm"><EditableText id="team-email-contact" defaultText="tnt.fortress.ai.team@gmail.com" /></span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-blue-600 shrink-0 shadow-sm border border-gray-100">
                                        <Facebook size={14} />
                                    </div>
                                    <span className="font-medium text-sm"><EditableText id="team-fb-contact" defaultText="facebook.com/lichsuallinone" /></span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Map */}
                    <div className="w-full h-full min-h-[500px] rounded-2xl overflow-hidden shadow-md border border-gray-200">
                        <iframe 
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.6387989467125!2d106.65037837600634!3d10.838929358035779!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317529a1dbb2005d%3A0xea22ecda4afe3187!2zVHLGsOG7nW5nIFRIUFQgTmd1eeG7hW4gQ8O0bmcgVHLhu6k!5e0!3m2!1svi!2s!4v1765793668663!5m2!1svi!2s" 
                            width="100%" 
                            height="100%" 
                            style={{border:0}} 
                            allowFullScreen={true} 
                            loading="lazy" 
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Bản đồ trường THPT Nguyễn Công Trứ"
                        ></iframe>
                    </div>
                </div>
            </div>
        </div>

        {/* Acknowledgement / Thank You Letter (MOVED TO BOTTOM) */}
        <div id="about-letter" className="py-8">
            <div className="relative w-full max-w-3xl mx-auto">
                {/* Envelope Body */}
                <div className={`
                    relative z-10 bg-gradient-to-b from-[#e6d8c3] to-[#d9c6a5] rounded-2xl shadow-2xl overflow-hidden 
                    transition-all duration-700 ease-in-out border border-[#d9c6a5]
                    ${isLetterOpen ? 'h-[450px] md:h-[600px]' : 'h-[300px] hover:shadow-[0_18px_30px_rgba(60,40,20,0.15)]'}
                `}>
                    {/* Fold Effect (Top Flap) */}
                    <div className={`
                        absolute top-0 left-0 right-0 h-[55%] bg-gradient-to-b from-white/30 to-transparent z-20 pointer-events-none origin-top transition-all duration-500
                        ${isLetterOpen ? 'opacity-0 scale-y-0' : 'opacity-100 scale-y-100'}
                    `}></div>

                    {/* Middle Crease */}
                     <div className={`
                        absolute top-[48%] left-0 right-0 h-1 bg-gradient-to-r from-transparent via-black/10 to-transparent z-10
                        ${isLetterOpen ? 'opacity-0' : 'opacity-100'}
                    `}></div>

                    {/* Letter Content */}
                    <div className={`
                        absolute left-4 right-4 md:left-[10%] md:right-[10%] top-[10%] bottom-[10%]
                        bg-[#fffdf8] rounded-xl shadow-lg p-6 md:p-10
                        transition-all duration-700 cubic-bezier(0.2, 0.9, 0.3, 1) overflow-y-auto custom-scrollbar
                        flex flex-col
                        ${isLetterOpen 
                            ? 'translate-y-0 opacity-100 visible scale-100' 
                            : 'translate-y-12 opacity-0 invisible scale-95'}
                    `}>
                        <h2 className="text-xl md:text-2xl font-serif font-bold text-[#a06c3c] text-center mb-6 uppercase tracking-wider">
                            <EditableText id="letter-title" defaultText="Thư Cảm Ơn" />
                        </h2>

                        <div className="font-serif text-[#3f2e1c] text-sm md:text-base space-y-4 leading-relaxed text-justify flex-grow">
                            <EditableText 
                                id="letter-body"
                                tag="div"
                                multiline
                                defaultText={`
                                Kính gửi: Ban Giám hiệu, quý Thầy Cô, các anh chị cựu học sinh và tất cả những người đã đồng hành cùng chúng em,

                                Chúng em xin gửi lời tri ân chân thành đến Ban Giám hiệu đã luôn quan tâm, tạo điều kiện để chúng em có cơ hội tham gia và trải nghiệm. Sự tin tưởng của Nhà trường là nguồn động viên to lớn cho chúng em nỗ lực.

                                Xin cảm ơn quý Thầy Cô đã tận tình chỉ dẫn, khơi dậy trong chúng em niềm tin, tinh thần trách nhiệm và sự sáng tạo. Chính sự đồng hành ấy đã giúp chúng em trưởng thành hơn qua từng bước đi.

                                Chúng em cũng biết ơn các anh chị cựu học sinh đã chia sẻ kinh nghiệm, hỗ trợ kỹ thuật và dành cho chúng em những góp ý quý báu. Sự giúp đỡ ấy không chỉ nâng cao chất lượng dự án, mà còn truyền thêm cảm hứng học hỏi.

                                Đặc biệt, xin cảm ơn tất cả những ai đã trải nghiệm và phản hồi về sản phẩm. Mỗi ý kiến là một viên gạch để chúng em hoàn thiện hơn nữa.

                                Cuối cùng, lời cảm ơn xin dành cho chính các thành viên trong nhóm – những người đã cùng nhau đồng hành, sẻ chia và kiên trì để đi đến ngày hôm nay. Thành quả này là dấu ấn của sự đoàn kết và đam mê.
                                `}
                            />
                        </div>

                        <div className="mt-8 text-right font-bold text-[#a06c3c] font-serif">
                            <p>Thân ái,</p>
                            <p>Tập thể nhóm chúng em</p>
                        </div>
                    </div>

                    {/* Controls (Seal Button) */}
                    <div className={`
                        absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 transition-all duration-500
                        ${isLetterOpen ? 'top-[90%] md:left-[-30px] md:top-1/2' : ''}
                    `}>
                        <button 
                            onClick={() => setIsLetterOpen(!isLetterOpen)}
                            className="w-16 h-16 md:w-20 md:h-20 bg-[#a06c3c] text-white rounded-full flex items-center justify-center text-2xl shadow-xl hover:bg-[#8a582f] hover:scale-110 transition-all duration-300 ring-4 ring-[#e6d8c3]/50"
                            title={isLetterOpen ? "Đóng thư" : "Mở thư"}
                        >
                            {isLetterOpen ? '❤️' : '💌'}
                        </button>
                    </div>
                </div>
                
                {/* Decorative shadow for envelope */}
                <div className="absolute -bottom-4 left-4 right-4 h-4 bg-black/10 blur-lg rounded-[50%]"></div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
