import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { normalizeQrPayload } from '../../utils/orderHelpers';
import type { CheckoutResultOrder } from '../../services/orders';
import { AnimatedCheckmark } from './StatusIcon';

const IDR = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

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

export function CheckoutSuccessView({
  order,
  pickupCode,
}: {
  order: CheckoutResultOrder;
  pickupCode: { code: string; qr_payload: string } | null;
}) {
  return (
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
  );
}
