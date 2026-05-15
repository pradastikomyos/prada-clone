/**
 * AdminPage — auth guard + URL-synced tab shell.
 *
 * Responsibilities:
 *  1. Verify Supabase is configured.
 *  2. Check session + role (admin only).
 *  3. Sync the active tab with the `?tab=` URL search param so:
 *     - Refresh stays on the same tab.
 *     - Browser back/forward navigates between tabs.
 *     - Deep links like /admin.html?tab=bopis work.
 *  4. Render the correct section component.
 *
 * All data fetching, mutations, and local state live inside the section
 * components (InventorySection, OrdersSection, BopisSection, DokuSection,
 * DashboardSection). This file stays intentionally thin.
 */

import { lazy, Suspense, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { AdminRail, AdminMobileNav, AdminSidebar } from '../components/admin';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { getCurrentUserRole } from '../services/auth';
import { ADMIN_VIEWS, type AdminView } from './admin/types';

// Section components are lazy-loaded so each section's bundle is only
// downloaded when the admin first navigates to that tab.
const InventorySection = lazy(() =>
  import('./admin/InventorySection').then((m) => ({ default: m.InventorySection })),
);
const OrdersSection = lazy(() =>
  import('./admin/OrdersSection').then((m) => ({ default: m.OrdersSection })),
);
const PaymentHealthSection = lazy(() =>
  import('./admin/PaymentHealthSection').then((m) => ({ default: m.PaymentHealthSection })),
);
const BopisSection = lazy(() =>
  import('./admin/BopisSection').then((m) => ({ default: m.BopisSection })),
);
const DashboardSection = lazy(() =>
  import('./admin/DashboardSection').then((m) => ({ default: m.DashboardSection })),
);
const CmsSection = lazy(() =>
  import('./admin/CmsSection').then((m) => ({ default: m.CmsSection })),
);
const BannerSection = lazy(() =>
  import('./admin/BannerSection').then((m) => ({ default: m.BannerSection })),
);
const CategorySection = lazy(() =>
  import('./admin/CategorySection').then((m) => ({ default: m.CategorySection })),
);

function SectionFallback() {
  return (
    <section className="admin-detail-pane">
      <div className="admin-panel" style={{ padding: '48px 32px' }}>
        <p className="admin-eyebrow">Loading…</p>
      </div>
    </section>
  );
}

export function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<'admin' | 'customer' | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const navigate = useNavigate();
  const { tab: rawTab } = useParams<{ tab: string }>();
  const tab: AdminView = (rawTab && (ADMIN_VIEWS as readonly string[]).includes(rawTab))
    ? rawTab as AdminView
    : 'inventory';

  const setTab = (next: AdminView) => navigate(`/admin/${next}`, { replace: true });
  const totalStockQuery = useQuery({
    queryKey: ['admin-total-stock'],
    enabled: Boolean(session && role === 'admin'),
    queryFn: async () => {
      // TODO: Kiro — verifikasi RLS allow admin read all variants.
      if (!supabase) return 0;
      const { data, error } = await supabase
        .from('product_variants')
        .select('stock_quantity');
      if (error) return 0;
      return (data ?? []).reduce((sum, row) => sum + Number((row as { stock_quantity?: number }).stock_quantity ?? 0), 0);
    },
  });

  // ── Auth ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!supabase) return undefined;

    let isMounted = true;
    setIsCheckingAuth(true);

    supabase.auth
      .getSession()
      .then(async ({ data, error }) => {
        if (!isMounted) return;
        if (error) throw error;

        setSession(data.session);

        if (!data.session) {
          setRole(null);
          setIsCheckingAuth(false);
          return;
        }

        const nextRole = await getCurrentUserRole();
        if (!isMounted) return;
        setRole(nextRole);
        setIsCheckingAuth(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setSession(null);
        setRole(null);
        setIsCheckingAuth(false);
      });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setRole(null);
        setIsCheckingAuth(false);
      } else {
        setRole(null);
        setIsCheckingAuth(true);
      }
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !session || role) return;
    setIsCheckingAuth(true);
    getCurrentUserRole()
      .then((nextRole) => setRole(nextRole))
      .catch(() => setRole(null))
      .finally(() => setIsCheckingAuth(false));
  }, [session, role]);

  useEffect(() => {
    if (!isSupabaseConfigured || isCheckingAuth) return;
    // ProtectedRoute in router.tsx handles redirect to /login and / for unauthorized.
    // AdminPage only needs to handle the role check for the "use another account" UI.
    if (role && role !== 'admin') {
      setRole(null);
    }
  }, [isCheckingAuth, role, session]);

  // ── Early returns ─────────────────────────────────────────────────────────

  if (!isSupabaseConfigured) {
    return (
      <main className="admin-page">
        <section className="admin-panel">
          <p className="admin-eyebrow">CMS Admin</p>
          <h1>Supabase env belum tersedia</h1>
          <p>
            Isi <code>frontend/.env.local</code> dengan{' '}
            <code>VITE_SUPABASE_URL</code> dan <code>VITE_SUPABASE_ANON_KEY</code>,
            lalu restart dev server.
          </p>
        </section>
      </main>
    );
  }

  if (isCheckingAuth || !session) {
    return (
      <main className="admin-page">
        <section className="admin-panel">
          <p className="admin-eyebrow">Spark Stage CMS</p>
          <h1>Checking session…</h1>
        </section>
      </main>
    );
  }

  if (role !== 'admin') {
    return (
      <main className="admin-page">
        <section className="admin-panel">
          <p className="admin-eyebrow">Spark Stage CMS</p>
          <h1>Access denied</h1>
          <p className="admin-muted">
            Akun ini bukan admin. Silakan login dengan akun admin untuk membuka CMS.
          </p>
          <button
            type="button"
            onClick={async () => {
              await supabase?.auth.signOut();
              window.location.href = '/';
            }}
          >
            Use another account
          </button>
        </section>
      </main>
    );
  }

  // ── Shell ─────────────────────────────────────────────────────────────────

  const isReady = Boolean(session && role === 'admin');

  const handleAddProduct = () => {
    setTab('inventory');
    // Give React one tick to mount InventorySection before scrolling.
    setTimeout(
      () => document.getElementById('admin-add-product')?.scrollIntoView({ behavior: 'smooth' }),
      100,
    );
  };

  const signOut = async () => {
    await supabase?.auth.signOut();
    window.location.href = '/';
  };

  return (
    <main className="admin-app">
      <div className={`admin-window ${tab !== 'inventory' ? 'is-wide' : ''}`}>
        <AdminRail currentView={tab} onChangeView={setTab} />

        <AdminSidebar
          email={session.user.email}
          totalStock={totalStockQuery.data ?? 0}
          currentView={tab}
          onChangeView={setTab}
          onAddProduct={handleAddProduct}
          onSignOut={signOut}
        />

        <Suspense fallback={<SectionFallback />}>
          {tab === 'dashboard' && (
            <DashboardSection isReady={isReady} onNavigate={setTab} />
          )}
          {tab === 'inventory' && <InventorySection isReady={isReady} />}
          {tab === 'orders' && <OrdersSection isReady={isReady} />}
          {tab === 'payments' && <PaymentHealthSection isReady={isReady} />}
          {tab === 'bopis' && <BopisSection />}
          {tab === 'cms' && <CmsSection isReady={isReady} />}
          {tab === 'banners' && <BannerSection isReady={isReady} />}
          {tab === 'categories' && <CategorySection isReady={isReady} />}
        </Suspense>

        <AdminMobileNav currentView={tab} onChangeView={setTab} />
      </div>
    </main>
  );
}
