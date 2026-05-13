import { expect, test } from 'playwright/test';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(testsDir, '..');
const repoRoot = path.resolve(frontendDir, '..');
const paymentFixturesDir = path.join(testsDir, 'fixtures', 'payment');

async function readRepoFile(...segments) {
  return readFile(path.join(repoRoot, ...segments), 'utf8');
}

async function readFixture(name) {
  const raw = await readFile(path.join(paymentFixturesDir, name), 'utf8');
  return JSON.parse(raw);
}

function unwrapDokuPayload(payload) {
  return payload.response && typeof payload.response === 'object'
    ? payload.response
    : payload;
}

function normalizePaymentPayload(payload) {
  const body = unwrapDokuPayload(payload);
  const order = body.order ?? {};
  const transaction = body.transaction ?? {};
  const payment = body.payment ?? {};
  const headers = body.headers ?? {};
  const rawStatus = String(
    transaction.status ??
    transaction.transaction_status ??
    payment.status ??
    body.status ??
    '',
  ).toLowerCase();

  const status = (() => {
    if (['success', 'settlement', 'capture', 'paid'].includes(rawStatus)) return 'paid';
    if (rawStatus === 'expired') return 'expired';
    if (['cancelled', 'canceled'].includes(rawStatus)) return 'cancelled';
    if (['failed', 'deny'].includes(rawStatus)) return 'failed';
    return 'pending';
  })();

  return {
    invoiceNumber: order.invoice_number ?? order.invoiceNumber ?? transaction.invoice_number ?? body.invoice_number,
    paymentStatus: status,
    orderStatus: status === 'paid'
      ? 'pending_pickup'
      : status === 'expired' || status === 'cancelled'
        ? status
        : 'pending_payment',
    providerRequestId: headers.requestId ?? headers.request_id ?? null,
  };
}

test.describe('Payment architecture contracts', () => {
  test('create-doku-checkout rejects unauthenticated checkout before writing an order', async () => {
    const source = await readRepoFile('supabase', 'functions', 'create-doku-checkout', 'index.ts');

    expect(source).toContain('function getBearerToken');
    expect(source).toContain('auth.getUser(token)');
    expect(source).toContain("token === Deno.env.get('SUPABASE_ANON_KEY')");
    expect(source).toContain('You must be logged in before checkout');

    const authGuardIndex = source.indexOf('if (!userId)');
    const orderInsertIndex = source.indexOf(".from('orders')");
    expect(authGuardIndex).toBeGreaterThan(-1);
    expect(orderInsertIndex).toBeGreaterThan(-1);
    expect(authGuardIndex).toBeLessThan(orderInsertIndex);
  });

  test('webhook source supports the invoice and status shapes captured in fixtures', async () => {
    const source = await readRepoFile('supabase', 'functions', 'doku-webhook', 'index.ts');

    for (const token of [
      'order?.invoice_number',
      'order?.invoiceNumber',
      'transaction?.invoice_number',
      'transaction?.transaction_status',
      'payment?.status',
      "supabase.rpc('process_doku_payment_event'",
    ]) {
      expect(source).toContain(token);
    }
  });

  test('webhook payload fixtures normalize to order activation statuses', async () => {
    const cases = [
      ['doku-webhook-paid.json', 'INV-PAYMENT-PAID-001', 'paid', 'pending_pickup'],
      ['doku-webhook-expired.json', 'INV-PAYMENT-EXPIRED-001', 'expired', 'expired'],
      ['doku-webhook-cancelled-camel-invoice.json', 'INV-PAYMENT-CANCELLED-001', 'cancelled', 'cancelled'],
    ];

    for (const [fixture, invoiceNumber, paymentStatus, orderStatus] of cases) {
      const normalized = normalizePaymentPayload(await readFixture(fixture));
      expect(normalized).toMatchObject({ invoiceNumber, paymentStatus, orderStatus });
    }
  });

  test('check-status fixtures use the same normalized invoice and payment status contract', async () => {
    const paid = normalizePaymentPayload(await readFixture('doku-check-status-paid.json'));
    expect(paid).toMatchObject({
      invoiceNumber: 'INV-PAYMENT-PAID-001',
      paymentStatus: 'paid',
      orderStatus: 'pending_pickup',
      providerRequestId: 'f8a3e54d-4d74-4d30-87e7-7f24fe19ed01',
    });

    const pending = normalizePaymentPayload(await readFixture('doku-check-status-pending.json'));
    expect(pending).toMatchObject({
      invoiceNumber: 'INV-PAYMENT-PENDING-001',
      paymentStatus: 'pending',
      orderStatus: 'pending_payment',
      providerRequestId: '0a58c9a2-8afe-4950-a86e-46d17f3df500',
    });
  });

  test('reconcile function can be contract-checked when implemented', async () => {
    const reconcilePath = path.join(repoRoot, 'supabase', 'functions', 'reconcile-doku-payment', 'index.ts');
    test.skip(!existsSync(reconcilePath), 'reconcile-doku-payment is not implemented yet; fixtures are ready for it.');

    const source = await readFile(reconcilePath, 'utf8');
    expect(source).toContain('process_doku_payment_event');
    expect(source).toMatch(/invoice[_-]?number/i);
    expect(source).toMatch(/check.?status/i);
  });
});
