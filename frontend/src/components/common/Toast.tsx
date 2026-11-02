import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import type { ToastType } from '../../context/ToastContext';

interface ToastProps {
  type: ToastType;
  message: string;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ type, message, onClose }) => {
  let bg = 'bg-blue-600 text-white';
  let icon = <Info className="w-5 h-5 flex-shrink-0" />;

  if (type === 'success') {
    bg = 'bg-emerald-600 text-white';
    icon = <CheckCircle2 className="w-5 h-5 flex-shrink-0" />;
  } else if (type === 'error') {
    bg = 'bg-rose-600 text-white';
    icon = <AlertCircle className="w-5 h-5 flex-shrink-0" />;
  } else if (type === 'warning') {
    bg = 'bg-amber-600 text-white';
    icon = <AlertTriangle className="w-5 h-5 flex-shrink-0" />;
  }

  return (
    <div className={`flex items-center justify-between p-4 rounded-xl shadow-lg ${bg}`}>
      <div className="flex items-center gap-3">
        {icon}
        <p className="text-sm font-medium">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-3 p-1 rounded hover:bg-black/10 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
