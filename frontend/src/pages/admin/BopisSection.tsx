/**
 * BopisSection — self-contained admin page for BOPIS pickup verification.
 *
 * Owns:
 *  - pickupCode state
 *  - isScannerOpen state
 *  - orderDetail query (by pickup code)
 *  - verifyPickupCode mutation
 *
 * Rendered by AdminPage when tab === 'bopis'.
 */

import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminDetailTop, PickupVerificationCard } from '../../components/admin';
import { QrScannerModal } from '../../components/admin/QrScannerModal';
import { getOrderByPickupCode, verifyPickupCode } from '../../services/commerce';

export function BopisSection() {
  const queryClient = useQueryClient()
  const [pickupCode, setPickupCode] = useState('')
  const [isScannerOpen, setIsScannerOpen] = useState(false)

  const orderQuery = useQuery({
    queryKey: ['bopis-order', pickupCode],
    queryFn: () => getOrderByPickupCode(pickupCode),
    enabled: pickupCode.length >= 3,
  })

  const pickupMutation = useMutation({
    mutationFn: verifyPickupCode,
    onSuccess: () => {
      setPickupCode('')
      setIsScannerOpen(false)
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      queryClient.invalidateQueries({ queryKey: ['bopis-order'] })
    },
  })

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    pickupMutation.mutate(pickupCode)
  }

  return (
    <section className="admin-detail-pane">
      <AdminDetailTop />

      <QrScannerModal
        isOpen={isScannerOpen}
        onScan={(code) => {
          setPickupCode(code)
          setIsScannerOpen(false)
        }}
        onClose={() => setIsScannerOpen(false)}
      />

      <PickupVerificationCard
        pickupCode={pickupCode}
        error={pickupMutation.error}
        isPending={pickupMutation.isPending}
        isVerified={Boolean(pickupMutation.data)}
        onPickupCodeChange={setPickupCode}
        onSubmit={handleSubmit}
        onOpenScanner={() => setIsScannerOpen(true)}
        orderDetail={orderQuery.data ?? null}
        isLoadingOrder={orderQuery.isLoading}
      />
    </section>
  )
}
