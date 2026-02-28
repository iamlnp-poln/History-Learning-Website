
import { 
    db, storage, // Import storage instance
    collection, addDoc, getDocs, query, where, deleteDoc, updateDoc, doc, serverTimestamp, getDoc,
    ref, uploadBytes, getDownloadURL, deleteObject // Import storage functions
} from '../firebaseConfig';

// --- GOOGLE FIREBASE STORAGE IMPLEMENTATION ---
// Note: We keep the filename 'cloudinaryService.ts' to avoid breaking imports in other components,
// but the underlying technology has been migrated to Google Cloud (Firebase Storage).

export interface VirtualAsset {
    id: string;
    type: 'folder' | 'file';
    name: string;
    parentId: string;
    url?: string;
    thumbnail?: string;
    storagePath?: string; // Path in Firebase Storage bucket
    format?: string;
    size?: number;
    createdAt: any;
    isDeleted: boolean;
    deletedAt?: any;
}

/**
 * Helper: Optimize Image URL
 * Firebase Storage URLs don't support dynamic transformation params like Cloudinary.
 * This function is kept for backward compatibility with old Cloudinary links.
 */
export const optimizeCloudinaryUrl = (url: string) => {
    if (!url || typeof url !== 'string') return '';
    // If it's a legacy Cloudinary URL, keep optimization
    if (url.includes('cloudinary.com')) {
        return url.replace('/upload/', '/upload/f_auto,q_auto/');
    }
    // If it's Firebase Storage or other, return as is
    return url;
};

/**
 * CORE: Upload file lên Google Firebase Storage -> Lưu Metadata vào Firestore (Ảo)
 */
export const uploadFile = async (file: File, parentId: string = 'root'): Promise<string> => {
  if (!file) throw new Error("Chưa chọn file");
  if (!storage) throw new Error("Dịch vụ Storage chưa được khởi tạo");

  try {
    // 1. Sanitize filename: Thay thế ký tự đặc biệt để đảm bảo tương thích URL
    // Giữ lại chữ cái, số, dấu chấm, gạch ngang, gạch dưới.
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');

    // 2. Tạo đường dẫn lưu trữ duy nhất: uploads/{timestamp}_{random}_{filename}
    const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${sanitizedFileName}`;
    const storageRef = ref(storage, `uploads/${uniqueName}`);

    // 3. Thiết lập Metadata (QUAN TRỌNG CHO GOOGLE CLOUD)
    // contentType: Giúp trình duyệt hiển thị ảnh thay vì download.
    // cacheControl: Giúp trình duyệt cache ảnh lâu dài.
    const metadata = {
        contentType: file.type, 
        cacheControl: 'public, max-age=31536000', // Cache 1 năm
    };

    // 4. Upload file lên Firebase Storage với metadata
    const snapshot = await uploadBytes(storageRef, file, metadata);
    
    // 5. Lấy URL tải xuống công khai
    const downloadURL = await getDownloadURL(snapshot.ref);

    // 6. Lưu thông tin vào Firestore (Hệ thống file ảo)
    if (db) {
        await addDoc(collection(db, 'media_assets'), {
            type: 'file',
            name: file.name, // Giữ tên gốc để hiển thị UI
            parentId: parentId,
            url: downloadURL,
            storagePath: snapshot.ref.fullPath, // Lưu path để sau này xóa file gốc
            format: file.type,
            size: file.size,
            createdAt: serverTimestamp(),
            isDeleted: false,
            // Track who uploaded if needed
            // uploadedBy: auth.currentUser?.uid 
        });
    }

    return downloadURL;
  } catch (error: any) {
    console.error("Firebase Storage Upload Error:", error);
    throw new Error(error.message || "Lỗi upload lên Google Cloud");
  }
};

/**
 * Legacy Wrapper: Giữ tên hàm này để tương thích với các component cũ.
 * Thực tế nó gọi uploadFile của Firebase.
 */
export const uploadToCloudinary = async (file: File, folderName: string = 'general'): Promise<string> => {
    return await uploadFile(file, 'root');
};

/**
 * VFS: Lấy danh sách file/folder chưa xóa
 */
export const getVirtualAssets = async (parentId: string = 'root'): Promise<VirtualAsset[]> => {
    if (!db) return [];
    try {
        const q = query(
            collection(db, 'media_assets'),
            where('parentId', '==', parentId),
            where('isDeleted', '==', false)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as VirtualAsset));
    } catch (e) {
        console.error("Get Assets Error:", e);
        return [];
    }
};

/**
 * Legacy Wrapper: Get all assets (Compatibility)
 */
export const getCloudinaryAssets = async () => {
    if (!db) return [];
    try {
        const q = query(collection(db, 'media_assets'), where('isDeleted', '==', false));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as VirtualAsset));
    } catch (e) { return []; }
};

/**
 * VFS: Tạo thư mục ảo
 */
export const createVirtualFolder = async (name: string, parentId: string = 'root') => {
    if (!db) return;
    try {
        await addDoc(collection(db, 'media_assets'), {
            type: 'folder',
            name: name,
            parentId: parentId,
            createdAt: serverTimestamp(),
            isDeleted: false
        });
    } catch (e: any) {
        throw new Error("Lỗi tạo thư mục: " + e.message);
    }
};

/**
 * VFS: Lấy TOÀN BỘ file/folder chưa xóa (Global Search)
 */
export const getAllVirtualAssets = async (): Promise<VirtualAsset[]> => {
    if (!db) return [];
    try {
        const q = query(
            collection(db, 'media_assets'),
            where('isDeleted', '==', false)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as VirtualAsset));
    } catch (e) {
        console.error("Get All Assets Error:", e);
        return [];
    }
};

/**
 * VFS: Lấy ID thư mục bằng tên
 */
export const getFolderIdByName = async (folderName: string, parentId: string = 'root'): Promise<string | null> => {
    if (!db) return null;
    try {
        const q = query(
            collection(db, 'media_assets'),
            where('type', '==', 'folder'),
            where('name', '==', folderName),
            where('parentId', '==', parentId),
            where('isDeleted', '==', false)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            return snapshot.docs[0].id;
        }
        return null;
    } catch (e) {
        return null;
    }
};

/**
 * VFS: Lấy tất cả thư mục (cho Move)
 */
export const getAllFolders = async (): Promise<VirtualAsset[]> => {
    if (!db) return [];
    try {
        const q = query(
            collection(db, 'media_assets'),
            where('type', '==', 'folder'),
            where('isDeleted', '==', false)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as VirtualAsset));
    } catch (e) { return []; }
};

/**
 * VFS: Lấy Thùng Rác
 */
export const getTrashAssets = async (): Promise<VirtualAsset[]> => {
    if (!db) return [];
    try {
        const q = query(
            collection(db, 'media_assets'),
            where('isDeleted', '==', true)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as VirtualAsset));
    } catch (e) { return []; }
};

/**
 * VFS: Đổi tên
 */
export const renameVirtualAsset = async (id: string, newName: string) => {
    if (!db) return;
    try {
        await updateDoc(doc(db, 'media_assets', id), { name: newName });
    } catch (e: any) { throw new Error("Lỗi đổi tên: " + e.message); }
};

/**
 * VFS: Di chuyển
 */
export const moveVirtualAsset = async (id: string, newParentId: string) => {
    if (!db) return;
    try {
        await updateDoc(doc(db, 'media_assets', id), { parentId: newParentId });
    } catch (e: any) { throw new Error("Lỗi di chuyển: " + e.message); }
};

/**
 * VFS: Xóa tạm
 */
export const softDeleteAsset = async (id: string) => {
    if (!db) return;
    try {
        await updateDoc(doc(db, 'media_assets', id), { 
            isDeleted: true,
            deletedAt: serverTimestamp()
        });
    } catch (e: any) { throw new Error("Lỗi xóa: " + e.message); }
};

/**
 * VFS: Khôi phục
 */
export const restoreAsset = async (id: string) => {
    if (!db) return;
    try {
        await updateDoc(doc(db, 'media_assets', id), { 
            isDeleted: false,
            deletedAt: null
        });
    } catch (e: any) { throw new Error("Lỗi khôi phục: " + e.message); }
};

/**
 * VFS: Xóa vĩnh viễn (Xóa cả trên Firebase Storage)
 */
export const hardDeleteAsset = async (id: string) => {
    if (!db || !storage) return;
    try {
        // 1. Lấy thông tin file để tìm đường dẫn storagePath
        const docRef = doc(db, 'media_assets', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            // Nếu là file và có đường dẫn lưu trữ, xóa file vật lý
            if (data.type === 'file' && data.storagePath) {
                const fileRef = ref(storage, data.storagePath);
                await deleteObject(fileRef).catch((err: any) => {
                    console.warn("File gốc trên Storage có thể đã bị xóa hoặc không tìm thấy:", err);
                });
            }
        }

        // 2. Xóa metadata trong Firestore
        await deleteDoc(docRef);
    } catch (e: any) {
        throw new Error("Lỗi xóa vĩnh viễn: " + e.message);
    }
};

/**
 * Helper: Lấy info folder
 */
export const getFolderInfo = async (folderId: string) => {
    if (folderId === 'root') return { id: 'root', name: 'Thư mục gốc' } as VirtualAsset;
    if (!db) return null;
    try {
        const d = await getDoc(doc(db, 'media_assets', folderId));
        if (d.exists()) return { id: d.id, ...d.data() } as VirtualAsset;
        return null;
    } catch { return null; }
};

export const ADMIN_UIDS = [
    'x7SvkOuLwQg9buOS9UzX1MFTqlq2',
    '4fuhXEkyAZUxF10bmT9Rj6rMkmM2'
];
