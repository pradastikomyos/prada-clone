import { useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import { isSupabaseConfigured } from '../lib/supabase';
import { getCheckoutResult } from '../services/commerce';
import type { CheckoutResultOrder } from '../services/orders';
import { CheckoutResultContent } from './checkout-result/CheckoutResultContent';
import { useCheckoutPolling } from './checkout-result/useCheckoutPolling';

export function CheckoutResultPage() {
  const [searchParams] = useSearchParams();
  const invoice = useMemo(() => searchParams.get('invoice'), [searchParams]);
  const previousStatusRef = useRef<CheckoutResultOrder['status'] | null>(null);
  const confettiTriggeredRef = useRef(false);

  useEffect(() => {
    document.title = 'Order Confirmation | Spark Stage';
  }, []);

  const orderQuery = useQuery({
    queryKey: ['checkout-result', invoice],
    queryFn: () => getCheckoutResult(invoice!),
    enabled: isSupabaseConfigured && Boolean(invoice),
    refetchInterval: false,
    staleTime: 0,
  });

  const { pollCount, isPollingExhausted, reconcileMutation, resetPolling } = useCheckoutPolling({
    invoice,
    orderQuery,
  });

  useEffect(() => {
    const nextStatus = orderQuery.data?.order?.status ?? null;
    const previousStatus = previousStatusRef.current;

    if (!confettiTriggeredRef.current && previousStatus === 'pending_payment' && nextStatus === 'pending_pickup') {
      confettiTriggeredRef.current = true;
      const duration = 2600;
      const end = Date.now() + duration;
      const defaults = { startVelocity: 40, spread: 360, ticks: 100, zIndex: 9999, scalar: 1.1 };
      const colors = ['#FFD700', '#C0C0C0', '#FCEABB', '#EFEFEF'];
      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval = window.setInterval(() => {
        const timeLeft = end - Date.now();
        if (timeLeft <= 0) {
          window.clearInterval(interval);
          return;
        }

        const particleCount = 360 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors,
          shapes: ['square', 'circle', 'star'],
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors,
          shapes: ['square', 'circle', 'star'],
        });
      }, 250);
    }

    previousStatusRef.current = nextStatus;
  }, [orderQuery.data?.order?.status]);

  const result = orderQuery.data;
  const order = result?.order ?? null;
  const resultKind = result?.kind;
  const isSuccess = order?.status === 'pending_pickup' || order?.status === 'picked_up';
  const isFailed = order?.status === 'cancelled' || order?.status === 'expired';
  const isPending = Boolean(
    resultKind !== 'not_found' &&
    resultKind !== 'not_owner' &&
    (!order || order.status === 'pending_payment'),
  );
  const isNotOwner = resultKind === 'not_owner';
  const isNotFound = resultKind === 'not_found';

  return (
    <div className="checkout-result-page">
      <CheckoutResultContent
        invoice={invoice}
        orderQuery={orderQuery}
        pollCount={pollCount}
        isPollingExhausted={isPollingExhausted}
        reconcileMutation={reconcileMutation}
        order={order}
        isPending={isPending}
        isSuccess={isSuccess}
        isFailed={isFailed}
        isNotOwner={isNotOwner}
        isNotFound={isNotFound}
        resetPolling={resetPolling}
      />
    </div>
  );
}
