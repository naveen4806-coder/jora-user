import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateOrderPricing, DELIVERY_RATE_PER_KM, haversineKm } from '../services/pricing.js';

test('order pricing preserves vendor price and snapshots GST, platform fee and delivery charge', () => {
  const result = calculateOrderPricing({
    items: [
      { name: 'Tea', price: 50, qty: 2, gstPercent: 5 },
      { name: 'Snack', price: 80, qty: 1, gstPercent: 12 }
    ],
    distanceKm: 3.4,
    platformFee: { type: 'flat', value: 5 }
  });
  assert.equal(DELIVERY_RATE_PER_KM, 10);
  assert.equal(result.itemsTotal, 180);
  assert.equal(result.items[0].gstAmount, 5);
  assert.equal(result.items[1].gstAmount, 9.6);
  assert.equal(result.gstTotal, 14.6);
  assert.equal(result.deliveryCharge, 34);
  assert.equal(result.platformFee, 5);
  assert.equal(result.grandTotal, 233.6);
});

test('haversine distance is rounded to one decimal kilometre', () => {
  assert.equal(haversineKm([76.9558, 11.0168], [76.966, 11.026]), 1.5);
});
