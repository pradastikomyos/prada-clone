/**
 * BopisSection — self-contained admin page for BOPIS pickup verification.
 *
 * Owns:
 *  - pickupCode state
 *  - verifyPickupCode mutation
 *
 * Rendered by AdminPage when tab === 'bopis'.
 */

import { FormEvent, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminDetailTop, PickupVerificationCard } from '../../components/admin';
import { verifyPickupCode } from '../../services/commerce';

export function BopisSection() {
  const queryClient = useQueryClient();
  const [pickupCode, setPickupCode] = useState('');

  const pickupMutation = useMutation({
    mutationFn: verifyPickupCode,
    onSuccess: () => {
      setPickupCode('');
      // Invalidate orders so the order list reflects the updated status.
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    pickupMutation.mutate(pickupCode);
  };

  return (
    <section className="admin-detail-pane">
      <AdminDetailTop />
      <PickupVerificationCard
        pickupCode={pickupCode}
        error={pickupMutation.error}
        isPending={pickupMutation.isPending}
        isVerified={Boolean(pickupMutation.data)}
        onPickupCodeChange={setPickupCode}
        onSubmit={handleSubmit}
      />
    </section>
  );
}
