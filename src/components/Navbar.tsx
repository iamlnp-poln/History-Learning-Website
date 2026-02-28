import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Search, User, LogOut, BookOpen, UserCircle, MessageSquareText, ChevronDown, LayoutGrid, Home, Compass, Book, Gamepad2, Shield, Info, GraduationCap, Sparkles, Newspaper } from 'lucide-react';
import { UserProfile } from '../types';
import { db, doc, onSnapshot } from '../firebaseConfig';

interface NavbarProps {
  user: UserProfile | null;
  userRole?: 'admin' | 'advisor' | null;
  onLogin: () => void;
  onLogout: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  currentPath: string;
  onResetView?: () => void;
  isTransparentMode?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ user, userRole, onLogin, onLogout, searchTerm, onSearchChange, currentPath, onResetView, isTransparentMode = false }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<'menu' | 'user' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [logoUrl, setLogoUrl] = useState('');
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  const hasStaffAccess = userRole === 'admin' || userRole === 'advisor';

  useEffect(() => {
      const handleScroll = () => setIsScrolled(window.scrollY > 20);
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
      if(!db) return;
      const unsub = onSnapshot(doc(db, 'siteSettings', 'global'), (docSnap: any) => {
          if (docSnap.exists() && docSnap.data().navbarLogoUrl) setLogoUrl(docSnap.data().navbarLogoUrl);
          else setLogoUrl('');
      });
      return () => unsub();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setActiveDropdown(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (path: string) => {
    if (path === currentPath && onResetView) onResetView();
    setIsMenuOpen(false);
    setActiveDropdown(null);
    navigate(path);
  };

  const navContainerClass = isTransparentMode
    ? `fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${isTransparentMode && !isScrolled ? 'bg-black/20 backdrop-blur-md shadow-sm border-b border-white/10' : 'bg-history-red shadow-lg border-none'}`
    : `fixed top-0 left-0 right-0 z-[100] transition-all duration-300 bg-history-red shadow-lg`;

  return (
    <>
      {!isTransparentMode && <div className="h-16 w-full shrink-0"></div>}
      <nav className={`${navContainerClass} text-white`} ref={dropdownRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button onClick={() => setIsMenuOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-white/20 mr-2"><Menu size={24} /></button>
              <Link to="/" onClick={() => handleNavClick('/')} className="flex items-center gap-2">
                {logoUrl ? <img src={logoUrl} alt="Logo" className="h-8 w-auto" /> : <BookOpen className="text-history-gold" />}
                <span className="font-serif font-bold text-lg md:text-xl tracking-wide truncate">
                    <span className="md:hidden">Trạm Lịch Sử 4.0</span>
                    <span className="hidden md:inline">Trạm Lịch Sử 4.0</span>
                </span>
              </Link>
            </div>

            <div className="hidden lg:flex flex-1 justify-center px-8">
              {currentPath === '/explore' ? (
                <div className="relative w-full max-w-xl text-gray-600">
                  <input 
                    type="search" 
                    placeholder="Tìm kiếm..." 
                    value={searchTerm} 
                    onChange={(e) => onSearchChange(e.target.value)} 
                    className="bg-white/95 h-10 px-5 pr-12 rounded-full text-sm w-full shadow-inner focus:ring-2 focus:ring-history-gold outline-none transition-all" 
                  />
                  <div className="absolute right-0 top-0 h-full flex items-center pr-4">
                    <Search size={18} className="text-gray-400" />
                  </div>
                </div>
              ) : <div className="flex-1"></div>}
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden lg:block relative z-50">
                 <button onClick={() => setActiveDropdown(activeDropdown === 'menu' ? null : 'menu')} className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors font-medium ${activeDropdown === 'menu' ? 'bg-white/20' : 'hover:bg-white/10'}`}>
                    <LayoutGrid size={20} className="text-history-gold"/><span>Danh Mục</span><ChevronDown size={16}/>
                 </button>
                 <div className={`absolute top-full right-0 pt-4 transition-all w-72 ${activeDropdown === 'menu' ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 text-gray-700 overflow-hidden">
                        <button onClick={() => handleNavClick('/')} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-50 hover:text-history-red"><Home size={18} /> Trang Chủ</button>
                        <button onClick={() => handleNavClick('/explore')} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-50 hover:text-history-red"><Compass size={18} /> Khám Phá Lịch Sử</button>
                        
                        <button onClick={() => handleNavClick('/heritage')} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-50 hover:text-history-red text-blue-700 font-bold group">
                            <Sparkles size={18} /> Âm Vang Di Sản
                        </button>
                        {hasStaffAccess && (
                            <button onClick={() => handleNavClick('/magazine')} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-50 hover:text-history-red text-blue-700 font-bold group">
                                <Newspaper size={18} /> Tạp Chí Tinh Hoa
                            </button>
                        )}

                        <button onClick={() => handleNavClick('/documents')} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-50 hover:text-history-red"><Book size={18} /> Kho Tài Liệu</button>
                        <div className="border-t border-gray-100 my-1"></div>
                        <button onClick={() => handleNavClick('/quiz')} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-50 hover:text-history-red"><GraduationCap size={18} /> Trắc Nghiệm</button>
                        <button onClick={() => handleNavClick('/games')} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-50 hover:text-history-red"><Gamepad2 size={18} /> Trò Chơi</button>
                        <button onClick={() => handleNavClick('/qa')} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-50 hover:text-history-red font-bold text-history-gold"><MessageSquareText size={18} /> Hỏi đáp AI</button>
                        <div className="border-t border-gray-100 my-1"></div>
                        <button onClick={() => handleNavClick('/terms')} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-50 hover:text-history-red"><Shield size={18} /> Điều khoản sử dụng</button>
                        <button onClick={() => handleNavClick('/about')} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-50 hover:text-history-red"><Info size={18} /> Giới Thiệu</button>
                    </div>
                 </div>
              </div>

              {user ? (
                <div className="relative z-50">
                  <div onClick={() => setActiveDropdown(activeDropdown === 'user' ? null : 'user')} className="flex items-center gap-3 cursor-pointer py-1">
                    <div className="h-9 w-9 rounded-full border-2 border-history-gold overflow-hidden">
                        {user.photoURL ? <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200 flex items-center justify-center"><User size={20} className="text-gray-400" /></div>}
                    </div>
                  </div>
                  <div className={`absolute top-full right-0 pt-4 transition-all w-60 ${activeDropdown === 'user' ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
                        <div className="bg-white text-gray-800 shadow-xl rounded-2xl border border-gray-200 overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                                <p className="font-bold text-sm truncate">{user.displayName}</p>
                                <p className="text-xs text-gray-500 truncate">{userRole || 'Học viên'}</p>
                            </div>
                            <div className="py-2">
                                <button onClick={() => handleNavClick('/profile')} className="w-full text-left flex items-center gap-3 px-5 py-3 hover:bg-gray-100 text-sm font-medium"><UserCircle size={18} /> Tài khoản</button>
                                <button onClick={onLogout} className="w-full text-left flex items-center gap-3 px-5 py-3 hover:bg-red-50 text-sm text-red-600 font-bold"><LogOut size={18} /> Đăng xuất</button>
                            </div>
                        </div>
                    </div>
                </div>
              ) : (
                <button onClick={onLogin} className="bg-history-gold text-history-dark px-3 py-1.5 md:px-5 md:py-2 rounded-full font-bold text-xs md:text-sm shadow-md whitespace-nowrap">Đăng nhập</button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 bg-black/50 z-[110] lg:hidden transition-opacity ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} onClick={() => setIsMenuOpen(false)} />
      <div className={`fixed top-0 left-0 h-full w-[280px] bg-history-red z-[120] transition-transform lg:hidden flex flex-col ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-red-800">
          <span className="font-serif font-bold text-xl text-white">Trạm Lịch Sử 4.0</span>
          <button onClick={() => setIsMenuOpen(false)} className="text-white"><X size={24} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <button onClick={() => handleNavClick('/')} className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 rounded-xl transition-colors"><Home size={20} /> Trang Chủ</button>
          <button onClick={() => handleNavClick('/explore')} className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 rounded-xl transition-colors"><Compass size={20} /> Khám Phá</button>
          
          <button onClick={() => handleNavClick('/heritage')} className="w-full flex items-center gap-3 px-4 py-3 text-history-gold font-bold hover:bg-white/10 rounded-xl transition-colors">
              <Sparkles size={20} /> Âm Vang Di Sản
          </button>
          {hasStaffAccess && (
              <button onClick={() => handleNavClick('/magazine')} className="w-full flex items-center gap-3 px-4 py-3 text-history-gold font-bold hover:bg-white/10 rounded-xl transition-colors">
                  <Newspaper size={20} /> Tạp Chí Tinh Hoa
              </button>
          )}

          <button onClick={() => handleNavClick('/documents')} className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 rounded-xl transition-colors"><Book size={20} /> Tài Liệu</button>
          <button onClick={() => handleNavClick('/quiz')} className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 rounded-xl transition-colors"><GraduationCap size={20} /> Trắc Nghiệm</button>
          <button onClick={() => handleNavClick('/games')} className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 rounded-xl transition-colors"><Gamepad2 size={20} /> Trò Chơi</button>
          <button onClick={() => handleNavClick('/qa')} className="w-full flex items-center gap-3 px-4 py-3 text-history-gold font-bold hover:bg-white/10 rounded-xl transition-colors"><MessageSquareText size={20} /> Hỏi đáp AI</button>
          <button onClick={() => handleNavClick('/terms')} className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 rounded-xl transition-colors"><Shield size={20} /> Điều khoản</button>
          <button onClick={() => handleNavClick('/about')} className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 rounded-xl transition-colors"><Info size={20} /> Giới Thiệu</button>
        </div>
      </div>
    </>
  );
};

export default Navbar;