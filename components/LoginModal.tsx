
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldCheck, LogIn, Mail, Lock, UserPlus, User, ArrowLeft, KeyRound, Eye, EyeOff } from 'lucide-react';
import * as firebaseAuth from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useToast } from '../contexts/ToastContext';

interface LoginModalProps {
  onClose: () => void;
  onConfirmLogin: () => void;
}

const { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail, sendEmailVerification, signOut } = firebaseAuth as any;

// --- CẤU HÌNH RECAPTCHA ---
const RECAPTCHA_SITE_KEY = '6LefeyksAAAAAJztW9q_npmOOAoXUYP7jF_c3iW8'; 

const LoginModal: React.FC<LoginModalProps> = ({ onClose, onConfirmLogin }) => {
  const { showToast } = useToast();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const captchaRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<number | null>(null);

  // Form State
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Lock scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
        document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    setIsCaptchaVerified(false);
    if (mode === 'forgot') return;

    const w = window as any;
    
    const renderOrResetCaptcha = () => {
       if (w.grecaptcha && captchaRef.current) {
           if (widgetId.current !== null) {
               try { w.grecaptcha.reset(widgetId.current); } catch(e) { widgetId.current = null; }
           }
           if (widgetId.current === null && captchaRef.current.innerHTML === '') {
               try {
                   widgetId.current = w.grecaptcha.render(captchaRef.current, {
                       'sitekey': RECAPTCHA_SITE_KEY,
                       'callback': () => setIsCaptchaVerified(true),
                       'expired-callback': () => setIsCaptchaVerified(false),
                       'theme': 'light'
                   });
               } catch (e) { console.error("Lỗi khởi tạo reCAPTCHA:", e); }
           }
       }
    };

    if (w.grecaptcha && w.grecaptcha.render) {
      renderOrResetCaptcha();
    } else {
      const interval = setInterval(() => {
        if (w.grecaptcha && w.grecaptcha.render) {
          renderOrResetCaptcha();
          clearInterval(interval);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [mode]);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!auth) {
        setError("Lỗi: Không thể kết nối đến dịch vụ xác thực Firebase.");
        return;
    }

    // Special handling for forgot password
    if (mode === 'forgot') {
        if (!email) {
            setError("Vui lòng nhập email để đặt lại mật khẩu.");
            return;
        }
        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            setSuccessMsg(`Đã gửi email đặt lại mật khẩu đến ${email}.`);
            showToast("Vui lòng kiểm tra hộp thư (cả mục Spam) để đặt lại mật khẩu.", "info");
            setTimeout(() => setMode('login'), 3000);
        } catch (err: any) {
            if (err.code === 'auth/user-not-found') setError("Email này chưa được đăng ký.");
            else if (err.code === 'auth/invalid-email') setError("Định dạng email không hợp lệ.");
            else setError("Lỗi: " + err.message);
        } finally {
            setLoading(false);
        }
        return;
    }

    // --- RECAPTCHA CHECK WITH BYPASS FOR TEST USER ---
    const isTestUser = email === 'poln@ttvc.nct.edu';
    
    if (!isCaptchaVerified && !isTestUser) {
        setError("Vui lòng tích vào ô 'I'm not a robot' để xác thực.");
        return;
    }

    setLoading(true);

    try {
        if (mode === 'login') {
            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // --- CHECK EMAIL VERIFIED ---
                // Skip verification check for test user if needed, or keep it strict
                if (!user.emailVerified && !isTestUser) {
                    await signOut(auth); // Đăng xuất ngay lập tức
                    setError("Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email.");
                    setLoading(false);
                    return;
                }
                
                showToast("Đăng nhập thành công!", "success");
                onClose();
            } catch (err: any) {
                if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                    setError("Email hoặc mật khẩu không chính xác.");
                } else {
                    setError("Lỗi đăng nhập: " + err.message);
                }
            }
        } else if (mode === 'register') {
            if (password.length < 6) {
                setError("Mật khẩu phải có ít nhất 6 ký tự.");
                setLoading(false);
                return;
            }
            if (password !== confirmPassword) {
                setError("Mật khẩu nhập lại không khớp.");
                setLoading(false);
                return;
            }

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                if (userCredential.user) {
                    await updateProfile(userCredential.user, {
                        displayName: displayName || "Thành viên mới"
                    });
                    await sendEmailVerification(userCredential.user);
                    await signOut(auth);

                    showToast("Đăng ký thành công! Đã gửi email xác thực.", "success");
                    setMode('login'); // Chuyển về màn hình đăng nhập
                    setSuccessMsg("Vui lòng kiểm tra email và xác thực tài khoản.");
                    setPassword('');
                    setConfirmPassword('');
                }
            } catch (err: any) {
                if (err.code === 'auth/email-already-in-use') setError("Email này đã được sử dụng.");
                else setError("Lỗi đăng ký: " + err.message);
            }
        }
    } finally {
        setLoading(false);
    }
  };

  const getTitle = () => {
      switch(mode) {
          case 'login': return 'Đăng nhập';
          case 'register': return 'Đăng ký tài khoản';
          case 'forgot': return 'Quên mật khẩu';
          default: return 'Xác thực';
      }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-pop-in max-h-[90vh] overflow-y-auto relative">
        <div className="bg-history-red text-white p-4 flex justify-between items-center sticky top-0 z-20">
          <div className="flex items-center gap-2">
            {mode === 'forgot' ? <KeyRound size={24} className="text-history-gold" /> : <ShieldCheck size={24} className="text-history-gold" />}
            <h3 className="font-bold text-lg font-serif">{getTitle()}</h3>
          </div>
          <button onClick={onClose} className="hover:bg-red-800 p-1 rounded-lg transition-colors active:scale-95">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 bg-white">
          {mode !== 'forgot' && (
            <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                <button type="button" onClick={() => { setMode('login'); setError(''); }} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'login' ? 'bg-white text-history-dark shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Đăng nhập</button>
                <button type="button" onClick={() => { setMode('register'); setError(''); }} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'register' ? 'bg-white text-history-dark shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Đăng ký</button>
            </div>
          )}

          {mode === 'forgot' && (
              <p className="text-sm text-gray-600 mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                  Nhập email đăng ký tài khoản của bạn. Chúng tôi sẽ gửi liên kết để đặt lại mật khẩu mới.
              </p>
          )}

          <form onSubmit={handleAuthAction} className="space-y-4 mb-4">
             {mode === 'register' && (
                 <div className="animate-slide-up">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên hiển thị</label>
                    <div className="relative">
                        <User size={18} className="absolute left-3 top-2.5 text-gray-400" />
                        <input type="text" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-history-gold focus:border-transparent outline-none transition-all" placeholder="Nguyễn Văn A" />
                    </div>
                 </div>
             )}

             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                    <Mail size={18} className="absolute left-3 top-2.5 text-gray-400" />
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-history-gold focus:border-transparent outline-none transition-all" placeholder="name@example.com" />
                </div>
             </div>

             {mode !== 'forgot' && (
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                    <div className="relative">
                        <Lock size={18} className="absolute left-3 top-2.5 text-gray-400" />
                        <input 
                            type={showPassword ? "text" : "password"} 
                            required 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-history-gold focus:border-transparent outline-none transition-all" 
                            placeholder="••••••••" 
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                 </div>
             )}

             {mode === 'register' && (
                 <div className="animate-slide-up">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nhập lại mật khẩu</label>
                    <div className="relative">
                        <Lock size={18} className="absolute left-3 top-2.5 text-gray-400" />
                        <input 
                            type={showConfirmPassword ? "text" : "password"} 
                            required 
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)} 
                            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-history-gold focus:border-transparent outline-none transition-all" 
                            placeholder="••••••••" 
                        />
                        <button 
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                 </div>
             )}

             {mode === 'login' && (
                 <div className="flex justify-end">
                     <button type="button" onClick={() => setMode('forgot')} className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">Quên mật khẩu?</button>
                 </div>
             )}

             {mode !== 'forgot' && (
                <div className="flex justify-center py-2">
                    <div ref={captchaRef}></div>
                </div>
             )}
             
             {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg border border-red-100">{error}</p>}
             {successMsg && <p className="text-green-600 text-sm text-center bg-green-50 p-2 rounded-lg border border-green-100">{successMsg}</p>}

             <button type="submit" disabled={loading} className={`w-full py-2.5 rounded-xl font-bold text-white transition-all shadow-md active:scale-95 flex justify-center items-center gap-2 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-history-dark hover:bg-black'}`}>
                {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                {mode === 'login' ? 'Đăng nhập' : (mode === 'register' ? 'Đăng ký & Xác thực' : 'Gửi liên kết')}
             </button>

             {mode === 'forgot' && (
                 <button type="button" onClick={() => setMode('login')} className="w-full py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-all flex justify-center items-center gap-2">
                     <ArrowLeft size={16} /> Quay lại đăng nhập
                 </button>
             )}
          </form>

          {mode !== 'forgot' && (
            <>
                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                    <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Hoặc tiếp tục với</span></div>
                </div>
                <button onClick={onConfirmLogin} disabled={!isCaptchaVerified} className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all shadow-md active:scale-95 border ${isCaptchaVerified ? 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100' : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'}`}>
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                    <span>Google</span>
                </button>
                {!isCaptchaVerified && <p className="text-[10px] text-center text-gray-400 mt-2">* Hoàn thành CAPTCHA để dùng Google Login</p>}
            </>
          )}
        </div>
        <div className="bg-gray-50 p-3 text-center text-xs text-gray-500">Hệ thống bảo mật bởi reCAPTCHA</div>
      </div>
    </div>,
    document.body
  );
};

export default LoginModal;
