/* Shared Jora pricing contract.  The same file is shipped by each portal.
   An order stores this result at placement time; historical orders never
   recalculate their price from current tax settings. */
(function (global) {
  'use strict';
  var DELIVERY_RATE_PER_KM = 10;
  function number(value) { value = Number(value); return Number.isFinite(value) ? value : 0; }
  function money(value) { return Math.round((number(value) + Number.EPSILON) * 100) / 100; }
  function roundDistanceKm(value) { return Math.round((Math.max(0, number(value)) + Number.EPSILON) * 10) / 10; }
  function itemAmount(item) { return money(number(item && item.price) * Math.max(0, number(item && item.qty))); }
  function productAmount(items) { return money((items || []).reduce(function (sum, item) { return sum + itemAmount(item); }, 0)); }
  function calculateTax(items, settings) {
    settings = settings || {};
    if (!settings.enabled) return 0;
    var total = productAmount(items), categories = settings.perCategory || {}, tax = 0;
    (items || []).forEach(function (item) {
      var rule = categories[item && item.category] || settings;
      var base = itemAmount(item), value = number(rule && rule.value);
      tax += (rule && rule.mode === 'flat') ? value * Math.max(0, number(item && item.qty)) : base * value / 100;
    });
    return money(tax);
  }
  function getOrderTotals(input) {
    input = input || {};
    var amount = productAmount(input.items), distanceKm = roundDistanceKm(input.distanceKm);
    var deliveryCharge = Math.round(distanceKm * DELIVERY_RATE_PER_KM);
    var productTax = calculateTax(input.items, input.taxSettings);
    return { productAmount: amount, distanceKm: distanceKm, deliveryCharge: deliveryCharge, productTax: productTax, total: money(amount + deliveryCharge + productTax) };
  }
  global.JoraPricing = { DELIVERY_RATE_PER_KM: DELIVERY_RATE_PER_KM, roundDistanceKm: roundDistanceKm, calculateTax: calculateTax, getOrderTotals: getOrderTotals };
}(window));
