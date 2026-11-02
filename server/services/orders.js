import mongoose from 'mongoose';
import { Earning, Order, Partner, Product, TaxConfig, Vendor } from '../models/index.js';
import { calculateOrderPricing, haversineKm } from './pricing.js';
export const transitions = { placed: ['accepted_by_vendor', 'rejected', 'cancelled'], accepted_by_vendor: ['preparing'], preparing: ['ready'], ready: ['partner_assigned'], partner_assigned: ['partner_accepted'], partner_accepted: ['picked_up'], picked_up: ['on_the_way'], on_the_way: ['delivered'] };
export async function createOrder({ user, input }) {
  const vendor = await Vendor.findById(input.vendorId); if (!vendor || vendor.status !== 'approved' || !vendor.shop?.isOpen) throw Object.assign(new Error('This shop is unavailable.'), { status: 400, expose: true });
  const ids = input.items.map(item => item.productId); const products = await Product.find({ _id: { $in: ids }, vendorRef: vendor._id, isAvailable: true }); if (products.length !== input.items.length) throw Object.assign(new Error('One or more products are unavailable.'), { status: 400, expose: true });
  const taxes = await TaxConfig.find({ productRef: { $in: ids } }).lean(); const taxByProduct = new Map(taxes.map(tax => [String(tax.productRef), tax.gstPercent]));
  const items = input.items.map(requested => { const product = products.find(item => String(item._id) === requested.productId); if (product.stock < requested.qty) throw Object.assign(new Error(`${product.name} is out of stock.`), { status: 409, expose: true }); return { productRef: product._id, name: product.name, price: product.price, qty: requested.qty, gstPercent: taxByProduct.get(String(product._id)) || 0, image: product.images?.[0] || '' }; });
  const fee = input.platformFee || null; const distanceKm = haversineKm(vendor.shop.location?.coordinates, input.address.location?.coordinates); const pricing = calculateOrderPricing({ items, distanceKm, platformFee: fee });
  const session = await mongoose.startSession(); try { let order; await session.withTransaction(async () => { for (const item of items) { const updated = await Product.findOneAndUpdate({ _id: item.productRef, stock: { $gte: item.qty } }, { $inc: { stock: -item.qty } }, { new: true, session }); if (!updated) throw Object.assign(new Error(`${item.name} is out of stock.`), { status: 409, expose: true }); } order = await Order.create([{ orderNo: `JOR-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`, userRef: user._id, vendorRef: vendor._id, items: pricing.items, address: input.address, pricing, paymentMethod: input.paymentMethod || 'cod', statusHistory: [{ status: 'placed', at: new Date(), by: user._id }] }], { session }); order = order[0]; }); return order; } finally { await session.endSession(); } }
export async function transitionOrder({ order, actor, status }) { if (!(transitions[order.status] || []).includes(status)) throw Object.assign(new Error('This status transition is not allowed.'), { status: 409, expose: true }); order.status = status; order.statusHistory.push({ status, at: new Date(), by: actor._id }); if (status === 'delivered') order.deliveredAt = new Date(); await order.save(); if (status === 'delivered' && order.partnerRef) { const partner = await Partner.findById(order.partnerRef); if (partner) { const earning = order.pricing.deliveryCharge; await Earning.findOneAndUpdate({ orderRef: order._id }, { $setOnInsert: { partnerRef: partner._id, orderRef: order._id, productAmount: order.pricing.itemsTotal, deliveryDistanceKm: order.pricing.deliveryDistanceKm, deliveryEarning: earning, total: earning } }, { upsert: true, new: true }); await Partner.updateOne({ _id: partner._id }, { $inc: { earningsTotal: earning }, $set: { activeOrderId: null } }); } } return order; }
export async function assignPartner({ order, partnerId, actor }) {
  const session = await mongoose.startSession();
  try {
    let updated;
    await session.withTransaction(async () => {
      const partner = await Partner.findOne({ _id: partnerId, status: 'approved', isOnline: true, activeOrderId: null }).session(session);
      if (!partner) throw Object.assign(new Error('This partner is no longer available.'), { status: 409, expose: true });
      updated = await Order.findOneAndUpdate(
        { _id: order._id, status: 'ready', partnerRef: null },
        { $set: { partnerRef: partner._id, assignedAt: new Date(), status: 'partner_assigned' }, $push: { statusHistory: { status: 'partner_assigned', at: new Date(), by: actor._id } } },
        { new: true, session }
      );
      if (!updated) throw Object.assign(new Error('This order was changed by another action.'), { status: 409, expose: true });
      const claim = await Partner.updateOne({ _id: partner._id, activeOrderId: null }, { $set: { activeOrderId: updated._id } }, { session });
      if (claim.modifiedCount !== 1) throw Object.assign(new Error('This partner accepted another order.'), { status: 409, expose: true });
    });
    return updated;
  } finally { await session.endSession(); }
}
