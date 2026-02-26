
const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Khởi tạo Firebase Admin
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// --- CLOUDINARY ---
// Backend này hiện tại chỉ giữ lại để mở rộng sau này nếu cần Signed Upload.
exports.checkBackendHealth = functions.https.onCall((data, context) => {
    return { status: "ok", message: "Backend is running. Cloudinary Admin APIs are disabled for safety." };
});

// --- USER MANAGEMENT (ADMIN SDK) ---

/**
 * Hàm lấy thông tin User (Email, DisplayName, PhotoURL) thông qua UID.
 * Chỉ cho phép gọi nếu người gọi đã đăng nhập (context.auth != null).
 * Để bảo mật cao hơn, bạn có thể kiểm tra thêm custom claims admin.
 */
exports.getAuthUserByUid = functions.https.onCall(async (data, context) => {
    // 1. Kiểm tra xác thực (Người gọi phải đăng nhập)
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated', 
            'Bạn phải đăng nhập để thực hiện thao tác này.'
        );
    }

    const uidToCheck = data.uid;
    if (!uidToCheck) {
        throw new functions.https.HttpsError('invalid-argument', 'Thiếu thông tin UID.');
    }

    try {
        // 2. Dùng Admin SDK để lấy thông tin user
        const userRecord = await admin.auth().getUser(uidToCheck);
        
        // 3. Trả về thông tin cần thiết
        return {
            uid: userRecord.uid,
            email: userRecord.email || "Chưa cập nhật email",
            displayName: userRecord.displayName || "Chưa đặt tên",
            photoURL: userRecord.photoURL || ""
        };
    } catch (error) {
        console.error("Lỗi lấy thông tin user:", error);
        // Trả về null nếu không tìm thấy, thay vì quăng lỗi để Frontend dễ xử lý
        return null; 
    }
});
