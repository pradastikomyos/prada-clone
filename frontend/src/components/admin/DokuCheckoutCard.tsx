import { ChangeEvent } from 'react';

type CheckoutCustomer = {
  name: string;
  email: string;
  phone: string;
};

type CheckoutResult = {
  invoice_number: string;
  payment_url: string;
};

type DokuCheckoutCardProps = {
  customer: CheckoutCustomer;
  error?: Error | null;
  isPending: boolean;
  primaryProductName?: string;
  result: CheckoutResult | null;
  onCustomerChange: (customer: CheckoutCustomer) => void;
  onCreateCheckout: () => void;
};

export function DokuCheckoutCard({
  customer,
  error,
  isPending,
  primaryProductName,
  result,
  onCustomerChange,
  onCreateCheckout,
}: DokuCheckoutCardProps) {
  const updateCustomer = (event: ChangeEvent<HTMLInputElement>) => {
    onCustomerChange({ ...customer, name: event.target.value });
  };

  return (
    <section className="admin-detail-card">
      <p className="admin-eyebrow">DOKU Sandbox</p>
      <h2>Checkout Test</h2>
      <div className="admin-form">
        <label>
          Customer
          <input value={customer.name} onChange={updateCustomer} />
        </label>
        <button type="button" disabled={!primaryProductName || isPending} onClick={onCreateCheckout}>
          {isPending ? 'Creating...' : 'Create DOKU checkout'}
        </button>
        <p className="admin-muted">{primaryProductName ? `Using: ${primaryProductName}` : 'Tambahkan produk aktif dulu untuk test checkout.'}</p>
        {error ? <p className="admin-error">{error.message}</p> : null}
        {result ? (
          <a className="admin-link" href={result.payment_url} target="_blank" rel="noreferrer">
            Open DOKU payment: {result.invoice_number}
          </a>
        ) : null}
      </div>
    </section>
  );
}
