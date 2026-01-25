import React from 'react';
import { X, Info, CheckCircle, AlertCircle } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md animate-slide-up w-80 
            ${toast.type === 'info' ? 'bg-blue-50/90 border-blue-200 text-blue-900' : ''}
            ${toast.type === 'success' ? 'bg-green-50/90 border-green-200 text-green-900' : ''}
            ${toast.type === 'error' ? 'bg-red-50/90 border-red-200 text-red-900' : ''}
          `}
        >
          {toast.type === 'info' && <Info size={20} className="mt-0.5" />}
          {toast.type === 'success' && <CheckCircle size={20} className="mt-0.5" />}
          {toast.type === 'error' && <AlertCircle size={20} className="mt-0.5" />}
          
          <div className="flex-1">
            <h4 className="font-semibold text-sm">{toast.title}</h4>
            <p className="text-xs opacity-90 mt-1">{toast.message}</p>
          </div>
          
          <button onClick={() => onRemove(toast.id)} className="opacity-60 hover:opacity-100">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};