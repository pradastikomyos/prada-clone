import { Link } from 'react-router-dom';
import { BrandLogo } from '../ui/BrandLogo';
import { SearchIcon, MenuIcon } from '../ui/Icons';
import { UserHeaderActions } from '../ui/UserHeaderActions';
import { CartHeaderButton } from '../ui/CartHeaderButton';
import { useUIStore } from '../../store/uiStore';

export function ListingHeader() {
  const { setMenuOpen, setSearchOpen } = useUIStore();

  return (
    <header className="listing-header">
      <div className="listing-header-left">
        <button className="listing-menu-btn" type="button" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
          <MenuIcon />
          <span>Menu</span>
        </button>
        <button className="listing-search-link is-placeholder" type="button" aria-label="Search" onClick={() => setSearchOpen(true)}>
          <SearchIcon />
          <span>Search</span>
        </button>
      </div>
      <Link to="/" className="listing-logo" aria-label="Spark Stage home"><BrandLogo /></Link>
      <div className="listing-header-right">
        <UserHeaderActions />
        <CartHeaderButton className="listing-contact" />
      </div>
    </header>
  );
}
