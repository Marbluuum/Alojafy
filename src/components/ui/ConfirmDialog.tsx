import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  message?: string;
  confirmLabel?: string;
  danger?: boolean;
  isDanger?: boolean;
}

export default function ConfirmDialog({
  open, isOpen, onClose, onConfirm, title,
  description, message,
  confirmLabel = 'Confirmar',
  danger = false, isDanger = false,
}: ConfirmDialogProps) {
  const visible = open ?? isOpen ?? false;
  const text = description ?? message ?? '';
  const isRed = danger || isDanger;

  if (!visible) return null;

  return (
    <div className="modal-overlay">
      <div className="bg-white rounded-xl shadow-card-lg w-full max-w-md p-6">
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-full flex-shrink-0 ${isRed ? 'bg-red-100' : 'bg-amber-100'}`}>
            <AlertTriangle className={`w-5 h-5 ${isRed ? 'text-red-600' : 'text-amber-600'}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-surface-900 mb-1">{title}</h3>
            <p className="text-sm text-surface-500">{text}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-6 justify-end">
          <button onClick={onClose} className="btn-secondary btn-sm">Cancelar</button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={isRed ? 'btn-danger btn-sm' : 'btn-primary btn-sm'}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
