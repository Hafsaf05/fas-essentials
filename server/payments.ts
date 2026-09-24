import { createHmac, timingSafeEqual } from 'node:crypto';
import { HttpError } from './security';
export function validSignature(body: string | Buffer, supplied: string, secret: string) {
  if (!secret || !/^[a-f0-9]{64}$/i.test(supplied)) return false;
  const digest = createHmac('sha256', secret).update(body).digest();
  return timingSafeEqual(digest, Buffer.from(supplied, 'hex'));
}
export function paymentGateway() {
  const key = process.env.RAZORPAY_KEY_ID || '', secret = process.env.RAZORPAY_KEY_SECRET || '';
  async function request(path: string, body?: unknown): Promise<any> {
    if (!key || !secret) throw new HttpError(503, 'Online payments are not configured.');
    const response = await fetch(`https://api.razorpay.com/v1/${path}`, {
      method: body ? 'POST' : 'GET', signal: AbortSignal.timeout(15000),
      headers: { Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}`, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    if (!response.ok) throw new HttpError(502, 'Payment provider is unavailable. Check your order before trying again.');
    return response.json();
  }
  return { key, secret, configured: !!(key && secret && process.env.RAZORPAY_WEBHOOK_SECRET),
    createOrder: (amount: number, receipt: string) => request('orders', { amount, currency: 'INR', receipt }),
    getOrder: (id: string) => request(`orders/${encodeURIComponent(id)}`),
    getRefunds: (id: string) => request(`payments/${encodeURIComponent(id)}/refunds`),
    getPayment: (id: string) => request(`payments/${encodeURIComponent(id)}`),
    getOrderPayments: (id: string) => request(`orders/${encodeURIComponent(id)}/payments`),
    refund: (id: string, amount: number, receipt: string) => request(`payments/${encodeURIComponent(id)}/refund`, { amount, receipt })
  };
}
export type Gateway = ReturnType<typeof paymentGateway>;
