
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { UserProfile } from '../types';
import { 
    db, auth, collection, query, where, orderBy, getDocs, deleteDoc, 
    doc, setDoc, getDoc, serverTimestamp, updateDoc, Timestamp, updateProfile 
} from '../firebaseConfig';
import { 
    Clock, Trash2, Calendar, Target, User as UserIcon, TrendingUp, CheckCircle, 
    Edit2, X, Shield, Plus, Key, Loader2, Image as ImageIcon, Settings, 
    List, ChevronRight, GraduationCap, Mail, Layout, Globe, Save, Monitor,
    Link as LinkIcon, Grid, Upload, Folder, UserCheck, FileText, Copy, AlertTriangle
} from 'lucide-react';
import { ADMIN_UIDS, uploadFile, getFolderIdByName, getVirtualAssets } from '../services/storageService';
import MediaLibraryModal from './MediaLibraryModal';
import EditableImage from './EditableImage';
import { useToast } from '../contexts/ToastContext';
import { useGlobalData } from '../contexts/GlobalDataContext';

interface ProfilePageProps { user: UserProfile | null; }
interface QuizResult { id: string; topic: string; score: number; total: number; time: number; type?: string; timestamp: any; }

// Danh sách các Banner cần quản lý và ID tương ứng trong EditableImage
const BANNER_CONFIG = [
    { id: 'home-hero-bg', label: 'Banner Trang Chủ' },
    { id: 'exploreBannerUrl', label: 'Banner Khám Phá (Timeline)', mappedId: 'timeline-header-bg' }, 
    { id: 'docs-header-bg', label: 'Banner Tài Liệu' },
    { id: 'games-header-bg', label: 'Banner Giải Trí (Games)' },
    { id: 'quiz-header-bg', label: 'Banner Trắc Nghiệm' },
    { id: 'about-header-bg', label: 'Banner Giới Thiệu' },
    { id: 'profile-header-bg', label: 'Banner Hồ Sơ (Trang này)' },
    { id: 'terms-header-bg', label: 'Banner Điều Khoản' },
];

const ProfilePage: React.FC<ProfilePageProps> = ({ user }) => {
  const { showToast } = useToast();
  const { imageOverrides } = useGlobalData(); 

  const [history, setHistory] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'advisor' | null>(null);
  const [activeTab, setActiveTab] = useState<'history' | 'admin' | 'settings' | 'media' | 'content'>('history');

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const [adminList, setAdminList] = useState<any[]>([]);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdminUid, setNewAdminUid] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'advisor'>('advisor');
  
  // Media Manager Tabs State
  const [showPickerLibrary, setShowPickerLibrary] = useState(false);

  // Content Manager State
  const [contentList, setContentList] = useState<any[]>([]);
  const [contentSearch, setContentSearch] = useState('');
  const [renameData, setRenameData] = useState<{oldId: string, newId: string, currentText: string} | null>(null);
  const [isProcessingContent, setIsProcessingContent] = useState(false);

  // --- SYSTEM SETTINGS STATE ---
  const [siteSettings, setSiteSettings] = useState<any>({
      navbarLogoUrl: '',
      faviconUrl: '',
  });
  
  const [bannerSettings, setBannerSettings] = useState<Record<string, string>>({});
  const [heritageBanners, setHeritageBanners] = useState<string[]>([]); // New: Dynamic Heritage Banners
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
  // Advanced Picker States
  const [showSettingPicker, setShowSettingPicker] = useState(false);
  const [pickerTargetType, setPickerTargetType] = useState<'site' | 'banner'>('site'); 
  const [pickerTargetField, setPickerTargetField] = useState<string | null>(null);
  const [pickerTargetLabel, setPickerTargetLabel] = useState('');
  const [pickerMode, setPickerMode] = useState<'upload' | 'link' | 'library'>('upload');
  const [pickerUrlInput, setPickerUrlInput] = useState('');
  const [isPickerProcessing, setIsPickerProcessing] = useState(false);
  
  // Heritage specific picker state
  const [showHeritagePicker, setShowHeritagePicker] = useState(false);

  useEffect(() => {
    if (user?.displayName) setEditName(user.displayName);
    const checkAdmin = async () => {
        if (!user) { setIsAdmin(false); return; }
        let role: 'admin' | 'advisor' | null = null;
        if (ADMIN_UIDS.includes(user.uid)) role = 'admin';
        else if (db) {
             try {
                const docSnap = await getDoc(doc(db, 'admins', user.uid));
                if (docSnap.exists()) role = docSnap.data()?.role || 'advisor';
             } catch(e) { role = null; }
        }
        setIsAdmin(!!role);
        setUserRole(role);
        if (role) {
            fetchAdmins();
            fetchSettings();
        }
    };
    checkAdmin();
  }, [user]);

  useEffect(() => {
      const initialBanners: Record<string, string> = {};
      BANNER_CONFIG.forEach(cfg => {
          const key = cfg.mappedId || cfg.id;
          if (imageOverrides[key]) {
              initialBanners[key] = imageOverrides[key];
          }
      });
      setBannerSettings(prev => ({ ...initialBanners, ...prev }));
  }, [imageOverrides]);

  const fetchSettings = async () => {
      if(!db) return;
      const docSnap = await getDoc(doc(db, 'siteSettings', 'global'));
      if(docSnap.exists()) {
          const data = docSnap.data();
          setSiteSettings({
              navbarLogoUrl: data.navbarLogoUrl || '',
              faviconUrl: data.faviconUrl || ''
          });
          if (data.heritageBanners && Array.isArray(data.heritageBanners)) {
              setHeritageBanners(data.heritageBanners);
          }
      }
  };

  const handleSaveSettings = async () => {
      if(!db) return;
      setIsSavingSettings(true);
      try {
          await setDoc(doc(db, 'siteSettings', 'global'), {
              ...siteSettings,
              heritageBanners: heritageBanners, // Save dynamic list
              updatedAt: serverTimestamp(),
              updatedBy: user?.email
          }, { merge: true });

          const bannerPromises = Object.entries(bannerSettings).map(([id, url]) => {
              if (url) {
                  return setDoc(doc(db, 'imageOverrides', id), {
                      url: url,
                      updatedAt: new Date(),
                      updatedBy: user?.email
                  }, { merge: true });
              }
              return Promise.resolve();
          });

          await Promise.all(bannerPromises);
          showToast("Đã lưu cấu hình hệ thống thành công!", 'success');
      } catch(e: any) { showToast("Lỗi lưu cấu hình: " + e.message, 'error'); }
      finally { setIsSavingSettings(false); }
  };

  const openPicker = (type: 'site' | 'banner', field: string, label: string) => {
      setPickerTargetType(type);
      setPickerTargetField(field);
      setPickerTargetLabel(label);
      if (type === 'site') {
          setPickerUrlInput(siteSettings[field] || '');
      } else {
          setPickerUrlInput(bannerSettings[field] || '');
      }
      setPickerMode('upload');
      setShowSettingPicker(true);
  };

  const updateTargetValue = (url: string) => {
      if (!pickerTargetField) return;
      if (pickerTargetType === 'site') {
          setSiteSettings((prev: any) => ({ ...prev, [pickerTargetField]: url }));
      } else {
          setBannerSettings((prev: any) => ({ ...prev, [pickerTargetField]: url }));
      }
  };

  const handlePickerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !pickerTargetField) return;
      setIsPickerProcessing(true);
      try {
          const url = await uploadFile(file, 'system-assets');
          updateTargetValue(url);
          setShowSettingPicker(false);
          showToast("Tải ảnh lên thành công!", 'success');
      } catch(e: any) { showToast("Lỗi tải lên: " + e.message, 'error'); }
      finally { setIsPickerProcessing(false); }
  };

  const handlePickerLinkSave = () => {
      if (!pickerTargetField) return;
      updateTargetValue(pickerUrlInput);
      setShowSettingPicker(false);
  };

  const handlePickerLibrarySelect = (url: string) => {
      if (!pickerTargetField) return;
      updateTargetValue(url);
      setShowPickerLibrary(false);
      setShowSettingPicker(false);
  };

  // --- Heritage Banner Logic ---
  const handleAddHeritageBanner = (url: string) => {
      setHeritageBanners(prev => [...prev, url]);
      setShowHeritagePicker(false);
  };

  const handleRemoveHeritageBanner = (index: number) => {
      if (confirm("Xóa ảnh này khỏi băng chuyền?")) {
          setHeritageBanners(prev => prev.filter((_, i) => i !== index));
      }
  };

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user || !db) { setLoading(false); return; }
      try {
        const q = query(collection(db, 'quizResults'), where('uid', '==', user.uid), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        const results: QuizResult[] = [];
        querySnapshot.forEach((doc: any) => results.push({ id: doc.id, ...doc.data() } as QuizResult));
        setHistory(results);
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchHistory();
  }, [user]);

  const fetchAdmins = async () => {
      if (!db) return;
      try {
          const snap = await getDocs(collection(db, 'admins'));
          setAdminList(snap.docs.map((d: any) => ({ uid: d.id, ...d.data() })));
      } catch(e) { console.error(e); }
  };

  const fetchContentList = async () => {
      if (!db) return;
      setIsProcessingContent(true);
      try {
          const snap = await getDocs(collection(db, 'contentOverrides'));
          setContentList(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })));
      } catch(e) { console.error(e); }
      finally { setIsProcessingContent(false); }
  };

  const handleRenameContent = async () => {
      if (!renameData || !renameData.newId.trim() || !db) return;
      if (renameData.newId === renameData.oldId) {
          setRenameData(null);
          return;
      }
      setIsProcessingContent(true);
      try {
          const newDocRef = doc(db, 'contentOverrides', renameData.newId);
          const newDocSnap = await getDoc(newDocRef);
          if (newDocSnap.exists()) {
              if(!confirm(`ID "${renameData.newId}" đã tồn tại. Bạn có muốn ghi đè không?`)) {
                  setIsProcessingContent(false);
                  return;
              }
          }
          const oldDocRef = doc(db, 'contentOverrides', renameData.oldId);
          const oldDocSnap = await getDoc(oldDocRef);
          if (oldDocSnap.exists()) {
              await setDoc(newDocRef, oldDocSnap.data());
              await deleteDoc(oldDocRef);
              showToast(`Đổi tên thành công: ${renameData.oldId} -> ${renameData.newId}`, 'success');
              setRenameData(null);
              fetchContentList();
          }
      } catch (e: any) {
          showToast("Lỗi đổi tên: " + e.message, 'error');
      } finally {
          setIsProcessingContent(false);
      }
  };

  const handleDeleteContent = async (id: string) => {
      if (!confirm(`Bạn chắc chắn muốn xóa vĩnh viễn nội dung "${id}"?`)) return;
      setIsProcessingContent(true);
      try {
          await deleteDoc(doc(db, 'contentOverrides', id));
          showToast("Đã xóa nội dung.", 'info');
          fetchContentList();
      } catch (e: any) {
          showToast("Lỗi xóa: " + e.message, 'error');
      } finally {
          setIsProcessingContent(false);
      }
  };

  useEffect(() => {
      if (activeTab === 'content') {
          fetchContentList();
      }
  }, [activeTab]);

  const handleAddAdmin = async () => {
      if(!newAdminUid || !db) return;
      try {
          await setDoc(doc(db, 'admins', newAdminUid), {
              role: newAdminRole,
              addedAt: serverTimestamp(),
              addedBy: user?.email
          });
          setNewAdminUid('');
          setShowAddAdmin(false);
          fetchAdmins();
          showToast("Cấp quyền thành công!", 'success');
      } catch(e: any) { showToast("Lỗi: " + e.message, 'error'); }
  };

  const handleDeleteHistory = async (id: string) => {
      if(!confirm("Xóa kết quả này?")) return;
      if(!db) return;
      try {
          await deleteDoc(doc(db, 'quizResults', id));
          setHistory(prev => prev.filter(item => item.id !== id));
          showToast("Đã xóa kết quả.", 'info');
      } catch(e) { showToast("Lỗi xóa kết quả", 'error'); }
  };

  const handleUpdateAvatar = async (url: string) => {
      if (!auth?.currentUser) return;
      try {
          await updateProfile(auth.currentUser, { photoURL: url });
          setShowAvatarPicker(false);
          showToast("Đã đổi ảnh đại diện!", 'success');
          window.location.reload();
      } catch (e) { showToast("Lỗi cập nhật ảnh đại diện", 'error'); }
  };

  if (!user) return <div className="text-center py-40 text-gray-500 italic">Vui lòng đăng nhập...</div>;

  const totalQuizzes = history.length;
  const avgScore = totalQuizzes > 0 ? (history.reduce((acc, curr) => acc + (curr.score / curr.total) * 10, 0) / totalQuizzes).toFixed(1) : "0.0";
  const totalQuestions = history.reduce((acc, curr) => acc + curr.total, 0);

  const filteredContent = contentList.filter(c => c.id.toLowerCase().includes(contentSearch.toLowerCase()) || (c.text && c.text.toLowerCase().includes(contentSearch.toLowerCase())));

  return (
    <div className="min-h-screen bg-gray-50 pb-20 animate-fade-in">
      {/* Header Section */}
      <div className="relative bg-history-dark text-white pt-20 pb-16 md:pt-28 md:pb-24 px-4 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-30">
            <EditableImage imageId="profile-header-bg" initialSrc="" alt="Banner" className="w-full h-full object-cover" disableEdit={true} />
        </div>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-6 relative z-10">
          <div className="w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-history-gold shadow-2xl overflow-hidden bg-white shrink-0 relative group">
             {user.photoURL ? (
                 <img 
                    src={user.photoURL} 
                    alt="Avatar" 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                 />
             ) : null}
             
             <div className={`w-full h-full bg-gray-200 flex items-center justify-center ${user.photoURL ? 'hidden' : ''}`}>
                <UserIcon size={64} className="text-gray-400"/>
             </div>

             <button onClick={() => setShowAvatarPicker(true)} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ImageIcon className="text-white" size={28}/></button>
          </div>
          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl md:text-5xl font-black font-serif mb-2">
                {isEditing ? (
                    <div className="flex gap-2">
                        <input value={editName} onChange={e => setEditName(e.target.value)} className="bg-white/10 border-b-2 border-history-gold outline-none px-2 w-full" />
                        <button onClick={async () => { 
                            if (auth.currentUser) {
                                await updateProfile(auth.currentUser, {displayName: editName}); 
                                setIsEditing(false); 
                                window.location.reload(); 
                            }
                        }}>
                            <CheckCircle/>
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 justify-center md:justify-start">{user.displayName} <button onClick={() => setIsEditing(true)}><Edit2 size={20}/></button></div>
                )}
            </h1>
            <p className="text-history-gold/80 flex items-center justify-center md:justify-start gap-2 mb-4 font-mono"><Mail size={16}/> {user.email}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
               <span className="bg-white/10 px-4 py-1 rounded-full text-xs font-bold border border-white/20">Học viên</span>
               {isAdmin && <span className="bg-history-gold text-history-dark px-4 py-1 rounded-full text-xs font-bold shadow-lg uppercase">{userRole === 'admin' ? 'Admin' : 'Cố vấn'}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-10 relative z-20">
         {/* Stats Cards */}
         <div className="grid grid-cols-3 gap-4 mb-10">
             <div className="bg-white p-6 rounded-3xl shadow-xl text-center"><Target className="mx-auto mb-2 text-blue-500"/><p className="text-gray-400 text-[10px] font-black uppercase">Bài làm</p><p className="text-2xl font-black">{totalQuizzes}</p></div>
             <div className="bg-white p-6 rounded-3xl shadow-xl text-center"><List className="mx-auto mb-2 text-purple-500"/><p className="text-gray-400 text-[10px] font-black uppercase">Câu hỏi</p><p className="text-2xl font-black">{totalQuestions}</p></div>
             <div className="bg-white p-6 rounded-3xl shadow-xl text-center"><TrendingUp className="mx-auto mb-2 text-red-500"/><p className="text-gray-400 text-[10px] font-black uppercase">Điểm TB</p><p className="text-2xl font-black text-history-red">{avgScore}</p></div>
         </div>

         {/* Admin Tabs */}
         {isAdmin && (
             <div className="flex bg-gray-200/50 p-1 rounded-2xl mb-8 max-w-2xl border border-gray-200 backdrop-blur-md overflow-x-auto">
                 <button onClick={() => setActiveTab('history')} className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase transition-all whitespace-nowrap ${activeTab === 'history' ? 'bg-white text-history-dark shadow-md' : 'text-gray-500'}`}>Lịch sử</button>
                 <button onClick={() => setActiveTab('admin')} className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase transition-all whitespace-nowrap ${activeTab === 'admin' ? 'bg-history-dark text-history-gold shadow-md' : 'text-gray-500'}`}>Nhân sự</button>
                 <button onClick={() => setActiveTab('content')} className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase transition-all whitespace-nowrap ${activeTab === 'content' ? 'bg-green-600 text-white shadow-md' : 'text-gray-500'}`}>QL Nội dung</button>
                 <button onClick={() => setActiveTab('settings')} className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase transition-all whitespace-nowrap ${activeTab === 'settings' ? 'bg-history-red text-white shadow-md' : 'text-gray-500'}`}>Cài đặt</button>
                 <button onClick={() => setActiveTab('media')} className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase transition-all whitespace-nowrap ${activeTab === 'media' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500'}`}>Media</button>
             </div>
         )}

         {/* HISTORY TAB */}
         {activeTab === 'history' && (
             <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
                 <div className="p-6 border-b border-gray-100 flex justify-between items-center"><h3 className="font-bold text-xl font-serif">Kết quả ôn tập</h3><Clock size={20} className="text-gray-300"/></div>
                 <div className="overflow-x-auto">
                     <table className="w-full text-left">
                         <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b">
                             <tr><th className="px-8 py-5">Chủ đề</th><th className="px-6 py-5">Điểm</th><th className="px-6 py-5">Thời gian</th><th className="px-6 py-5">Ngày</th><th className="px-8 py-5 text-right">Xóa</th></tr>
                         </thead>
                         <tbody className="divide-y divide-gray-100">
                             {history.map(item => (
                                 <tr key={item.id} className="hover:bg-gray-50 group">
                                     <td className="px-8 py-5 flex items-center gap-3">
                                         {item.type === 'exam' ? <GraduationCap size={18} className="text-red-500"/> : <Target size={18} className="text-blue-500"/>}
                                         <span className="font-bold text-gray-800 text-sm">{item.topic}</span>
                                     </td>
                                     <td className="px-6 py-5 font-black text-history-red text-lg">{item.score.toFixed(1)}<span className="text-gray-300 text-xs font-normal">/{item.total}</span></td>
                                     <td className="px-6 py-5 text-gray-500 text-xs font-mono">{Math.floor(item.time / 60)}m {item.time % 60}s</td>
                                     <td className="px-6 py-5 text-gray-400 text-xs">{item.timestamp?.toDate ? item.timestamp.toDate().toLocaleDateString('vi-VN') : 'N/A'}</td>
                                     <td className="px-8 py-5 text-right"><button onClick={() => handleDeleteHistory(item.id)} className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18}/></button></td>
                                 </tr>
                             ))}
                             {history.length === 0 && <tr><td colSpan={5} className="py-20 text-center text-gray-400 italic">Chưa có kết quả nào.</td></tr>}
                         </tbody>
                     </table>
                 </div>
             </div>
         )}
         
         {/* ADMIN TAB */}
         {activeTab === 'admin' && (
             <div className="grid grid-cols-1 gap-8 animate-fade-in max-w-3xl mx-auto">
                 <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100">
                     <div className="flex justify-between items-center mb-6"><h3 className="font-bold font-serif text-xl">Nhân sự Quản trị</h3><button onClick={() => setShowAddAdmin(true)} className="bg-history-dark text-history-gold p-2 rounded-xl"><Plus size={20}/></button></div>
                     <div className="space-y-3">
                         {adminList.map(adm => (
                             <div key={adm.uid} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                 <div>
                                     <p className="font-bold text-sm flex items-center gap-2">
                                         {adm.displayName || "Unknown User"} 
                                         <span className="text-gray-400 text-xs font-normal">({adm.email})</span>
                                     </p>
                                     <p className="text-[10px] text-gray-400 mt-0.5 font-mono">UID: {adm.uid.slice(0,8)}...</p>
                                     <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full mt-1 inline-block ${adm.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>{adm.role}</span>
                                 </div>
                                 {userRole === 'admin' && !ADMIN_UIDS.includes(adm.uid) && <button onClick={async () => { if(confirm("Thu hồi?")) { await deleteDoc(doc(db, 'admins', adm.uid)); fetchAdmins(); } }} className="text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>}
                             </div>
                         ))}
                     </div>
                 </div>
             </div>
         )}

         {/* CONTENT TAB */}
         {activeTab === 'content' && (
             <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden animate-fade-in flex flex-col h-[700px]">
                 <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-green-50">
                     <div>
                         <h3 className="font-bold text-xl font-serif text-green-900 flex items-center gap-2"><FileText className="text-green-600"/> Quản Lý Nội Dung Text</h3>
                         <p className="text-xs text-green-700 mt-1">Đổi tên ID (Rename), Xóa hoặc Sửa nội dung văn bản trên web.</p>
                     </div>
                     <div className="relative w-full md:w-64">
                         <input 
                            type="text" 
                            placeholder="Tìm kiếm ID hoặc nội dung..." 
                            value={contentSearch}
                            onChange={(e) => setContentSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 rounded-xl border-2 border-green-200 focus:border-green-500 outline-none text-sm font-medium bg-white text-gray-800"
                         />
                         <Grid size={16} className="absolute left-3 top-3 text-green-400" />
                     </div>
                 </div>
                 <div className="flex-1 overflow-y-auto p-0">
                     <table className="w-full text-left border-collapse">
                         <thead className="bg-white sticky top-0 z-10 shadow-sm text-[10px] font-black uppercase text-gray-400 tracking-widest">
                             <tr>
                                 <th className="px-6 py-4 border-b">ID (Định danh)</th>
                                 <th className="px-6 py-4 border-b w-1/2">Nội dung xem trước</th>
                                 <th className="px-6 py-4 border-b text-right">Thao tác</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-100">
                             {filteredContent.map((content) => (
                                 <tr key={content.id} className="hover:bg-green-50/50 group transition-colors">
                                     <td className="px-6 py-4 align-top">
                                         <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded break-all select-all">{content.id}</span>
                                     </td>
                                     <td className="px-6 py-4 align-top">
                                         <div className="text-sm text-gray-700 line-clamp-2" title={content.text}>{content.text}</div>
                                         <div className="text-[10px] text-gray-400 mt-1">Cập nhật: {content.updatedBy || 'System'}</div>
                                     </td>
                                     <td className="px-6 py-4 align-top text-right">
                                         <div className="flex justify-end gap-2">
                                             <button onClick={() => setRenameData({ oldId: content.id, newId: content.id, currentText: content.text })} className="p-2 bg-white border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-300 rounded-lg shadow-sm transition-all text-xs font-bold flex items-center gap-1">
                                                 <Copy size={14} /> Đổi tên
                                             </button>
                                             <button onClick={() => handleDeleteContent(content.id)} className="p-2 bg-white border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-300 rounded-lg shadow-sm transition-all">
                                                 <Trash2 size={16} />
                                             </button>
                                         </div>
                                     </td>
                                 </tr>
                             ))}
                             {filteredContent.length === 0 && (
                                 <tr><td colSpan={3} className="py-20 text-center text-gray-400 italic">Không tìm thấy nội dung nào.</td></tr>
                             )}
                         </tbody>
                     </table>
                 </div>
             </div>
         )}
         
         {/* SETTINGS TAB */}
         {activeTab === 'settings' && (
             <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-8 animate-fade-in space-y-8">
                 <div className="flex justify-between items-center border-b border-gray-100 pb-6">
                     <div>
                        <h3 className="font-bold text-2xl font-serif text-gray-800 flex items-center gap-3"><Settings className="text-history-red"/> Cấu hình Website</h3>
                        <p className="text-gray-500 text-sm mt-1">Quản lý Logo, Favicon và Banners cho từng trang.</p>
                     </div>
                     <button onClick={handleSaveSettings} disabled={isSavingSettings} className="bg-history-dark text-history-gold px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-xl active:scale-95 disabled:opacity-50">
                        {isSavingSettings ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>} Lưu thay đổi
                     </button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {/* Identity Section */}
                     <div className="space-y-6">
                         <h4 className="font-bold text-lg text-gray-700 flex items-center gap-2"><Globe size={20} className="text-blue-500"/> Nhận diện thương hiệu</h4>
                         
                         <div className="space-y-4 bg-gray-50 p-6 rounded-3xl border border-gray-200">
                             <div>
                                 <label className="block text-xs font-black text-gray-400 uppercase mb-2">Logo Thanh điều hướng (Navbar)</label>
                                 <div className="flex gap-4 items-center">
                                     <div className="w-16 h-16 bg-white rounded-xl border flex items-center justify-center overflow-hidden p-2 shadow-inner">
                                         {siteSettings.navbarLogoUrl ? <img src={siteSettings.navbarLogoUrl} className="max-h-full max-w-full object-contain" /> : <Monitor size={24} className="text-gray-300"/>}
                                     </div>
                                     <button 
                                        onClick={() => openPicker('site', 'navbarLogoUrl', 'Logo Navbar')}
                                        className="flex-1 bg-white border-2 border-dashed border-gray-300 rounded-xl p-3 text-center cursor-pointer hover:border-blue-400 transition-colors text-xs font-bold text-gray-500"
                                     >
                                         Thay đổi Logo
                                     </button>
                                 </div>
                             </div>

                             <div>
                                 <label className="block text-xs font-black text-gray-400 uppercase mb-2">Favicon (Icon trình duyệt)</label>
                                 <div className="flex gap-4 items-center">
                                     <div className="w-16 h-16 bg-white rounded-xl border flex items-center justify-center overflow-hidden p-3 shadow-inner">
                                         {siteSettings.faviconUrl ? <img src={siteSettings.faviconUrl} className="w-8 h-8 object-contain" /> : <Layout size={24} className="text-gray-300"/>}
                                     </div>
                                     <button 
                                        onClick={() => openPicker('site', 'faviconUrl', 'Favicon')}
                                        className="flex-1 bg-white border-2 border-dashed border-gray-300 rounded-xl p-3 text-center cursor-pointer hover:border-blue-400 transition-colors text-xs font-bold text-gray-500"
                                     >
                                         Thay đổi Favicon
                                     </button>
                                 </div>
                             </div>
                         </div>

                         {/* NEW: Heritage Carousel Management */}
                         <div className="space-y-4 bg-yellow-50 p-6 rounded-3xl border border-yellow-200">
                             <div className="flex justify-between items-center mb-2">
                                 <h4 className="font-bold text-lg text-yellow-800 flex items-center gap-2"><Layout size={20} className="text-yellow-600"/> Băng chuyền Âm Vang Di Sản</h4>
                                 <button onClick={() => setShowHeritagePicker(true)} className="bg-white hover:bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-yellow-300 shadow-sm flex items-center gap-1 transition-all">
                                     <Plus size={14}/> Thêm ảnh
                                 </button>
                             </div>
                             <p className="text-xs text-yellow-600 mb-4">Quản lý danh sách ảnh nền chạy slide ở trang Heritage. Tự động lấy từ thư mục "Heritage" khi thêm.</p>
                             
                             {heritageBanners.length > 0 ? (
                                <div className="grid grid-cols-3 gap-3">
                                    {heritageBanners.map((url, idx) => (
                                        <div key={idx} className="relative aspect-video bg-white rounded-lg overflow-hidden border border-yellow-200 group">
                                            <img src={url} className="w-full h-full object-cover" />
                                            <button 
                                                onClick={() => handleRemoveHeritageBanner(idx)}
                                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={12}/>
                                            </button>
                                            <div className="absolute bottom-0 left-0 bg-black/50 text-white text-[9px] px-1 w-full truncate">{idx + 1}</div>
                                        </div>
                                    ))}
                                </div>
                             ) : (
                                 <div className="text-center py-8 text-yellow-400/50 italic text-sm border-2 border-dashed border-yellow-200 rounded-xl">Chưa có ảnh nào.</div>
                             )}
                         </div>
                     </div>

                     {/* Banners Section */}
                     <div className="space-y-6">
                         <h4 className="font-bold text-lg text-gray-700 flex items-center gap-2"><Layout size={20} className="text-red-500"/> Quản lý Banners</h4>
                         
                         <div className="grid grid-cols-1 gap-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                             {BANNER_CONFIG.map(banner => {
                                 const key = banner.mappedId || banner.id;
                                 return (
                                     <div key={banner.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-200 flex flex-col gap-2">
                                         <label className="text-xs font-black text-gray-400 uppercase">{banner.label}</label>
                                         <div className="flex gap-3 items-center">
                                             <div className="w-24 h-12 bg-white rounded-lg border overflow-hidden shadow-sm relative">
                                                 {bannerSettings[key] ? (
                                                     <img src={bannerSettings[key]} className="w-full h-full object-cover" />
                                                 ) : (
                                                     <div className="w-full h-full bg-gray-100 flex items-center justify-center"><ImageIcon size={16} className="text-gray-300"/></div>
                                                 )}
                                             </div>
                                             <button 
                                                onClick={() => openPicker('banner', key, banner.label)}
                                                className="flex-1 bg-white border border-gray-300 rounded-lg py-2 text-center cursor-pointer hover:bg-gray-100 transition-all text-xs font-bold text-gray-600"
                                             >
                                                 Chỉnh sửa
                                             </button>
                                         </div>
                                     </div>
                                 );
                             })}
                         </div>
                     </div>
                 </div>
             </div>
         )}

         {/* MEDIA TAB */}
         {activeTab === 'media' && (
             <div className="space-y-8 animate-fade-in">
                 <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
                     <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                         <div>
                             <h3 className="font-bold text-xl font-serif flex items-center gap-2"><UserCheck className="text-blue-600"/> Kho Ảnh Đại Diện (Avatars)</h3>
                             <p className="text-xs text-gray-500 mt-1">Upload ảnh vào đây để người dùng có thể lựa chọn.</p>
                         </div>
                     </div>
                     <div className="h-[400px]">
                         {/* Default Avatars Fixed Folder - Inline Mode */}
                         <MediaLibraryModal onClose={() => {}} manageMode={true} hideCloseButton={true} initialFolder="Default Avatars" inline={true} />
                     </div>
                 </div>
                 <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden h-[700px]">
                     <div className="p-6 border-b border-gray-100 bg-gray-50">
                         <h3 className="font-bold text-xl font-serif flex items-center gap-2"><ImageIcon className="text-history-gold"/> Quản Lý Toàn Bộ Media</h3>
                     </div>
                     <div className="h-full pb-20">
                         {/* Full Media Manager - Inline Mode */}
                         <MediaLibraryModal onClose={() => {}} manageMode={true} hideCloseButton={true} initialFolder="root" inline={true} />
                     </div>
                 </div>
             </div>
         )}
      </div>

      {/* RENAME MODAL */}
      {renameData && (
          <div className="fixed inset-0 z-[12000] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={() => setRenameData(null)}>
              <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg p-8 animate-pop-in relative" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setRenameData(null)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-all"><X size={20}/></button>
                  <h3 className="text-xl font-bold font-serif text-gray-800 mb-6 flex items-center gap-2"><Copy className="text-blue-600" size={24}/> Đổi tên ID (Rename)</h3>
                  <div className="space-y-4">
                      <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-xl flex gap-3 items-start"><AlertTriangle className="text-yellow-600 shrink-0" size={20}/><p className="text-xs text-yellow-800 leading-relaxed"><strong>LƯU Ý:</strong> Đổi tên ID cần cập nhật code.</p></div>
                      <div><label className="block text-xs font-black text-gray-400 uppercase mb-2">ID Cũ</label><input disabled value={renameData.oldId} className="w-full px-4 py-3 border border-gray-200 bg-gray-100 rounded-xl text-gray-500 font-mono text-sm"/></div>
                      <div><label className="block text-xs font-black text-gray-400 uppercase mb-2">ID Mới</label><input value={renameData.newId} onChange={(e) => setRenameData({...renameData, newId: e.target.value})} className="w-full px-4 py-3 border-2 border-blue-200 focus:border-blue-500 outline-none rounded-xl text-blue-700 font-bold font-mono text-sm" autoFocus/></div>
                      <div className="flex gap-3 justify-end pt-4"><button onClick={() => setRenameData(null)} className="px-5 py-2 text-gray-500 font-bold text-sm">Hủy</button><button onClick={handleRenameContent} disabled={isProcessingContent || !renameData.newId.trim() || renameData.newId === renameData.oldId} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-black text-sm shadow-lg flex items-center gap-2 hover:bg-blue-700 active:scale-95 disabled:opacity-50 transition-all">{isProcessingContent ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle size={16}/>} Xác nhận</button></div>
                  </div>
              </div>
          </div>
      )}

      {/* ASSET PICKER MODAL */}
      {showSettingPicker && (
          <div className="fixed inset-0 z-[11000] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={() => setShowSettingPicker(false)}>
              <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 animate-pop-in relative" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setShowSettingPicker(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-all"><X size={20}/></button>
                  <h3 className="text-xl font-bold font-serif text-gray-800 mb-6 flex items-center gap-2"><ImageIcon className="text-history-red" size={24}/> Thay đổi {pickerTargetLabel}</h3>
                  <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                      <button onClick={() => setPickerMode('upload')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${pickerMode === 'upload' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}><Upload size={14}/> Tải lên</button>
                      <button onClick={() => setShowPickerLibrary(true)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 text-gray-500`}><Grid size={14}/> Thư viện</button>
                      <button onClick={() => setPickerMode('link')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${pickerMode === 'link' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}><LinkIcon size={14}/> Link</button>
                  </div>
                  {isPickerProcessing ? (<div className="flex flex-col items-center justify-center py-10"><Loader2 className="animate-spin text-history-gold mb-3" size={40}/><p className="text-sm text-gray-500 font-bold animate-pulse">Đang xử lý tài nguyên...</p></div>) : (
                      <>
                        {pickerMode === 'upload' && (
                            <label className="cursor-pointer block w-full py-12 bg-blue-50 text-blue-700 rounded-2xl text-sm font-bold hover:bg-blue-100 transition-all border-2 border-blue-200 border-dashed text-center">
                                <div className="flex flex-col items-center justify-center gap-3"><div className="p-4 bg-white rounded-full shadow-md"><Upload size={32}/></div><p>Nhấn để chọn file từ máy</p></div>
                                <input type="file" className="hidden" onChange={handlePickerUpload} accept="image/*" />
                            </label>
                        )}
                        {pickerMode === 'link' && (
                            <div className="space-y-4">
                                <div><label className="block text-xs font-black text-gray-400 uppercase mb-2">URL</label><input value={pickerUrlInput} onChange={e => setPickerUrlInput(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500 bg-gray-50 text-sm font-mono" placeholder="https://..." /></div>
                                <button onClick={handlePickerLinkSave} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all">Sử dụng</button>
                            </div>
                        )}
                        {pickerMode === 'library' && (<div className="text-center py-4"><button onClick={() => setShowPickerLibrary(true)} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-bold text-sm hover:bg-blue-200 transition-colors flex items-center gap-2 mx-auto"><Grid size={16}/> Mở thư viện</button><p className="text-xs text-gray-400 mt-2">Chọn từ kho ảnh đã tải lên trước đó</p></div>)}
                      </>
                  )}
              </div>
          </div>
      )}

      {/* LIBRARY PICKER */}
      {showPickerLibrary && (<MediaLibraryModal onClose={() => setShowPickerLibrary(false)} onSelect={handlePickerLibrarySelect} />)}

      {/* HERITAGE SPECIFIC PICKER - Opens directly to 'Heritage' folder */}
      {showHeritagePicker && (
          <MediaLibraryModal 
            onClose={() => setShowHeritagePicker(false)} 
            onSelect={handleAddHeritageBanner} 
            initialFolder="Heritage" // Force open Heritage folder
          />
      )}

      {/* ADMIN MODALS */}
      {showAddAdmin && (
          <div className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center p-4" onClick={() => setShowAddAdmin(false)}>
              <div className="bg-white rounded-[2rem] p-8 w-full max-sm animate-pop-in" onClick={e => e.stopPropagation()}>
                  <h3 className="font-bold text-xl mb-4 font-serif">Cấp quyền Quản trị</h3>
                  <div className="space-y-4">
                      <input value={newAdminUid} onChange={e => setNewAdminUid(e.target.value)} className="w-full border-2 rounded-xl p-3 bg-gray-50 outline-none focus:border-history-red" placeholder="Dán mã UID..." />
                      <select value={newAdminRole} onChange={e => setNewAdminRole(e.target.value as any)} className="w-full border-2 rounded-xl p-3 bg-gray-50 font-bold"><option value="advisor">Advisor (Biên soạn)</option><option value="admin">Super Admin (Toàn quyền)</option></select>
                      <div className="flex gap-2 justify-end pt-4"><button onClick={() => setShowAddAdmin(false)} className="px-4 py-2 text-gray-500">Hủy</button><button onClick={handleAddAdmin} className="px-6 py-2 bg-history-dark text-history-gold rounded-xl font-bold">Xác nhận</button></div>
                  </div>
              </div>
          </div>
      )}

      {showAvatarPicker && (
          <MediaLibraryModal 
              onClose={() => setShowAvatarPicker(false)}
              onSelect={handleUpdateAvatar}
              initialFolder="Default Avatars"
              lockedPath={true} // New prop to lock navigation
          />
      )}
    </div>
  );
};

export default ProfilePage;
