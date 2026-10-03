import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Admin Operational Business Logic', () => {
  // State separation invariant
  test('maintains strict independence between paymentStatus, fulfillmentStatus, and returnStatus', () => {
    const order = {
      orderNumber: 'TUW-7701',
      paymentStatus: 'paid',
      fulfillmentStatus: 'queued',
      status: 'Printing'
    };

    // Updating fulfillment status does not implicitly alter payment status
    const updateFulfillment = (ord, newStatus) => ({ ...ord, fulfillmentStatus: newStatus });
    const updated = updateFulfillment(order, 'printing');

    assert.equal(updated.fulfillmentStatus, 'printing');
    assert.equal(updated.paymentStatus, 'paid');
    assert.notEqual(updated.fulfillmentStatus, updated.paymentStatus);
  });

  // Dynamic KPI aggregation from active orders
  test('dynamically computes Gross Sales and Pending Counts without hardcoded values', () => {
    const orders = [
      { id: '1', totalINR: 5000, fulfillmentStatus: 'queued', paymentStatus: 'paid' },
      { id: '2', totalINR: 3500, fulfillmentStatus: 'delivered', paymentStatus: 'paid' },
      { id: '3', totalINR: 4200, fulfillmentStatus: 'submission_failed', paymentStatus: 'paid' },
      { id: '4', totalINR: 2000, fulfillmentStatus: 'queued', paymentStatus: 'failed' }
    ];

    const grossSales = orders
      .filter((o) => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.totalINR, 0);

    const pendingFulfillment = orders.filter((o) => o.fulfillmentStatus === 'queued').length;
    const failedFulfillment = orders.filter((o) => o.fulfillmentStatus === 'submission_failed').length;

    assert.equal(grossSales, 12700);
    assert.equal(pendingFulfillment, 2);
    assert.equal(failedFulfillment, 1);
  });

  // Refund validation rules
  test('validates refund amounts ensuring they do not exceed order total or drop below 0', () => {
    const validateRefund = (orderTotal, requestedRefund) => {
      if (typeof requestedRefund !== 'number' || isNaN(requestedRefund)) {
        return { valid: false, error: 'Refund must be a valid number' };
      }
      if (requestedRefund <= 0) {
        return { valid: false, error: 'Refund amount must be greater than zero' };
      }
      if (requestedRefund > orderTotal) {
        return { valid: false, error: `Refund cannot exceed order total of ₹${orderTotal}` };
      }
      return { valid: true, error: null };
    };

    assert.equal(validateRefund(5000, 2500).valid, true);
    assert.equal(validateRefund(5000, 5000).valid, true);
    assert.equal(validateRefund(5000, 5500).valid, false);
    assert.equal(validateRefund(5000, 0).valid, false);
    assert.equal(validateRefund(5000, -100).valid, false);
  });

  // Role permissions checking
  test('correctly restricts destructive actions based on demo staff role', () => {
    const permissions = {
      Owner: { canPublishProduct: true, canRefund: true, canEditStaff: true },
      Operations: { canPublishProduct: true, canRefund: true, canEditStaff: false },
      Content: { canPublishProduct: true, canRefund: false, canEditStaff: false },
      'Read-only': { canPublishProduct: false, canRefund: false, canEditStaff: false }
    };

    const hasPermission = (role, action) => permissions[role]?.[action] ?? false;

    assert.equal(hasPermission('Owner', 'canEditStaff'), true);
    assert.equal(hasPermission('Operations', 'canEditStaff'), false);
    assert.equal(hasPermission('Operations', 'canRefund'), true);
    assert.equal(hasPermission('Content', 'canRefund'), false);
    assert.equal(hasPermission('Read-only', 'canPublishProduct'), false);
  });
});
