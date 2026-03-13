import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
}

export default function ConfirmDialog({
  open, onClose, onConfirm, title, description, confirmLabel = 'Confirmar', danger = false
}: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="modal-overlay">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-full ${danger ? 'bg-red-100' : 'bg-accent-100'}`}>
            <AlertTriangle className={`w-5 h-5 ${danger ? 'text-red-600' : 'text-accent-600'}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-dark-800 mb-1">{title}</h3>
            <p className="text-sm text-dark-500">{description}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-6 justify-end">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={() => { onConfirm(); onClose(); }} className={danger ? 'btn-danger' : 'btn-primary'}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
