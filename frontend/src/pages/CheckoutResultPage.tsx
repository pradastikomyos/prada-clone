import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import { BrandLogo } from '../components/ui/BrandLogo';
import { isSupabaseConfigured } from '../lib/supabase';
import { getCheckoutResult, reconcileDokuPayment } from '../services/commerce';
import { normalizeQrPayload } from '../utils/orderHelpers';
import type { CheckoutResultOrder } from '../services/commerce';

const IDR = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const POLL_DELAYS = [0, 4_000, 8_000, 15_000, 30_000, 60_000] as const;
/** Max polls before giving up and showing "check later" message */
const MAX_POLLS = 15;
/** After this many polls, auto-trigger DOKU reconcile in background */
const AUTO_RECONCILE_AFTER_POLLS = 3;

function QRCodeCanvas({ payload }: { payload: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, payload, {
      width: 180,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    });
  }, [payload]);

  return <canvas ref={canvasRef} aria-label="Pickup QR code" />;
}

/**
 * Animated checkmark for success state.
 * Circle draws itself first, then the checkmark strokes in — pure CSS, no library.
 */
function AnimatedCheckmark() {
  return (
    <div className="checkout-result-icon checkout-result-icon--success" aria-hidden="true">
      <svg
        className="checkout-checkmark-svg"
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer circle — draws in */}
        <circle
          className="checkout-checkmark-circle"
          cx="40"
          cy="40"
          r="36"
          stroke="#22c55e"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        {/* Checkmark path — draws in after circle */}
        <path
          className="checkout-checkmark-path"
          d="M22 41L34 53L58 28"
          stroke="#22c55e"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

function StatusIcon({ status }: { status: CheckoutResultOrder['status'] }) {
  if (status === 'pending_pickup' || status === 'picked_up') {
    return <AnimatedCheckmark />;
  }
  if (status === 'cancelled' || status === 'expired') {
    return (
      <div className="checkout-result-icon checkout-result-icon--error" aria-hidden="true">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="36" stroke="#ef4444" strokeWidth="3" fill="none" />
          <path d="M26 26L54 54M54 26L26 54" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      </div>
    );
  }
  return (
    <div className="checkout-result-icon checkout-result-icon--pending" aria-hidden="true">
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
        <circle cx="40" cy="40" r="36" stroke="#d1d5db" strokeWidth="3" fill="none" strokeDasharray="8 5" />
        <path d="M40 24v16l8 5" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/**
 * Rotating message while waiting for payment confirmation.
 * Cycles through reassuring messages every ~3 seconds so the user
 * feels progress even though we're just waiting for DOKU webhook.
 */
const PENDING_MESSAGES = [
  'Pembayaran sedang diverifikasi',
  'Mohon bersabar ya',
  'Mengecek status pembayaran',
  'Hampir selesai',
];

function RotatingPendingMessage({ pollCount }: { pollCount: number }) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % PENDING_MESSAGES.length);
    }, 3000);
    return () => window.clearInterval(interval);
  }, []);

  // Reset to first message when poll count changes (fresh cycle)
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

export function CheckoutResultPage() {
  const [searchParams] = useSearchParams();
  const invoice = useMemo(() => searchParams.get('invoice'), [searchParams]);
  const [pollCount, setPollCount] = useState(0);
  const queryClient = useQueryClient();
  const previousStatusRef = useRef<CheckoutResultOrder['status'] | null>(null);
  const confettiTriggeredRef = useRef(false);

  useEffect(() => {
    document.title = 'Order Confirmation | Spark Stage';
  }, []);

  const orderQuery = useQuery({
    queryKey: ['checkout-result', invoice],
    queryFn: () => getCheckoutResult(invoice!),
    enabled: isSupabaseConfigured && Boolean(invoice),
    refetchInterval: false,
    staleTime: 0,
  });

  useEffect(() => {
    const nextStatus = orderQuery.data?.order?.status ?? null;
    const previousStatus = previousStatusRef.current;

    if (!confettiTriggeredRef.current && previousStatus === 'pending_payment' && nextStatus === 'pending_pickup') {
      confettiTriggeredRef.current = true;
      const duration = 2600;
      const end = Date.now() + duration;
      const defaults = { startVelocity: 40, spread: 360, ticks: 100, zIndex: 9999, scalar: 1.1 };
      const colors = ['#FFD700', '#C0C0C0', '#FCEABB', '#EFEFEF'];
      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval = window.setInterval(() => {
        const timeLeft = end - Date.now();
        if (timeLeft <= 0) {
          window.clearInterval(interval);
          return;
        }

        const particleCount = 360 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors,
          shapes: ['square', 'circle', 'star'],
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors,
          shapes: ['square', 'circle', 'star'],
        });
      }, 250);
    }

    previousStatusRef.current = nextStatus;
  }, [orderQuery.data?.order?.status]);

  useEffect(() => {
    if (orderQuery.isLoading || orderQuery.isFetching || orderQuery.isError) return;
    const kind = orderQuery.data?.kind;
    const status = orderQuery.data?.order?.status;
    if (kind === 'not_found' || kind === 'not_owner') return;
    if (status && status !== 'pending_payment') return;
    if (pollCount >= MAX_POLLS) return;

    let cancelled = false;
    const delay = POLL_DELAYS[Math.min(pollCount, POLL_DELAYS.length - 1)];
    const timeoutId = window.setTimeout(() => {
      if (cancelled) return;
      setPollCount((current) => current + 1);
      void orderQuery.refetch();
    }, delay);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [orderQuery, pollCount]);

  const reconcileMutation = useMutation({
    mutationFn: () => reconcileDokuPayment({ invoice_number: invoice! }),
    onSuccess: async () => {
      setPollCount(0);
      await queryClient.invalidateQueries({ queryKey: ['checkout-result', invoice] });
      await orderQuery.refetch();
    },
  });

  // Auto-trigger reconcile after a few polls if still pending — no manual click needed.
  const autoReconcileTriggered = useRef(false);
  useEffect(() => {
    if (
      pollCount >= AUTO_RECONCILE_AFTER_POLLS &&
      !autoReconcileTriggered.current &&
      !reconcileMutation.isPending &&
      !reconcileMutation.isSuccess &&
      invoice &&
      orderQuery.data?.kind !== 'not_found' &&
      orderQuery.data?.kind !== 'not_owner' &&
      (!orderQuery.data?.order || orderQuery.data.order.status === 'pending_payment')
    ) {
      autoReconcileTriggered.current = true;
      reconcileMutation.mutate();
    }
  }, [pollCount, invoice, orderQuery.data, reconcileMutation]);

  const result = orderQuery.data;
  const order = result?.order ?? null;
  const resultKind = result?.kind;
  // PostgREST may return pickup_codes as object (unique FK) or array — normalize
  const rawCodes = order?.pickup_codes;
  const pickupCode = rawCodes == null
    ? undefined
    : Array.isArray(rawCodes)
      ? rawCodes[0]
      : rawCodes;
  const isSuccess = order?.status === 'pending_pickup' || order?.status === 'picked_up';
  const isFailed = order?.status === 'cancelled' || order?.status === 'expired';
  const isPending = Boolean(
    resultKind !== 'not_found' &&
    resultKind !== 'not_owner' &&
    (!order || order.status === 'pending_payment'),
  );
  const isPollingExhausted = isPending && pollCount >= MAX_POLLS;
  const isNotOwner = resultKind === 'not_owner';
  const isNotFound = resultKind === 'not_found';

  if (!invoice) {
    return (
      <div className="checkout-result-page">
        <header className="checkout-result-header">
          <Link to="/" aria-label="Spark Stage home"><BrandLogo /></Link>
        </header>
        <main className="checkout-result-main">
          <p className="checkout-result-eyebrow">Error</p>
          <h1 className="checkout-result-title">Invoice tidak ditemukan</h1>
          <p className="checkout-result-body">Link ini tidak valid. Silakan cek email konfirmasi kamu.</p>
          <Link to="/" className="checkout-result-cta">Kembali ke beranda</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="checkout-result-page">
      <header className="checkout-result-header">
        <Link to="/" aria-label="Spark Stage home"><BrandLogo /></Link>
      </header>

      <main className="checkout-result-main">
        {/* Loading state */}
        {orderQuery.isLoading && (
          <>
            <div className="checkout-result-icon checkout-result-icon--pending">
              <div className="checkout-result-spinner" aria-label="Loading" />
            </div>
            <p className="checkout-result-eyebrow">Memproses</p>
            <h1 className="checkout-result-title">Mengecek status pembayaran…</h1>
          </>
        )}

        {/* Polling — waiting for webhook */}
        {!orderQuery.isLoading && !orderQuery.isError && isPending && !isPollingExhausted && (
          <>
            <StatusIcon status="pending_payment" />
            <p className="checkout-result-eyebrow">Menunggu konfirmasi</p>
            <h1 className="checkout-result-title">
              <RotatingPendingMessage pollCount={pollCount} />
            </h1>
            <p className="checkout-result-body">
              Kami sedang menunggu konfirmasi dari bank. Halaman ini akan otomatis diperbarui.
            </p>
            <p className="checkout-result-invoice">Invoice: <strong>{invoice}</strong></p>
          </>
        )}

        {/* Polling exhausted */}
        {!orderQuery.isLoading && !orderQuery.isError && isPending && isPollingExhausted && (
          <>
            <StatusIcon status="pending_payment" />
            <p className="checkout-result-eyebrow">Menunggu konfirmasi</p>
            <h1 className="checkout-result-title">Pembayaran belum terkonfirmasi</h1>
            <p className="checkout-result-body">
              Pembayaran kamu mungkin masih diproses oleh bank atau DOKU. Kamu bisa meminta sistem mengecek
              status langsung ke DOKU tanpa membagikan detail pembayaran.
            </p>
            <p className="checkout-result-invoice">Invoice: <strong>{invoice}</strong></p>
            {reconcileMutation.data?.message ? (
              <p className="checkout-result-status-note">{reconcileMutation.data.message}</p>
            ) : null}
            {reconcileMutation.error ? (
              <p className="checkout-result-status-note checkout-result-status-note--error">
                {reconcileMutation.error.message}
              </p>
            ) : null}
            <button
              type="button"
              className="checkout-result-cta-secondary"
              disabled={reconcileMutation.isPending}
              onClick={() => reconcileMutation.mutate()}
            >
              {reconcileMutation.isPending ? 'Mengecek DOKU...' : 'Cek status ke DOKU'}
            </button>
            <button
              type="button"
              className="checkout-result-text-button"
              onClick={() => { setPollCount(0); orderQuery.refetch(); }}
            >
              Cek ulang halaman
            </button>
          </>
        )}

        {/* Status lookup error */}
        {!orderQuery.isLoading && orderQuery.isError && (
          <>
            <StatusIcon status="pending_payment" />
            <p className="checkout-result-eyebrow">Status belum tersedia</p>
            <h1 className="checkout-result-title">Belum bisa membaca status pesanan</h1>
            <p className="checkout-result-body">
              Sistem checkout belum bisa mengambil status invoice ini. Coba beberapa saat lagi.
            </p>
            <p className="checkout-result-status-note checkout-result-status-note--error">
              {orderQuery.error.message}
            </p>
            <p className="checkout-result-invoice">Invoice: <strong>{invoice}</strong></p>
            <button
              type="button"
              className="checkout-result-cta-secondary"
              onClick={() => orderQuery.refetch()}
            >
              Cek ulang
            </button>
          </>
        )}

        {/* Success */}
        {isSuccess && order && (
          <div className="checkout-result-success-section">
            <AnimatedCheckmark />
            <p className="checkout-result-eyebrow checkout-result-eyebrow--success">Payment Successful</p>
            <h1 className="checkout-result-title checkout-result-title--success">
              Thank you for choosing Spark Stage
            </h1>
            <p className="checkout-result-body">
              Hi <strong>{order.customer_name}</strong>, your order has been confirmed and is ready for pickup.
              Your QR code and pickup instructions are below — please bring them when you visit our store.
            </p>
            <p className="checkout-result-body checkout-result-body--muted">
              {order.customer_email
                ? <>A receipt has been sent to <strong>{order.customer_email}</strong>.</>
                : 'Please save your invoice number for reference.'}
            </p>

            {/* Pickup section */}
            {pickupCode && (
              <section className="checkout-result-pickup">
                <p className="checkout-result-pickup-label">Your Pickup Code</p>
                <p className="checkout-result-pickup-code">{pickupCode.code}</p>
                <p className="checkout-result-pickup-hint">
                  Tunjukkan QR code ini saat mengambil barang di toko kami.
                </p>
                <div className="checkout-result-qr">
                  <QRCodeCanvas payload={normalizeQrPayload(pickupCode.qr_payload)} />
                </div>
              </section>
            )}

            {/* Order summary */}
            <section className="checkout-result-summary">
              <p className="checkout-result-summary-label">Order Summary</p>
              <p className="checkout-result-invoice">Invoice: <strong>{order.invoice_number}</strong></p>
              <ul className="checkout-result-items">
                {order.order_items?.map((item, i) => (
                  <li key={i} className="checkout-result-item">
                    <span className="checkout-result-item-name">{item.product_name}</span>
                    <span className="checkout-result-item-qty">×{item.quantity}</span>
                    <span className="checkout-result-item-price">{IDR.format(item.line_total_idr)}</span>
                  </li>
                ))}
              </ul>
              <div className="checkout-result-total">
                <span>Total Paid</span>
                <strong>{IDR.format(order.total_amount_idr)}</strong>
              </div>
            </section>

            <div className="checkout-result-actions">
              <Link to="/my-orders" className="checkout-result-cta-secondary">
                Lihat Semua Pesanan
              </Link>
              <Link to="/" className="checkout-result-cta">Continue Shopping</Link>
            </div>
          </div>
        )}

        {/* Failed / expired */}
        {isFailed && order && (
          <>
            <StatusIcon status={order.status} />
            <p className="checkout-result-eyebrow">
              {order.status === 'cancelled' ? 'Dibatalkan' : 'Kedaluwarsa'}
            </p>
            <h1 className="checkout-result-title">
              {order.status === 'cancelled' ? 'Pesanan dibatalkan' : 'Sesi pembayaran berakhir'}
            </h1>
            <p className="checkout-result-body">
              {order.status === 'cancelled'
                ? 'Pesanan ini telah dibatalkan. Silakan buat pesanan baru jika ingin melanjutkan.'
                : 'Waktu pembayaran telah habis. Silakan kembali ke keranjang dan coba lagi.'}
            </p>
            <p className="checkout-result-invoice">Invoice: <strong>{order.invoice_number}</strong></p>
            <Link to="/" className="checkout-result-cta">Kembali ke beranda</Link>
          </>
        )}

        {/* Not found */}
        {!orderQuery.isLoading && orderQuery.isFetched && isNotFound && (
          <>
            <div className="checkout-result-icon checkout-result-icon--error">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="20" fill="#e00" />
                <path d="M13 13L27 27M27 13L13 27" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <p className="checkout-result-eyebrow">Tidak ditemukan</p>
            <h1 className="checkout-result-title">Pesanan tidak ditemukan</h1>
            <p className="checkout-result-body">
              Invoice <strong>{invoice}</strong> tidak ditemukan atau belum tersedia untuk ditampilkan.
              Pastikan link yang kamu buka sudah benar.
            </p>
            <Link to="/" className="checkout-result-cta">Kembali ke beranda</Link>
          </>
        )}

        {/* RLS / ownership denied */}
        {!orderQuery.isLoading && orderQuery.isFetched && isNotOwner && (
          <>
            <div className="checkout-result-icon checkout-result-icon--error">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="20" fill="#e00" />
                <path d="M20 10v14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="20" cy="30" r="1.8" fill="#fff" />
              </svg>
            </div>
            <p className="checkout-result-eyebrow">Akses terbatas</p>
            <h1 className="checkout-result-title">Pesanan tidak terhubung ke akun ini</h1>
            <p className="checkout-result-body">
              Invoice <strong>{invoice}</strong> ada, tetapi hanya bisa dilihat oleh akun pembeli yang sesuai.
              Masuk dengan akun yang dipakai saat checkout atau hubungi admin toko.
            </p>
            <Link to="/" className="checkout-result-cta">Kembali ke beranda</Link>
          </>
        )}
      </main>
    </div>
  );
}
