import { AlertTriangle, X } from 'lucide-react';

/**
 * ConfirmDialog Component
 * Reusable confirmation dialog to replace browser confirm()
 * Fixed: HIGH-F5 - Browser confirm() Dialogs
 * Fixed: MEDIUM-F4 - Confirmation Dialogs Using Browser APIs
 */

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  const confirmButtonClass =
    variant === 'danger'
      ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
      : 'bg-primary text-primary-foreground hover:bg-primary/90';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      <div className="bg-card border border-border rounded-lg shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            {variant === 'danger' && (
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
            )}
            <h2
              id="confirm-dialog-title"
              className="text-xl font-semibold text-foreground"
            >
              {title}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="flex-shrink-0 p-1 rounded-md hover:bg-accent transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p id="confirm-dialog-message" className="text-muted-foreground leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-muted/30">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg font-medium border border-border bg-background hover:bg-accent transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for managing confirm dialog state
 * @example
 * const { isOpen, open, close, confirm } = useConfirmDialog();
 *
 * <button onClick={() => open()}>Delete</button>
 * <ConfirmDialog
 *   isOpen={isOpen}
 *   title="Delete Item"
 *   message="Are you sure?"
 *   onConfirm={confirm}
 *   onCancel={close}
 * />
 */
export function useConfirmDialog() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [resolver, setResolver] = React.useState<((value: boolean) => void) | null>(null);

  const open = (): Promise<boolean> => {
    setIsOpen(true);
    return new Promise((resolve) => {
      setResolver(() => resolve);
    });
  };

  const close = () => {
    setIsOpen(false);
    if (resolver) {
      resolver(false);
      setResolver(null);
    }
  };

  const confirm = () => {
    setIsOpen(false);
    if (resolver) {
      resolver(true);
      setResolver(null);
    }
  };

  return { isOpen, open, close, confirm };
}

// Need to import React for the hook
import React from 'react';
