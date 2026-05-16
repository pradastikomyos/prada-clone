import { Link } from 'react-router-dom';
import { BrandLogo } from '../../components/ui/BrandLogo';
import type { CheckoutResultOrder } from '../../services/orders';
import type { CheckoutResultResponse } from '../../services/checkout';
import { CheckoutSuccessView } from './CheckoutSuccessView';
import { RotatingPendingMessage } from './RotatingPendingMessage';
import { StatusIcon } from './StatusIcon';

type OrderQueryResult = {
  isLoading: boolean;
  isError: boolean;
  isFetched: boolean;
  error: Error | null;
  refetch: () => unknown;
  data?: CheckoutResultResponse;
};

type ReconcileMutationResult = {
  data?: { message?: string } | null;
  error: Error | null;
  isPending: boolean;
  mutate: () => void;
};

export function CheckoutResultContent({
  invoice,
  orderQuery,
  pollCount,
  isPollingExhausted,
  reconcileMutation,
  order,
  isPending,
  isSuccess,
  isFailed,
  isNotOwner,
  isNotFound,
  resetPolling,
}: {
  invoice: string | null;
  orderQuery: OrderQueryResult;
  pollCount: number;
  isPollingExhausted: boolean;
  reconcileMutation: ReconcileMutationResult;
  order: CheckoutResultOrder | null;
  isPending: boolean;
  isSuccess: boolean;
  isFailed: boolean;
  isNotOwner: boolean;
  isNotFound: boolean;
  resetPolling: () => void;
}) {
  if (!invoice) {
    return (
      <>
        <header className="checkout-result-header">
          <Link to="/" aria-label="Spark Stage home"><BrandLogo /></Link>
        </header>
        <main className="checkout-result-main">
          <p className="checkout-result-eyebrow">Error</p>
          <h1 className="checkout-result-title">Invoice tidak ditemukan</h1>
          <p className="checkout-result-body">Link ini tidak valid. Silakan cek email konfirmasi kamu.</p>
          <Link to="/" className="checkout-result-cta">Kembali ke beranda</Link>
        </main>
      </>
    );
  }

  return (
    <>
      <header className="checkout-result-header">
        <Link to="/" aria-label="Spark Stage home"><BrandLogo /></Link>
      </header>

      <main className="checkout-result-main">
        {orderQuery.isLoading && (
          <>
            <div className="checkout-result-icon checkout-result-icon--pending">
              <div className="checkout-result-spinner" aria-label="Loading" />
            </div>
            <p className="checkout-result-eyebrow">Memproses</p>
            <h1 className="checkout-result-title">Mengecek status pembayaran…</h1>
          </>
        )}

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
              onClick={() => { resetPolling(); orderQuery.refetch(); }}
            >
              Cek ulang halaman
            </button>
          </>
        )}

        {!orderQuery.isLoading && orderQuery.isError && (
          <>
            <StatusIcon status="pending_payment" />
            <p className="checkout-result-eyebrow">Status belum tersedia</p>
            <h1 className="checkout-result-title">Belum bisa membaca status pesanan</h1>
            <p className="checkout-result-body">
              Sistem checkout belum bisa mengambil status invoice ini. Coba beberapa saat lagi.
            </p>
            <p className="checkout-result-status-note checkout-result-status-note--error">
              {orderQuery.error?.message}
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

        {isSuccess && order && (
          <CheckoutSuccessView order={order} pickupCode={order.pickup_codes?.[0] ?? null} />
        )}

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
    </>
  );
}
