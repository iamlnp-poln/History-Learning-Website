
import React from 'react';
import { Shield, Lock, FileText, AlertCircle, HelpCircle } from 'lucide-react';
import EditableText from './EditableText';
import EditableImage from './EditableImage';

const TermsPage: React.FC = () => {
  return (
    <div className="animate-fade-in pb-20 bg-gray-50 min-h-screen">
      {/* Banner with Editable Background */}
      <div id="terms-hero" className="relative bg-history-dark text-white py-12 px-4 text-center overflow-hidden">
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0">
            <EditableImage 
                imageId="terms-header-bg"
                initialSrc=""
                alt="Terms Banner"
                className="w-full h-full object-cover"
                disableEdit={true}
            />
        </div>
        {/* Dark Overlay Layer */}
        <div className="absolute inset-0 bg-black/60 z-0 pointer-events-none"></div>

        <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-bold font-serif text-history-gold">
                <EditableText id="terms-hero-title" defaultText="Điều Khoản & Chính Sách" />
            </h1>
            <p className="text-gray-300 mt-2 max-w-2xl mx-auto">
                <EditableText id="terms-hero-desc" defaultText="Quy định sử dụng cho phiên bản thử nghiệm của dự án Trạm Lịch Sử 4.0." />
            </p>
        </div>
      </div>

      <div id="terms-content" className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        {/* Section 1: Giới thiệu */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-2">
            <FileText className="text-history-red" size={24} />
            <h2 className="text-xl md:text-2xl font-bold font-serif text-history-dark"><EditableText id="terms-s1-title" defaultText="1. Giới thiệu chung" /></h2>
          </div>
          <div className="text-gray-700 space-y-3 leading-relaxed text-justify">
            <EditableText 
                id="terms-s1-content"
                multiline
                defaultText={`
                Chào mừng bạn đến với Trạm Lịch Sử 4.0. Đây là dự án giải pháp ứng dụng công nghệ và AI đang trong giai đoạn chạy thử nghiệm (Pilot Run), được xây dựng bởi nhóm The Black Swans.

                Hiện tại, dự án đang được vận hành trên các hạ tầng công nghệ miễn phí và giới hạn nhằm mục đích nghiên cứu, kiểm thử mô hình và chứng minh tính khả thi. Bằng việc truy cập website, bạn hiểu và đồng ý rằng dịch vụ này đang ở trạng thái Beta và có thể chưa hoàn thiện.
                `}
                tag="div"
            />
          </div>
        </div>

        {/* Section 2: Bản quyền */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-2">
            <Shield className="text-blue-600" size={24} />
            <h2 className="text-xl md:text-2xl font-bold font-serif text-history-dark"><EditableText id="terms-s2-title" defaultText="2. Bản quyền & Sở hữu trí tuệ" /></h2>
          </div>
          <div className="text-gray-700 space-y-3 leading-relaxed text-justify">
             <EditableText 
                id="terms-s2-content"
                multiline
                defaultText={`
                - Nội dung kiến thức: Các dữ liệu lịch sử, niên biểu và câu hỏi trắc nghiệm được biên soạn dựa trên Sách Giáo Khoa Lịch Sử (Bộ Giáo dục & Đào tạo Việt Nam) và các nguồn tài liệu chính thống. Chúng tôi không tuyên bố sở hữu bản quyền đối với các dữ kiện lịch sử gốc.
                
                - Mã nguồn & Giao diện: Thuộc quyền sở hữu của đội ngũ phát triển The Black Swans. Nghiêm cấm sao chép, kinh doanh mã nguồn trái phép.
                
                - Tư liệu hình ảnh/Video: Một số hình ảnh minh họa được sưu tầm từ nguồn Internet nhằm mục đích giáo dục phi lợi nhuận. Nếu có vấn đề về bản quyền tác giả, vui lòng liên hệ để chúng tôi gỡ bỏ hoặc ghi nguồn bổ sung.
                `}
                tag="div"
            />
          </div>
        </div>

        {/* Section 3: Quyền riêng tư */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-2">
            <Lock className="text-green-600" size={24} />
            <h2 className="text-xl md:text-2xl font-bold font-serif text-history-dark"><EditableText id="terms-s3-title" defaultText="3. Chính sách bảo mật (Privacy Policy)" /></h2>
          </div>
          <div className="text-gray-700 space-y-3 leading-relaxed text-justify">
            <EditableText 
                id="terms-s3-content"
                multiline
                defaultText={`
                Chúng tôi cam kết bảo vệ thông tin cá nhân của người dùng:

                - Dữ liệu thu thập: Khi bạn đăng nhập bằng Google, chúng tôi chỉ lưu trữ: Tên hiển thị (Display Name), Email, và Ảnh đại diện (Avatar) để định danh người dùng và lưu kết quả học tập. Chúng tôi KHÔNG lưu trữ mật khẩu của bạn.
                
                - Sử dụng thông tin: Thông tin chỉ được dùng để cá nhân hóa trải nghiệm (lưu điểm quiz, lịch sử chat AI). Chúng tôi cam kết không mua bán, trao đổi dữ liệu người dùng cho bên thứ ba.
                
                - Cookies: Website sử dụng cookies để duy trì trạng thái đăng nhập nhằm mang lại trải nghiệm tốt nhất.
                `}
                tag="div"
            />
          </div>
        </div>

        {/* Section 4: Miễn trừ trách nhiệm */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-2">
            <AlertCircle className="text-orange-600" size={24} />
            <h2 className="text-xl md:text-2xl font-bold font-serif text-history-dark"><EditableText id="terms-s4-title" defaultText="4. Miễn trừ trách nhiệm & Giới hạn hạ tầng" /></h2>
          </div>
          <div className="text-gray-700 space-y-3 leading-relaxed text-justify">
            <EditableText 
                id="terms-s4-content"
                multiline
                defaultText={`
                - Độ chính xác của AI: Tính năng "AI Tutor" và "Phân tích chuyên sâu" sử dụng mô hình ngôn ngữ lớn (Gemini). Mặc dù đã được cấu hình để bám sát SGK, AI vẫn có thể mắc lỗi ảo giác (hallucination) hoặc đưa ra thông tin chưa chính xác tuyệt đối. Học sinh cần đối chiếu với tài liệu chính thống khi ôn tập.
                
                - Hạ tầng giới hạn: Do đây là dự án thử nghiệm sử dụng các gói dịch vụ miễn phí (Firebase Spark Plan, Gemini API Free Tier), hệ thống có thể gặp tình trạng quá tải, phản hồi chậm hoặc tạm ngưng nếu vượt quá giới hạn lượt truy cập cho phép trong ngày. Chúng tôi mong nhận được sự thông cảm của người dùng.
                `}
                tag="div"
            />
          </div>
        </div>

        {/* Section 5: Liên hệ */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-2">
            <HelpCircle className="text-purple-600" size={24} />
            <h2 className="text-xl md:text-2xl font-bold font-serif text-history-dark"><EditableText id="terms-s5-title" defaultText="5. Thông tin liên hệ" /></h2>
          </div>
          <div className="text-gray-700 space-y-3 leading-relaxed">
            <p>
              Mọi ý kiến đóng góp, báo lỗi hoặc khiếu nại về bản quyền, xin vui lòng liên hệ với chúng tôi qua:
            </p>
            <ul className="list-none pl-0 space-y-1 font-medium">
              <li>📧 Email: <EditableText id="terms-contact-email" defaultText="tnt.fortress.ai.team@gmail.com" /></li>
              <li>🏫 Địa chỉ: <EditableText id="terms-contact-addr" defaultText="Trường THPT Nguyễn Công Trứ, TP.HCM" /></li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TermsPage;
