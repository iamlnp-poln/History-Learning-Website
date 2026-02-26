
import React from 'react';
import { Facebook, Youtube, MapPin, Phone, Mail, Shield, Info, MessageCircle, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import EditableText from './EditableText';

const Footer: React.FC = () => {
  const handleTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-history-dark text-gray-300 border-t-4 border-history-red font-sans pt-12 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          
          <div className="space-y-4">
             <div className="flex items-center gap-2 mb-2">
                <BookOpen className="text-history-gold" />
                <span className="font-serif font-bold text-xl tracking-wide text-white">Lịch Sử All-In-One</span>
              </div>
              <div className="text-sm opacity-80 leading-relaxed">
                <EditableText 
                    id="footer-intro"
                    multiline
                    defaultText="Dự án ý tưởng khởi nghiệp EdTech đang chạy thử nghiệm trên hạ tầng giới hạn. Kết nối dữ liệu lịch sử và AI để kiến tạo trải nghiệm học tập mới."
                    tag="p"
                />
              </div>
              <Link 
                to="/about" 
                onClick={handleTop}
                className="inline-block text-history-gold text-sm font-bold hover:underline"
              >
                Về Start-up của chúng tôi &rarr;
              </Link>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-serif font-bold text-history-gold mb-4 uppercase tracking-wider">
              Văn Phòng
            </h3>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-history-red mt-1 shrink-0" />
              <div>
                <p className="font-bold text-white"><EditableText id="footer-school" defaultText="Trường THPT Nguyễn Công Trứ" /></p>
                <p className="text-sm opacity-80"><EditableText id="footer-address" defaultText="97 Quang Trung, Phường Thông Tây Hội, TP. Hồ Chí Minh" /></p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-history-red shrink-0" />
              <p className="text-sm"><EditableText id="footer-phone" defaultText="0383 338 262" /></p>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-history-red shrink-0" />
              <a href="mailto:tnt.fortress.ai.team@gmail.com" className="text-sm hover:text-history-gold transition-colors">
                <EditableText id="footer-email" defaultText="tnt.fortress.ai.team@gmail.com" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-serif font-bold text-history-gold mb-4 uppercase tracking-wider">
              Mạng Xã Hội
            </h3>
            <div className="flex gap-4 mb-6">
              <a 
                href="https://web.facebook.com/share/17gEfkaU4k" 
                target="_blank" 
                rel="noreferrer"
                className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-transform transform hover:-translate-y-1"
                title="Facebook Fanpage"
              >
                <Facebook size={20} />
              </a>
              <a 
                href="https://youtube.com/@newoldies-tnf" 
                target="_blank" 
                rel="noreferrer"
                className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-transform transform hover:-translate-y-1"
                title="Youtube Channel"
              >
                <Youtube size={20} />
              </a>
            </div>

            <h4 className="text-sm font-bold text-white mb-2 uppercase">Hỗ Trợ</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li>
                <Link 
                  to="/about" 
                  onClick={handleTop}
                  className="hover:text-history-gold flex items-center gap-2 transition-colors"
                >
                  <Info size={14} /> Về chúng tôi
                </Link>
              </li>
              <li>
                <Link 
                  to="/" 
                  onClick={handleTop}
                  className="hover:text-history-gold flex items-center gap-2 transition-colors"
                >
                   <MessageCircle size={14} /> Liên hệ hợp tác
                </Link>
              </li>
              <li>
                <Link 
                  to="/terms" 
                  onClick={handleTop}
                  className="hover:text-history-gold flex items-center gap-2 transition-colors"
                >
                   <Shield size={14} /> Điều khoản sử dụng
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 mt-6 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} Lịch Sử All-In-One. All rights reserved.</p>
          <div className="flex items-center gap-4 mt-2 md:mt-0">
            <span>Dự án Ý tưởng Khởi nghiệp (Pilot)</span>
            <span className="hidden md:inline">|</span>
            <span>Developed by Tường Thành Vững Chắc Team</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
