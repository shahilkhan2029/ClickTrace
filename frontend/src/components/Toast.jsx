import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export default function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getStyle = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-900/95 text-white border-emerald-700',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        };
      case 'error':
        return {
          bg: 'bg-rose-900/95 text-white border-rose-700',
          icon: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
        };
      case 'warning':
        return {
          bg: 'bg-amber-900/95 text-white border-amber-700',
          icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        };
      default:
        return {
          bg: 'bg-slate-900/95 text-white border-slate-700',
          icon: <Info className="w-4 h-4 text-blue-400 shrink-0" />
        };
    }
  };

  const style = getStyle();

  return (
    <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-3 duration-200 max-w-sm">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur text-xs font-semibold ${style.bg}`}>
        {style.icon}
        <span className="flex-1 leading-snug">{message}</span>
        <button 
          onClick={onClose} 
          className="text-slate-400 hover:text-white p-0.5 rounded transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

