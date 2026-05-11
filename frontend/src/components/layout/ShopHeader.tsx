import { BrandLogo } from '../ui/BrandLogo';
import { useUIStore } from '../../store/uiStore';
import { useCartSummary } from '../../hooks/useCartSummary';

export function ShopHeader() {
  const setCartDrawerOpen = useUIStore((state) => state.setCartDrawerOpen);
  const { itemCount } = useCartSummary();

  return (
    <header className="shop-header">
      <div className="shop-header-left">
        <a href="index.html" className="back-link" aria-label="Back to homepage">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </a>
      </div>
      <div className="shop-header-center">
        <a href="index.html" aria-label="Spark Stage home"><BrandLogo /></a>
      </div>
      <div className="shop-header-right">
          <a href="login.html">Account</a>
          <button type="button" className="shop-header-link" onClick={() => setCartDrawerOpen(true)}>
            Cart{itemCount > 0 ? <span className="cart-badge">({itemCount})</span> : null}
          </button>
      </div>
    </header>
  );
}
