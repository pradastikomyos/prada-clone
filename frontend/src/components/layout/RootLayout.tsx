import { Outlet } from 'react-router-dom';
import { HomepageMenu } from '../navigation/HomepageMenu';
import { SearchOverlay } from '../navigation/SearchOverlay';
import { CartDrawer } from '../cart/CartDrawer';
import { SiteFooter } from './SiteFooter';
import { useUIStore } from '../../store/uiStore';

/**
 * RootLayout — the persistent shell rendered inside RouterProvider.
 *
 * All global overlays (mega menu, search, cart drawer) live here so they
 * have access to RouterContext and can use <Link>, useNavigate, etc.
 *
 * <Outlet /> renders the matched child route (HomePage, LoginPage, etc.).
 *
 * UIStateContext and AuthGate are provided by App.tsx above the router
 * because they don't need router context themselves.
 */
export function RootLayout() {
  const { menuOpen, searchOpen, setMenuOpen, setSearchOpen } = useUIStore();

  return (
    <>
      <div
        className={`mega-menu-scrim${menuOpen ? ' active' : ''}`}
        onClick={() => setMenuOpen(false)}
      />
      <HomepageMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onSearchClick={() => setSearchOpen(true)}
      />
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <CartDrawer />

      <Outlet />
      <SiteFooter />
    </>
  );
}
