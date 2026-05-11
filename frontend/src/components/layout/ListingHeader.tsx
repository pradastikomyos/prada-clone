import { BrandLogo } from '../ui/BrandLogo';
import { SearchIcon } from '../ui/Icons';
import { useUIStore } from '../../store/uiStore';
import { ListingMenu } from '../navigation/ListingMenu';
import { useCartSummary } from '../../hooks/useCartSummary';

export function ListingHeader() {
  const { setSearchOpen, setCartDrawerOpen } = useUIStore();
  const { itemCount } = useCartSummary();

  return (
    <header className="listing-header">
      <div className="listing-header-left">
        <ListingMenu />
        <button className="listing-search-link is-placeholder" type="button" aria-label="Search" onClick={() => setSearchOpen(true)} style={{ marginLeft: '16px' }}>
          <SearchIcon />
          <span>Search</span>
        </button>
      </div>
      <a href="index.html" className="listing-logo" aria-label="Spark Stage home"><BrandLogo /></a>
      <div className="listing-header-right">
        <button type="button" className="listing-contact" onClick={() => setCartDrawerOpen(true)}>
          Cart{itemCount > 0 ? <span className="cart-badge">({itemCount})</span> : null}
        </button>
      </div>
    </header>
  );
}
