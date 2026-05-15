import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { useEffect, useMemo, useRef } from 'react';
import { classifyOrder, isPickupReady, normalizeQrPayload } from '../../utils/orderHelpers';
import type { MyOrder } from '../../hooks/useMyOrders';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);

function QRCanvas({ payload }: { payload: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    void QRCode.toCanvas(ref.current, payload, { width: 160, margin: 2 });
  }, [payload]);

  return <canvas ref={ref} aria-label="Pickup QR code" />;
}

export function MyOrderCard({ order }: { order: MyOrder }) {
  const category = useMemo(() => classifyOrder(order), [order]);
  // pickup_codes may be array or single object — normalize to first item
  const pickupCode = Array.isArray(order.pickup_codes)
    ? order.pickup_codes[0]
    : order.pickup_codes ?? undefined;
  const showQr = isPickupReady(order) && pickupCode;
  const paidAt = order.paid_at ? new Date(order.paid_at).toLocaleString('id-ID') : null;
  const statusClass = category === 'pending' ? 'is-pending' : category === 'active' ? 'is-active' : 'is-history';
  const itemCount = order.order_items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <article className={`my-orders-card ${statusClass}`}>
      <div className="my-orders-card__top">
        <div>
          <p className="my-orders-card__eyebrow">Invoice</p>
          <h3 className="my-orders-card__invoice">{order.invoice_number}</h3>
          <p className="my-orders-card__customer">{order.customer_name}</p>
        </div>
        <span className="my-orders-card__status">
          {category === 'pending' ? 'Menunggu Pembayaran' : category === 'active' ? 'Siap Diambil' : 'Selesai'}
        </span>
      </div>

      <div className="my-orders-card__meta">
        <div className="my-orders-card__meta-grid">
          <p><span>Tanggal</span>{new Date(order.created_at).toLocaleString('id-ID')}</p>
          <p><span>Total</span>{formatCurrency(order.total_amount_idr)}</p>
          <p><span>Item</span>{itemCount}</p>
          <p><span>Status</span>{category === 'pending' ? 'Menunggu pembayaran' : category === 'active' ? 'Siap diambil' : 'Selesai'}</p>
        </div>
        {paidAt ? <p>Paid at: {paidAt}</p> : null}
      </div>

      {showQr && pickupCode ? (
        <div className="my-orders-card__qr-row">
          <div className="my-orders-card__qr-box">
            <QRCanvas payload={normalizeQrPayload(pickupCode.qr_payload)} />
          </div>
          <div>
            <p className="my-orders-card__eyebrow">Pickup Code</p>
            <p className="my-orders-card__pickup-code">{pickupCode.code}</p>
          </div>
        </div>
      ) : null}

      <div className="my-orders-card__actions">
        <Link
          to={`/my-orders/${encodeURIComponent(order.invoice_number)}`}
          className="my-orders-card__button"
        >
          Lihat Detail
        </Link>
      </div>
    </article>
  );
}
