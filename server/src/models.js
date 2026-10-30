import mongoose from 'mongoose';

const { Schema, model } = mongoose;
const timestamps = { createdAt: 'createdAt', updatedAt: 'updatedAt' };

const userSchema = new Schema({
  name: { type: String, trim: true, default: '' },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  phone: { type: String, trim: true, default: '' },
  role: { type: String, enum: ['customer', 'vendor', 'partner', 'admin'], required: true },
  active: { type: Boolean, default: true }
}, timestamps);

const shopSchema = new Schema({
  vendorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  category: { type: String, default: '' },
  image: { type: String, default: '' },
  banner: { type: String, default: '' },
  address: { type: String, default: '' },
  phone: { type: String, default: '' },
  location: { lat: Number, lng: Number },
  isOpen: { type: Boolean, default: true },
  active: { type: Boolean, default: true },
  rating: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 0 }
}, timestamps);

const productSchema = new Schema({
  shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
  name: { type: String, required: true, trim: true },
  category: { type: String, default: '' },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  active: { type: Boolean, default: true }
}, timestamps);

const orderSchema = new Schema({
  customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  vendorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
  shopName: { type: String, required: true },
  items: [{ productId: Schema.Types.ObjectId, name: String, category: String, image: String, price: Number, qty: Number }],
  productAmount: { type: Number, required: true },
  deliveryCharge: { type: Number, required: true },
  productTax: { type: Number, required: true, default: 0 },
  total: { type: Number, required: true },
  deliveryAddress: { type: String, required: true },
  deliveryLocation: { lat: Number, lng: Number },
  pincode: { type: String, default: '' },
  phone: { type: String, default: '' },
  paymentMethod: { type: String, default: 'cod' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  status: { type: String, enum: ['placed', 'accepted_by_vendor', 'preparing', 'ready', 'partner_assigned', 'picked_up', 'on_the_way', 'delivered', 'cancelled', 'rejected'], default: 'placed', index: true },
  partnerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  statusHistory: [{ status: String, at: Date, by: Schema.Types.ObjectId }]
}, timestamps);

export const User = model('User', userSchema);
export const Shop = model('Shop', shopSchema);
export const Product = model('Product', productSchema);
export const Order = model('Order', orderSchema);
