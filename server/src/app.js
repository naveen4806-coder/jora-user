import 'dotenv/config';
import http from 'node:http';
import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { Server } from 'socket.io';
import { z } from 'zod';
import { Order, Product, Shop, User } from './models.js';
import { publicUser, requireAuth, signToken } from './auth.js';

for (const key of ['MONGODB_URI', 'JWT_SECRET']) if (!process.env[key]) throw new Error(`${key} is required. Add it to server/.env.`);
const app = express();
const origins = (process.env.CLIENT_ORIGINS || 'http://localhost:5173').split(',').map(value => value.trim());
app.use(helmet()); app.use(cors({ origin: origins, credentials: false })); app.use(express.json({ limit: '1mb' })); app.use(morgan('dev'));
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: origins } });
io.on('connection', socket => socket.on('order:watch', orderId => socket.join(`order:${orderId}`)));
const asyncRoute = handler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

const credentials = z.object({ email: z.string().email(), password: z.string().min(8), name: z.string().trim().min(2).max(80).optional(), phone: z.string().trim().max(20).optional() });
app.post('/api/auth/register', asyncRoute(async (req, res) => {
  const input = credentials.parse(req.body);
  const exists = await User.exists({ email: input.email.toLowerCase() });
  if (exists) return res.status(409).json({ code: 'auth/email-already-in-use', message: 'An account already exists for this email.' });
  const user = await User.create({ name: input.name || '', email: input.email, phone: input.phone || '', passwordHash: await bcrypt.hash(input.password, 12), role: 'customer' });
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
}));
app.post('/api/auth/login', asyncRoute(async (req, res) => {
  const input = credentials.pick({ email: true, password: true }).parse(req.body);
  const user = await User.findOne({ email: input.email.toLowerCase() }).select('+passwordHash');
  if (!user || !user.active || !(await bcrypt.compare(input.password, user.passwordHash))) return res.status(401).json({ code: 'auth/invalid-credential', message: 'Incorrect email or password.' });
  res.json({ token: signToken(user), user: publicUser(user) });
}));
app.get('/api/auth/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));
app.patch('/api/auth/me', requireAuth, asyncRoute(async (req, res) => {
  ['name', 'phone'].forEach(key => { if (typeof req.body[key] === 'string') req.user[key] = req.body[key].trim(); });
  await req.user.save(); res.json({ user: publicUser(req.user) });
}));

app.get('/api/catalog/shops', asyncRoute(async (req, res) => res.json({ items: await Shop.find({ active: true }).lean() })));
app.get('/api/catalog/products', asyncRoute(async (req, res) => {
  const filter = { active: true }; if (req.query.shopId) filter.shopId = req.query.shopId;
  res.json({ items: await Product.find(filter).lean() });
}));
app.get('/api/orders/me', requireAuth, asyncRoute(async (req, res) => res.json({ items: await Order.find({ customerId: req.user._id }).sort({ createdAt: -1 }).lean() })));
app.get('/api/orders/:id', requireAuth, asyncRoute(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, customerId: req.user._id }).lean();
  if (!order) return res.status(404).json({ message: 'Order not found.' }); res.json({ order });
}));
app.post('/api/orders', requireAuth, asyncRoute(async (req, res) => {
  const input = z.object({ shopId: z.string(), items: z.array(z.object({ productId: z.string(), qty: z.coerce.number().int().min(1).max(50) })).min(1), deliveryAddress: z.string().min(5), phone: z.string().min(8), deliveryLat: z.coerce.number().optional(), deliveryLng: z.coerce.number().optional(), pincode: z.string().optional(), paymentMethod: z.string().optional() }).parse(req.body);
  const shop = await Shop.findById(input.shopId); if (!shop || !shop.active || !shop.isOpen) return res.status(400).json({ message: 'This shop is unavailable.' });
  const ids = input.items.map(item => item.productId); const products = await Product.find({ _id: { $in: ids }, shopId: shop._id, active: true });
  if (products.length !== input.items.length) return res.status(400).json({ message: 'One or more products are unavailable.' });
  const lines = input.items.map(item => { const product = products.find(value => String(value._id) === item.productId); if (product.stock < item.qty) throw new Error(`${product.name} does not have enough stock.`); return { productId: product._id, name: product.name, category: product.category, image: product.image, price: product.price, qty: item.qty }; });
  const productAmount = lines.reduce((sum, item) => sum + item.price * item.qty, 0); const deliveryCharge = Number(shop.deliveryFee || 0); const productTax = 0;
  const order = await Order.create({ customerId: req.user._id, vendorId: shop.vendorId, shopId: shop._id, shopName: shop.name, items: lines, productAmount, deliveryCharge, productTax, total: productAmount + deliveryCharge + productTax, deliveryAddress: input.deliveryAddress, deliveryLocation: { lat: input.deliveryLat, lng: input.deliveryLng }, pincode: input.pincode || '', phone: input.phone, paymentMethod: input.paymentMethod || 'cod', statusHistory: [{ status: 'placed', at: new Date(), by: req.user._id }] });
  io.to(`order:${order._id}`).emit('order:updated', order); res.status(201).json({ order });
}));
app.patch('/api/orders/:id/cancel', requireAuth, asyncRoute(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, customerId: req.user._id });
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  if (order.status !== 'placed') return res.status(409).json({ message: 'This order can no longer be cancelled.' });
  order.status = 'cancelled'; order.statusHistory.push({ status: 'cancelled', at: new Date(), by: req.user._id }); await order.save(); io.to(`order:${order._id}`).emit('order:updated', order); res.json({ order });
}));
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use((error, _req, res, _next) => { console.error(error); const status = error instanceof z.ZodError ? 400 : 500; res.status(status).json({ message: status === 400 ? 'Please check the submitted details.' : (error.message || 'Server error.') }); });

await mongoose.connect(process.env.MONGODB_URI);
server.listen(process.env.PORT || 4000, () => console.log(`Jora Mongo API listening on ${process.env.PORT || 4000}`));
