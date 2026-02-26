
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import * as firebaseAuth from 'firebase/auth';
import { auth, googleProvider, db, collection, addDoc, serverTimestamp, doc, onSnapshot, getDoc, setDoc } from './firebaseConfig';
import { Loader2 } from 'lucide-react';
import { ADMIN_UIDS } from './services/storageService';

// Context Provider
import { GlobalDataProvider } from './contexts/GlobalDataContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { LightboxProvider } from './contexts/LightboxContext'; 

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AIChatModal from './components/AIChatModal';
import LoginModal from './components/LoginModal';
import HomePage from './components/HomePage';
import LightboxViewer from './components/LightboxViewer';
import AccessDenied from './components/AccessDenied';
import ComingSoon from './components/ComingSoon'; 

// Lazy Load Pages
const TimelinePage = lazy(() => import('./components/TimelinePage'));
const DocumentsPage = lazy(() => import('./components/DocumentsPage'));
const QuizPage = lazy(() => import('./components/QuizPage'));
const GamesPage = lazy(() => import('./components/GamesPage'));
const ChatPage = lazy(() => import('./components/ChatPage'));
const AboutPage = lazy(() => import('./components/AboutPage'));
const TermsPage = lazy(() => import('./components/TermsPage'));
const ProfilePage = lazy(() => import('./components/ProfilePage'));
const NotFoundPage = lazy(() => import('./components/NotFoundPage'));
const HeritagePage = lazy(() => import('./components/HeritagePage'));
const MagazinePage = lazy(() => import('./components/MagazinePage'));

import { UserProfile, HistoricalEvent, QuizState, ChatMessage } from './types';

const { signInWithPopup, signOut, onAuthStateChanged } = firebaseAuth as any;

const PageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-history-gold animate-fade-in">
    <Loader2 size={48} className="animate-spin mb-4" />
    <p className="text-gray-500 font-medium animate-pulse">Đang tải dữ liệu...</p>
  </div>
);

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const MainApp = () => {
  const { showToast } = useToast();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'advisor' | null>(null);
  const [isRoleLoading, setIsRoleLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<HistoricalEvent | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [exploreResetToken, setExploreResetToken] = useState(0);
  
  const location = useLocation();

  // Quiz state
  const [quizState, setQuizState] = useState<QuizState>({
    screen: 'config',
    topic: '',
    count: 10,
    mode: 'mix',
    questions: [],
    currentIdx: 0,
    userAnswers: [],
    score: 0,
    timer: 0,
    isActive: false,
    isExamMode: false,
    examStatus: 'idle',
    markedQuestions: []
  });

  const [quizChatHistory, setQuizChatHistory] = useState<ChatMessage[]>([
    { role: 'model', text: 'Chào bạn! Mình có thể giúp gì cho việc ôn tập lịch sử của bạn?' }
  ]);
  
  const [eventChatHistories, setEventChatHistories] = useState<Record<string, {role: 'user' | 'model', content: string}[]>>({});

  // --- EFFECT: SYNC FAVICON & SITE SETTINGS ---
  useEffect(() => {
      if (!db) return;
      const unsub = onSnapshot(doc(db, 'siteSettings', 'global'), (docSnap: any) => {
          if (docSnap.exists()) {
              const data = docSnap.data();
              
              // Update Favicon
              if (data.faviconUrl) {
                  const link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement('link');
                  link.type = 'image/x-icon';
                  link.rel = 'shortcut icon';
                  link.href = data.faviconUrl;
                  document.getElementsByTagName('head')[0].appendChild(link);
              }
          }
      });
      return () => unsub();
  }, []);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: any) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
        });

        // Fetch user role
        setIsRoleLoading(true);
        try {
            if (ADMIN_UIDS.includes(firebaseUser.uid)) {
                setUserRole('admin');
            } else {
                const adminSnap = await getDoc(doc(db, 'admins', firebaseUser.uid));
                if (adminSnap.exists()) {
                    setUserRole(adminSnap.data().role);
                } else {
                    setUserRole(null);
                }
            }
        } catch (e) {
            console.error("Role check failed:", e);
            setUserRole(null);
        } finally {
            setIsRoleLoading(false);
        }
      } else {
        setUser(null);
        setUserRole(null);
        setIsRoleLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const hasStaffAccess = userRole === 'admin' || userRole === 'advisor';

  return (
    <div className="min-h-screen bg-history-paper flex flex-col font-sans">
      <ScrollToTop />
      <Navbar 
        user={user} 
        userRole={userRole}
        onLogin={() => setShowLoginModal(true)} 
        onLogout={async () => { await signOut(auth); showToast("Đã đăng xuất.", 'info'); }}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        currentPath={location.pathname}
        onResetView={() => { if (location.pathname === '/explore') setExploreResetToken(p => p + 1); }}
        isTransparentMode={location.pathname === '/heritage' || location.pathname === '/magazine'}
      />

      <main className="flex-grow">
        <div key={location.pathname} className="animate-blur-in">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/explore" element={<TimelinePage searchTerm={searchTerm} onAskAI={setSelectedEvent} resetKey={exploreResetToken} />} />
              <Route path="/documents" element={<DocumentsPage user={user} />} />
              
              {/* Conditional Routes: Show Content if Staff, else Show Coming Soon */}
              <Route 
                path="/heritage" 
                element={
                  isRoleLoading ? <PageLoader /> : 
                  hasStaffAccess ? <HeritagePage /> : 
                  <ComingSoon 
                    title="Âm Vang Di Sản" 
                    description="Không gian triển lãm số về hiện vật, trang phục và kiến trúc Việt Nam đang được đội ngũ biên tập viên xây dựng. Chúng tôi sẽ sớm mở cửa đón khách tham quan!" 
                  />
                } 
              />
              <Route 
                path="/magazine" 
                element={
                  isRoleLoading ? <PageLoader /> : 
                  hasStaffAccess ? <MagazinePage /> : 
                  <ComingSoon 
                    title="Tạp Chí Tinh Hoa" 
                    description="Ấn phẩm số đặc biệt với những bài viết chuyên sâu về văn hóa và lịch sử đang trong giai đoạn dàn trang cuối cùng."
                  />
                } 
              />
              
              <Route path="/quiz" element={<QuizPage quizState={quizState} setQuizState={setQuizState} chatHistory={quizChatHistory} setChatHistory={setQuizChatHistory} user={user} />} />
              <Route path="/games" element={<GamesPage user={user} />} />
              <Route path="/qa" element={<ChatPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/profile" element={<ProfilePage user={user} />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </div>
      </main>

      <Footer />
      <LightboxViewer />
      {selectedEvent && (
        <AIChatModal 
          event={selectedEvent} 
          onClose={() => setSelectedEvent(null)} 
          existingMessages={eventChatHistories[selectedEvent.id]}
          onUpdateMessages={(msgs: {role: 'user' | 'model', content: string}[]) => setEventChatHistories(prev => ({ ...prev, [selectedEvent.id]: msgs }))}
        />
      )}
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} onConfirmLogin={async () => { await signInWithPopup(auth, googleProvider); setShowLoginModal(false); showToast("Đăng nhập thành công!", 'success'); }} />}
    </div>
  );
};

function App() {
  return (
    <GlobalDataProvider>
      <ToastProvider>
        <LightboxProvider>
          <MainApp />
        </LightboxProvider>
      </ToastProvider>
    </GlobalDataProvider>
  );
}

export default App;
