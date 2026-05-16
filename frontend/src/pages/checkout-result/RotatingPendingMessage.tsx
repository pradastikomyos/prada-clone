import { useEffect, useState } from 'react';

export const PENDING_MESSAGES = [
  'Pembayaran sedang diverifikasi',
  'Mohon bersabar ya',
  'Mengecek status pembayaran',
  'Hampir selesai',
];

export function RotatingPendingMessage({ pollCount }: { pollCount: number }) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % PENDING_MESSAGES.length);
    }, 3000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    setMessageIndex(0);
  }, [pollCount]);

  return (
    <span className="checkout-result-rotating-msg" key={messageIndex}>
      {PENDING_MESSAGES[messageIndex]}
      <span className="checkout-result-dots" aria-hidden="true">
        <span>.</span><span>.</span><span>.</span>
      </span>
    </span>
  );
}
