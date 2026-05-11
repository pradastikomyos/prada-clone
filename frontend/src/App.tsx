import { useMemo } from 'react';
import { RouterProvider } from 'react-router-dom';
import { UIStateContext } from './components/ui/UIStateContext';
import { HomepageMenu } from './components/navigation/HomepageMenu';
import { SearchOverlay } from './components/navigation/SearchOverlay';
import { CartDrawer } from './components/cart/CartDrawer';
import { AuthGate } from './components/AuthGate';
import { useUIStore } from './store/uiStore';
import { router } from './app/router';

/**
 * App shell — mounts the router and global overlays (menu, search, cart).
 * UIStateContext provides skeletonMode (?skeleton query param) to all pages.
 */
export function App() {
  const skeletonMode = useMemo(
    () => new URLSearchParams(window.location.search).has('skeleton'),
    [],
  );
  const uiState = useMemo(() => ({ skeletonMode }), [skeletonMode]);

  const { menuOpen, searchOpen, setMenuOpen, setSearchOpen } = useUIStore();

  return (
    <AuthGate>
      <UIStateContext.Provider value={uiState}>
        {/* Global overlays — rendered outside RouterProvider so they persist across route changes */}
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

        <RouterProvider router={router} />
      </UIStateContext.Provider>
    </AuthGate>
  );
}
