/**
 * OrdersSection — self-contained admin page for order management.
 *
 * Owns:
 *  - orders TanStack Query
 *  - selectedOrderId state
 *
 * Rendered by AdminPage when tab === 'orders'.
 */

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminDetailTop, OrdersCard } from '../../components/admin';
import { listAdminOrders } from '../../services/commerce';

const currency = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

type OrdersSectionProps = {
  isReady: boolean;
};

export function OrdersSection({ isReady }: OrdersSectionProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const ordersQuery = useQuery({
    queryKey: ['admin-orders'],
    queryFn: listAdminOrders,
    enabled: isReady,
  });

  const selectedOrder = useMemo(
    () =>
      ordersQuery.data?.find((o) => o.id === selectedOrderId) ??
      ordersQuery.data?.[0],
    [ordersQuery.data, selectedOrderId],
  );

  return (
    <section className="admin-detail-pane">
      <AdminDetailTop />
      <OrdersCard
        orders={ordersQuery.data}
        selectedOrder={selectedOrder}
        isLoading={ordersQuery.isLoading}
        onSelectOrder={setSelectedOrderId}
        onRefresh={() => ordersQuery.refetch()}
        formatCurrency={(v) => currency.format(v)}
      />
    </section>
  );
}
