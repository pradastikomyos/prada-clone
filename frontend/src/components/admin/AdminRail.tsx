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
import { HugeiconsIcon } from '@hugeicons/react';
import type { AdminView } from '../../pages/admin/types';

// Mobile bottom nav — only the most important tabs
const MOBILE_TABS: { view: AdminView; icon: any; label: string }[] = [
  { view: 'dashboard', icon: DashboardSquare03Icon, label: 'Dashboard' },
  { view: 'inventory', icon: ShoppingBag03Icon, label: 'Produk' },
  { view: 'orders', icon: Invoice03Icon, label: 'Pesanan' },
  { view: 'bopis', icon: QrCodeScanIcon, label: 'Scan QR' },
  { view: 'cms', icon: ImageAdd02Icon, label: 'CMS' },
];

export function AdminMobileNav({ currentView, onChangeView }: { currentView: AdminView; onChangeView: (view: AdminView) => void }) {
  return (
    <nav className="admin-mobile-nav" aria-label="Admin navigation">
      {MOBILE_TABS.map(({ view, icon, label }) => (
        <button
          key={view}
          type="button"
          className={`admin-mobile-nav__btn${currentView === view ? ' is-active' : ''}`}
          onClick={() => onChangeView(view)}
          aria-label={label}
        >
          <HugeiconsIcon icon={icon} size={22} strokeWidth={currentView === view ? 2 : 1.5} />
          {label}
        </button>
      ))}
    </nav>
  );
}

export function AdminRail({ currentView, onChangeView }: { currentView: AdminView; onChangeView: (view: AdminView) => void }) {
  return (
    <aside className="admin-rail" aria-label="Primary admin tools">
      <div className="admin-rail-logo">S</div>
      <button className={`admin-rail-button ${currentView === 'dashboard' ? 'is-active' : ''}`} type="button" aria-label="Dashboard" title="Dashboard" onClick={() => onChangeView('dashboard')}>
        <HugeiconsIcon icon={DashboardSquare03Icon} size={22} strokeWidth={1.5} />
      </button>
      <button className={`admin-rail-button ${currentView === 'inventory' ? 'is-active' : ''}`} type="button" aria-label="Products" title="Products" onClick={() => onChangeView('inventory')}>
        <HugeiconsIcon icon={ShoppingBag03Icon} size={22} strokeWidth={1.5} />
      </button>
      <button className={`admin-rail-button ${currentView === 'orders' ? 'is-active' : ''}`} type="button" aria-label="Orders" title="Orders" onClick={() => onChangeView('orders')}>
        <HugeiconsIcon icon={Invoice03Icon} size={22} strokeWidth={1.5} />
      </button>
      <button className={`admin-rail-button ${currentView === 'payments' ? 'is-active' : ''}`} type="button" aria-label="Payment Health" title="Payment Health" onClick={() => onChangeView('payments')}>
        <HugeiconsIcon icon={Payment02Icon} size={22} strokeWidth={1.5} />
      </button>
      <button className={`admin-rail-button ${currentView === 'bopis' ? 'is-active' : ''}`} type="button" aria-label="Pickup" title="BOPIS Pickup" onClick={() => onChangeView('bopis')}>
        <HugeiconsIcon icon={QrCodeScanIcon} size={22} strokeWidth={1.5} />
      </button>
      <button className={`admin-rail-button ${currentView === 'cms' ? 'is-active' : ''}`} type="button" aria-label="CMS Assets" title="CMS Assets" onClick={() => onChangeView('cms')}>
        <HugeiconsIcon icon={ImageAdd02Icon} size={22} strokeWidth={1.5} />
      </button>
      <button className={`admin-rail-button ${currentView === 'banners' ? 'is-active' : ''}`} type="button" aria-label="Banners" title="Banner Manager" onClick={() => onChangeView('banners')}>
        <HugeiconsIcon icon={LayersLogoIcon} size={22} strokeWidth={1.5} />
      </button>
      <button className={`admin-rail-button ${currentView === 'categories' ? 'is-active' : ''}`} type="button" aria-label="Categories" title="Kategori Produk" onClick={() => onChangeView('categories')}>
        <HugeiconsIcon icon={Tag01Icon} size={22} strokeWidth={1.5} />
      </button>
      <button className={`admin-rail-button ${currentView === 'doku' ? 'is-active' : ''} admin-rail-bottom`} type="button" aria-label="Settings" title="Settings" onClick={() => onChangeView('doku')}>
        <HugeiconsIcon icon={Settings02Icon} size={22} strokeWidth={1.5} />
      </button>
    </aside>
  );
}
