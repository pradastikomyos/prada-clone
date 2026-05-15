import {
  Add01Icon,
  DashboardSquare03Icon,
  ImageAdd02Icon,
  Invoice03Icon,
  LayersLogoIcon,
  Logout03Icon,
  PackageIcon,
  Payment02Icon,
  QrCodeScanIcon,
  Search01Icon,
  Store03Icon,
  Tag01Icon,
  UserCircleIcon,
} from '@hugeicons/core-free-icons';
import { NumberTicker } from '../ui/number-ticker';
import { AdminIcon } from './AdminIcon';
import type { AdminView } from '../../pages/admin/types';

type AdminSidebarProps = {
  email?: string;
  totalStock: number;
  currentView: AdminView;
  onChangeView: (view: AdminView) => void;
  onAddProduct: () => void;
  onSignOut: () => void;
};

export function AdminSidebar({ email, totalStock, currentView, onChangeView, onAddProduct, onSignOut }: AdminSidebarProps) {
  return (
    <aside className="admin-sidebar">
      <section className="admin-user-card">
        <div className="admin-avatar">
          <AdminIcon icon={UserCircleIcon} size={28} />
        </div>
        <div>
          <strong>Admin Spark</strong>
          <span>{email}</span>
        </div>
      </section>

      <label className="admin-side-search">
        <AdminIcon icon={Search01Icon} size={18} />
        <input placeholder="Search" />
        <kbd>Ctrl K</kbd>
      </label>

      <button className="admin-compose" type="button" onClick={onAddProduct}>
        <AdminIcon icon={Add01Icon} size={20} />
        Add product
      </button>

      <nav className="admin-nav" aria-label="CMS sections">
        <p>Navigation</p>
        <button className={currentView === 'dashboard' ? 'is-current' : ''} type="button" onClick={() => onChangeView('dashboard')}>
          <span><AdminIcon icon={DashboardSquare03Icon} size={18} /> Dashboard</span>
        </button>
        <button className={currentView === 'inventory' ? 'is-current' : ''} type="button" onClick={() => onChangeView('inventory')}>
          <span><AdminIcon icon={PackageIcon} size={18} /> Inventory</span>
        </button>
        <button className={currentView === 'orders' ? 'is-current' : ''} type="button" onClick={() => onChangeView('orders')}>
          <span><AdminIcon icon={Invoice03Icon} size={18} /> Orders</span>
        </button>
        <button className={currentView === 'payments' ? 'is-current' : ''} type="button" onClick={() => onChangeView('payments')}>
          <span><AdminIcon icon={Payment02Icon} size={18} /> Payment Health</span>
        </button>
        <button className={currentView === 'bopis' ? 'is-current' : ''} type="button" onClick={() => onChangeView('bopis')}>
          <span><AdminIcon icon={QrCodeScanIcon} size={18} /> BOPIS Verify</span>
        </button>
        <button className={currentView === 'cms' ? 'is-current' : ''} type="button" onClick={() => onChangeView('cms')}>
          <span><AdminIcon icon={ImageAdd02Icon} size={18} /> CMS Assets</span>
        </button>
        <button className={currentView === 'banners' ? 'is-current' : ''} type="button" onClick={() => onChangeView('banners')}>
          <span><AdminIcon icon={LayersLogoIcon} size={18} /> Banners</span>
        </button>
        <button className={currentView === 'categories' ? 'is-current' : ''} type="button" onClick={() => onChangeView('categories')}>
          <span><AdminIcon icon={Tag01Icon} size={18} /> Kategori</span>
        </button>
      </nav>

      <div className="admin-sidebar-card">
        <div>
          <AdminIcon icon={Store03Icon} size={20} />
          <strong>
            <NumberTicker value={totalStock} className="tracking-normal text-inherit" />
          </strong>
        </div>
        <span>Total stock available</span>
      </div>

      <button className="admin-support-link" type="button" onClick={onSignOut}>
        <span><AdminIcon icon={Logout03Icon} size={19} /> Sign out</span>
      </button>
    </aside>
  );
}
