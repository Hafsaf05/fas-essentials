import { randomBytes, createHash, scrypt as rawScrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(rawScrypt);
export const token = () => randomBytes(32).toString('hex');
export const hash = (s: string) => createHash('sha256').update(s).digest('hex');
export async function passwordHash(password: string) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${(await scrypt(password, salt, 64) as Buffer).toString('hex')}`;
}
export async function verifyPassword(password: string, encoded: string) {
  const [salt, expected] = encoded.split(':');
  const actual = await scrypt(password, salt, 64) as Buffer;
  const stored = Buffer.from(expected, 'hex');
  return actual.length === stored.length && timingSafeEqual(actual, stored);
}
export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
export function requireThat(ok: unknown, status: number, message: string): asserts ok { if (!ok) throw new HttpError(status, message); }
