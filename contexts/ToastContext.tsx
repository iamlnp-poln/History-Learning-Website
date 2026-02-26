
import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  closing?: boolean; // New state for exit animation
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Function to initiate removal (animation first, then delete)
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.map(t => t.id === id ? { ...t, closing: true } : t));
    
    // Wait for animation to finish before removing from DOM
    setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 400);
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type, closing: false }]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Container - Fixed Top Right */}
      <div className="fixed top-20 right-4 z-[100000] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto flex items-start gap-3 p-4 rounded-xl min-w-[300px] max-w-sm 
              shadow-xl shadow-black/20
              transition-all duration-300 ease-in-out transform
              ${toast.closing ? 'opacity-0 translate-x-full' : 'animate-slide-in-right opacity-100 translate-x-0'}
              ${toast.type === 'success' ? 'bg-green-600 text-white' : ''}
              ${toast.type === 'error' ? 'bg-red-600 text-white' : ''}
              ${toast.type === 'info' ? 'bg-blue-600 text-white' : ''}
            `}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle size={20} className="text-white" />}
              {toast.type === 'error' && <AlertCircle size={20} className="text-white" />}
              {toast.type === 'info' && <Info size={20} className="text-white" />}
            </div>
            <div className="flex-1 text-sm font-bold leading-relaxed">
              {toast.message}
            </div>
            <button 
              onClick={() => removeToast(toast.id)} 
              className="shrink-0 text-white/70 hover:text-white transition-colors p-0.5 rounded-md hover:bg-white/20"
            >
              <X size={18} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
