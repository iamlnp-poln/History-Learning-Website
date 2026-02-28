import { 
    storage, 
    ref, 
    uploadBytes, 
    getDownloadURL, 
    deleteObject, 
    listAll,
    db,
    collection,
    addDoc,
    query,
    where,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    getDoc
} from '../firebaseConfig';

// --- CONFIGURATION ---
// Thay đổi tên collection tại đây để chuyển đổi giữa kho cũ và mới
const MEDIA_COLLECTION = 'media_assets_gcloud';

export interface StorageItem {
    name: string;
    fullPath: string;
    isFolder: boolean;
    url?: string;
    ref: any; 
}

// Virtual Asset interface for compatibility
export interface VirtualAsset {
    id: string;
    type: 'folder' | 'file' | 'external_reference';
    name: string;
    parentId: string;
    url?: string;
    thumbnail?: string;
    credit?: string; // Added credit field
    storagePath?: string; 
    format?: string;
    size?: number;
    createdAt: any;
    isDeleted: boolean;
    deletedAt?: any;
}

/**
 * Optimize Image URL / Resized Image Extension Support
 */
export const getResizedUrl = (originalUrl: string, size: string = '200x200'): string => {
    if (!originalUrl || typeof originalUrl !== 'string' || originalUrl.includes('cloudinary')) return originalUrl;
    try {
        return originalUrl; 
    } catch (e) {
        return originalUrl;
    }
};

/**
 * Upload file to Storage AND register in Firestore (VFS)
 * Updated to accept 'credit' metadata
 */
export const uploadFile = async (file: File, parentId: string = 'root', credit: string = ''): Promise<string> => {
  if (!file) throw new Error("Chưa chọn file");
  if (!storage) throw new Error("Dịch vụ Storage chưa được khởi tạo");

  try {
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${sanitizedFileName}`;
    const storageRef = ref(storage, `uploads/${uniqueName}`);

    const metadata = {
        contentType: file.type, 
        cacheControl: 'public, max-age=31536000', 
        customMetadata: {
            credit: credit // Save to Storage metadata as well
        }
    };

    const snapshot = await uploadBytes(storageRef, file, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);

    if (db) {
        await addDoc(collection(db, MEDIA_COLLECTION), {
            type: 'file',
            name: file.name,
            parentId: parentId,
            url: downloadURL,
            storagePath: snapshot.ref.fullPath,
            format: file.type,
            size: file.size,
            credit: credit, // Save to Firestore
            createdAt: serverTimestamp(),
            isDeleted: false,
        });
    }

    return downloadURL;
  } catch (error: any) {
    console.error("Firebase Storage Upload Error:", error);
    throw new Error(error.message || "Lỗi upload lên Google Cloud");
  }
};

/**
 * NEW: Update or Set Credit globally for a specific URL
 * This ensures any usage of this URL gets the same credit.
 */
export const setGlobalCredit = async (url: string, credit: string) => {
    if (!db || !url) return;
    try {
        // 1. Find existing asset with this URL
        const q = query(collection(db, MEDIA_COLLECTION), where('url', '==', url));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            // Update all matching docs (usually just one)
            const updates = snapshot.docs.map((docSnap: any) => 
                updateDoc(doc(db, MEDIA_COLLECTION, docSnap.id), { credit: credit })
            );
            await Promise.all(updates);
        } else {
            // If not found (e.g. external link), create a reference doc to store the credit
            await addDoc(collection(db, MEDIA_COLLECTION), {
                type: 'external_reference',
                name: 'External Asset',
                url: url,
                credit: credit,
                createdAt: serverTimestamp(),
                isDeleted: false,
                parentId: 'system' // Hidden folder
            });
        }
    } catch (e: any) {
        console.error("Error setting global credit:", e);
        throw new Error("Lỗi đồng bộ bản quyền: " + e.message);
    }
};

/**
 * Legacy Helper: Upload file directly to path (No Firestore)
 * Used for backward compatibility, but prefer uploadFile for VFS support.
 */
export const uploadFileToPath = async (file: File, path: string): Promise<string> => {
  if (!file) throw new Error("Chưa chọn file");
  if (!storage) throw new Error("Dịch vụ Storage chưa được khởi tạo");

  try {
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = path === 'root' || path === '' 
        ? `uploads/${Date.now()}_${sanitizedFileName}` 
        : `${path}/${Date.now()}_${sanitizedFileName}`;
        
    const storageRef = ref(storage, storagePath);
    const metadata = { contentType: file.type, cacheControl: 'public, max-age=31536000' };
    const snapshot = await uploadBytes(storageRef, file, metadata);
    return await getDownloadURL(snapshot.ref);
  } catch (error: any) {
    throw new Error(error.message || "Lỗi upload");
  }
};

/**
 * Legacy: List files from physical storage
 */
export const listStorageItems = async (path: string = 'uploads'): Promise<StorageItem[]> => {
    if (!storage) return [];
    const listRef = ref(storage, path === 'root' ? '' : path);
    try {
        const res: any = await listAll(listRef);
        const folders: StorageItem[] = res.prefixes.map((folderRef: any) => ({
            name: folderRef.name,
            fullPath: folderRef.fullPath,
            isFolder: true,
            ref: folderRef
        }));
        const files: StorageItem[] = res.items.map((itemRef: any) => ({
            name: itemRef.name,
            fullPath: itemRef.fullPath,
            isFolder: false,
            ref: itemRef
        }));
        return [...folders, ...files];
    } catch (error) { return []; }
};

export const getFileUrl = async (fullPath: string): Promise<string> => {
    try {
        const reference = ref(storage, fullPath);
        return await getDownloadURL(reference);
    } catch (e) { return ""; }
};

export const deleteStorageFile = async (fullPath: string) => {
    if (!storage) return;
    try {
        const fileRef = ref(storage, fullPath);
        await deleteObject(fileRef);
    } catch (e: any) {
        throw new Error("Lỗi xóa file: " + e.message);
    }
};

/**
 * VFS: Lấy danh sách file/folder chưa xóa
 */
export const getVirtualAssets = async (parentId: string = 'root'): Promise<VirtualAsset[]> => {
    if (!db) return [];
    try {
        const q = query(
            collection(db, MEDIA_COLLECTION),
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
 * VFS: Tạo thư mục ảo
 */
export const createVirtualFolder = async (name: string, parentId: string = 'root') => {
    if (!db) return;
    try {
        await addDoc(collection(db, MEDIA_COLLECTION), {
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
        // Query all items that are NOT deleted
        const q = query(
            collection(db, MEDIA_COLLECTION),
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
            collection(db, MEDIA_COLLECTION),
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
 * VFS: Helper lấy hoặc tạo thư mục nếu chưa có
 */
export const getOrCreateFolder = async (folderName: string, parentId: string = 'root'): Promise<string> => {
    if (!db) return 'root';
    try {
        // 1. Check exist
        const existingId = await getFolderIdByName(folderName, parentId);
        if (existingId) return existingId;

        // 2. Create if not exist
        const docRef = await addDoc(collection(db, MEDIA_COLLECTION), {
            type: 'folder',
            name: folderName,
            parentId: parentId,
            createdAt: serverTimestamp(),
            isDeleted: false
        });
        return docRef.id;
    } catch (e) {
        console.error("Error creating folder:", e);
        return 'root'; // Fallback
    }
};

/**
 * VFS: Lấy tất cả thư mục (cho Move)
 */
export const getAllFolders = async (): Promise<VirtualAsset[]> => {
    if (!db) return [];
    try {
        const q = query(
            collection(db, MEDIA_COLLECTION),
            where('type', '==', 'folder'),
            where('isDeleted', '==', false)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as VirtualAsset));
    } catch (e) { return []; }
};

/**
 * VFS: Lấy Thùng Rác (Items đã bị soft delete)
 */
export const getTrashAssets = async (): Promise<VirtualAsset[]> => {
    if (!db) return [];
    try {
        const q = query(
            collection(db, MEDIA_COLLECTION),
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
        await updateDoc(doc(db, MEDIA_COLLECTION, id), { name: newName });
    } catch (e: any) { throw new Error("Lỗi đổi tên: " + e.message); }
};

/**
 * VFS: Cập nhật nguồn (credit)
 */
export const updateAssetCredit = async (id: string, credit: string) => {
    if (!db) return;
    try {
        await updateDoc(doc(db, MEDIA_COLLECTION, id), { credit: credit });
    } catch (e: any) { throw new Error("Lỗi cập nhật nguồn: " + e.message); }
};

/**
 * VFS: Di chuyển
 */
export const moveVirtualAsset = async (id: string, newParentId: string) => {
    if (!db) return;
    try {
        await updateDoc(doc(db, MEDIA_COLLECTION, id), { parentId: newParentId });
    } catch (e: any) { throw new Error("Lỗi di chuyển: " + e.message); }
};

/**
 * VFS: Xóa tạm (Soft Delete)
 */
export const softDeleteAsset = async (id: string) => {
    if (!db) return;
    try {
        // Nếu là folder, cần phải soft delete tất cả con cái của nó (recursive)
        // Tuy nhiên để đơn giản, logic move-to-trash thường chỉ đánh dấu item gốc.
        // Nhưng nếu folder bị đánh dấu deleted, các con của nó sẽ bị "ẩn" khỏi view bình thường.
        // Để "Empty Trash" hoạt động đúng, cần logic recursive khi Hard Delete.
        
        await updateDoc(doc(db, MEDIA_COLLECTION, id), { 
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
        await updateDoc(doc(db, MEDIA_COLLECTION, id), { 
            isDeleted: false,
            deletedAt: null
        });
    } catch (e: any) { throw new Error("Lỗi khôi phục: " + e.message); }
};

/**
 * Helper: Xóa file vật lý trên Firebase Storage
 * Hỗ trợ fallback xóa bằng URL nếu không có storagePath
 */
const deletePhysicalFile = async (data: any) => {
    if (!storage) return;
    try {
        if (data.storagePath) {
            const fileRef = ref(storage, data.storagePath);
            await deleteObject(fileRef);
        } else if (data.url && data.url.includes('firebasestorage.googleapis.com')) {
            // Fallback: Thử tạo reference từ URL HTTPS
            // Firebase Storage SDK hỗ trợ ref(storage, url)
            const fileRef = ref(storage, data.url);
            await deleteObject(fileRef);
        }
    } catch (error: any) {
        // Bỏ qua lỗi nếu file không tồn tại (đã xóa rồi)
        if (error.code !== 'storage/object-not-found') {
            console.warn("Lỗi xóa file vật lý (có thể file đã bị xóa trước đó):", error);
        }
    }
};

/**
 * Helper: Xóa đệ quy Folder và nội dung bên trong
 */
const deleteFolderRecursively = async (folderId: string) => {
    if (!db || !storage) return;
    
    // 1. Tìm tất cả con trực tiếp (cả đã xóa và chưa xóa)
    const q = query(collection(db, MEDIA_COLLECTION), where('parentId', '==', folderId));
    const snapshot = await getDocs(q);

    for (const docSnap of snapshot.docs) {
        const item = { id: docSnap.id, ...docSnap.data() } as VirtualAsset;
        
        if (item.type === 'folder') {
            // Đệ quy xóa folder con
            await deleteFolderRecursively(item.id);
        } else {
            // Xóa file vật lý và metadata
            await deletePhysicalFile(item);
            await deleteDoc(doc(db, MEDIA_COLLECTION, item.id));
        }
    }

    // 2. Xóa chính folder doc
    await deleteDoc(doc(db, MEDIA_COLLECTION, folderId));
};

/**
 * VFS: Xóa vĩnh viễn (Hard Delete)
 * - Nếu là File: Xóa Storage + Firestore
 * - Nếu là Folder: Xóa đệ quy toàn bộ nội dung bên trong
 */
export const hardDeleteAsset = async (id: string) => {
    if (!db || !storage) return;
    try {
        const docRef = doc(db, MEDIA_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data() as VirtualAsset;
            
            if (data.type === 'folder') {
                // Xử lý xóa đệ quy thư mục
                await deleteFolderRecursively(id);
            } else {
                // Xử lý xóa file lẻ
                await deletePhysicalFile(data);
                await deleteDoc(docRef);
            }
        } else {
            // Document không tồn tại, có thể đã bị xóa trước đó
            console.warn("Document not found for deletion:", id);
        }
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
        const d = await getDoc(doc(db, MEDIA_COLLECTION, folderId));
        if (d.exists()) return { id: d.id, ...d.data() } as VirtualAsset;
        return null;
    } catch { return null; }
};

export const uploadToCloudinary = uploadFile; // Alias for backward compat
export const optimizeCloudinaryUrl = getResizedUrl;
export const getCloudinaryAssets = async () => []; // Deprecated alias
export const uploadToStorage = uploadFile; // Alias for backward compat

export const ADMIN_UIDS = [
    'x7SvkOuLwQg9buOS9UzX1MFTqlq2',
    '4fuhXEkyAZUxF10bmT9Rj6rMkmM2'
];
