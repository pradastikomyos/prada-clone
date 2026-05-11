import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Session } from '@supabase/supabase-js';
import {
  AdminDetailTop,
  AdminProductListPane,
  AdminRail,
  AdminSidebar,
  DokuCheckoutCard,
  InventoryDetailCard,
  OrdersCard,
  PickupVerificationCard,
  ProductFormCard,
  DashboardView,
} from '../components/admin';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { getCurrentUserRole } from '../services/auth';
import {
  createDokuCheckout,
  createProduct,
  listAdminOrders,
  listAdminProducts,
  updateProductStatus,
  updateVariantStock,
  verifyPickupCode,
} from '../services/commerce';
import { ProductFormInput } from '../types/commerce';

const currency = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const initialProductForm: ProductFormInput = {
  name: '',
  slug: '',
  sku: '',
  description: '',
  category: 'CLOTHING',
  status: 'active',
  priceIdr: 199000,
  stockQuantity: 10,
  imageUrl: '',
};

export function AdminPage() {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<'admin' | 'customer' | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<ProductFormInput>(initialProductForm);
  const [pickupCode, setPickupCode] = useState('');
  const [currentView, setCurrentView] = useState<'dashboard' | 'inventory' | 'orders' | 'bopis' | 'doku'>('inventory');
  const [checkoutCustomer, setCheckoutCustomer] = useState({
    name: 'Spark Demo Customer',
    email: 'demo@sparkstage.local',
    phone: '6281234567890',
  });
  const [checkoutResult, setCheckoutResult] = useState<{ invoice_number: string; payment_url: string } | null>(null);

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
    if (!isSupabaseConfigured) return;

    if (!session || role) {
      return;
    }

    setIsCheckingAuth(true);
    getCurrentUserRole()
      .then((nextRole) => setRole(nextRole))
      .catch(() => setRole(null))
      .finally(() => setIsCheckingAuth(false));
  }, [session, role]);

  useEffect(() => {
    if (!isSupabaseConfigured || isCheckingAuth) return;

    if (!session) {
      window.location.href = `/login.html?redirect=${encodeURIComponent('/admin.html')}`;
      return;
    }

    if (role && role !== 'admin') {
      setRole(null);
      window.location.href = '/login.html';
    }
  }, [isCheckingAuth, role, session]);

  const productsQuery = useQuery({
    queryKey: ['admin-products'],
    queryFn: listAdminProducts,
    enabled: Boolean(session && role === 'admin'),
  });

  const ordersQuery = useQuery({
    queryKey: ['admin-orders'],
    queryFn: listAdminOrders,
    enabled: Boolean(session && role === 'admin'),
  });

  const primaryProduct = useMemo(() => productsQuery.data?.find((product) => product.status === 'active'), [productsQuery.data]);
  const primaryVariant = primaryProduct?.product_variants?.[0];
  const selectedProduct = useMemo(
    () => productsQuery.data?.find((product) => product.id === selectedProductId) ?? productsQuery.data?.[0],
    [productsQuery.data, selectedProductId],
  );
  const selectedOrder = useMemo(
    () => ordersQuery.data?.find((order) => order.id === selectedOrderId) ?? ordersQuery.data?.[0],
    [ordersQuery.data, selectedOrderId],
  );
  const totalStock = useMemo(
    () => productsQuery.data?.reduce((sum, product) => sum + (product.product_variants?.[0]?.stock_quantity ?? 0), 0) ?? 0,
    [productsQuery.data],
  );
  const pendingPickupCount = useMemo(
    () => ordersQuery.data?.filter((order) => order.status === 'pending_pickup').length ?? 0,
    [ordersQuery.data],
  );

  const createProductMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      setProductForm(initialProductForm);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ productId, status }: { productId: string; status: 'draft' | 'active' | 'archived' }) =>
      updateProductStatus(productId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  const stockMutation = useMutation({
    mutationFn: ({ variantId, stockQuantity }: { variantId: string; stockQuantity: number }) =>
      updateVariantStock(variantId, stockQuantity),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  const pickupMutation = useMutation({
    mutationFn: verifyPickupCode,
    onSuccess: () => {
      setPickupCode('');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: createDokuCheckout,
    onSuccess: (result) => {
      setCheckoutResult(result);
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
  });

  const signOut = async () => {
    await supabase?.auth.signOut();
    window.location.href = '/login.html';
  };

  const submitProduct = (event: FormEvent) => {
    event.preventDefault();
    createProductMutation.mutate(productForm);
  };

  const submitPickup = (event: FormEvent) => {
    event.preventDefault();
    pickupMutation.mutate(pickupCode);
  };

  const runCheckoutDemo = () => {
    if (!primaryProduct) return;

    checkoutMutation.mutate({
      customer: checkoutCustomer,
      items: [{
        product_id: primaryProduct.id,
        variant_id: primaryVariant?.id,
        quantity: 1,
      }],
    });
  };

  if (!isSupabaseConfigured) {
    return (
      <main className="admin-page">
        <section className="admin-panel">
          <p className="admin-eyebrow">CMS Admin</p>
          <h1>Supabase env belum tersedia</h1>
          <p>Isi `frontend/.env.local` dengan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`, lalu restart dev server.</p>
        </section>
      </main>
    );
  }

  if (isCheckingAuth || !session) {
    return (
      <main className="admin-page">
        <section className="admin-panel">
          <p className="admin-eyebrow">Spark Stage CMS</p>
          <h1>Checking session</h1>
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
          <p className="admin-muted">Akun ini bukan admin. Silakan login dengan akun admin untuk membuka CMS.</p>
          <button type="button" onClick={signOut}>Use another account</button>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-app">
      <div className={`admin-window ${currentView !== 'inventory' ? 'is-wide' : ''}`}>
        <AdminRail currentView={currentView} onChangeView={setCurrentView} />

        <AdminSidebar
          email={session.user.email}
          totalStock={totalStock}
          currentView={currentView}
          onChangeView={setCurrentView}
          onAddProduct={() => {
            setCurrentView('inventory');
            setTimeout(() => document.getElementById('admin-add-product')?.scrollIntoView({ behavior: 'smooth' }), 100);
          }}
          onSignOut={signOut}
        />

        {currentView === 'inventory' && (
          <AdminProductListPane
            products={productsQuery.data}
            selectedProductId={selectedProduct?.id}
            activeCount={productsQuery.data?.filter((product) => product.status === 'active').length ?? 0}
            pendingPickupCount={pendingPickupCount}
            isLoading={productsQuery.isLoading}
            onRefresh={() => productsQuery.refetch()}
            onSelectProduct={setSelectedProductId}
            onAddProduct={() => document.getElementById('admin-add-product')?.scrollIntoView({ behavior: 'smooth' })}
            formatCurrency={(value) => currency.format(value)}
          />
        )}

        <section className="admin-detail-pane">
          <AdminDetailTop />

          {currentView === 'dashboard' && (
            <DashboardView
              totalProducts={productsQuery.data?.length ?? 0}
              activeProducts={productsQuery.data?.filter((product) => product.status === 'active').length ?? 0}
              totalOrders={ordersQuery.data?.length ?? 0}
              pendingPickupCount={pendingPickupCount}
              isLoading={productsQuery.isLoading || ordersQuery.isLoading}
              onNavigate={setCurrentView}
            />
          )}

          {currentView === 'inventory' && (
            <>
              <InventoryDetailCard
                product={selectedProduct}
                onStockChange={(variantId, stockQuantity) => stockMutation.mutate({ variantId, stockQuantity })}
                onStatusChange={(productId, status) => statusMutation.mutate({ productId, status })}
                onBack={() => setSelectedProductId(null)}
                formatCurrency={(value) => currency.format(value)}
              />

              <section className="admin-content-grid" id="admin-add-product">
                <ProductFormCard
                  form={productForm}
                  error={createProductMutation.error}
                  isPending={createProductMutation.isPending}
                  onChange={setProductForm}
                  onSubmit={submitProduct}
                />
              </section>
            </>
          )}

          {currentView === 'orders' && (
            <OrdersCard
              orders={ordersQuery.data}
              selectedOrder={selectedOrder}
              isLoading={ordersQuery.isLoading}
              onSelectOrder={setSelectedOrderId}
              onRefresh={() => ordersQuery.refetch()}
              formatCurrency={(value) => currency.format(value)}
            />
          )}

          {currentView === 'bopis' && (
            <PickupVerificationCard
              pickupCode={pickupCode}
              error={pickupMutation.error}
              isPending={pickupMutation.isPending}
              isVerified={Boolean(pickupMutation.data)}
              onPickupCodeChange={setPickupCode}
              onSubmit={submitPickup}
            />
          )}

          {currentView === 'doku' && (
            <DokuCheckoutCard
              customer={checkoutCustomer}
              error={checkoutMutation.error}
              isPending={checkoutMutation.isPending}
              primaryProductName={primaryProduct?.name}
              result={checkoutResult}
              onCustomerChange={setCheckoutCustomer}
              onCreateCheckout={runCheckoutDemo}
            />
          )}
        </section>
      </div>
    </main>
  );
}
