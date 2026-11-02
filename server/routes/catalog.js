import express from 'express'; import { asyncRoute } from '../middleware/errors.js'; import { Banner, Product, Vendor } from '../models/index.js';
const router = express.Router();
router.get('/shops', asyncRoute(async (_req, res) => { const items = await Vendor.find({ status: 'approved' }).select('-shop.bankDetails').lean(); res.json({ items }); }));
router.get('/products', asyncRoute(async (req, res) => { const filter = { isAvailable: true }; if (req.query.vendorId) filter.vendorRef = req.query.vendorId; const items = await Product.find(filter).lean(); res.json({ items }); }));
router.get('/banners', asyncRoute(async (_req, res) => { const now = new Date(); const items = await Banner.find({ active: true, $and: [{ $or: [{ startAt: null }, { startAt: { $lte: now } }] }, { $or: [{ endAt: null }, { endAt: { $gte: now } }] }] }).sort({ order: 1 }).lean(); res.json({ items }); }));
export default router;
