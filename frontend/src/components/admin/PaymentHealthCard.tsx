import { FormEvent } from 'react';
import { Invoice03Icon, Payment02Icon, RefreshIcon } from '@hugeicons/core-free-icons';
import type { AdminPaymentAttempt, AdminPaymentEvent, DokuReconcileResponse } from '../../services/commerce';
import { AdminIcon } from './AdminIcon';
import { OrderStripSkeleton } from './AdminSkeleton';

type PaymentHealthCardProps = {
  attempts: AdminPaymentAttempt[];
  events: AdminPaymentEvent[];
  selectedAttempt?: AdminPaymentAttempt;
  selectedAttemptId: string | null;
  manualInvoice: string;
  isLoading: boolean;
  isReconciling: boolean;
  reconcileResult?: DokuReconcileResponse;
  reconcileError?: Error | null;
  onManualInvoiceChange: (value: string) => void;
  onSelectAttempt: (id: string) => void;
  onRefresh: () => void;
  onReconcileInvoice: (invoice: string) => void;
};

const IDR = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

function formatDateTime(value?: string | null) {
  if (!value) return 'Never';
  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function asRecord(value: unknown): Record<string, any> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, any>
    : null;
}

function readRawStatus(raw: unknown) {
  const payload = asRecord(raw);
  if (!payload) return 'No raw status';

  return (
    payload.response?.transaction?.status ??
    payload.response?.payment?.status ??
    payload.response?.order?.status ??
    payload.transaction?.status ??
    payload.payment_status ??
    payload.status ??
    'No raw status'
  );
}

function statusTone(status?: string | null) {
  if (!status) return 'muted';
  if (status === 'paid' || status === 'success' || status === 'processed') return 'success';
  if (status === 'failed' || status === 'cancelled' || status === 'error') return 'danger';
  if (status === 'expired') return 'muted';
  return 'warning';
}

function PaymentBadge({ status }: { status?: string | null }) {
  return (
    <span className={`admin-payment-badge is-${statusTone(status)}`}>
      {status?.replace(/_/g, ' ') ?? 'unknown'}
    </span>
  );
}

function formatJson(value: unknown) {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return String(value ?? '');
  }
}

export function PaymentHealthCard({
  attempts,
  events,
  selectedAttempt,
  selectedAttemptId,
  manualInvoice,
  isLoading,
  isReconciling,
  reconcileResult,
  reconcileError,
  onManualInvoiceChange,
  onSelectAttempt,
  onRefresh,
  onReconcileInvoice,
}: PaymentHealthCardProps) {
  const pendingCount = attempts.filter((attempt) => attempt.status === 'pending').length;
  const failedCount = attempts.filter((attempt) => attempt.status === 'failed').length;
  const paidCount = attempts.filter((attempt) => attempt.status === 'paid').length;
  const lastWebhookOrEvent = events[0]?.processed_at ?? events[0]?.created_at ?? null;
  const selectedInvoice = selectedAttempt?.order?.invoice_number ?? '';

  const submitManualReconcile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const invoice = manualInvoice.trim();
    if (invoice) onReconcileInvoice(invoice);
  };

  return (
    <section className="admin-detail-card admin-payment-health">
      <div className="admin-detail-heading">
        <div>
          <p className="admin-eyebrow">Payment Health</p>
          <h2>DOKU reconciliation</h2>
        </div>
        <button type="button" onClick={onRefresh}>
          <AdminIcon icon={RefreshIcon} size={16} />
          Refresh
        </button>
      </div>

      <div className="admin-payment-metrics">
        <div>
          <span>Pending attempts</span>
          <strong>{pendingCount}</strong>
        </div>
        <div>
          <span>Paid attempts</span>
          <strong>{paidCount}</strong>
        </div>
        <div>
          <span>Failed attempts</span>
          <strong>{failedCount}</strong>
        </div>
        <div>
          <span>Last event</span>
          <strong>{formatDateTime(lastWebhookOrEvent)}</strong>
        </div>
      </div>

      <form className="admin-payment-reconcile-form" onSubmit={submitManualReconcile}>
        <label>
          Invoice status check
          <input
            value={manualInvoice}
            onChange={(event) => onManualInvoiceChange(event.target.value)}
            placeholder="INV..."
          />
        </label>
        <button type="submit" disabled={isReconciling || !manualInvoice.trim()}>
          {isReconciling ? 'Checking...' : 'Reconcile'}
        </button>
      </form>

      {reconcileResult ? (
        <p className="admin-success">
          {reconcileResult.message ??
            `Reconciled ${reconcileResult.invoice_number ?? 'invoice'} (${reconcileResult.payment_status ?? reconcileResult.provider_status ?? 'status updated'}).`}
        </p>
      ) : null}
      {reconcileError ? <p className="admin-error">{reconcileError.message}</p> : null}

      <div className="admin-payment-board">
        <div className="admin-payment-attempts">
          {isLoading ? (
            <OrderStripSkeleton count={5} />
          ) : attempts.length === 0 ? (
            <div className="admin-empty-state admin-empty-state--compact">
              <AdminIcon icon={Payment02Icon} size={28} />
              <p>No payment attempts yet.</p>
            </div>
          ) : (
            attempts.map((attempt) => (
              <button
                key={attempt.id}
                type="button"
                className={selectedAttemptId === attempt.id ? 'is-selected' : ''}
                onClick={() => onSelectAttempt(attempt.id)}
              >
                <strong>{attempt.order?.invoice_number ?? attempt.request_id ?? attempt.id}</strong>
                <span>{attempt.order?.customer_name ?? 'Unknown customer'}</span>
                <span>{IDR.format(attempt.amount_idr)}</span>
                <PaymentBadge status={attempt.status} />
              </button>
            ))
          )}
        </div>

        <div className="admin-payment-detail">
          {selectedAttempt ? (
            <>
              <div className="admin-payment-detail-head">
                <div>
                  <p className="admin-order-detail-name">
                    {selectedAttempt.order?.invoice_number ?? selectedAttempt.id}
                  </p>
                  <p className="admin-muted">
                    Updated {formatDateTime(selectedAttempt.updated_at)}
                  </p>
                </div>
                <PaymentBadge status={selectedAttempt.status} />
              </div>

              <dl className="admin-payment-fields">
                <div>
                  <dt>Order status</dt>
                  <dd>{selectedAttempt.order?.status ?? 'No linked order'}</dd>
                </div>
                <div>
                  <dt>Payment status</dt>
                  <dd>{selectedAttempt.order?.payment_status ?? selectedAttempt.status}</dd>
                </div>
                <div>
                  <dt>DOKU raw status</dt>
                  <dd>{readRawStatus(selectedAttempt.raw_payload)}</dd>
                </div>
                <div>
                  <dt>Request ID</dt>
                  <dd>{selectedAttempt.request_id ?? 'Not captured'}</dd>
                </div>
                <div>
                  <dt>Provider reference</dt>
                  <dd>{selectedAttempt.provider_reference ?? 'Not captured'}</dd>
                </div>
                <div>
                  <dt>Created</dt>
                  <dd>{formatDateTime(selectedAttempt.created_at)}</dd>
                </div>
              </dl>

              <button
                type="button"
                className="admin-payment-reconcile-selected"
                disabled={isReconciling || !selectedInvoice}
                onClick={() => selectedInvoice && onReconcileInvoice(selectedInvoice)}
              >
                <AdminIcon icon={Invoice03Icon} size={16} />
                Reconcile selected invoice
              </button>

              <div className="admin-payment-events">
                <p className="admin-order-items-label">Recent payment events</p>
                {events.length > 0 ? (
                  events.slice(0, 5).map((event) => (
                    <div key={event.id} className="admin-payment-event-row">
                      <span>{event.event_source ?? event.event_type ?? event.status ?? event.processing_status ?? 'event'}</span>
                      <span>{event.invoice_number ?? event.provider_request_id ?? event.request_id ?? event.provider_event_id ?? 'no reference'}</span>
                      <time>{formatDateTime(event.processed_at ?? event.created_at)}</time>
                    </div>
                  ))
                ) : (
                  <p className="admin-muted">No separate payment event rows are visible yet.</p>
                )}
              </div>

              <details className="admin-payment-raw">
                <summary>Raw attempt payload</summary>
                <pre>{formatJson(selectedAttempt.raw_payload)}</pre>
              </details>
            </>
          ) : (
            <p className="admin-muted">Select a payment attempt to inspect request IDs and raw status.</p>
          )}
        </div>
      </div>
    </section>
  );
}
