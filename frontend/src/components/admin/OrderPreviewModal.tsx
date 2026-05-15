import { AdminIcon } from './AdminIcon';
import { PackageIcon } from '@hugeicons/core-free-icons';
import type { AdminOrder } from '../../types/commerce';

const IDR = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

type OrderPreviewModalProps = {
  order: AdminOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isConfirming: boolean;
  errorMessage?: string | null;
};

export function OrderPreviewModal({ order, isOpen, onClose, onConfirm, isConfirming, errorMessage }: OrderPreviewModalProps) {
  if (!isOpen || !order) return null;

  const pickupCode = Array.isArray(order.pickup_codes)
    ? order.pickup_codes[0]?.code
    : (order.pickup_codes as any)?.code;

  return (
    <div className="order-preview-backdrop" role="dialog" aria-modal="true" aria-label="Preview Pesanan">
      <div className="order-preview-scrim" onClick={onClose} />
      <div className="order-preview-panel">

        {/* Header */}
        <div className="order-preview-header">
          <div className="order-preview-header-info">
            <p className="order-preview-eyebrow">Preview Pesanan</p>
            <h3 className="order-preview-invoice">{order.invoice_number}</h3>
            <p className="order-preview-customer">{order.customer_name}</p>
          </div>
          <button type="button" className="order-preview-close" onClick={onClose} aria-label="Tutup">
            ×
          </button>
        </div>

        {/* Body */}
        <div className="order-preview-body">
          <div className="order-preview-meta">
            <div className="order-preview-meta-row">
              <span>Pickup Code</span>
              <strong className="order-preview-code">{pickupCode ?? '—'}</strong>
            </div>
            <div className="order-preview-meta-row">
              <span>Total</span>
              <strong>{IDR.format(order.total_amount_idr)}</strong>
            </div>
            <div className="order-preview-meta-row">
              <span>Status Pesanan</span>
              <span className={`admin-status-pill is-${order.status === 'pending_pickup' ? 'active' : order.status}`}>
                {order.status.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="order-preview-meta-row">
              <span>Pembayaran</span>
              <span className={`admin-status-pill is-${order.payment_status === 'paid' ? 'active' : 'pending'}`}>
                {order.payment_status}
              </span>
            </div>
          </div>

          {/* Items */}
          {order.order_items && order.order_items.length > 0 && (
            <div className="order-preview-items">
              <div className="order-preview-items-header">
                <AdminIcon icon={PackageIcon} size={14} />
                Items
              </div>
              {order.order_items.map((item, index) => (
                <div key={`${item.product_name}-${index}`} className="order-preview-item-row">
                  <span className="order-preview-item-name">{item.product_name} ×{item.quantity}</span>
                  <span className="order-preview-item-price">{IDR.format(item.line_total_idr)}</span>
                </div>
              ))}
            </div>
          )}

          {errorMessage ? (
            <div className="order-preview-error">{errorMessage}</div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="order-preview-footer">
          <button
            type="button"
            className="order-preview-btn order-preview-btn--cancel"
            onClick={onClose}
            disabled={isConfirming}
          >
            Batal
          </button>
          <button
            type="button"
            className="order-preview-btn order-preview-btn--confirm"
            onClick={onConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? 'Memproses...' : 'Konfirmasi & Serah Barang'}
          </button>
        </div>

      </div>
    </div>
  );
}
