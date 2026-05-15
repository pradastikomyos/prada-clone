import { useEffect, useRef } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import QRCode from 'qrcode';
import { getCheckoutResult } from '../services/commerce';
import { isPickupReady, normalizeQrPayload } from '../utils/orderHelpers';
import { isSupabaseConfigured } from '../lib/supabase';

const IDR = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

function QRCanvas({ payload, size = 200 }: { payload: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !payload) return;
    void QRCode.toCanvas(canvasRef.current, payload, {
      width: size,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    });
  }, [payload, size]);

  return <canvas ref={canvasRef} aria-label="Pickup QR code" />;
}

export function MyOrderDetailPage() {
  const { invoice } = useParams<{ invoice: string }>();

  const resultQuery = useQuery({
    queryKey: ['checkout-result', invoice],
    queryFn: () => getCheckoutResult(invoice!),
    enabled: isSupabaseConfigured && Boolean(invoice),
    staleTime: 0,
  });

  const order = resultQuery.data?.order ?? null;
  // get-checkout-result returns pickup_codes as a single object (unique FK)
  // or as an array — normalize to first item
  const rawPickupCodes = order?.pickup_codes;
  const pickupCode = rawPickupCodes == null
    ? null
    : Array.isArray(rawPickupCodes)
      ? (rawPickupCodes[0] ?? null)
      : rawPickupCodes;
  const pickupReady = order ? isPickupReady({ ...order, pickup_codes: pickupCode ? [pickupCode] : [] }) : false;
  const qrPayload = pickupCode ? normalizeQrPayload(pickupCode.qr_payload) : '';

  if (!invoice) return <Navigate to="/my-orders" replace />;

  if (resultQuery.isLoading) {
    return (
      <div className="order-detail-page">
        <div className="order-detail-shell">
          <div className="order-detail-loading">Memuat pesanan…</div>
        </div>
      </div>
    );
  }

  if (!order || resultQuery.data?.kind === 'not_found') {
    return (
      <div className="order-detail-page">
        <div className="order-detail-shell">
          <div className="order-detail-header">
            <Link to="/my-orders" className="order-detail-back">← Kembali</Link>
          </div>
          <p className="order-detail-not-found">Pesanan tidak ditemukan.</p>
        </div>
      </div>
    );
  }

  const itemCount = order.order_items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <div className="order-detail-page">
      <div className="order-detail-shell">

        {/* Header */}
        <div className="order-detail-header">
          <div>
            <p className="order-detail-eyebrow">Detail Pesanan</p>
            <h1 className="order-detail-invoice">{order.invoice_number}</h1>
          </div>
          <Link to="/my-orders" className="order-detail-back">← Kembali</Link>
        </div>

        <div className="order-detail-body">

          {/* Left column: QR + order details */}
          <div className="order-detail-main">

            {/* QR Pickup Card — prominent, shown when pickup ready */}
            {pickupReady && pickupCode && qrPayload ? (
              <section className="order-detail-qr-card">
                <div className="order-detail-qr-canvas">
                  <QRCanvas payload={qrPayload} size={200} />
                </div>
                <div className="order-detail-qr-info">
                  <p className="order-detail-qr-label">PICKUP CODE</p>
                  <p className="order-detail-qr-code">{pickupCode.code}</p>
                  <p className="order-detail-qr-hint">
                    Tunjukkan QR ini ke kasir saat mengambil barang di toko kami.
                  </p>
                </div>
              </section>
            ) : null}

            {/* Order Details card */}
            <section className="order-detail-card">
              <h2 className="order-detail-card-title">Order Details</h2>
              <div className="order-detail-grid">
                <div>
                  <p className="order-detail-field-label">ORDER ID</p>
                  <p className="order-detail-field-value">{order.invoice_number}</p>
                </div>
                <div>
                  <p className="order-detail-field-label">TANGGAL</p>
                  <p className="order-detail-field-value">
                    {new Date(order.created_at).toLocaleString('id-ID')}
                  </p>
                </div>
                <div>
                  <p className="order-detail-field-label">CUSTOMER</p>
                  <p className="order-detail-field-value">{order.customer_name}</p>
                </div>
                <div>
                  <p className="order-detail-field-label">FULFILLMENT</p>
                  <p className="order-detail-field-value">Pick up in store</p>
                </div>
                <div>
                  <p className="order-detail-field-label">STATUS PEMBAYARAN</p>
                  <p className="order-detail-field-value order-detail-field-value--status">
                    {order.payment_status}
                  </p>
                </div>
                <div>
                  <p className="order-detail-field-label">STATUS PESANAN</p>
                  <p className="order-detail-field-value">
                    {order.status.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>
            </section>

            {/* Order Items */}
            {order.order_items && order.order_items.length > 0 ? (
              <section className="order-detail-card">
                <h2 className="order-detail-card-title">Order Items</h2>
                <div className="order-detail-items">
                  {order.order_items.map((item, i) => (
                    <div key={i} className="order-detail-item">
                      <div className="order-detail-item-info">
                        <p className="order-detail-item-name">{item.product_name}</p>
                        <p className="order-detail-item-sku">{item.sku} · ×{item.quantity}</p>
                      </div>
                      <p className="order-detail-item-price">{IDR.format(item.line_total_idr)}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          {/* Right column: Order Summary */}
          <aside className="order-detail-summary">
            <section className="order-detail-card">
              <h2 className="order-detail-card-title">Order Summary</h2>
              <div className="order-detail-summary-rows">
                <div className="order-detail-summary-row">
                  <span>Items</span>
                  <span>{itemCount}</span>
                </div>
                <div className="order-detail-summary-row">
                  <span>Subtotal</span>
                  <span>{IDR.format(order.total_amount_idr)}</span>
                </div>
                <div className="order-detail-summary-row order-detail-summary-row--total">
                  <span>Total Paid</span>
                  <strong>{IDR.format(order.total_amount_idr)}</strong>
                </div>
              </div>
              <Link to="/" className="order-detail-continue">← Continue Shopping</Link>
            </section>
          </aside>

        </div>

        {order.customer_email ? (
          <p className="order-detail-email-note">
            A confirmation email has been sent to <strong>{order.customer_email}</strong>.
          </p>
        ) : null}

      </div>
    </div>
  );
}
