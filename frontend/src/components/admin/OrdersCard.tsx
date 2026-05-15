import { Invoice03Icon, Payment02Icon, QrCodeScanIcon } from '@hugeicons/core-free-icons';
import type { AdminOrder, OrderStatus } from '../../types/commerce';
import type { OrderTabKey } from '../../pages/admin/OrdersSection';
import { AdminIcon } from './AdminIcon';
import { OrderStripSkeleton } from './AdminSkeleton';

type OrdersCardProps = {
  orders?: AdminOrder[];
  selectedOrder?: AdminOrder;
  isLoading?: boolean;
  activeTab?: OrderTabKey;
  onSelectOrder: (id: string) => void;
  onRefresh: () => void;
  formatCurrency: (value: number) => string;
};

// Status badge color tokens — consistent with admin design system
const STATUS_BADGE: Record<OrderStatus, { bg: string; color: string; label: string }> = {
  pending_payment: { bg: '#FEF3C7', color: '#D97706', label: 'Pending Payment' },
  paid:            { bg: '#DBEAFE', color: '#2563EB', label: 'Paid' },
  pending_pickup:  { bg: '#DBEAFE', color: '#2563EB', label: 'Pending Pickup' },
  picked_up:       { bg: '#DCFCE7', color: '#16A34A', label: 'Picked Up' },
  cancelled:       { bg: '#FEE2E2', color: '#DC2626', label: 'Cancelled' },
  expired:         { bg: '#F3F4F6', color: '#6B7280', label: 'Expired' },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const token = STATUS_BADGE[status] ?? { bg: '#F3F4F6', color: '#6B7280', label: status };
  return (
    <span
      className="admin-order-status-badge"
      style={{ background: token.bg, color: token.color }}
    >
      {token.label}
    </span>
  );
}

function formatTimestamp(iso: string | null | undefined, label: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return `${label}: ${d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
}

function formatWaitingTime(iso: string | null | undefined) {
  if (!iso) return null;
  const diffMs = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) return null;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days >= 1) return `Menunggu sejak ${days} hari yang lalu`;
  if (hours >= 1) return `Menunggu sejak ${hours} jam yang lalu`;
  const minutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
  return `Menunggu sejak ${minutes} menit yang lalu`;
}

export function OrdersCard({
  orders,
  selectedOrder,
  isLoading,
  activeTab,
  onSelectOrder,
  onRefresh,
  formatCurrency,
}: OrdersCardProps) {
  const isEmpty = !isLoading && orders && orders.length === 0;

  return (
    <section className="admin-detail-card">
      <div className="admin-detail-heading">
        <div>
          <p className="admin-eyebrow">Orders</p>
          <h2>{selectedOrder?.invoice_number ?? 'Latest Orders'}</h2>
        </div>
        <button type="button" onClick={onRefresh}>Refresh</button>
      </div>

      <div className="admin-order-board">
        {/* ── Strip (left column) ── */}
        <div className="admin-order-strip">
          {isLoading ? (
            <OrderStripSkeleton count={4} />
          ) : isEmpty ? (
            <div className="admin-empty-state admin-empty-state--compact">
              <AdminIcon icon={Invoice03Icon} size={28} />
              <p>No orders in this category.</p>
            </div>
          ) : (
            orders?.map((order) => {
              const pickupCode = order.pickup_codes?.[0]?.code;
              const paidTs = formatTimestamp(order.paid_at, 'Paid');
              const pickedTs = formatTimestamp(order.picked_up_at, 'Picked up');

              return (
                <button
                  className={selectedOrder?.id === order.id ? 'is-selected' : ''}
                  key={order.id}
                  type="button"
                  onClick={() => onSelectOrder(order.id)}
                >
                  <strong>{order.customer_name}</strong>
                  <span className="admin-order-strip-meta">
                    <span
                      className="admin-status-dot"
                      style={{ backgroundColor: STATUS_BADGE[order.status]?.color ?? '#999' }}
                    />
                    {order.status.replace(/_/g, ' ')}
                  </span>
                  {pickupCode && (
                    <span className="admin-order-strip-code">{pickupCode}</span>
                  )}
                  {(activeTab === 'pending_pickup' || activeTab === 'all') && order.paid_at && (
                    <span className="admin-order-strip-ts">{formatWaitingTime(order.paid_at) ?? paidTs}</span>
                  )}
                  {(activeTab === 'completed' || activeTab === 'all') && pickedTs && (
                    <span className="admin-order-strip-ts">{pickedTs}</span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* ── Detail panel (right column) ── */}
        <div className="admin-order-detail">
          {selectedOrder ? (
            <>
              <div className="admin-order-detail-header">
                <div>
                  <p className="admin-order-detail-name">{selectedOrder.customer_name}</p>
                  {selectedOrder.customer_email && (
                    <p className="admin-order-detail-contact admin-muted">{selectedOrder.customer_email}</p>
                  )}
                  {selectedOrder.customer_phone && (
                    <p className="admin-order-detail-contact admin-muted">{selectedOrder.customer_phone}</p>
                  )}
                  <p className="admin-order-detail-invoice">{selectedOrder.invoice_number}</p>
                </div>
                <StatusBadge status={selectedOrder.status} />
              </div>

              <div className="admin-attachment-row">
                <span>
                  <AdminIcon icon={Payment02Icon} size={18} />
                  {selectedOrder.payment_status}
                </span>
                <span>
                  <AdminIcon icon={QrCodeScanIcon} size={18} />
                  {selectedOrder.pickup_codes?.[0]?.code ?? 'No pickup code'}
                </span>
              </div>

              {/* Timestamps */}
              {selectedOrder.paid_at && (
                <p className="admin-order-detail-ts">
                  Paid: {new Date(selectedOrder.paid_at).toLocaleString('id-ID')}
                </p>
              )}
              {selectedOrder.picked_up_at && (
                <p className="admin-order-detail-ts">
                  Picked up: {new Date(selectedOrder.picked_up_at).toLocaleString('id-ID')}
                </p>
              )}

              {/* Order items */}
              {selectedOrder.order_items && selectedOrder.order_items.length > 0 && (
                <div className="admin-order-items">
                  <p className="admin-order-items-label">Items</p>
                  <ul className="admin-order-items-list">
                    {selectedOrder.order_items.map((item, idx) => (
                      <li key={idx} className="admin-order-item-row">
                        <span className="admin-order-item-name">
                          {item.product_name}
                          {item.quantity > 1 && (
                            <span className="admin-order-item-qty"> ×{item.quantity}</span>
                          )}
                        </span>
                        <span className="admin-order-item-price">
                          {formatCurrency(item.line_total_idr)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="admin-order-items-total">
                    <span>Total</span>
                    <strong>{formatCurrency(selectedOrder.total_amount_idr)}</strong>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="admin-muted">Select an order to view details.</p>
          )}
        </div>
      </div>
    </section>
  );
}
