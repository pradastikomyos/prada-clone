import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';

// Eagerly loaded pages (small, always needed)
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';

// Lazy-loaded pages (only downloaded when navigated to)
const WomenPage = lazy(() =>
  import('../pages/WomenPage').then((m) => ({ default: m.WomenPage })),
);
const ListingPageWomen = lazy(() =>
  import('../pages/ListingPage').then((m) => ({
    default: () => <m.ListingPage kind="women" />,
  })),
);
const ListingPageMen = lazy(() =>
  import('../pages/ListingPage').then((m) => ({
    default: () => <m.ListingPage kind="men" />,
  })),
);
const ProductPage = lazy(() =>
  import('../pages/ProductPage').then((m) => ({ default: m.ProductPage })),
);
const AdminPage = lazy(() =>
  import('../pages/AdminPage').then((m) => ({ default: m.AdminPage })),
);

function PageFallback() {
  return (
    <div style={{ minHeight: '100vh', background: '#fff' }} aria-hidden="true" />
  );
}

export const router = createBrowserRouter([
  // ── Public routes ──────────────────────────────────────────────────────
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/women',
    element: (
      <Suspense fallback={<PageFallback />}>
        <WomenPage />
      </Suspense>
    ),
  },
  {
    path: '/new-arrivals',
    element: (
      <Suspense fallback={<PageFallback />}>
        <ListingPageWomen />
      </Suspense>
    ),
  },
  {
    path: '/men',
    element: (
      <Suspense fallback={<PageFallback />}>
        <ListingPageMen />
      </Suspense>
    ),
  },
  {
    path: '/product/:slug',
    element: (
      <Suspense fallback={<PageFallback />}>
        <ProductPage />
      </Suspense>
    ),
  },

  // ── Protected: admin ───────────────────────────────────────────────────
  {
    path: '/admin',
    element: <Navigate to="/admin/inventory" replace />,
  },
  {
    path: '/admin/:tab',
    element: (
      <ProtectedRoute adminOnly>
        <Suspense fallback={<PageFallback />}>
          <AdminPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  // ── Legacy .html redirects (keep old links working) ───────────────────
  { path: '/index.html',        element: <Navigate to="/" replace /> },
  { path: '/login.html',        element: <Navigate to="/login" replace /> },
  { path: '/women.html',        element: <Navigate to="/women" replace /> },
  { path: '/men.html',          element: <Navigate to="/men" replace /> },
  { path: '/new-arrivals.html', element: <Navigate to="/new-arrivals" replace /> },
  { path: '/product.html',      element: <Navigate to="/" replace /> },
  { path: '/admin.html',        element: <Navigate to="/admin" replace /> },

  // ── 404 ────────────────────────────────────────────────────────────────
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
