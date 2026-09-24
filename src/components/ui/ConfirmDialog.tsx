import { AlertTriangle } from 'lucide-react';
import { Modal, Button } from './';
import { useState } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  requireText?: string;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  requireText,
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);
  const [typed, setTyped] = useState('');

  async function handleConfirm() {
    if (requireText && typed.trim() !== requireText) return;
    try {
      setLoading(true);
      await onConfirm();
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setTyped('');
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="" size="sm" showClose={false}>
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
            variant === 'danger' ? 'bg-rose-100' : 'bg-indigo-100'
          }`}>
            <AlertTriangle className={`w-6 h-6 ${
              variant === 'danger' ? 'text-rose-600' : 'text-indigo-600'
            }`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {description && (
              <p className="text-sm text-slate-600 mt-1">{description}</p>
            )}
          </div>
        </div>

        {requireText && (
          <div>
            <p className="text-xs text-slate-500 mb-1.5">
              Type <span className="font-mono font-semibold text-slate-700">{requireText}</span> to confirm
            </p>
            <input
              type="text"
              value={typed}
              onChange={e => setTyped(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-500"
              autoFocus
            />
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            className="flex-1"
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={handleConfirm}
            className="flex-1"
            loading={loading}
            disabled={Boolean(requireText && typed.trim() !== requireText)}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
