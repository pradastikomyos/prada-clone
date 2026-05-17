import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, useRouteError } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { RootLayout } from '../components/layout/RootLayout';

// Eagerly loaded pages (small, always needed on first paint)
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';

// Lazy-loaded pages — only downloaded when the user navigates there
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
const MenPage = lazy(() =>
  import('../pages/MenPage').then((m) => ({ default: m.MenPage })),
);
const ProductPage = lazy(() =>
  import('../pages/ProductPage').then((m) => ({ default: m.ProductPage })),
);
const AdminPage = lazy(() =>
  import('../pages/AdminPage').then((m) => ({ default: m.AdminPage })),
);
const CheckoutResultPage = lazy(() =>
  import('../pages/CheckoutResultPage').then((m) => ({ default: m.CheckoutResultPage })),
);
const MyOrdersPage = lazy(() =>
  import('../pages/MyOrdersPage').then((m) => ({ default: m.MyOrdersPage })),
);
const MyOrderDetailPage = lazy(() =>
  import('../pages/MyOrderDetailPage').then((m) => ({ default: m.MyOrderDetailPage })),
);

function PageFallback() {
  return <div className="page-fallback" aria-hidden="true" />;
}

/**
 * Handles stale chunk errors after a new deployment.
 * When Vite rebuilds with new hashes, old cached chunk URLs 404.
 * This catches that and reloads the page once to get fresh assets.
 */
function ChunkErrorBoundary() {
  const error = useRouteError() as Error | null;
  const isChunkError =
    error instanceof TypeError &&
    (error.message.includes('Failed to fetch dynamically imported module') ||
      error.message.includes('Importing a module script failed'));

  if (isChunkError) {
    // Auto-reload once to pick up new assets from the latest deploy
    if (!sessionStorage.getItem('chunk-reload')) {
      sessionStorage.setItem('chunk-reload', '1');
      window.location.reload();
      return null;
    }
    // If reload didn't fix it, show a friendly message
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24, fontFamily: 'sans-serif' }}>
        <p style={{ fontSize: 15, color: '#555', textAlign: 'center', maxWidth: 360 }}>
          Versi baru tersedia. Silakan refresh halaman untuk melanjutkan.
        </p>
        <button
          type="button"
          onClick={() => { sessionStorage.removeItem('chunk-reload'); window.location.reload(); }}
          style={{ padding: '10px 24px', background: '#111', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
        >
          Refresh Halaman
        </button>
      </div>
    );
  }

  // Non-chunk error — show generic message
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, padding: 24, fontFamily: 'sans-serif' }}>
      <p style={{ fontSize: 15, color: '#555', textAlign: 'center', maxWidth: 360 }}>
        Terjadi kesalahan. Silakan kembali ke beranda.
      </p>
      <a href="/" style={{ padding: '10px 24px', background: '#111', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
        Kembali ke Beranda
      </a>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <ChunkErrorBoundary />,
    children: [
      // ── Public routes ────────────────────────────────────────────────
      { path: '/', element: <HomePage /> },
      { path: '/login', element: <LoginPage /> },
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
        element: <Navigate to="/women/new-arrivals" replace />,
      },
      {
        path: '/women/new-arrivals',
        element: (
          <Suspense fallback={<PageFallback />}>
            <ListingPageWomen />
          </Suspense>
        ),
      },
      {
        path: '/men/new-arrivals',
        element: (
          <Suspense fallback={<PageFallback />}>
            <ListingPageMen />
          </Suspense>
        ),
      },
      {
        path: '/men',
        element: (
          <Suspense fallback={<PageFallback />}>
            <MenPage />
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
      {
        path: '/checkout-result',
        element: (
          <Suspense fallback={<PageFallback />}>
            <CheckoutResultPage />
          </Suspense>
        ),
      },
      {
        path: '/my-orders',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<PageFallback />}>
              <MyOrdersPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/my-orders/:invoice',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<PageFallback />}>
              <MyOrderDetailPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },

      // ── Protected: admin ─────────────────────────────────────────────
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

      // ── Legacy .html redirects (keep old bookmarks/links working) ────
      { path: '/index.html',        element: <Navigate to="/" replace /> },
      { path: '/login.html',        element: <Navigate to="/login" replace /> },
      { path: '/women.html',        element: <Navigate to="/women" replace /> },
      { path: '/men.html',          element: <Navigate to="/men" replace /> },
      { path: '/new-arrivals.html', element: <Navigate to="/new-arrivals" replace /> },
      { path: '/product.html',      element: <Navigate to="/" replace /> },
      { path: '/admin.html',        element: <Navigate to="/admin" replace /> },

      // ── 404 ──────────────────────────────────────────────────────────
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
