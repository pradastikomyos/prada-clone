/**
 * OrdersSection — self-contained admin page for order management.
 *
 * Owns:
 *  - orders TanStack Query (auto-refreshes every 30s for BOPIS demo)
 *  - activeTab state (default: 'pending_pickup' — most actionable)
 *  - selectedOrderId state
 *
 * Rendered by AdminPage when tab === 'orders'.
 */

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminDetailTop, OrdersCard } from '../../components/admin';
import { listAdminOrders } from '../../services/commerce';
import {
  type OrderTabKey,
  getCancelledOrders,
  getCompletedOrders,
  getPendingPaymentOrders,
  getPendingPickupOrders,
} from './orderHelpers';

export type { OrderTabKey };

const currency = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const TABS: { key: OrderTabKey; label: string }[] = [
  { key: 'pending_payment', label: 'Pending Payment' },
  { key: 'pending_pickup', label: 'Pending Pickup' },
  { key: 'completed', label: 'Completed' },
  { key: 'all', label: 'All' },
];

type OrdersSectionProps = {
  isReady: boolean;
};

export function OrdersSection({ isReady }: OrdersSectionProps) {
  const [activeTab, setActiveTab] = useState<OrderTabKey>('pending_pickup');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const ordersQuery = useQuery({
    queryKey: ['admin-orders'],
    queryFn: listAdminOrders,
    enabled: isReady,
    refetchInterval: 15_000,
  });

  const allOrders = ordersQuery.data ?? [];

  const tabCounts = useMemo(
    () => ({
      pending_payment: getPendingPaymentOrders(allOrders).length,
      pending_pickup: getPendingPickupOrders(allOrders).length,
      completed: getCompletedOrders(allOrders).length,
      cancelled: getCancelledOrders(allOrders).length,
      all: allOrders.length,
    }),
    [allOrders],
  );

  const visibleOrders = useMemo(() => {
    switch (activeTab) {
      case 'pending_payment':
        return getPendingPaymentOrders(allOrders);
      case 'pending_pickup':
        return getPendingPickupOrders(allOrders);
      case 'completed':
        return getCompletedOrders(allOrders);
      case 'all':
        return allOrders;
      default:
        return allOrders;
    }
  }, [activeTab, allOrders]);

  const selectedOrder = useMemo(
    () => visibleOrders.find((o) => o.id === selectedOrderId) ?? visibleOrders[0],
    [visibleOrders, selectedOrderId],
  );

  // Reset selection when switching tabs so the first order in the new tab is shown.
  const handleTabChange = (tab: OrderTabKey) => {
    setActiveTab(tab);
    setSelectedOrderId(null);
  };

  return (
    <section className="admin-detail-pane">
      <AdminDetailTop />
      <div className="admin-orders-tabs">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={activeTab === key ? 'is-active' : ''}
            onClick={() => handleTabChange(key)}
          >
            {label}
            {tabCounts[key] > 0 && (
              <span className="admin-orders-tab-badge">{tabCounts[key]}</span>
            )}
          </button>
        ))}
      </div>
      <OrdersCard
        orders={visibleOrders}
        selectedOrder={selectedOrder}
        isLoading={ordersQuery.isLoading}
        activeTab={activeTab}
        onSelectOrder={setSelectedOrderId}
        onRefresh={() => ordersQuery.refetch()}
        formatCurrency={(v) => currency.format(v)}
      />
    </section>
  );
}
