import Booking from '../models/Booking.js';
import Room from '../models/Room.js';
import User from '../models/User.js';
import { refundPayment } from './payments.js';

export const stats = async (_req, res) => {
  const today = new Date();
  const [rooms, users, bookings, revenueAgg, monthly, occupied] = await Promise.all([
    Room.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'guest' }),
    Booking.countDocuments(),
    Booking.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$totalPrice' } } }]),
    Booking.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$paidAt' } }, revenue: { $sum: '$totalPrice' }, count: { $sum: 1 } } },
      { $sort: { _id: -1 } }, { $limit: 6 },
    ]),
    Booking.countDocuments({ status: { $in: ['confirmed', 'checked_in'] }, checkIn: { $lte: today }, checkOut: { $gt: today } }),
  ]);
  const byStatus = await Booking.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]);
  res.json({
    rooms, users, bookings,
    revenue: revenueAgg[0]?.total || 0,
    occupancyRate: rooms ? Math.round((occupied / rooms) * 100) : 0,
    monthly: monthly.reverse(),
    byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.n])),
  });
};

export const allBookings = async (req, res) => {
  const q = req.query.status ? { status: req.query.status } : {};
  res.json(await Booking.find(q).populate('user', 'name email').populate('room', 'name number').sort('-createdAt'));
};

const FLOW = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['checked_in', 'cancelled'],
  checked_in: ['completed'],
};

export const updateBookingStatus = async (req, res) => {
  const b = await Booking.findById(req.params.id);
  if (!b) { res.status(404); throw new Error('Booking not found'); }
  const next = req.body.status;
  if (!FLOW[b.status]?.includes(next)) { res.status(400); throw new Error(`Cannot move ${b.status} to ${next}`); }
  b.status = next;
  if (next === 'cancelled' && b.paymentStatus === 'paid') { await refundPayment(b); b.paymentStatus = 'refunded'; }
  await b.save();
  res.json(b);
};

export const allUsers = async (_req, res) => res.json(await User.find().sort('-createdAt'));
