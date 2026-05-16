import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { reconcileDokuPayment, type CheckoutResultResponse } from '../../services/checkout';

const POLL_DELAYS = [0, 4_000, 8_000, 15_000, 30_000, 60_000] as const;
const MAX_POLLS = 15;
const AUTO_RECONCILE_AFTER_POLLS = 3;

type OrderQueryResult = Pick<UseQueryResult<CheckoutResultResponse, Error>, 'data' | 'isLoading' | 'isFetching' | 'isError' | 'refetch'>;

export function useCheckoutPolling({ invoice, orderQuery }: { invoice: string | null; orderQuery: OrderQueryResult }) {
  const [pollCount, setPollCount] = useState(0);
  const queryClient = useQueryClient();
  const autoReconcileTriggered = useRef(false);

  useEffect(() => {
    if (!invoice) return;
    if (orderQuery.isLoading || orderQuery.isFetching || orderQuery.isError) return;
    const kind = orderQuery.data?.kind;
    const status = orderQuery.data?.order?.status;
    if (kind === 'not_found' || kind === 'not_owner') return;
    if (status && status !== 'pending_payment') return;
    if (pollCount >= MAX_POLLS) return;

    let cancelled = false;
    const delay = POLL_DELAYS[Math.min(pollCount, POLL_DELAYS.length - 1)];
    const timeoutId = window.setTimeout(() => {
      if (cancelled) return;
      setPollCount((current) => current + 1);
      void orderQuery.refetch();
    }, delay);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [orderQuery, pollCount]);

  const reconcileMutation = useMutation({
    mutationFn: () => reconcileDokuPayment({ invoice_number: invoice ?? '' }),
    onSuccess: async () => {
      resetPolling();
      if (!invoice) return;
      await queryClient.invalidateQueries({ queryKey: ['checkout-result', invoice] });
      await orderQuery.refetch();
    },
  });

  useEffect(() => {
    if (!invoice) return;
    if (
      pollCount >= AUTO_RECONCILE_AFTER_POLLS &&
      !autoReconcileTriggered.current &&
      !reconcileMutation.isPending &&
      !reconcileMutation.isSuccess &&
      invoice &&
      orderQuery.data?.kind !== 'not_found' &&
      orderQuery.data?.kind !== 'not_owner' &&
      (!orderQuery.data?.order || orderQuery.data.order.status === 'pending_payment')
    ) {
      autoReconcileTriggered.current = true;
      reconcileMutation.mutate();
    }
  }, [pollCount, invoice, orderQuery.data, reconcileMutation]);

  const resetPolling = () => setPollCount(0);

  const isPending = Boolean(
    orderQuery.data?.kind !== 'not_found' &&
      orderQuery.data?.kind !== 'not_owner' &&
      (!orderQuery.data?.order || orderQuery.data.order.status === 'pending_payment'),
  );

  return {
    pollCount,
    isPollingExhausted: isPending && pollCount >= MAX_POLLS,
    reconcileMutation,
    resetPolling,
  };
}
