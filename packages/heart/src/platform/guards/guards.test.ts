import { test } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { authorize, parseInput, actorRef, isFrameworkSignal, type RequestContext } from './index.ts';
import { AppError } from '../errors/index.ts';
import { canonicalJson, hashRequest } from '../idempotency/index.ts';

const base: RequestContext = { requestId: 'r', user: null, guestSessionId: null };
const customer: RequestContext = { ...base, user: { id: 'u1', roles: ['customer'], permissions: [] } };
const support: RequestContext = { ...base, user: { id: 's1', roles: ['support'], permissions: ['order.read'] } };
const code = (fn: () => void) => { try { fn(); return 'ok'; } catch (e) { return (e as AppError).code; } };

test('storefront access levels', () => {
  assert.equal(code(() => authorize(base, { access: 'public' })), 'ok');
  assert.equal(code(() => authorize(base, { access: 'guestOrCustomer' })), 'UNAUTHENTICATED');
  assert.equal(code(() => authorize({ ...base, guestSessionId: 'g' }, { access: 'guestOrCustomer' })), 'ok');
  assert.equal(code(() => authorize(base, {})), 'UNAUTHENTICATED');
  assert.equal(code(() => authorize(customer, { access: 'customer' })), 'ok');
});

test('staff permissions and roles', () => {
  assert.equal(code(() => authorize(customer, { permission: 'order.read' })), 'FORBIDDEN');
  assert.equal(code(() => authorize(support, { permission: 'order.read' })), 'ok');
  assert.equal(code(() => authorize(support, { permission: 'order.refund' })), 'FORBIDDEN');
  assert.equal(code(() => authorize(support, { role: 'admin' })), 'FORBIDDEN');
  assert.equal(code(() => authorize(base, { permission: 'order.read' })), 'UNAUTHENTICATED');
});

test('input validation returns field details', () => {
  const schema = z.object({ qty: z.coerce.number().int().min(1) });
  assert.deepEqual(parseInput(schema, { qty: '2' }), { qty: 2 });
  try { parseInput(schema, { qty: '0' }); assert.fail(); } catch (e) {
    assert.equal((e as AppError).code, 'VALIDATION_FAILED');
    assert.equal((e as AppError).details[0]?.field, 'qty');
  }
  // The message names the actual problem (forms that only show the message
  // stay truthful) and counts the rest.
  const form = z.object({ name: z.string().min(1, 'Enter the customer name.'), email: z.string().email('Enter a valid email') });
  try { parseInput(form, { name: '', email: 'x' }); assert.fail(); } catch (e) {
    assert.equal((e as AppError).message, 'Enter the customer name (and 1 more).');
    assert.equal((e as AppError).details.length, 2);
  }
  try { parseInput(form, { name: 'A', email: 'x' }); assert.fail(); } catch (e) {
    assert.equal((e as AppError).message, 'Enter a valid email.');
  }
});

test('actor refs, framework signals and request hashing', () => {
  assert.equal(actorRef(customer), 'user:u1');
  assert.equal(actorRef({ ...base, guestSessionId: 'g9' }), 'guest:g9');
  assert.equal(isFrameworkSignal({ digest: 'NEXT_REDIRECT;replace;/login;307;' }), true);
  assert.equal(isFrameworkSignal(new Error('x')), false);
  assert.equal(canonicalJson({ b: 1, a: [2, { d: 1, c: 0 }] }), '{"a":[2,{"c":0,"d":1}],"b":1}');
  assert.equal(hashRequest('checkout', { a: 1, b: 2 }), hashRequest('checkout', { b: 2, a: 1 }));
  assert.notEqual(hashRequest('checkout', { a: 1 }), hashRequest('refund.create', { a: 1 }));
});
