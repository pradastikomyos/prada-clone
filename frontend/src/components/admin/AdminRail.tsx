import {
  DashboardSquare03Icon,
  ImageAdd02Icon,
  Invoice03Icon,
  LayersLogoIcon,
  Payment02Icon,
  QrCodeScanIcon,
  Settings02Icon,
  ShoppingBag03Icon,
  Tag01Icon,
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
      <button className={`admin-rail-button ${currentView === 'payments' ? 'is-active' : ''}`} type="button" aria-label="Payment Health" title="Payment Health" onClick={() => onChangeView('payments')}>
        <AdminIcon icon={Payment02Icon} size={22} />
      </button>
      <button className={`admin-rail-button ${currentView === 'bopis' ? 'is-active' : ''}`} type="button" aria-label="Pickup" title="BOPIS Pickup" onClick={() => onChangeView('bopis')}>
        <AdminIcon icon={QrCodeScanIcon} size={22} />
      </button>
      <button className={`admin-rail-button ${currentView === 'cms' ? 'is-active' : ''}`} type="button" aria-label="CMS Assets" title="CMS Assets" onClick={() => onChangeView('cms')}>
        <AdminIcon icon={ImageAdd02Icon} size={22} />
      </button>
      <button className={`admin-rail-button ${currentView === 'banners' ? 'is-active' : ''}`} type="button" aria-label="Banners" title="Banner Manager" onClick={() => onChangeView('banners')}>
        <AdminIcon icon={LayersLogoIcon} size={22} />
      </button>
      <button className={`admin-rail-button ${currentView === 'categories' ? 'is-active' : ''}`} type="button" aria-label="Categories" title="Kategori Produk" onClick={() => onChangeView('categories')}>
        <AdminIcon icon={Tag01Icon} size={22} />
      </button>
      <button className={`admin-rail-button ${currentView === 'doku' ? 'is-active' : ''} admin-rail-bottom`} type="button" aria-label="Settings" title="Settings" onClick={() => onChangeView('doku')}>
        <AdminIcon icon={Settings02Icon} size={22} />
      </button>
    </aside>
  );
}
