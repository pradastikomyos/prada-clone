import {
  DashboardSquare03Icon,
  Invoice03Icon,
  QrCodeScanIcon,
  Settings02Icon,
  ShoppingBag03Icon,
} from '@hugeicons/core-free-icons';
import { AdminIcon } from './AdminIcon';
import type { AdminView } from '../../pages/admin/types';

export function AdminRail({ currentView, onChangeView }: { currentView: AdminView; onChangeView: (view: AdminView) => void }) {
  return (
    <aside className="admin-rail" aria-label="Primary admin tools">
      <div className="admin-rail-logo">S</div>
      <button className={`admin-rail-button ${currentView === 'dashboard' ? 'is-active' : ''}`} type="button" aria-label="Dashboard" title="Dashboard" onClick={() => onChangeView('dashboard')}>
        <AdminIcon icon={DashboardSquare03Icon} size={22} />
      </button>
      <button className={`admin-rail-button ${currentView === 'inventory' ? 'is-active' : ''}`} type="button" aria-label="Products" title="Products" onClick={() => onChangeView('inventory')}>
        <AdminIcon icon={ShoppingBag03Icon} size={22} />
      </button>
      <button className={`admin-rail-button ${currentView === 'orders' ? 'is-active' : ''}`} type="button" aria-label="Orders" title="Orders" onClick={() => onChangeView('orders')}>
        <AdminIcon icon={Invoice03Icon} size={22} />
      </button>
      <button className={`admin-rail-button ${currentView === 'bopis' ? 'is-active' : ''}`} type="button" aria-label="Pickup" title="BOPIS Pickup" onClick={() => onChangeView('bopis')}>
        <AdminIcon icon={QrCodeScanIcon} size={22} />
      </button>
      <button className={`admin-rail-button ${currentView === 'doku' ? 'is-active' : ''} admin-rail-bottom`} type="button" aria-label="Settings" title="Settings" onClick={() => onChangeView('doku')}>
        <AdminIcon icon={Settings02Icon} size={22} />
      </button>
    </aside>
  );
}
