/**
 * DashboardSection — self-contained admin overview page.
 *
 * Fetches both products and orders to compute KPI metrics.
 * Rendered by AdminPage when tab === 'dashboard'.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminDetailTop, DashboardView } from '../../components/admin';
import { listAdminOrders, listAdminProducts } from '../../services/commerce';
import type { AdminView } from './types';

type DashboardSectionProps = {
  isReady: boolean;
  onNavigate: (view: AdminView) => void;
};

export function DashboardSection({ isReady, onNavigate }: DashboardSectionProps) {
  const productsQuery = useQuery({
    queryKey: ['admin-products'],
    queryFn: listAdminProducts,
    enabled: isReady,
  });

  const ordersQuery = useQuery({
    queryKey: ['admin-orders'],
    queryFn: listAdminOrders,
    enabled: isReady,
  });

  const activeProducts = useMemo(
    () => productsQuery.data?.filter((p) => p.status === 'active').length ?? 0,
    [productsQuery.data],
  );

  const pendingPickupCount = useMemo(
    () => ordersQuery.data?.filter((o) => o.status === 'pending_pickup').length ?? 0,
    [ordersQuery.data],
  );

  return (
    <section className="admin-detail-pane">
      <AdminDetailTop />
      <DashboardView
        totalProducts={productsQuery.data?.length ?? 0}
        activeProducts={activeProducts}
        totalOrders={ordersQuery.data?.length ?? 0}
        pendingPickupCount={pendingPickupCount}
        isLoading={productsQuery.isLoading || ordersQuery.isLoading}
        onNavigate={onNavigate}
      />
    </section>
  );
}
