
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Home, Lock } from 'lucide-react';

const AccessDenied: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 animate-fade-in">
      <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6 text-red-600 shadow-inner">
        <ShieldAlert size={48} />
      </div>
      
      <h1 className="text-3xl font-bold text-history-dark mb-4 font-serif">Khu vực hạn chế</h1>
      
      <p className="text-gray-600 max-w-md mb-8 leading-relaxed">
        Trang này hiện chỉ dành cho <strong>Ban quản trị (Admin)</strong> và <strong>Cố vấn chuyên môn</strong>. 
        Nếu bạn là thành viên dự án, vui lòng đăng nhập bằng tài khoản được cấp quyền.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-6 py-3 bg-history-dark text-history-gold rounded-xl font-bold hover:bg-black transition-all shadow-md"
        >
          <Home size={20} /> Về Trang Chủ
        </button>
        <button 
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 border-2 border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-all"
        >
          <Lock size={20} /> Kiểm tra quyền hạn
        </button>
      </div>
    </div>
  );
};

export default AccessDenied;
