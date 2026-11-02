import mongoose from 'mongoose';

const { Schema, model } = mongoose;
const timestamps = { createdAt: 'createdAt', updatedAt: 'updatedAt' };
const point = { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], default: undefined } };
const address = { label: String, text: { type: String, trim: true }, pincode: String, location: point };

const userSchema = new Schema({
  name: { type: String, trim: true, required: true }, email: { type: String, trim: true, lowercase: true, unique: true, required: true },
  phone: { type: String, trim: true, default: '' }, passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['user', 'vendor', 'partner', 'admin'], default: 'user', index: true },
  status: { type: String, enum: ['active', 'blocked'], default: 'active' }, addresses: [address], avatarUrl: { type: String, default: '' }
}, timestamps);

const vendorSchema = new Schema({
  userRef: { type: Schema.Types.ObjectId, ref: 'User', unique: true, required: true }, ownerName: String, phone: String, email: String,
  status: { type: String, enum: ['pending', 'approved', 'blocked'], default: 'pending', index: true },
  shop: { name: String, category: String, description: String, logo: String, banner: String, address: String, pincode: String,
    location: point, openingHours: String, gstNumber: String, fssaiNumber: String, bankDetails: { accountName: String, accountNumber: String, ifsc: String }, isOpen: { type: Boolean, default: true } }
}, timestamps);
vendorSchema.index({ 'shop.location': '2dsphere' });

const productSchema = new Schema({
  vendorRef: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true }, shopRef: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
  name: { type: String, required: true, trim: true }, description: String, images: [String], category: String,
  price: { type: Number, required: true, min: 0 }, stock: { type: Number, required: true, min: 0 }, isAvailable: { type: Boolean, default: true }, hsnCode: String
}, timestamps);
productSchema.index({ vendorRef: 1, isAvailable: 1 });

const taxConfigSchema = new Schema({ productRef: { type: Schema.Types.ObjectId, ref: 'Product', default: null }, category: { type: String, default: '' }, gstPercent: { type: Number, min: 0, max: 100, required: true }, setByAdmin: { type: Schema.Types.ObjectId, ref: 'User', required: true } }, timestamps);
taxConfigSchema.index({ productRef: 1 }, { unique: true, partialFilterExpression: { productRef: { $type: 'objectId' } } });
const platformFeeSchema = new Schema({ type: { type: String, enum: ['flat', 'percent'], default: 'flat' }, value: { type: Number, default: 0, min: 0 }, updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }, sourceRole: { type: String, enum: ['vendor', 'admin'], required: true } }, timestamps);
const cartSchema = new Schema({ userRef: { type: Schema.Types.ObjectId, ref: 'User', unique: true, required: true }, vendorRef: { type: Schema.Types.ObjectId, ref: 'Vendor', default: null }, items: [{ productRef: { type: Schema.Types.ObjectId, ref: 'Product', required: true }, qty: { type: Number, min: 1, required: true } }] }, timestamps);

const orderSchema = new Schema({
  orderNo: { type: String, unique: true, index: true }, userRef: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, vendorRef: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
  items: [{ productRef: Schema.Types.ObjectId, name: String, price: Number, qty: Number, gstPercent: Number, gstAmount: Number, image: String }],
  address: address,
  pricing: { itemsTotal: Number, gstTotal: Number, platformFee: Number, deliveryDistanceKm: Number, deliveryCharge: Number, grandTotal: Number },
  status: { type: String, enum: ['placed', 'accepted_by_vendor', 'preparing', 'ready', 'partner_assigned', 'partner_accepted', 'picked_up', 'on_the_way', 'delivered', 'cancelled', 'rejected'], default: 'placed', index: true },
  statusHistory: [{ status: String, at: Date, by: { type: Schema.Types.ObjectId, ref: 'User' } }], partnerRef: { type: Schema.Types.ObjectId, ref: 'Partner', default: null }, assignedAt: Date, deliveredAt: Date,
  paymentMethod: { type: String, enum: ['cod', 'online'], default: 'cod' }, paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' }
}, timestamps);
orderSchema.index({ vendorRef: 1, status: 1, createdAt: -1 });

const partnerSchema = new Schema({ userRef: { type: Schema.Types.ObjectId, ref: 'User', unique: true, required: true }, name: String, phone: String, vehicle: String, documents: [String], status: { type: String, enum: ['pending', 'approved', 'blocked'], default: 'pending' }, isOnline: { type: Boolean, default: false }, currentLocation: point, accuracy: Number, heading: Number, speed: Number, locationUpdatedAt: Date, workingArea: { center: point, radiusKm: { type: Number, default: 2 }, polygon: [[Number]] }, slots: [{ name: String, startsAt: Date, endsAt: Date, booked: Boolean }], activeOrderId: { type: Schema.Types.ObjectId, ref: 'Order', default: null }, earningsTotal: { type: Number, default: 0 } }, timestamps);
partnerSchema.index({ currentLocation: '2dsphere' });

const earningSchema = new Schema({ partnerRef: { type: Schema.Types.ObjectId, ref: 'Partner', required: true, index: true }, orderRef: { type: Schema.Types.ObjectId, ref: 'Order', required: true, unique: true }, productAmount: Number, deliveryDistanceKm: Number, ratePerKm: { type: Number, default: 10 }, deliveryEarning: Number, total: Number, at: { type: Date, default: Date.now } }, timestamps);
const complaintSchema = new Schema({ raisedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }, role: { type: String, enum: ['user', 'vendor', 'partner'], required: true }, orderRef: { type: Schema.Types.ObjectId, ref: 'Order', default: null }, subject: String, message: String, attachments: [String], status: { type: String, enum: ['open', 'in-progress', 'resolved'], default: 'open' }, replies: [{ by: Schema.Types.ObjectId, role: String, message: String, at: Date }] }, timestamps);
const bannerSchema = new Schema({ title: String, image: String, link: String, active: { type: Boolean, default: true }, startAt: Date, endAt: Date, order: { type: Number, default: 0 } }, timestamps);
const notificationSchema = new Schema({ title: String, body: String, audience: { type: String, enum: ['all', 'users', 'vendors', 'partners', 'specific'], required: true }, targetRef: { type: Schema.Types.ObjectId, ref: 'User', default: null }, readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }] }, timestamps);
const locationLogSchema = new Schema({ orderRef: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true }, partnerRef: { type: Schema.Types.ObjectId, ref: 'Partner', required: true }, point: point, accuracy: Number, speed: Number, heading: Number, at: { type: Date, default: Date.now, expires: 2592000 } });
const refreshTokenSchema = new Schema({ userRef: { type: Schema.Types.ObjectId, ref: 'User', required: true }, tokenHash: { type: String, required: true }, expiresAt: { type: Date, required: true, expires: 0 } }, timestamps);

export const User = model('User', userSchema); export const Vendor = model('Vendor', vendorSchema); export const Product = model('Product', productSchema); export const TaxConfig = model('TaxConfig', taxConfigSchema); export const PlatformFee = model('PlatformFee', platformFeeSchema); export const Cart = model('Cart', cartSchema); export const Order = model('Order', orderSchema); export const Partner = model('Partner', partnerSchema); export const Earning = model('Earning', earningSchema); export const Complaint = model('Complaint', complaintSchema); export const Banner = model('Banner', bannerSchema); export const Notification = model('Notification', notificationSchema); export const LocationLog = model('LocationLog', locationLogSchema); export const RefreshToken = model('RefreshToken', refreshTokenSchema);
