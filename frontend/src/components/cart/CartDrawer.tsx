import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Minus, Plus, Trash, X } from '@phosphor-icons/react';
import { useUIStore } from '../../store/uiStore';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import {
  getOrCreateActiveCart,
  listCartItems,
  removeCartItem,
  updateCartItemQuantity,
} from '../../services/cart';
import { createDokuCheckout } from '../../services/commerce';
import type { CartItem } from '../../types/commerce';
import '../../styles/cart.css';

const IDR = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

type AuthState = {
  userId: string | null;
  email: string | null;
};

function useAuthState(): AuthState {
  const [state, setState] = useState<AuthState>({ userId: null, email: null });

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) return;

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setState({
        userId: data.session?.user.id ?? null,
        email: data.session?.user.email ?? null,
      });
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({
        userId: session?.user.id ?? null,
        email: session?.user.email ?? null,
      });
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return state;
}

export function CartDrawer() {
  const cartDrawerOpen = useUIStore((state) => state.cartDrawerOpen);
  const setCartDrawerOpen = useUIStore((state) => state.setCartDrawerOpen);
  const { userId, email } = useAuthState();
  const queryClient = useQueryClient();

  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Lock background scroll while the drawer is open.
  useEffect(() => {
    if (!cartDrawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [cartDrawerOpen]);

  // Close on ESC.
  useEffect(() => {
    if (!cartDrawerOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCartDrawerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cartDrawerOpen, setCartDrawerOpen]);

  const itemsQuery = useQuery({
    queryKey: ['cart', userId],
    queryFn: async (): Promise<CartItem[]> => {
      if (!userId) return [];
      const { id } = await getOrCreateActiveCart(userId);
      return listCartItems(id);
    },
    enabled: cartDrawerOpen && isSupabaseConfigured && Boolean(userId),
  });

  const items = itemsQuery.data ?? [];
  const total = useMemo(
    () => items.reduce((acc, item) => acc + item.quantity * item.unit_price_idr, 0),
    [items],
  );

  const invalidateCart = () => {
    queryClient.invalidateQueries({ queryKey: ['cart', userId] });
    queryClient.invalidateQueries({ queryKey: ['cart-summary', userId] });
  };

  const updateMutation = useMutation({
    mutationFn: (payload: { itemId: string; quantity: number }) =>
      updateCartItemQuantity(payload.itemId, payload.quantity),
    onSuccess: invalidateCart,
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: string) => removeCartItem(itemId),
    onSuccess: invalidateCart,
  });

  const handleCheckout = async () => {
    if (!items.length || !email) return;
    setCheckoutError(null);
    setIsCheckingOut(true);
    try {
      const result = await createDokuCheckout({
        customer: {
          name: email ?? 'Customer',
          email: email ?? undefined,
          phone: '',
        },
        items: items.map((item) => ({
          product_id: item.product_id,
          variant_id: item.variant_id ?? undefined,
          quantity: item.quantity,
        })),
      });
      if (result?.payment_url) {
        window.location.href = result.payment_url;
        return;
      }
      setCheckoutError('Checkout did not return a payment URL.');
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : 'Checkout failed.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const guest = !userId;
  const loginHref = (() => {
    if (typeof window === 'undefined') return '/login.html';
    const redirect = window.location.pathname + window.location.search;
    return `/login.html?redirect=${encodeURIComponent(redirect)}`;
  })();

  return (
    <div
      className={`cart-drawer-container${cartDrawerOpen ? ' is-open' : ''}`}
      aria-hidden={!cartDrawerOpen}
    >
      <div className="cart-drawer-scrim" onClick={() => setCartDrawerOpen(false)} />
      <aside
        className="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping bag"
      >
        <header className="cart-drawer-header">
          <h2 className="cart-drawer-title">Your Bag</h2>
          <button
            type="button"
            className="cart-drawer-close"
            aria-label="Close bag"
            onClick={() => setCartDrawerOpen(false)}
          >
            <X size={20} weight="regular" />
          </button>
        </header>

        <div className="cart-drawer-body">
          {!isSupabaseConfigured ? (
            <div className="cart-drawer-error">
              Supabase is not configured. The bag will be available once the
              environment is set up.
            </div>
          ) : guest ? (
            <div className="cart-drawer-guest">
              <p>Log in to see your bag.</p>
              <a href={loginHref}>Log in</a>
            </div>
          ) : itemsQuery.isLoading ? (
            <div className="cart-drawer-loading">Loading your bag…</div>
          ) : itemsQuery.isError ? (
            <div className="cart-drawer-error">
              {itemsQuery.error instanceof Error
                ? itemsQuery.error.message
                : 'Failed to load your bag.'}
            </div>
          ) : items.length === 0 ? (
            <div className="cart-drawer-empty">
              <p>Your bag is empty</p>
              <a href="/index.html">Continue shopping</a>
            </div>
          ) : (
            <ul className="cart-drawer-list">
              {items.map((item) => {
                const lineTotal = item.quantity * item.unit_price_idr;
                const busy =
                  (updateMutation.isPending &&
                    updateMutation.variables?.itemId === item.id) ||
                  (removeMutation.isPending && removeMutation.variables === item.id);
                return (
                  <li key={item.id} className="cart-drawer-item">
                    <div className="cart-drawer-item-image">
                      {item.product_image ? (
                        <img src={item.product_image} alt={item.product_name} />
                      ) : null}
                    </div>
                    <div className="cart-drawer-item-body">
                      <p className="cart-drawer-item-name">{item.product_name}</p>
                      {item.variant_name ? (
                        <p className="cart-drawer-item-variant">{item.variant_name}</p>
                      ) : null}
                      {item.sku ? <p className="cart-drawer-item-sku">SKU {item.sku}</p> : null}
                      <div className="cart-drawer-item-footer">
                        <div className="cart-drawer-qty" aria-label="Quantity">
                          <button
                            type="button"
                            className="cart-drawer-qty-btn"
                            aria-label="Decrease quantity"
                            disabled={busy}
                            onClick={() =>
                              updateMutation.mutate({
                                itemId: item.id,
                                quantity: item.quantity - 1,
                              })
                            }
                          >
                            <Minus size={12} />
                          </button>
                          <span className="cart-drawer-qty-value">{item.quantity}</span>
                          <button
                            type="button"
                            className="cart-drawer-qty-btn"
                            aria-label="Increase quantity"
                            disabled={busy}
                            onClick={() =>
                              updateMutation.mutate({
                                itemId: item.id,
                                quantity: item.quantity + 1,
                              })
                            }
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <span className="cart-drawer-item-line">{IDR.format(lineTotal)}</span>
                        <button
                          type="button"
                          className="cart-drawer-item-remove"
                          aria-label={`Remove ${item.product_name}`}
                          disabled={busy}
                          onClick={() => removeMutation.mutate(item.id)}
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {!guest && isSupabaseConfigured && items.length > 0 ? (
          <footer className="cart-drawer-footer">
            <div className="cart-drawer-total">
              <span>Total</span>
              <span className="cart-drawer-total-value">{IDR.format(total)}</span>
            </div>
            {checkoutError ? (
              <p className="cart-drawer-checkout-error">{checkoutError}</p>
            ) : null}
            <button
              type="button"
              className="cart-drawer-checkout"
              disabled={isCheckingOut}
              onClick={handleCheckout}
            >
              {isCheckingOut ? 'Processing…' : 'Checkout'}
            </button>
          </footer>
        ) : null}
      </aside>
    </div>
  );
}
