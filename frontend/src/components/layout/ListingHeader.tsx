import { BrandLogo } from '../ui/BrandLogo';
import { SearchIcon } from '../ui/Icons';
import { UserHeaderActions } from '../ui/UserHeaderActions';
import { CartHeaderButton } from '../ui/CartHeaderButton';
import { useUIStore } from '../../store/uiStore';
import { ListingMenu } from '../navigation/ListingMenu';

export function ListingHeader() {
  const { setSearchOpen } = useUIStore();

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
        <UserHeaderActions />
        <CartHeaderButton className="listing-contact" />
      </div>
    </header>
  );
}
