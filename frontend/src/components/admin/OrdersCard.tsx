import { Payment02Icon, QrCodeScanIcon, Invoice03Icon } from '@hugeicons/core-free-icons';
import { AdminOrder } from '../../types/commerce';
import { AdminIcon } from './AdminIcon';
import { OrderStripSkeleton } from './AdminSkeleton';

type OrdersCardProps = {
  orders?: AdminOrder[];
  selectedOrder?: AdminOrder;
  isLoading?: boolean;
  onSelectOrder: (id: string) => void;
  onRefresh: () => void;
  formatCurrency: (value: number) => string;
};

const statusColors: Record<string, string> = {
  paid: '#22C55E',
  pending: '#F59E0B',
  pending_pickup: '#3B82F6',
  completed: '#6B7280',
  cancelled: '#EF4444',
};

export function OrdersCard({ orders, selectedOrder, isLoading, onSelectOrder, onRefresh, formatCurrency }: OrdersCardProps) {
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
        <div className="admin-order-strip">
          {isLoading ? (
            <OrderStripSkeleton count={4} />
          ) : isEmpty ? (
            <div className="admin-empty-state admin-empty-state--compact">
              <AdminIcon icon={Invoice03Icon} size={28} />
              <p>No orders received yet.</p>
            </div>
          ) : (
            orders?.map((order) => (
              <button
                className={selectedOrder?.id === order.id ? 'is-selected' : ''}
                key={order.id}
                type="button"
                onClick={() => onSelectOrder(order.id)}
              >
                <strong>{order.customer_name}</strong>
                <span>
                  <span
                    className="admin-status-dot"
                    style={{ backgroundColor: statusColors[order.status] ?? '#999' }}
                  />
                  {order.status.replace(/_/g, ' ')}
                </span>
              </button>
            ))
          )}
        </div>
        <div className="admin-order-detail">
          {selectedOrder ? (
            <>
              <p>{selectedOrder.customer_name} - {formatCurrency(selectedOrder.total_amount_idr)}</p>
              <div className="admin-attachment-row">
                <span><AdminIcon icon={Payment02Icon} size={18} /> {selectedOrder.payment_status}</span>
                <span><AdminIcon icon={QrCodeScanIcon} size={18} /> {selectedOrder.pickup_codes?.[0]?.code ?? 'No pickup code'}</span>
              </div>
            </>
          ) : (
            <p className="admin-muted">Select an order to view details.</p>
          )}
        </div>
      </div>
    </section>
  );
}
