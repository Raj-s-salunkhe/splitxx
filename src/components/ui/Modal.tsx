import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showClose?: boolean;
}

export function Modal({ isOpen, onClose, title, description, children, size = 'md', showClose = true }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in"
    >
      <div
        className={cn(
          'w-full bg-white rounded-2xl shadow-2xl shadow-slate-900/15 animate-in zoom-in-95',
          sizes[size]
        )}
        style={{ maxHeight: 'calc(100vh - 2rem)' }}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
          </div>
          {showClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="p-5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 10rem)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
