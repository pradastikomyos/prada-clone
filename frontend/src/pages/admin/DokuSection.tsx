/**
 * DokuSection — self-contained admin page for DOKU sandbox checkout testing.
 *
 * Owns:
 *  - checkoutCustomer state
 *  - checkoutResult state
 *  - createDokuCheckout mutation
 *
 * Rendered by AdminPage when tab === 'doku'.
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminDetailTop, DokuCheckoutCard } from '../../components/admin';
import { createDokuCheckout, listAdminProducts } from '../../services/commerce';

type DokuSectionProps = {
  isReady: boolean;
};

export function DokuSection({ isReady }: DokuSectionProps) {
  const queryClient = useQueryClient();

  const [checkoutCustomer, setCheckoutCustomer] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [checkoutResult, setCheckoutResult] = useState<{
    invoice_number: string;
    payment_url: string;
  } | null>(null);

  // Fetch products to pick the first active one for the demo checkout.
  const productsQuery = useQuery({
    queryKey: ['admin-products'],
    queryFn: listAdminProducts,
    enabled: isReady,
  });

  const primaryProduct = productsQuery.data?.find((p) => p.status === 'active');
  const primaryVariant = primaryProduct?.product_variants?.[0];

  const checkoutMutation = useMutation({
    mutationFn: createDokuCheckout,
    onSuccess: (result) => {
      setCheckoutResult(result);
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
  });

  const runCheckoutDemo = () => {
    if (!primaryProduct) return;
    checkoutMutation.mutate({
      customer: checkoutCustomer,
      items: [
        {
          product_id: primaryProduct.id,
          variant_id: primaryVariant?.id,
          quantity: 1,
        },
      ],
    });
  };

  return (
    <section className="admin-detail-pane">
      <AdminDetailTop />
      <DokuCheckoutCard
        customer={checkoutCustomer}
        error={checkoutMutation.error}
        isPending={checkoutMutation.isPending}
        primaryProductName={primaryProduct?.name}
        result={checkoutResult}
        onCustomerChange={setCheckoutCustomer}
        onCreateCheckout={runCheckoutDemo}
      />
    </section>
  );
}
