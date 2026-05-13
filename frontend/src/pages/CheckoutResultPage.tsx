import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import QRCode from 'qrcode';
import { BrandLogo } from '../components/ui/BrandLogo';
import { isSupabaseConfigured } from '../lib/supabase';
import { getCheckoutResult, reconcileDokuPayment } from '../services/commerce';
import type { CheckoutResultOrder } from '../services/commerce';

const IDR = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

/** Poll interval in ms while order is still pending_payment */
const POLL_INTERVAL = 4_000;
/** Max polls before giving up and showing "check later" message */
const MAX_POLLS = 15;

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

export function CheckoutResultPage() {
  const [searchParams] = useSearchParams();
  const invoice = useMemo(() => searchParams.get('invoice'), [searchParams]);
  const [pollCount, setPollCount] = useState(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    document.title = 'Order Confirmation | Spark Stage';
  }, []);

  const orderQuery = useQuery({
    queryKey: ['checkout-result', invoice],
    queryFn: () => getCheckoutResult(invoice!),
    enabled: isSupabaseConfigured && Boolean(invoice),
    // Poll while status is still pending_payment, stop after max polls
    refetchInterval: (query) => {
      const status = query.state.data?.order?.status;
      const kind = query.state.data?.kind;
      if (kind === 'not_found' || kind === 'not_owner') return false;
      if (!status || status === 'pending_payment') {
        if (pollCount >= MAX_POLLS) return false;
        setPollCount((c) => c + 1);
        return POLL_INTERVAL;
      }
      return false;
    },
    staleTime: 0,
  });

  const reconcileMutation = useMutation({
    mutationFn: () => reconcileDokuPayment({ invoice_number: invoice! }),
    onSuccess: async () => {
      setPollCount(0);
      await queryClient.invalidateQueries({ queryKey: ['checkout-result', invoice] });
      await orderQuery.refetch();
    },
  });

  const result = orderQuery.data;
  const order = result?.order ?? null;
  const resultKind = result?.kind;
  const pickupCode = order?.pickup_codes?.[0];
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
            <h1 className="checkout-result-title">Pembayaran sedang diverifikasi</h1>
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
                  Show this code or scan the QR below at our store counter to collect your order.
                </p>
                <div className="checkout-result-qr">
                  <QRCodeCanvas payload={pickupCode.qr_payload} />
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

            <Link to="/" className="checkout-result-cta">Continue Shopping</Link>
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
