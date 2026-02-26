
import React, { useState, useEffect } from 'react';
import { Edit3, Check, X, Loader2 } from 'lucide-react';
// FIX: Update Firestore imports to use the centralized firebaseConfig.ts file.
import { doc, setDoc, db, auth } from '../firebaseConfig';
import { ADMIN_UIDS } from '../services/cloudinaryService';
import { useGlobalData } from '../contexts/GlobalDataContext';

interface EditableTextProps {
  id: string; // ID duy nhất để lưu vào DB (vd: 'homepage-title')
  defaultText: string;
  className?: string;
  multiline?: boolean; // Nếu true thì dùng textarea, false dùng input
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div'; // Thẻ HTML muốn render
  highlightKeyword?: string; // New prop for search highlighting
}

const EditableText: React.FC<EditableTextProps> = ({ 
  id, 
  defaultText, 
  className = "", 
  multiline = false,
  tag = 'span',
  highlightKeyword = ""
}) => {
  // Use Global Context for Reading Data (No more individual listeners!)
  const { textOverrides } = useGlobalData();
  const currentText = textOverrides[id] || defaultText;

  const [isEditing, setIsEditing] = useState(false);
  const [tempText, setTempText] = useState(currentText);
  const [isSaving, setIsSaving] = useState(false); // State to show loading spinner
  const [isAdmin, setIsAdmin] = useState(false);

  // 1. Check Admin
  useEffect(() => {
    const unsubscribe = auth?.onAuthStateChanged((user: any) => {
      setIsAdmin(!!user && ADMIN_UIDS.includes(user.uid));
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  // Update temp text when data changes externally (if not editing)
  useEffect(() => {
      if (!isEditing) {
          setTempText(currentText);
      }
  }, [currentText, isEditing]);

  const handleSave = async () => {
      if (!tempText.trim()) return;
      
      setIsSaving(true); // Start Blocking UI
      try {
          if (db) {
              // Wait for Firestore to confirm write
              await setDoc(doc(db, 'contentOverrides', id), {
                  text: tempText,
                  updatedAt: new Date(),
                  updatedBy: auth.currentUser?.email
              }, { merge: true });
          }
          setIsEditing(false); // Only close after success
      } catch (error: any) {
          console.error("Lỗi lưu:", error);
          alert("Lưu thất bại: " + error.message);
      } finally {
          setIsSaving(false); // Stop Blocking UI
      }
  };

  const handleCancel = () => {
      setTempText(currentText); // Revert
      setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      // Cho phép Ctrl+Enter để lưu nhanh
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          handleSave();
      }
      // Esc để hủy
      if (e.key === 'Escape') {
          handleCancel();
      }
  };

  // Render Edit Mode
  if (isEditing) {
      return (
          <div className="relative group min-w-[200px] inline-block w-full">
              {multiline ? (
                  <textarea 
                    value={tempText}
                    onChange={(e) => setTempText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isSaving}
                    className={`w-full p-2 border-2 border-blue-500 rounded-lg outline-none bg-white text-gray-800 text-base shadow-lg font-mono text-sm ${className} ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    rows={6}
                    autoFocus
                    placeholder="Nhập nội dung (hỗ trợ HTML: <strong>, <b>, <br>...)"
                  />
              ) : (
                  <input 
                    type="text"
                    value={tempText}
                    onChange={(e) => setTempText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isSaving}
                    className={`w-full p-2 border-2 border-blue-500 rounded-lg outline-none bg-white text-gray-800 shadow-lg ${className} ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    autoFocus
                  />
              )}
              
              <div className="absolute -bottom-10 right-0 flex gap-2 z-50 animate-pop-in">
                  <button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 shadow-md transition-transform hover:scale-110 disabled:bg-gray-400"
                  >
                      {isSaving ? <Loader2 size={16} className="animate-spin"/> : <Check size={16} />}
                  </button>
                  <button 
                    onClick={handleCancel} 
                    disabled={isSaving}
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md transition-transform hover:scale-110 disabled:bg-gray-400"
                  >
                      <X size={16} />
                  </button>
              </div>
          </div>
      );
  }

  // Render View Mode
  const Tag = tag as any;

  const renderHtml = () => {
      let processedText = currentText.replace(/\n/g, '<br />');
      
      // Apply Highlighting if keyword exists and not editing
      if (highlightKeyword && highlightKeyword.trim().length > 0) {
          const regex = new RegExp(`(${highlightKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
          processedText = processedText.replace(regex, '<mark class="bg-yellow-300 text-history-dark rounded-sm px-0.5">$1</mark>');
      }

      return { __html: processedText };
  };

  return (
    <Tag 
        className={`relative group/text ${className} ${isAdmin ? 'cursor-pointer hover:bg-blue-50/30 rounded transition-all duration-200 border border-transparent hover:border-blue-200/50' : ''}`}
        onClick={(e: React.MouseEvent) => {
            // Cho phép click đúp hoặc click giữ để sửa nếu muốn, ở đây để click nút edit
            if(isAdmin && e.detail === 2) { // Double click to edit
                 e.stopPropagation(); 
                 setIsEditing(true);
            }
        }}
    >
       <span dangerouslySetInnerHTML={renderHtml()} />
       
       {isAdmin && (
           <button 
             onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
             className="absolute -top-3 -right-3 p-1.5 bg-white text-blue-600 rounded-full shadow-sm border border-gray-100 opacity-0 group-hover/text:opacity-100 transition-all hover:bg-blue-50 z-10 transform scale-90 hover:scale-110"
             title="Sửa văn bản (Double click để sửa nhanh)"
           >
               <Edit3 size={12} />
           </button>
       )}
    </Tag>
  );
};

export default EditableText;
