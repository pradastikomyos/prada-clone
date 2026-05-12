/**
 * orderHelpers.ts — client-side classification and filtering for AdminOrder.
 *
 * Our OrderStatus: 'pending_payment' | 'paid' | 'pending_pickup' | 'picked_up' | 'cancelled' | 'expired'
 *
 * Category mapping:
 *   pending_payment  → 'pending_payment'
 *   pending_pickup   → 'pending_pickup'
 *   picked_up        → 'completed'
 *   cancelled | expired → 'cancelled'
 *   paid             → 'pending_pickup' (paid but not yet assigned pickup — treat as pending pickup)
 */

import type { AdminOrder } from '../../types/commerce';

export type OrderCategory = 'pending_payment' | 'pending_pickup' | 'completed' | 'cancelled';
export type OrderTabKey = OrderCategory | 'all';

export function classifyOrder(order: { status: string }): OrderCategory {
  switch (order.status) {
    case 'pending_payment':
      return 'pending_payment';
    case 'paid':
    case 'pending_pickup':
      return 'pending_pickup';
    case 'picked_up':
      return 'completed';
    case 'cancelled':
    case 'expired':
      return 'cancelled';
    default:
      return 'cancelled';
  }
}

export function getPendingPaymentOrders(orders: AdminOrder[]): AdminOrder[] {
  return orders.filter((o) => classifyOrder(o) === 'pending_payment');
}

/** Pending pickup orders sorted by paid_at descending (most recently paid first). */
export function getPendingPickupOrders(orders: AdminOrder[]): AdminOrder[] {
  return orders
    .filter((o) => classifyOrder(o) === 'pending_pickup')
    .sort((a, b) => {
      const ta = a.paid_at ? new Date(a.paid_at).getTime() : 0;
      const tb = b.paid_at ? new Date(b.paid_at).getTime() : 0;
      return tb - ta;
    });
}

/** Completed (picked_up) orders sorted by updated_at / picked_up_at descending. */
export function getCompletedOrders(orders: AdminOrder[]): AdminOrder[] {
  return orders
    .filter((o) => classifyOrder(o) === 'completed')
    .sort((a, b) => {
      const ta = a.picked_up_at ? new Date(a.picked_up_at).getTime() : new Date(a.created_at).getTime();
      const tb = b.picked_up_at ? new Date(b.picked_up_at).getTime() : new Date(b.created_at).getTime();
      return tb - ta;
    });
}

export function getCancelledOrders(orders: AdminOrder[]): AdminOrder[] {
  return orders.filter((o) => classifyOrder(o) === 'cancelled');
}
