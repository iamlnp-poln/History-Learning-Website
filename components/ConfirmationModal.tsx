import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  confirmLabel = "Xóa ngay",
  cancelLabel = "Hủy bỏ"
}) => {
  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[50000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-pop-in border-t-4 border-red-500"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
            <p className="text-gray-600 mb-6">{message}</p>
            
            <div className="flex gap-3">
                <button 
                    onClick={onClose}
                    className="flex-1 py-2.5 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                    {cancelLabel}
                </button>
                <button 
                    onClick={() => { onConfirm(); onClose(); }}
                    className="flex-1 py-2.5 px-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-md"
                >
                    {confirmLabel}
                </button>
            </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmationModal;