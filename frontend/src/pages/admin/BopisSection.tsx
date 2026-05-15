/**
 * BopisSection — self-contained admin page for BOPIS pickup verification.
 */

import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminDetailTop, OrderPreviewModal, PickupVerificationCard } from '../../components/admin';
import { QrScannerModal } from '../../components/admin/QrScannerModal';
import { getOrderByPickupCode, verifyPickupCode } from '../../services/commerce';

export function BopisSection() {
  const queryClient = useQueryClient();
  const [pickupCode, setPickupCode] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const orderQuery = useQuery({
    queryKey: ['bopis-order', pickupCode],
    queryFn: () => getOrderByPickupCode(pickupCode),
    enabled: pickupCode.length >= 3,
  })

  useEffect(() => {
    if (orderQuery.data) {
      setIsPreviewOpen(true);
      setPreviewError(null);
    }
  }, [orderQuery.data]);

  const pickupMutation = useMutation({
    mutationFn: verifyPickupCode,
    onSuccess: () => {
      setSuccessMessage('Barang berhasil diserahkan ✅');
      setPickupCode('');
      setIsScannerOpen(false);
      setIsPreviewOpen(false);
      setPreviewError(null);
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['bopis-order'] });
    },
    onError: (error) => {
      setPreviewError(error instanceof Error ? error.message : 'Gagal memverifikasi barang');
    },
  })

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (orderQuery.data) {
      setIsPreviewOpen(true);
    }
  };

  const handleConfirmPickup = () => {
    const order = orderQuery.data;
    if (!order) return;
    if (String(order.payment_status || '').toLowerCase() !== 'paid') {
      setPreviewError('Pembayaran belum dikonfirmasi');
      return;
    }
    if (String(order.status || '').toLowerCase() === 'picked_up') {
      setPreviewError('Barang sudah diambil sebelumnya');
      return;
    }
    setPreviewError(null);
    pickupMutation.mutate(pickupCode);
  };

  return (
    <section className="admin-detail-pane">
      <AdminDetailTop />

      {successMessage ? <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">{successMessage}</div> : null}

      <QrScannerModal
        isOpen={isScannerOpen}
        onScan={(code) => {
          setPickupCode(code);
          setIsScannerOpen(false);
        }}
        onClose={() => setIsScannerOpen(false)}
      />

      <OrderPreviewModal
        order={orderQuery.data ?? null}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onConfirm={handleConfirmPickup}
        isConfirming={pickupMutation.isPending}
        errorMessage={previewError}
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
