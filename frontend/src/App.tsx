import { lazy, Suspense, useMemo } from 'react';
import { UIStateContext } from './components/ui/UIStateContext';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { WomenPage } from './pages/WomenPage';
import { ListingPage } from './pages/ListingPage';
import { ProductPage } from './pages/ProductPage';

import { HomepageMenu } from './components/navigation/HomepageMenu';
import { SearchOverlay } from './components/navigation/SearchOverlay';
import { CartDrawer } from './components/cart/CartDrawer';
import { useUIStore } from './store/uiStore';

const AdminPage = lazy(() => import('./pages/AdminPage').then((module) => ({ default: module.AdminPage })));

export function App() {
  const path = window.location.pathname;
  const skeletonMode = useMemo(() => new URLSearchParams(window.location.search).has('skeleton'), []);
  const uiState = useMemo(() => ({ skeletonMode }), [skeletonMode]);
  
  const { menuOpen, searchOpen, setMenuOpen, setSearchOpen } = useUIStore();

  const page = path.endsWith('/login.html')
    ? <LoginPage />
    : path.endsWith('/admin.html')
      ? (
        <Suspense fallback={<main className="admin-page"><section className="admin-panel"><p className="admin-eyebrow">CMS Admin</p><h1>Loading admin</h1></section></main>}>
          <AdminPage />
        </Suspense>
      )
    : path.endsWith('/women.html')
      ? <WomenPage />
      : path.endsWith('/men.html')
        ? <ListingPage kind="men" />
        : path.endsWith('/new-arrivals.html')
          ? <ListingPage kind="women" />
          : path.endsWith('/product.html')
            ? <ProductPage />
            : <HomePage />;

  return (
    <UIStateContext.Provider value={uiState}>
      <div className={`mega-menu-scrim${menuOpen ? ' active' : ''}`} onClick={() => setMenuOpen(false)} />
      <HomepageMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} onSearchClick={() => setSearchOpen(true)} />
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <CartDrawer />
      {page}
    </UIStateContext.Provider>
  );
}
