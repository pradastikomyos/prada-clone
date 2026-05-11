import { Link } from 'react-router-dom';
import { BrandLogo } from '../ui/BrandLogo';
import { UserHeaderActions } from '../ui/UserHeaderActions';
import { CartHeaderButton } from '../ui/CartHeaderButton';

export function ShopHeader() {
  return (
    <header className="shop-header">
      <div className="shop-header-left">
        <Link to="/" className="back-link" aria-label="Back to homepage">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
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
