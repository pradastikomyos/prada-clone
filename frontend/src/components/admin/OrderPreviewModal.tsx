import { AdminIcon } from './AdminIcon';
import { PackageIcon } from '@hugeicons/core-free-icons';
import type { AdminOrder } from '../../types/commerce';

type OrderPreviewModalProps = {
  order: AdminOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isConfirming: boolean;
  errorMessage?: string | null;
};

export function OrderPreviewModal({ order, isOpen, onClose, onConfirm, isConfirming, errorMessage }: OrderPreviewModalProps) {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Preview Pesanan</p>
            <h3 className="text-2xl font-bold text-neutral-900">{order.invoice_number}</h3>
            <p className="mt-1 text-sm text-gray-500">{order.customer_name}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-gray-500 hover:bg-gray-100">
            ×
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-2 text-sm text-gray-700 sm:grid-cols-2">
            <p><span className="font-bold text-gray-500">Pickup Code:</span> {order.pickup_codes?.[0]?.code ?? '-'}</p>
            <p><span className="font-bold text-gray-500">Total:</span> {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(order.total_amount_idr)}</p>
            <p><span className="font-bold text-gray-500">Status:</span> {order.status}</p>
            <p><span className="font-bold text-gray-500">Payment:</span> {order.payment_status}</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500">
              <AdminIcon icon={PackageIcon} size={16} />
              Items
            </div>
            <div className="space-y-2">
              {order.order_items?.map((item, index) => (
                <div key={`${item.product_name}-${index}`} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 flex-1 truncate">{item.product_name} ×{item.quantity}</span>
                  <span className="shrink-0 font-medium">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.line_total_idr)}</span>
                </div>
              ))}
            </div>
          </div>

          {errorMessage ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errorMessage}</div> : null}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={onClose} className="w-full rounded-xl border border-gray-200 px-5 py-3 text-sm font-bold text-gray-700">
            Batal
          </button>
          <button type="button" onClick={onConfirm} disabled={isConfirming} className="w-full rounded-xl bg-[#ff4b86] px-5 py-3 text-sm font-bold text-white disabled:opacity-60">
            {isConfirming ? 'Memproses...' : 'Konfirmasi & Serah Barang'}
          </button>
        </div>
      </div>
    </div>
  );
}
