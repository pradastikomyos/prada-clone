import { Link } from 'react-router-dom';
import { BrandLogo } from '../ui/BrandLogo';
import { MenuIcon, SearchIcon } from '../ui/Icons';
import { UserHeaderActions } from '../ui/UserHeaderActions';
import { CartHeaderButton } from '../ui/CartHeaderButton';
import { useUIStore } from '../../store/uiStore';

export function ShopHeader() {
  const { setMenuOpen, setSearchOpen } = useUIStore();

  return (
    <header className="shop-header">
      <div className="shop-header-left">
        <button className="listing-menu-btn" type="button" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
          <MenuIcon />
          <span>Menu</span>
        </button>
        <button className="listing-search-link is-placeholder" type="button" aria-label="Search" onClick={() => setSearchOpen(true)}>
          <SearchIcon />
          <span>Search</span>
        </button>
      </div>
      <div className="shop-header-center">
        <Link to="/" aria-label="Spark Stage home"><BrandLogo /></Link>
      </div>
      <div className="shop-header-right">
        <UserHeaderActions />
        <CartHeaderButton className="shop-header-link" />
      </div>
    </header>
  );
}
