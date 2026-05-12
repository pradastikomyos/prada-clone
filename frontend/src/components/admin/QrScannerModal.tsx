/**
 * QrScannerModal — full-screen modal that activates the device camera and
 * decodes QR codes using html5-qrcode.
 *
 * Props:
 *   isOpen   — controls visibility; scanner starts when true, stops when false
 *   onScan   — called once with the decoded string (debounced, stops scanner)
 *   onClose  — called when the user dismisses the modal
 */

import { useEffect, useCallback } from 'react';
import { Cancel01Icon, Camera02Icon } from '@hugeicons/core-free-icons';
import { AdminIcon } from './AdminIcon';
import { useQrScanner } from '../../hooks/useQrScanner';

const SCANNER_ELEMENT_ID = 'qr-scanner-region';

type QrScannerModalProps = {
  isOpen: boolean;
  onScan: (code: string) => void;
  onClose: () => void;
};

export function QrScannerModal({ isOpen, onScan, onClose }: QrScannerModalProps) {
  const handleScan = useCallback(
    (decodedText: string) => {
      stopScanner().then(() => {
        onScan(decodedText.trim().toUpperCase());
        onClose();
      });
    },
    // stopScanner is stable — defined below; onScan/onClose from parent
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onScan, onClose],
  );

  const { startScanner, stopScanner, isScanning, error } = useQrScanner({
    elementId: SCANNER_ELEMENT_ID,
    onScan: handleScan,
    debounceMs: 1500,
  });

  // Start scanner when modal opens; stop when it closes.
  useEffect(() => {
    if (isOpen) {
      // Small delay so the DOM element is mounted before html5-qrcode tries
      // to attach to it.
      const timer = setTimeout(() => {
        startScanner();
      }, 120);
      return () => clearTimeout(timer);
    } else {
      stopScanner();
    }
  }, [isOpen, startScanner, stopScanner]);

  const handleClose = useCallback(() => {
    stopScanner().then(() => onClose());
  }, [stopScanner, onClose]);

  if (!isOpen) return null;

  return (
    <div className="qr-modal-backdrop" role="dialog" aria-modal="true" aria-label="QR Code Scanner">
      <div className="qr-modal-panel">
        {/* Header */}
        <div className="qr-modal-header">
          <div className="qr-modal-header-left">
            <AdminIcon icon={Camera02Icon} size={20} />
            <span>Pindai Kode QR</span>
          </div>
          <button
            type="button"
            className="qr-modal-close"
            onClick={handleClose}
            aria-label="Tutup pemindai"
          >
            <AdminIcon icon={Cancel01Icon} size={20} />
          </button>
        </div>

        {/* Scanner viewport */}
        <div className="qr-modal-body">
          {error ? (
            <div className="qr-modal-error">
              <p className="admin-error">{error}</p>
              <p className="admin-muted" style={{ marginTop: 8, fontSize: 12 }}>
                Pastikan izin kamera sudah diberikan di browser Anda.
              </p>
              <button type="button" onClick={() => startScanner()} style={{ marginTop: 16 }}>
                Coba Lagi
              </button>
            </div>
          ) : (
            <>
              {/* html5-qrcode mounts its video element here */}
              <div id={SCANNER_ELEMENT_ID} className="qr-scanner-region" />
              {!isScanning && (
                <div className="qr-scanner-loading">
                  <span>Memulai kamera…</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer hint */}
        <div className="qr-modal-footer">
          <p className="admin-muted">Arahkan kamera ke kode QR pickup pelanggan</p>
        </div>
      </div>
    </div>
  );
}
