import { FormEvent } from 'react';
import {
  QrCodeScanIcon,
  InformationCircleIcon,
  Camera02Icon,
  CheckmarkCircle01Icon,
  Package01Icon,
} from '@hugeicons/core-free-icons';
import { AdminIcon } from './AdminIcon';
import { AdminOrder } from '../../types/commerce';

const formatIDR = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)

type PickupVerificationCardProps = {
  pickupCode: string
  error?: Error | null
  isPending: boolean
  isVerified: boolean
  onPickupCodeChange: (value: string) => void
  onSubmit: (event: FormEvent) => void
  onOpenScanner: () => void
  orderDetail: AdminOrder | null
  isLoadingOrder: boolean
}

export function PickupVerificationCard({
  pickupCode,
  error,
  isPending,
  isVerified,
  onPickupCodeChange,
  onSubmit,
  onOpenScanner,
  orderDetail,
  isLoadingOrder,
}: PickupVerificationCardProps) {
  const canPreview = orderDetail !== null && orderDetail.status === 'pending_pickup'

  return (
    <div className="admin-bopis-container">
      {/* Header Section */}
      <header className="admin-bopis-header">
        <div>
          <h2 className="admin-bopis-title">Scan Pickup Produk</h2>
          <p className="admin-muted">Pindai kode QR pickup untuk menyelesaikan pengambilan produk in-store.</p>
        </div>
        <div className="admin-bopis-badge">
          <span className="admin-status-dot" style={{ backgroundColor: '#16A34A' }} />
          Siap Memindai
        </div>
      </header>

      {/* Main Scanner Area */}
      <section className="admin-bopis-scanner-box">
        <div className="admin-bopis-scanner-icon">
          <AdminIcon icon={QrCodeScanIcon} size={32} />
        </div>
        <h3>Scan Pickup Produk</h3>
        <p className="admin-muted">
          Klik tombol di bawah untuk mengaktifkan kamera dan pindai kode QR pickup pada pesanan produk, atau masukkan kode secara manual.
        </p>

        <button type="button" className="admin-bopis-activate-btn" onClick={onOpenScanner}>
          <AdminIcon icon={Camera02Icon} size={18} />
          Aktifkan Pemindai
        </button>

        <div className="admin-bopis-divider">
          <span>ATAU INPUT MANUAL</span>
        </div>

        <form onSubmit={onSubmit} className="admin-bopis-manual-form">
          <div className="admin-bopis-input-group">
            <input
              value={pickupCode}
              onChange={(event) => onPickupCodeChange(event.target.value.toUpperCase())}
              placeholder="Contoh: PRX-9C1-984"
            />
            {!canPreview && (
              <button type="submit" disabled={isPending || !pickupCode}>
                {isPending ? 'Memuat...' : 'Cari Order'}
              </button>
            )}
          </div>
          {error ? (
            <p className="admin-error" style={{ marginTop: '12px', textAlign: 'center' }}>
              {error.message}
            </p>
          ) : null}
          {isVerified ? (
            <p className="admin-success" style={{ marginTop: '12px', textAlign: 'center' }}>
              Verifikasi berhasil! Produk dapat diserahkan.
            </p>
          ) : null}
        </form>
      </section>

      {/* Order Detail Section */}
      {isLoadingOrder && pickupCode.length >= 3 ? (
        <section className="admin-bopis-order-detail">
          <p className="admin-muted" style={{ textAlign: 'center', padding: '16px 0' }}>Memuat detail pesanan…</p>
        </section>
      ) : orderDetail ? (
        <section className="admin-bopis-order-detail">
          <div className="admin-order-detail-header">
            <AdminIcon icon={Package01Icon} size={20} />
            <strong>Detail Pesanan</strong>
          </div>

          <div className="admin-order-detail-meta">
            <div className="admin-order-detail-row">
              <span className="admin-muted">Invoice</span>
              <span>{orderDetail.invoice_number}</span>
            </div>
            <div className="admin-order-detail-row">
              <span className="admin-muted">Pelanggan</span>
              <span>{orderDetail.customer_name}</span>
            </div>
            {orderDetail.customer_phone ? (
              <div className="admin-order-detail-row">
                <span className="admin-muted">Telepon</span>
                <span>{orderDetail.customer_phone}</span>
              </div>
            ) : null}
            <div className="admin-order-detail-row">
              <span className="admin-muted">Status</span>
              <span className={`admin-status-badge admin-status-${orderDetail.status}`}>
                {orderDetail.status}
              </span>
            </div>
          </div>

          {orderDetail.order_items && orderDetail.order_items.length > 0 ? (
            <div className="admin-order-items">
              <p className="admin-muted" style={{ marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Item Pesanan
              </p>
              <ul className="admin-order-items-list">
                {orderDetail.order_items.map((item, idx) => (
                  <li key={idx} className="admin-order-item-row">
                    <span className="admin-order-item-name">
                      {item.product_name}
                      <span className="admin-muted"> ×{item.quantity}</span>
                    </span>
                    <span>{formatIDR(item.line_total_idr)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="admin-order-detail-total">
            <span>Total</span>
            <strong>{formatIDR(orderDetail.total_amount_idr)}</strong>
          </div>

          {orderDetail.pickup_codes && orderDetail.pickup_codes.length > 0 ? (
            <div className="admin-order-detail-row" style={{ marginTop: '8px' }}>
              <span className="admin-muted">Kode Pickup</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                {orderDetail.pickup_codes[0].code}
              </span>
            </div>
          ) : null}

          {canPreview ? (
            <button
              type="button"
              className="admin-bopis-verify-btn"
              disabled={isPending}
              onClick={(e) => {
                e.preventDefault();
                onSubmit(e as unknown as FormEvent)
              }}
            >
              <AdminIcon icon={CheckmarkCircle01Icon} size={18} />
              {isPending ? 'Memuat...' : 'Buka Preview'}
            </button>
          ) : orderDetail.status === 'picked_up' ? (
            <p className="admin-success" style={{ marginTop: '12px', textAlign: 'center' }}>
              Pesanan ini sudah diambil.
            </p>
          ) : (
            <p className="admin-error" style={{ marginTop: '12px', textAlign: 'center' }}>
              Pesanan tidak dalam status siap pickup (status: {orderDetail.status}).
            </p>
          )}
        </section>
      ) : null}

      {/* Instructions Box */}
      <section className="admin-bopis-instructions">
        <div className="admin-bopis-instructions-header">
          <AdminIcon icon={InformationCircleIcon} size={20} />
          <strong>Cara Menggunakan</strong>
        </div>
        <ul>
          <li>Klik <strong>"Aktifkan Pemindai"</strong> untuk membuka kamera perangkat Anda.</li>
          <li>Arahkan kamera ke kode QR pickup yang ditunjukkan oleh pelanggan.</li>
          <li>Tunggu sistem memproses data pesanan secara otomatis.</li>
          <li>Pesan <strong>hijau</strong> menandakan pickup valid dan berhasil diverifikasi. Pesan <strong>merah</strong> menandakan kode tidak valid.</li>
          <li>Jika pelanggan tidak memiliki QR, gunakan kolom input manual untuk memasukkan ID pesanan.</li>
        </ul>
      </section>
    </div>
  )
}
