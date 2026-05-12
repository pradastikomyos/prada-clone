/**
 * useQrScanner — encapsulates Html5Qrcode instance lifecycle.
 *
 * Returns helpers to start/stop the scanner and reactive state.
 * The caller is responsible for providing a mounted DOM element with
 * the given `elementId` before calling `startScanner`.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export type UseQrScannerOptions = {
  elementId: string;
  onScan: (decodedText: string) => void;
  /** Debounce window in ms — duplicate scans within this window are ignored. Default 1500. */
  debounceMs?: number;
};

export type UseQrScannerReturn = {
  startScanner: () => Promise<void>;
  stopScanner: () => Promise<void>;
  isScanning: boolean;
  error: string | null;
};

/** Prefer rear/back camera; fall back to environment facingMode. */
async function pickBackCameraId(): Promise<string | { facingMode: string }> {
  try {
    const devices = await Html5Qrcode.getCameras();
    if (!devices || devices.length === 0) {
      return { facingMode: 'environment' };
    }
    const back = devices.find((d) => {
      const label = (d.label || '').toLowerCase();
      return (
        label.includes('back') ||
        label.includes('rear') ||
        label.includes('environment')
      );
    });
    return back?.id ?? devices[devices.length - 1].id;
  } catch {
    return { facingMode: 'environment' };
  }
}

export function useQrScanner({
  elementId,
  onScan,
  debounceMs = 1500,
}: UseQrScannerOptions): UseQrScannerReturn {
  const qrRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastScanRef = useRef<{ text: string; ts: number } | null>(null);

  const stopScanner = useCallback(async () => {
    if (qrRef.current) {
      try {
        if (qrRef.current.isScanning) {
          await qrRef.current.stop();
        }
        qrRef.current.clear();
      } catch {
        // Ignore stop errors — element may already be unmounted.
      }
      qrRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    setError(null);

    // Clean up any previous instance first.
    await stopScanner();

    const instance = new Html5Qrcode(elementId, { verbose: false });
    qrRef.current = instance;

    const cameraId = await pickBackCameraId();

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
    };

    const handleSuccess = (decodedText: string) => {
      const now = Date.now();
      const last = lastScanRef.current;
      if (last && last.text === decodedText && now - last.ts < debounceMs) {
        return; // Duplicate within debounce window — ignore.
      }
      lastScanRef.current = { text: decodedText, ts: now };
      onScan(decodedText);
    };

    // Failure callback is intentionally a no-op — html5-qrcode fires it on
    // every frame that doesn't contain a QR code, which is expected behaviour.
    const handleFailure = () => undefined;

    try {
      await instance.start(cameraId, config, handleSuccess, handleFailure);
      setIsScanning(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Kamera tidak dapat diakses.';
      setError(message);
      qrRef.current = null;
      setIsScanning(false);
    }
  }, [elementId, onScan, debounceMs, stopScanner]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { startScanner, stopScanner, isScanning, error };
}
