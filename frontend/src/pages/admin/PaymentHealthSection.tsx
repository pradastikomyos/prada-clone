/**
 * PaymentHealthSection - admin observability for DOKU attempts and reconciliation.
 */

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminDetailTop, PaymentHealthCard } from '../../components/admin';
import {
  listAdminPaymentAttempts,
  listAdminPaymentEvents,
  reconcileDokuPayment,
} from '../../services/commerce';

type PaymentHealthSectionProps = {
  isReady: boolean;
};

export function PaymentHealthSection({ isReady }: PaymentHealthSectionProps) {
  const queryClient = useQueryClient();
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [manualInvoice, setManualInvoice] = useState('');

  const attemptsQuery = useQuery({
    queryKey: ['admin-payment-attempts'],
    queryFn: () => listAdminPaymentAttempts(50),
    enabled: isReady,
    refetchInterval: 20_000,
  });

  const eventsQuery = useQuery({
    queryKey: ['admin-payment-events'],
    queryFn: () => listAdminPaymentEvents(50),
    enabled: isReady,
    refetchInterval: 20_000,
  });

  const attempts = attemptsQuery.data ?? [];
  const events = eventsQuery.data ?? [];
  const selectedAttempt = useMemo(
    () => attempts.find((attempt) => attempt.id === selectedAttemptId) ?? attempts[0],
    [attempts, selectedAttemptId],
  );

  const reconcileMutation = useMutation({
    mutationFn: (invoiceNumber: string) => reconcileDokuPayment({ invoice_number: invoiceNumber }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-payment-attempts'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-payment-events'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] }),
      ]);
    },
  });

  const refreshAll = () => {
    attemptsQuery.refetch();
    eventsQuery.refetch();
  };

  return (
    <section className="admin-detail-pane">
      <AdminDetailTop />
      <PaymentHealthCard
        attempts={attempts}
        events={events}
        selectedAttempt={selectedAttempt}
        selectedAttemptId={selectedAttempt?.id ?? null}
        manualInvoice={manualInvoice}
        isLoading={attemptsQuery.isLoading || eventsQuery.isLoading}
        isReconciling={reconcileMutation.isPending}
        reconcileResult={reconcileMutation.data}
        reconcileError={reconcileMutation.error}
        onManualInvoiceChange={setManualInvoice}
        onSelectAttempt={setSelectedAttemptId}
        onRefresh={refreshAll}
        onReconcileInvoice={(invoice) => reconcileMutation.mutate(invoice)}
      />
    </section>
  );
}
