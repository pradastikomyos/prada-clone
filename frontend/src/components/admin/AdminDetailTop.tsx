import { Search01Icon, Settings02Icon } from '@hugeicons/core-free-icons';
import { AdminIcon } from './AdminIcon';

export function AdminDetailTop() {
  return (
    <header className="admin-detail-top">
      <label className="admin-global-search">
        <AdminIcon icon={Search01Icon} size={19} />
        <input placeholder="Search Anything..." />
      </label>
      <button className="admin-settings-button" type="button" aria-label="Settings">
        <AdminIcon icon={Settings02Icon} size={20} />
      </button>
    </header>
  );
}
