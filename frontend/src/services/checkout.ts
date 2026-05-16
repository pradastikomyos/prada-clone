import { requireSupabaseClient } from '../lib/supabase';
import { PaymentStatus } from '../types/commerce';
import type { CheckoutResultOrder } from './orders';

export type CheckoutResultKind = 'found' | 'pending' | 'paid' | 'not_owner' | 'not_found';

export type CheckoutResultResponse = {
  kind: CheckoutResultKind;
  order: CheckoutResultOrder | null;
  message?: string;
  can_reconcile?: boolean;
  raw?: unknown;
};

export type DokuReconcileResponse = {
  ok: boolean;
  invoice_number?: string;
  order?: CheckoutResultOrder | null;
  payment_status?: PaymentStatus | string;
  provider_status?: string;
  changed?: boolean;
  message?: string;
  raw?: unknown;
};

export type { CheckoutResultOrder } from './orders';

export async function createDokuCheckout(input: {
  customer: { name: string; email?: string; phone?: string };
  items: Array<{ product_id: string; variant_id?: string; quantity: number }>;
}) {
  const client = requireSupabaseClient();
  const { data, error } = await client.functions.invoke('create-doku-checkout', {
    body: input,
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as {
    order_id: string;
    invoice_number: string;
    payment_url: string;
    amount_idr: number;
  };
}

function normalizeCheckoutResult(data: any): CheckoutResultResponse {
  const result = data?.result ?? data;
  const order = (result?.order ?? null) as CheckoutResultOrder | null;
  const rawKind = result?.kind ?? result?.outcome ?? result?.status;
  const kind: CheckoutResultKind =
    rawKind === 'not_owner' ||
    rawKind === 'not_found' ||
    rawKind === 'pending' ||
    rawKind === 'paid' ||
    rawKind === 'found'
      ? rawKind
      : order
        ? 'found'
        : 'not_found';

  return {
    kind,
    order,
    message: result?.message,
    can_reconcile: result?.can_reconcile ?? result?.canReconcile,
    raw: data,
  };
}

/**
 * Customer-safe checkout result lookup. The server function owns the privileged
 * order read and can distinguish missing invoices from RLS/ownership denial.
 */
export async function getCheckoutResult(invoiceNumber: string) {
  const client = requireSupabaseClient();
  const { data, error } = await client.functions.invoke('get-checkout-result', {
    body: {
      invoice_number: invoiceNumber,
      invoiceNumber,
    },
  });

  if (error) throw error;
  if (data?.error && !data?.status && !data?.kind && !data?.outcome) {
    throw new Error(data.error);
  }

  return normalizeCheckoutResult(data);
}

/**
 * Ask the backend to reconcile one DOKU checkout via provider status APIs.
 * The browser only sends an invoice/order identifier; DOKU secrets remain server-side.
 */
export async function reconcileDokuPayment(input: { invoice_number?: string; invoiceNumber?: string; order_id?: string }) {
  const client = requireSupabaseClient();
  const invoiceNumber = input.invoice_number ?? input.invoiceNumber;
  const { data, error } = await client.functions.invoke('reconcile-doku-payment', {
    body: {
      ...input,
      invoice_number: invoiceNumber,
      invoiceNumber,
    },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  const result = data?.result ?? data;
  return {
    ok: result?.ok ?? true,
    invoice_number: result?.invoice_number ?? result?.invoiceNumber ?? invoiceNumber,
    order: (result?.order ?? null) as CheckoutResultOrder | null,
    payment_status: result?.payment_status ?? result?.paymentStatus,
    provider_status: result?.provider_status ?? result?.providerStatus ?? result?.doku_status,
    changed: result?.changed ?? result?.reconciled ?? result?.updated,
    message: result?.message,
    raw: data,
  } satisfies DokuReconcileResponse;
}
