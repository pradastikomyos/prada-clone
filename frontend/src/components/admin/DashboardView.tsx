import {
  PackageIcon,
  ShoppingBag03Icon,
  Invoice03Icon,
  Payment02Icon,
  QrCodeScanIcon,
  ArrowUp02Icon,
  ArrowDown02Icon,
} from '@hugeicons/core-free-icons';
import { AdminIcon } from './AdminIcon';
import { NumberTicker } from '../ui/number-ticker';
import { MetricSkeleton } from './AdminSkeleton';

import type { AdminView } from '../../pages/admin/types';

type DashboardViewProps = {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingPickupCount: number;
  isLoading: boolean;
  onNavigate: (view: AdminView) => void;
};

export function DashboardView({
  totalProducts,
  activeProducts,
  totalOrders,
  pendingPickupCount,
  isLoading,
  onNavigate,
}: DashboardViewProps) {
  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-header">
        <div>
          <p className="admin-eyebrow">Overview</p>
          <h2>Dashboard</h2>
        </div>
      </div>

      <div className="admin-kpi-grid">
        {isLoading ? (
          <>
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
          </>
        ) : (
          <>
            <button className="admin-kpi-card" type="button" onClick={() => onNavigate('inventory')}>
              <div className="admin-kpi-icon">
                <AdminIcon icon={PackageIcon} size={20} />
              </div>
              <span className="admin-kpi-label">Total Products</span>
              <strong className="admin-kpi-value">
                <NumberTicker value={totalProducts} className="tracking-normal text-inherit" />
              </strong>
            </button>
            <button className="admin-kpi-card" type="button" onClick={() => onNavigate('inventory')}>
              <div className="admin-kpi-icon admin-kpi-icon--active">
                <AdminIcon icon={ShoppingBag03Icon} size={20} />
              </div>
              <span className="admin-kpi-label">Active Listings</span>
              <strong className="admin-kpi-value">
                <NumberTicker value={activeProducts} className="tracking-normal text-inherit" />
              </strong>
              {totalProducts > 0 ? (
                <span className="admin-kpi-delta admin-kpi-delta--up">
                  <AdminIcon icon={ArrowUp02Icon} size={12} />
                  {Math.round((activeProducts / totalProducts) * 100)}%
                </span>
              ) : null}
            </button>
            <button className="admin-kpi-card" type="button" onClick={() => onNavigate('orders')}>
              <div className="admin-kpi-icon admin-kpi-icon--orders">
                <AdminIcon icon={Invoice03Icon} size={20} />
              </div>
              <span className="admin-kpi-label">Total Orders</span>
              <strong className="admin-kpi-value">
                <NumberTicker value={totalOrders} className="tracking-normal text-inherit" />
              </strong>
            </button>
            <button className="admin-kpi-card" type="button" onClick={() => onNavigate('bopis')}>
              <div className="admin-kpi-icon admin-kpi-icon--pickup">
                <AdminIcon icon={QrCodeScanIcon} size={20} />
              </div>
              <span className="admin-kpi-label">Pending Pickup</span>
              <strong className="admin-kpi-value">
                <NumberTicker value={pendingPickupCount} className="tracking-normal text-inherit" />
              </strong>
              {pendingPickupCount > 0 ? (
                <span className="admin-kpi-delta admin-kpi-delta--warning">
                  <AdminIcon icon={ArrowDown02Icon} size={12} />
                  Action needed
                </span>
              ) : (
                <span className="admin-kpi-delta admin-kpi-delta--muted">All clear</span>
              )}
            </button>
          </>
        )}
      </div>

      <div className="admin-dashboard-quicklinks">
        <p className="admin-eyebrow">Quick Actions</p>
        <div className="admin-quicklink-grid">
          <button className="admin-quicklink" type="button" onClick={() => onNavigate('inventory')}>
            <AdminIcon icon={PackageIcon} size={18} />
            Manage Inventory
          </button>
          <button className="admin-quicklink" type="button" onClick={() => onNavigate('orders')}>
            <AdminIcon icon={Invoice03Icon} size={18} />
            View Orders
          </button>
          <button className="admin-quicklink" type="button" onClick={() => onNavigate('payments')}>
            <AdminIcon icon={Payment02Icon} size={18} />
            Payment Health
          </button>
          <button className="admin-quicklink" type="button" onClick={() => onNavigate('bopis')}>
            <AdminIcon icon={QrCodeScanIcon} size={18} />
            Verify Pickup
          </button>
        </div>
      </div>
    </div>
  );
}
