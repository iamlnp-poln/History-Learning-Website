
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Edit2, Check, X, Loader2, Youtube, Play, Link as LinkIcon, Plus } from 'lucide-react';
// FIX: Update Firestore imports to use the centralized firebaseConfig.ts file.
import { doc, onSnapshot, setDoc, getDoc, db, auth } from '../firebaseConfig';
import { ADMIN_UIDS } from '../services/cloudinaryService';

interface EditableVideoProps {
  id: string; // ID duy nhất để lưu vào DB (vd: 'video-event-1945')
  defaultUrl?: string; // Link gốc
  className?: string;
  title?: string; // Title for the add button
}

const EditableVideo: React.FC<EditableVideoProps> = ({ id, defaultUrl, className = "", title = "Video" }) => {
  const [videoUrl, setVideoUrl] = useState(defaultUrl || '');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tempUrl, setTempUrl] = useState('');
  const [saving, setSaving] = useState(false);

  // 1. Check Admin (Hardcoded + Firestore)
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
        // Check Firestore admins
        if (db) {
            try {
                const docSnap = await getDoc(doc(db, 'admins', user.uid));
                setIsAdmin(docSnap.exists());
            } catch (e) {
                setIsAdmin(false);
            }
        }
    };

    const unsubscribe = auth?.onAuthStateChanged((user: any) => {
      checkAdmin(user);
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  // 2. Listen to Real-time updates from Firestore
  useEffect(() => {
    if (!id || !db) return;
    
    const unsub = onSnapshot(doc(db, 'videoOverrides', id), (docSnap: any) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            // Allow empty string to effectively "delete" a default video if needed, 
            // but here we just check if data exists.
            if (data.url !== undefined) {
                setVideoUrl(data.url);
            }
        }
    });
    return () => unsub();
  }, [id]);

  // Helper to extract YouTube Embed ID
  const getYoutubeEmbedUrl = (url?: string) => {
    if (!url) return null;
    try {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
    } catch(e) {
        return null;
    }
  };

  const handleSave = async () => {
      setSaving(true);
      try {
          if (db) {
              await setDoc(doc(db, 'videoOverrides', id), {
                  url: tempUrl,
                  updatedAt: new Date(),
                  updatedBy: auth.currentUser?.email
              }, { merge: true });
          }
          setIsEditing(false);
      } catch (error) {
          alert("Lỗi lưu video: " + error);
      } finally {
          setSaving(false);
      }
  };

  const embedUrl = getYoutubeEmbedUrl(videoUrl);

  // LOGIC:
  // 1. If has video -> Show Video (with Edit button if Admin)
  // 2. If no video AND Admin -> Show "Add Video" button
  // 3. If no video AND Not Admin -> Return null (Hidden)

  if (!videoUrl && !isAdmin) {
      return null;
  }

  return (
    <div className={`relative group/video ${className}`}>
      
      {embedUrl ? (
          <div className="relative aspect-video bg-black overflow-hidden shadow-lg border-2 border-gray-200 w-full rounded-2xl">
                <iframe 
                    className="absolute inset-0 w-full h-full"
                    src={embedUrl}
                    title="Video Player"
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    allowFullScreen
                ></iframe>
                
                {/* Admin Edit Button (Overlay) */}
                {isAdmin && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); setTempUrl(videoUrl); setIsEditing(true); }}
                        className="absolute top-2 right-2 p-2 bg-blue-600/90 text-white rounded-lg shadow-md opacity-0 group-hover/video:opacity-100 transition-opacity z-20 hover:bg-blue-700 flex items-center gap-2 text-xs font-bold backdrop-blur-sm"
                    >
                        <Edit2 size={14} /> Sửa
                    </button>
                )}
          </div>
      ) : (
          // Admin Add Button Mode
          isAdmin && (
            <button 
                onClick={(e) => { e.stopPropagation(); setTempUrl(''); setIsEditing(true); }}
                className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-all gap-2 bg-gray-50"
            >
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <Plus size={20} />
                </div>
                <span className="text-sm font-bold">Thêm {title}</span>
            </button>
          )
      )}

      {/* Edit Popup (Fixed Center in Portal) */}
      {isAdmin && isEditing && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm animate-fade-in" onClick={(e) => { e.stopPropagation(); setIsEditing(false); }}>
            <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200" onClick={(e) => e.stopPropagation()}>
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-base">
                    <Youtube size={20} className="text-red-600"/> {videoUrl ? 'Sửa liên kết' : 'Thêm video mới'}
                </h4>
                <div className="relative mb-4">
                    <LinkIcon size={18} className="absolute left-3 top-3 text-gray-400" />
                    <input 
                        type="text"
                        value={tempUrl}
                        onChange={(e) => setTempUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50"
                        autoFocus
                    />
                </div>
                <div className="flex gap-3 justify-end">
                    <button 
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-bold transition-colors"
                    >
                        Hủy
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin"/> : <Check size={16} />} Lưu
                    </button>
                </div>
            </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default EditableVideo;
