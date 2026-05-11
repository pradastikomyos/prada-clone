import { useEffect, useRef } from 'react';

type LogoutConfirmDialogProps = {
  isOpen: boolean;
  displayName: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Minimal confirmation dialog for sign-out.
 * Matches the Prada/Spark Stage aesthetic: white, thin borders, uppercase labels.
 * Traps focus and closes on Escape.
 */
export function LogoutConfirmDialog({
  isOpen,
  displayName,
  onConfirm,
  onCancel,
}: LogoutConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus the cancel button when the dialog opens.
  useEffect(() => {
    if (isOpen) cancelRef.current?.focus();
  }, [isOpen]);

  // Close on Escape.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onCancel]);

  // Lock body scroll while open.
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="logout-dialog-overlay" onClick={onCancel} aria-hidden="true">
      <div
        className="logout-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="logout-dialog-eyebrow">SPARK STAGE</p>
        <h2 className="logout-dialog-title" id="logout-dialog-title">
          Sign out?
        </h2>
        {displayName ? (
          <p className="logout-dialog-body">
            You are signed in as <strong>{displayName}</strong>. Do you want to sign out?
          </p>
        ) : (
          <p className="logout-dialog-body">Do you want to sign out of your account?</p>
        )}
        <div className="logout-dialog-actions">
          <button
            type="button"
            className="logout-dialog-btn logout-dialog-btn--cancel"
            ref={cancelRef}
            onClick={onCancel}
          >
            CANCEL
          </button>
          <button
            type="button"
            className="logout-dialog-btn logout-dialog-btn--confirm"
            onClick={onConfirm}
          >
            SIGN OUT
          </button>
        </div>
      </div>
    </div>
  );
}
