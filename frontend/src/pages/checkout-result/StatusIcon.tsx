import type { CheckoutResultOrder } from '../../services/orders';

export function AnimatedCheckmark() {
  return (
    <div className="checkout-result-icon checkout-result-icon--success" aria-hidden="true">
      <svg
        className="checkout-checkmark-svg"
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="checkout-checkmark-circle"
          cx="40"
          cy="40"
          r="36"
          stroke="#22c55e"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <path
          className="checkout-checkmark-path"
          d="M22 41L34 53L58 28"
          stroke="#22c55e"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

export function StatusIcon({ status }: { status: CheckoutResultOrder['status'] }) {
  if (status === 'pending_pickup' || status === 'picked_up') {
    return <AnimatedCheckmark />;
  }
  if (status === 'cancelled' || status === 'expired') {
    return (
      <div className="checkout-result-icon checkout-result-icon--error" aria-hidden="true">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="36" stroke="#ef4444" strokeWidth="3" fill="none" />
          <path d="M26 26L54 54M54 26L26 54" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      </div>
    );
  }
  return (
    <div className="checkout-result-icon checkout-result-icon--pending" aria-hidden="true">
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
        <circle cx="40" cy="40" r="36" stroke="#d1d5db" strokeWidth="3" fill="none" strokeDasharray="8 5" />
        <path d="M40 24v16l8 5" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
}
