import { ShoppingCart } from '@phosphor-icons/react';
import { useUIStore } from '../../store/uiStore';
import { useCartSummary } from '../../hooks/useCartSummary';
import { useAuthUserId } from '../../hooks/useCartSummary';

type CartHeaderButtonProps = {
  /** Extra CSS class for the button element. */
  className?: string;
};

/**
 * Cart trigger button for all storefront headers.
 *
 * - Guest: shows text "Cart" (no icon, no badge).
 * - Logged in: shows ShoppingCart icon + badge when itemCount > 0.
 *
 * Always opens the CartDrawer on click.
 */
export function CartHeaderButton({ className }: CartHeaderButtonProps) {
  const setCartDrawerOpen = useUIStore((state) => state.setCartDrawerOpen);
  const { itemCount } = useCartSummary();
  const userId = useAuthUserId();
  const isLoggedIn = Boolean(userId);

  return (
    <button
      type="button"
      className={`cart-header-btn${className ? ` ${className}` : ''}`}
      aria-label={`Shopping cart${itemCount > 0 ? `, ${itemCount} item${itemCount > 1 ? 's' : ''}` : ''}`}
      onClick={() => setCartDrawerOpen(true)}
    >
      {isLoggedIn ? (
        <span className="cart-header-icon-wrap">
          <ShoppingCart size={20} weight="regular" />
          {itemCount > 0 && (
            <span className="cart-header-badge" aria-hidden="true">
              {itemCount}
            </span>
          )}
        </span>
      ) : (
        <span className="cart-header-text">
          Cart{itemCount > 0 ? <span className="cart-badge"> ({itemCount})</span> : null}
        </span>
      )}
    </button>
  );
}
